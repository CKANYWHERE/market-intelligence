// Cron: Breaking News Pipeline
// Schedule: every 30 minutes — vercel.json cron: "*/30 * * * *"
//
// Pipeline:
//   1. Finnhub /news 에서 최신 뉴스 최대 30건 수집
//   2. source_id 기준 dedup — 이미 저장된 건 건너뜀
//   3. Claude Haiku에 10건씩 배치 전송 → HIGH / MEDIUM / LOW 분류
//      (ANTHROPIC_API_KEY 없으면 키워드 기반 fallback 분류기 사용)
//   4. 전체 결과를 breaking_events에 upsert
//   5. HIGH인 항목만 is_displayed = true
//
// 직접 실행:
//   curl http://localhost:3000/api/cron/breaking-news

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getMarketNews } from '@/lib/api/finnhub';
import { classifyNews, fallbackClassify } from '@/lib/batch/classify-news';

// Vercel 함수 최대 실행 시간 (Hobby: 60s, Pro: 300s)
export const maxDuration = 60;

type RawNews = Record<string, unknown>;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

async function runPipeline(log: string[], startedAt: number): Promise<NextResponse> {
  // ── Step 1: 뉴스 수집 ──────────────────────────────────────
  log.push('▶ Step 1: Fetching news from Finnhub...');
  const raw = (await getMarketNews()) as RawNews[];
  const allItems = (raw ?? []).slice(0, 30);
  log.push(`  ✓ Fetched ${allItems.length} items`);

  // ── Step 2: Dedup ──────────────────────────────────────────
  log.push('▶ Step 2: Deduplicating against DB...');
  const sourceIds = allItems.map((item) => String(item.id));
  const existing = await db.breakingEvent.findMany({
    where:  { source_id: { in: sourceIds } },
    select: { source_id: true },
  });
  const existingSet = new Set(existing.map((e) => e.source_id));
  const newItems = allItems.filter((item) => !existingSet.has(String(item.id)));
  log.push(`  ✓ ${existingSet.size} already in DB, ${newItems.length} new`);

  if (newItems.length === 0) {
    return NextResponse.json({
      ok: true, newItems: 0, highItems: 0, log,
      durationMs: Date.now() - startedAt,
    });
  }

  // ── Step 3: AI 분류 ────────────────────────────────────────
  log.push('▶ Step 3: Classifying...');
  const newsInputs = newItems.map((item) => ({
    id:       String(item.id),
    headline: String(item.headline ?? ''),
    summary:  item.summary ? String(item.summary) : undefined,
  }));

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const classified = hasApiKey
    ? await (async () => {
        const batches: typeof newsInputs[] = [];
        for (let i = 0; i < newsInputs.length; i += 10) {
          batches.push(newsInputs.slice(i, i + 10));
        }
        const batchResults = await Promise.all(
          batches.map((batch, idx) =>
            classifyNews(batch).then((res) => {
              log.push(`  ✓ Batch ${idx + 1}: ${batch.length} items classified`);
              return res;
            })
          )
        );
        return batchResults.flat();
      })()
    : (() => {
        log.push('  ⚠ No ANTHROPIC_API_KEY — using keyword fallback');
        return newsInputs.map(fallbackClassify);
      })();

  const highCount = classified.filter((c) => c.classification === 'HIGH').length;
  const medCount  = classified.filter((c) => c.classification === 'MEDIUM').length;
  const lowCount  = classified.filter((c) => c.classification === 'LOW').length;
  log.push(`  ✓ HIGH=${highCount} MEDIUM=${medCount} LOW=${lowCount}`);

  // ── Step 4+5: Prisma upsert ────────────────────────────────
  log.push('▶ Step 4: Upserting into breaking_events...');
  const now = new Date();

  await db.$transaction(
    classified.map((item) => {
      const rawItem = newItems.find((r) => String(r.id) === item.id)!;
      const isHigh  = item.classification === 'HIGH';

      return db.breakingEvent.upsert({
        where: { source_id: item.id },
        create: {
          source_id:         item.id,
          headline:          item.headline,
          summary:           item.summary ?? null,
          url:               String(rawItem.url ?? ''),
          image_url:         rawItem.image ? String(rawItem.image) : null,
          source:            'Finnhub',
          published_at:      new Date(Number(rawItem.datetime) * 1000),
          ai_classification: item.classification,
          ai_reason:         item.reason,
          ai_classified_at:  now,
          is_displayed:      isHigh,
        },
        update: {
          ai_classification: item.classification,
          ai_reason:         item.reason,
          ai_classified_at:  now,
          is_displayed:      isHigh,
        },
      });
    }),
  );

  log.push(`  ✓ Upserted ${classified.length} rows → ${highCount} displayed`);

  return NextResponse.json({
    ok:           true,
    newItems:     classified.length,
    highItems:    highCount,
    usedFallback: !hasApiKey,
    log,
    durationMs:   Date.now() - startedAt,
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const log: string[] = [];

  try {
    return await withTimeout(runPipeline(log, startedAt), 50_000);
  } catch (err) {
    console.error('[cron/breaking-news]', err);
    return NextResponse.json({ ok: false, error: String(err), log, durationMs: Date.now() - startedAt }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

// Cron: FRED Indicator Update
// Schedule: 09:00 ET every weekday — vercel.json cron: "0 13 * * 1-5" (UTC)
//
// 직접 실행:
//   curl http://localhost:3000/api/cron/fred-update

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getFredSeries } from '@/lib/api/fred';

export const maxDuration = 60;

const SERIES_CONFIG = [
  { seriesId: 'CPIAUCSL', titleKeyword: 'CPI' },
  { seriesId: 'CPILFESL', titleKeyword: 'Core CPI' },
  { seriesId: 'PPIACO',   titleKeyword: 'PPI' },
  { seriesId: 'PCEPI',    titleKeyword: 'PCE' },
  { seriesId: 'PCEPILFE', titleKeyword: 'Core PCE' },
  { seriesId: 'PAYEMS',   titleKeyword: 'Nonfarm Payroll' },
  { seriesId: 'UNRATE',   titleKeyword: 'Unemployment Rate' },
  { seriesId: 'JTSJOL',   titleKeyword: 'JOLTS' },
  { seriesId: 'ICSA',     titleKeyword: 'Jobless Claims' },
  { seriesId: 'RSXFS',    titleKeyword: 'Retail Sales' },
  { seriesId: 'DGORDER',  titleKeyword: 'Durable Goods' },
  { seriesId: 'MICH',     titleKeyword: 'Michigan Consumer Sentiment' },
] as const;

type FredObs = { date: string; value: string };

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// 전체 작업에 타임아웃을 걸어서 300초 hang 방지
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

async function runUpdate(log: string[], startedAt: number) {
  const t = (label: string) => log.push(`[${Date.now() - startedAt}ms] ${label}`);
  const results: Record<string, {
    snapshots: number;
    eventUpdated: boolean;
    latestValue?: number;
    latestDate?: string;
  }> = {};

  // ── Step 1: FRED API fetch (순차)
  t('▶ Step1 start: FRED fetch sequential');
  const fetchResults: PromiseSettledResult<{ date: string; value: string }[]>[] = [];
  for (const { seriesId } of SERIES_CONFIG) {
    const result = await getFredSeries(seriesId, 1)
      .then((v) => ({ status: 'fulfilled' as const, value: v }))
      .catch((e) => ({ status: 'rejected' as const, reason: e }));
    fetchResults.push(result);
    await new Promise((r) => setTimeout(r, 300));
  }
  t('✓ Step1 done');

  // ── Step 2: 파싱
  type SnapshotRow = { seriesId: string; date: string; value: number };
  const allRows: SnapshotRow[] = [];

  for (let i = 0; i < SERIES_CONFIG.length; i++) {
    const { seriesId } = SERIES_CONFIG[i];
    const result = fetchResults[i];
    if (result.status === 'rejected') {
      log.push(`  ✗ ${seriesId}: ${String(result.reason)}`);
      results[seriesId] = { snapshots: 0, eventUpdated: false };
      continue;
    }
    const obs = result.value as FredObs[];
    const latest = obs.find((o) => o.value !== '.' && o.value !== '');
    if (!latest) {
      results[seriesId] = { snapshots: 0, eventUpdated: false };
      continue;
    }
    const value = parseFloat(latest.value);
    if (!isNaN(value)) {
      allRows.push({ seriesId, date: latest.date, value });
      results[seriesId] = { snapshots: 1, eventUpdated: false, latestValue: value, latestDate: latest.date };
    }
  }

  // ── Step 3: DB snapshot
  t('▶ Step3 start: DB createMany');
  if (allRows.length > 0) {
    await db.fredSnapshot.createMany({
      data: allRows.map(({ seriesId, date, value }) => ({
        series_id: seriesId,
        date:      new Date(`${date}T00:00:00Z`),
        value,
      })),
      skipDuplicates: true,
    });
  }
  t(`✓ Step3 done: ${allRows.length} snapshots`);

  // ── Step 4: actual 업데이트
  // FRED는 참조기간(reference period) 기준 날짜를 반환 (예: 4월 CPI → 2026-04-01)
  // DB economic_events는 실제 발표일(release date) 기준 (예: 6월 9일 발표)
  // → 날짜 직접 매칭 불가. 참조일 이후 90일 이내에서 가장 가까운 미래 이벤트를 찾아 업데이트
  t('▶ Step4 start: DB updateMany');
  let updatedEvents = 0;
  await Promise.all(
    allRows.map(async ({ seriesId, date, value }) => {
      const { titleKeyword } = SERIES_CONFIG.find((s) => s.seriesId === seriesId)!;
      const refDate = new Date(`${date}T00:00:00Z`);
      const windowEnd = new Date(refDate);
      windowEnd.setDate(windowEnd.getDate() + 90);

      // 참조기간 이후 90일 이내의 가장 이른 actual=null 이벤트를 찾아 업데이트
      const event = await db.economicEvent.findFirst({
        where: {
          title: { contains: titleKeyword, mode: 'insensitive' },
          actual: null,
          date: { gt: refDate, lte: windowEnd },
        },
        orderBy: { date: 'asc' },
      });
      if (event) {
        await db.economicEvent.update({ where: { id: event.id }, data: { actual: value } });
        updatedEvents++;
        log.push(`  ✓ actual updated: "${titleKeyword}" ref=${date} → release=${event.date.toISOString().slice(0, 10)} value=${value}`);
        results[seriesId].eventUpdated = true;
      }
    }),
  );
  t(`✓ Step4 done: ${updatedEvents} events updated`);

  return { results, updatedEvents, totalSnapshots: allRows.length };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.FRED_API_KEY) {
    return NextResponse.json({ ok: false, error: 'FRED_API_KEY not set' }, { status: 400 });
  }

  const startedAt = Date.now();
  const log: string[] = [];

  try {
    // 전체 작업을 40초 안에 강제 종료 — Vercel 60s limit 대비 20s 버퍼 확보
    const { results, updatedEvents, totalSnapshots } = await withTimeout(
      runUpdate(log, startedAt),
      40_000,
    );

    log.push(`▶ Total — ${totalSnapshots} snapshots, ${updatedEvents} events updated`);
    return NextResponse.json({ ok: true, results, log, durationMs: Date.now() - startedAt });

  } catch (err) {
    const msg = String(err);
    log.push(`✗ ${msg}`);
    console.error('[cron/fred-update]', err);
    return NextResponse.json({ ok: false, error: msg, log, durationMs: Date.now() - startedAt });

  } finally {
    // await 하지 않음 — disconnect 대기 중 hang이 발생해 60s 초과 504를 유발했음
    db.$disconnect().catch(() => {});
  }
}

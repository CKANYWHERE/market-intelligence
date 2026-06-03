// GET /api/cron/weekly-digest
// 매일 실행 — 이번 주 데이터가 없을 때만 생성 (idempotent)

import { NextRequest, NextResponse } from 'next/server';
import { getWeekStart, generateWeeklyDigest } from '@/lib/batch/generate-weekly-digest';
import { db } from '@/lib/batch/db';

export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const weekStart = getWeekStart();

    // 이미 이번 주 데이터가 있으면 skip
    const existing = await db.weeklyDigest.findUnique({
      where: { week_start: weekStart },
    });

    if (existing) {
      return NextResponse.json({
        ok:         true,
        skipped:    true,
        weekStart:  weekStart.toISOString().slice(0, 10),
        itemCount:  (existing.items as unknown[]).length,
        durationMs: Date.now() - startedAt,
      });
    }

    const items = await generateWeeklyDigest(weekStart);

    await db.weeklyDigest.upsert({
      where:  { week_start: weekStart },
      create: { week_start: weekStart, items: items as object[] },
      update: { items: items as object[], generated_at: new Date() },
    });

    return NextResponse.json({
      ok:         true,
      skipped:    false,
      weekStart:  weekStart.toISOString().slice(0, 10),
      itemCount:  items.length,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error('[cron/weekly-digest]', err);
    return NextResponse.json(
      { ok: false, error: String(err), durationMs: Date.now() - startedAt },
      { status: 500 },
    );
  } finally {
    db.$disconnect().catch(() => {});
  }
}

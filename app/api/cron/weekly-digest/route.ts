// GET /api/cron/weekly-digest
// 매주 월요일 06:00 ET 실행 — 이번 주 Weekly Market Digest 생성 후 DB 저장

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

    const items = await generateWeeklyDigest(weekStart);

    await db.weeklyDigest.upsert({
      where:  { week_start: weekStart },
      create: { week_start: weekStart, items: items as object[] },
      update: { items: items as object[], generated_at: new Date() },
    });

    return NextResponse.json({
      ok:         true,
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

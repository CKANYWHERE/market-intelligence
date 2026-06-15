// Cron: Daily Calendar Refresh
// Schedule: 08:00 ET every weekday — vercel.json cron: "0 12 * * 1-5" (UTC)
//
// 직접 실행:
//   curl "http://localhost:3000/api/cron/daily-calendar"
//   curl "http://localhost:3000/api/cron/daily-calendar?from=2026-04-01&to=2026-05-31"

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { syncCalendar, syncAlphaVantageEarnings, syncActualEarnings } from '@/lib/batch/sync-calendar';

export const maxDuration = 60;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function defaultRange(daysAhead = 90, daysBehind = 30) {
  const from = new Date();
  from.setDate(from.getDate() - daysBehind); // 30일 전 → 과거 actual 업데이트 포함
  const to   = new Date();
  to.setDate(to.getDate() + daysAhead);
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp   = req.nextUrl.searchParams;
  const def  = defaultRange(90);
  const from = sp.get('from') ?? def.from;
  const to   = sp.get('to')   ?? def.to;

  try {
    const [result, avResult, actualResult] = await Promise.all([
      withTimeout(syncCalendar(from, to), 45_000),
      syncAlphaVantageEarnings().catch((e) => ({ count: 0, log: [`AV error: ${e}`] })),
      syncActualEarnings().catch((e) => ({ count: 0, log: [`actual error: ${e}`] })),
    ]);
    return NextResponse.json({
      ok: true,
      range: { from, to },
      ...result,
      av_earnings:     { count: avResult.count,    log: avResult.log },
      actual_earnings: { count: actualResult.count, log: actualResult.log },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron/daily-calendar]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

// Cron: Daily Calendar Refresh
// Schedule: 08:00 ET every weekday — vercel.json cron: "0 12 * * 1-5" (UTC)
//
// 직접 실행:
//   curl "http://localhost:3000/api/cron/daily-calendar"
//   curl "http://localhost:3000/api/cron/daily-calendar?from=2026-04-01&to=2026-05-31"

import { NextRequest, NextResponse } from 'next/server';
import { syncCalendar } from '@/lib/batch/sync-calendar';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function defaultRange(daysAhead = 90) {
  const from = new Date();
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

  try {
    const sp   = req.nextUrl.searchParams;
    const def  = defaultRange(90);
    const from = sp.get('from') ?? def.from;
    const to   = sp.get('to')   ?? def.to;

    const result = await syncCalendar(from, to);

    return NextResponse.json({ ok: true, range: { from, to }, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron/daily-calendar]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

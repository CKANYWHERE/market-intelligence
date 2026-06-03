// GET /api/admin/backfill-earnings
// Alpha Vantage 3개월치 실적 일정 즉시 채우기

import { NextRequest, NextResponse } from 'next/server';
import { syncAlphaVantageEarnings } from '@/lib/batch/sync-calendar';
import { db } from '@/lib/batch/db';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncAlphaVantageEarnings();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

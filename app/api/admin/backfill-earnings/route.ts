// GET /api/admin/backfill-earnings
// Alpha Vantage 3개월치 실적 일정 채우기 + Finnhub 중복 레코드 제거

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
    // 1. Finnhub earnings 레코드 삭제 (source_id가 av_ 로 시작하지 않는 것)
    const deleted = await db.earningsEvent.deleteMany({
      where: { source_id: { not: { startsWith: 'av_' } } },
    });

    // 2. Alpha Vantage로 채우기
    const result = await syncAlphaVantageEarnings();

    return NextResponse.json({ ok: true, deleted: deleted.count, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

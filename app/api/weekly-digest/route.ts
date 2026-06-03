// GET /api/weekly-digest
// 이번 주 digest 반환. 없으면 on-demand 생성 후 캐시.

import { NextResponse } from 'next/server';
import { getOrGenerateDigest, getWeekStart } from '@/lib/batch/generate-weekly-digest';
import { db } from '@/lib/batch/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getOrGenerateDigest();

    const weekStart = getWeekStart();
    const weekEnd   = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    return NextResponse.json(
      {
        weekStart: weekStart.toISOString().slice(0, 10),
        weekEnd:   weekEnd.toISOString().slice(0, 10),
        items,
      },
      { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' } },
    );
  } catch (err) {
    console.error('[weekly-digest]', err);
    return NextResponse.json({ items: [], error: String(err) });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

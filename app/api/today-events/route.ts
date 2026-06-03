import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

export const revalidate = 300; // 5분 캐시

export async function GET() {
  try {
    const now   = new Date();
    const start = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`);
    const end   = new Date(`${now.toISOString().slice(0, 10)}T23:59:59Z`);

    const [ecoRows, earnRows] = await Promise.all([
      db.economicEvent.findMany({
        where:   { date: { gte: start, lte: end } },
        orderBy: { time: 'asc' },
        select:  { id: true, title: true, time: true, importance: true, category: true, actual: true, estimate: true },
      }),
      db.earningsEvent.findMany({
        where:   { date: { gte: start, lte: end } },
        orderBy: { symbol: 'asc' },
        select:  { id: true, symbol: true, company: true, hour: true, eps_estimate: true, eps_actual: true },
      }),
    ]);

    return NextResponse.json(
      { date: start.toISOString().slice(0, 10), eco: ecoRows, earnings: earnRows },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

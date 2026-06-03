// GET /api/scenario-data?indicator=CPI&symbols=NVDA,AAPL,QQQ,SPY
//
// Returns IndicatorReaction rows for the given indicator + symbols.
// ScenarioBar fetches this to overlay real data on top of static estimates.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

export const revalidate = 3600; // 1 hour cache

export async function GET(req: NextRequest) {
  const sp        = req.nextUrl.searchParams;
  const indicator = sp.get('indicator')?.toUpperCase();
  const symRaw    = sp.get('symbols');

  if (!indicator) {
    return NextResponse.json({ error: 'indicator required' }, { status: 400 });
  }

  const where: Record<string, unknown> = { indicator };
  if (symRaw) {
    where.symbol = { in: symRaw.split(',').map((s) => s.trim().toUpperCase()) };
  }

  try {
    const rows = await db.indicatorReaction.findMany({
      where,
      select: {
        symbol:       true,
        surprise_dir: true,
        avg_return:   true,
        p25_return:   true,
        p75_return:   true,
        sample_count: true,
      },
    });

    // Shape: { hot: { NVDA: { avg, p25, p75, n }, ... }, cool: { ... } }
    type StatRow = { avg: number; p25: number; p75: number; n: number };
    const result: { hot: Record<string, StatRow>; cool: Record<string, StatRow> } = { hot: {}, cool: {} };

    for (const row of rows) {
      const dir = row.surprise_dir as 'hot' | 'cool';
      result[dir][row.symbol] = {
        avg: row.avg_return,
        p25: row.p25_return,
        p75: row.p75_return,
        n:   row.sample_count,
      };
    }

    return NextResponse.json({ ok: true, indicator, data: result });
  } catch (err) {
    console.error('[scenario-data]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

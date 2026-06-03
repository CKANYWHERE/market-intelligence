// Admin: Backfill 2 years of stock price history
// One-time call: curl -H "Authorization: Bearer $CRON_SECRET" \
//   https://market-intelligence-87mm.vercel.app/api/admin/backfill-stock-prices
//
// Optional query params:
//   ?days=730   (default: 730)
//   ?symbols=NVDA,AAPL,MSFT  (default: all tracked symbols)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { backfillStockPrices, TRACKED_SYMBOLS } from '@/lib/batch/sync-stock-prices';

export const maxDuration = 300; // 5 minutes — large backfill

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp      = req.nextUrl.searchParams;
  const days    = parseInt(sp.get('days') ?? '730', 10);
  const symRaw  = sp.get('symbols');
  const symbols = symRaw ? symRaw.split(',').map((s) => s.trim().toUpperCase()) : TRACKED_SYMBOLS;

  try {
    const result = await backfillStockPrices(symbols, days);
    return NextResponse.json({ ok: true, days, symbolCount: symbols.length, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/backfill-stock-prices]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

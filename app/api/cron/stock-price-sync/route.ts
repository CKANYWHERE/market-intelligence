// Cron: Daily Stock Price Sync
// Schedule: 17:30 ET every weekday — "30 21 * * 1-5" (UTC)
//
// Fetches last 7 days of daily prices for all tracked symbols.
// Run via GitHub Actions (same pattern as other cron routes).

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { syncStockPrices } from '@/lib/batch/sync-stock-prices';

export const maxDuration = 60;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`Timeout ${ms}ms`)), ms))]);
}

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
    const result = await withTimeout(syncStockPrices(undefined, 3), 50_000);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron/stock-price-sync]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

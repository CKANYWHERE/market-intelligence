// Admin: Compute indicator reaction statistics
// Run after backfill-stock-prices to populate IndicatorReaction table.
// Rerun periodically (e.g. weekly) to incorporate new events.
//
// curl -H "Authorization: Bearer $CRON_SECRET" \
//   https://market-intelligence-87mm.vercel.app/api/admin/compute-reactions

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { computeIndicatorReactions } from '@/lib/batch/compute-indicator-reactions';

export const maxDuration = 300;

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
  const symRaw  = sp.get('symbols');
  const symbols = symRaw ? symRaw.split(',').map((s) => s.trim().toUpperCase()) : undefined;

  try {
    const result = await computeIndicatorReactions(symbols);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/compute-reactions]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

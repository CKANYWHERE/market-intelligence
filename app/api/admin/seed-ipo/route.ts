/**
 * 주요 IPO 시드 데이터 주입
 * GET /api/admin/seed-ipo
 *
 * Finnhub 무료 티어에는 없는 SpaceX / Anthropic / OpenAI IPO 등
 * 하드코딩 시드 데이터를 DB에 upsert 한다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

const SEED_IPOS = [
  {
    source_id:        'ipo_spacex_2026-06-12',
    symbol:           'SPCE2',
    company:          'SpaceX',
    date:             new Date('2026-06-12T00:00:00Z'),
    exchange:         'NASDAQ',
    status:           'expected' as const,
    price:            null,
    number_of_shares: null,
    total_shares_value: 1_750_000_000_000,
    nasdaq_fast_entry: true,
  },
  {
    source_id:        'ipo_anthropic_2026-10-01',
    symbol:           'ANTH',
    company:          'Anthropic',
    date:             new Date('2026-10-01T00:00:00Z'),
    exchange:         'NASDAQ',
    status:           'expected' as const,
    price:            null,
    number_of_shares: null,
    total_shares_value: 900_000_000_000,
    nasdaq_fast_entry: true,
  },
  {
    source_id:        'ipo_openai_2026-11-01',
    symbol:           'OAAI',
    company:          'OpenAI',
    date:             new Date('2026-11-01T00:00:00Z'),
    exchange:         'NASDAQ',
    status:           'expected' as const,
    price:            null,
    number_of_shares: null,
    total_shares_value: 1_000_000_000_000,
    nasdaq_fast_entry: true,
  },
];

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await Promise.all(
      SEED_IPOS.map((ipo) =>
        db.ipoEvent.upsert({
          where:  { source_id: ipo.source_id },
          create: ipo,
          update: {
            status:             ipo.status,
            total_shares_value: ipo.total_shares_value,
            nasdaq_fast_entry:  ipo.nasdaq_fast_entry,
          },
        })
      )
    );

    return NextResponse.json({
      ok:      true,
      seeded:  results.length,
      companies: results.map((r) => r.company),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/seed-ipo]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

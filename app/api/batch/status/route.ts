/**
 * 배치 현황 확인 엔드포인트
 * GET /api/batch/status
 *
 * 각 테이블 row 수, 마지막 업데이트, 최신 샘플을 반환.
 * 배치 실행 후 결과를 빠르게 확인할 때 사용.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

// BigInt → Number 변환 (JSON.stringify는 BigInt를 직렬화 못함)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitize(obj: unknown): unknown {
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj))     return obj.map(sanitize);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
}

export async function GET() {
  try {
  const [
    ecoCount,
    ecoSample,
    earnCount,
    earnSample,
    ipoCount,
    ipoSample,
    breakingTotal,
    breakingHigh,
    breakingDisplayed,
    latestBreaking,
    fredCount,
    fredSample,
    latestQQQ,
    latestSPY,
    latestSCHD,
  ] = await Promise.all([
    db.economicEvent.count(),
    db.economicEvent.findMany({ orderBy: { date: 'desc' }, take: 3 }),

    db.earningsEvent.count(),
    db.earningsEvent.findMany({ orderBy: { date: 'desc' }, take: 3 }),

    db.ipoEvent.count(),
    db.ipoEvent.findMany({ orderBy: { date: 'asc' }, take: 3 }),

    db.breakingEvent.count(),
    db.breakingEvent.count({ where: { ai_classification: 'HIGH' } }),
    db.breakingEvent.count({ where: { is_displayed: true } }),
    db.breakingEvent.findMany({
      orderBy: { published_at: 'desc' },
      take: 3,
      select: {
        id: true, headline: true, source: true,
        ai_classification: true, is_displayed: true, published_at: true,
      },
    }),

    db.fredSnapshot.count(),
    db.fredSnapshot.findMany({ orderBy: { date: 'desc' }, take: 5 }),

    db.etfQuote.findFirst({ where: { symbol: 'QQQ' }, orderBy: { quoted_at: 'desc' } }),
    db.etfQuote.findFirst({ where: { symbol: 'SPY' }, orderBy: { quoted_at: 'desc' } }),
    db.etfQuote.findFirst({ where: { symbol: 'SCHD' }, orderBy: { quoted_at: 'desc' } }),
  ]);

  return NextResponse.json(sanitize({
    tables: {
      economic_events: {
        total:  ecoCount,
        sample: ecoSample,
      },
      earnings_events: {
        total:  earnCount,
        sample: earnSample,
      },
      ipo_events: {
        total:  ipoCount,
        sample: ipoSample,
      },
      breaking_events: {
        total:     breakingTotal,
        high:      breakingHigh,
        displayed: breakingDisplayed,
        sample:    latestBreaking,
      },
      fred_snapshots: {
        total:  fredCount,
        sample: fredSample,
      },
      etf_quotes: {
        latest: { QQQ: latestQQQ, SPY: latestSPY, SCHD: latestSCHD },
      },
    },
    cronEndpoints: {
      breaking_news:  'GET /api/cron/breaking-news',
      daily_calendar: 'GET /api/cron/daily-calendar',
      fred_update:    'GET /api/cron/fred-update  (FRED_API_KEY 필요)',
      quote_refresh:  'GET /api/cron/quote-refresh',
    },
  }) as object, {
    headers: { 'Cache-Control': 'no-store' },
  });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[batch/status]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

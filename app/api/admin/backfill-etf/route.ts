// POST /api/admin/backfill-etf
// ?reset=true  → 기존 etf_quotes 전체 삭제 후 재삽입
// ?reset=false → 기존 데이터 유지, 없는 날짜만 삽입 (기본값)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getEodCandles } from '@/lib/api/yahooFinance';

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'] as const;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reset = new URL(req.url).searchParams.get('reset') === 'true';
  const log: string[] = [];
  let totalInserted = 0;
  let totalSkipped  = 0;

  try {
    if (reset) {
      const { count } = await db.etfQuote.deleteMany({});
      log.push(`🗑 Deleted ${count} existing rows`);
    }

    for (const symbol of SYMBOLS) {
      const candles = await getEodCandles(symbol, 2);
      log.push(`${symbol}: ${candles.length} candles fetched from Yahoo Finance`);

      for (const c of candles) {
        const dayStart = new Date(`${c.date}T00:00:00-05:00`);
        const dayEnd   = new Date(`${c.date}T23:59:59-05:00`);

        if (!reset) {
          const existing = await db.etfQuote.findFirst({
            where: { symbol, quoted_at: { gte: dayStart, lte: dayEnd } },
          });
          if (existing) { totalSkipped++; continue; }
        }

        const change        = c.close - c.prevClose;
        const changePercent = c.prevClose ? (change / c.prevClose) * 100 : 0;

        await db.etfQuote.create({
          data: {
            symbol,
            price:          c.close,
            change,
            change_percent: changePercent,
            high:           c.high,
            low:            c.low,
            open:           c.open,
            prev_close:     c.prevClose,
            // ET 당일 장 마감 시각 기준
            quoted_at: new Date(`${c.date}T21:00:00Z`),
          },
        });
        totalInserted++;
      }

      log.push(`${symbol}: inserted=${totalInserted} skipped=${totalSkipped}`);
      totalInserted = 0;
      totalSkipped  = 0;
    }

    return NextResponse.json({ ok: true, log });
  } catch (err) {
    console.error('[backfill-etf]', err);
    return NextResponse.json({ ok: false, error: String(err), log }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

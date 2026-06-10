import { NextResponse } from 'next/server';
import { getRealtimeQuotes } from '@/lib/api/yahooFinance';
import { db } from '@/lib/batch/db';
import { QuoteData } from '@/types/events';

export const dynamic = 'force-dynamic';

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'];

/** ET 기준 오늘 날짜 YYYY-MM-DD */
function todayET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

export async function GET() {
  try {
    const [quotes, dbRows] = await Promise.all([
      getRealtimeQuotes(SYMBOLS),
      // 오늘 이전에 저장된 가장 최근 EOD 종가 (= 어제 정규장 종가)
      db.etfQuote.findMany({
        where: {
          symbol: { in: SYMBOLS },
          quoted_at: { lt: new Date(`${todayET()}T00:00:00-05:00`) },
        },
        orderBy: { quoted_at: 'desc' },
        distinct: ['symbol'],
      }),
    ]);

    // symbol → DB 어제 종가 맵
    const prevCloseMap: Record<string, number> = {};
    for (const row of dbRows) {
      prevCloseMap[row.symbol] = row.price;
    }

    // 모든 상태에서 DB 어제 종가 기준으로 change% 계산
    // DB 없으면 regularClose(= Yahoo regularMarketPrice) fallback
    const result: Record<string, QuoteData> = {};
    for (const [symbol, q] of Object.entries(quotes)) {
      const changeBase    = prevCloseMap[symbol] ?? q.regularClose;
      const change        = q.current - changeBase;
      const changePercent = changeBase ? (change / changeBase) * 100 : 0;
      result[symbol] = { ...q, change, changePercent, prevClose: changeBase };
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[quote/route]', err);
    return NextResponse.json({}, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

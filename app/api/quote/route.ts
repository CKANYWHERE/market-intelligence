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

    // change% 재계산
    // PRE 상태: regularClose = meta.regularMarketPrice = 어제 정규장 종가 → 항상 정확, DB 무시
    // REGULAR:  DB 어제 종가 사용 (장 중엔 regularMarketPrice가 현재가라 사용 불가)
    // POST/CLOSED: DB 어제 종가 사용, 없으면 regularClose fallback
    const result: Record<string, QuoteData> = {};
    for (const [symbol, q] of Object.entries(quotes)) {
      const changeBase = q.marketState === 'PRE'
        ? q.regularClose
        : (prevCloseMap[symbol] ?? q.regularClose);
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

import { NextResponse } from 'next/server';
import { getQuote } from '@/lib/api/finnhub';
import { db } from '@/lib/batch/db';
import { QuoteData } from '@/types/events';

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'];
type FinnhubQuote = { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number };

export async function GET() {
  const results: Record<string, QuoteData> = {};

  // ── 1. DB 캐시 우선 (30분 이내 데이터) ───────────────────────
  await Promise.allSettled(
    SYMBOLS.map(async (symbol) => {
      const row = await db.etfQuote.findFirst({
        where:   { symbol },
        orderBy: { quoted_at: 'desc' },
      });

      if (row) {
        const ageMs = Date.now() - new Date(row.quoted_at as string | Date).getTime();
        if (ageMs < 30 * 60 * 1000) {
          results[symbol] = {
            symbol,
            current:       row.price as number,
            change:        row.change as number,
            changePercent: row.change_percent as number,
            high:          row.high as number,
            low:           row.low as number,
            open:          row.open as number,
            prevClose:     row.prev_close as number,
          };
        }
      }
    }),
  );

  // ── 2. 캐시 미스 심볼은 Finnhub 직접 호출 ───────────────────
  const missing = SYMBOLS.filter((s) => !results[s]);
  if (missing.length > 0) {
    await Promise.allSettled(
      missing.map(async (symbol) => {
        try {
          const data = (await getQuote(symbol)) as FinnhubQuote;
          results[symbol] = {
            symbol,
            current:       data.c,
            change:        data.d,
            changePercent: data.dp,
            high:          data.h,
            low:           data.l,
            open:          data.o,
            prevClose:     data.pc,
          };
        } catch (err) {
          console.error(`[quote/route] ${symbol}:`, err);
        }
      }),
    );
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}

/**
 * sync-stock-prices.ts
 * Fetches daily OHLC candle data from Finnhub for tracked symbols
 * and upserts into StockDailyPrice table.
 *
 * Finnhub /stock/candle returns arrays:
 *   { c, o, h, l, t, v, s }
 *   s = "ok" | "no_data"
 */

import { db } from './db';

// All tracked symbols — QQQ/SPY included for macro context
export const TRACKED_SYMBOLS = [
  // ETFs
  'QQQ', 'SPY',
  // Mega-cap tech
  'NVDA', 'AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA',
  // Semiconductors
  'AVGO', 'AMD', 'MU', 'QCOM', 'TXN', 'INTC', 'AMAT', 'LRCX', 'KLAC',
  'ASML', 'SNPS', 'CDNS', 'ON', 'MRVL', 'ARM',
  // Software / SaaS
  'ADBE', 'PANW', 'CRM', 'NOW', 'INTU', 'TEAM', 'WDAY', 'SNOW',
  'ZS', 'CRWD', 'DDOG', 'HUBS', 'TTD',
  // Consumer / E-commerce
  'COST', 'NFLX', 'ABNB', 'BKNG',
  // Fintech
  'PYPL', 'EBAY', 'COIN', 'HOOD',
  // Biotech / Pharma
  'AMGN', 'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'ISRG',
  // Other
  'ORCL', 'UBER', 'LYFT', 'PLTR', 'RBLX',
];

interface FinnhubCandle {
  c: number[];
  o: number[];
  h: number[];
  l: number[];
  t: number[];
  s: string;
}

async function fetchCandles(
  symbol: string,
  fromUnix: number,
  toUnix: number,
): Promise<FinnhubCandle | null> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) throw new Error('FINNHUB_API_KEY not set');

  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${fromUnix}&to=${toUnix}&token=${token}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    console.warn(`[sync-stock-prices] ${symbol}: HTTP ${res.status}`);
    return null;
  }
  const data: FinnhubCandle = await res.json();
  if (data.s !== 'ok') {
    console.warn(`[sync-stock-prices] ${symbol}: no_data`);
    return null;
  }
  return data;
}

export async function syncStockPrices(
  symbols: string[] = TRACKED_SYMBOLS,
  daysBack = 7,
): Promise<{ upserted: number; log: string[] }> {
  const log: string[] = [];
  let total = 0;

  const toDate   = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);

  const toUnix   = Math.floor(toDate.getTime()   / 1000);
  const fromUnix = Math.floor(fromDate.getTime() / 1000);

  // Throttle: 10 symbols at a time to avoid Finnhub rate limits
  for (let i = 0; i < symbols.length; i += 10) {
    const batch = symbols.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (symbol) => {
        const candle = await fetchCandles(symbol, fromUnix, toUnix);
        if (!candle) return 0;

        // Build upsert rows
        const rows = candle.t.map((ts, idx) => ({
          symbol,
          date:  new Date(ts * 1000),
          open:  candle.o[idx],
          close: candle.c[idx],
        }));

        let count = 0;
        for (const row of rows) {
          await db.stockDailyPrice.upsert({
            where:  { symbol_date: { symbol: row.symbol, date: row.date } },
            update: { open: row.open, close: row.close },
            create: row,
          });
          count++;
        }
        return count;
      }),
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === 'fulfilled') {
        total += r.value;
        log.push(`${batch[j]}: +${r.value}`);
      } else {
        log.push(`${batch[j]}: ERROR ${r.reason}`);
      }
    }

    // 300ms pause between batches — Finnhub free tier = 60 req/min
    if (i + 10 < symbols.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { upserted: total, log };
}

/**
 * Backfill: fetch up to 2 years of history for a list of symbols.
 * Called once manually via /api/admin/backfill-stock-prices.
 */
export async function backfillStockPrices(
  symbols: string[] = TRACKED_SYMBOLS,
  daysBack = 730,
): Promise<{ upserted: number; log: string[] }> {
  return syncStockPrices(symbols, daysBack);
}

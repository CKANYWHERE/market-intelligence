/**
 * sync-stock-prices.ts
 * Fetches daily OHLC candle data for tracked symbols and upserts into
 * StockDailyPrice table.
 *
 * NOTE: Finnhub's /stock/candle now returns 403 on the free plan
 * ("You don't have access to this resource") — switched to the Yahoo
 * Finance client already used for the ETF tracker (lib/api/yahooFinance.ts).
 */

import { db } from './db';
import { getEodCandles } from '../api/yahooFinance';

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

export async function syncStockPrices(
  symbols: string[] = TRACKED_SYMBOLS,
  daysBack = 7,
): Promise<{ upserted: number; log: string[] }> {
  const log: string[] = [];
  let total = 0;

  // Yahoo's chart API takes a `range` in months, not a day window
  const months = Math.max(1, Math.ceil(daysBack / 30) + 1);

  // Throttle: 10 symbols at a time to be polite to Yahoo's endpoint
  for (let i = 0; i < symbols.length; i += 10) {
    const batch = symbols.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (symbol) => {
        const candles = await getEodCandles(symbol, months);
        if (candles.length === 0) return 0;

        // EOD 데이터는 마감 후 바뀌지 않으므로 bulk insert + skipDuplicates로 충분
        // (개별 upsert N회 대신 라운드트립 1회 — Neon pooler 레이턴시 영향 최소화)
        const { count } = await db.stockDailyPrice.createMany({
          data: candles.map((c) => ({
            symbol,
            date:  new Date(`${c.date}T00:00:00Z`),
            open:  c.open,
            close: c.close,
          })),
          skipDuplicates: true,
        });
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

    // 300ms pause between batches
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

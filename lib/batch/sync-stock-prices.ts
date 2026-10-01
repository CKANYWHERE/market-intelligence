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

// 나스닥-100(QQQ 추종 지수) 전 종목 + QQQ/SPY(매크로 참고용 ETF).
// en.wikipedia.org/wiki/Nasdaq-100 직접 크롤링 후 티커 오류 교차검증
// (Astera Labs→ALAB, Lumentum→LITE, AppLovin→APP, CoreWeave→CRWV,
// Nebius→NBIS, Sandisk→SNDK, SpaceX→SPCX 로 정정 — 1차 크롤링 결과엔
// 잘못된 티커가 섞여 있었음). 편입/편출은 분기마다 바뀌므로 연 1~2회
// 점검 필요.
export const TRACKED_SYMBOLS = [
  // ETFs
  'QQQ', 'SPY',
  // Nasdaq-100 constituents (as of 2026-10, ticker-verified)
  'ADBE', 'ADP', 'AMD', 'ABNB', 'ALNY', 'GOOGL', 'AMZN', 'AEP', 'AMGN', 'ADI',
  'AAPL', 'AMAT', 'APP', 'ARM', 'ASML', 'ALAB', 'ADSK', 'AXON', 'BKR', 'BKNG',
  'AVGO', 'CDNS', 'CTAS', 'CSCO', 'CCEP', 'CMCSA', 'CEG', 'CPRT', 'CRWV', 'COST',
  'CRWD', 'CSX', 'DDOG', 'DXCM', 'FANG', 'DASH', 'EXC', 'FAST', 'FER', 'FTNT',
  'GEHC', 'GILD', 'HON', 'IDXX', 'INTC', 'INTU', 'ISRG', 'KDP', 'KLAC', 'LRCX',
  'LIN', 'LITE', 'MAR', 'MRVL', 'MELI', 'META', 'MCHP', 'MU', 'MSFT', 'MSTR',
  'MDLZ', 'MPWR', 'MNST', 'NBIS', 'NFLX', 'NVDA', 'NXPI', 'ORLY', 'ODFL', 'PCAR',
  'PLTR', 'PANW', 'PAYX', 'PYPL', 'PDD', 'PEP', 'QCOM', 'REGN', 'RKLB', 'ROP',
  'ROST', 'SNDK', 'STX', 'SHOP', 'SPCX', 'SBUX', 'SNPS', 'TMUS', 'TTWO', 'TER',
  'TSLA', 'TXN', 'TRI', 'VRTX', 'WMT', 'WBD', 'WDC', 'WDAY', 'XEL',
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

  await recomputeDayPct(symbols);

  return { upserted: total, log };
}

/**
 * day_pct(전일 종가 대비 등락률 %) 재계산 — 히트맵, indicator-reaction
 * 통계 둘 다 이 컬럼을 읽음. LAG() 윈도우 함수로 심볼별 전일 종가를 구해서
 * 한 번에 UPDATE (신규 삽입된 날짜뿐 아니라 그 다음 날짜의 day_pct도 바뀔
 * 수 있어서 — 해당 심볼 전체를 매번 재계산하는 게 안전함, 비용도 낮음).
 */
async function recomputeDayPct(symbols: string[]): Promise<void> {
  await db.$executeRawUnsafe(`
    UPDATE stock_daily_prices sdp
    SET day_pct = sub.pct
    FROM (
      SELECT id,
        CASE WHEN prev_close IS NULL OR prev_close = 0 THEN NULL
             ELSE (close - prev_close) / prev_close * 100 END AS pct
      FROM (
        SELECT id, close,
          LAG(close) OVER (PARTITION BY symbol ORDER BY date) AS prev_close
        FROM stock_daily_prices
        WHERE symbol = ANY($1::text[])
      ) w
    ) sub
    WHERE sdp.id = sub.id
  `, symbols);
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

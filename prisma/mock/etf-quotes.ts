/**
 * Mock data — etf_quotes table
 *
 * The hourly batch cron (09:30–16:00 ET) writes a new row for each ETF.
 * The API route reads the most recent row per symbol:
 *   SELECT DISTINCT ON (symbol) * FROM etf_quotes ORDER BY symbol, quoted_at DESC;
 */

export type MockEtfQuote = {
  id: string;
  symbol: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  open: number;
  prev_close: number;
  quoted_at: Date;
  fetched_at: Date;
};

export const mockEtfQuotes: MockEtfQuote[] = [
  {
    id: 'clx_etf_qqq_1',
    symbol: 'QQQ',
    price: 512.47,
    change: 8.23,
    change_percent: 1.63,
    high: 514.10,
    low: 506.88,
    open: 507.50,
    prev_close: 504.24,
    quoted_at: new Date('2026-05-27T20:00:00Z'), // 16:00 ET
    fetched_at: new Date('2026-05-27T20:01:15Z'),
  },
  {
    id: 'clx_etf_spy_1',
    symbol: 'SPY',
    price: 584.19,
    change: 5.72,
    change_percent: 0.99,
    high: 585.40,
    low: 579.21,
    open: 580.10,
    prev_close: 578.47,
    quoted_at: new Date('2026-05-27T20:00:00Z'),
    fetched_at: new Date('2026-05-27T20:01:15Z'),
  },
  {
    id: 'clx_etf_schd_1',
    symbol: 'SCHD',
    price: 27.34,
    change: -0.12,
    change_percent: -0.44,
    high: 27.51,
    low: 27.25,
    open: 27.45,
    prev_close: 27.46,
    quoted_at: new Date('2026-05-27T20:00:00Z'),
    fetched_at: new Date('2026-05-27T20:01:15Z'),
  },
];

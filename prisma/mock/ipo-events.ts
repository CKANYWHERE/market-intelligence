/**
 * Mock data — ipo_events table
 *
 * Mix of confirmed (SpaceX), high-probability (Anthropic), and speculative (OpenAI) IPOs.
 * The batch cron writes rows from Finnhub /calendar/ipo + SEC EDGAR S-1 RSS.
 *
 * `nasdaq_fast_entry = true` for any company that would rank top-40 by market cap
 * on the day of IPO — triggers a forced-buy cascade from QQQ/passive ETFs.
 */

export type MockIpoEvent = {
  id: string;
  source_id: string;
  symbol: string | null;
  company: string;
  date: Date;
  exchange: string | null;
  status: 'expected' | 'filed' | 'priced' | 'withdrawn';
  price: number | null;
  number_of_shares: bigint | null;
  total_shares_value: number | null;
  nasdaq_fast_entry: boolean;
  etf_inflow_estimate: number | null;
  created_at: Date;
  updated_at: Date;
};

export const mockIpoEvents: MockIpoEvent[] = [
  {
    id: 'clx_ipo_001',
    source_id: 'sec_s1_spacex_20260510',
    symbol: 'SPCE2',        // placeholder — final ticker TBD
    company: 'Space Exploration Technologies Corp. (SpaceX)',
    date: new Date('2026-06-12T00:00:00Z'),
    exchange: 'NASDAQ',
    status: 'priced',
    price: 185.00,
    number_of_shares: BigInt(270_270_270),  // ~$50B raise at $185
    total_shares_value: 50_000_000_000,
    nasdaq_fast_entry: true,
    // SpaceX $1.75T market cap → top-40 → 3× weight → QQQ forced buy estimate
    etf_inflow_estimate: 52_000_000_000,
    created_at: new Date('2026-05-10T08:00:00Z'),
    updated_at: new Date('2026-06-01T08:00:00Z'),
  },
  {
    id: 'clx_ipo_002',
    source_id: 'sec_s1_anthropic_20260615',
    symbol: 'ANTE',
    company: 'Anthropic PBC',
    date: new Date('2026-10-15T00:00:00Z'),
    exchange: 'NASDAQ',
    status: 'filed',
    price: null,
    number_of_shares: null,
    total_shares_value: null,
    nasdaq_fast_entry: true,
    // Anthropic $900B valuation → top-40 → estimated ETF inflow
    etf_inflow_estimate: 28_000_000_000,
    created_at: new Date('2026-05-15T08:00:00Z'),
    updated_at: new Date('2026-05-20T08:00:00Z'),
  },
  {
    id: 'clx_ipo_003',
    source_id: 'finnhub_ipo_openai_2026q4',
    symbol: 'OAIX',
    company: 'OpenAI Inc.',
    date: new Date('2026-12-01T00:00:00Z'), // speculative Q4 2026
    exchange: 'NASDAQ',
    status: 'expected',
    price: null,
    number_of_shares: null,
    total_shares_value: null,
    nasdaq_fast_entry: true,
    // OpenAI $1T valuation → top-40 → estimated ETF inflow
    etf_inflow_estimate: 32_000_000_000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-01T08:00:00Z'),
  },
  {
    id: 'clx_ipo_004',
    source_id: 'finnhub_ipo_stripe_2026',
    symbol: 'STRP',
    company: 'Stripe Inc.',
    date: new Date('2026-09-10T00:00:00Z'),
    exchange: 'NYSE',
    status: 'expected',
    price: null,
    number_of_shares: null,
    total_shares_value: null,
    nasdaq_fast_entry: false, // NYSE listing → not NASDAQ-100 eligible
    etf_inflow_estimate: null,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-01T08:00:00Z'),
  },
];

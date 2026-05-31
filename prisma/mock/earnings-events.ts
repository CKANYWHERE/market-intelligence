/**
 * Mock data — earnings_events table
 *
 * Reflects what the daily batch cron writes after calling Finnhub /calendar/earnings.
 * Covers top QQQ holdings for Q1 2026 earnings season (April–May).
 */

export type MockEarningsEvent = {
  id: string;
  source_id: string;
  symbol: string;
  company: string;
  date: Date;
  hour: 'bmo' | 'amc' | 'dmh' | null;
  quarter: number | null;
  year: number | null;
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null; // USD
  revenue_actual: number | null;   // USD
  created_at: Date;
  updated_at: Date;
};

export const mockEarningsEvents: MockEarningsEvent[] = [
  {
    id: 'clx_earn_001',
    source_id: 'finnhub_earn_AAPL_20260430',
    symbol: 'AAPL',
    company: 'Apple Inc.',
    date: new Date('2026-04-30T00:00:00Z'),
    hour: 'amc',
    quarter: 2,
    year: 2026,
    eps_estimate: 1.62,
    eps_actual: 1.71,    // beat by $0.09
    revenue_estimate: 95_200_000_000,
    revenue_actual: 97_800_000_000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-30T21:00:00Z'),
  },
  {
    id: 'clx_earn_002',
    source_id: 'finnhub_earn_MSFT_20260429',
    symbol: 'MSFT',
    company: 'Microsoft Corporation',
    date: new Date('2026-04-29T00:00:00Z'),
    hour: 'amc',
    quarter: 3,
    year: 2026,
    eps_estimate: 3.11,
    eps_actual: 3.24,
    revenue_estimate: 68_100_000_000,
    revenue_actual: 70_100_000_000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-29T21:00:00Z'),
  },
  {
    id: 'clx_earn_003',
    source_id: 'finnhub_earn_NVDA_20260527',
    symbol: 'NVDA',
    company: 'NVIDIA Corporation',
    date: new Date('2026-05-27T00:00:00Z'),
    hour: 'amc',
    quarter: 1,
    year: 2027, // NVDA fiscal year
    eps_estimate: 0.87,
    eps_actual: null,    // not yet released
    revenue_estimate: 43_500_000_000,
    revenue_actual: null,
    created_at: new Date('2026-05-01T08:00:00Z'),
    updated_at: new Date('2026-05-01T08:00:00Z'),
  },
  {
    id: 'clx_earn_004',
    source_id: 'finnhub_earn_GOOGL_20260428',
    symbol: 'GOOGL',
    company: 'Alphabet Inc.',
    date: new Date('2026-04-28T00:00:00Z'),
    hour: 'amc',
    quarter: 1,
    year: 2026,
    eps_estimate: 2.02,
    eps_actual: 2.14,
    revenue_estimate: 89_300_000_000,
    revenue_actual: 90_200_000_000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-28T21:00:00Z'),
  },
  {
    id: 'clx_earn_005',
    source_id: 'finnhub_earn_META_20260429',
    symbol: 'META',
    company: 'Meta Platforms Inc.',
    date: new Date('2026-04-29T00:00:00Z'),
    hour: 'amc',
    quarter: 1,
    year: 2026,
    eps_estimate: 5.22,
    eps_actual: 6.43,   // strong beat
    revenue_estimate: 41_300_000_000,
    revenue_actual: 42_300_000_000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-29T21:00:00Z'),
  },
  {
    id: 'clx_earn_006',
    source_id: 'finnhub_earn_AMZN_20260430',
    symbol: 'AMZN',
    company: 'Amazon.com Inc.',
    date: new Date('2026-04-30T00:00:00Z'),
    hour: 'amc',
    quarter: 1,
    year: 2026,
    eps_estimate: 1.35,
    eps_actual: 1.59,
    revenue_estimate: 155_200_000_000,
    revenue_actual: 155_700_000_000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-30T21:00:00Z'),
  },
  {
    id: 'clx_earn_007',
    source_id: 'finnhub_earn_TSLA_20260422',
    symbol: 'TSLA',
    company: 'Tesla Inc.',
    date: new Date('2026-04-22T00:00:00Z'),
    hour: 'amc',
    quarter: 1,
    year: 2026,
    eps_estimate: 0.51,
    eps_actual: 0.27,   // miss
    revenue_estimate: 21_400_000_000,
    revenue_actual: 19_300_000_000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    updated_at: new Date('2026-04-22T21:00:00Z'),
  },
];

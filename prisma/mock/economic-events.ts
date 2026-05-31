/**
 * Mock data — economic_events table
 *
 * These mirror the exact shape Prisma would return from `prisma.economicEvent.findMany()`.
 * The batch cron writes rows like these after calling Finnhub /calendar/economic.
 *
 * Covers a realistic slice of May–June 2026 releases.
 */

export type MockEconomicEvent = {
  id: string;
  source_id: string;
  date: Date;
  time: string | null;
  title: string;
  category: 'monetary_policy' | 'inflation' | 'employment' | 'growth';
  importance: 'high' | 'medium' | 'low';
  unit: string | null;
  actual: number | null;
  estimate: number | null;
  prev: number | null;
  fred_series_id: string | null;
  created_at: Date;
  updated_at: Date;
};

export const mockEconomicEvents: MockEconomicEvent[] = [
  // ── Monetary Policy ─────────────────────────────────────────
  {
    id: 'clx_eco_001',
    source_id: 'finnhub_eco_20260612_fomc',
    date: new Date('2026-06-12T00:00:00Z'),
    time: '14:00',
    title: 'FOMC Interest Rate Decision',
    category: 'monetary_policy',
    importance: 'high',
    unit: '%',
    actual: null,       // not yet released
    estimate: 4.5,
    prev: 4.5,
    fred_series_id: null,
    created_at: new Date('2026-05-01T08:00:00Z'),
    updated_at: new Date('2026-05-01T08:00:00Z'),
  },
  {
    id: 'clx_eco_002',
    source_id: 'finnhub_eco_20260528_powell',
    date: new Date('2026-05-28T00:00:00Z'),
    time: '10:00',
    title: 'Fed Chair Powell Speech',
    category: 'monetary_policy',
    importance: 'high',
    unit: null,
    actual: null,
    estimate: null,
    prev: null,
    fred_series_id: null,
    created_at: new Date('2026-05-20T08:00:00Z'),
    updated_at: new Date('2026-05-20T08:00:00Z'),
  },
  // ── Inflation ────────────────────────────────────────────────
  {
    id: 'clx_eco_003',
    source_id: 'finnhub_eco_20260513_cpi',
    date: new Date('2026-05-13T00:00:00Z'),
    time: '08:30',
    title: 'CPI m/m',
    category: 'inflation',
    importance: 'high',
    unit: '%',
    actual: 0.3,        // already released
    estimate: 0.2,
    prev: 0.2,
    fred_series_id: 'CPIAUCSL',
    created_at: new Date('2026-05-01T08:00:00Z'),
    updated_at: new Date('2026-05-13T08:35:00Z'),
  },
  {
    id: 'clx_eco_004',
    source_id: 'finnhub_eco_20260513_corecpi',
    date: new Date('2026-05-13T00:00:00Z'),
    time: '08:30',
    title: 'Core CPI m/m',
    category: 'inflation',
    importance: 'high',
    unit: '%',
    actual: 0.2,
    estimate: 0.3,
    prev: 0.3,
    fred_series_id: 'CPILFESL',
    created_at: new Date('2026-05-01T08:00:00Z'),
    updated_at: new Date('2026-05-13T08:35:00Z'),
  },
  {
    id: 'clx_eco_005',
    source_id: 'finnhub_eco_20260529_pce',
    date: new Date('2026-05-29T00:00:00Z'),
    time: '08:30',
    title: 'Core PCE Price Index m/m',
    category: 'inflation',
    importance: 'high',
    unit: '%',
    actual: null,
    estimate: 0.2,
    prev: 0.3,
    fred_series_id: 'PCEPILFE',
    created_at: new Date('2026-05-01T08:00:00Z'),
    updated_at: new Date('2026-05-01T08:00:00Z'),
  },
  // ── Employment ───────────────────────────────────────────────
  {
    id: 'clx_eco_006',
    source_id: 'finnhub_eco_20260606_nfp',
    date: new Date('2026-06-06T00:00:00Z'),
    time: '08:30',
    title: 'Nonfarm Payrolls',
    category: 'employment',
    importance: 'high',
    unit: 'K',
    actual: null,
    estimate: 185,
    prev: 177,
    fred_series_id: 'PAYEMS',
    created_at: new Date('2026-05-20T08:00:00Z'),
    updated_at: new Date('2026-05-20T08:00:00Z'),
  },
  {
    id: 'clx_eco_007',
    source_id: 'finnhub_eco_20260606_unemp',
    date: new Date('2026-06-06T00:00:00Z'),
    time: '08:30',
    title: 'Unemployment Rate',
    category: 'employment',
    importance: 'high',
    unit: '%',
    actual: null,
    estimate: 4.1,
    prev: 4.2,
    fred_series_id: 'UNRATE',
    created_at: new Date('2026-05-20T08:00:00Z'),
    updated_at: new Date('2026-05-20T08:00:00Z'),
  },
  // ── Growth ───────────────────────────────────────────────────
  {
    id: 'clx_eco_008',
    source_id: 'finnhub_eco_20260528_gdp',
    date: new Date('2026-05-28T00:00:00Z'),
    time: '08:30',
    title: 'GDP q/q (2nd Estimate)',
    category: 'growth',
    importance: 'high',
    unit: '%',
    actual: null,
    estimate: 2.1,
    prev: 1.6,
    fred_series_id: 'GDPC1',
    created_at: new Date('2026-05-15T08:00:00Z'),
    updated_at: new Date('2026-05-15T08:00:00Z'),
  },
  {
    id: 'clx_eco_009',
    source_id: 'finnhub_eco_20260616_retail',
    date: new Date('2026-06-16T00:00:00Z'),
    time: '08:30',
    title: 'Retail Sales m/m',
    category: 'growth',
    importance: 'medium',
    unit: '%',
    actual: null,
    estimate: 0.4,
    prev: -0.1,
    fred_series_id: 'RSXFS',
    created_at: new Date('2026-06-01T08:00:00Z'),
    updated_at: new Date('2026-06-01T08:00:00Z'),
  },
];

/**
 * Mock data — fred_snapshots table
 *
 * 24 months of monthly observations for each key indicator.
 * Used to render sparkline charts in EventDetailPanel.
 *
 * The daily batch writes the most recent FRED observation.
 * The API route queries: SELECT * FROM fred_snapshots WHERE series_id = ? ORDER BY date DESC LIMIT 24
 */

export type MockFredSnapshot = {
  id: string;
  series_id: string;
  date: Date;
  value: number;
  fetched_at: Date;
};

// Helper: generate sequential monthly dates descending
function monthlyDates(startYear: number, startMonth: number, count: number): Date[] {
  const dates: Date[] = [];
  let y = startYear, m = startMonth;
  for (let i = 0; i < count; i++) {
    dates.push(new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00Z`));
    m--;
    if (m === 0) { m = 12; y--; }
  }
  return dates;
}

const FETCHED = new Date('2026-05-27T08:00:00Z');

// CPI YoY (CPIAUCSL) — last 12 months
export const cpiSnapshots: MockFredSnapshot[] = [
  { id: 'fs_cpi_01', series_id: 'CPIAUCSL', date: new Date('2026-05-01Z'), value: 3.4, fetched_at: FETCHED },
  { id: 'fs_cpi_02', series_id: 'CPIAUCSL', date: new Date('2026-04-01Z'), value: 3.2, fetched_at: FETCHED },
  { id: 'fs_cpi_03', series_id: 'CPIAUCSL', date: new Date('2026-03-01Z'), value: 3.0, fetched_at: FETCHED },
  { id: 'fs_cpi_04', series_id: 'CPIAUCSL', date: new Date('2026-02-01Z'), value: 3.1, fetched_at: FETCHED },
  { id: 'fs_cpi_05', series_id: 'CPIAUCSL', date: new Date('2026-01-01Z'), value: 3.3, fetched_at: FETCHED },
  { id: 'fs_cpi_06', series_id: 'CPIAUCSL', date: new Date('2025-12-01Z'), value: 3.4, fetched_at: FETCHED },
  { id: 'fs_cpi_07', series_id: 'CPIAUCSL', date: new Date('2025-11-01Z'), value: 3.5, fetched_at: FETCHED },
  { id: 'fs_cpi_08', series_id: 'CPIAUCSL', date: new Date('2025-10-01Z'), value: 3.6, fetched_at: FETCHED },
  { id: 'fs_cpi_09', series_id: 'CPIAUCSL', date: new Date('2025-09-01Z'), value: 3.7, fetched_at: FETCHED },
  { id: 'fs_cpi_10', series_id: 'CPIAUCSL', date: new Date('2025-08-01Z'), value: 3.6, fetched_at: FETCHED },
  { id: 'fs_cpi_11', series_id: 'CPIAUCSL', date: new Date('2025-07-01Z'), value: 3.4, fetched_at: FETCHED },
  { id: 'fs_cpi_12', series_id: 'CPIAUCSL', date: new Date('2025-06-01Z'), value: 3.2, fetched_at: FETCHED },
];

// Nonfarm Payrolls (PAYEMS) — monthly change in thousands
export const nfpSnapshots: MockFredSnapshot[] = [
  { id: 'fs_nfp_01', series_id: 'PAYEMS', date: new Date('2026-04-01Z'), value: 177,  fetched_at: FETCHED },
  { id: 'fs_nfp_02', series_id: 'PAYEMS', date: new Date('2026-03-01Z'), value: 228,  fetched_at: FETCHED },
  { id: 'fs_nfp_03', series_id: 'PAYEMS', date: new Date('2026-02-01Z'), value: 151,  fetched_at: FETCHED },
  { id: 'fs_nfp_04', series_id: 'PAYEMS', date: new Date('2026-01-01Z'), value: 256,  fetched_at: FETCHED },
  { id: 'fs_nfp_05', series_id: 'PAYEMS', date: new Date('2025-12-01Z'), value: 307,  fetched_at: FETCHED },
  { id: 'fs_nfp_06', series_id: 'PAYEMS', date: new Date('2025-11-01Z'), value: 212,  fetched_at: FETCHED },
  { id: 'fs_nfp_07', series_id: 'PAYEMS', date: new Date('2025-10-01Z'), value: 193,  fetched_at: FETCHED },
  { id: 'fs_nfp_08', series_id: 'PAYEMS', date: new Date('2025-09-01Z'), value: 254,  fetched_at: FETCHED },
  { id: 'fs_nfp_09', series_id: 'PAYEMS', date: new Date('2025-08-01Z'), value: 168,  fetched_at: FETCHED },
  { id: 'fs_nfp_10', series_id: 'PAYEMS', date: new Date('2025-07-01Z'), value: 189,  fetched_at: FETCHED },
  { id: 'fs_nfp_11', series_id: 'PAYEMS', date: new Date('2025-06-01Z'), value: 174,  fetched_at: FETCHED },
  { id: 'fs_nfp_12', series_id: 'PAYEMS', date: new Date('2025-05-01Z'), value: 205,  fetched_at: FETCHED },
];

export const mockFredSnapshots: MockFredSnapshot[] = [
  ...cpiSnapshots,
  ...nfpSnapshots,
];

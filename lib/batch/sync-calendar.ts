/**
 * 캘린더 데이터 동기화 코어 로직
 * daily-calendar cron과 backfill 양쪽에서 재사용
 */

import { db } from '@/lib/batch/db';
import {
  getEconomicCalendar,
  getEarningsCalendar,
  getIpoCalendar,
} from '@/lib/api/finnhub';
import { categorizeEconomicEvent, mapImpact } from '@/lib/utils/categorize';

// ── Alpha Vantage EARNINGS_CALENDAR ───────────────────────────
async function fetchAlphaVantageEarnings(): Promise<
  { symbol: string; name: string; reportDate: string; estimate: string | null; timeOfTheDay: string }[]
> {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) return [];

  const res = await fetch(
    `https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${key}`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) throw new Error(`Alpha Vantage ${res.status}`);

  const csv  = await res.text();
  const rows = csv.trim().split('\n').slice(1); // skip header
  return rows.map((row) => {
    const [symbol, name, reportDate, , estimate, , timeOfTheDay] = row.split(',');
    return {
      symbol:       symbol?.trim() ?? '',
      name:         name?.trim() ?? '',
      reportDate:   reportDate?.trim() ?? '',
      estimate:     estimate?.trim() || null,
      timeOfTheDay: timeOfTheDay?.trim() ?? '',
    };
  }).filter((r) => r.symbol && r.reportDate);
}

function toEarningsHour(timeOfTheDay: string): 'bmo' | 'amc' | 'dmh' | null {
  const t = timeOfTheDay.toLowerCase();
  if (/pre.market|before.open|before.market/.test(t)) return 'bmo';
  if (/post.market|after.close|after.market/.test(t)) return 'amc';
  if (t) return 'dmh';
  return null;
}

export async function syncAlphaVantageEarnings(): Promise<{ count: number; log: string[] }> {
  const log: string[] = [];
  let count = 0;

  log.push('▶ Fetching Alpha Vantage earnings calendar (3 months)...');
  const rows    = await fetchAlphaVantageEarnings();
  const tracked = rows.filter((r) => TRACKED_SYMBOLS.has(r.symbol));
  log.push(`  ${rows.length} total rows, ${tracked.length} tracked symbols`);

  const ops = tracked.map((r) => {
    const date     = new Date(`${r.reportDate}T00:00:00Z`);
    const sourceId = `av_${r.symbol}_${r.reportDate}`;
    const hour     = toEarningsHour(r.timeOfTheDay);
    const eps      = r.estimate !== null ? Number(r.estimate) : null;

    return db.earningsEvent.upsert({
      where:  { source_id: sourceId },
      create: {
        source_id:    sourceId,
        symbol:       r.symbol,
        company:      r.name || r.symbol,
        date,
        hour,
        eps_estimate: isNaN(eps as number) ? null : eps,
      },
      update: {
        company:      r.name || r.symbol,
        hour,
        eps_estimate: isNaN(eps as number) ? null : eps,
      },
    });
  });

  if (ops.length > 0) await Promise.all(ops);
  count = ops.length;
  log.push(`  ✓ ${count} upserted`);

  return { count, log };
}



type RawRecord = Record<string, unknown>;

const TRACKED_SYMBOLS = new Set([
  // ── Magnificent 7 ──────────────────────────────────────────
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA',

  // ── QQQ Top Holdings (Semiconductors) ──────────────────────
  'AVGO', 'AMD', 'MU', 'QCOM', 'TXN', 'INTC', 'AMAT', 'LRCX', 'KLAC',
  'ASML', 'SNPS', 'CDNS', 'ON', 'MRVL', 'ARM',

  // ── QQQ Top Holdings (Software/Cloud) ──────────────────────
  'ADBE', 'PANW', 'CRM', 'NOW', 'INTU', 'TEAM', 'WDAY', 'SNOW',
  'ZS', 'CRWD', 'DDOG', 'HUBS', 'TTD',

  // ── QQQ Top Holdings (Consumer/Retail) ─────────────────────
  'COST', 'NFLX', 'ABNB', 'BOOKING', 'BKNG', 'PYPL', 'EBAY',

  // ── QQQ Top Holdings (Biotech/Healthcare) ──────────────────
  'AMGN', 'GILD', 'BIIB', 'REGN', 'VRTX', 'MRNA', 'ISRG',

  // ── High-profile / AI / macro-sensitive ────────────────────
  'ORCL', 'UBER', 'LYFT', 'PLTR', 'RBLX', 'HOOD', 'COIN',
]);

function toDate(val: unknown): Date | null {
  if (!val) return null;
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(`${s.slice(0, 10)}T00:00:00Z`);
  if (/^\d{10,}$/.test(s)) return new Date(Number(s) * 1000);
  return null;
}

function toTime(val: unknown): string | null {
  if (!val) return null;
  const s = String(val);
  const m = s.match(/\d{2}:\d{2}/);
  return m ? m[0] : null;
}

export interface SyncResult {
  counts:     { economic: number; earnings: number; ipo: number; skipped: number };
  log:        string[];
  durationMs: number;
}

export async function syncCalendar(from: string, to: string): Promise<SyncResult> {
  const startedAt = Date.now();
  const log: string[] = [];
  const counts = { economic: 0, earnings: 0, ipo: 0, skipped: 0 };

  log.push(`▶ Fetching calendars for ${from} → ${to}`);

  const [ecoResult, earnResult, ipoResult] = await Promise.allSettled([
    getEconomicCalendar(from, to),
    getEarningsCalendar(from, to),
    getIpoCalendar(from, to),
  ]);

  // ── 1. Economic Events ─────────────────────────────────────
  log.push('▶ Processing economic events...');
  if (ecoResult.status === 'fulfilled') {
    const items: RawRecord[] =
      ((ecoResult.value as RawRecord)?.economicCalendar as RawRecord[]) ?? [];

    const ecoOps = [];
    for (const item of items) {
      if (item.country !== 'US') { counts.skipped++; continue; }
      const importance = mapImpact(String(item.impact ?? ''));
      if (importance === 'low') { counts.skipped++; continue; }

      const date = toDate(item.time ?? item.date);
      if (!date) continue;

      const title    = String(item.event ?? '');
      const sourceId = String(item.id ?? `eco_${date.toISOString().slice(0, 10)}_${title.slice(0, 20)}`);

      ecoOps.push(db.economicEvent.upsert({
        where:  { source_id: sourceId },
        create: {
          source_id:  sourceId,
          date,
          time:       toTime(item.time),
          title,
          category:   categorizeEconomicEvent(title),
          importance,
          unit:       item.unit     ? String(item.unit)     : null,
          actual:     item.actual   != null ? Number(item.actual)   : null,
          estimate:   item.estimate != null ? Number(item.estimate) : null,
          prev:       item.prev     != null ? Number(item.prev)     : null,
        },
        update: {
          category: categorizeEconomicEvent(title),
          actual:   item.actual   != null ? Number(item.actual)   : null,
          estimate: item.estimate != null ? Number(item.estimate) : null,
          prev:     item.prev     != null ? Number(item.prev)     : null,
        },
      }));
      counts.economic++;
    }
    if (ecoOps.length > 0) await Promise.all(ecoOps);
    log.push(`  ✓ ${counts.economic} upserted (${counts.skipped} skipped)`);
  } else {
    log.push(`  ✗ economic: ${String(ecoResult.reason)}`);
  }

  // ── 2. Earnings Events ─────────────────────────────────────
  log.push('▶ Processing earnings events...');
  if (earnResult.status === 'fulfilled') {
    const items: RawRecord[] =
      ((earnResult.value as RawRecord)?.earningsCalendar as RawRecord[]) ?? [];

    const earnOps = [];
    for (const item of items) {
      const symbol = String(item.symbol ?? '');
      if (!TRACKED_SYMBOLS.has(symbol)) continue;

      const date = toDate(item.date);
      if (!date) continue;

      const sourceId = String(item.id ?? `earn_${symbol}_${date.toISOString().slice(0, 10)}`);
      const hourRaw  = String(item.hour ?? '');
      const hour     = (['bmo', 'amc', 'dmh'] as const).find((h) => h === hourRaw) ?? null;

      earnOps.push(db.earningsEvent.upsert({
        where:  { source_id: sourceId },
        create: {
          source_id:        sourceId,
          symbol,
          company:          String(item.company ?? symbol),
          date,
          hour,
          quarter:          item.quarter != null ? Number(item.quarter) : null,
          year:             item.year    != null ? Number(item.year)    : null,
          eps_estimate:     item.epsEstimate     != null ? Number(item.epsEstimate)     : null,
          eps_actual:       item.epsActual       != null ? Number(item.epsActual)       : null,
          revenue_estimate: item.revenueEstimate != null ? Number(item.revenueEstimate) : null,
          revenue_actual:   item.revenueActual   != null ? Number(item.revenueActual)   : null,
        },
        update: {
          eps_actual:     item.epsActual     != null ? Number(item.epsActual)     : null,
          revenue_actual: item.revenueActual != null ? Number(item.revenueActual) : null,
        },
      }));
      counts.earnings++;
    }
    if (earnOps.length > 0) await Promise.all(earnOps);
    log.push(`  ✓ ${counts.earnings} upserted`);
  } else {
    log.push(`  ✗ earnings: ${String(earnResult.reason)}`);
  }

  // ── 3. IPO Events ──────────────────────────────────────────
  log.push('▶ Processing IPO events...');
  if (ipoResult.status === 'fulfilled') {
    const items: RawRecord[] =
      ((ipoResult.value as RawRecord)?.ipoCalendar as RawRecord[]) ?? [];

    const ipoOps = [];
    for (const item of items) {
      const date    = toDate(item.date);
      if (!date) continue;

      const company   = String(item.name ?? item.company ?? item.symbol ?? 'Unknown');
      const sourceId  = String(item.id ?? `ipo_${company}_${date.toISOString().slice(0, 10)}`);
      const statusRaw = String(item.status ?? 'expected').toLowerCase();
      const status    = (['expected', 'filed', 'priced', 'withdrawn'] as const)
        .find((s) => s === statusRaw) ?? 'expected';

      ipoOps.push(db.ipoEvent.upsert({
        where:  { source_id: sourceId },
        create: {
          source_id:          sourceId,
          symbol:             item.symbol   ? String(item.symbol)   : null,
          company,
          date,
          exchange:           item.exchange ? String(item.exchange) : null,
          status,
          price:              item.price           != null ? Number(item.price)           : null,
          number_of_shares:   item.numberOfShares  != null ? BigInt(Math.round(Number(item.numberOfShares)))  : null,
          total_shares_value: item.totalSharesValue != null ? Number(item.totalSharesValue) : null,
          nasdaq_fast_entry:  false,
        },
        update: {
          status,
          price: item.price != null ? Number(item.price) : null,
        },
      }));
      counts.ipo++;
    }
    if (ipoOps.length > 0) await Promise.all(ipoOps);
    log.push(`  ✓ ${counts.ipo} upserted`);
  } else {
    log.push(`  ✗ ipo: ${String(ipoResult.reason)}`);
  }

  log.push(`▶ Done — ${counts.economic + counts.earnings + counts.ipo} total rows`);

  return { counts, log, durationMs: Date.now() - startedAt };
}

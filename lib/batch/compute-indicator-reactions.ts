/**
 * compute-indicator-reactions.ts
 *
 * Cross-references economic event surprises (actual vs estimate)
 * with stock price moves on the same day or next trading day,
 * then aggregates statistics into IndicatorReaction table.
 *
 * Logic:
 *  1. Fetch all EconomicEvents that have both actual + estimate
 *  2. Classify each event: indicator key + surprise direction (hot/cool)
 *  3. For each event date × symbol, find the day_pct from StockDailyPrice
 *     (same day if available, otherwise next available trading day within 2 days)
 *  4. Aggregate: avg, p25, p75, sample_count
 *  5. Upsert into IndicatorReaction
 */

import { db } from './db';
import { TRACKED_SYMBOLS } from './sync-stock-prices';

// ── Indicator classification ─────────────────────────────────────────────────

export type IndicatorKey =
  | 'CPI' | 'CORE_CPI'
  | 'PPI' | 'CORE_PPI'
  | 'PCE' | 'CORE_PCE'
  | 'NFP'
  | 'FOMC'
  | 'GDP';

export function classifyIndicator(title: string): IndicatorKey | null {
  const t = title.toLowerCase();
  if (t.includes('fomc') || (t.includes('fed') && t.includes('rate')) || t.includes('interest rate decision')) return 'FOMC';
  if (t.includes('core cpi') || t.includes('core consumer price')) return 'CORE_CPI';
  if (t.includes('cpi') || t.includes('consumer price index')) return 'CPI';
  if (t.includes('core pce') || (t.includes('core') && t.includes('pce'))) return 'CORE_PCE';
  if (t.includes('pce') || (t.includes('personal consumption') && t.includes('price'))) return 'PCE';
  if (t.includes('nonfarm') || t.includes('non-farm') || t.includes('nfp') || t.includes('payroll')) return 'NFP';
  if (t.includes('core ppi') || (t.includes('core') && t.includes('producer price'))) return 'CORE_PPI';
  if (t.includes('ppi') || t.includes('producer price')) return 'PPI';
  if (t.includes('gdp') || t.includes('gross domestic')) return 'GDP';
  return null;
}

/**
 * "Hot" = surprise that historically pressures stocks (higher inflation, lower growth):
 *  - Inflation indicators (CPI/PPI/PCE): actual > estimate = hot (hawkish)
 *  - Growth / employment (NFP, GDP): actual > estimate = cool (good news) — but
 *    in 2022–2024 strong employment was read as hawkish too, so we keep it simple:
 *    actual > estimate = "hot" universally (beats consensus).
 *  - FOMC: actual rate > estimate (more hawkish) = hot
 *
 * The sign of the market reaction is captured in the avg_return — so a "hot" CPI
 * with avg_return = -1.5% means the market sells off on hot prints.
 */
export function getSurpriseDir(actual: number, estimate: number): 'hot' | 'cool' {
  return actual > estimate ? 'hot' : 'cool';
}

// ── Percentile helper ────────────────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo  = Math.floor(idx);
  const hi  = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── Main computation ─────────────────────────────────────────────────────────

export async function computeIndicatorReactions(
  symbols: string[] = TRACKED_SYMBOLS,
): Promise<{ updated: number; log: string[] }> {
  const log: string[] = [];

  // 1. Fetch all economic events with surprise data
  const events = await db.economicEvent.findMany({
    where: {
      actual:   { not: null },
      estimate: { not: null },
    },
    select: {
      id:       true,
      date:     true,
      title:    true,
      actual:   true,
      estimate: true,
    },
  });

  log.push(`Found ${events.length} economic events with actual+estimate`);

  // 2. Classify events
  type ClassifiedEvent = {
    date:        Date;
    indicator:   IndicatorKey;
    surpriseDir: 'hot' | 'cool';
  };

  const classified: ClassifiedEvent[] = [];
  for (const ev of events) {
    const indicator = classifyIndicator(ev.title);
    if (!indicator) continue;
    if (ev.actual == null || ev.estimate == null) continue;
    classified.push({
      date:        ev.date,
      indicator,
      surpriseDir: getSurpriseDir(ev.actual, ev.estimate),
    });
  }

  log.push(`Classified ${classified.length} events into indicators`);

  // 3. For each (indicator, symbol, surpriseDir) combo, collect pct moves
  // Build a date → symbol → day_pct map for fast lookups
  const allDates = [...new Set(classified.map((e) => e.date.toISOString().slice(0, 10)))];

  // Fetch all prices for the event dates + 2 days after (for non-trading days)
  const dateSet = new Set<string>();
  for (const d of allDates) {
    const base = new Date(d);
    for (let offset = 0; offset <= 3; offset++) {
      const nd = new Date(base);
      nd.setDate(nd.getDate() + offset);
      dateSet.add(nd.toISOString().slice(0, 10));
    }
  }

  const prices = await db.stockDailyPrice.findMany({
    where: {
      symbol: { in: symbols },
      date:   { in: [...dateSet].map((d) => new Date(d)) },
    },
    select: { symbol: true, date: true, close: true },
    orderBy: [{ symbol: 'asc' }, { date: 'asc' }],
  });

  // Build map: symbol → date-str → close
  const closeMap = new Map<string, Map<string, number>>();
  for (const p of prices) {
    const ds = p.date.toISOString().slice(0, 10);
    if (!closeMap.has(p.symbol)) closeMap.set(p.symbol, new Map());
    closeMap.get(p.symbol)!.set(ds, p.close);
  }

  // Helper: get pct move for symbol on event date
  // We measure: (close_on_event_day / close_prev_day - 1) * 100
  // If event day has no trading, try next 2 days
  function getPctMove(symbol: string, eventDate: Date): number | null {
    const symMap = closeMap.get(symbol);
    if (!symMap) return null;

    for (let offset = 0; offset <= 2; offset++) {
      const d     = new Date(eventDate);
      d.setDate(d.getDate() + offset);
      const ds    = d.toISOString().slice(0, 10);
      const close = symMap.get(ds);
      if (close == null) continue;

      // Get previous trading day close
      const prevD = new Date(d);
      prevD.setDate(prevD.getDate() - 1);
      const prevDs = prevD.toISOString().slice(0, 10);
      const prevClose = symMap.get(prevDs);
      if (prevClose == null || prevClose === 0) continue;

      return ((close - prevClose) / prevClose) * 100;
    }
    return null;
  }

  // 4. Group returns: { [indicator]: { [symbol]: { hot: number[], cool: number[] } } }
  type ReturnsMap = Map<string, Map<string, { hot: number[]; cool: number[] }>>;
  const returnsMap: ReturnsMap = new Map();

  for (const ev of classified) {
    const indKey = ev.indicator as string;
    if (!returnsMap.has(indKey)) returnsMap.set(indKey, new Map());
    const symReturns = returnsMap.get(indKey)!;

    for (const symbol of symbols) {
      const pct = getPctMove(symbol, ev.date);
      if (pct == null) continue;

      if (!symReturns.has(symbol)) symReturns.set(symbol, { hot: [], cool: [] });
      symReturns.get(symbol)![ev.surpriseDir].push(pct);
    }
  }

  // 5. Upsert statistics
  let updated = 0;
  for (const [indicator, symMap] of returnsMap) {
    for (const [symbol, dirs] of symMap) {
      for (const dir of ['hot', 'cool'] as const) {
        const returns = dirs[dir];
        if (returns.length < 2) continue; // need at least 2 samples

        const sorted    = [...returns].sort((a, b) => a - b);
        const avg       = sorted.reduce((s, v) => s + v, 0) / sorted.length;
        const p25       = percentile(sorted, 25);
        const p75       = percentile(sorted, 75);

        await db.indicatorReaction.upsert({
          where:  { indicator_symbol_surprise_dir: { indicator, symbol, surprise_dir: dir } },
          update: { avg_return: avg, p25_return: p25, p75_return: p75, sample_count: returns.length },
          create: { indicator, symbol, surprise_dir: dir, avg_return: avg, p25_return: p25, p75_return: p75, sample_count: returns.length },
        });
        updated++;
      }
    }
  }

  log.push(`Upserted ${updated} indicator_reaction rows`);
  return { updated, log };
}

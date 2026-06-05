/**
 * 캘린더 데이터 동기화 코어 로직
 * daily-calendar cron과 backfill 양쪽에서 재사용
 */

import { db } from '@/lib/batch/db';
import {
  getEconomicCalendar,
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

// ── Alpha Vantage EARNINGS (actual 업데이트) ───────────────────
// 발표일이 지났지만 eps_actual이 없는 종목에 대해 실제 실적을 가져옴
// AV 무료 티어: 25req/day → 하루 최대 10개 심볼만 처리
export async function syncActualEarnings(): Promise<{ count: number; log: string[] }> {
  const log: string[] = [];
  let updated = 0;

  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    log.push('⚠ ALPHA_VANTAGE_API_KEY not set, skipping');
    return { count: 0, log };
  }

  // 최근 60일 이내 발표됐지만 actual이 없는 이벤트
  const since = new Date();
  since.setDate(since.getDate() - 60);
  const now = new Date();

  const pending = await db.earningsEvent.findMany({
    where: {
      date:       { gte: since, lt: now },
      eps_actual: null,
    },
    select:  { id: true, symbol: true, date: true },
    orderBy: { date: 'desc' },
    take:    10, // rate limit 보호
  });

  if (pending.length === 0) {
    log.push('✓ No pending actual earnings to update');
    return { count: 0, log };
  }

  // 심볼별로 중복 제거 후 처리
  const symbolMap = new Map<string, { id: string; date: Date }[]>();
  for (const row of pending) {
    if (!symbolMap.has(row.symbol)) symbolMap.set(row.symbol, []);
    symbolMap.get(row.symbol)!.push({ id: row.id, date: row.date });
  }

  log.push(`▶ Fetching actual EPS for ${symbolMap.size} symbols...`);

  for (const [symbol, events] of symbolMap) {
    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=EARNINGS&symbol=${symbol}&apikey=${key}`,
        { next: { revalidate: 0 } },
      );
      if (!res.ok) { log.push(`  ✗ ${symbol}: HTTP ${res.status}`); continue; }

      const json = await res.json() as {
        quarterlyEarnings?: { reportedDate: string; reportedEPS: string; estimatedEPS: string }[];
      };

      const quarterly = json.quarterlyEarnings ?? [];

      for (const event of events) {
        const eventDate = event.date.toISOString().slice(0, 10);
        // reportedDate 기준으로 ±1일 범위에서 매칭 (날짜 오차 허용)
        const match = quarterly.find((q) => {
          const diff = Math.abs(
            new Date(q.reportedDate).getTime() - new Date(eventDate).getTime()
          );
          return diff <= 86400_000; // 1일 이내
        });

        if (!match) { log.push(`  - ${symbol} ${eventDate}: no match`); continue; }

        const actual = match.reportedEPS !== 'None' ? Number(match.reportedEPS) : null;
        if (actual === null || isNaN(actual)) { log.push(`  - ${symbol}: reportedEPS=None`); continue; }

        await db.earningsEvent.update({
          where: { id: event.id },
          data:  { eps_actual: actual },
        });
        log.push(`  ✓ ${symbol} ${eventDate}: actual=${actual}`);
        updated++;
      }

      // AV rate limit 보호 (1.2초 간격)
      await new Promise((r) => setTimeout(r, 1200));
    } catch (e) {
      log.push(`  ✗ ${symbol}: ${String(e)}`);
    }
  }

  log.push(`✓ Updated ${updated} earnings with actual EPS`);
  return { count: updated, log };
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

  const [ecoResult, ipoResult] = await Promise.allSettled([
    getEconomicCalendar(from, to),
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

  // ── 2. Earnings Events — Alpha Vantage 전용 (syncAlphaVantageEarnings 사용)
  log.push('▶ Earnings: handled by Alpha Vantage (skipping Finnhub)');

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

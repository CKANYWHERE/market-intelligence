// Cron: FRED Indicator Update
// Schedule: 09:00 ET every weekday — vercel.json cron: "0 13 * * 1-5" (UTC)
//
// 직접 실행:
//   curl http://localhost:3000/api/cron/fred-update

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getFredSeries } from '@/lib/api/fred';

export const maxDuration = 60;

const SERIES_CONFIG = [
  { seriesId: 'CPIAUCSL', titleKeyword: 'CPI' },
  { seriesId: 'CPILFESL', titleKeyword: 'Core CPI' },
  { seriesId: 'PPIACO',   titleKeyword: 'PPI' },
  { seriesId: 'PCEPI',    titleKeyword: 'PCE' },
  { seriesId: 'PCEPILFE', titleKeyword: 'Core PCE' },
  { seriesId: 'PAYEMS',   titleKeyword: 'Nonfarm Payroll' },
  { seriesId: 'UNRATE',   titleKeyword: 'Unemployment Rate' },
  { seriesId: 'GDPC1',    titleKeyword: 'GDP' },
  { seriesId: 'JTSJOL',   titleKeyword: 'JOLTS' },
  { seriesId: 'ICSA',     titleKeyword: 'Jobless Claims' },
  { seriesId: 'RSXFS',    titleKeyword: 'Retail Sales' },
  { seriesId: 'DGORDER',  titleKeyword: 'Durable Goods' },
  { seriesId: 'MICH',     titleKeyword: 'Inflation Expectation' },
] as const;

type FredObs = { date: string; value: string };

// FRED API rate limit 방지 — 동시 호출 수 제한
async function pLimit<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.FRED_API_KEY) {
    return NextResponse.json({
      ok:   false,
      error: 'FRED_API_KEY not set',
      hint:  'https://fred.stlouisfed.org/docs/api/api_key.html',
    }, { status: 400 });
  }

  const startedAt = Date.now();
  const log: string[] = [];
  const results: Record<string, {
    snapshots: number;
    eventUpdated: boolean;
    latestValue?: number;
    latestDate?: string;
  }> = {};

  const t = (label: string) => log.push(`[${Date.now() - startedAt}ms] ${label}`);

  // ── Step 1: FRED API fetch ───────────────────────────────────
  t('▶ Step1 start: FRED fetch (limit=1, all parallel)');
  const fetchResults = await Promise.allSettled(
    SERIES_CONFIG.map(({ seriesId }) => getFredSeries(seriesId, 1)),
  );
  t('✓ Step1 done: FRED fetch');

  // ── Step 2: 결과 파싱 ────────────────────────────────────────
  t('▶ Step2 start: parsing');
  type SnapshotRow = { seriesId: string; date: string; value: number };
  const allRows: SnapshotRow[] = [];

  for (let i = 0; i < SERIES_CONFIG.length; i++) {
    const { seriesId } = SERIES_CONFIG[i];
    const result = fetchResults[i];
    if (result.status === 'rejected') {
      log.push(`  ✗ ${seriesId}: ${String(result.reason)}`);
      results[seriesId] = { snapshots: 0, eventUpdated: false };
      continue;
    }
    const obs = result.value as FredObs[];
    const latest = obs.find((o) => o.value !== '.' && o.value !== '');
    if (!latest) {
      results[seriesId] = { snapshots: 0, eventUpdated: false };
      log.push(`  ⚠ ${seriesId}: no valid observation`);
      continue;
    }
    const value = parseFloat(latest.value);
    if (!isNaN(value)) {
      allRows.push({ seriesId, date: latest.date, value });
      results[seriesId] = { snapshots: 1, eventUpdated: false, latestValue: value, latestDate: latest.date };
    }
  }
  t('✓ Step2 done: parsing');

  // ── Step 3: DB — snapshot createMany ────────────────────────
  t('▶ Step3 start: DB createMany (snapshots)');
  if (allRows.length > 0) {
    await db.fredSnapshot.createMany({
      data: allRows.map(({ seriesId, date, value }) => ({
        series_id: seriesId,
        date:      new Date(`${date}T00:00:00Z`),
        value,
      })),
      skipDuplicates: true,
    });
  }
  t(`✓ Step3 done: ${allRows.length} snapshots`);

  // ── Step 4: DB — economic_events.actual 업데이트 ─────────────
  t('▶ Step4 start: DB updateMany (actuals)');
  let updatedEvents = 0;
  await Promise.all(
    allRows.map(async ({ seriesId, date, value }) => {
      const { titleKeyword } = SERIES_CONFIG.find((s) => s.seriesId === seriesId)!;
      const r = await db.economicEvent.updateMany({
        where: { date: new Date(`${date}T00:00:00Z`), title: { contains: titleKeyword, mode: 'insensitive' }, actual: null },
        data:  { actual: value },
      });
      if (r.count > 0) {
        updatedEvents++;
        log.push(`  ✓ actual updated: "${titleKeyword}" on ${date}`);
        results[seriesId].eventUpdated = true;
      }
    }),
  );
  t(`✓ Step4 done: ${updatedEvents} events updated`);

  const totalSnapshots = allRows.length;
  log.push(`▶ Total — ${totalSnapshots} snapshots, ${updatedEvents} events updated`);

  return NextResponse.json({ ok: true, results, log, durationMs: Date.now() - startedAt });
}

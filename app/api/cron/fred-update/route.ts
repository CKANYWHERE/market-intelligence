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

  // FRED API rate limit 방지 — 최대 3개 동시 처리
  await pLimit(
    SERIES_CONFIG.map(({ seriesId, titleKeyword }) => async () => {
      log.push(`▶ ${seriesId} (${titleKeyword})...`);
      try {
        const observations = (await getFredSeries(seriesId, 24)) as FredObs[];
        const valid = observations.filter((o) => o.value !== '.' && o.value !== '');

        // ── fred_snapshots — 병렬 upsert ($transaction 대신 Promise.all)
        // Supabase Transaction Pooler(pgBouncer)와 $transaction 궁합 불량
        const snapshotOps = valid
          .map((obs) => ({ date: obs.date, value: parseFloat(obs.value) }))
          .filter(({ value }) => !isNaN(value))
          .map(({ date, value }) =>
            db.fredSnapshot.upsert({
              where:  { series_id_date: { series_id: seriesId, date: new Date(`${date}T00:00:00Z`) } },
              create: { series_id: seriesId, date: new Date(`${date}T00:00:00Z`), value },
              update: { value },
            }),
          );

        if (snapshotOps.length > 0) await Promise.all(snapshotOps);

        // ── economic_events.actual 업데이트 ───────────────────
        let eventUpdated = false;
        if (valid.length > 0) {
          const latest      = valid[0];
          const latestValue = parseFloat(latest.value);
          const latestDate  = new Date(`${latest.date}T00:00:00Z`);

          if (!isNaN(latestValue)) {
            const updated = await db.economicEvent.updateMany({
              where: {
                date:   latestDate,
                title:  { contains: titleKeyword, mode: 'insensitive' },
                actual: null,
              },
              data: { actual: latestValue },
            });
            eventUpdated = updated.count > 0;
            if (eventUpdated) log.push(`  ✓ actual updated for "${titleKeyword}" on ${latest.date}`);
          }

          results[seriesId] = {
            snapshots: snapshotOps.length,
            eventUpdated,
            latestValue: parseFloat(latest.value),
            latestDate:  latest.date,
          };
          log.push(`  ✓ ${snapshotOps.length} snapshots, latest ${latest.value} (${latest.date})`);
        } else {
          results[seriesId] = { snapshots: 0, eventUpdated: false };
          log.push(`  ⚠ no valid observations`);
        }
      } catch (err) {
        console.error(`[cron/fred-update] ${seriesId}:`, err);
        results[seriesId] = { snapshots: 0, eventUpdated: false };
        log.push(`  ✗ ${String(err)}`);
      }
    }),
    3, // 동시 3개
  );

  const totalSnapshots   = Object.values(results).reduce((s, r) => s + r.snapshots, 0);
  const updatedEvents    = Object.values(results).filter((r) => r.eventUpdated).length;
  log.push(`▶ Done — ${totalSnapshots} snapshots, ${updatedEvents} events updated`);

  return NextResponse.json({ ok: true, results, log, durationMs: Date.now() - startedAt });
}

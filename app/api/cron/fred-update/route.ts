// Cron: FRED Indicator Update
// Schedule: 09:00 ET every weekday — vercel.json cron: "0 13 * * 1-5" (UTC)
//
// 직접 실행:
//   curl http://localhost:3000/api/cron/fred-update

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getFredSeries } from '@/lib/api/fred';

export const maxDuration = 60;

// IMPORTANT: titleKeyword must match Finnhub event titles stored in DB.
// Finnhub naming ≠ FRED naming — e.g. CPIAUCSL → "Inflation Rate MoM" (not "CPI")
//
// Two separate FRED reads per series, for two separate consumers:
//  - fred_snapshots (indicator cards/sparklines on /api/indicators) always wants
//    the RAW level, uncomputed — that route derives its own YoY/MoM from the series.
//  - economic_events.actual wants the value in whatever unit Finnhub's event title
//    implies (e.g. "Inflation Rate MoM" expects a %), so it uses `actualUnits`.
//
// actualUnits codes (FRED API `units` param):
//   'pch' → Percent Change (period-over-period, i.e. MoM for monthly series)
//   'chg' → Change (period-over-period, in level units — NFP: jobs added that month)
//   undefined → Raw level (Unemployment %, JOLTS thousands, Claims thousands, Sentiment index)
//
// NOTE: FRED is a fallback. Primary actual values come from Finnhub via daily-calendar cron
// (which now fetches 30 days back). FRED only fills in events still null after Finnhub runs.
// FRED revised data may differ slightly from Finnhub's initial-release values.
const SERIES_CONFIG = [
  { seriesId: 'CPIAUCSL', titleKeyword: 'Inflation Rate',      actualUnits: 'pch'       }, // "Inflation Rate MoM" in Finnhub
  { seriesId: 'CPILFESL', titleKeyword: 'Core Inflation Rate', actualUnits: 'pch'       }, // "Core Inflation Rate MoM"
  { seriesId: 'PPIFID',   titleKeyword: 'PPI',                 actualUnits: 'pch'       }, // "PPI MoM" — Final Demand PPI (PPIACO는 원자재 전체라 값이 틀림)
  { seriesId: 'PCEPI',    titleKeyword: 'PCE',                 actualUnits: 'pch'       }, // "PCE Price Index MoM"
  { seriesId: 'PCEPILFE', titleKeyword: 'Core PCE',            actualUnits: 'pch'       }, // "Core PCE Price Index MoM"
  { seriesId: 'PAYEMS',   titleKeyword: 'Non Farm Payroll',    actualUnits: 'chg'       }, // "Non Farm Payrolls" — chg = jobs added that month (thousands). NOTE: was 'ch1' (YoY change) — wrong unit, fixed.
  { seriesId: 'UNRATE',   titleKeyword: 'Unemployment Rate',   actualUnits: undefined   }, // raw level = %
  { seriesId: 'JTSJOL',   titleKeyword: 'JOLTS',              actualUnits: undefined   }, // raw level = thousands of openings
  { seriesId: 'ICSA',     titleKeyword: 'Jobless Claims',      actualUnits: undefined   }, // raw level = thousands
  { seriesId: 'RSXFS',    titleKeyword: 'Retail Sales',        actualUnits: 'pch'       }, // "Retail Sales MoM"
  { seriesId: 'DGORDER',  titleKeyword: 'Durable Goods',       actualUnits: 'pch'       }, // "Durable Goods Orders MoM"
  { seriesId: 'MICH',     titleKeyword: 'Michigan',            actualUnits: undefined   }, // "Michigan Consumer Sentiment"
] as const;

// indicators 카드 스파크라인/YoY 계산에 필요한 과거 관측치 개수 (12개월 + 여유)
const SNAPSHOT_HISTORY_LIMIT = 24;

type FredObs = { date: string; value: string };

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

// 전체 작업에 타임아웃을 걸어서 300초 hang 방지
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

async function runUpdate(log: string[], startedAt: number) {
  const t = (label: string) => log.push(`[${Date.now() - startedAt}ms] ${label}`);
  const results: Record<string, {
    snapshots: number;
    eventUpdated: boolean;
    latestValue?: number;
    latestDate?: string;
  }> = {};

  // ── Step 1a: raw level fetch (순차) — fred_snapshots 저장용 (indicators 차트가 자체적으로 YoY/MoM 계산)
  t('▶ Step1a start: FRED raw-level fetch sequential');
  const levelResults: PromiseSettledResult<FredObs[]>[] = [];
  for (const { seriesId } of SERIES_CONFIG) {
    const result = await getFredSeries(seriesId, SNAPSHOT_HISTORY_LIMIT)
      .then((v) => ({ status: 'fulfilled' as const, value: v }))
      .catch((e) => ({ status: 'rejected' as const, reason: e }));
    levelResults.push(result);
    await new Promise((r) => setTimeout(r, 300));
  }
  t('✓ Step1a done');

  // ── Step 1b: actual-matching fetch (순차) — economic_events.actual 갱신용 (Finnhub 표시 단위와 일치시킴)
  t('▶ Step1b start: FRED actual-units fetch sequential');
  const actualFetchResults: PromiseSettledResult<FredObs[]>[] = [];
  for (const { seriesId, actualUnits } of SERIES_CONFIG) {
    const result = await getFredSeries(seriesId, 1, actualUnits)
      .then((v) => ({ status: 'fulfilled' as const, value: v }))
      .catch((e) => ({ status: 'rejected' as const, reason: e }));
    actualFetchResults.push(result);
    await new Promise((r) => setTimeout(r, 300));
  }
  t('✓ Step1b done');

  // ── Step 2a: 레벨 데이터 파싱 → snapshot rows (시리즈당 여러 개)
  type SnapshotRow = { seriesId: string; date: string; value: number };
  const snapshotRows: SnapshotRow[] = [];

  for (let i = 0; i < SERIES_CONFIG.length; i++) {
    const { seriesId } = SERIES_CONFIG[i];
    const result = levelResults[i];
    results[seriesId] = { snapshots: 0, eventUpdated: false };
    if (result.status === 'rejected') {
      log.push(`  ✗ ${seriesId} (level): ${String(result.reason)}`);
      continue;
    }
    for (const obs of result.value) {
      if (obs.value === '.' || obs.value === '') continue;
      const value = parseFloat(obs.value);
      if (isNaN(value)) continue;
      snapshotRows.push({ seriesId, date: obs.date, value });
    }
    const latest = snapshotRows.filter((r) => r.seriesId === seriesId)[0];
    results[seriesId].snapshots = snapshotRows.filter((r) => r.seriesId === seriesId).length;
    if (latest) {
      results[seriesId].latestValue = latest.value;
      results[seriesId].latestDate  = latest.date;
    }
  }

  // ── Step 2b: actual-매칭용 최신값 파싱 (시리즈당 1개)
  const actualRows: SnapshotRow[] = [];
  for (let i = 0; i < SERIES_CONFIG.length; i++) {
    const { seriesId } = SERIES_CONFIG[i];
    const result = actualFetchResults[i];
    if (result.status === 'rejected') {
      log.push(`  ✗ ${seriesId} (actual): ${String(result.reason)}`);
      continue;
    }
    const latest = result.value.find((o) => o.value !== '.' && o.value !== '');
    if (!latest) continue;
    const value = parseFloat(latest.value);
    if (!isNaN(value)) actualRows.push({ seriesId, date: latest.date, value });
  }

  // ── Step 3: DB snapshot (raw level)
  t('▶ Step3 start: DB createMany');
  if (snapshotRows.length > 0) {
    await db.fredSnapshot.createMany({
      data: snapshotRows.map(({ seriesId, date, value }) => ({
        series_id: seriesId,
        date:      new Date(`${date}T00:00:00Z`),
        value,
      })),
      skipDuplicates: true,
    });
  }
  t(`✓ Step3 done: ${snapshotRows.length} snapshots`);

  // ── Step 4: actual 업데이트
  // FRED는 참조기간(reference period) 기준 날짜를 반환 (예: 4월 CPI → 2026-04-01)
  // DB economic_events는 실제 발표일(release date) 기준 (예: 6월 9일 발표)
  // → 날짜 직접 매칭 불가. 참조일 이후 90일 이내에서 가장 가까운 미래 이벤트를 찾아 업데이트
  t('▶ Step4 start: DB updateMany');
  let updatedEvents = 0;
  await Promise.all(
    actualRows.map(async ({ seriesId, date, value }) => {
      const { titleKeyword } = SERIES_CONFIG.find((s) => s.seriesId === seriesId)!;
      const refDate = new Date(`${date}T00:00:00Z`);
      const windowEnd = new Date(refDate);
      windowEnd.setDate(windowEnd.getDate() + 90);

      // 참조기간 이후 90일 이내의 가장 이른 actual=null 이벤트를 찾아 업데이트
      const event = await db.economicEvent.findFirst({
        where: {
          title: { contains: titleKeyword, mode: 'insensitive' },
          actual: null,
          date: { gt: refDate, lte: windowEnd },
        },
        orderBy: { date: 'asc' },
      });
      if (event) {
        await db.economicEvent.update({ where: { id: event.id }, data: { actual: value } });
        updatedEvents++;
        log.push(`  ✓ actual updated: "${titleKeyword}" ref=${date} → release=${event.date.toISOString().slice(0, 10)} value=${value}`);
        results[seriesId].eventUpdated = true;
      }
    }),
  );
  t(`✓ Step4 done: ${updatedEvents} events updated`);

  return { results, updatedEvents, totalSnapshots: snapshotRows.length };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.FRED_API_KEY) {
    return NextResponse.json({ ok: false, error: 'FRED_API_KEY not set' }, { status: 400 });
  }

  const startedAt = Date.now();
  const log: string[] = [];

  try {
    // 전체 작업을 50초 안에 강제 종료 — 레벨/actual 이중 fetch로 호출 수가 늘어 여유를 더 둠
    const { results, updatedEvents, totalSnapshots } = await withTimeout(
      runUpdate(log, startedAt),
      50_000,
    );

    log.push(`▶ Total — ${totalSnapshots} snapshots, ${updatedEvents} events updated`);
    return NextResponse.json({ ok: true, results, log, durationMs: Date.now() - startedAt });

  } catch (err) {
    const msg = String(err);
    log.push(`✗ ${msg}`);
    console.error('[cron/fred-update]', err);
    return NextResponse.json({ ok: false, error: msg, log, durationMs: Date.now() - startedAt });

  } finally {
    // await 하지 않음 — disconnect 대기 중 hang이 발생해 60s 초과 504를 유발했음
    db.$disconnect().catch(() => {});
  }
}

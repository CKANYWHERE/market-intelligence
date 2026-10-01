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
// NOTE: FRED is a fallback. The economic_events schedule itself comes from a
// hardcoded BLS/BEA/Census release calendar (see lib/batch/economic-calendar-2026.ts)
// since Finnhub's /calendar/economic and FMP's economic-calendar are both
// paid-plan-only now. FRED only fills in `actual` for events still null.
// FRED revised data may differ slightly from the initial-release values.
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
  { seriesId: 'MICH',     titleKeyword: 'Michigan',            actualUnits: undefined   }, // "Michigan Consumer Sentiment" (실제로는 기대인플레이션 series)
  { seriesId: 'GDPC1',    titleKeyword: 'GDP',                 actualUnits: 'pca'       }, // Real GDP — pca = 분기 연율 성장률 %("GDP q/q")
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
  // limit=20 — ICSA(신규실업수당청구)처럼 주간 지표는 "최신 1개"만 가져오면
  // 과거 몇 주치 actual이 밀려서 영영 안 채워짐. 여러 개 받아서 Step4에서
  // 전부 순회 매칭 (이미 actual이 있는 이벤트는 where 조건에서 걸러져 안전)
  t('▶ Step1b start: FRED actual-units fetch sequential');
  const actualFetchResults: PromiseSettledResult<FredObs[]>[] = [];
  for (const { seriesId, actualUnits } of SERIES_CONFIG) {
    const result = await getFredSeries(seriesId, 20, actualUnits)
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

  // ── Step 2b: actual-매칭용 값 파싱 (시리즈당 최대 20개 — 주간 지표 백로그 포함)
  const actualRows: SnapshotRow[] = [];
  for (let i = 0; i < SERIES_CONFIG.length; i++) {
    const { seriesId } = SERIES_CONFIG[i];
    const result = actualFetchResults[i];
    if (result.status === 'rejected') {
      log.push(`  ✗ ${seriesId} (actual): ${String(result.reason)}`);
      continue;
    }
    for (const obs of result.value) {
      if (obs.value === '.' || obs.value === '') continue;
      const value = parseFloat(obs.value);
      if (!isNaN(value)) actualRows.push({ seriesId, date: obs.date, value });
    }
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
  // 1순위: economic_events.fred_ref_date가 FRED observation 날짜와 정확히 같은
  //   행을 찾아 업데이트 (하드코딩 시드 이벤트는 전부 이 필드가 채워져 있음 —
  //   lib/batch/economic-calendar-2026.ts 참고). 날짜 "추정"이 전혀 없어 재실행
  //   해도 항상 정확함.
  // 2순위(fallback): fred_ref_date가 없는 레거시 이�트(예전 Finnhub 동기화로 만든
  //   CPI/PPI/PCE 등) 전용 — 참조일 이후 90일 이내 가장 이른 actual=null 이벤트로
  //   "추정" 매칭. 이 경로는 재실행 시 이미 채워진 슬롯을 건너뛰고 엉뚱한 미래
  //   슬롯을 잘못 집을 수 있어 정밀하지 않음 — 알려진 한계.
  t('▶ Step4 start: DB updateMany');
  let updatedEvents = 0;
  const bySeries = new Map<string, SnapshotRow[]>();
  for (const row of actualRows) {
    if (!bySeries.has(row.seriesId)) bySeries.set(row.seriesId, []);
    bySeries.get(row.seriesId)!.push(row);
  }

  await Promise.all(
    Array.from(bySeries.entries()).map(async ([seriesId, rows]) => {
      const { titleKeyword } = SERIES_CONFIG.find((s) => s.seriesId === seriesId)!;
      const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

      // "PCE"가 "Core PCE" 제목에도 contains로 걸려버리는 문제 방지 — titleKeyword
      // 자체가 "Core"를 포함하지 않으면, "Core"가 들어간 제목은 명시적으로 제외
      // (그 반대 방향은 문제 없음: "Core PCE" 검색어는 애초에 plain "PCE" 제목에 안 걸림)
      const titleFilter = titleKeyword.toLowerCase().includes('core')
        ? { contains: titleKeyword, mode: 'insensitive' as const }
        : { contains: titleKeyword, mode: 'insensitive' as const, not: { contains: 'Core' } };

      for (const { date, value } of sorted) {
        const refDate = new Date(`${date}T00:00:00Z`);

        let event = await db.economicEvent.findFirst({
          where: {
            title: titleFilter,
            actual: null,
            fred_ref_date: refDate,
          },
          orderBy: { date: 'asc' },
        });

        if (!event) {
          const windowEnd = new Date(refDate);
          windowEnd.setDate(windowEnd.getDate() + 90);
          event = await db.economicEvent.findFirst({
            where: {
              title: titleFilter,
              actual: null,
              fred_ref_date: null, // fred_ref_date가 있는 이벤트는 위에서 이미 못 찾은 것 — 추정 매칭 대상에서 제외
              date: { gt: refDate, lte: windowEnd },
            },
            orderBy: { date: 'asc' },
          });
        }

        if (event) {
          await db.economicEvent.update({ where: { id: event.id }, data: { actual: value } });
          updatedEvents++;
          log.push(`  ✓ actual updated: "${titleKeyword}" ref=${date} → release=${event.date.toISOString().slice(0, 10)} value=${value}`);
          results[seriesId].eventUpdated = true;
        }
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

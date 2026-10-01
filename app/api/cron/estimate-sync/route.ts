// Cron: Estimate Sync (consensus 예상치 보강)
// Schedule: 매일 1회 — forexFactoryCalendar.ts 참고 (비공식 피드, "이번 주"분만 제공)
//
// economic_events의 estimate/prev가 비어있는 행을 찾아서, Forex Factory
// 캘린더의 forecast/previous 값으로 채움. 날짜 소스가 아니라 "보강"이라
// 피드가 끊겨도 날짜/actual에는 영향 없음 (estimate만 계속 null로 남음).
//
// 직접 실행:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/estimate-sync

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getThisWeekUsEvents, parseFfRaw, type FfEvent, type FfSuffix } from '@/lib/api/forexFactoryCalendar';

export const maxDuration = 30;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * FF 타이틀(포함 매칭) → economic_events.title 매칭 키워드 + 단위 변환.
 * 더 구체적인 패턴을 먼저 적어서, "Core XXX"가 "XXX" 규칙에 잘못 걸리지 않게 함.
 *
 * toDbValue: FF가 주는 숫자/접미사를 그 지표의 "기존 DB 저장 관례"(=
 * fred-update가 actual에 쓰는 단위)로 맞춤 — 지표마다 FRED 원본 단위가
 * 달라서 전부 "raw count"로 통일하면 안 됨:
 *  - NFP/ADP: FRED(PAYEMS, chg)가 이미 "천 명" 단위 숫자를 그대로 저장
 *    (예: 162 = 162천 명) → FF의 "89K"는 K를 떼고 숫자만 사용
 *  - JOLTS: FRED(JTSJOL)도 "천 건" 단위로 저장 (예: 7079 = 7,079천 건)
 *    → FF의 "7.23M"(백만 건)은 ×1000 해서 "천 건" 단위로 맞춤
 *  - Jobless Claims: FRED(ICSA)는 raw 건수 그대로 저장 (예: 197000)
 *    → FF의 "201K"는 ×1000 해서 raw 건수로 변환
 *  - %/지수형(실업률, PMI, GDP/소매판매/내구재 MoM%, 물가 MoM%)은 그대로
 */
const FF_TITLE_MAP: Array<{
  ffContains: string;
  dbKeyword:  string;
  toDbValue:  (value: number, suffix: FfSuffix) => number;
}> = [
  { ffContains: 'ADP Non-Farm Employment Change', dbKeyword: 'ADP Non-Farm Employment Change', toDbValue: (v) => v },
  { ffContains: 'Non-Farm Employment Change',      dbKeyword: 'Non Farm Payrolls',               toDbValue: (v) => v },
  { ffContains: 'Unemployment Rate',               dbKeyword: 'Unemployment Rate',               toDbValue: (v) => v },
  { ffContains: 'JOLTS Job Openings',              dbKeyword: 'JOLTS Job Openings',               toDbValue: (v, s) => s === 'M' ? v * 1000 : v },
  { ffContains: 'Unemployment Claims',             dbKeyword: 'Initial Jobless Claims',           toDbValue: (v, s) => s === 'K' ? v * 1000 : v },
  { ffContains: 'GDP q/q',                         dbKeyword: 'GDP q/q',                          toDbValue: (v) => v },
  { ffContains: 'Durable Goods Orders m/m',        dbKeyword: 'Durable Goods Orders m/m',         toDbValue: (v) => v },
  { ffContains: 'ISM Manufacturing PMI',           dbKeyword: 'ISM Manufacturing PMI',            toDbValue: (v) => v },
  { ffContains: 'ISM Services PMI',                dbKeyword: 'ISM Services PMI',                 toDbValue: (v) => v },
  { ffContains: 'ISM Non-Manufacturing PMI',       dbKeyword: 'ISM Services PMI',                 toDbValue: (v) => v },
  { ffContains: 'Core CPI m/m',                    dbKeyword: 'Core Inflation Rate',              toDbValue: (v) => v },
  { ffContains: 'CPI m/m',                         dbKeyword: 'Inflation Rate',                   toDbValue: (v) => v },
  { ffContains: 'Core PCE Price Index m/m',        dbKeyword: 'Core PCE',                         toDbValue: (v) => v },
  { ffContains: 'PCE Price Index m/m',             dbKeyword: 'PCE',                              toDbValue: (v) => v },
  { ffContains: 'Core PPI m/m',                    dbKeyword: 'Core PPI',                         toDbValue: (v) => v },
  { ffContains: 'PPI m/m',                         dbKeyword: 'PPI',                              toDbValue: (v) => v },
  { ffContains: 'Retail Sales m/m',                dbKeyword: 'Retail Sales m/m',                 toDbValue: (v) => v },
];

function matchFf(ffTitle: string) {
  for (const entry of FF_TITLE_MAP) {
    if (ffTitle.includes(entry.ffContains)) return entry;
  }
  return null;
}

/** FF date("2026-10-02T08:30:00-04:00")를 ET 기준 YYYY-MM-DD로 */
function ffDateToEtDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log: string[] = [];
  let updated = 0;
  let skipped = 0;

  try {
    const events: FfEvent[] = await getThisWeekUsEvents();
    log.push(`▶ ${events.length} USD events fetched from Forex Factory`);

    for (const ff of events) {
      const match = matchFf(ff.title);
      if (!match) continue;
      const { dbKeyword: keyword, toDbValue } = match;

      const fc = parseFfRaw(ff.forecast);
      const pv = parseFfRaw(ff.previous);
      const estimate = fc ? toDbValue(fc.value, fc.suffix) : null;
      const prev      = pv ? toDbValue(pv.value, pv.suffix) : null;
      if (estimate === null && prev === null) continue;

      const etDate   = ffDateToEtDateStr(ff.date);
      const dayStart = new Date(`${etDate}T00:00:00Z`);
      const dayEnd   = new Date(`${etDate}T23:59:59Z`);
      // FF 타임스탬프가 ET 기준이라 ±1일 버퍼 (UTC 자정 경계 오차 대비)
      const windowStart = new Date(dayStart.getTime() - 86_400_000);
      const windowEnd   = new Date(dayEnd.getTime()   + 86_400_000);

      // "PCE" 검색어가 "Core PCE" 제목에도 걸려버리는 문제 방지 (fred-update와 동일 이슈)
      const titleFilter = keyword.toLowerCase().includes('core')
        ? { contains: keyword, mode: 'insensitive' as const }
        : { contains: keyword, mode: 'insensitive' as const, not: { contains: 'Core' } };

      const event = await db.economicEvent.findFirst({
        where: {
          title: titleFilter,
          date:  { gte: windowStart, lte: windowEnd },
        },
        orderBy: { date: 'asc' },
      });

      if (!event) { skipped++; continue; }
      if (event.estimate != null && event.prev != null) { skipped++; continue; }

      await db.economicEvent.update({
        where: { id: event.id },
        data: {
          estimate: event.estimate ?? estimate,
          prev:     event.prev     ?? prev,
        },
      });
      updated++;
      log.push(`  ✓ "${keyword}" ${etDate}: estimate=${estimate} prev=${prev}`);
    }

    log.push(`▶ Done — ${updated} updated, ${skipped} skipped`);
    return NextResponse.json({ ok: true, updated, skipped, log });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[cron/estimate-sync]', err);
    return NextResponse.json({ ok: false, error: msg, log }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

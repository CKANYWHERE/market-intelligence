/**
 * Financial Modeling Prep (FMP) client (server-side only)
 * Used as the economic calendar source — Finnhub's /calendar/economic now
 * returns 403 on the free plan ("You don't have access to this resource").
 *
 * Free tier: https://financialmodelingprep.com (250 req/day)
 */

const BASE_URL = 'https://financialmodelingprep.com/stable/economic-calendar';

function getApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) throw new Error('FMP_API_KEY is not set');
  return key;
}

interface FmpEvent {
  date:               string; // "2026-07-01 08:30:00"
  country:            string; // "US"
  event:              string; // "ISM Manufacturing PMI"
  currency?:          string;
  previous?:          number | null;
  estimate?:          number | null;
  actual?:            number | null;
  change?:            number | null;
  changePercentage?:  number | null;
  impact?:            string; // "Low" | "Medium" | "High"
}

/**
 * sync-calendar.ts가 기대하는 Finnhub 응답 모양({ economicCalendar: [...] })과
 * 필드 이름(country/impact/time/event/unit/actual/estimate/prev/id)으로 맞춰서
 * 반환 — 호출부(sync-calendar.ts) 변경을 최소화하기 위함.
 */
export async function getEconomicCalendar(
  from: string,
  to: string,
): Promise<{ economicCalendar: Array<Record<string, unknown>> }> {
  const url = new URL(BASE_URL);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  url.searchParams.set('apikey', getApiKey());

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') {
      throw new Error('FMP economic_calendar → timeout (8s)');
    }
    throw err;
  }
  clearTimeout(timer);

  if (!res.ok) throw new Error(`FMP economic_calendar → HTTP ${res.status}`);

  const events = (await res.json()) as FmpEvent[];

  const economicCalendar = events.map((e) => ({
    id:       `fmp_${e.country}_${e.event}_${e.date}`.replace(/\s+/g, '_'),
    country:  e.country,
    impact:   (e.impact ?? 'low').toLowerCase(),
    time:     e.date,
    event:    e.event,
    unit:     null,
    actual:   e.actual   ?? null,
    estimate: e.estimate ?? null,
    prev:     e.previous ?? null,
  }));

  return { economicCalendar };
}

/**
 * Forex Factory 캘린더 피드 (비공식, 무료, 키 불필요)
 * https://nfs.faireconomy.media/ff_calendar_thisweek.json
 *
 * 용도: estimate(컨센서스 예상치) 보강용 — "이번 주" 발표분만 제공하므로
 * 캘린더 일정 자체(존재 여부/날짜)의 소스로는 쓰지 않음. 그건
 * economic-calendar-2026.ts(BLS/BEA/Census 공식 일정)가 담당.
 * 비공식 피드라 언제든 끊길 수 있음 — 끊겨도 날짜/actual은 영향 없고
 * estimate만 비어있는 상태로 남음 (graceful degradation).
 */

const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

export interface FfEvent {
  title:    string;
  country:  string;
  date:     string; // ISO with -04:00/-05:00 offset
  impact:   string;
  forecast: string;
  previous: string;
}

export type FfSuffix = '' | 'K' | 'M' | 'B' | '%';

/**
 * "89.2" | "7.23M" | "0.3%" | "-116.3B" | "" → { value, suffix }
 * 절대 단위(raw count)로 바꾸지 않고 숫자와 접미사를 그대로 분리만 함 —
 * 지표마다 DB에 저장하는 기존 단위 관례(예: JOLTS/NFP는 raw가 아니라
 * "천 단위" 그 자체가 저장값)가 달라서, 변환은 호출부(estimate-sync)가
 * 지표별로 판단해야 함.
 */
export function parseFfRaw(raw: string): { value: number; suffix: FfSuffix } | null {
  const s = raw.trim();
  if (!s) return null;
  const suffix = (s.match(/[%KMB]$/)?.[0] ?? '') as FfSuffix;
  const value = parseFloat(s.replace(/[%KMB]/g, ''));
  if (isNaN(value)) return null;
  return { value, suffix };
}

export async function getThisWeekUsEvents(): Promise<FfEvent[]> {
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Forex Factory calendar → HTTP ${res.status}`);

  const all = (await res.json()) as FfEvent[];
  return all.filter((e) => e.country === 'USD');
}

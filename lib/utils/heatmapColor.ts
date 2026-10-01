/**
 * 히트맵 diverging 색상 — 상승(파랑) ↔중립(회색)↔ 하락(빨강)
 *
 * 초록/빨강(야후 파이낸스 관례) 대신 파랑/빨강을 씀 — 적록색맹(deuteranopia)
 * 시뮬레이션에서 초록/빨강 ΔE 4.1로 접근성 기준(8 이상) 크게 미달 확인 후
 * 대체. dataviz 스킬의 diverging pair 기본값과 동일한 조합.
 *
 * 다크 모드 전용 사이트라 다크 스텝 하나만 사용.
 */

const NEUTRAL: [number, number, number] = [0x38, 0x38, 0x35]; // #383835
const POSITIVE: [number, number, number] = [0x39, 0x87, 0xe5]; // #3987e5 (blue, dark step)
const NEGATIVE: [number, number, number] = [0xe6, 0x67, 0x67]; // #e66767 (red, dark step)

// 이 등락률(%) 이상이면 완전 포화색 — 그 이상은 색 차이로 구분 안 되므로 숫자 라벨이 대신함
const MAX_MAGNITUDE = 3;

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** day_pct(%) → 셀 배경색 hex */
export function dayPctToColor(dayPct: number | null): string {
  if (dayPct === null) return toHex(NEUTRAL);
  const t = Math.min(Math.abs(dayPct) / MAX_MAGNITUDE, 1);
  const pole = dayPct >= 0 ? POSITIVE : NEGATIVE;
  return toHex([
    lerp(NEUTRAL[0], pole[0], t),
    lerp(NEUTRAL[1], pole[1], t),
    lerp(NEUTRAL[2], pole[2], t),
  ]);
}

/** 배경색 밝기에 따라 검정/흰색 텍스트 중 가독성 좋은 쪽 선택 (WCAG 상대휘도 근사) */
export function textColorFor(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0b0b0b' : '#ffffff';
}

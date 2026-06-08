/**
 * 이벤트 URL slug 생성 / 파싱
 *
 * 형식: {kebab-title}-{YYYY-MM-DD}
 * 예시: fomc-rate-decision-2026-06-17
 *       cpi-inflation-rate-yoy-2026-06-10
 *       spacex-ipo-2026-06-12
 */

export function toSlug(title: string, date: string): string {
  const kebab = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${kebab}-${date}`;
}

/**
 * Market Analysis 전용 slug 생성
 *
 * 일반 toSlug와 달리 등락률 표현을 보존:
 *   -4.8%  →  down-4-8pct
 *   +4.8%  →  up-4-8pct
 *   QQQ -4.8%: Jobs Shock Triggers Worst Tech Selloff Since April 2025
 *   →  qqq-down-4-8pct-jobs-shock-triggers-worst-tech-selloff-since-2026-06-09
 *
 * URL 길이 제한: 약 60자 (날짜 제외), 단어 경계에서 truncate
 */
export function toAnalysisSlug(title: string, date: string): string {
  const normalized = title
    // -4.8% → "down 4-8pct",  +4.8% → "up 4-8pct"
    .replace(/([+-])(\d+\.?\d*)\s*%/g, (_, sign, num) =>
      `${sign === '-' ? 'down' : 'up'} ${num.replace('.', '-')}pct`,
    )
    .replace(/[:%]+/g, ' '); // 콜론·퍼센트 기호 제거

  const kebab = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // 60자 초과 시 마지막 단어 경계에서 자르기
  const truncated =
    kebab.length > 60
      ? kebab.slice(0, 60).replace(/-[^-]*$/, '')
      : kebab;

  return `${truncated}-${date}`;
}

/**
 * slug에서 날짜를 추출 (마지막 10자 = YYYY-MM-DD)
 */
export function slugToDate(slug: string): string | null {
  const match = slug.match(/(\d{4}-\d{2}-\d{2})$/);
  return match ? match[1] : null;
}

/**
 * slug에서 title 부분 추출 (날짜 앞부분)
 * 역변환은 완전 복원 불가 — DB 조회 후 정규화 비교 사용
 */
export function slugToTitlePart(slug: string): string {
  const date = slugToDate(slug);
  if (!date) return slug;
  return slug.slice(0, slug.length - date.length - 1);
}

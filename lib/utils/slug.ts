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

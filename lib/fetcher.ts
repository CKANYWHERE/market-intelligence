/**
 * SWR 공통 fetcher
 * 모든 /api/* 호출에서 재사용
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

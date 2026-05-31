/**
 * FRED API client (server-side only)
 * Base: https://api.stlouisfed.org/fred/series/observations
 * Used by: cron/fred-update, future detail-panel sparkline endpoint
 */

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

function getApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) throw new Error('FRED_API_KEY is not set');
  return key;
}

export async function getFredSeries(
  seriesId: string,
  limit = 24,
): Promise<Array<{ date: string; value: string }>> {
  const url = new URL(BASE_URL);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', getApiKey());
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', String(limit));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000); // 10s per series

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`FRED ${seriesId} → timeout (10s)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`FRED ${seriesId} → HTTP ${res.status}`);

  const data = await res.json() as { observations: Array<{ date: string; value: string }> };
  return data.observations ?? [];
}

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
  units?: string, // e.g. 'pch' (MoM % change), 'ch1' (period change), undefined = raw level
): Promise<Array<{ date: string; value: string }>> {
  const url = new URL(BASE_URL);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', getApiKey());
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', String(limit));
  if (units) url.searchParams.set('units', units);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === 'AbortError') {
      throw new Error(`FRED ${seriesId} → timeout (5s)`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (!res.ok) throw new Error(`FRED ${seriesId} → HTTP ${res.status}`);

  const data = await res.json() as { observations: Array<{ date: string; value: string }> };
  return data.observations ?? [];
}

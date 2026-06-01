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

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function getFredSeries(
  seriesId: string,
  limit = 24,
  maxRetries = 4,
): Promise<Array<{ date: string; value: string }>> {
  const url = new URL(BASE_URL);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', getApiKey());
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', String(limit));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === 'AbortError') {
        throw new Error(`FRED ${seriesId} → timeout (10s)`);
      }
      throw err;
    }
    clearTimeout(timer);

    // 429 → 지수 백오프 후 재시도 (2s → 4s → 8s → 16s)
    if (res.status === 429) {
      if (attempt === maxRetries) {
        throw new Error(`FRED ${seriesId} → HTTP 429 (exhausted ${maxRetries} retries)`);
      }
      const waitMs = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s, 16s
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) throw new Error(`FRED ${seriesId} → HTTP ${res.status}`);

    const data = await res.json() as { observations: Array<{ date: string; value: string }> };
    return data.observations ?? [];
  }

  throw new Error(`FRED ${seriesId} → unexpected retry exit`);
}

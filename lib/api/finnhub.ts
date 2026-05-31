const BASE_URL = 'https://finnhub.io/api/v1';

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY is not set');
  return key;
}

async function finnhubFetch(
  path: string,
  params: Record<string, string> = {},
  revalidate = 3600,
): Promise<unknown> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('token', getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { next: { revalidate } });
  if (!res.ok) throw new Error(`Finnhub ${path} → HTTP ${res.status}`);
  return res.json();
}

export const getEconomicCalendar = (from: string, to: string) =>
  finnhubFetch('/calendar/economic', { from, to }, 86400);

export const getEarningsCalendar = (from: string, to: string, symbol?: string) =>
  finnhubFetch(
    '/calendar/earnings',
    symbol ? { from, to, symbol } : { from, to },
    86400,
  );

export const getIpoCalendar = (from: string, to: string) =>
  finnhubFetch('/calendar/ipo', { from, to }, 86400);

export const getQuote = (symbol: string) =>
  finnhubFetch('/quote', { symbol }, 3600);

export const getMarketNews = () =>
  finnhubFetch('/news', { category: 'general', minId: '0' }, 1800);

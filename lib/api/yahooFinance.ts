import { QuoteData } from '@/types/events';

const HEADERS = { 'User-Agent': 'Mozilla/5.0' };

export interface EodCandle {
  date:      string; // YYYY-MM-DD
  open:      number;
  high:      number;
  low:       number;
  close:     number;
  prevClose: number;
}

/**
 * 실시간 현재가 (range=5d, interval=1d)
 *
 * regularMarketPrice = Yahoo Finance 실시간 현재가 (장 중에도 업데이트)
 * prevClose = 가장 최근 "완료된" 세션의 종가
 *   - 장 중: 오늘 캔들은 아직 미완 → 마지막 캔들(어제) 종가
 *   - 장 마감 후: 오늘 캔들 종료 → 어제 캔들 종가
 */
export async function getRealtimeQuote(symbol: string): Promise<QuoteData> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  const res  = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`Yahoo Finance ${symbol} → HTTP ${res.status}`);

  const data   = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo Finance: no result for ${symbol}`);

  const meta       = result.meta;
  const timestamps: number[] = result.timestamp ?? [];
  const closes: number[]     = result.indicators?.quote?.[0]?.close ?? [];
  const current              = meta.regularMarketPrice as number;

  // 마지막 regularMarketTime 날짜 (ET 기준 YYYY-MM-DD)
  const mktDate = new Date((meta.regularMarketTime as number) * 1000)
    .toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // "2026-06-02"

  // 캔들 날짜 매핑 (null 제거)
  const candleCloses: { date: string; close: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null || isNaN(closes[i])) continue;
    const d = new Date(timestamps[i] * 1000)
      .toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    candleCloses.push({ date: d, close: closes[i] });
  }

  // prevClose = mktDate 이전 마지막 완료 캔들의 종가
  const prevCandleClose = [...candleCloses]
    .reverse()
    .find((c) => c.date < mktDate);

  const prevClose = prevCandleClose?.close ?? current;
  const change        = current - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return {
    symbol,
    current,
    change,
    changePercent,
    high:      (meta.regularMarketDayHigh ?? current) as number,
    low:       (meta.regularMarketDayLow  ?? current) as number,
    open:      (meta.regularMarketOpen    ?? current) as number,
    prevClose,
  };
}

/** 3종목 병렬 실시간 조회 */
export async function getRealtimeQuotes(
  symbols: string[],
): Promise<Record<string, QuoteData>> {
  const entries = await Promise.allSettled(
    symbols.map(async (s) => [s, await getRealtimeQuote(s)] as const),
  );
  const result: Record<string, QuoteData> = {};
  for (const r of entries) {
    if (r.status === 'fulfilled') result[r.value[0]] = r.value[1];
  }
  return result;
}

/** 과거 N개월 EOD 캔들 (backfill / cron용) */
export async function getEodCandles(
  symbol: string,
  months = 2,
): Promise<EodCandle[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${months}mo`;
  const res  = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`Yahoo Finance candles ${symbol} → HTTP ${res.status}`);

  const data   = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return [];

  const timestamps: number[] = result.timestamp ?? [];
  const q                     = result.indicators?.quote?.[0] ?? {};
  const opens:  number[]      = q.open  ?? [];
  const highs:  number[]      = q.high  ?? [];
  const lows:   number[]      = q.low   ?? [];
  const closes: number[]      = q.close ?? [];

  const candles: EodCandle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null || isNaN(closes[i])) continue;
    candles.push({
      date:      new Date(timestamps[i] * 1000)
                   .toLocaleDateString('en-CA', { timeZone: 'America/New_York' }),
      open:      opens[i]  ?? closes[i],
      high:      highs[i]  ?? closes[i],
      low:       lows[i]   ?? closes[i],
      close:     closes[i],
      prevClose: i === 0 ? closes[i] : (closes[i - 1] ?? closes[i]),
    });
  }
  return candles;
}

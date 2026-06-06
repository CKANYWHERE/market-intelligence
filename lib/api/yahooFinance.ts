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

type MarketState = 'PRE' | 'REGULAR' | 'POST' | 'CLOSED';

function detectMarketState(currentTradingPeriod: Record<string, { start: number; end: number }> | undefined): MarketState {
  if (!currentTradingPeriod) return 'CLOSED';
  const now = Date.now() / 1000;
  const { pre, regular, post } = currentTradingPeriod as Record<string, { start: number; end: number }>;
  if (pre     && now >= pre.start     && now < pre.end)     return 'PRE';
  if (regular && now >= regular.start && now < regular.end) return 'REGULAR';
  if (post    && now >= post.start    && now < post.end)    return 'POST';
  return 'CLOSED';
}

/**
 * 실시간 현재가
 * - REGULAR/CLOSED: range=5d 일봉에서 regularMarketPrice + 전일 종가
 * - PRE/POST: 추가로 1m 캔들의 마지막 값을 현재가로 사용
 */
export async function getRealtimeQuote(symbol: string): Promise<QuoteData> {
  // ── 1. 5d 일봉 조회 (prevClose + market state 판단) ──────────────
  const url5d = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  const res5d  = await fetch(url5d, { headers: HEADERS, cache: 'no-store' });
  if (!res5d.ok) throw new Error(`Yahoo Finance ${symbol} (5d) → HTTP ${res5d.status}`);

  const data5d   = await res5d.json();
  const result5d = data5d?.chart?.result?.[0];
  if (!result5d) throw new Error(`Yahoo Finance: no result for ${symbol}`);

  const meta       = result5d.meta;
  const closes5d: number[]     = result5d.indicators?.quote?.[0]?.close ?? [];
  const timestamps5d: number[] = result5d.timestamp ?? [];

  // 유효한 (날짜, 종가) 쌍
  const validCandles = timestamps5d
    .map((t: number, i: number) => ({
      date:  new Date(t * 1000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }),
      close: closes5d[i],
    }))
    .filter((c) => c.close != null && !isNaN(c.close));

  // ET 기준 오늘 날짜 — 오늘 부분 캔들(장 중)을 prevClose 계산에서 제외
  const nowET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const completedCandles = validCandles.filter((c) => c.date < nowET);

  // 마지막 완료된 정규장 세션 종가 (= 어제 종가)
  const lastSessionClose = completedCandles.at(-1)?.close ?? (meta.regularMarketPrice as number);

  const marketState = detectMarketState(meta.currentTradingPeriod);

  // ── 2. 현재가 결정 ────────────────────────────────────────────────
  let current = meta.regularMarketPrice as number;

  if (marketState === 'PRE' || marketState === 'POST') {
    // 1m 캔들 (prepost 포함) → 마지막 캔들 종가 = 실제 현재가
    try {
      const url1m = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d&includePrePost=True`;
      const res1m  = await fetch(url1m, { headers: HEADERS, cache: 'no-store' });
      if (res1m.ok) {
        const data1m   = await res1m.json();
        const closes1m: number[] = data1m?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
        const lastClose = [...closes1m].reverse().find((c) => c != null && !isNaN(c));
        if (lastClose) current = lastClose;
      }
    } catch {
      // 1m 실패 시 regularMarketPrice 유지
    }
  }

  // ── 3. prevClose 및 change 계산 ──────────────────────────────────
  // POST: 오늘 정규장 종가 대비
  // 주말(토/일): current = 금요일 종가, changeBase = 목요일 종가 (0% 방지)
  // 그 외: 전일 정규장 종가 대비
  const dayOfWeekET = new Date(nowET + 'T12:00:00').getDay(); // 0=일, 6=토
  const isWeekend   = dayOfWeekET === 0 || dayOfWeekET === 6;

  let changeBase: number;
  if (marketState === 'POST') {
    changeBase = meta.regularMarketPrice as number;
  } else if (isWeekend && completedCandles.length >= 2) {
    changeBase = completedCandles.at(-2)!.close; // 금요일 기준 → 목요일 대비
  } else {
    changeBase = lastSessionClose;
  }

  const change        = current - changeBase;
  const changePercent = changeBase ? (change / changeBase) * 100 : 0;

  return {
    symbol,
    current,
    change,
    changePercent,
    high:        (meta.regularMarketDayHigh ?? current) as number,
    low:         (meta.regularMarketDayLow  ?? current) as number,
    open:        (meta.regularMarketOpen    ?? current) as number,
    prevClose:   changeBase,
    marketState,
  };
}

/** VIX / ^TNX 등 인덱스 단순 조회 (pre/post market 로직 불필요) */
export async function getIndexQuote(
  symbol: string,
): Promise<{ value: number; change: number; changePercent: number }> {
  const encoded = encodeURIComponent(symbol);
  const url     = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=2d`;
  const res     = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (!res.ok) throw new Error(`Yahoo ${symbol} → HTTP ${res.status}`);

  const data   = await res.json();
  const meta   = data?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error(`Yahoo: no meta for ${symbol}`);

  const value     = meta.regularMarketPrice as number;
  const prevClose = (meta.chartPreviousClose ?? meta.previousClose ?? value) as number;
  const change    = value - prevClose;

  return {
    value,
    change,
    changePercent: prevClose ? (change / prevClose) * 100 : 0,
  };
}

/** 여러 심볼 병렬 조회 */
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

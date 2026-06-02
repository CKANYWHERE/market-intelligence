export interface MarketDataPoint {
  date: string;        // YYYY-MM-DD
  closeQQQ: number | null;
  closeSPY: number | null;
  changePctQQQ: number | null; // % change relative to event day
  changePctSPY: number | null;
  dayOffset: number;   // -5 to +5 (0 = event day or closest trading day)
}

async function fetchYahooCandles(
  symbol: string,
  from: Date,
  to: Date,
): Promise<Array<{ date: string; close: number }>> {
  const period1 = Math.floor(from.getTime() / 1000);
  const period2 = Math.floor(to.getTime() / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${period1}&period2=${period2}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    return timestamps
      .map((ts: number, i: number) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        close: closes[i],
      }))
      .filter((d) => d.close != null && !isNaN(d.close));
  } catch {
    return [];
  }
}

export async function getMarketReaction(eventDate: string): Promise<MarketDataPoint[] | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(`${eventDate}T00:00:00Z`);

  // Future events (more than 1 day ahead) — no data yet
  if (eventDay.getTime() > today.getTime() + 86400000) return null;

  const from = new Date(eventDay);
  from.setDate(from.getDate() - 12); // -12 calendar days (~5 trading days buffer)
  const to = new Date(eventDay);
  to.setDate(to.getDate() + 12);

  const [qqqData, spyData] = await Promise.all([
    fetchYahooCandles('QQQ', from, to),
    fetchYahooCandles('SPY', from, to),
  ]);

  if (qqqData.length === 0 && spyData.length === 0) return null;

  // Merge all trading dates and sort
  const allDates = [...new Set([...qqqData.map((d) => d.date), ...spyData.map((d) => d.date)])].sort();
  if (allDates.length === 0) return null;

  // Find closest trading day to event date (on or after)
  let eventIdx = allDates.findIndex((d) => d >= eventDate);
  if (eventIdx === -1) eventIdx = allDates.length - 1;

  // Slice ±5 trading days around event
  const startIdx = Math.max(0, eventIdx - 5);
  const endIdx   = Math.min(allDates.length - 1, eventIdx + 5);
  const window   = allDates.slice(startIdx, endIdx + 1);

  const qqqMap = new Map(qqqData.map((d) => [d.date, d.close]));
  const spyMap = new Map(spyData.map((d) => [d.date, d.close]));

  // Baseline = event day close
  const baseDate = allDates[eventIdx];
  const baseQQQ  = qqqMap.get(baseDate) ?? null;
  const baseSPY  = spyMap.get(baseDate) ?? null;

  return window.map((date) => {
    const closeQQQ = qqqMap.get(date) ?? null;
    const closeSPY = spyMap.get(date) ?? null;
    const offset   = allDates.indexOf(date) - eventIdx;

    return {
      date,
      closeQQQ,
      closeSPY,
      changePctQQQ:
        closeQQQ != null && baseQQQ != null ? ((closeQQQ - baseQQQ) / baseQQQ) * 100 : null,
      changePctSPY:
        closeSPY != null && baseSPY != null ? ((closeSPY - baseSPY) / baseSPY) * 100 : null,
      dayOffset: offset,
    };
  });
}

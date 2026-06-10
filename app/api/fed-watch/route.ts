// GET /api/fed-watch
// Polymarket prediction market 기반 FOMC 금리 결정 확률 계산
// 데이터 소스: gamma-api.polymarket.com (tag_slug=fomc, endDate 범위 필터)
// fallback: data: null (UI에서 graceful hide)

import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

export const dynamic = 'force-dynamic';

export interface FedWatchData {
  meetingDate: string; // YYYY-MM-DD
  cutProb:     number; // 0–100
  holdProb:    number;
  hikeProb:    number;
  currentRate: number; // FRED DFEDTARU 상단 타깃
  impliedRate: number; // currentRate 기준 기대값 (합성)
  source:      'Polymarket';
}

async function getCurrentRate(): Promise<number> {
  const key = process.env.FRED_API_KEY;
  if (!key) return 0;
  const url =
    `https://api.stlouisfed.org/fred/series/observations` +
    `?series_id=DFEDTARU&api_key=${key}&file_type=json&sort_order=desc&limit=1`;
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) return 0;
  const json = await res.json();
  return parseFloat(json?.observations?.[0]?.value ?? '0');
}

async function getNextFomcDate(): Promise<Date | null> {
  const now = new Date();
  const event = await db.economicEvent.findFirst({
    where: {
      category: 'monetary_policy',
      title:    { contains: 'Fed Interest Rate' },
      date:     { gte: now },
    },
    orderBy: { date: 'asc' },
  });
  return event?.date ?? null;
}

interface PolyMarket {
  question:      string;
  outcomePrices: string; // JSON array e.g. '["0.0035","0.9965"]'
  outcomes:      string; // JSON array e.g. '["Yes","No"]'
}

interface PolyEvent {
  title:   string;
  markets: PolyMarket[];
}

async function getPolymarketOdds(fomcDate: Date): Promise<{ cutProb: number; holdProb: number; hikeProb: number } | null> {
  // FOMC 날짜 ±3일 범위로 조회
  const min = new Date(fomcDate); min.setDate(min.getDate() - 3);
  const max = new Date(fomcDate); max.setDate(max.getDate() + 3);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url =
    `https://gamma-api.polymarket.com/events` +
    `?tag_slug=fomc&end_date_min=${fmt(min)}&end_date_max=${fmt(max)}&limit=10`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal:  AbortSignal.timeout(6000),
    cache:   'no-store',
  });
  if (!res.ok) return null;

  const events: PolyEvent[] = await res.json();

  // "Fed Decision in {month}?" 이벤트 찾기
  const event = events.find(
    (e) => /fed decision in/i.test(e.title) && Array.isArray(e.markets),
  );
  if (!event) return null;

  // outcomePrices[0] = "Yes" 확률
  function yesPrice(m: PolyMarket): number {
    try {
      const prices   = JSON.parse(m.outcomePrices) as string[];
      const outcomes = JSON.parse(m.outcomes)      as string[];
      const idx = outcomes.findIndex((o) => o.toLowerCase() === 'yes');
      return parseFloat(prices[idx >= 0 ? idx : 0] ?? '0');
    } catch { return 0; }
  }

  const q = (m: PolyMarket) => m.question.toLowerCase();

  const cut25  = event.markets.find((m) => q(m).includes('decrease') && q(m).includes('25'));
  const cut50  = event.markets.find((m) => q(m).includes('decrease') && q(m).includes('50'));
  const hold   = event.markets.find((m) => q(m).includes('no change'));
  const hike25 = event.markets.find((m) => q(m).includes('increase') && q(m).includes('25'));
  const hike50 = event.markets.find((m) => q(m).includes('increase') && q(m).includes('50'));

  const cutProb  = Math.round(((cut25 ? yesPrice(cut25) : 0) + (cut50  ? yesPrice(cut50)  : 0)) * 1000) / 10;
  const hikeProb = Math.round(((hike25? yesPrice(hike25): 0) + (hike50 ? yesPrice(hike50) : 0)) * 1000) / 10;
  const holdProb = Math.round((hold ? yesPrice(hold) : Math.max(0, 1 - (cutProb + hikeProb) / 100)) * 1000) / 10;

  return { cutProb, holdProb, hikeProb };
}

export async function GET() {
  try {
    const [currentRate, fomcDate] = await Promise.all([
      getCurrentRate(),
      getNextFomcDate(),
    ]);

    if (!fomcDate || currentRate === 0) {
      return NextResponse.json({ data: null, error: 'Missing rate or FOMC date' });
    }

    const odds = await getPolymarketOdds(fomcDate);
    if (!odds) {
      return NextResponse.json({ data: null, error: 'Polymarket data unavailable' });
    }

    const { cutProb, holdProb, hikeProb } = odds;

    // 합성 내재금리: currentRate에서 기대 변동 반영
    const impliedRate = parseFloat(
      (currentRate - (cutProb / 100) * 0.25 + (hikeProb / 100) * 0.25).toFixed(4),
    );

    const data: FedWatchData = {
      meetingDate: fomcDate.toISOString().slice(0, 10),
      cutProb,
      holdProb,
      hikeProb,
      currentRate,
      impliedRate,
      source: 'Polymarket',
    };

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (err) {
    console.error('[fed-watch]', err);
    return NextResponse.json({ data: null, error: String(err) });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

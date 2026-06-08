// GET /api/fed-watch
// 30-Day Fed Funds Futures (ZQ, Yahoo Finance) + FRED 현재 금리로 cut 확률 계산
// 방법: FOMC 개최월 다음 달 ZQ 선물가격으로 포스트-미팅 내재금리 추출
//   implied_rate  = 100 - futures_price
//   prob_cut      = (current_rate - implied_rate) / 0.25  (25bp 단위 기준)

import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getIndexQuote } from '@/lib/api/yahooFinance';

export const dynamic = 'force-dynamic';

export interface FedWatchData {
  meetingDate: string; // YYYY-MM-DD
  cutProb:     number; // 0–100
  holdProb:    number;
  hikeProb:    number; // 0–100 — 인상 확률 (impliedRate > currentRate)
  currentRate: number; // FOMC 현재 상단 타깃
  impliedRate: number; // ZQ 내재금리
}

// ZQ 월 코드 (CME/Yahoo Finance 표기)
const MONTH_LETTER = ['F','G','H','J','K','M','N','Q','U','V','X','Z'];

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

export async function GET() {
  try {
    const [currentRate, fomcDate] = await Promise.all([
      getCurrentRate(),
      getNextFomcDate(),
    ]);

    if (!fomcDate || currentRate === 0) {
      return NextResponse.json({ data: null, error: 'Missing rate or FOMC date' });
    }

    // FOMC 다음 달 ZQ 계약 → 포스트-미팅 금리를 가장 깔끔하게 반영
    const afterMonth = new Date(fomcDate);
    afterMonth.setMonth(afterMonth.getMonth() + 1);
    const m   = afterMonth.getMonth();       // 0-indexed
    const y2  = afterMonth.getFullYear() % 100; // 2-digit year
    const zqSymbol = `ZQ${MONTH_LETTER[m]}${y2 < 10 ? '0' + y2 : y2}.CBT`;

    const quote = await getIndexQuote(zqSymbol);
    const impliedRate = parseFloat((100 - quote.value).toFixed(4));

    // 25bp 단위 cut / hold / hike 확률 계산
    // diff > 0 → 인하 priced in, diff < 0 → 인상 priced in
    const diff     = currentRate - impliedRate;
    const rawProb  = diff / 0.25; // 단위: 횟수 (1 = 25bp 완전 반영)
    const cutProb  = Math.round(Math.max(0, Math.min(1,  rawProb)) * 1000) / 10;
    const hikeProb = Math.round(Math.max(0, Math.min(1, -rawProb)) * 1000) / 10;
    const holdProb = Math.round((100 - cutProb - hikeProb) * 10) / 10;

    const data: FedWatchData = {
      meetingDate: fomcDate.toISOString().slice(0, 10),
      cutProb,
      holdProb,
      hikeProb,
      currentRate,
      impliedRate,
    };

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=60' } },
    );
  } catch (err) {
    console.error('[fed-watch]', err);
    return NextResponse.json({ data: null, error: String(err) });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

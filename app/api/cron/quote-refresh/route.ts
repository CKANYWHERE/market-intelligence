// Cron: ETF EOD Snapshot (upsert by ET date)
// Schedule: 매주 월~금 21:00–23:00 UTC (5 PM–7 PM ET, 장 마감 후 1시간마다)
//           이미 오늘 데이터가 있으면 최신값으로 업데이트, 없으면 신규 삽입
//
// 직접 실행:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/quote-refresh

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getRealtimeQuote } from '@/lib/api/yahooFinance';

export const maxDuration = 60;

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'] as const;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms),
    ),
  ]);
}

/** ET 기준 오늘 날짜 YYYY-MM-DD */
function todayET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const log: string[] = [];
  let refreshed = 0;

  try {
    const today    = todayET();
    const dayStart = new Date(`${today}T00:00:00-05:00`);
    const dayEnd   = new Date(`${today}T23:59:59-05:00`);

    log.push(`▶ EOD snapshot for ${today} (ET)`);

    const results = await withTimeout(
      Promise.allSettled(
        SYMBOLS.map(async (symbol) => {
          const q = await getRealtimeQuote(symbol);

          // 오늘 날짜 기준 기존 행 조회
          const existing = await db.etfQuote.findFirst({
            where: { symbol, quoted_at: { gte: dayStart, lte: dayEnd } },
          });

          if (existing) {
            // 이미 있으면 최신 가격으로 업데이트
            await db.etfQuote.update({
              where: { id: existing.id },
              data: {
                price:          q.current,
                change:         q.change,
                change_percent: q.changePercent,
                high:           q.high,
                low:            q.low,
                open:           q.open,
                prev_close:     q.prevClose,
                quoted_at:      new Date(),
              },
            });
            log.push(`  ↻ ${symbol}: $${q.current.toFixed(2)} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%) — updated`);
          } else {
            // 없으면 신규 삽입
            await db.etfQuote.create({
              data: {
                symbol,
                price:          q.current,
                change:         q.change,
                change_percent: q.changePercent,
                high:           q.high,
                low:            q.low,
                open:           q.open,
                prev_close:     q.prevClose,
                quoted_at:      new Date(),
              },
            });
            log.push(`  ✓ ${symbol}: $${q.current.toFixed(2)} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%) — inserted`);
          }

          refreshed++;
          return q;
        }),
      ),
      20_000,
    );

    const allOk = results.every((r) => r.status === 'fulfilled');
    return NextResponse.json({ ok: allOk, refreshed, log, durationMs: Date.now() - startedAt });
  } catch (err) {
    console.error('[cron/quote-refresh]', err);
    return NextResponse.json(
      { ok: false, error: String(err), log, durationMs: Date.now() - startedAt },
      { status: 500 },
    );
  } finally {
    db.$disconnect().catch(() => {});
  }
}

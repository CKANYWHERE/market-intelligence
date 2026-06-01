// Cron: ETF Quote Refresh
// Schedule: hourly during US market hours — vercel.json cron: "30 13-21 * * 1-5" (UTC = 09:30 ET)
//
// 직접 실행:
//   curl http://localhost:3000/api/cron/quote-refresh

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getQuote } from '@/lib/api/finnhub';

export const maxDuration = 60;

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'] as const;
type RawQuote = Record<string, unknown>;

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

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const log: string[] = [];
  log.push('▶ Fetching ETF quotes in parallel...');

  try {
    const results = await withTimeout(Promise.allSettled(
      SYMBOLS.map(async (symbol) => {
        const q = (await getQuote(symbol)) as RawQuote;

        const price         = Number(q.c);
        const change        = Number(q.d);
        const changePercent = Number(q.dp);
        const high          = Number(q.h);
        const low           = Number(q.l);
        const open          = Number(q.o);
        const prevClose     = Number(q.pc);
        const quotedAt      = q.t
          ? new Date(Number(q.t) * 1000)
          : new Date();

        if (isNaN(price) || price === 0) {
          throw new Error(`Invalid quote for ${symbol}: ${JSON.stringify(q)}`);
        }

        await db.etfQuote.create({
          data: {
            symbol,
            price,
            change,
            change_percent: changePercent,
            high,
            low,
            open,
            prev_close:  prevClose,
            quoted_at:   quotedAt,
          },
        });

        return { symbol, price, changePercent };
      }),
    ), 20_000);

    const output: Record<string, unknown> = {};
    for (let i = 0; i < SYMBOLS.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        output[SYMBOLS[i]] = r.value;
        log.push(`  ✓ ${SYMBOLS[i]}: $${r.value.price.toFixed(2)} (${r.value.changePercent >= 0 ? '+' : ''}${r.value.changePercent.toFixed(2)}%)`);
      } else {
        output[SYMBOLS[i]] = { error: String(r.reason) };
        log.push(`  ✗ ${SYMBOLS[i]}: ${String(r.reason)}`);
      }
    }

    return NextResponse.json({
      ok:  results.every((r) => r.status === 'fulfilled'),
      quotes: output,
      log,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error('[cron/quote-refresh]', err);
    return NextResponse.json({ ok: false, error: String(err), log, durationMs: Date.now() - startedAt }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

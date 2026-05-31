/**
 * 히스토리 데이터 백필 엔드포인트
 * GET /api/admin/backfill?from=2026-04-01&to=2026-05-31
 *
 * Finnhub 무료 티어 rate limit(60 req/min) 방어를 위해
 * 한 달씩 쪼개서 순차 호출함.
 *
 * 사용 예:
 *   curl "http://localhost:3000/api/admin/backfill?from=2026-04-01&to=2026-05-31"
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncCalendar } from '@/lib/batch/sync-calendar';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

/** "2026-04-01" ~ "2026-05-31" → [["2026-04-01","2026-04-30"], ["2026-05-01","2026-05-31"]] */
function splitByMonth(from: string, to: string): Array<[string, string]> {
  const chunks: Array<[string, string]> = [];
  const end = new Date(`${to}T00:00:00Z`);
  let cur   = new Date(`${from}T00:00:00Z`);

  while (cur <= end) {
    const chunkFrom = cur.toISOString().slice(0, 10);
    const lastDay   = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 0));
    const chunkTo   = (lastDay <= end ? lastDay : end).toISOString().slice(0, 10);
    chunks.push([chunkFrom, chunkTo]);
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
  }
  return chunks;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp   = req.nextUrl.searchParams;
  const from = sp.get('from');
  const to   = sp.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from, to 파라미터 필요. 예: ?from=2026-04-01&to=2026-05-31' },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json(
      { error: '날짜 형식 오류. YYYY-MM-DD 로 입력하세요.' },
      { status: 400 },
    );
  }

  if (from > to) {
    return NextResponse.json({ error: 'from이 to보다 클 수 없습니다.' }, { status: 400 });
  }

  try {
    const startedAt = Date.now();
    const chunks    = splitByMonth(from, to);
    const results: Array<{ chunk: string; counts: object; durationMs: number }> = [];

    for (const [chunkFrom, chunkTo] of chunks) {
      const result = await syncCalendar(chunkFrom, chunkTo);
      results.push({ chunk: `${chunkFrom} → ${chunkTo}`, counts: result.counts, durationMs: result.durationMs });

      // Finnhub rate limit 방어: 청크 사이 1초 대기
      if (chunks.indexOf([chunkFrom, chunkTo]) < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    const total = results.reduce(
      (acc, r) => {
        const c = r.counts as { economic: number; earnings: number; ipo: number };
        acc.economic += c.economic;
        acc.earnings += c.earnings;
        acc.ipo      += c.ipo;
        return acc;
      },
      { economic: 0, earnings: 0, ipo: 0 },
    );

    return NextResponse.json({
      ok:         true,
      range:      `${from} → ${to}`,
      chunks:     chunks.length,
      total,
      durationMs: Date.now() - startedAt,
      results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/backfill]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

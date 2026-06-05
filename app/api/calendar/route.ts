import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { CalendarEvent, EventCategory, Importance } from '@/types/events';
import { getMonthRange } from '@/lib/utils/calendar';

// Prisma row → CalendarEvent 변환 헬퍼
function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);

  const { from, to } = getMonthRange(year, month);
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate   = new Date(`${to}T23:59:59Z`);

  // ── 3개 테이블 병렬 조회 ─────────────────────────────────────
  const [ecoRows, earnRows, ipoRows] = await Promise.all([
    db.economicEvent.findMany({
      where:   { date: { gte: fromDate, lte: toDate } },
      orderBy: { date: 'asc' },
    }),
    db.earningsEvent.findMany({
      where:   { date: { gte: fromDate, lte: toDate } },
      orderBy: { date: 'asc' },
    }),
    db.ipoEvent.findMany({
      where:   { date: { gte: fromDate, lte: toDate } },
      orderBy: { date: 'asc' },
    }),
  ]);

  const events: CalendarEvent[] = [];

  // ── Economic Events ──────────────────────────────────────────
  for (const row of ecoRows) {
    events.push({
      id:         `eco-${row.id}`,
      date:       toDateStr(row.date),
      time:       row.time ?? undefined,
      title:      row.title,
      category:   row.category as EventCategory,
      importance: row.importance as Importance,
      country:    'US',
      actual:     toNum(row.actual),
      estimate:   toNum(row.estimate),
      prev:       toNum(row.prev),
      unit:       row.unit ?? undefined,
    });
  }

  // ── Earnings Events ──────────────────────────────────────────
  for (const row of earnRows) {
    events.push({
      id:              `earn-${row.id}`,
      date:            toDateStr(row.date),
      title:           `${row.symbol} Earnings`,
      category:        'earnings',
      importance:      'high',
      symbol:          row.symbol,
      epsActual:       toNum(row.eps_actual),
      epsEstimate:     toNum(row.eps_estimate),
      hour:            row.hour ?? undefined,
      quarter:         row.quarter ?? undefined,
      year:            row.year ?? undefined,
    });
  }

  // ── IPO Events ───────────────────────────────────────────────
  for (const row of ipoRows) {
    events.push({
      id:              `ipo-${row.id}`,
      date:            toDateStr(row.date),
      title:           `${row.company} IPO`,
      category:        'ipo',
      importance:      'high',
      symbol:          row.symbol ?? undefined,
      exchange:        row.exchange ?? undefined,
      price:           row.price != null ? String(row.price) : undefined,
      // BigInt → number (IPO 주식 수는 Number.MAX_SAFE_INTEGER 이내)
      numberOfShares:  row.number_of_shares != null ? Number(row.number_of_shares) : undefined,
      totalSharesValue: toNum(row.total_shares_value) ?? undefined,
      status:          row.status ?? undefined,
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ events, year, month }, {
    headers: {
      // DB 조회 결과: 1시간 캐시 (배치가 하루 1회 갱신하므로 충분)
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

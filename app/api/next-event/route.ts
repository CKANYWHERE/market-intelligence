/**
 * GET /api/next-event
 *
 * 오늘 이후 high-importance 이벤트 최대 3개를 반환.
 * 헤더 카운트다운 컴포넌트용.
 *
 * Response: { events: NextEvent[] }
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { EventCategory } from '@/types/events';

export interface NextEvent {
  id:       string;
  title:    string;
  date:     string; // YYYY-MM-DD
  time?:    string; // HH:MM ET
  category: EventCategory;
}

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export async function GET() {
  try {
    // ET 기준 오늘 자정 (UTC-5 고정, DST 무시)
    const nowUtc  = new Date();
    const todayET = new Date(nowUtc.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    todayET.setHours(0, 0, 0, 0);
    // ET 자정을 UTC로 변환하여 DB 쿼리에 사용
    const offsetMs   = todayET.getTime() - nowUtc.getTime() + nowUtc.getTime();
    const todayStart = new Date(todayET.getTime() + (nowUtc.getTime() - new Date(nowUtc.toLocaleString('en-US', { timeZone: 'America/New_York' })).getTime()));

    const twoMonths = new Date(todayStart);
    twoMonths.setMonth(twoMonths.getMonth() + 2);

    const [ecoRows, earnRows, ipoRows] = await Promise.all([
      db.economicEvent.findMany({
        where:   { date: { gte: todayStart, lte: twoMonths }, importance: 'high' },
        orderBy: { date: 'asc' },
        take:    10,
        select:  { id: true, title: true, date: true, time: true, category: true },
      }),
      db.earningsEvent.findMany({
        where:   { date: { gte: todayStart, lte: twoMonths } },
        orderBy: { date: 'asc' },
        take:    5,
        select:  { id: true, symbol: true, date: true },
      }),
      db.ipoEvent.findMany({
        where:   { date: { gte: todayStart, lte: twoMonths } },
        orderBy: { date: 'asc' },
        take:    5,
        select:  { id: true, company: true, date: true },
      }),
    ]);

    const events: (NextEvent & { _sort: string })[] = [];

    for (const row of ecoRows) {
      const date = toDateStr(row.date);
      events.push({
        id:       `eco-${row.id}`,
        title:    row.title,
        date,
        time:     row.time ?? undefined,
        category: row.category as EventCategory,
        _sort:    `${date}T${row.time ?? '23:59'}`,
      });
    }

    for (const row of earnRows) {
      const date = toDateStr(row.date);
      events.push({
        id:       `earn-${row.id}`,
        title:    `${row.symbol} Earnings`,
        date,
        category: 'earnings',
        _sort:    `${date}T23:59`,
      });
    }

    for (const row of ipoRows) {
      const date = toDateStr(row.date);
      events.push({
        id:       `ipo-${row.id}`,
        title:    `${row.company} IPO`,
        date,
        category: 'ipo',
        _sort:    `${date}T00:00`,
      });
    }

    events.sort((a, b) => a._sort.localeCompare(b._sort));

    // 카테고리 우선순위: monetary_policy > ipo > inflation > employment > earnings > growth
    const PRIORITY: Record<EventCategory, number> = {
      monetary_policy: 0,
      ipo:             1,
      inflation:       2,
      employment:      3,
      earnings:        4,
      growth:          5,
      breaking:        6,
    };

    // 날짜별로 그룹화하여, 같은 날 여러 이벤트 중 우선순위 높은 것만
    const byDate = new Map<string, (typeof events)[0]>();
    for (const ev of events) {
      const existing = byDate.get(ev.date);
      if (!existing || PRIORITY[ev.category] < PRIORITY[existing.category]) {
        byDate.set(ev.date, ev);
      }
    }

    const top = [...byDate.values()]
      .sort((a, b) => a._sort.localeCompare(b._sort))
      .slice(0, 3)
      .map(({ _sort: _omit, ...ev }) => ev);

    return NextResponse.json({ events: top }, {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('[next-event]', err);
    return NextResponse.json({ events: [] });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

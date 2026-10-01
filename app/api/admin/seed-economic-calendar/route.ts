// Admin: 하드코딩된 2026 BLS/BEA/Census 발표 일정으로 economic_events 시딩
// (Finnhub /calendar/economic, FMP economic-calendar 모두 유료 전용이라 대체)
//
// 실행: curl -H "Authorization: Bearer $CRON_SECRET" \
//   https://marketclock.net/api/admin/seed-economic-calendar
//
// source_id가 이미 있으면 title/category/unit만 갱신 (actual/estimate는 보존 —
// fred-update/estimate-sync가 채운 값을 덮어쓰지 않기 위함)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { buildEconomicCalendar2026 } from '@/lib/batch/economic-calendar-2026';
import { toSlug } from '@/lib/utils/slug';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = buildEconomicCalendar2026();
  let created = 0;
  let updated = 0;

  try {
    for (const e of events) {
      const sourceId = `hardcoded_${toSlug(e.title, e.date)}`;
      const existing = await db.economicEvent.findUnique({ where: { source_id: sourceId } });

      const fredRefDate = e.fredRefDate ? new Date(`${e.fredRefDate}T00:00:00Z`) : null;

      if (existing) {
        await db.economicEvent.update({
          where: { id: existing.id },
          data: {
            title:         e.title,
            category:      e.category,
            importance:    e.importance,
            unit:          e.unit,
            fred_ref_date: fredRefDate,
          },
        });
        updated++;
      } else {
        await db.economicEvent.create({
          data: {
            source_id:     sourceId,
            date:          new Date(`${e.date}T00:00:00Z`),
            title:         e.title,
            category:      e.category,
            importance:    e.importance,
            unit:          e.unit,
            fred_ref_date: fredRefDate,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ ok: true, total: events.length, created, updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[admin/seed-economic-calendar]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

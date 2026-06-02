import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { CATEGORY_META } from '@/lib/utils/categorize';
import { toSlug, slugToDate, slugToTitlePart } from '@/lib/utils/slug';
import { EventCategory } from '@/types/events';
import HistoryChart from '@/components/events/HistoryChart';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://market-intelligence-87mm.vercel.app';

// ── 헬퍼 ────────────────────────────────────────────────────────
function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}
function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00Z`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// ── 이벤트 조회 ───────────────────────────────────────────────────
async function findEvent(slug: string) {
  const date = slugToDate(slug);
  if (!date) return null;

  const titlePart = slugToTitlePart(slug);
  const from      = new Date(`${date}T00:00:00Z`);
  const to        = new Date(`${date}T23:59:59Z`);

  // Economic events
  const ecoRows = await db.economicEvent.findMany({
    where: { date: { gte: from, lte: to } },
  });
  for (const row of ecoRows) {
    if (toSlug(row.title, date) === slug) {
      return { type: 'economic' as const, row };
    }
  }

  // Earnings
  const earnRows = await db.earningsEvent.findMany({
    where: { date: { gte: from, lte: to } },
  });
  for (const row of earnRows) {
    if (toSlug(`${row.symbol} Earnings`, date) === slug) {
      return { type: 'earnings' as const, row };
    }
  }

  // IPO
  const ipoRows = await db.ipoEvent.findMany({
    where: { date: { gte: from, lte: to } },
  });
  for (const row of ipoRows) {
    if (toSlug(`${row.company} IPO`, date) === slug) {
      return { type: 'ipo' as const, row };
    }
  }

  return null;
}

// ── FRED 히스토리 조회 ─────────────────────────────────────────
async function getFredHistory(seriesId: string): Promise<Array<{ date: string; value: number }>> {
  try {
    const rows = await db.fredSnapshot.findMany({
      where:   { series_id: seriesId },
      orderBy: { date: 'asc' },
      take:    24,
      select:  { date: true, value: true },
    });
    return rows
      .filter((r) => r.value !== null)
      .map((r) => ({ date: toDateStr(r.date), value: Number(r.value) }));
  } catch {
    return [];
  }
}

// ── 같은 타입 다음 이벤트 ─────────────────────────────────────
async function getRelatedEvents(title: string, currentDate: string, category: string) {
  try {
    const after = new Date(`${currentDate}T23:59:59Z`);
    const ahead = new Date(after);
    ahead.setMonth(ahead.getMonth() + 3);
    const rows = await db.economicEvent.findMany({
      where:   { title: { contains: title.split(' ')[0] }, date: { gte: after, lte: ahead } },
      orderBy: { date: 'asc' },
      take:    3,
      select:  { id: true, title: true, date: true },
    });
    return rows.map((r) => ({
      title: r.title,
      date:  toDateStr(r.date),
      slug:  toSlug(r.title, toDateStr(r.date)),
    }));
  } catch {
    return [];
  }
}

// ── generateMetadata ─────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result   = await findEvent(slug);
  if (!result) return { title: 'Event Not Found' };

  let title = '';
  let description = '';
  const date = slugToDate(slug) ?? '';
  const formattedDate = formatDate(date);

  if (result.type === 'economic') {
    const { row } = result;
    title       = `${row.title} — ${formattedDate} | US Market Calendar`;
    description = `${row.title} scheduled for ${formattedDate}${row.time ? ' at ' + row.time + ' ET' : ''}. `
      + (row.estimate != null ? `Consensus estimate: ${row.estimate}${row.unit ?? ''}. ` : '')
      + (row.prev     != null ? `Previous: ${row.prev}${row.unit ?? ''}. ` : '')
      + 'Track all US economic calendar events on US Market Calendar.';
  } else if (result.type === 'earnings') {
    const { row } = result;
    title       = `${row.symbol} Earnings — ${formattedDate} | US Market Calendar`;
    description = `${row.symbol} (${row.company}) reports Q${row.quarter ?? ''} ${row.year ?? ''} earnings on ${formattedDate}. `
      + (row.eps_estimate != null ? `EPS estimate: $${row.eps_estimate?.toFixed(2)}. ` : '')
      + 'Track all NASDAQ-100 earnings on US Market Calendar.';
  } else {
    const { row } = result;
    title       = `${row.company} IPO — ${formattedDate} | US Market Calendar`;
    description = `${row.company} IPO scheduled for ${formattedDate} on ${row.exchange ?? 'NASDAQ'}. `
      + (row.total_shares_value != null
        ? `Market cap: $${(Number(row.total_shares_value) / 1e9).toFixed(0)}B. `
        : '')
      + 'Track upcoming IPOs including SpaceX and Anthropic on US Market Calendar.';
  }

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/events/${slug}` },
    openGraph:  { title, description, url: `${SITE_URL}/events/${slug}` },
  };
}

// ── Page Component ───────────────────────────────────────────────
export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result   = await findEvent(slug);
  if (!result) notFound();

  const date = slugToDate(slug) ?? '';
  const days = daysUntil(date);

  // ── 공통 헤더 데이터 ──────────────────────────────────────────
  let eventTitle = '';
  let category: EventCategory = 'growth';
  let time: string | null = null;
  let actual: number | null = null;
  let estimate: number | null = null;
  let prev: number | null = null;
  let unit: string | null = null;
  let fredSeriesId: string | null = null;
  let extraFields: React.ReactNode = null;

  if (result.type === 'economic') {
    const r      = result.row;
    eventTitle   = r.title;
    category     = r.category as EventCategory;
    time         = r.time ?? null;
    actual       = toNum(r.actual);
    estimate     = toNum(r.estimate);
    prev         = toNum(r.prev);
    unit         = r.unit ?? null;
    fredSeriesId = r.fred_series_id ?? null;
  } else if (result.type === 'earnings') {
    const r      = result.row;
    eventTitle   = `${r.symbol} Earnings`;
    category     = 'earnings';
    actual       = toNum(r.eps_actual);
    estimate     = toNum(r.eps_estimate);
    unit         = 'EPS $';
    extraFields  = (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">Revenue Estimate</div>
          <div className="text-white font-mono text-lg">
            {r.revenue_estimate != null
              ? `$${(Number(r.revenue_estimate) / 1e9).toFixed(2)}B`
              : '—'}
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="text-gray-400 text-xs mb-1">Revenue Actual</div>
          <div className="text-white font-mono text-lg">
            {r.revenue_actual != null
              ? `$${(Number(r.revenue_actual) / 1e9).toFixed(2)}B`
              : '—'}
          </div>
        </div>
      </div>
    );
  } else {
    const r     = result.row;
    eventTitle  = `${r.company} IPO`;
    category    = 'ipo';
    extraFields = (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {r.exchange && (
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Exchange</div>
            <div className="text-white font-semibold">{r.exchange}</div>
          </div>
        )}
        {r.total_shares_value != null && (
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Valuation</div>
            <div className="text-white font-mono font-semibold">
              ${(Number(r.total_shares_value) / 1e9).toFixed(0)}B
            </div>
          </div>
        )}
        {r.status && (
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Status</div>
            <div className="text-white capitalize font-semibold">{r.status}</div>
          </div>
        )}
        {(r as { nasdaq_fast_entry?: boolean }).nasdaq_fast_entry && (
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4 col-span-full">
            <div className="text-pink-300 text-sm font-semibold mb-1">NASDAQ Fast Entry Eligible</div>
            <div className="text-gray-400 text-xs">
              Under the May 2026 rule, this company qualifies for NASDAQ-100 inclusion within 15 trading days
              with a 3× weight multiplier — forcing QQQ and other passive ETFs to buy significant positions.
            </div>
          </div>
        )}
      </div>
    );
  }

  const meta = CATEGORY_META[category];

  // FRED 히스토리 조회
  const fredHistory = fredSeriesId ? await getFredHistory(fredSeriesId) : [];

  // 관련 이벤트 조회
  const related = result.type === 'economic'
    ? await getRelatedEvents(eventTitle, date, category)
    : [];

  // JSON-LD Event schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Event',
    name:       eventTitle,
    startDate:  time ? `${date}T${time}:00-05:00` : date,
    url:        `${SITE_URL}/events/${slug}`,
    location:   { '@type': 'VirtualLocation', url: SITE_URL },
    organizer:  { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
    eventStatus:         'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    description: `Track ${eventTitle} on US Market Calendar. Date: ${formatDate(date)}.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← US Market Calendar
          </Link>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-8">
          {/* Category + Countdown badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${meta.chipClass}`}>
              {meta.label}
            </span>
            {days >= 0 && (
              <span className="text-gray-400 text-sm">
                {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
              </span>
            )}
            {days < 0 && (
              <span className="text-gray-600 text-sm">{Math.abs(days)} days ago</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2">{eventTitle}</h1>

          {/* Date + Time */}
          <div className="text-gray-400 mb-8">
            <time dateTime={date}>{formatDate(date)}</time>
            {time && <span className="ml-2 text-gray-500">at {time} ET</span>}
          </div>

          {/* Actual / Estimate / Previous */}
          {(actual != null || estimate != null || prev != null) && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-xs mb-2">Actual</div>
                <div className={`font-mono text-2xl font-bold ${actual != null ? 'text-white' : 'text-gray-600'}`}>
                  {actual != null ? `${actual}${unit ? ' ' + unit : ''}` : '—'}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-xs mb-2">Estimate</div>
                <div className={`font-mono text-2xl font-bold ${estimate != null ? 'text-yellow-400' : 'text-gray-600'}`}>
                  {estimate != null ? `${estimate}${unit ? ' ' + unit : ''}` : '—'}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-xs mb-2">Previous</div>
                <div className={`font-mono text-2xl font-bold ${prev != null ? 'text-gray-300' : 'text-gray-600'}`}>
                  {prev != null ? `${prev}${unit ? ' ' + unit : ''}` : '—'}
                </div>
              </div>
            </div>
          )}

          {/* Extra fields (earnings/IPO) */}
          {extraFields}

          {/* FRED Historical Chart */}
          {fredHistory.length >= 2 && (
            <div className="bg-gray-900 rounded-xl p-6 mb-8 mt-8">
              <h2 className="text-white font-semibold mb-4">Historical Trend</h2>
              <HistoryChart
                data={fredHistory}
                unit={unit ?? '%'}
                title={eventTitle}
              />
              <p className="text-gray-600 text-xs mt-3">
                Source: Federal Reserve Bank of St. Louis (FRED)
              </p>
            </div>
          )}

          {/* Related upcoming events */}
          {related.length > 0 && (
            <div className="mt-8">
              <h2 className="text-white font-semibold mb-4">Upcoming {eventTitle.split(' ')[0]} Releases</h2>
              <div className="space-y-2">
                {related.map((ev) => (
                  <Link
                    key={ev.slug}
                    href={`/events/${ev.slug}`}
                    className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-lg px-4 py-3 transition-colors"
                  >
                    <span className="text-gray-300">{ev.title}</span>
                    <span className="text-gray-500 text-sm font-mono">{ev.date}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to calendar CTA */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Full Market Calendar →
            </Link>
          </div>
        </main>

        <footer className="border-t border-gray-800 px-6 py-4 text-center">
          <span className="text-gray-600 text-xs">
            © {new Date().getFullYear()} US Market Calendar — Free real-time US stock market events
          </span>
        </footer>
      </div>
    </>
  );
}

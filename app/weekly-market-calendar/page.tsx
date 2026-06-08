import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { getOrGenerateDigest, getWeekStart } from '@/lib/batch/generate-weekly-digest';
import { toSlug } from '@/lib/utils/slug';
import { CATEGORY_META } from '@/lib/utils/categorize';
import { EventCategory } from '@/types/events';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function formatFullDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
}

function formatWeekRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}, ${end.getUTCFullYear()}`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const RANK_COLORS = [
  'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  'text-gray-300   border-gray-600/40   bg-gray-700/20',
  'text-orange-400 border-orange-500/30 bg-orange-500/5',
  'text-gray-500   border-gray-700/40   bg-gray-800/30',
  'text-gray-500   border-gray-700/40   bg-gray-800/30',
];

// ── generateMetadata ───────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const weekStart = getWeekStart();
  const weekEnd   = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 4); // Friday
  const range = formatWeekRange(weekStart, weekEnd);

  const title       = `Weekly Market Calendar — Week of ${range}`;
  const description = `AI-curated top market-moving events for the week of ${range}. Economic releases, earnings, and IPOs ranked by expected market impact on QQQ & SPY.`;

  return {
    title,
    description,
    keywords: [
      `market events this week`,
      `economic calendar this week`,
      `stock market events week of ${range}`,
      'weekly economic calendar 2026',
      'this week market events',
      'weekly market focus',
      'economic data this week',
      'earnings this week',
      'what to watch in markets this week',
    ],
    alternates: { canonical: `${SITE_URL}/weekly-market-calendar` },
    openGraph: { title, description, url: `${SITE_URL}/weekly-market-calendar`, type: 'article' },
    twitter:   { card: 'summary_large_image', title, description },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

type WeekEvent = {
  id: string;
  title: string;
  date: Date;
  time: string | null;
  category: string;
  importance: string;
  actual: number | null;
  estimate: number | null;
  prev: number | null;
  unit: string | null;
  eventType: 'economic';
} | {
  id: string;
  title: string;
  date: Date;
  time: null;
  category: 'earnings';
  importance: 'high';
  actual: number | null;
  estimate: number | null;
  prev: null;
  unit: string;
  symbol: string;
  eventType: 'earnings';
} | {
  id: string;
  title: string;
  date: Date;
  time: null;
  category: 'ipo';
  importance: 'medium';
  actual: null;
  estimate: null;
  prev: null;
  unit: null;
  eventType: 'ipo';
};

export default async function WeeklyMarketCalendarPage() {
  const weekStart = getWeekStart();
  const weekEnd   = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekEndFri = new Date(weekStart);
  weekEndFri.setUTCDate(weekStart.getUTCDate() + 4);

  const range = formatWeekRange(weekStart, weekEndFri);

  let digestItems: Awaited<ReturnType<typeof getOrGenerateDigest>> = [];
  let allEvents: WeekEvent[] = [];

  try {
    const [digest, ecoRows, earnRows, ipoRows] = await Promise.all([
      getOrGenerateDigest(weekStart),
      db.economicEvent.findMany({
        where:   { date: { gte: weekStart, lte: weekEnd } },
        orderBy: { date: 'asc' },
        select:  { id: true, title: true, date: true, time: true, category: true, importance: true, actual: true, estimate: true, prev: true, unit: true },
      }),
      db.earningsEvent.findMany({
        where:   { date: { gte: weekStart, lte: weekEnd } },
        orderBy: { date: 'asc' },
        select:  { id: true, symbol: true, company: true, date: true, eps_actual: true, eps_estimate: true },
      }),
      db.ipoEvent.findMany({
        where:   { date: { gte: weekStart, lte: weekEnd }, status: { in: ['expected', 'priced'] } },
        orderBy: { date: 'asc' },
        select:  { id: true, company: true, date: true, exchange: true, total_shares_value: true },
      }),
    ]);

    digestItems = digest;

    allEvents = [
      ...ecoRows.map((r) => ({
        id: r.id, title: r.title, date: r.date, time: r.time,
        category: r.category as string, importance: r.importance as string,
        actual: r.actual != null ? Number(r.actual) : null,
        estimate: r.estimate != null ? Number(r.estimate) : null,
        prev: r.prev != null ? Number(r.prev) : null,
        unit: r.unit,
        eventType: 'economic' as const,
      })),
      ...earnRows.map((r) => ({
        id: r.id, title: `${r.symbol} Earnings`, date: r.date, time: null,
        category: 'earnings' as const, importance: 'high' as const,
        actual: r.eps_actual != null ? Number(r.eps_actual) : null,
        estimate: r.eps_estimate != null ? Number(r.eps_estimate) : null,
        prev: null, unit: 'EPS $',
        symbol: r.symbol,
        eventType: 'earnings' as const,
      })),
      ...ipoRows.map((r) => ({
        id: r.id, title: `${r.company} IPO`, date: r.date, time: null,
        category: 'ipo' as const, importance: 'medium' as const,
        actual: null, estimate: null, prev: null, unit: null,
        eventType: 'ipo' as const,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch { /* graceful degradation */ } finally {
    db.$disconnect().catch(() => {});
  }

  // Group events by date string
  const eventsByDay = allEvents.reduce<Record<string, WeekEvent[]>>((acc, e) => {
    const ds = toDateStr(e.date);
    if (!acc[ds]) acc[ds] = [];
    acc[ds].push(e);
    return acc;
  }, {});

  // Build ordered day list (Mon–Fri)
  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    days.push(toDateStr(d));
  }

  // Importance dot color
  const importanceDot: Record<string, string> = {
    high:   'bg-red-500',
    medium: 'bg-yellow-500',
    low:    'bg-gray-600',
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type':    'Article',
      headline:   `Weekly Market Calendar — Week of ${range}`,
      description: `Top market-moving events for the week of ${range}. AI-ranked economic releases, earnings, and IPOs.`,
      url:        `${SITE_URL}/weekly-market-calendar`,
      datePublished: toDateStr(weekStart),
      dateModified:  new Date().toISOString().slice(0, 10),
      publisher:  { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
    },
    ...(digestItems.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type':    'ItemList',
      name:       `Top Market Events Week of ${range}`,
      itemListElement: digestItems.map((item, i) => ({
        '@type':    'ListItem',
        position:   i + 1,
        name:       item.title,
        url:        `${SITE_URL}/events/${toSlug(item.title, item.date)}`,
        description: item.why_it_matters,
      })),
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar',         item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Weekly Market Calendar', item: `${SITE_URL}/weekly-market-calendar` },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Breadcrumb */}
        <header className="border-b border-gray-800 px-6 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">US Market Calendar</Link>
            <span>/</span>
            <span className="text-gray-300">Weekly Market Calendar</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

          {/* ── Hero ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-purple-500/20 text-purple-300 border-purple-500/30">
                AI Curated
              </span>
              <span className="text-gray-500 text-sm">Updated weekly · {range}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Weekly Market Calendar
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
              AI-ranked top events for the week of {range} — with why each matters and what to watch.
              Full day-by-day schedule below.
            </p>
          </div>

          {/* ── AI Top Picks ──────────────────────────────────────────── */}
          {digestItems.length > 0 && (
            <section aria-labelledby="top-picks-heading">
              <h2 id="top-picks-heading" className="text-xl font-bold text-white mb-1">
                This Week&apos;s Top Market Events
              </h2>
              <p className="text-gray-500 text-sm mb-5">Ranked by expected impact on US equities.</p>

              <div className="space-y-3">
                {digestItems.map((item, idx) => {
                  const rankStyle = RANK_COLORS[idx] ?? RANK_COLORS[4];
                  const catMeta   = CATEGORY_META[item.category as EventCategory] ?? CATEGORY_META.growth;
                  const eventSlug = toSlug(item.title, item.date);

                  return (
                    <div key={item.rank} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Rank badge */}
                        <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded border text-xs font-black ${rankStyle}`}>
                          {item.rank}
                        </span>

                        <div className="flex-1 min-w-0">
                          {/* Title row */}
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-white font-semibold text-sm leading-snug">{item.title}</span>
                            <span className={`text-[10px] px-1.5 py-px rounded border font-medium ${catMeta.chipClass}`}>
                              {catMeta.label}
                            </span>
                          </div>

                          {/* Date */}
                          <p className="text-gray-500 text-xs mb-2">
                            {new Date(`${item.date}T12:00:00Z`).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
                            })}
                          </p>

                          {/* Why it matters */}
                          <p className="text-gray-300 text-xs leading-relaxed mb-2">
                            <span className="text-gray-600 font-semibold mr-1">WHY:</span>
                            {item.why_it_matters}
                          </p>

                          {/* Watch for */}
                          <p className="text-gray-400 text-xs leading-relaxed">
                            <span className="text-yellow-500 font-bold mr-1">WATCH:</span>
                            {item.watch_for}
                          </p>
                        </div>

                        {/* Event link */}
                        <Link
                          href={`/events/${eventSlug}`}
                          className="flex-shrink-0 text-blue-400 hover:text-blue-300 text-xs mt-0.5 whitespace-nowrap"
                        >
                          Details →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Full Week Schedule ───────────────────────────────────── */}
          <section aria-labelledby="schedule-heading" className="border-t border-gray-800 pt-10">
            <h2 id="schedule-heading" className="text-xl font-bold text-white mb-1">
              Full Week Schedule
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              All economic releases, earnings reports, and IPOs — {range}
            </p>

            {allEvents.length === 0 ? (
              <div className="text-gray-500 text-sm py-12 text-center border border-gray-800 rounded-xl">
                No events scheduled for this week yet — data updates daily.
              </div>
            ) : (
              <div className="space-y-6">
                {days.map((ds) => {
                  const dayEvents = eventsByDay[ds];
                  if (!dayEvents || dayEvents.length === 0) return null;

                  const dayDate   = new Date(`${ds}T12:00:00Z`);
                  const dayName   = DAY_NAMES[dayDate.getUTCDay()];
                  const today     = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isToday   = new Date(`${ds}T00:00:00Z`).toDateString() === today.toDateString();

                  return (
                    <div key={ds}>
                      {/* Day header */}
                      <div className={`flex items-center gap-3 mb-3 pb-2 border-b ${isToday ? 'border-blue-500/40' : 'border-gray-800'}`}>
                        <h3 className={`font-bold text-base ${isToday ? 'text-blue-300' : 'text-gray-200'}`}>
                          {dayName}
                        </h3>
                        <span className="text-gray-500 text-sm">{formatFullDate(ds)}</span>
                        {isToday && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Today
                          </span>
                        )}
                        <span className="text-gray-600 text-xs ml-auto">
                          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Events for this day */}
                      <div className="space-y-1.5">
                        {dayEvents.map((e, idx) => {
                          const catMeta  = CATEGORY_META[e.category as EventCategory] ?? CATEGORY_META.growth;
                          const eventSlug = toSlug(e.title, ds);
                          const impDot   = importanceDot[e.importance] ?? importanceDot.low;
                          const u        = e.unit ?? '';

                          return (
                            <Link
                              key={`${ds}-${idx}`}
                              href={`/events/${eventSlug}`}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-900/60 hover:bg-gray-800/60 transition-colors group"
                            >
                              {/* Importance dot */}
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${impDot}`} />

                              {/* Time */}
                              <span className="text-gray-600 text-xs w-10 flex-shrink-0 tabular-nums">
                                {e.time ?? ''}
                              </span>

                              {/* Title */}
                              <span className="text-gray-200 text-sm flex-1 min-w-0 truncate group-hover:text-white transition-colors">
                                {e.title}
                              </span>

                              {/* Category badge */}
                              <span className={`hidden sm:inline text-[10px] px-1.5 py-px rounded border font-medium flex-shrink-0 ${catMeta.chipClass}`}>
                                {catMeta.label}
                              </span>

                              {/* Actual / Estimate */}
                              <span className="text-xs font-mono flex-shrink-0 w-16 text-right">
                                {e.actual != null ? (
                                  <span className="text-white">{e.actual}{u}</span>
                                ) : e.estimate != null ? (
                                  <span className="text-yellow-400/70">~{e.estimate}{u}</span>
                                ) : null}
                              </span>

                              <span className="text-gray-700 group-hover:text-blue-400 text-xs flex-shrink-0 transition-colors">→</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />High impact
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />Medium impact
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />Low impact
              </span>
              <span className="ml-auto">Yellow numbers = consensus estimate</span>
            </div>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <div className="border-t border-gray-800 pt-8 flex gap-4 flex-wrap">
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Monthly Calendar →
            </Link>
            <Link
              href="/market-analysis"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Market Analysis →
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { CATEGORY_META } from '@/lib/utils/categorize';
import { toSlug, slugToDate, slugToTitlePart } from '@/lib/utils/slug';
import { EventCategory } from '@/types/events';
import HistoryChart from '@/components/events/HistoryChart';
import MarketReactionChart from '@/components/events/MarketReactionChart';
import { getMarketReaction } from '@/lib/utils/marketReaction';
import { getEventContent, getCrossLinkKeywords } from '@/lib/seo/event-descriptions';

export const revalidate = 3600; // 1시간 ISR

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

function toDateStrStatic(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export async function generateStaticParams() {
  try {
    const now = new Date();
    const sixMonthsBack = new Date(now);
    sixMonthsBack.setMonth(sixMonthsBack.getMonth() - 6);
    const sixMonthsOut = new Date(now);
    sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

    const [ecoRows, earnRows, ipoRows] = await Promise.all([
      db.economicEvent.findMany({
        where:   { date: { gte: sixMonthsBack, lte: sixMonthsOut } },
        select:  { title: true, date: true },
        orderBy: { date: 'asc' },
      }),
      db.earningsEvent.findMany({
        where:   { date: { gte: sixMonthsBack, lte: sixMonthsOut } },
        select:  { symbol: true, date: true },
        orderBy: { date: 'asc' },
      }),
      db.ipoEvent.findMany({
        where:   { date: { gte: sixMonthsBack, lte: sixMonthsOut } },
        select:  { company: true, date: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    const slugs = [
      ...ecoRows.map((r) => ({ slug: toSlug(r.title, toDateStrStatic(r.date)) })),
      ...earnRows.map((r) => ({ slug: toSlug(`${r.symbol} Earnings`, toDateStrStatic(r.date)) })),
      ...ipoRows.map((r) => ({ slug: toSlug(`${r.company} IPO`, toDateStrStatic(r.date)) })),
    ];

    return slugs;
  } catch {
    return [];
  } finally {
    db.$disconnect().catch(() => {});
  }
}

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

// ── 연관 다른 타입 이벤트 (교차 링크) ─────────────────────────
async function getCrossLinks(title: string, currentDate: string) {
  try {
    const keywords = getCrossLinkKeywords(title);
    if (keywords.length === 0) return [];
    const after = new Date(`${currentDate}T23:59:59Z`);
    const ahead = new Date(after);
    ahead.setMonth(ahead.getMonth() + 2);
    const rows = await db.economicEvent.findMany({
      where: {
        date: { gte: after, lte: ahead },
        OR:   keywords.map((kw) => ({ title: { contains: kw } })),
      },
      orderBy: { date: 'asc' },
      take:    4,
      select:  { title: true, date: true },
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

// ── SEO 헬퍼 ─────────────────────────────────────────────────────
function monthYear(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });
}

function buildEconomicMeta(row: {
  title: string; category: string; date: Date;
  time?: string | null; actual?: number | null;
  estimate?: number | null; prev?: number | null; unit?: string | null;
}, dateStr: string) {
  const my   = monthYear(dateStr);
  const time = row.time ? ` at ${row.time} ET` : '';
  const u    = row.unit ?? '';

  const actualStr   = row.actual   != null ? `Actual: ${row.actual}${u}. `   : '';
  const estimateStr = row.estimate != null ? `Estimate: ${row.estimate}${u}. ` : '';
  const prevStr     = row.prev     != null ? `Previous: ${row.prev}${u}. `   : '';
  const numbers     = actualStr || (estimateStr + prevStr);

  const cat = row.category;

  if (cat === 'monetary_policy') {
    const isFOMC    = /fomc|rate decision|federal funds/i.test(row.title);
    const isMinutes = /minutes/i.test(row.title);
    const isSpeech  = /speech|remarks|testimony|powell/i.test(row.title);
    if (isFOMC) {
      return {
        title: `FOMC Rate Decision ${my} — Fed Interest Rate Forecast & Market Impact`,
        description: `Federal Reserve FOMC interest rate decision scheduled for ${formatDate(dateStr)}${time}. ${numbers}Track live QQQ & SPY reaction on US Market Calendar.`,
        keywords: [
          `FOMC ${my}`, `Fed rate decision ${my}`, `Federal Reserve interest rate ${dateStr.slice(0,7)}`,
          'FOMC meeting date 2026', 'Fed funds rate forecast', 'Fed rate hike cut 2026',
          'FOMC market impact', 'QQQ SPY FOMC reaction',
        ],
      };
    }
    if (isMinutes) {
      return {
        title: `FOMC Meeting Minutes ${my} — Federal Reserve Policy Notes`,
        description: `Federal Reserve FOMC meeting minutes release on ${formatDate(dateStr)}${time}. Read Fed policy signals, rate path hints, and market reaction on US Market Calendar.`,
        keywords: [
          `FOMC minutes ${my}`, 'Federal Reserve meeting minutes 2026', 'Fed policy signals',
          'FOMC minutes market impact',
        ],
      };
    }
    if (isSpeech) {
      return {
        title: `${row.title} ${my} — Fed Speech Date & Market Impact`,
        description: `${row.title} on ${formatDate(dateStr)}${time}. Track Federal Reserve communication, rate signals, and market reaction on US Market Calendar.`,
        keywords: [
          `Powell speech ${my}`, 'Federal Reserve speech 2026', 'Fed chair remarks',
          'Fed speech market impact',
        ],
      };
    }
  }

  if (cat === 'inflation') {
    const isCPI = /\bcpi\b|consumer price/i.test(row.title);
    const isPCE = /\bpce\b|personal consumption/i.test(row.title);
    const isPPI = /\bppi\b|producer price/i.test(row.title);
    if (isCPI) {
      return {
        title: `CPI Report ${my} — Consumer Price Index Release Date & Inflation Forecast`,
        description: `Consumer Price Index (CPI) inflation report for ${my} scheduled for ${formatDate(dateStr)}${time}. ${numbers}Track real-time QQQ SPY reaction on US Market Calendar.`,
        keywords: [
          `CPI ${my}`, `consumer price index ${my}`, `CPI release date ${dateStr.slice(0,7)}`,
          'CPI forecast 2026', 'inflation report date 2026', 'CPI actual vs estimate',
          'CPI market impact QQQ SPY',
        ],
      };
    }
    if (isPCE) {
      return {
        title: `PCE Inflation ${my} — Core PCE Release Date & Fed Inflation Target`,
        description: `Core PCE inflation index for ${my} on ${formatDate(dateStr)}${time}. ${numbers}PCE is the Fed's preferred inflation gauge. Track on US Market Calendar.`,
        keywords: [
          `PCE ${my}`, `core PCE ${my}`, 'PCE inflation release date 2026',
          'Fed preferred inflation gauge', 'PCE vs CPI 2026',
        ],
      };
    }
    if (isPPI) {
      return {
        title: `PPI Report ${my} — Producer Price Index Release Date & Forecast`,
        description: `Producer Price Index (PPI) for ${my} on ${formatDate(dateStr)}${time}. ${numbers}Track upstream inflation signals on US Market Calendar.`,
        keywords: [
          `PPI ${my}`, `producer price index ${my}`, 'PPI release date 2026', 'PPI inflation forecast',
        ],
      };
    }
  }

  if (cat === 'employment') {
    const isNFP  = /nonfarm|non.farm|\bnfp\b/i.test(row.title);
    const isJobs = /jobless|unemployment/i.test(row.title);
    if (isNFP) {
      return {
        title: `Nonfarm Payrolls ${my} — Jobs Report Date, Forecast & Market Reaction`,
        description: `US Nonfarm Payrolls (NFP) jobs report for ${my} on ${formatDate(dateStr)}${time}. ${numbers}Track QQQ SPY reaction to jobs data on US Market Calendar.`,
        keywords: [
          `nonfarm payrolls ${my}`, `NFP ${my}`, `jobs report ${my}`,
          'nonfarm payrolls 2026 forecast', 'NFP release date 2026', 'jobs report market impact',
        ],
      };
    }
    if (isJobs) {
      return {
        title: `${row.title} ${my} — US Labor Market Data & Release Date`,
        description: `${row.title} for ${my} on ${formatDate(dateStr)}${time}. ${numbers}Track US labor market data on US Market Calendar.`,
        keywords: [
          `unemployment rate ${my}`, 'US jobless claims 2026', 'labor market data 2026',
        ],
      };
    }
  }

  // growth / default
  return {
    title: `${row.title} ${my} — Release Date & Forecast`,
    description: `${row.title} scheduled for ${formatDate(dateStr)}${time}. ${numbers}Track all US economic calendar events on US Market Calendar.`,
    keywords: [
      `${row.title} ${my}`, 'US economic calendar 2026', 'economic data release date 2026',
    ],
  };
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

  const date = slugToDate(slug) ?? '';

  let title       = '';
  let description = '';
  let keywords: string[] = [];

  if (result.type === 'economic') {
    const { row } = result;
    const meta     = buildEconomicMeta(row, date);
    title          = meta.title;
    description    = meta.description;
    keywords       = meta.keywords;

  } else if (result.type === 'earnings') {
    const { row }  = result;
    const q        = row.quarter ? `Q${row.quarter}` : '';
    const yr       = row.year ?? '';
    const epsStr   = row.eps_estimate != null ? ` EPS estimate: $${row.eps_estimate.toFixed(2)}.` : '';
    title       = `${row.symbol} Earnings Date ${q} ${yr} — ${row.company} EPS Forecast`;
    description = `${row.company} (${row.symbol}) reports ${q} ${yr} earnings on ${formatDate(date)}.${epsStr} Track all NASDAQ-100 earnings on US Market Calendar.`;
    keywords    = [
      `${row.symbol} earnings date`, `${row.symbol} earnings ${q} ${yr}`,
      `${row.company} earnings report`, `${row.symbol} EPS estimate ${yr}`,
      `${row.symbol} revenue forecast`, 'NASDAQ-100 earnings calendar 2026',
    ];

  } else {
    const { row }  = result;
    const valStr   = row.total_shares_value != null
      ? ` Valuation: $${(Number(row.total_shares_value) / 1e9).toFixed(0)}B.`
      : '';
    const isFastEntry = (row as { nasdaq_fast_entry?: boolean }).nasdaq_fast_entry;
    const fastStr  = isFastEntry
      ? ' Qualifies for NASDAQ-100 Fast Entry Rule — forced ETF buying expected.'
      : '';
    title       = `${row.company} IPO Date ${date.slice(0, 7)} — ${row.exchange ?? 'NASDAQ'} Listing & Valuation`;
    description = `${row.company} IPO scheduled for ${formatDate(date)} on ${row.exchange ?? 'NASDAQ'}.${valStr}${fastStr} Track upcoming IPOs on US Market Calendar.`;
    keywords    = [
      `${row.company} IPO date`, `${row.company} IPO ${date.slice(0, 4)}`,
      `${row.company} IPO valuation`, `${row.company} NASDAQ listing`,
      'upcoming IPO 2026', 'NASDAQ IPO calendar 2026',
      ...(isFastEntry ? ['NASDAQ Fast Entry Rule 2026', 'QQQ forced buying IPO'] : []),
    ];
  }

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${SITE_URL}/events/${slug}` },
    openGraph:  {
      title,
      description,
      url:      `${SITE_URL}/events/${slug}`,
      type:     'article',
    },
    twitter: { card: 'summary', title, description },
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
    extraFields  = null;
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

  // 시장 반응 차트 데이터
  const marketReaction = await getMarketReaction(date);

  // 관련 이벤트 조회 + 교차 링크
  const [related, crossLinks] = result.type === 'economic'
    ? await Promise.all([
        getRelatedEvents(eventTitle, date, category),
        getCrossLinks(eventTitle, date),
      ])
    : [[], []];

  // 이벤트 설명 콘텐츠
  const eventContent = getEventContent(
    result.type,
    category,
    eventTitle,
    result.type === 'earnings' ? (result.row as { symbol: string }).symbol : undefined,
    result.type === 'earnings' ? (result.row as { company: string }).company
      : result.type === 'ipo'  ? (result.row as { company: string }).company
      : undefined,
  );

  // JSON-LD: Event + BreadcrumbList + FAQPage
  const jsonLdGraphs: object[] = [
    {
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
    },
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: meta.label,          item: SITE_URL },
        { '@type': 'ListItem', position: 3, name: eventTitle,          item: `${SITE_URL}/events/${slug}` },
      ],
    },
    ...(eventContent && eventContent.faq.length > 0 ? [{
      '@context':  'https://schema.org',
      '@type':     'FAQPage',
      mainEntity:  eventContent.faq.map((item) => ({
        '@type': 'Question',
        name:    item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    }] : []),
  ];

  return (
    <>
      {jsonLdGraphs.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header / Breadcrumb */}
        <header className="border-b border-gray-800 px-6 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">US Market Calendar</Link>
            <span>/</span>
            <span className="text-gray-400">{meta.label}</span>
            <span>/</span>
            <span className="text-gray-300 truncate max-w-xs">{eventTitle}</span>
          </nav>
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

          {/* Event description content */}
          {eventContent && (
            <div className="mt-8 space-y-5 border-t border-gray-800 pt-8">
              <div>
                <h2 className="text-white font-semibold text-lg mb-2">
                  What is {result.type === 'earnings' ? `${(result.row as { symbol: string }).symbol} Earnings?` : result.type === 'ipo' ? `the ${(result.row as { company: string }).company} IPO?` : eventTitle.split(' ').slice(0, 4).join(' ') + '?'}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed">{eventContent.what}</p>
              </div>
              <div>
                <h3 className="text-gray-200 font-medium mb-2">Why does it matter for investors?</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{eventContent.whyMatters}</p>
              </div>
              {eventContent.watchFor.length > 0 && (
                <div>
                  <h3 className="text-gray-200 font-medium mb-2">What to watch for</h3>
                  <ul className="space-y-1.5">
                    {eventContent.watchFor.map((item, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-400">
                        <span className="text-blue-400 mt-0.5 shrink-0">›</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {eventContent.faq.length > 0 && (
                <div className="space-y-4 pt-2">
                  {eventContent.faq.map((item, i) => (
                    <div key={i}>
                      <h3 className="text-gray-200 font-medium text-sm mb-1">{item.q}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Market Reaction Chart */}
          {marketReaction && marketReaction.length >= 3 && (
            <div className="bg-gray-900 rounded-xl p-6 mb-8 mt-8 border-l-2 border-blue-500">
              <h2 className="text-xl font-bold text-white mb-1">Market Reaction</h2>
              <p className="text-gray-500 text-xs mb-4">QQQ &amp; SPY price change ±5 trading days around this event</p>
              <MarketReactionChart data={marketReaction} />
              <p className="text-gray-600 text-xs mt-3">Source: Yahoo Finance</p>
            </div>
          )}

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

          {/* Related upcoming events (same type) */}
          {related.length > 0 && (
            <div className="mt-8">
              <h2 className="text-white font-semibold mb-3">Upcoming {eventTitle.split(' ')[0]} Releases</h2>
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

          {/* Cross-linked related events (other types) */}
          {crossLinks.length > 0 && (
            <div className="mt-6">
              <h2 className="text-white font-semibold mb-3">Related Market Events</h2>
              <div className="space-y-2">
                {crossLinks.map((ev) => (
                  <Link
                    key={ev.slug}
                    href={`/events/${ev.slug}`}
                    className="flex items-center justify-between bg-gray-900/60 hover:bg-gray-800 rounded-lg px-4 py-3 transition-colors"
                  >
                    <span className="text-gray-400">{ev.title}</span>
                    <span className="text-gray-600 text-sm font-mono">{ev.date}</span>
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

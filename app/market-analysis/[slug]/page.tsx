import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/batch/db';
import { toAnalysisSlug, slugToDate } from '@/lib/utils/slug';
import { toSlug } from '@/lib/utils/slug';
import { CATEGORY_META } from '@/lib/utils/categorize';
import { EventCategory } from '@/types/events';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

// ── Types ──────────────────────────────────────────────────────────────────

interface Cause {
  title: string;
  description: string;
}

interface MarketAnalysisRow {
  id: string;
  title: string;
  event_date: Date;
  market_condition: string;
  summary: string;
  causes: Cause[];
  outlook: string;
  reference_ticker: string;
  reference_change: number;
  reference_period: string;
}

// ── Config (shared with hub page) ─────────────────────────────────────────

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  correction_entry: { label: 'Correction Entry', color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30'  },
  bear:             { label: 'Bear Market',       color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30'    },
  bull:             { label: 'Bull Market',       color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30'  },
  sideways:         { label: 'Sideways',          color: 'text-gray-400',   bg: 'bg-gray-400/10',   border: 'border-gray-400/30'   },
  recovery:         { label: 'Recovery',          color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30'   },
};

const CONDITION_GUIDE: Record<string, { description: string; watchFor: string[] }> = {
  correction_entry: {
    description: 'A market correction is a 10–20% pullback from recent highs. Corrections are normal — they occur on average once per year. The key question is whether this reset stays within a broader bull trend or evolves into a bear market.',
    watchFor: [
      'VIX: panic-level fear above 30 often marks short-term bottoms',
      'Federal Reserve response — rising recession fears increase rate-cut odds',
      'Breadth: defensive sectors (utilities, staples, healthcare) outperforming?',
      'S&P 500 200-day moving average — key technical support',
      'Corporate credit spreads (HYG) — widening signals deeper risk-off',
    ],
  },
  bear: {
    description: 'A bear market is a 20%+ decline sustained over time, typically lasting 9–18 months historically. The focus shifts from growth to capital preservation. Bear markets end when either the Fed pivots (rate cuts) or earnings estimates bottom and recover.',
    watchFor: [
      'Fed pivot signals — rate cuts are the primary catalyst for recovery',
      'Earnings revision cycle — when do analysts stop cutting forward estimates?',
      'High-yield credit spreads — extreme widening signals systemic risk',
      'Capitulation signals: extreme fear readings (VIX > 40), volume spikes',
      'Sector leadership shifts: financials and small-caps typically lead recoveries',
    ],
  },
  bull: {
    description: 'Bull markets are characterized by rising prices, broad participation, and positive earnings momentum. Primary risks are complacency and valuations stretching beyond historical norms.',
    watchFor: [
      'Valuation: S&P 500 forward P/E vs. 10-year historical average (~16–18x)',
      'Fed policy path — rate hikes are the primary risk to equity multiples',
      'Earnings growth quality — is revenue growing or just margin expansion?',
      'Breadth: are all sectors participating or just a few mega-cap leaders?',
      'Yield curve: inversion or steepening as a macro warning signal',
    ],
  },
  sideways: {
    description: 'Sideways markets reflect a lack of directional conviction. Markets are digesting prior moves and waiting for a catalyst. Range-bound trading is common, with key support and resistance levels frequently tested.',
    watchFor: [
      'Breakout direction — next catalyst determines range resolution',
      'Economic data surprises vs. consensus expectations',
      'Sector rotation patterns within the range',
      'Options market: implied volatility compression ahead of known catalysts',
      'Fed communication: any shift in forward guidance breaks the range',
    ],
  },
  recovery: {
    description: 'A recovery follows a correction or bear market. The shape matters: V-shaped (sharp and fast) or U-shaped (slow grind). Sustainability depends on whether the root catalyst has meaningfully receded.',
    watchFor: [
      'Whether the bounce is broad-based or just short-covering',
      'Key resistance at prior highs — can the market reclaim them with volume?',
      'Earnings revisions turning positive — a leading indicator of durable recovery',
      'Macro data improving: leading indicators (PMI, jobless claims) turning higher',
      'Fund flows: retail and institutional money returning to equities',
    ],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// ── DB lookup by slug ──────────────────────────────────────────────────────

async function findAnalysisBySlug(slug: string): Promise<MarketAnalysisRow | null> {
  const date = slugToDate(slug);
  if (!date) return null;

  const from = new Date(`${date}T00:00:00Z`);
  const to   = new Date(`${date}T23:59:59Z`);

  const rows = await db.marketAnalysis.findMany({
    where: { event_date: { gte: from, lte: to } },
  });

  for (const row of rows) {
    if (toAnalysisSlug(row.title, toDateStr(row.event_date)) === slug) {
      return row as unknown as MarketAnalysisRow;
    }
  }
  return null;
}

// ── generateStaticParams ───────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const rows = await db.marketAnalysis.findMany({
      orderBy: { created_at: 'desc' },
      select:  { title: true, event_date: true },
    });
    return rows.map((r) => ({
      slug: toAnalysisSlug(r.title, toDateStr(r.event_date)),
    }));
  } catch {
    return [];
  } finally {
    db.$disconnect().catch(() => {});
  }
}

// ── generateMetadata ───────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let analysis: MarketAnalysisRow | null = null;

  try {
    analysis = await findAnalysisBySlug(slug);
  } catch { /* use defaults */ } finally {
    db.$disconnect().catch(() => {});
  }

  if (!analysis) return { title: 'Market Analysis Not Found' };

  const cond     = CONDITION_CONFIG[analysis.market_condition]?.label ?? 'Market';
  const sign     = analysis.reference_change > 0 ? '+' : '';
  const dateStr  = toDateStr(analysis.event_date);
  const title    = `${analysis.title} — ${cond} Analysis`;
  const description = `${analysis.summary} ${sign}${analysis.reference_change.toFixed(1)}% ${analysis.reference_ticker} on ${formatDate(dateStr)}. Key causes, market outlook, and economic events to watch.`;

  return {
    title,
    description,
    keywords: [
      `${analysis.reference_ticker} market analysis ${dateStr.slice(0, 7)}`,
      `stock market ${cond.toLowerCase()} ${dateStr.slice(0, 4)}`,
      `${analysis.reference_ticker} ${sign}${analysis.reference_change.toFixed(1)}% analysis`,
      'US stock market analysis',
      'QQQ SPY market conditions',
      `market outlook ${dateStr.slice(0, 7)}`,
    ],
    alternates: { canonical: `${SITE_URL}/market-analysis/${slug}` },
    openGraph: {
      title,
      description,
      url:  `${SITE_URL}/market-analysis/${slug}`,
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MarketAnalysisDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let analysis: MarketAnalysisRow | null = null;
  let upcomingEvents: Array<{
    title: string; date: Date; time: string | null;
    category: string; importance: string;
    estimate: number | null; prev: number | null; unit: string | null;
  }> = [];

  try {
    const analysisDate = slugToDate(slug);
    const now          = new Date();
    const twoWeeksOut  = new Date(now);
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

    [analysis, upcomingEvents] = await Promise.all([
      findAnalysisBySlug(slug),
      db.economicEvent.findMany({
        where:   { date: { gte: now, lte: twoWeeksOut }, importance: 'high' },
        orderBy: { date: 'asc' },
        take:    8,
        select:  { title: true, date: true, time: true, category: true, importance: true, estimate: true, prev: true, unit: true },
      }),
    ]);

    void analysisDate; // used in findAnalysisBySlug above
  } catch { /* graceful degradation */ } finally {
    db.$disconnect().catch(() => {});
  }

  if (!analysis) notFound();

  const cond        = CONDITION_CONFIG[analysis.market_condition] ?? CONDITION_CONFIG.sideways;
  const guide       = CONDITION_GUIDE[analysis.market_condition]  ?? CONDITION_GUIDE.sideways;
  const isNeg       = analysis.reference_change < 0;
  const changeColor = isNeg ? 'text-red-400' : 'text-green-400';
  const changeSign  = analysis.reference_change > 0 ? '+' : '';
  const dateStr     = toDateStr(analysis.event_date);

  const jsonLd = [
    {
      '@context':    'https://schema.org',
      '@type':       'Article',
      headline:      analysis.title,
      description:   analysis.summary,
      url:           `${SITE_URL}/market-analysis/${slug}`,
      datePublished: dateStr,
      dateModified:  dateStr,
      publisher:     { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
      about: {
        '@type': 'Thing',
        name:    analysis.reference_ticker,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Market Analysis',    item: `${SITE_URL}/market-analysis` },
        { '@type': 'ListItem', position: 3, name: analysis.title,       item: `${SITE_URL}/market-analysis/${slug}` },
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
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">US Market Calendar</Link>
            <span>/</span>
            <Link href="/market-analysis" className="hover:text-white transition-colors">Market Analysis</Link>
            <span>/</span>
            <span className="text-gray-300 truncate max-w-xs">{analysis.title}</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

          {/* ── Hero ─────────────────────────────────────────────── */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cond.color} ${cond.bg} ${cond.border}`}>
                {cond.label}
              </span>
              <time className="text-gray-500 text-sm" dateTime={dateStr}>
                {formatDate(dateStr)}
              </time>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
              {analysis.title}
            </h1>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold tabular-nums ${changeColor}`}>
                {changeSign}{analysis.reference_change.toFixed(1)}%
              </span>
              <span className="text-gray-500 text-sm">
                {analysis.reference_ticker} · {analysis.reference_period}
              </span>
            </div>
          </div>

          {/* ── Summary ──────────────────────────────────────────── */}
          <section>
            <p className="text-gray-300 text-base leading-relaxed border-l-4 border-gray-700 pl-4">
              {analysis.summary}
            </p>
          </section>

          {/* ── Key Reasons ──────────────────────────────────────── */}
          {(analysis.causes as Cause[]).length > 0 && (
            <section aria-labelledby="reasons-heading">
              <h2 id="reasons-heading" className="text-xl font-bold text-white mb-4">Key Reasons</h2>
              <div className="space-y-3">
                {(analysis.causes as Cause[]).map((cause, i) => (
                  <div key={i} className="flex gap-4 bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <span className={`text-sm font-black tabular-nums flex-shrink-0 mt-0.5 ${cond.color}`}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-gray-100 font-semibold text-sm leading-snug mb-1">{cause.title}</p>
                      {cause.description && (
                        <p className="text-gray-400 text-sm leading-relaxed">{cause.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Outlook ──────────────────────────────────────────── */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Outlook</h2>
            <p className="text-gray-200 leading-relaxed">{analysis.outlook}</p>
          </section>

          {/* ── Condition Guide ───────────────────────────────────── */}
          <section aria-labelledby="guide-heading" className="border-t border-gray-800 pt-10">
            <h2 id="guide-heading" className="text-xl font-bold text-white mb-2">
              What Does &quot;{cond.label}&quot; Mean?
            </h2>
            <p className="text-gray-400 leading-relaxed mb-5">{guide.description}</p>
            <h3 className="text-gray-300 font-semibold text-sm mb-3">What to watch right now</h3>
            <ul className="space-y-2">
              {guide.watchFor.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-400">
                  <span className={`mt-0.5 flex-shrink-0 font-bold ${cond.color}`}>›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Key Upcoming Events ──────────────────────────────── */}
          {upcomingEvents.length > 0 && (
            <section aria-labelledby="events-heading" className="border-t border-gray-800 pt-10">
              <h2 id="events-heading" className="text-xl font-bold text-white mb-2">
                Key Economic Events to Watch
              </h2>
              <p className="text-gray-500 text-sm mb-5">High-importance releases in the next 14 days.</p>
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Event</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Category</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Estimate</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Previous</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingEvents.map((e, idx) => {
                      const ds      = toDateStr(e.date);
                      const catMeta = CATEGORY_META[e.category as EventCategory] ?? CATEGORY_META.growth;
                      const u       = e.unit ?? '';
                      return (
                        <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors">
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap font-medium">
                            {formatShortDate(ds)}
                            {e.time && <span className="text-gray-600 text-xs ml-1">{e.time}</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-200">{e.title}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${catMeta.chipClass}`}>
                              {catMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.estimate != null ? (
                              <span className="text-yellow-400">{e.estimate}{u}</span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.prev != null ? (
                              <span className="text-gray-400">{e.prev}{u}</span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/events/${toSlug(e.title, ds)}`} className="text-blue-400 hover:text-blue-300 text-xs">
                              Details →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── CTA ──────────────────────────────────────────────── */}
          <div className="border-t border-gray-800 pt-8 flex gap-4 flex-wrap">
            <Link
              href="/market-analysis"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              ← All Analyses
            </Link>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Full Market Calendar →
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}

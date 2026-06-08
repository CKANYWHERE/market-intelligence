import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { toSlug, toAnalysisSlug } from '@/lib/utils/slug';
import { CATEGORY_META } from '@/lib/utils/categorize';
import { EventCategory } from '@/types/events';

export const revalidate = 300;

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

// ── Config ─────────────────────────────────────────────────────────────────

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  correction_entry: { label: 'Correction Entry', color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30'  },
  bear:             { label: 'Bear Market',       color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30'    },
  bull:             { label: 'Bull Market',       color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30'  },
  sideways:         { label: 'Sideways',          color: 'text-gray-400',   bg: 'bg-gray-400/10',   border: 'border-gray-400/30'   },
  recovery:         { label: 'Recovery',          color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30'   },
};

const CONDITION_GUIDE: Record<string, { description: string; watchFor: string[] }> = {
  correction_entry: {
    description:
      'A market correction is a 10–20% pullback from recent highs. Corrections are normal — they occur on average once per year. The key question is whether this reset stays within a broader bull trend or evolves into a bear market. Duration and breadth of selling are the tell.',
    watchFor: [
      'VIX: panic-level fear above 30 often marks short-term bottoms',
      'Federal Reserve response — rising recession fears increase rate-cut odds',
      'Breadth: defensive sectors (utilities, staples, healthcare) outperforming?',
      'S&P 500 200-day moving average — key technical support',
      'Corporate credit spreads (HYG) — widening signals deeper risk-off',
    ],
  },
  bear: {
    description:
      'A bear market is a 20%+ decline sustained over time, typically lasting 9–18 months historically. The focus shifts from growth to capital preservation. Bear markets end when either the Fed pivots (rate cuts) or earnings estimates bottom and recover.',
    watchFor: [
      'Fed pivot signals — rate cuts are the primary catalyst for recovery',
      'Earnings revision cycle — when do analysts stop cutting forward estimates?',
      'High-yield credit spreads — extreme widening signals systemic risk',
      'Capitulation signals: extreme fear readings (VIX > 40), volume spikes',
      'Sector leadership shifts: financials and small-caps typically lead recoveries',
    ],
  },
  bull: {
    description:
      'Bull markets are characterized by rising prices, broad participation, and positive earnings momentum. Primary risks are complacency and valuations stretching beyond historical norms. Bull markets typically end when the Fed overtightens or a credit event breaks confidence.',
    watchFor: [
      'Valuation: S&P 500 forward P/E vs. 10-year historical average (~16–18x)',
      'Fed policy path — rate hikes are the primary risk to equity multiples',
      'Earnings growth quality — is revenue growing or just margin expansion?',
      'Breadth: are all sectors participating or just a few mega-cap leaders?',
      'Yield curve: inversion or steepening as a macro warning signal',
    ],
  },
  sideways: {
    description:
      'Sideways markets reflect a lack of directional conviction. Markets are digesting prior moves and waiting for a catalyst. Range-bound trading is common, with key support and resistance levels frequently tested. Sector rotation often accelerates during consolidation.',
    watchFor: [
      'Breakout direction — next catalyst determines range resolution',
      'Economic data surprises vs. consensus expectations',
      'Sector rotation patterns within the range',
      'Options market: implied volatility compression ahead of known catalysts',
      'Fed communication: any shift in forward guidance breaks the range',
    ],
  },
  recovery: {
    description:
      'A recovery follows a correction or bear market. The shape matters: V-shaped (sharp and fast) or U-shaped (slow grind). Sustainability depends on whether the root catalyst — inflation, recession fear, credit stress — has meaningfully receded rather than just paused.',
    watchFor: [
      'Whether the bounce is broad-based or just short-covering by institutional funds',
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
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

// ── generateMetadata ───────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  let title   = 'US Stock Market Analysis — Current Conditions & Outlook';
  let description = 'Real-time US stock market analysis: current market conditions, causes, outlook, and key economic events to watch. Updated when market conditions change.';

  try {
    const analysis = await db.marketAnalysis.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
      select: { title: true, market_condition: true, reference_ticker: true, reference_change: true, summary: true },
    });

    if (analysis) {
      const cond  = CONDITION_CONFIG[analysis.market_condition]?.label ?? 'Market';
      const sign  = analysis.reference_change > 0 ? '+' : '';
      title       = `${analysis.title} — ${cond} Analysis | US Market Calendar`;
      description = `${analysis.summary} ${sign}${analysis.reference_change.toFixed(1)}% ${analysis.reference_ticker}. Key causes, market outlook, and upcoming economic events to watch.`;
    }
  } catch { /* use defaults */ } finally {
    db.$disconnect().catch(() => {});
  }

  return {
    title,
    description,
    keywords: [
      'stock market analysis 2026',
      'QQQ market analysis today',
      'US stock market outlook',
      'market correction analysis',
      'S&P 500 market conditions',
      'stock market causes outlook',
      'economic market analysis',
      'NASDAQ-100 market update',
    ],
    alternates: { canonical: `${SITE_URL}/market-analysis` },
    openGraph: { title, description, url: `${SITE_URL}/market-analysis`, type: 'article' },
    twitter:   { card: 'summary_large_image', title, description },
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function MarketAnalysisPage() {
  let analysis: MarketAnalysisRow | null = null;
  let pastAnalyses: Array<{
    id: string; title: string; event_date: Date; market_condition: string;
    reference_ticker: string; reference_change: number; summary: string;
  }> = [];
  let upcomingEvents: Array<{
    title: string; date: Date; time: string | null;
    category: string; importance: string; estimate: number | null;
    prev: number | null; unit: string | null;
  }> = [];

  try {
    const now          = new Date();
    const twoWeeksOut  = new Date(now);
    twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

    [analysis, pastAnalyses, upcomingEvents] = await Promise.all([
      db.marketAnalysis.findFirst({
        where:   { is_active: true },
        orderBy: { created_at: 'desc' },
      }) as Promise<MarketAnalysisRow | null>,

      db.marketAnalysis.findMany({
        where:   { is_active: false },
        orderBy: { created_at: 'desc' },
        take:    4,
        select:  { id: true, title: true, event_date: true, market_condition: true, reference_ticker: true, reference_change: true, summary: true },
      }),

      db.economicEvent.findMany({
        where:   { date: { gte: now, lte: twoWeeksOut }, importance: 'high' },
        orderBy: { date: 'asc' },
        take:    10,
        select:  { title: true, date: true, time: true, category: true, importance: true, estimate: true, prev: true, unit: true },
      }),
    ]);
  } catch { /* graceful degradation */ } finally {
    db.$disconnect().catch(() => {});
  }

  const cond     = analysis ? (CONDITION_CONFIG[analysis.market_condition] ?? CONDITION_CONFIG.sideways) : null;
  const guide    = analysis ? (CONDITION_GUIDE[analysis.market_condition] ?? CONDITION_GUIDE.sideways) : null;
  const isNeg    = (analysis?.reference_change ?? 0) < 0;
  const changeColor = isNeg ? 'text-red-400' : 'text-green-400';
  const changeSign  = (analysis?.reference_change ?? 0) > 0 ? '+' : '';

  const analysisDateStr = analysis ? toDateStr(analysis.event_date) : '';

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type':    'Article',
      headline:   analysis?.title ?? 'US Stock Market Analysis',
      description: analysis?.summary ?? 'Real-time US stock market analysis and outlook.',
      url:        `${SITE_URL}/market-analysis`,
      datePublished: analysisDateStr || new Date().toISOString().slice(0, 10),
      dateModified:  new Date().toISOString().slice(0, 10),
      publisher:  { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Market Analysis',    item: `${SITE_URL}/market-analysis` },
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
            <span className="text-gray-300">Market Analysis</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

          {analysis && cond ? (
            <>
              {/* ── Hero ───────────────────────────────────────────────── */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cond.color} ${cond.bg} ${cond.border}`}>
                    {cond.label}
                  </span>
                  <span className="text-gray-500 text-sm">{formatDate(analysisDateStr)}</span>
                  <Link
                    href={`/market-analysis/${toAnalysisSlug(analysis.title, analysisDateStr)}`}
                    className="ml-auto text-xs text-gray-600 hover:text-blue-400 transition-colors"
                    title="Permanent link to this analysis"
                  >
                    # permalink
                  </Link>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
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

              {/* ── Summary ────────────────────────────────────────────── */}
              <section aria-label="Analysis summary">
                <p className="text-gray-300 text-base leading-relaxed border-l-4 border-gray-700 pl-4">
                  {analysis.summary}
                </p>
              </section>

              {/* ── Key Reasons ────────────────────────────────────────── */}
              {(analysis.causes as Cause[]).length > 0 && (
                <section aria-labelledby="reasons-heading">
                  <h2 id="reasons-heading" className="text-xl font-bold text-white mb-4">
                    Key Reasons
                  </h2>
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

              {/* ── Outlook ────────────────────────────────────────────── */}
              <section aria-labelledby="outlook-heading" className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 id="outlook-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Outlook
                </h2>
                <p className="text-gray-200 leading-relaxed">{analysis.outlook}</p>
              </section>
            </>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg mb-2">No active market analysis</p>
              <p className="text-sm">Analysis is updated when significant market conditions change.</p>
            </div>
          )}

          {/* ── Market Condition Guide ───────────────────────────────── */}
          {guide && cond && (
            <section aria-labelledby="condition-guide-heading" className="border-t border-gray-800 pt-10">
              <h2 id="condition-guide-heading" className="text-xl font-bold text-white mb-2">
                What Does &quot;{cond.label}&quot; Mean?
              </h2>
              <p className="text-gray-400 leading-relaxed mb-5">{guide.description}</p>
              <div>
                <h3 className="text-gray-300 font-semibold text-sm mb-3">What to watch right now</h3>
                <ul className="space-y-2">
                  {guide.watchFor.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-gray-400">
                      <span className={`mt-0.5 flex-shrink-0 font-bold ${cond.color}`}>›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* ── Key Upcoming Events ─────────────────────────────────── */}
          {upcomingEvents.length > 0 && (
            <section aria-labelledby="upcoming-heading" className="border-t border-gray-800 pt-10">
              <h2 id="upcoming-heading" className="text-xl font-bold text-white mb-2">
                Key Economic Events (Next 14 Days)
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                High-importance data releases that may shift current market conditions.
              </p>
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
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.prev != null ? (
                              <span className="text-gray-400">{e.prev}{u}</span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/events/${toSlug(e.title, ds)}`}
                              className="text-blue-400 hover:text-blue-300 text-xs"
                            >
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

          {/* ── Past Analyses ───────────────────────────────────────── */}
          {pastAnalyses.length > 0 && (
            <section aria-labelledby="history-heading" className="border-t border-gray-800 pt-10">
              <h2 id="history-heading" className="text-xl font-bold text-white mb-5">
                Previous Analyses
              </h2>
              <div className="space-y-3">
                {pastAnalyses.map((pa) => {
                  const paCond   = CONDITION_CONFIG[pa.market_condition] ?? CONDITION_CONFIG.sideways;
                  const paIsNeg  = pa.reference_change < 0;
                  const paSign   = pa.reference_change > 0 ? '+' : '';
                  const paColor  = paIsNeg ? 'text-red-400' : 'text-green-400';
                  const paDateStr = toDateStr(pa.event_date);
                  const paSlug   = toAnalysisSlug(pa.title, paDateStr);
                  return (
                    <Link
                      key={pa.id}
                      href={`/market-analysis/${paSlug}`}
                      className="block bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${paCond.color} ${paCond.bg} ${paCond.border}`}>
                            {paCond.label}
                          </span>
                          <span className="text-gray-600 text-xs">{formatShortDate(paDateStr)}</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${paColor}`}>
                          {paSign}{pa.reference_change.toFixed(1)}% {pa.reference_ticker}
                        </span>
                      </div>
                      <p className="text-gray-200 text-sm font-semibold mb-1">{pa.title}</p>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{pa.summary}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <div className="border-t border-gray-800 pt-8 flex gap-4 flex-wrap">
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Full Market Calendar →
            </Link>
            <Link
              href="/weekly-market-calendar"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              This Week's Focus →
            </Link>
          </div>

        </main>
      </div>
    </>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { toSlug } from '@/lib/utils/slug';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

export const metadata: Metadata = {
  title: 'Nonfarm Payrolls 2026 — Jobs Report Dates, Forecasts & Market Impact',
  description:
    'Complete NFP jobs report schedule for 2026. Nonfarm payrolls release dates, consensus forecasts, actual vs estimate results, and real-time QQQ & SPY market reaction tracker.',
  keywords: [
    'nonfarm payrolls 2026',
    'NFP release dates 2026',
    'jobs report 2026 schedule',
    'next NFP date 2026',
    'nonfarm payrolls forecast 2026',
    'jobs report actual vs estimate',
    'NFP market impact QQQ SPY',
    'BLS employment situation 2026',
    'US jobs report calendar',
    'nonfarm payrolls release schedule',
  ],
  alternates: { canonical: `${SITE_URL}/nonfarm-payrolls-2026` },
  openGraph: {
    title: 'Nonfarm Payrolls 2026 — Jobs Report Dates & NFP Forecast',
    description:
      'All NFP jobs report release dates in 2026 with actual vs estimate data and market impact on QQQ & SPY.',
    url:  `${SITE_URL}/nonfarm-payrolls-2026`,
    type: 'article',
    images: [{
      url:    `${SITE_URL}/og?title=${encodeURIComponent('Nonfarm Payrolls 2026 — Jobs Report Dates & NFP Forecast')}&category=employment`,
      width:  1200,
      height: 630,
      alt:    'Nonfarm Payrolls 2026 Schedule',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Nonfarm Payrolls 2026 — NFP Jobs Report Schedule',
    description: 'Complete US NFP jobs report schedule for 2026 — actual vs estimate, market impact, QQQ/SPY reaction.',
    images:      [`${SITE_URL}/og?title=${encodeURIComponent('Nonfarm Payrolls 2026 — Jobs Report Schedule')}&category=employment`],
  },
};

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}
function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${dateStr}T00:00:00Z`).getTime() - today.getTime()) / 86_400_000);
}

const FAQS = [
  {
    q: 'When is the next Nonfarm Payrolls (NFP) report in 2026?',
    a: 'The Bureau of Labor Statistics (BLS) releases the Employment Situation Summary (NFP) on the first Friday of each month at 8:30 AM ET. The exact dates for all 2026 reports are listed in the schedule above.',
  },
  {
    q: 'What is the Nonfarm Payrolls report?',
    a: 'The Nonfarm Payrolls report, officially called the Employment Situation Summary, is released by the BLS and measures the change in total paid US workers excluding farm employees, government workers, and a few other categories. It is one of the most market-moving economic indicators.',
  },
  {
    q: 'How does the NFP report affect stock prices?',
    a: 'A stronger-than-expected NFP print signals a healthy economy, which can be bullish for equities in isolation. However, it can also cause bond yields to rise if markets interpret it as inflationary — pressuring QQQ and SPY valuations. A weak jobs report may fuel rate-cut expectations, sometimes boosting tech stocks.',
  },
  {
    q: 'What is a "hot" vs "cool" NFP reading?',
    a: 'A "hot" NFP report exceeds consensus estimates significantly (e.g., +300K vs +180K expected), potentially pushing the Fed to stay hawkish. A "cool" report misses estimates and signals labor market softness, increasing the probability of Fed rate cuts — typically bullish for long-duration growth stocks like those in QQQ.',
  },
  {
    q: 'What other employment data should I watch alongside NFP?',
    a: 'Complement NFP with: Unemployment Rate (U-3), Average Hourly Earnings (wage inflation proxy), Average Weekly Hours, JOLTS Job Openings (released ~month prior), ADP National Employment Report (released two days before NFP), and Initial Jobless Claims (weekly).',
  },
];

type EcoRow = {
  title: string;
  date: Date;
  time: string | null;
  actual: number | null;
  estimate: number | null;
  prev: number | null;
  unit: string | null;
};

export default async function NonfarmPayrolls2026Page() {
  let events: EcoRow[] = [];

  try {
    const rows = await db.economicEvent.findMany({
      where: {
        date:     { gte: new Date('2026-01-01'), lte: new Date('2026-12-31') },
        category: 'employment',
      },
      orderBy: { date: 'asc' },
      select:  { title: true, date: true, time: true, actual: true, estimate: true, prev: true, unit: true },
    });

    events = rows.filter((r) =>
      /nonfarm|non.farm|\bnfp\b/i.test(r.title) && !/adp/i.test(r.title),
    );
  } catch {
    // DB 오류 시 빈 목록으로 렌더링
  } finally {
    db.$disconnect().catch(() => {});
  }

  const nextEvent = events.find((e) => daysUntil(toDateStr(e.date)) >= 0);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type':    'Article',
      headline:   'Nonfarm Payrolls 2026 — Jobs Report Dates, Forecasts & Market Impact',
      description:'Complete NFP jobs report schedule for 2026 with actual vs estimate data and market reaction.',
      url:        `${SITE_URL}/nonfarm-payrolls-2026`,
      datePublished: '2026-01-01',
      dateModified:  new Date().toISOString().slice(0, 10),
      publisher: { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
    },
    ...(events.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type':    'ItemList',
      name:       'Nonfarm Payrolls Release Dates 2026',
      description:'All BLS Nonfarm Payrolls (NFP) jobs report dates in 2026',
      itemListElement: events.map((e, i) => ({
        '@type':    'ListItem',
        position:   i + 1,
        name:       `NFP Jobs Report — ${formatDate(toDateStr(e.date))}`,
        url:        `${SITE_URL}/events/${toSlug(e.title, toDateStr(e.date))}`,
      })),
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Nonfarm Payrolls 2026', item: `${SITE_URL}/nonfarm-payrolls-2026` },
      ],
    },
    {
      '@context':  'https://schema.org',
      '@type':     'FAQPage',
      mainEntity:  FAQS.map((f) => ({
        '@type': 'Question',
        name:    f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800 px-6 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">US Market Calendar</Link>
            <span>/</span>
            <span className="text-gray-300">Nonfarm Payrolls 2026</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10">
          {/* Hero */}
          <div className="mb-8">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-green-500/20 text-green-300 border-green-500/30 inline-block mb-4">
              Employment
            </span>
            <h1 className="text-4xl font-bold text-white mt-2 mb-3">
              Nonfarm Payrolls 2026
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
              Complete schedule of all US Nonfarm Payrolls (NFP) jobs reports in 2026.
              Track release dates, consensus forecasts, actual vs estimate results, and real-time QQQ &amp; SPY market reactions.
            </p>
          </div>

          {/* Next NFP countdown */}
          {nextEvent && (() => {
            const ds   = toDateStr(nextEvent.date);
            const days = daysUntil(ds);
            return (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-8">
                <div className="text-green-300 text-sm font-medium mb-1">Next NFP Report</div>
                <div className="text-2xl font-bold text-white mb-1">{formatDate(ds)}</div>
                {nextEvent.time && (
                  <div className="text-gray-400 text-sm">{nextEvent.time} ET — Bureau of Labor Statistics release</div>
                )}
                <div className="text-green-400 text-sm mt-2 font-medium">
                  {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                </div>
                {nextEvent.estimate != null && (
                  <div className="text-gray-400 text-sm mt-1">
                    Consensus: <span className="text-yellow-400 font-mono">{nextEvent.estimate > 0 ? '+' : ''}{nextEvent.estimate}K</span>
                  </div>
                )}
                <Link
                  href={`/events/${toSlug(nextEvent.title, ds)}`}
                  className="inline-block mt-3 text-sm text-green-400 hover:text-green-300 underline underline-offset-2"
                >
                  View event details →
                </Link>
              </div>
            );
          })()}

          {/* Schedule table */}
          <section className="mb-10" aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="text-xl font-bold text-white mb-4">
              2026 NFP Release Schedule
            </h2>
            {events.length === 0 ? (
              <div className="text-gray-500 text-sm py-12 text-center border border-gray-800 rounded-xl">
                NFP schedule data not yet available — check back soon.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Release Date</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Time (ET)</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Actual</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Estimate</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Previous</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e, idx) => {
                      const ds   = toDateStr(e.date);
                      const days = daysUntil(ds);
                      const isPast   = days < 0;
                      const isToday  = days === 0;
                      const beat = e.actual != null && e.estimate != null
                        ? e.actual > e.estimate ? 'beat' : e.actual < e.estimate ? 'miss' : 'inline'
                        : null;

                      return (
                        <tr
                          key={`${ds}-${idx}`}
                          className={`border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors ${isToday ? 'bg-green-500/5' : ''}`}
                        >
                          <td className="px-4 py-3 text-gray-600 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-200 font-medium whitespace-nowrap">{formatDate(ds)}</td>
                          <td className="px-4 py-3 text-gray-400">{e.time ?? '08:30'}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.actual != null ? (
                              <span className={beat === 'beat' ? 'text-green-400 font-semibold' : beat === 'miss' ? 'text-red-400 font-semibold' : 'text-white font-semibold'}>
                                {e.actual > 0 ? '+' : ''}{e.actual}K
                              </span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.estimate != null ? (
                              <span className="text-yellow-400">{e.estimate > 0 ? '+' : ''}{e.estimate}K</span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.prev != null ? (
                              <span className="text-gray-400">{e.prev > 0 ? '+' : ''}{e.prev}K</span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {isPast ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">Past</span>
                            ) : isToday ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">Today</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Upcoming</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/events/${toSlug(e.title, ds)}`} className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap">
                              Details →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-gray-600 text-xs mt-2">
              Yellow = consensus estimate. Green/Red actual = beat/miss vs estimate. Jobs data in thousands (K).
            </p>
          </section>

          {/* Explainer */}
          <section className="space-y-5 mb-10 border-t border-gray-800 pt-8" aria-labelledby="explainer-heading">
            <h2 id="explainer-heading" className="text-xl font-bold text-white">What is the Nonfarm Payrolls Report?</h2>
            <p className="text-gray-400 leading-relaxed">
              The Nonfarm Payrolls (NFP) report, formally the <em>Employment Situation Summary</em>, is published by the
              Bureau of Labor Statistics (BLS) on the first Friday of every month at 8:30 AM ET. It measures the net
              change in paid US workers across all non-farm businesses and is one of the single most market-moving
              economic data releases in the world.
            </p>
            <div>
              <h3 className="text-gray-200 font-semibold mb-2">Why NFP matters for QQQ and SPY investors</h3>
              <p className="text-gray-400 leading-relaxed">
                NFP data is a primary input for Federal Reserve rate decisions. A labor market that&apos;s too strong
                risks wage-driven inflation, keeping the Fed hawkish and rates elevated — a headwind for tech-heavy QQQ.
                Conversely, labor market weakness increases the probability of Fed rate cuts, historically a tailwind
                for growth stocks. Markets often react within seconds of the 8:30 AM ET release.
              </p>
            </div>
            <div>
              <h3 className="text-gray-200 font-semibold mb-3">Key components to watch in the NFP report</h3>
              <ul className="space-y-2">
                {[
                  'Headline NFP number — total net job additions (excl. farm, government, household workers)',
                  'Unemployment Rate (U-3) — percentage of labor force actively seeking work',
                  'Average Hourly Earnings (AHE) — wage growth, the key inflation proxy in the report',
                  'Average Weekly Hours — a leading indicator of labor demand',
                  'Labor Force Participation Rate — measures how many working-age Americans are in the workforce',
                  'Prior month revision — often significant and can flip the market narrative',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-400">
                    <span className="text-green-400 mt-0.5 shrink-0">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-5 mb-10 border-t border-gray-800 pt-8" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-xl font-bold text-white">Frequently Asked Questions</h2>
            {FAQS.map((f, i) => (
              <div key={i}>
                <h3 className="text-gray-200 font-medium mb-1">{f.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </section>

          {/* CTA + related links */}
          <div className="border-t border-gray-800 pt-8 flex gap-4 flex-wrap">
            <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              View Full Market Calendar →
            </Link>
            <Link href="/fomc-dates-2026" className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors">
              FOMC Dates 2026 →
            </Link>
            <Link href="/cpi-release-dates-2026" className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors">
              CPI Release Dates →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

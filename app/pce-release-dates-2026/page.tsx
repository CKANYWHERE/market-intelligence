import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { toSlug } from '@/lib/utils/slug';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

export const metadata: Metadata = {
  title: 'PCE Release Dates 2026 — Core PCE Inflation Schedule & Fed Forecast',
  description:
    'Complete PCE inflation report schedule for 2026. Core PCE release dates, actual vs estimate, Fed inflation target analysis, and real-time QQQ & SPY market reaction tracker.',
  keywords: [
    'PCE release dates 2026',
    'core PCE 2026 schedule',
    'PCE inflation report dates 2026',
    'next PCE release date',
    'personal consumption expenditures 2026',
    'Fed inflation gauge 2026',
    'core PCE actual vs estimate',
    'PCE vs CPI 2026',
    'PCE market impact QQQ SPY',
    'BEA PCE release schedule',
  ],
  alternates: { canonical: `${SITE_URL}/pce-release-dates-2026` },
  openGraph: {
    title: 'PCE Release Dates 2026 — Core PCE Inflation Schedule',
    description:
      "All Core PCE inflation release dates in 2026. The Fed's preferred inflation gauge — actual vs estimate and market impact.",
    url:  `${SITE_URL}/pce-release-dates-2026`,
    type: 'article',
    images: [{
      url:    `${SITE_URL}/og?title=${encodeURIComponent('PCE Release Dates 2026 — Core PCE Inflation Schedule')}&category=inflation`,
      width:  1200,
      height: 630,
      alt:    'PCE Release Dates 2026',
    }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'PCE Release Dates 2026 — Core PCE Inflation Schedule',
    description: "Complete Core PCE schedule for 2026 — the Fed's preferred inflation gauge, actual vs estimate.",
    images:      [`${SITE_URL}/og?title=${encodeURIComponent('PCE Release Dates 2026 — Core PCE Schedule')}&category=inflation`],
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
    q: 'When is the next PCE inflation report in 2026?',
    a: 'The Bureau of Economic Analysis (BEA) releases the Personal Consumption Expenditures (PCE) Price Index on the last Friday of each month (approximately 30 days after the reference month), typically at 8:30 AM ET. The exact 2026 release dates are listed in the schedule above.',
  },
  {
    q: 'Why does the Fed prefer PCE over CPI?',
    a: 'The Federal Reserve targets Core PCE (excluding food and energy) as its primary inflation gauge because it: (1) covers a broader range of goods and services than CPI, (2) adjusts for substitution effects when consumers switch to cheaper alternatives, (3) uses chain-weighted formulas that better reflect real spending patterns. The Fed\'s target is 2% annual Core PCE.',
  },
  {
    q: 'What is the difference between PCE and Core PCE?',
    a: 'Headline PCE includes all goods and services including volatile food and energy prices. Core PCE strips out food and energy to show underlying inflation trends. The Fed focuses on Core PCE because food and energy prices can spike due to weather or supply shocks unrelated to monetary policy effectiveness.',
  },
  {
    q: 'How does the PCE report affect QQQ and SPY?',
    a: 'A hotter-than-expected Core PCE reading (above 2.0% annually) reduces the probability of Fed rate cuts, pushing bond yields higher and pressuring growth stock valuations in QQQ. A cooler reading increases cut probability, often boosting technology stocks. The reaction is typically strongest when PCE data deviates meaningfully from consensus estimates.',
  },
  {
    q: 'What is the difference between PCE and CPI?',
    a: 'CPI (Bureau of Labor Statistics) and PCE (Bureau of Economic Analysis) both measure inflation but differ in scope and methodology. PCE has a broader scope, uses chain-weighting, and assigns lower weights to housing (shelter). CPI tends to run about 0.3–0.5 percentage points higher than PCE over time. The Fed officially targets PCE, not CPI.',
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

export default async function PceReleaseDates2026Page() {
  let events: EcoRow[] = [];

  try {
    const rows = await db.economicEvent.findMany({
      where: {
        date:     { gte: new Date('2026-01-01'), lte: new Date('2026-12-31') },
        category: 'inflation',
      },
      orderBy: { date: 'asc' },
      select:  { title: true, date: true, time: true, actual: true, estimate: true, prev: true, unit: true },
    });

    // Core PCE + PCE (not PPI, not CPI)
    events = rows.filter((r) =>
      /\bpce\b|personal consumption/i.test(r.title) && !/ppi|cpi/i.test(r.title),
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
      headline:   'PCE Release Dates 2026 — Core PCE Inflation Schedule & Fed Forecast',
      description:"Complete Core PCE inflation schedule for 2026. The Fed's preferred inflation gauge with actual vs estimate data.",
      url:        `${SITE_URL}/pce-release-dates-2026`,
      datePublished: '2026-01-01',
      dateModified:  new Date().toISOString().slice(0, 10),
      publisher: { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
    },
    ...(events.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type':    'ItemList',
      name:       'PCE Inflation Release Dates 2026',
      description:"All BEA PCE inflation report release dates in 2026",
      itemListElement: events.map((e, i) => ({
        '@type':    'ListItem',
        position:   i + 1,
        name:       `PCE Inflation Report — ${formatDate(toDateStr(e.date))}`,
        url:        `${SITE_URL}/events/${toSlug(e.title, toDateStr(e.date))}`,
      })),
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type':    'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'PCE Release Dates 2026', item: `${SITE_URL}/pce-release-dates-2026` },
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
            <span className="text-gray-300">PCE Release Dates 2026</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10">
          {/* Hero */}
          <div className="mb-8">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-red-500/20 text-red-300 border-red-500/30 inline-block mb-4">
              Inflation
            </span>
            <h1 className="text-4xl font-bold text-white mt-2 mb-3">
              PCE Release Dates 2026
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
              Complete schedule of all PCE (Personal Consumption Expenditures) inflation reports in 2026 —
              the Federal Reserve&apos;s preferred inflation gauge. Track Core PCE release dates, actual vs
              estimate results, and real-time QQQ &amp; SPY market reactions.
            </p>
          </div>

          {/* Fed target highlight */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
            <div className="text-red-400 text-lg mt-0.5">🎯</div>
            <div>
              <div className="text-red-300 text-sm font-semibold mb-0.5">Fed Inflation Target</div>
              <div className="text-gray-400 text-sm">
                The Federal Reserve targets <strong className="text-white">2.0% annual Core PCE</strong> as its official price stability mandate.
                Readings above 2% are considered inflationary pressure; readings below signal deflationary risk.
              </div>
            </div>
          </div>

          {/* Next PCE countdown */}
          {nextEvent && (() => {
            const ds   = toDateStr(nextEvent.date);
            const days = daysUntil(ds);
            return (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-8">
                <div className="text-orange-300 text-sm font-medium mb-1">Next PCE Report</div>
                <div className="text-2xl font-bold text-white mb-1">{formatDate(ds)}</div>
                {nextEvent.time && (
                  <div className="text-gray-400 text-sm">{nextEvent.time} ET — Bureau of Economic Analysis release</div>
                )}
                <div className="text-orange-400 text-sm mt-2 font-medium">
                  {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                </div>
                {nextEvent.estimate != null && (
                  <div className="text-gray-400 text-sm mt-1">
                    Consensus: <span className="text-yellow-400 font-mono">{nextEvent.estimate}%</span>
                  </div>
                )}
                <Link
                  href={`/events/${toSlug(nextEvent.title, ds)}`}
                  className="inline-block mt-3 text-sm text-orange-400 hover:text-orange-300 underline underline-offset-2"
                >
                  View event details →
                </Link>
              </div>
            );
          })()}

          {/* Schedule table */}
          <section className="mb-10" aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="text-xl font-bold text-white mb-4">
              2026 PCE Release Schedule
            </h2>
            {events.length === 0 ? (
              <div className="text-gray-500 text-sm py-12 text-center border border-gray-800 rounded-xl">
                PCE schedule data not yet available — check back soon.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Report</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Release Date</th>
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
                      const isPast  = days < 0;
                      const isToday = days === 0;
                      const hot = e.actual != null && e.estimate != null
                        ? e.actual > e.estimate ? 'hot' : e.actual < e.estimate ? 'cool' : null
                        : null;

                      return (
                        <tr
                          key={`${ds}-${idx}`}
                          className={`border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors ${isToday ? 'bg-orange-500/5' : ''}`}
                        >
                          <td className="px-4 py-3 text-gray-600 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">{e.title}</td>
                          <td className="px-4 py-3 text-gray-200 font-medium whitespace-nowrap">{formatDate(ds)}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.actual != null ? (
                              <span className={hot === 'hot' ? 'text-red-400 font-semibold' : hot === 'cool' ? 'text-green-400 font-semibold' : 'text-white font-semibold'}>
                                {e.actual}%
                                {hot === 'hot' && <span className="text-xs ml-1">🔥</span>}
                                {hot === 'cool' && <span className="text-xs ml-1">❄️</span>}
                              </span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.estimate != null ? (
                              <span className="text-yellow-400">{e.estimate}%</span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.prev != null ? (
                              <span className="text-gray-400">{e.prev}%</span>
                            ) : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {isPast ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">Past</span>
                            ) : isToday ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">Today</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Upcoming</span>
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
              🔥 Hot = above estimate (inflationary). ❄️ Cool = below estimate (deflationary). Fed target: 2.0% annual Core PCE.
            </p>
          </section>

          {/* Explainer */}
          <section className="space-y-5 mb-10 border-t border-gray-800 pt-8" aria-labelledby="explainer-heading">
            <h2 id="explainer-heading" className="text-xl font-bold text-white">PCE vs CPI — The Fed&apos;s Preferred Inflation Gauge</h2>
            <p className="text-gray-400 leading-relaxed">
              The Personal Consumption Expenditures (PCE) Price Index is published by the Bureau of Economic Analysis (BEA)
              as part of the Personal Income and Outlays report. While CPI gets more media attention, the Federal Reserve
              officially uses Core PCE (excluding food and energy) as its primary inflation measure for monetary policy decisions.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-5">
                <div className="text-white font-semibold mb-3">Core PCE (Fed Target)</div>
                <ul className="space-y-1.5">
                  {[
                    'Excludes food & energy',
                    'Chain-weighted formula',
                    'Broader scope than CPI',
                    'Fed target: 2.0% annual',
                    'Released monthly by BEA',
                  ].map((item, i) => (
                    <li key={i} className="text-sm text-gray-400 flex gap-2">
                      <span className="text-orange-400">›</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-900 rounded-xl p-5">
                <div className="text-white font-semibold mb-3">Headline PCE</div>
                <ul className="space-y-1.5">
                  {[
                    'Includes all goods & services',
                    'Reflects actual consumer spending',
                    'More volatile than Core PCE',
                    'Includes food & energy prices',
                    'Broader than CPI basket',
                  ].map((item, i) => (
                    <li key={i} className="text-sm text-gray-400 flex gap-2">
                      <span className="text-orange-400">›</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
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
            <Link href="/cpi-release-dates-2026" className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors">
              CPI Release Dates →
            </Link>
            <Link href="/fomc-dates-2026" className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors">
              FOMC Dates 2026 →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

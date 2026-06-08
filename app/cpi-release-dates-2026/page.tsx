import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { toSlug } from '@/lib/utils/slug';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

export const metadata: Metadata = {
  title: 'CPI Release Dates 2026 — Consumer Price Index Schedule & Inflation Forecast',
  description:
    'Complete CPI release schedule for 2026. Consumer Price Index report dates, actual vs estimate, inflation forecasts, and real-time QQQ & SPY market reaction tracker.',
  keywords: [
    'CPI release dates 2026',
    'consumer price index 2026 schedule',
    'CPI report dates 2026',
    'inflation report release dates 2026',
    'next CPI release date',
    'CPI actual vs estimate 2026',
    'core CPI 2026',
    'CPI market impact QQQ SPY',
    'US inflation calendar 2026',
    'BLS CPI release schedule',
  ],
  alternates: { canonical: `${SITE_URL}/cpi-release-dates-2026` },
  openGraph: {
    title: 'CPI Release Dates 2026 — Consumer Price Index Schedule',
    description:
      'All CPI report release dates in 2026 with actual vs estimate data and market impact on QQQ & SPY.',
    url: `${SITE_URL}/cpi-release-dates-2026`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CPI Release Dates 2026 — Inflation Report Schedule',
    description: 'Complete US CPI report schedule for 2026 — actual vs estimate, market impact, QQQ/SPY reaction.',
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
    q: 'When is the next CPI report in 2026?',
    a: 'CPI reports are released monthly by the U.S. Bureau of Labor Statistics (BLS), typically at 8:30 AM ET. The exact upcoming date is shown above. US Market Calendar updates in real-time with actual vs estimate data.',
  },
  {
    q: 'What does the CPI measure?',
    a: 'The Consumer Price Index (CPI) measures the average change in prices paid by urban consumers for a representative basket of goods and services — including food, energy, housing, transportation, and medical care. It is the most widely followed inflation gauge in the United States.',
  },
  {
    q: 'What is the difference between CPI and Core CPI?',
    a: 'Core CPI excludes food and energy prices, which tend to be volatile. The Fed and economists often focus on Core CPI as a more stable measure of underlying inflation trends. The Fed\'s preferred inflation gauge is actually Core PCE, not Core CPI.',
  },
  {
    q: 'How does the CPI report affect stock prices?',
    a: 'A CPI print above expectations ("hot") is typically bearish for stocks — it signals persistent inflation and reduces the probability of Fed rate cuts. QQQ (NASDAQ-100) and SPY (S&P 500) often sell off sharply on hot CPI surprises. A "cool" CPI reading below expectations is generally bullish for equities.',
  },
  {
    q: 'What is the current US inflation rate in 2026?',
    a: 'The current CPI inflation rate (year-over-year) is displayed on the US Market Calendar homepage, updated with each BLS release.',
  },
];

type EconomicRow = {
  title: string;
  date: Date;
  time: string | null;
  actual: number | null;
  estimate: number | null;
  prev: number | null;
  unit: string | null;
};

export default async function CpiReleaseDates2026Page() {
  let events: EconomicRow[] = [];

  try {
    const rows = await db.economicEvent.findMany({
      where: {
        date: {
          gte: new Date('2026-01-01T00:00:00Z'),
          lte: new Date('2026-12-31T23:59:59Z'),
        },
        category: 'inflation',
      },
      orderBy: { date: 'asc' },
      select: { title: true, date: true, time: true, actual: true, estimate: true, prev: true, unit: true },
    });

    events = rows.filter((r) => {
      const t = r.title.toLowerCase();
      return t.includes('cpi') || t.includes('consumer price');
    });
  } catch {
    // DB 오류 시 빈 목록으로 렌더링
  } finally {
    db.$disconnect().catch(() => {});
  }

  const nextEvent = events.find((e) => daysUntil(toDateStr(e.date)) >= 0);

  // Group events by date for ItemList JSON-LD (deduplicated)
  const uniqueDates = [...new Set(events.map((e) => toDateStr(e.date)))];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'CPI Release Dates 2026 — Consumer Price Index Schedule & Inflation Forecast',
      description: 'Complete CPI report release dates for 2026 with actual vs estimate data and market reaction.',
      url: `${SITE_URL}/cpi-release-dates-2026`,
      datePublished: '2026-01-01',
      dateModified: new Date().toISOString().slice(0, 10),
      publisher: { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
    },
    ...(events.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'CPI Release Dates 2026',
      description: 'All US Consumer Price Index report release dates in 2026',
      itemListElement: uniqueDates.map((ds, i) => {
        const ev = events.find((e) => toDateStr(e.date) === ds)!;
        return {
          '@type': 'ListItem',
          position: i + 1,
          name: `CPI Report — ${formatDate(ds)}`,
          url: `${SITE_URL}/events/${toSlug(ev.title, ds)}`,
        };
      }),
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'CPI Release Dates 2026', item: `${SITE_URL}/cpi-release-dates-2026` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-gray-950 text-white">
        <header className="border-b border-gray-800 px-6 py-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-white transition-colors">US Market Calendar</Link>
            <span>/</span>
            <span className="text-gray-300">CPI Release Dates 2026</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10">
          {/* Hero */}
          <div className="mb-8">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-orange-500/20 text-orange-300 border-orange-500/30 inline-block mb-4">
              Inflation
            </span>
            <h1 className="text-4xl font-bold text-white mt-2 mb-3">
              CPI Release Dates 2026
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
              Complete Consumer Price Index (CPI) report schedule for 2026 — actual vs estimate,
              monthly and annual inflation readings, and real-time QQQ &amp; SPY market reaction.
            </p>
          </div>

          {/* Next CPI countdown */}
          {nextEvent && (() => {
            const ds = toDateStr(nextEvent.date);
            const days = daysUntil(ds);
            return (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-8">
                <div className="text-orange-300 text-sm font-medium mb-1">Next CPI Release</div>
                <div className="text-2xl font-bold text-white mb-1">{formatDate(ds)}</div>
                {nextEvent.time && (
                  <div className="text-gray-400 text-sm">{nextEvent.time} ET — Bureau of Labor Statistics</div>
                )}
                <div className="text-orange-400 text-sm mt-2 font-medium">
                  {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                </div>
                {nextEvent.estimate != null && (
                  <div className="text-gray-400 text-sm mt-1">
                    Consensus estimate: <span className="text-yellow-400 font-mono">{nextEvent.estimate.toFixed(1)}%</span>
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
              2026 CPI Report Schedule
            </h2>
            {events.length === 0 ? (
              <div className="text-gray-500 text-sm py-12 text-center border border-gray-800 rounded-xl">
                CPI schedule data not yet available — check back soon.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Indicator</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Actual</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Estimate</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Previous</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Surprise</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e, idx) => {
                      const ds = toDateStr(e.date);
                      const days = daysUntil(ds);
                      const isPast = days < 0;
                      const isToday = days === 0;
                      const u = e.unit ?? '%';

                      const surprise =
                        e.actual != null && e.estimate != null
                          ? e.actual > e.estimate
                            ? 'hot'
                            : e.actual < e.estimate
                            ? 'cool'
                            : 'inline'
                          : null;

                      return (
                        <tr
                          key={`${ds}-${idx}`}
                          className={`border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors ${
                            isToday ? 'bg-orange-500/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap font-medium">
                            {formatDate(ds)}
                          </td>
                          <td className="px-4 py-3 text-gray-200 whitespace-nowrap">{e.title}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.actual != null ? (
                              <span className="text-white font-semibold">{e.actual}{u}</span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
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
                          <td className="px-4 py-3">
                            {surprise === 'hot' ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                                Hot
                              </span>
                            ) : surprise === 'cool' ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                                Cool
                              </span>
                            ) : surprise === 'inline' ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400">
                                In-line
                              </span>
                            ) : isPast ? (
                              <span className="text-xs text-gray-600">—</span>
                            ) : isToday ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                Today
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                Upcoming
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/events/${toSlug(e.title, ds)}`}
                              className="text-orange-400 hover:text-orange-300 text-xs whitespace-nowrap"
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
            )}
            <p className="text-gray-600 text-xs mt-2">
              Hot = above estimate (bearish for stocks). Cool = below estimate (bullish). Yellow = consensus estimate.
            </p>
          </section>

          {/* What is CPI */}
          <section className="space-y-5 mb-10 border-t border-gray-800 pt-8" aria-labelledby="explainer-heading">
            <h2 id="explainer-heading" className="text-xl font-bold text-white">What is the CPI?</h2>
            <p className="text-gray-400 leading-relaxed">
              The Consumer Price Index (CPI) is published monthly by the U.S. Bureau of Labor Statistics (BLS)
              and measures the average change in prices paid by urban consumers for a representative basket of goods
              and services. It covers approximately 93% of the total U.S. population and tracks categories including
              housing, food, energy, transportation, medical care, and apparel.
            </p>
            <div>
              <h3 className="text-gray-200 font-semibold mb-2">CPI vs Core CPI — what&apos;s the difference?</h3>
              <p className="text-gray-400 leading-relaxed">
                <strong className="text-gray-300">CPI</strong> (headline) includes all items.{' '}
                <strong className="text-gray-300">Core CPI</strong> strips out food and energy, which are volatile.
                Core CPI is considered a more reliable signal of underlying inflation trends.
                Note: the Fed&apos;s official preferred gauge is <strong className="text-gray-300">Core PCE</strong> (Personal Consumption Expenditures), not CPI.
              </p>
            </div>
            <div>
              <h3 className="text-gray-200 font-semibold mb-3">How CPI moves markets</h3>
              <ul className="space-y-2">
                {[
                  'Released at 8:30 AM ET — QQQ/SPY futures react immediately',
                  'Hot CPI (above estimate) → fewer rate cuts expected → stocks fall, yields rise',
                  'Cool CPI (below estimate) → more rate cuts priced in → stocks rally, yields fall',
                  'YoY (year-over-year) reading gets the most attention from media and Fed',
                  'MoM (month-over-month) gives the clearest signal of recent trend',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-400">
                    <span className="text-orange-400 mt-0.5 shrink-0">›</span>
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

          {/* CTA */}
          <div className="border-t border-gray-800 pt-8 flex gap-4 flex-wrap">
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View Full Market Calendar →
            </Link>
            <Link
              href="/fomc-dates-2026"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              FOMC Meeting Dates 2026 →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

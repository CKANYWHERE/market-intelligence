import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { toSlug } from '@/lib/utils/slug';

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

export const metadata: Metadata = {
  title: 'FOMC Meeting Dates 2026 — Federal Reserve Interest Rate Schedule',
  description:
    'Complete schedule of all 8 FOMC meetings in 2026. Federal Reserve interest rate decisions, dates, forecasts, and real-time QQQ & SPY market reaction tracker.',
  keywords: [
    'FOMC meeting dates 2026',
    'Federal Reserve meeting schedule 2026',
    'FOMC calendar 2026',
    'Fed interest rate decision 2026',
    'next FOMC meeting date',
    'Fed rate hike cut 2026',
    'FOMC 2026 all dates',
    'Federal Reserve rate decision schedule',
    'QQQ SPY FOMC impact',
    'fed funds rate 2026',
  ],
  alternates: { canonical: `${SITE_URL}/fomc-dates-2026` },
  openGraph: {
    title: 'FOMC Meeting Dates 2026 — Federal Reserve Interest Rate Schedule',
    description:
      'All 8 FOMC meeting dates in 2026. Real-time rate decisions, QQQ & SPY market reaction tracker.',
    url: `${SITE_URL}/fomc-dates-2026`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOMC Meeting Dates 2026 — Fed Rate Schedule',
    description: 'Complete FOMC 2026 schedule — rate decisions, market impact, QQQ/SPY reaction.',
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
    q: 'How many FOMC meetings are there in 2026?',
    a: 'The Federal Reserve holds 8 scheduled FOMC meetings per year. In 2026, meetings span January, March, May, June, July, September, October, and December.',
  },
  {
    q: 'What time does the FOMC rate decision get announced?',
    a: 'The FOMC interest rate decision is announced at 2:00 PM ET on the second day of each two-day meeting. The Fed Chair press conference follows at 2:30 PM ET.',
  },
  {
    q: 'How does the FOMC decision affect stock prices?',
    a: 'FOMC rate decisions directly impact equity markets. A rate cut is typically bullish for QQQ and SPY, while a rate hike pressures valuations — especially growth/tech stocks. The press conference tone often moves markets more than the decision itself.',
  },
  {
    q: 'What is the current Federal Funds rate in 2026?',
    a: 'The current Federal Funds target rate is displayed on the US Market Calendar homepage, updated in real-time after each FOMC meeting.',
  },
  {
    q: 'What is the dot plot and when is it released?',
    a: 'The Summary of Economic Projections (SEP), including the dot plot showing each Fed member\'s rate forecast, is released 4 times per year — at the March, June, September, and December FOMC meetings.',
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

export default async function FomcDates2026Page() {
  let events: EconomicRow[] = [];

  try {
    const rows = await db.economicEvent.findMany({
      where: {
        date: {
          gte: new Date('2026-01-01T00:00:00Z'),
          lte: new Date('2026-12-31T23:59:59Z'),
        },
        category: 'monetary_policy',
      },
      orderBy: { date: 'asc' },
      select: { title: true, date: true, time: true, actual: true, estimate: true, prev: true, unit: true },
    });

    events = rows.filter((r) => {
      const t = r.title.toLowerCase();
      return (
        (t.includes('rate decision') || t.includes('interest rate') || t.includes('federal funds'))
        && !t.includes('minutes')
        && !t.includes('beige')
        && !t.includes('speech')
        && !t.includes('testimony')
        && !t.includes('remarks')
        && !t.includes('press conference')
      );
    });
  } catch {
    // DB 오류 시 빈 목록으로 렌더링
  } finally {
    db.$disconnect().catch(() => {});
  }

  const nextEvent = events.find((e) => daysUntil(toDateStr(e.date)) >= 0);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'FOMC Meeting Dates 2026 — Federal Reserve Interest Rate Schedule',
      description: 'Complete list of all 8 FOMC meeting dates in 2026 with rate decisions and market impact.',
      url: `${SITE_URL}/fomc-dates-2026`,
      datePublished: '2026-01-01',
      dateModified: new Date().toISOString().slice(0, 10),
      publisher: { '@type': 'Organization', name: 'US Market Calendar', url: SITE_URL },
    },
    ...(events.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'FOMC Meeting Dates 2026',
      description: 'All Federal Reserve FOMC meeting dates and rate decisions in 2026',
      itemListElement: events.map((e, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `FOMC Rate Decision — ${formatDate(toDateStr(e.date))}`,
        url: `${SITE_URL}/events/${toSlug(e.title, toDateStr(e.date))}`,
      })),
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'FOMC Dates 2026', item: `${SITE_URL}/fomc-dates-2026` },
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
            <span className="text-gray-300">FOMC Meeting Dates 2026</span>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-10">
          {/* Hero */}
          <div className="mb-8">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/30 inline-block mb-4">
              Monetary Policy
            </span>
            <h1 className="text-4xl font-bold text-white mt-2 mb-3">
              FOMC Meeting Dates 2026
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
              Complete schedule of all 8 Federal Reserve FOMC meetings in 2026.
              Track interest rate decisions, policy signals, and real-time market reactions for QQQ &amp; SPY.
            </p>
          </div>

          {/* Next FOMC countdown */}
          {nextEvent && (() => {
            const ds = toDateStr(nextEvent.date);
            const days = daysUntil(ds);
            return (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
                <div className="text-blue-300 text-sm font-medium mb-1">Next FOMC Meeting</div>
                <div className="text-2xl font-bold text-white mb-1">{formatDate(ds)}</div>
                {nextEvent.time && (
                  <div className="text-gray-400 text-sm">{nextEvent.time} ET — Rate decision announcement</div>
                )}
                <div className="text-blue-400 text-sm mt-2 font-medium">
                  {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                </div>
                <Link
                  href={`/events/${toSlug(nextEvent.title, ds)}`}
                  className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
                >
                  View event details →
                </Link>
              </div>
            );
          })()}

          {/* Schedule table */}
          <section className="mb-10" aria-labelledby="schedule-heading">
            <h2 id="schedule-heading" className="text-xl font-bold text-white mb-4">
              2026 FOMC Schedule — All 8 Meetings
            </h2>
            {events.length === 0 ? (
              <div className="text-gray-500 text-sm py-12 text-center border border-gray-800 rounded-xl">
                FOMC schedule data not yet available — check back soon.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium w-6">#</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Time (ET)</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Rate</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium">Change</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-gray-400 font-medium w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e, idx) => {
                      const ds = toDateStr(e.date);
                      const days = daysUntil(ds);
                      const isPast = days < 0;
                      const isToday = days === 0;
                      // bps change: (actual - prev) * 100, e.g. -0.25 → -25 bps
                      const changeBps =
                        e.actual != null && e.prev != null
                          ? Math.round((e.actual - e.prev) * 100)
                          : null;

                      return (
                        <tr
                          key={`${ds}-${idx}`}
                          className={`border-b border-gray-800/50 hover:bg-gray-900/40 transition-colors ${
                            isToday ? 'bg-blue-500/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-600 text-xs">{idx + 1}</td>
                          <td className="px-4 py-3 text-gray-200 font-medium whitespace-nowrap">
                            {formatDate(ds)}
                          </td>
                          <td className="px-4 py-3 text-gray-400">{e.time ?? '14:00'}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {e.actual != null ? (
                              <span className="text-white font-semibold">{e.actual.toFixed(2)}%</span>
                            ) : e.estimate != null ? (
                              <span className="text-yellow-400">{e.estimate.toFixed(2)}%</span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {changeBps === null ? (
                              <span className="text-gray-600">—</span>
                            ) : changeBps === 0 ? (
                              <span className="text-gray-400">Hold</span>
                            ) : (
                              <span className={changeBps < 0 ? 'text-green-400' : 'text-red-400'}>
                                {changeBps > 0 ? '+' : ''}{changeBps} bps
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isPast ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                                Past
                              </span>
                            ) : isToday ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
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
                              className="text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap"
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
              Yellow = consensus estimate. Rate shown as Federal Funds target rate (upper bound).
            </p>
          </section>

          {/* What is FOMC */}
          <section className="space-y-5 mb-10 border-t border-gray-800 pt-8" aria-labelledby="explainer-heading">
            <h2 id="explainer-heading" className="text-xl font-bold text-white">What is the FOMC?</h2>
            <p className="text-gray-400 leading-relaxed">
              The Federal Open Market Committee (FOMC) is the monetary policy-making body of the U.S. Federal Reserve.
              It consists of 12 members — the 7 members of the Board of Governors and 5 of the 12 Federal Reserve Bank presidents.
              The FOMC meets 8 times per year to set the federal funds rate target, which directly influences
              borrowing costs, inflation, and economic growth across the entire U.S. economy.
            </p>
            <div>
              <h3 className="text-gray-200 font-semibold mb-2">Why FOMC matters for investors</h3>
              <p className="text-gray-400 leading-relaxed">
                The federal funds rate is the most powerful lever in U.S. monetary policy.
                Rate changes ripple through mortgage rates, corporate borrowing costs, bond yields, and equity
                valuations — especially growth and tech stocks in the NASDAQ-100 (QQQ).
                On FOMC decision days, QQQ and SPY typically react within minutes of the 2:00 PM ET announcement
                and see continued volatility during the Chair&apos;s 2:30 PM press conference.
              </p>
            </div>
            <div>
              <h3 className="text-gray-200 font-semibold mb-3">What to watch on FOMC day</h3>
              <ul className="space-y-2">
                {[
                  '2:00 PM ET — Rate decision + policy statement released simultaneously',
                  '2:30 PM ET — Fed Chair press conference (most market-moving part)',
                  'Dot plot (SEP) — released at March, June, September, December meetings',
                  'Language shifts: "patient", "data-dependent", "restrictive" signal future path',
                  'CME FedWatch — real-time futures-implied rate probabilities for next meetings',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-400">
                    <span className="text-blue-400 mt-0.5 shrink-0">›</span>
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
              href="/cpi-release-dates-2026"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              CPI Release Dates 2026 →
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}

import Link from 'next/link';
import { Metadata } from 'next';



const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://market-intelligence-87mm.vercel.app';

export const metadata: Metadata = {
  title: 'SpaceX IPO Date 2026 — NASDAQ Impact & QQQ Analysis',
  description: 'SpaceX IPO confirmed June 12, 2026. Valuation $1.75T. NASDAQ Fast Entry Rule forces QQQ passive ETF buying of $50B+. Full timeline, QQQ impact analysis, and date tracker.',
  keywords: [
    'SpaceX IPO date 2026',
    'SpaceX IPO June 2026',
    'SpaceX NASDAQ listing',
    'SpaceX stock ticker',
    'SpaceX valuation 2026',
    'QQQ SpaceX impact',
    'NASDAQ Fast Entry Rule SpaceX',
    'SpaceX IPO QQQ rebalancing',
    'passive ETF SpaceX buying',
    'SpaceX stock price IPO',
  ],
  alternates: { canonical: `${SITE_URL}/spacex-ipo` },
  openGraph: {
    title: 'SpaceX IPO Date 2026 — NASDAQ Impact & QQQ Analysis',
    description: 'SpaceX IPO confirmed June 12, 2026. $1.75T valuation. NASDAQ Fast Entry Rule triggers $50B+ in forced ETF buying.',
    url: `${SITE_URL}/spacex-ipo`,
  },
};

const IPO_DATE = 'June 12, 2026';

function daysUntilIPO(): number {
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date('2026-06-12T00:00:00Z');
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86_400_000));
}

const TIMELINE = [
  { date: 'Feb 2026',      label: 'S-1 Filed',              done: true,  desc: 'SpaceX confidentially filed S-1 registration with the SEC.' },
  { date: 'Apr 2026',      label: 'IPO Priced',             done: true,  desc: 'IPO priced at $180/share, valuing SpaceX at ~$1.75 trillion.' },
  { date: 'Jun 12, 2026',  label: 'First Day of Trading',   done: false, desc: 'SpaceX begins trading on NASDAQ under ticker SPCE.' },
  { date: '+15 Trading Days', label: 'NASDAQ-100 Fast Entry', done: false, desc: 'SpaceX eligible for immediate NASDAQ-100 inclusion under the 2026 Fast Entry Rule.' },
  { date: 'Jul 2026',      label: 'QQQ Rebalancing',        done: false, desc: 'QQQ, TQQQ, and other NASDAQ-100 ETFs forced to buy ~$50B+ in SPCE shares.' },
];

const QQQ_STATS = [
  { label: 'Expected Valuation',      value: '$1.75T',   note: 'At IPO price' },
  { label: 'Projected QQQ Weight',    value: '~8–10%',   note: 'Top 5 holding' },
  { label: 'Forced ETF Buying',       value: '$50B+',    note: 'QQQ + leveraged ETFs' },
  { label: 'Fast Entry Window',       value: '15 days',  note: 'From first trading day' },
  { label: 'QQQ AUM',                 value: '~$280B',   note: 'As of 2026' },
  { label: 'Comparable Entry',        value: 'Meta 2012', note: 'Similar scale disruption' },
];

export default function SpaceXIpoPage() {
  const days = daysUntilIPO();
  const isPast = days === 0;

  return (
    <div className="bg-gray-950 text-white min-h-screen">

      {/* Nav */}
      <nav className="border-b border-gray-800 px-4 md:px-8 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← US Market Calendar
        </Link>
        <span className="text-gray-700">/</span>
        <span className="text-gray-300 text-sm">SpaceX IPO</span>
      </nav>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-10 space-y-12">

        {/* Hero */}
        <section>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wide">
              IPO Confirmed
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold">
              NASDAQ: SPCE
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            SpaceX IPO Date: {IPO_DATE}
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            The largest IPO in history. $1.75T valuation, NASDAQ Fast Entry Rule, and $50B+ in forced passive ETF buying.
          </p>

          {/* Countdown */}
          {!isPast ? (
            <div className="inline-flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-xl px-6 py-4">
              <span className="text-4xl font-black text-white tabular-nums">{days}</span>
              <div>
                <div className="text-gray-400 text-sm">days until IPO</div>
                <div className="text-gray-600 text-xs">{IPO_DATE}</div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4">
              <span className="text-green-400 text-lg font-bold">SpaceX is now trading</span>
            </div>
          )}
        </section>

        {/* Key Stats */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">QQQ Impact at a Glance</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QQQ_STATS.map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl font-black text-white mb-1">{s.value}</div>
                <div className="text-gray-300 text-xs font-semibold mb-0.5">{s.label}</div>
                <div className="text-gray-600 text-xs">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why it matters */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Why QQQ Investors Must Watch This</h2>
          <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
            <p>
              In May 2026, NASDAQ introduced the <strong className="text-white">Fast Entry Rule</strong>: any company ranking in the top 40 of the NASDAQ-100 by market cap is eligible for <strong className="text-white">immediate inclusion within 15 trading days</strong> of its IPO — bypassing the standard quarterly rebalancing cycle.
            </p>
            <p>
              SpaceX at $1.75T would immediately rank as a <strong className="text-white">top-5 component</strong> of the NASDAQ-100, surpassing Meta, Alphabet, and Amazon in weight. This forces QQQ and all NASDAQ-100 tracking ETFs to buy a massive position in a short window.
            </p>
            <p>
              The estimated <strong className="text-white">$50B+ in forced passive buying</strong> within 15 trading days creates significant upward price pressure — similar to what happened with Tesla's NASDAQ-100 inclusion in 2020, but at a far larger scale.
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">IPO Timeline</h2>
          <div className="space-y-0">
            {TIMELINE.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-1 ${step.done ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-600'}`} />
                  {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-gray-800 my-1" />}
                </div>
                <div className={`pb-6 ${i < TIMELINE.length - 1 ? '' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500 text-xs font-mono">{step.date}</span>
                    {step.done && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <div className="text-white text-sm font-semibold mb-1">{step.label}</div>
                  <div className="text-gray-400 text-sm">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Related */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Other Upcoming IPOs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'Anthropic IPO', date: 'Oct 2026 (Expected)', href: '/events/anthropic-ipo-2026-10-01' },
              { name: 'OpenAI IPO',    date: 'Q4 2026 (Expected)',  href: '/events/openai-ipo-2026-12-01' },
            ].map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-3 transition-colors"
              >
                <div>
                  <div className="text-white text-sm font-semibold">{item.name}</div>
                  <div className="text-gray-500 text-xs">{item.date}</div>
                </div>
                <span className="text-gray-600 hover:text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-800 px-4 py-4 text-center text-gray-600 text-xs">
        Data is for informational purposes only. Not financial advice.
        &nbsp;·&nbsp;
        <Link href="/" className="hover:text-gray-400 transition-colors">US Market Calendar</Link>
      </footer>
    </div>
  );
}

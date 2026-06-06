import Link from 'next/link';
import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://marketclock.net';

export const metadata: Metadata = {
  title: 'NASDAQ Fast Entry Rule 2026 — Complete Guide for QQQ Investors',
  description:
    'The NASDAQ Fast Entry Rule (May 2026) lets top-40 companies join NASDAQ-100 within 15 trading days of IPO. SpaceX, OpenAI, and Anthropic all qualify — forcing $50B+ in passive ETF buying. Full guide with QQQ impact analysis.',
  keywords: [
    'NASDAQ fast entry rule 2026',
    'NASDAQ-100 fast entry rule',
    'QQQ SpaceX forced buying',
    'NASDAQ-100 IPO inclusion rule',
    'QQQ rebalancing 2026',
    'SpaceX NASDAQ-100 inclusion',
    'OpenAI NASDAQ fast entry',
    'Anthropic NASDAQ-100',
    'passive ETF forced buying IPO',
    'NASDAQ fast track rule',
    'QQQ SpaceX impact',
    'NASDAQ-100 rebalancing 2026',
  ],
  alternates: { canonical: `${SITE_URL}/nasdaq-fast-entry` },
  openGraph: {
    title: 'NASDAQ Fast Entry Rule 2026 — Complete Guide for QQQ Investors',
    description:
      'SpaceX, OpenAI, and Anthropic qualify for NASDAQ-100 Fast Entry — forcing $50B+ in mandatory passive ETF purchases within 15 trading days.',
    url: `${SITE_URL}/nasdaq-fast-entry`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NASDAQ Fast Entry Rule 2026 — QQQ Investor Guide',
    description: '$50B+ in forced ETF buying. SpaceX, OpenAI, Anthropic all qualify.',
  },
};

const QUALIFYING_COMPANIES = [
  {
    name: 'SpaceX',
    ticker: 'SPCE',
    valuation: '$1.75T',
    ipoDate: 'Jun 12, 2026',
    expectedWeight: '~8–10%',
    forcedBuying: '~$22–28B',
    status: 'IPO Confirmed',
    statusColor: 'green',
    href: '/spacex-ipo',
  },
  {
    name: 'OpenAI',
    ticker: 'TBD',
    valuation: '~$300B',
    ipoDate: 'Q4 2026 (Expected)',
    expectedWeight: '~2–3%',
    forcedBuying: '~$8–12B',
    status: 'Expected',
    statusColor: 'yellow',
    href: '/events/openai-ipo-2026-12-01',
  },
  {
    name: 'Anthropic',
    ticker: 'TBD',
    valuation: '~$61B',
    ipoDate: 'Oct 2026 (Expected)',
    expectedWeight: '<1%',
    forcedBuying: '~$2–3B',
    status: 'Expected',
    statusColor: 'yellow',
    href: '/events/anthropic-ipo-2026-10-01',
  },
];

const HISTORICAL_COMPARISONS = [
  {
    company: 'Tesla (TSLA)',
    date: 'Dec 21, 2020',
    valuation: '~$660B',
    forcedBuying: '~$16B',
    priceImpact: '+70% pre-inclusion run-up (Jul–Dec 2020)',
    rule: 'Standard quarterly rebalancing',
    note: 'Largest S&P 500 addition at that time. QQQ already held TSLA before S&P inclusion.',
  },
  {
    company: 'Airbnb (ABNB)',
    date: 'Dec 2020 IPO',
    valuation: '~$100B',
    forcedBuying: '~$3B',
    priceImpact: '+113% first-day pop',
    rule: 'Standard quarterly cycle (waited months)',
    note: 'Under the old rules, Airbnb waited until next quarterly rebalancing despite massive valuation.',
  },
  {
    company: 'Meta (FB → META)',
    date: 'May 2012 IPO',
    valuation: '~$100B',
    forcedBuying: '~$4B',
    priceImpact: '-50% in first 3 months post-IPO',
    rule: 'Standard quarterly cycle',
    note: 'Facebook waited for quarterly rebalancing. The new Fast Entry Rule would have included it within 15 days.',
  },
];

const FAQ = [
  {
    q: 'What is the NASDAQ Fast Entry Rule?',
    a: 'The NASDAQ Fast Entry Rule, enacted May 1, 2026, allows companies that rank in the top 40 of the NASDAQ-100 by market cap to be added to the index within 15 trading days of their IPO — bypassing the standard quarterly rebalancing cycle. Companies added under this rule receive a 3x initial weight multiplier.',
  },
  {
    q: 'Which companies qualify for the NASDAQ Fast Entry Rule?',
    a: 'Any company that (1) lists on NASDAQ, (2) meets NASDAQ-100 eligibility requirements (non-financial, US-listed, meets liquidity minimums), and (3) ranks in the top 40 of NASDAQ-100 by market cap at the time of IPO. SpaceX ($1.75T), OpenAI (~$300B), and Anthropic (~$61B) all qualify based on their current private market valuations.',
  },
  {
    q: 'What is the 3x weight multiplier in the NASDAQ Fast Entry Rule?',
    a: 'Under the Fast Entry Rule, newly added companies receive 3 times their natural market-cap-based weight at initial inclusion. This acknowledges their size while preventing an overnight shift in the index composition. The multiplier phases down to the standard weight at subsequent quarterly rebalancing.',
  },
  {
    q: 'How much will QQQ have to buy when SpaceX joins NASDAQ-100?',
    a: "QQQ has approximately $280B in AUM. At an 8–10% NASDAQ-100 weight, QQQ would need to hold $22–28B in SpaceX shares. Combined with QQQM, TQQQ (3x leveraged), and international NASDAQ-100 ETFs, total forced passive buying is estimated at $50B+ within the 15-trading-day window.",
  },
  {
    q: 'Has the NASDAQ Fast Entry Rule ever been triggered before?',
    a: 'No. The rule was enacted on May 1, 2026. SpaceX\'s June 12, 2026 IPO is the first expected instance of the Fast Entry Rule being triggered. This is why it\'s being closely watched by passive ETF investors.',
  },
  {
    q: 'How does the NASDAQ Fast Entry Rule compare to Tesla\'s S&P 500 inclusion?',
    a: "Tesla's S&P 500 addition in December 2020 forced approximately $16B in passive buying and was considered historic. SpaceX's NASDAQ-100 Fast Entry — at $1.75T valuation — would force $50B+ in buying compressed into a 15-trading-day window, roughly 3 times the scale.",
  },
  {
    q: 'Does the Fast Entry Rule apply to all stock exchanges?',
    a: 'No. The NASDAQ Fast Entry Rule only applies to companies listing on the NASDAQ exchange and qualifying for the NASDAQ-100 index. Companies listing on NYSE would not be affected by this specific rule.',
  },
];

const jsonLdGraphs = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'NASDAQ Fast Entry Rule 2026: Complete Guide for QQQ Investors',
    description:
      'Comprehensive guide to the NASDAQ Fast Entry Rule enacted May 2026, covering eligibility criteria, QQQ forced buying mechanics, SpaceX/OpenAI/Anthropic impact analysis, and historical comparisons.',
    url: `${SITE_URL}/nasdaq-fast-entry`,
    datePublished: '2026-06-01',
    dateModified: new Date().toISOString().slice(0, 10),
    publisher: {
      '@type': 'Organization',
      name: 'US Market Calendar',
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/nasdaq-fast-entry`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'US Market Calendar', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'NASDAQ Fast Entry Rule', item: `${SITE_URL}/nasdaq-fast-entry` },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  },
];

export default function NasdaqFastEntryPage() {
  return (
    <>
      {jsonLdGraphs.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="bg-gray-950 text-white min-h-screen">

        {/* Breadcrumb nav */}
        <nav className="border-b border-gray-800 px-4 md:px-8 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-white transition-colors">US Market Calendar</Link>
          <span>/</span>
          <span className="text-gray-300">NASDAQ Fast Entry Rule</span>
        </nav>

        <main className="max-w-3xl mx-auto px-4 md:px-8 py-10 space-y-14">

          {/* ── Hero ────────────────────────────────────────── */}
          <section>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wide">
                New Rule — May 2026
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-xs font-semibold">
                NASDAQ-100 / QQQ
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
              NASDAQ Fast Entry Rule 2026:<br className="hidden md:block" /> Complete Guide for QQQ Investors
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Starting May 1, 2026, the largest IPOs can skip the quarterly rebalancing queue and enter the NASDAQ-100 within 15 trading days. SpaceX is the first test — and the mechanics could force $50B+ in mandatory passive ETF buying.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Entry Window', value: '15 days', sub: 'From first trading day' },
                { label: 'Weight Multiplier', value: '3×', sub: 'At initial inclusion' },
                { label: 'Forced Buying (SPCE)', value: '$50B+', sub: 'QQQ + leveraged ETFs' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-gray-300 text-xs font-semibold mt-1">{s.label}</div>
                  <div className="text-gray-600 text-xs mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── What is the rule ───────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">What is the NASDAQ Fast Entry Rule?</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Traditionally, the NASDAQ-100 reconstitutes quarterly — in March, June, September, and December. Under the old system, even the largest newly public company had to wait for the next scheduled rebalancing, regardless of its market cap. A company like SpaceX listing in June would normally wait until September before passive ETFs were forced to buy.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              The <strong className="text-white">Fast Entry Rule, enacted May 1, 2026</strong>, eliminates this wait for the very largest IPOs. Companies that rank in the <strong className="text-white">top 40 of the NASDAQ-100 by market cap</strong> at the time of their IPO are eligible for immediate inclusion within <strong className="text-white">15 trading days</strong> — roughly three calendar weeks.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              This is not an automatic process: NASDAQ must formally confirm eligibility and announce the inclusion date. But for companies of SpaceX's scale, the outcome is almost certain.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mt-4">
              <h3 className="text-blue-300 font-semibold text-sm mb-3">Fast Entry Eligibility Requirements</h3>
              <ul className="space-y-2">
                {[
                  'Listed on the NASDAQ exchange (NYSE-listed companies do not qualify)',
                  'Meets NASDAQ-100 eligibility: non-financial sector, minimum liquidity requirements',
                  'Ranks in the top 40 of NASDAQ-100 constituents by market cap at IPO date',
                  'Has been publicly traded for at least one full trading day',
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── 3x multiplier ──────────────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">The 3× Initial Weight Multiplier</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Companies added under the Fast Entry Rule receive a <strong className="text-white">3× weight multiplier</strong> at initial inclusion. This means a company with a natural market-cap-based weight of 3% in the NASDAQ-100 would initially be added at 9%.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              The purpose is twofold: it acknowledges the company's genuine scale without requiring the index to absorb 100% of the final weighting in a single rebalancing event. The multiplier phases down to the standard cap-based weight at the next scheduled quarterly reconstitution.
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-gray-200 font-semibold text-sm mb-3">SpaceX Weight Example</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'SpaceX market cap at IPO', value: '$1.75T' },
                  { label: 'NASDAQ-100 total market cap (approx)', value: '~$25T' },
                  { label: 'Natural cap-based weight', value: '~3–4%' },
                  { label: 'Initial weight with 3× multiplier', value: '~9–12%' },
                  { label: 'QQQ forced purchase (3× weight)', value: '~$25–33B' },
                  { label: 'After quarterly rebalancing (natural weight)', value: '~3–4%' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400">{row.label}</span>
                    <span className="text-white font-mono font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Qualifying companies ───────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Companies Expected to Qualify in 2026</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Three of the most anticipated private companies in history are all expected to IPO in 2026 — and all three would qualify for NASDAQ Fast Entry based on their current private valuations.
            </p>
            <div className="space-y-3">
              {QUALIFYING_COMPANIES.map((co) => (
                <Link
                  key={co.name}
                  href={co.href}
                  className="block bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-white font-bold text-lg">{co.name}</span>
                      {co.ticker !== 'TBD' && (
                        <span className="ml-2 text-gray-500 text-sm font-mono">{co.ticker}</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      co.statusColor === 'green'
                        ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                        : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {co.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { label: 'Valuation', value: co.valuation },
                      { label: 'IPO Date', value: co.ipoDate },
                      { label: 'Expected QQQ Weight', value: co.expectedWeight },
                      { label: 'Estimated Forced Buying', value: co.forcedBuying },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="text-gray-600 text-xs mb-0.5">{item.label}</div>
                        <div className="text-white font-semibold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── QQQ forced buying mechanics ────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">The Forced Buying Mechanics: Why $50B+?</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              The "$50B+ forced buying" figure isn't a forecast — it's an accounting of mandatory purchases that passive index funds <em>must</em> make to maintain their tracking mandate. Here's how the math works:
            </p>
            <div className="space-y-3">
              {[
                {
                  fund: 'QQQ (Invesco)',
                  aum: '~$280B',
                  spceWeight: '8–10%',
                  mustBuy: '$22–28B',
                  note: 'Largest NASDAQ-100 ETF. Must buy within the 15-day window.',
                },
                {
                  fund: 'QQQM (Invesco)',
                  aum: '~$35B',
                  spceWeight: '8–10%',
                  mustBuy: '~$3B',
                  note: 'Retail-focused QQQ equivalent. Same mandate, smaller AUM.',
                },
                {
                  fund: 'TQQQ (ProShares 3×)',
                  aum: '~$25B',
                  spceWeight: '24–30% (3× levered)',
                  mustBuy: '~$6–8B',
                  note: '3× leveraged NASDAQ-100. Amplified exposure = amplified forced buying.',
                },
                {
                  fund: 'International NASDAQ-100 ETFs',
                  aum: '~$60B+',
                  spceWeight: '8–10%',
                  mustBuy: '~$5–6B',
                  note: 'iShares NASDAQ-100 (Europe/Asia), Xtrackers, Amundi, etc.',
                },
              ].map((row) => (
                <div key={row.fund} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-white font-semibold text-sm">{row.fund}</span>
                    <span className="text-blue-400 font-mono font-bold text-sm">{row.mustBuy}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                    <span>AUM: {row.aum}</span>
                    <span>SPCE weight: {row.spceWeight}</span>
                  </div>
                  <p className="text-gray-600 text-xs">{row.note}</p>
                </div>
              ))}
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-purple-300 font-semibold text-sm">Estimated Total Forced Buying</span>
                <span className="text-white font-black text-xl">$50B+</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Concentrated within a 15-trading-day window. Does not include momentum-driven discretionary buying.
              </p>
            </div>
          </section>

          {/* ── Historical comparison ──────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">Historical Comparison: Precedents for Large Index Additions</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              No company has ever been added to a major index under a Fast Entry Rule before. But history shows what large forced-buying events look like — and SpaceX would dwarf all of them.
            </p>
            <div className="space-y-4">
              {HISTORICAL_COMPARISONS.map((h) => (
                <div key={h.company} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-white font-bold">{h.company}</span>
                    <span className="text-gray-500 text-xs">{h.date}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <div className="text-gray-600 text-xs mb-0.5">Valuation at Entry</div>
                      <div className="text-white font-semibold">{h.valuation}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs mb-0.5">Estimated Forced Buying</div>
                      <div className="text-yellow-400 font-semibold">{h.forcedBuying}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs mb-0.5">Price Impact</div>
                      <div className="text-green-400 font-semibold text-xs">{h.priceImpact}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-xs mb-0.5">Inclusion Rule</div>
                      <div className="text-gray-400 text-xs">{h.rule}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs">{h.note}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-5">
              <h3 className="text-yellow-400 font-semibold text-sm mb-2">SpaceX vs. Tesla Comparison</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tesla's S&P 500 inclusion in December 2020 forced roughly $16B in passive buying — and TSLA rallied 70%+ in the six months before the official addition as markets anticipated the event. SpaceX's NASDAQ-100 Fast Entry would force <strong className="text-white">3× more buying ($50B+)</strong> compressed into a much shorter 15-trading-day window, with no pre-announcement runway for the market to gradually absorb.
              </p>
            </div>
          </section>

          {/* ── Investment implications ────────────────────── */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">What This Means for QQQ Holders</h2>
            <div className="space-y-3">
              {[
                {
                  title: 'Immediate QQQ composition shift',
                  body: "QQQ's top holdings would be reshuffled overnight. SpaceX at 8–10% weight would rank alongside or above current top holdings like MSFT, AAPL, and NVDA. Existing holdings may see their weights reduced to make room.",
                },
                {
                  title: 'Short-term price pressure on SpaceX',
                  body: '$50B+ in mandatory buying over 15 trading days creates substantial upward demand pressure on SPCE. Historical precedent (Tesla, Airbnb) shows stocks frequently rally 20–50%+ in the weeks surrounding major index inclusions.',
                },
                {
                  title: 'Dilution of current QQQ holdings',
                  body: 'To fund SpaceX purchases, passive ETFs must sell proportional amounts of existing holdings. This mechanical selling pressure could temporarily weigh on current top-10 QQQ components.',
                },
                {
                  title: 'Opportunity for active traders',
                  body: 'The 15-day Fast Entry window is fully disclosed once NASDAQ announces the inclusion date. Unlike quarterly rebalancing (which is known months ahead), the Fast Entry announcement may provide a shorter but still meaningful pre-inclusion trading window.',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 bg-gray-900 rounded-xl p-4">
                  <span className="text-blue-400 text-lg shrink-0 mt-0.5">›</span>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ───────────────────────────────────────── */}
          <section className="space-y-5">
            <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
            {FAQ.map((item, i) => (
              <div key={i} className="border-b border-gray-800 pb-5 last:border-0">
                <h3 className="text-white font-semibold text-sm mb-2">{item.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </section>

          {/* ── Related links ──────────────────────────────── */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Track All NASDAQ Fast Entry Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'SpaceX IPO — Full Analysis', href: '/spacex-ipo', desc: 'Date, valuation, QQQ weight calculator' },
                { label: 'Anthropic IPO Tracker', href: '/events/anthropic-ipo-2026-10-01', desc: 'Oct 2026 expected listing' },
                { label: 'OpenAI IPO Tracker', href: '/events/openai-ipo-2026-12-01', desc: 'Q4 2026 expected listing' },
                { label: 'Full IPO Calendar', href: '/', desc: 'All upcoming 2026 IPOs' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-4 py-3 transition-colors"
                >
                  <span className="text-white text-sm font-semibold">{link.label}</span>
                  <span className="text-gray-500 text-xs mt-0.5">{link.desc}</span>
                </Link>
              ))}
            </div>
          </section>

        </main>

        <footer className="border-t border-gray-800 px-4 py-4 text-center text-gray-600 text-xs">
          Data is for informational purposes only and does not constitute financial advice. Valuation figures are based on private market estimates.
          &nbsp;·&nbsp;
          <Link href="/" className="hover:text-gray-400 transition-colors">US Market Calendar</Link>
        </footer>
      </div>
    </>
  );
}

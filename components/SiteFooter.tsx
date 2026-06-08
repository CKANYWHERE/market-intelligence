import Link from 'next/link';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Disclaimer box */}
        <div className="bg-gray-900 border border-gray-700/60 rounded-xl px-5 py-4 space-y-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
            Important Disclaimer
          </p>
          <p className="text-gray-500 text-xs leading-relaxed">
            All content on this site — including market analysis, economic event summaries, scenario
            descriptions, historical pattern data, and any forward-looking commentary — is provided
            for <strong className="text-gray-400 font-medium">informational and educational purposes only</strong>.
            It does not constitute investment advice, financial advice, trading advice, or any other
            type of advice. Nothing on this site should be interpreted as a recommendation to buy,
            sell, or hold any security or financial instrument.
          </p>
          <p className="text-gray-500 text-xs leading-relaxed">
            Historical market reactions are based on past data and are <strong className="text-gray-400 font-medium">not
            indicative of future results</strong>. Market conditions change, and past patterns may not repeat.
            All investing involves risk, including the possible loss of principal.
            Always consult a qualified and licensed financial professional before making any
            investment decisions.
          </p>
          <p className="text-gray-500 text-xs leading-relaxed">
            This site is not registered as an investment adviser with the U.S. Securities and
            Exchange Commission (SEC) or any other regulatory body. Use of this site is subject to
            our <Link href="/disclaimer" className="text-blue-500/70 hover:text-blue-400 underline underline-offset-2 transition-colors">Terms &amp; Disclaimer</Link>.
          </p>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-600 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-700 font-medium">US Market Calendar</span>
            <span>·</span>
            <span>© {year} All rights reserved</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/disclaimer" className="hover:text-gray-400 transition-colors">
              Disclaimer
            </Link>
            <Link href="/nasdaq-fast-entry" className="hover:text-gray-400 transition-colors">
              NASDAQ Fast Entry
            </Link>
            <Link href="/spacex-ipo" className="hover:text-gray-400 transition-colors">
              SpaceX IPO
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

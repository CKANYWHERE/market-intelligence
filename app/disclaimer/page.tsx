import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclaimer & Terms of Use',
  description:
    'US Market Calendar disclaimer: all content is for informational purposes only and does not constitute investment advice.',
  robots: { index: true, follow: true },
};

export default function DisclaimerPage() {
  const year = new Date().getFullYear();

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-gray-300">
      <div>
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
          ← Back to Calendar
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white">Disclaimer &amp; Terms of Use</h1>
      <p className="text-gray-500 text-sm">Last updated: June {year}</p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">1. No Investment Advice</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          US Market Calendar (&ldquo;the Site&rdquo;) provides general financial information for
          educational and informational purposes only. Nothing on this Site constitutes investment
          advice, financial advice, trading recommendations, or any other type of professional
          financial guidance. No content should be interpreted as a solicitation or recommendation
          to buy, sell, or hold any security, commodity, currency, or other financial instrument.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">2. Historical Data &amp; Past Performance</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          Any references to historical market reactions, average price moves, or scenario analysis
          are based on past data compiled from publicly available sources. Past performance is not
          indicative of future results. Market conditions change, and historical patterns may not
          repeat. All figures presented are approximations and carry inherent uncertainty.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">3. AI-Generated Content</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          Portions of this Site use AI-assisted tools (including large language models) to
          summarize, classify, and present financial news and market data. AI-generated content
          may contain errors, inaccuracies, or omissions. You should independently verify all
          information before acting on it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">4. No Fiduciary Relationship</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          Use of this Site does not create a fiduciary, advisory, or professional relationship of
          any kind between you and the Site operators. The Site is not registered as an investment
          adviser with the U.S. Securities and Exchange Commission (SEC), FINRA, or any state or
          international regulatory authority.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">5. Risk Acknowledgment</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          Investing in securities involves significant risk, including the possible loss of your
          entire principal. You should carefully consider your investment objectives, risk
          tolerance, and financial situation before investing. Always consult a qualified,
          licensed financial professional before making any investment decisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">6. Accuracy of Information</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          While we strive to provide accurate and timely information, we make no representations
          or warranties of any kind, express or implied, about the completeness, accuracy,
          reliability, suitability, or availability of the information on this Site. Any reliance
          you place on such information is strictly at your own risk.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">7. Third-Party Data Sources</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          This Site aggregates data from third-party providers including Finnhub, FRED (Federal
          Reserve Bank of St. Louis), the Federal Reserve, SEC EDGAR, and others. We are not
          responsible for the accuracy or completeness of data provided by these sources.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">8. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          To the fullest extent permitted by law, the Site operators shall not be liable for any
          direct, indirect, incidental, consequential, or punitive damages arising from your use
          of, or reliance on, any content on this Site. This includes, without limitation, any
          financial losses resulting from investment decisions made based on information found here.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">9. Changes to This Disclaimer</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          We reserve the right to update or modify this disclaimer at any time without prior
          notice. Continued use of the Site following any changes constitutes your acceptance of
          the revised terms.
        </p>
      </section>

      <div className="border-t border-gray-800 pt-6 text-gray-600 text-xs">
        <p>© {year} US Market Calendar. All rights reserved.</p>
      </div>
    </main>
  );
}

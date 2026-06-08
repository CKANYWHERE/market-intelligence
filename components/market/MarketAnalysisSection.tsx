'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface Cause {
  title: string;
  description: string;
}

interface MarketAnalysis {
  id: string;
  title: string;
  event_date: string;
  market_condition: string;
  summary: string;
  causes: Cause[];
  outlook: string;
  reference_ticker: string;
  reference_change: number;
  reference_period: string;
}

type ConditionConfig = {
  label: string;
  color: string;
  bg: string;
  border: string;
};

const CONDITION_CONFIG: Record<string, ConditionConfig> = {
  correction_entry: { label: 'Correction Entry', color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/30'  },
  bear:             { label: 'Bear Market',       color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30'    },
  bull:             { label: 'Bull Market',       color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30'  },
  sideways:         { label: 'Sideways',          color: 'text-gray-400',   bg: 'bg-gray-400/10',   border: 'border-gray-400/30'   },
  recovery:         { label: 'Recovery',          color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30'   },
};

export default function MarketAnalysisSection() {
  const { data, isLoading } = useSWR<{ analysis: MarketAnalysis | null }>(
    '/api/market-analysis',
    fetcher,
    { refreshInterval: 10 * 60_000, revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <section
        aria-label="Market Analysis"
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse"
      >
        <div className="h-4 bg-gray-800 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-800 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-1/2" />
      </section>
    );
  }

  const analysis = data?.analysis;
  if (!analysis) return null;

  const cond   = CONDITION_CONFIG[analysis.market_condition] ?? CONDITION_CONFIG.sideways;
  const isNeg  = analysis.reference_change < 0;
  const changeColor = isNeg ? 'text-red-400' : 'text-green-400';
  const changeSign  = analysis.reference_change > 0 ? '+' : '';

  const analysisDate = new Date(analysis.event_date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

  return (
    <section
      aria-label="Market Analysis"
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm" aria-hidden="true">📉</span>
          <span className="text-white font-bold text-sm tracking-wide">Market Analysis</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cond.color} ${cond.bg} ${cond.border}`}>
            {cond.label}
          </span>
        </div>
        <span className="text-gray-600 text-xs">{analysisDate}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Title + reference ticker */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-white font-semibold text-base leading-snug">{analysis.title}</h2>
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-bold tabular-nums ${changeColor}`}>
              {changeSign}{analysis.reference_change.toFixed(1)}%
            </div>
            <div className="text-gray-500 text-xs">
              {analysis.reference_ticker} · {analysis.reference_period}
            </div>
          </div>
        </div>

        {/* Summary */}
        <p className="text-gray-400 text-sm leading-relaxed">{analysis.summary}</p>

        {/* Causes */}
        {(analysis.causes as Cause[]).length > 0 && (
          <div>
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
              Key Reasons
            </h3>
            <div className="space-y-2">
              {(analysis.causes as Cause[]).map((cause, i) => (
                <div key={i} className="flex gap-3 bg-gray-800/50 rounded-lg px-3 py-2.5">
                  <span className={`text-xs font-bold mt-0.5 flex-shrink-0 tabular-nums ${cond.color}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-gray-200 text-sm font-medium leading-snug">{cause.title}</p>
                    {cause.description && (
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{cause.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outlook */}
        <div className="border-t border-gray-800 pt-3">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            Outlook
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.outlook}</p>
        </div>
      </div>
    </section>
  );
}

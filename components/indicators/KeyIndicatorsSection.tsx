'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface SparkPoint { date: string; value: number }

interface Indicator {
  series_id:  string;
  name:       string;
  unit:       string;
  type:       string;
  latestDate: string;
  latest:     number;
  prev:       number | null;
  change:     number | null;
  sparkline:  SparkPoint[];
}

function Sparkline({ data }: { data: SparkPoint[] }) {
  if (data.length < 2) return null;
  const W = 80; const H = 28;
  const vals = data.map((d) => d.value);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const rng  = max - min || 1;
  const pts  = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((d.value - min) / rng) * H;
      return `${x},${y}`;
    })
    .join(' ');
  const last = data[data.length - 1];
  const lx   = W;
  const ly   = H - ((last.value - min) / rng) * H;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-20 h-7" aria-hidden>
      <polyline points={pts} fill="none" stroke="#4b5563" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={2} fill="#60a5fa" />
    </svg>
  );
}

function IndicatorCard({ ind }: { ind: Indicator }) {
  const isPositive = ind.change !== null && ind.change > 0;
  const isNegative = ind.change !== null && ind.change < 0;

  // Unemployment & inflation: lower = better (green)
  const goodDirection = ['UNRATE', 'CPIAUCSL', 'CPILFESL', 'PCEPILFE'].includes(ind.series_id)
    ? isNegative  // falling is good
    : isPositive; // rising is good (PAYEMS)

  const changeColor = ind.change === null ? 'text-gray-500'
    : goodDirection ? 'text-emerald-400'
    : 'text-red-400';

  const formatVal = (v: number) =>
    ind.type === 'diff'
      ? `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(0)}K`
      : `${v.toFixed(1)}${ind.unit}`;

  const formatChange = (v: number) =>
    ind.type === 'diff'
      ? `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(0)}K`
      : `${v >= 0 ? '+' : ''}${v.toFixed(2)}pp`;

  return (
    <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-4 min-w-[180px] flex-shrink-0">
      <div className="flex-1 min-w-0">
        <div className="text-gray-400 text-xs mb-1">{ind.name}</div>
        <div className="text-white font-mono font-bold text-xl leading-none">
          {formatVal(ind.latest)}
        </div>
        <div className={`text-xs mt-1 font-mono ${changeColor}`}>
          {ind.change !== null
            ? `${formatChange(ind.change)} vs prev`
            : `prev: ${ind.prev !== null ? formatVal(ind.prev) : '—'}`}
        </div>
        <div className="text-gray-700 text-[10px] mt-0.5">{ind.latestDate.slice(0, 7)}</div>
      </div>
      <Sparkline data={ind.sparkline} />
    </div>
  );
}

export default function KeyIndicatorsSection() {
  const { data, isLoading } = useSWR<{ indicators: Indicator[] }>(
    '/api/indicators',
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl h-20 min-w-[180px] animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  const indicators = data?.indicators ?? [];
  if (indicators.length === 0) return null;

  return (
    <section aria-label="Key Economic Indicators">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Key Indicators</h2>
        <span className="text-gray-600 text-xs">Source: FRED</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {indicators.map((ind) => (
          <IndicatorCard key={ind.series_id} ind={ind} />
        ))}
      </div>
    </section>
  );
}

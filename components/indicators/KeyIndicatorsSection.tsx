'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { INDICATOR_CONTEXT } from '@/lib/utils/marketContext';

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

function IndicatorCard({
  ind,
  active,
  onClick,
}: {
  ind: Indicator;
  active: boolean;
  onClick: () => void;
}) {
  const isPositive = ind.change !== null && ind.change > 0;
  const isNegative = ind.change !== null && ind.change < 0;

  const goodDirection = ['UNRATE', 'CPIAUCSL', 'CPILFESL', 'PCEPILFE'].includes(ind.series_id)
    ? isNegative
    : isPositive;

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
    <button
      onClick={onClick}
      className={`relative bg-gray-900 hover:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-4 min-w-[180px] flex-shrink-0 transition-colors text-left ${
        active ? 'ring-1 ring-blue-500/50' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-gray-400 text-xs">{ind.name}</span>
          <span className="text-gray-600 text-[10px]">ⓘ</span>
        </div>
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
    </button>
  );
}

function ContextPanel({ seriesId, onClose }: { seriesId: string; onClose: () => void }) {
  const ctx = INDICATOR_CONTEXT[seriesId];
  if (!ctx) return null;
  return (
    <div className="bg-gray-900 border border-gray-700/60 rounded-xl p-4 mt-2">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white text-sm font-semibold">{ctx.what}</p>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xs flex-shrink-0">✕</button>
      </div>
      <p className="text-gray-400 text-xs leading-relaxed mb-3">{ctx.why}</p>
      <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 leading-relaxed border-l-2 border-blue-500/50">
        {ctx.signal}
      </div>
    </div>
  );
}

export default function KeyIndicatorsSection() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isLoading } = useSWR<{ indicators: Indicator[] }>(
    '/api/indicators',
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
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
        <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Key Indicators <span className="text-gray-600 font-normal normal-case">— click for explanation</span>
        </h2>
        <span className="text-gray-600 text-xs">Source: FRED</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {indicators.map((ind) => (
          <IndicatorCard
            key={ind.series_id}
            ind={ind}
            active={activeId === ind.series_id}
            onClick={() => setActiveId(activeId === ind.series_id ? null : ind.series_id)}
          />
        ))}
      </div>
      {activeId && (
        <ContextPanel seriesId={activeId} onClose={() => setActiveId(null)} />
      )}
    </section>
  );
}

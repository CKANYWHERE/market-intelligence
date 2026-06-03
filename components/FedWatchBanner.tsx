'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { FedWatchData } from '@/app/api/fed-watch/route';

interface Resp { data: FedWatchData | null }

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function Skeleton() {
  return (
    <div className="border-b border-gray-800 bg-gray-900 px-4 md:px-6 py-3">
      <div className="flex items-center gap-4">
        <div className="h-3 w-40 bg-gray-800 rounded animate-pulse" />
        <div className="h-6 w-16 bg-gray-800 rounded animate-pulse" />
        <div className="h-3 w-48 bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function FedWatchBanner() {
  const { data: resp, isLoading } = useSWR<Resp>(
    '/api/fed-watch',
    fetcher,
    { refreshInterval: 600_000, dedupingInterval: 300_000, revalidateOnFocus: false },
  );

  if (isLoading) return <Skeleton />;
  const d = resp?.data;
  if (!d) return null;

  // 색상 / 레이블 — 확률에 따라 감성 표시
  const { color, bg, border, sentiment } =
    d.cutProb >= 65
      ? { color: 'text-green-400',  bg: 'bg-green-500/5',  border: 'border-green-500/20', sentiment: 'Dovish' }
      : d.cutProb >= 40
      ? { color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', sentiment: 'Neutral' }
      : { color: 'text-red-400',    bg: 'bg-red-500/5',    border: 'border-red-500/20',    sentiment: 'Hawkish' };

  const barWidth = `${Math.round(d.cutProb)}%`;

  return (
    <div className={`border-b ${border} ${bg} px-4 md:px-6 py-2.5`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">

        {/* 레이블 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
            Fed Rate Cut Odds
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${border} ${color}`}>
            {sentiment}
          </span>
        </div>

        {/* 메인 확률 */}
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          <span className={`text-2xl font-black font-mono tabular-nums ${color}`}>
            {d.cutProb.toFixed(0)}%
          </span>
          <span className="text-gray-500 text-xs">chance of cut</span>
        </div>

        {/* 프로그레스 바 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-600 text-[10px]">Cut</span>
          <div className="w-28 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                d.cutProb >= 65 ? 'bg-green-500' : d.cutProb >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: barWidth }}
            />
          </div>
          <span className="text-gray-600 text-[10px]">Hold</span>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center gap-3 ml-auto text-[11px] text-gray-500">
          <span>Next FOMC <span className="text-gray-400 font-medium">{formatDate(d.meetingDate)}</span></span>
          <span className="text-gray-700">·</span>
          <span>Current <span className="text-gray-400 font-mono">{d.currentRate.toFixed(2)}%</span></span>
          <span className="text-gray-700">·</span>
          <span>Implied <span className="text-gray-400 font-mono">{d.impliedRate.toFixed(3)}%</span></span>
          <span className="text-gray-700 hidden sm:inline">·</span>
          <span className="hidden sm:inline">via ZQ Futures</span>
        </div>

      </div>
    </div>
  );
}

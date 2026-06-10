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

// 가장 높은 확률 시나리오로 색상 결정
function getSentiment(d: FedWatchData) {
  if (d.hikeProb >= 40) {
    return { color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-500/20', label: 'Hawkish — Hike Risk' };
  }
  if (d.cutProb >= 65) {
    return { color: 'text-green-400', bg: 'bg-green-500/5', border: 'border-green-500/20', label: 'Dovish' };
  }
  if (d.cutProb >= 40) {
    return { color: 'text-yellow-400', bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', label: 'Neutral — Cut Lean' };
  }
  return { color: 'text-gray-400', bg: 'bg-gray-500/5', border: 'border-gray-500/20', label: 'Neutral — Hold' };
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

  const { color, bg, border, label } = getSentiment(d);

  // 3-way bar: hike (red, left) | hold (gray, center) | cut (green, right)
  const hikeW  = `${Math.round(d.hikeProb)}%`;
  const holdW  = `${Math.round(d.holdProb)}%`;
  const cutW   = `${Math.round(d.cutProb)}%`;

  // 주요 표시 확률 — 가장 높은 쪽
  const dominantProb  = Math.max(d.cutProb, d.holdProb, d.hikeProb);
  const dominantLabel =
    d.hikeProb === dominantProb ? 'hike' :
    d.cutProb  === dominantProb ? 'cut'  : 'hold';

  return (
    <div className={`border-b ${border} ${bg} px-4 md:px-6 py-2.5`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">

        {/* 레이블 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
            FOMC Rate Odds
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${border} ${color}`}>
            {label}
          </span>
        </div>

        {/* 메인 확률 */}
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          <span className={`text-2xl font-black font-mono tabular-nums ${color}`}>
            {dominantProb.toFixed(0)}%
          </span>
          <span className="text-gray-500 text-xs">chance of {dominantLabel}</span>
        </div>

        {/* 3-way 프로그레스 바 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-red-500 text-[10px]">Hike</span>
          <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-red-500   transition-all duration-500" style={{ width: hikeW }} />
            <div className="h-full bg-gray-600  transition-all duration-500" style={{ width: holdW }} />
            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: cutW  }} />
          </div>
          <span className="text-green-500 text-[10px]">Cut</span>
        </div>

        {/* 세부 확률 (작은 텍스트) */}
        <div className="flex items-center gap-2 text-[11px] flex-shrink-0">
          <span className="text-red-400 font-mono">{d.hikeProb.toFixed(0)}% hike</span>
          <span className="text-gray-700">·</span>
          <span className="text-gray-400 font-mono">{d.holdProb.toFixed(0)}% hold</span>
          <span className="text-gray-700">·</span>
          <span className="text-green-400 font-mono">{d.cutProb.toFixed(0)}% cut</span>
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center gap-3 ml-auto text-[11px] text-gray-500">
          <span>Next FOMC <span className="text-gray-400 font-medium">{formatDate(d.meetingDate)}</span></span>
          <span className="text-gray-700">·</span>
          <span>Current <span className="text-gray-400 font-mono">{d.currentRate.toFixed(2)}%</span></span>
          <span className="text-gray-700">·</span>
          <span>Implied <span className="text-gray-400 font-mono">{d.impliedRate.toFixed(3)}%</span></span>
          <span className="text-gray-700 hidden sm:inline">·</span>
          <span className="hidden sm:inline">via Polymarket</span>
        </div>

      </div>
    </div>
  );
}

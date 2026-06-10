'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { FedWatchData } from '@/app/api/fed-watch/route';

interface Response {
  data: FedWatchData | null;
  error?: string;
}

export default function FedWatchBadge() {
  const { data: resp, isLoading } = useSWR<Response>(
    '/api/fed-watch',
    fetcher,
    {
      refreshInterval:  600_000, // 10 min — CME updates every few minutes
      dedupingInterval: 300_000,
      revalidateOnFocus: false,
    },
  );

  if (isLoading) {
    return <div className="h-7 md:h-9 w-20 md:w-32 bg-gray-800 rounded-lg animate-pulse" />;
  }

  const d = resp?.data;
  if (!d) return null;

  // Color: high cut prob → green (dovish = good for stocks), low → gray
  const color =
    d.cutProb >= 60
      ? 'text-green-400'
      : d.cutProb >= 30
        ? 'text-yellow-400'
        : 'text-gray-400';

  // Format meeting date: "Jun 18" style
  const dateLabel = (() => {
    if (!d.meetingDate) return 'Next FOMC';
    const [y, m, day] = d.meetingDate.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  })();

  return (
    <div
      className="flex items-center gap-1 md:gap-2 bg-gray-900 border border-gray-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2"
      title={`Hold: ${d.holdProb}%  Cut: ${d.cutProb}%  Hike: ${d.hikeProb}%  (via Polymarket)`}
    >
      <span className="text-gray-400 font-semibold text-xs md:text-sm hidden md:inline">
        {dateLabel}
      </span>
      <span className="text-gray-500 text-xs hidden md:inline">cut</span>
      <span className={`font-mono font-bold text-xs md:text-sm ${color}`}>
        {d.cutProb.toFixed(1)}%
      </span>
      <span className="text-gray-600 text-[9px] md:text-xs hidden sm:inline">cut</span>
    </div>
  );
}

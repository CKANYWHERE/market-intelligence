'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface PulseData {
  value: number;
  change: number;
  changePercent: number;
}

interface MarketPulseResponse {
  vix: PulseData | null;
  tny: PulseData | null;
}

function PulseChip({
  label,
  data,
  invertColor,
}: {
  label: string;
  data: PulseData;
  invertColor?: boolean;
}) {
  const isPos = data.change >= 0;
  // VIX: rising = bad (red), falling = good (green) → invert
  const colorPos = invertColor ? 'text-red-400' : 'text-green-400';
  const colorNeg = invertColor ? 'text-green-400' : 'text-red-400';
  const color = isPos ? colorPos : colorNeg;
  const pct = `${isPos ? '+' : ''}${data.changePercent.toFixed(2)}%`;

  return (
    <div className="flex items-center gap-1 md:gap-2 bg-gray-900 border border-gray-800 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
      <span className="text-gray-400 font-semibold text-xs md:text-sm">{label}</span>
      <span className="hidden md:inline text-white font-mono text-sm">{data.value.toFixed(2)}</span>
      <span className={`text-xs font-mono font-medium ${color}`}>{pct}</span>
    </div>
  );
}

export default function MarketPulse() {
  const { data, isLoading } = useSWR<MarketPulseResponse>(
    '/api/market-pulse',
    fetcher,
    {
      refreshInterval:       120_000, // 2 min — VIX/TNX don't need 1 min updates
      revalidateOnFocus:     true,
      dedupingInterval:      60_000,
    },
  );

  if (isLoading) {
    return (
      <div className="flex gap-1.5 md:gap-3">
        {['VIX', '10Y'].map((s) => (
          <div key={s} className="h-7 md:h-9 w-14 md:w-28 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 md:gap-3">
      {data?.vix && (
        <PulseChip label="VIX" data={data.vix} invertColor />
      )}
      {data?.tny && (
        <PulseChip label="10Y" data={data.tny} />
      )}
    </div>
  );
}

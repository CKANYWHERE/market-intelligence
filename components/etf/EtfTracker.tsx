'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { QuoteData } from '@/types/events';

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'];

export default function EtfTracker() {
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const { data, isLoading } = useSWR<Record<string, QuoteData>>(
    '/api/quote',
    fetcher,
    {
      refreshInterval:       60_000,
      revalidateOnFocus:     true,
      revalidateOnReconnect: true,
      dedupingInterval:      30_000,
      onSuccess: () => setUpdatedAt(new Date()),
    },
  );

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {SYMBOLS.map((s) => (
          <div key={s} className="h-9 w-32 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {SYMBOLS.map((symbol) => {
        const q = data?.[symbol];
        if (!q) return null;
        const isPos = q.changePercent >= 0;
        return (
          <div
            key={symbol}
            className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2"
          >
            <span className="text-gray-300 font-semibold text-sm">{symbol}</span>
            <span className="text-white font-mono text-sm">${q.current.toFixed(2)}</span>
            <span className={`text-xs font-mono font-medium ${isPos ? 'text-green-400' : 'text-red-400'}`}>
              {isPos ? '+' : ''}{q.changePercent.toFixed(2)}%
            </span>
          </div>
        );
      })}
      {updatedAt && (
        <span className="text-gray-700 text-xs hidden sm:block">
          {updatedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

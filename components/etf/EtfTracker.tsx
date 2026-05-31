'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { QuoteData } from '@/types/events';

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'];

export default function EtfTracker() {
  const { data, isLoading, dataUpdatedAt } = useSWR<Record<string, QuoteData>>(
    '/api/quote',
    fetcher,
    {
      refreshInterval:    60_000,  // 60초마다 자동 갱신
      revalidateOnFocus:  true,    // 탭 포커스 시 갱신
      revalidateOnReconnect: true, // 네트워크 재연결 시 갱신
      dedupingInterval:   30_000,  // 30초 내 중복 요청 방지
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
      {dataUpdatedAt && (
        <span className="text-gray-700 text-xs hidden sm:block">
          {new Date(dataUpdatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

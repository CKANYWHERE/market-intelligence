'use client';

import { useEffect, useRef, useState } from 'react';
import { QuoteData } from '@/types/events';

const SYMBOLS  = ['QQQ', 'SPY', 'SCHD'];
const INTERVAL = 60_000; // 60초마다 갱신

export default function EtfTracker() {
  const [quotes, setQuotes]   = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchQuotes() {
    try {
      const res  = await fetch('/api/quote');
      const data = await res.json();
      setQuotes(data);
      setUpdatedAt(new Date());
    } catch {
      // 실패해도 이전 데이터 유지
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuotes();
    timerRef.current = setInterval(fetchQuotes, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (loading) {
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
        const q = quotes[symbol];
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

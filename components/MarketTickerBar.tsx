'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { QuoteData } from '@/types/events';

const ETF_SYMBOLS = ['QQQ', 'SPY', 'SCHD'];

interface PulseData { value: number; change: number; changePercent: number }
interface PulseResp  { vix: PulseData | null; tny: PulseData | null }

function Divider() {
  return <span className="text-gray-700 select-none mx-1">·</span>;
}

function SectionDivider() {
  return <span className="text-gray-700 select-none mx-2">|</span>;
}

function Skeleton() {
  return (
    <div className="border-b border-gray-800 bg-gray-900 flex items-center gap-3 px-4 py-1.5">
      {[80, 64, 64, 56, 56, 72].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded bg-gray-800 animate-pulse flex-shrink-0"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

export default function MarketTickerBar() {
  const { data: quotes, isLoading: qLoading } = useSWR<Record<string, QuoteData>>(
    '/api/quote',
    fetcher,
    { refreshInterval: 60_000, dedupingInterval: 30_000, revalidateOnFocus: true },
  );

  const { data: pulse } = useSWR<PulseResp>(
    '/api/market-pulse',
    fetcher,
    { refreshInterval: 120_000, dedupingInterval: 60_000 },
  );

  if (qLoading || (!quotes && !pulse)) return <Skeleton />;

  const items: React.ReactNode[] = [];

  // ── ETF 섹션 ────────────────────────────────────────────────
  let etfCount = 0;
  for (const symbol of ETF_SYMBOLS) {
    const q = quotes?.[symbol];
    if (!q) continue;
    const isPos = q.changePercent >= 0;
    const pct   = `${isPos ? '+' : ''}${q.changePercent.toFixed(2)}%`;
    const state = q.marketState === 'PRE'  ? 'PRE'
                : q.marketState === 'POST' ? 'POST'
                : null;

    if (etfCount > 0) items.push(<Divider key={`d-etf-${symbol}`} />);
    items.push(
      <span key={symbol} className="flex items-center gap-1 flex-shrink-0">
        <span className="text-gray-400 font-semibold">{symbol}</span>
        <span className="text-white font-mono">${q.current.toFixed(2)}</span>
        <span className={`font-mono font-medium ${isPos ? 'text-green-400' : 'text-red-400'}`}>
          {pct}
        </span>
        {state && (
          <span className={`text-[9px] font-bold leading-none ${state === 'PRE' ? 'text-yellow-400' : 'text-purple-400'}`}>
            {state}
          </span>
        )}
      </span>,
    );
    etfCount++;
  }

  // ── VIX / 10Y 섹션 ──────────────────────────────────────────
  const vix = pulse?.vix;
  const tny = pulse?.tny;

  if ((vix || tny) && etfCount > 0) {
    items.push(<SectionDivider key="sep-pulse" />);
  }

  if (vix) {
    const isPos = vix.change >= 0;
    const color = isPos ? 'text-green-400' : 'text-red-400';
    const pct   = `${isPos ? '+' : ''}${vix.changePercent.toFixed(1)}%`;
    items.push(
      <span key="vix" className="flex items-center gap-1 flex-shrink-0">
        <span className="text-gray-400 font-semibold">VIX</span>
        <span className="text-white font-mono">{vix.value.toFixed(2)}</span>
        <span className={`font-mono font-medium ${color}`}>{pct}</span>
      </span>,
    );
  }

  if (tny) {
    if (vix) items.push(<Divider key="d-tny" />);
    const isPos = tny.change >= 0;
    const color = isPos ? 'text-green-400' : 'text-red-400';
    const pct   = `${isPos ? '+' : ''}${tny.changePercent.toFixed(1)}%`;
    items.push(
      <span key="tny" className="flex items-center gap-1 flex-shrink-0">
        <span className="text-gray-400 font-semibold">10Y</span>
        <span className="text-white font-mono">{tny.value.toFixed(2)}</span>
        <span className={`font-mono font-medium ${color}`}>{pct}</span>
      </span>,
    );
  }


  if (items.length === 0) return <Skeleton />;

  return (
    <div
      className="border-b border-gray-800 bg-gray-900 px-4 py-1.5 text-xs overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <div className="flex items-center min-w-max">
        {items}
      </div>
    </div>
  );
}

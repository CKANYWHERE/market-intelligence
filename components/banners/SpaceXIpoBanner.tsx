'use client';

import Link from 'next/link';

const IPO_DATE   = new Date('2026-06-12T00:00:00Z');
const HIDE_AFTER = new Date('2026-07-12T00:00:00Z');

function getDaysUntil(): number {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Math.round((IPO_DATE.getTime() - today.getTime()) / 86_400_000);
}

export default function SpaceXIpoBanner() {
  const now = new Date();
  if (now >= HIDE_AFTER) return null;

  const days   = getDaysUntil();
  const isLive = days <= 0;

  return (
    <Link href="/spacex-ipo" className="block group" aria-label="SpaceX IPO — Learn more">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-gray-900 to-gray-950 border-b border-blue-900/40 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 hover:from-blue-900/80 transition-colors duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 text-lg">🚀</span>
          <div className="min-w-0">
            <span className="text-white font-bold text-sm">SpaceX IPO</span>
            <span className="text-gray-400 text-sm ml-2 hidden sm:inline">
              {isLive
                ? 'Now trading on NASDAQ · $1.75T valuation · QQQ impact analysis'
                : `${days}d until IPO · $1.75T valuation · NASDAQ Fast Entry forces $50B+ ETF buying`}
            </span>
            <span className="text-gray-400 text-sm ml-2 sm:hidden">
              {isLive ? 'Now trading' : `D-${days}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {!isLive && (
            <div className="hidden md:flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 rounded-lg px-3 py-1">
              <span className="text-blue-300 text-xs font-mono font-bold tabular-nums">{days}</span>
              <span className="text-blue-400 text-xs">days</span>
            </div>
          )}
          {isLive && (
            <span className="text-green-400 text-xs font-bold animate-pulse">LIVE</span>
          )}
          <span className="text-blue-400 text-xs font-medium group-hover:text-blue-300 transition-colors">
            QQQ Impact →
          </span>
        </div>
      </div>
    </Link>
  );
}

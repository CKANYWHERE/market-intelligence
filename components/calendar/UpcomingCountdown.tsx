'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { toSlug } from '@/lib/utils/slug';
import { EventCategory } from '@/types/events';
import { CATEGORY_CONTEXT, INDICATOR_CONTEXT, getSeriesIdFromTitle } from '@/lib/utils/marketContext';

interface NextEvent {
  id:       string;
  title:    string;
  date:     string;
  time?:    string;
  category: EventCategory;
}

const CATEGORY_STYLE: Record<EventCategory, { border: string; text: string; label: string }> = {
  monetary_policy: { border: 'border-blue-500/40',   text: 'text-blue-300',   label: 'FOMC'      },
  inflation:       { border: 'border-orange-500/40', text: 'text-orange-300', label: 'Inflation' },
  employment:      { border: 'border-green-500/40',  text: 'text-green-300',  label: 'Jobs'      },
  growth:          { border: 'border-purple-500/40', text: 'text-purple-300', label: 'Growth'    },
  earnings:        { border: 'border-yellow-500/40', text: 'text-yellow-300', label: 'Earnings'  },
  ipo:             { border: 'border-pink-500/40',   text: 'text-pink-300',   label: 'IPO'       },
  breaking:        { border: 'border-red-500/40',    text: 'text-red-300',    label: 'Breaking'  },
};

function daysUntil(dateStr: string, timeStr?: string): number {
  const target = timeStr
    ? new Date(`${dateStr}T${timeStr}:00-05:00`)
    : new Date(`${dateStr}T00:00:00-05:00`);
  const diffMs   = target.getTime() - Date.now();
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

function CountdownCard({
  ev,
  active,
  onInfoClick,
}: {
  ev: NextEvent;
  active: boolean;
  onInfoClick: () => void;
}) {
  const [days, setDays] = useState(() => daysUntil(ev.date, ev.time));
  useEffect(() => {
    const id = setInterval(() => setDays(daysUntil(ev.date, ev.time)), 60_000);
    return () => clearInterval(id);
  }, [ev.date, ev.time]);

  const style   = CATEGORY_STYLE[ev.category] ?? CATEGORY_STYLE.growth;
  const isToday = days === 0;
  const slug    = toSlug(ev.title, ev.date);

  const shortTitle = ev.title
    .replace('Federal Funds Rate Decision', 'Fed Rate Decision')
    .replace(' m/m', ' MoM')
    .replace(' y/y', ' YoY')
    .replace('Nonfarm Payrolls', 'NFP');

  return (
    <div className={`bg-gray-900 border ${style.border} ${active ? 'ring-1 ring-blue-500/40' : ''} rounded-xl px-4 py-3 flex flex-col gap-1.5 min-w-[150px] flex-shrink-0`}>
      <div className="flex items-center justify-between">
        <div className={`text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
          {style.label}
        </div>
        <button
          onClick={onInfoClick}
          className="text-gray-600 hover:text-gray-400 text-[10px] transition-colors"
          aria-label="What does this mean?"
        >
          ⓘ
        </button>
      </div>
      <Link href={`/events/${slug}`} className="hover:text-blue-300 transition-colors">
        <div className="text-white text-sm font-medium leading-tight line-clamp-2">
          {shortTitle}
        </div>
      </Link>
      <div className="mt-auto pt-1 flex items-end justify-between">
        <div className={`font-mono font-bold text-2xl ${isToday ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
          {isToday ? 'Today' : `D-${days}`}
        </div>
        <div className="text-gray-500 text-[10px] font-mono">
          {ev.date.slice(5)}{ev.time ? ` ${ev.time}ET` : ''}
        </div>
      </div>
    </div>
  );
}

function EventContextPanel({ ev, onClose }: { ev: NextEvent; onClose: () => void }) {
  const seriesId = getSeriesIdFromTitle(ev.title);
  const indCtx   = seriesId ? INDICATOR_CONTEXT[seriesId] : null;
  const catCtx   = CATEGORY_CONTEXT[ev.category];

  return (
    <div className="bg-gray-900 border border-gray-700/60 rounded-xl p-4 mt-2">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-white text-sm font-semibold">
          {indCtx ? indCtx.what : catCtx?.headline ?? ev.title}
        </p>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 text-xs flex-shrink-0">✕</button>
      </div>
      {indCtx ? (
        <>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">{indCtx.why}</p>
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 leading-relaxed border-l-2 border-blue-500/50">
            {indCtx.signal}
          </div>
        </>
      ) : catCtx ? (
        <>
          <p className="text-gray-400 text-xs leading-relaxed mb-3">{catCtx.body}</p>
          <div className="grid grid-cols-1 gap-1.5">
            <div className="flex items-start gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
              <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">▲</span>
              <p className="text-gray-400 text-xs leading-relaxed">{catCtx.bullish}</p>
            </div>
            <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
              <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">▼</span>
              <p className="text-gray-400 text-xs leading-relaxed">{catCtx.bearish}</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function UpcomingCountdown() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isLoading } = useSWR<{ events: NextEvent[] }>(
    '/api/next-event',
    fetcher,
    { refreshInterval: 1_800_000, revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl h-24 min-w-[150px] animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  const events = data?.events ?? [];
  if (events.length === 0) return null;

  const activeEvent = events.find((ev) => ev.id === activeId) ?? null;

  return (
    <section aria-label="Upcoming market events countdown">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Next Events <span className="text-gray-600 font-normal normal-case">— ⓘ for explanation</span>
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {events.map((ev) => (
          <CountdownCard
            key={ev.id}
            ev={ev}
            active={activeId === ev.id}
            onInfoClick={() => setActiveId(activeId === ev.id ? null : ev.id)}
          />
        ))}
      </div>
      {activeEvent && (
        <EventContextPanel ev={activeEvent} onClose={() => setActiveId(null)} />
      )}
    </section>
  );
}

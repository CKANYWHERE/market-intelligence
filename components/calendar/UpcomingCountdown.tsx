'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { toSlug } from '@/lib/utils/slug';
import { EventCategory } from '@/types/events';

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

function CountdownCard({ ev }: { ev: NextEvent }) {
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
    <Link
      href={`/events/${slug}`}
      className={`group bg-gray-900 hover:bg-gray-800 border ${style.border} rounded-xl px-4 py-3 flex flex-col gap-1.5 min-w-[150px] flex-shrink-0 transition-colors`}
    >
      <div className={`text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
        {style.label}
      </div>
      <div className="text-white text-sm font-medium leading-tight line-clamp-2">
        {shortTitle}
      </div>
      <div className="mt-auto pt-1 flex items-end justify-between">
        <div className={`font-mono font-bold text-2xl ${isToday ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
          {isToday ? 'Today' : `D-${days}`}
        </div>
        <div className="text-gray-500 text-[10px] font-mono">
          {ev.date.slice(5)}{ev.time ? ` ${ev.time}ET` : ''}
        </div>
      </div>
    </Link>
  );
}

export default function UpcomingCountdown() {
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

  return (
    <section aria-label="Upcoming market events countdown">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-gray-400 text-xs font-medium uppercase tracking-wider">Next Events</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {events.map((ev) => (
          <CountdownCard key={ev.id} ev={ev} />
        ))}
      </div>
    </section>
  );
}

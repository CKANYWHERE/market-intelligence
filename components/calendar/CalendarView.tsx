'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { CalendarEvent, EventCategory } from '@/types/events';
import { buildMonthGrid, formatMonthTitle } from '@/lib/utils/calendar';
import { CATEGORY_META } from '@/lib/utils/categorize';
import EventChip from './EventChip';

const ALL_CATEGORIES: EventCategory[] = [
  'monetary_policy', 'inflation', 'employment', 'growth', 'earnings', 'ipo',
];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarResponse { events: CalendarEvent[] }
interface Props {
  selectedEvent: CalendarEvent | null;
  onSelectEvent: (event: CalendarEvent | null) => void;
}

export default function CalendarView({ selectedEvent, onSelectEvent }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [activeCategories, setActiveCategories] = useState<Set<EventCategory>>(
    new Set(ALL_CATEGORIES),
  );

  const { data, isLoading, error, mutate } = useSWR<CalendarResponse>(
    `/api/calendar?year=${year}&month=${month}`,
    fetcher,
    {
      revalidateOnFocus:     false, // 캘린더는 탭 전환 시 불필요한 갱신 방지
      revalidateOnReconnect: true,
      dedupingInterval:      60_000,
    },
  );

  const events = data?.events ?? [];

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }
  function toggleCategory(cat: EventCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { if (next.size > 1) next.delete(cat); }
      else next.add(cat);
      return next;
    });
  }

  const eventMap: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!activeCategories.has(ev.category)) continue;
    if (!eventMap[ev.date]) eventMap[ev.date] = [];
    eventMap[ev.date].push(ev);
  }

  const grid = buildMonthGrid(year, month);
  const totalFiltered = events.filter((e) => activeCategories.has(e.category)).length;

  return (
    <section aria-label="Market Events Calendar" className="flex-1 flex flex-col min-h-0">
      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Filter by category">
        {ALL_CATEGORIES.map((cat) => {
          const meta   = CATEGORY_META[cat];
          const active = activeCategories.has(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              aria-pressed={active}
              className={`
                px-3 py-1 rounded-full text-xs font-medium border transition-all
                ${active ? meta.chipClass : 'bg-transparent text-gray-600 border-gray-800 hover:border-gray-600'}
              `}
            >
              {meta.label}
            </button>
          );
        })}
        <span className="ml-auto text-gray-600 text-xs self-center">
          {isLoading ? 'Loading…' : error ? (
            <button
              onClick={() => mutate()}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              ⚠ Failed — retry
            </button>
          ) : `${totalFiltered} events`}
        </span>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={prevMonth} aria-label="Previous month"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          ‹
        </button>
        <h2 className="text-white font-bold text-lg flex-1 text-center">
          {formatMonthTitle(year, month)}
        </h2>
        <button onClick={nextMonth} aria-label="Next month"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          ›
        </button>
        <button onClick={goToday}
          className="px-3 py-1 text-xs text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
          Today
        </button>
      </div>

      {/* Calendar grid */}
      <div
        role="grid"
        aria-label={`${formatMonthTitle(year, month)} calendar`}
        className="flex-1 grid grid-cols-7 gap-px bg-gray-800 rounded-xl overflow-hidden border border-gray-800"
      >
        {DOW.map((d, i) => (
          <div key={i} role="columnheader"
            aria-label={['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}
            className={`bg-gray-900 text-center text-xs font-semibold py-2 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
            {d}
          </div>
        ))}

        {grid.map((day, idx) => {
          const dayEvents  = eventMap[day.dateKey] ?? [];
          const visible    = dayEvents.slice(0, 3);
          const overflow   = dayEvents.length - visible.length;
          const isSelected = selectedEvent?.date === day.dateKey;
          const dow        = day.date.getDay();

          return (
            <div key={idx} role="gridcell"
              aria-label={`${day.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ''}`}
              className={`
                bg-gray-900 min-h-[88px] p-1.5 flex flex-col gap-0.5
                ${!day.isCurrentMonth ? 'opacity-25' : ''}
                ${isSelected ? 'ring-1 ring-inset ring-blue-500/50' : ''}
                ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-gray-800/60' : ''}
                transition-colors
              `}
              onClick={() => { if (dayEvents.length === 1) onSelectEvent(dayEvents[0]); }}
            >
              <span className={`
                text-xs self-end leading-none w-6 h-6 flex items-center justify-center rounded-full font-medium
                ${day.isToday ? 'bg-blue-500 text-white' : dow === 0 ? 'text-red-400/70' : dow === 6 ? 'text-blue-400/70' : 'text-gray-500'}
              `}>
                {day.date.getDate()}
              </span>

              {visible.map((ev) => (
                <EventChip key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
              ))}

              {overflow > 0 && (
                <button
                  className="text-xs text-gray-500 hover:text-gray-300 text-left pl-1.5 transition-colors"
                  onClick={(e) => { e.stopPropagation(); onSelectEvent(dayEvents[3]); }}
                >
                  +{overflow} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

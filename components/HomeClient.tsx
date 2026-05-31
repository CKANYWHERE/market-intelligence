'use client';

import { useState } from 'react';
import { CalendarEvent, NewsItem } from '@/types/events';
import EtfTracker from '@/components/etf/EtfTracker';
import BreakingSection from '@/components/breaking/BreakingSection';
import CalendarView from '@/components/calendar/CalendarView';
import EventDetailPanel from '@/components/detail/EventDetailPanel';
import AdBanner from '@/components/ads/AdBanner';

export default function HomeClient({ initialNews }: { initialNews: NewsItem[] }) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">📊</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              US Market Intelligence Dashboard
            </h1>
            <p className="text-gray-500 text-xs">
              Economic Calendar · Earnings · IPO Tracker · Breaking News
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <EtfTracker />
        </div>
      </header>

      {/* ── Ad — Header 하단 (Leaderboard 728×90) ───────────────── */}
      <AdBanner
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? ''}
        format="horizontal"
        className="bg-gray-900 border-b border-gray-800 px-6 py-2 flex justify-center"
      />

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 p-6 gap-4 overflow-hidden">
        {/* Breaking market news */}
        <BreakingSection initialNews={initialNews} />

        {/* Calendar + side panel */}
        <div className="flex-1 flex gap-4 min-h-0">
          <CalendarView selectedEvent={selectedEvent} onSelectEvent={setSelectedEvent} />
          <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>

        {/* ── Ad — 캘린더 하단 (Rectangle 336×280) ─────────────── */}
        <AdBanner
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? ''}
          format="rectangle"
          className="flex justify-center py-2"
        />
      </main>
    </div>
  );
}

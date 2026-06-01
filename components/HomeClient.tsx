'use client';

import { useState } from 'react';
import { CalendarEvent, NewsItem } from '@/types/events';
import EtfTracker from '@/components/etf/EtfTracker';
import BreakingSection from '@/components/breaking/BreakingSection';
import CalendarView from '@/components/calendar/CalendarView';
import EventDetailPanel from '@/components/detail/EventDetailPanel';
import AdBanner from '@/components/ads/AdBanner';

export default function HomeClient({ initialNews }: { initialNews: NewsItem[] }) {
  const [selectedEvent, setSelectedEvent]         = useState<CalendarEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[] | null>(null);

  function handleSelectEvent(event: CalendarEvent | null) {
    setSelectedEvent(event);
    if (event) setSelectedDayEvents(null);
  }

  function handleSelectDay(events: CalendarEvent[]) {
    setSelectedDayEvents(events);
    setSelectedEvent(null);
  }

  function handleClose() {
    setSelectedEvent(null);
    setSelectedDayEvents(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">📊</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              US Market Calendar
            </h1>
            <p className="text-gray-500 text-xs">
              FOMC · CPI · Earnings · IPO · Breaking News — Free Real-Time Dashboard
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
          <CalendarView
            selectedEvent={selectedEvent}
            onSelectEvent={handleSelectEvent}
            onSelectDay={handleSelectDay}
          />
          <EventDetailPanel
            event={selectedEvent}
            dayEvents={selectedDayEvents}
            onSelectEvent={handleSelectEvent}
            onClose={handleClose}
          />
        </div>

        {/* ── Ad — 캘린더 하단 (Rectangle 336×280) ─────────────── */}
        <AdBanner
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? ''}
          format="rectangle"
          className="flex justify-center py-2"
        />
      </main>

      {/* ── Footer — data sources (E-A-T 신호 + 권위 있는 outbound links) */}
      <footer className="border-t border-gray-800 px-6 py-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-gray-600 text-xs font-medium">Data sources:</span>
        {[
          { label: 'Federal Reserve',  href: 'https://www.federalreserve.gov' },
          { label: 'FRED (St. Louis Fed)', href: 'https://fred.stlouisfed.org' },
          { label: 'BLS',              href: 'https://www.bls.gov' },
          { label: 'BEA',              href: 'https://www.bea.gov' },
          { label: 'SEC EDGAR',        href: 'https://www.sec.gov/edgar' },
          { label: 'NASDAQ',           href: 'https://www.nasdaq.com' },
          { label: 'Finnhub',          href: 'https://finnhub.io' },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            {label}
          </a>
        ))}
        <span className="ml-auto text-gray-700 text-xs">
          © {new Date().getFullYear()} US Market Calendar
        </span>
      </footer>
    </div>
  );
}

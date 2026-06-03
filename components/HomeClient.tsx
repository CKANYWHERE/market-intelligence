'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarEvent } from '@/types/events';
import NextEventCountdown from '@/components/NextEventCountdown';
import MarketTickerBar from '@/components/MarketTickerBar';
import FedWatchBanner from '@/components/FedWatchBanner';
import WeeklyDigestSection from '@/components/weekly/WeeklyDigestSection';
import CalendarView from '@/components/calendar/CalendarView';
import EventDetailPanel from '@/components/detail/EventDetailPanel';
import AdBanner from '@/components/ads/AdBanner';
import KeyIndicatorsSection from '@/components/indicators/KeyIndicatorsSection';
import UpcomingCountdown from '@/components/calendar/UpcomingCountdown';
import BreakingSection from '@/components/breaking/BreakingSection';
import TodayEventsBar from '@/components/today/TodayEventsBar';

function MobileDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [visible, setVisible]       = useState(false);
  const [dragY, setDragY]           = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef                   = useRef(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function closeDrawer() {
    setVisible(false);
    setTimeout(onClose, 280);
  }

  function onHandleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
    setDragY(0);
  }
  function onHandleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta);
  }
  function onHandleTouchEnd() {
    setIsDragging(false);
    if (dragY > 80) { setDragY(0); closeDrawer(); }
    else setDragY(0);
  }

  return (
    <div className="md:hidden">
      {/* 백드롭 */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeDrawer}
      />
      {/* 드로어 */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[82vh] flex flex-col bg-gray-900 rounded-t-2xl border-t border-gray-700 overflow-hidden ${isDragging ? '' : 'transition-transform duration-300 ease-out'} ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
      >
        {/* 핸들 바 (스와이프 영역) */}
        <div
          className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0 touch-none"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className="w-8" />
          <div className="w-10 h-1 rounded-full bg-gray-600" />
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-full transition-colors text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HomeClient() {
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

  const hasPanel = selectedEvent !== null || (selectedDayEvents !== null && selectedDayEvents.length > 0);

  return (
    <div className="bg-gray-950 text-white flex flex-col min-h-screen">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <span className="text-xl" aria-hidden="true">📊</span>
          <div>
            <h1 className="text-sm md:text-lg font-bold text-white leading-tight">US Market Calendar</h1>
            <p className="text-gray-500 text-[10px] hidden sm:block">FOMC · CPI · Earnings · IPO · Breaking News</p>
          </div>
        </div>
        {/* 데스크탑: 카운트다운 오른쪽 정렬 */}
        <div className="hidden md:block flex-shrink-0">
          <NextEventCountdown />
        </div>
      </header>

      {/* ── 모바일 카운트다운 ─────────────────────────────────── */}
      <div className="md:hidden border-b border-gray-800 px-4 py-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <NextEventCountdown />
      </div>

      {/* ── 통합 마켓 티커 바 (데스크탑 + 모바일 공통) ─────────── */}
      <MarketTickerBar />

      {/* ── Fed Rate Cut Odds 배너 ─────────────────────────────── */}
      <FedWatchBanner />

      {/* ── Ad ─────────────────────────────────────────────────── */}
      <AdBanner
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP ?? ''}
        format="horizontal"
        className="bg-gray-900 border-b border-gray-800 px-6 py-2 flex justify-center"
      />

      {/* ══════════════════════════════════════════════════════════
          모바일 레이아웃: 자연스럽게 스크롤되는 단일 컬럼
          데스크탑 레이아웃: 뷰포트를 꽉 채우는 고정 레이아웃
         ══════════════════════════════════════════════════════════ */}

      {/* 모바일 (md 미만): 스크롤 가능한 단일 컬럼 */}
      <div className="md:hidden flex flex-col gap-3 p-3 pb-6">
        <UpcomingCountdown />
        <TodayEventsBar />
        <KeyIndicatorsSection />
        <WeeklyDigestSection />
        <CalendarView
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          onSelectDay={handleSelectDay}
        />
        <BreakingSection />
        <AdBanner
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? ''}
          format="rectangle"
          className="flex justify-center py-2"
        />
      </div>

      {/* 데스크탑 (md 이상): 뷰포트 고정 레이아웃 */}
      <main className="hidden md:flex flex-1 flex-col min-h-0 p-6 gap-4 overflow-hidden">
        <UpcomingCountdown />
        <TodayEventsBar />
        <KeyIndicatorsSection />
        <div className="flex-1 flex gap-4 min-h-0">
          <CalendarView
            selectedEvent={selectedEvent}
            onSelectEvent={handleSelectEvent}
            onSelectDay={handleSelectDay}
          />
          {/* 사이드바: 이벤트 선택 시 상세패널, 미선택 시 Weekly Digest */}
          <div className="w-[380px] flex-shrink-0 flex flex-col min-h-0">
            {hasPanel ? (
              <EventDetailPanel
                event={selectedEvent}
                dayEvents={selectedDayEvents}
                onSelectEvent={handleSelectEvent}
                onClose={handleClose}
              />
            ) : (
              <div className="flex-1 overflow-y-auto">
                <WeeklyDigestSection />
              </div>
            )}
          </div>
        </div>
        <BreakingSection />
        <AdBanner
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM ?? ''}
          format="rectangle"
          className="flex justify-center py-2"
        />
      </main>

      {/* ── 모바일 바텀 시트 ──────────────────────────────────── */}
      {hasPanel && (
        <MobileDrawer onClose={handleClose}>
          <EventDetailPanel
            event={selectedEvent}
            dayEvents={selectedDayEvents}
            onSelectEvent={handleSelectEvent}
            onClose={handleClose}
          />
        </MobileDrawer>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 px-4 md:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 flex-shrink-0">
        <span className="text-gray-600 text-xs font-medium">Sources:</span>
        {[
          { label: 'Federal Reserve', href: 'https://www.federalreserve.gov' },
          { label: 'FRED',            href: 'https://fred.stlouisfed.org' },
          { label: 'BLS',             href: 'https://www.bls.gov' },
          { label: 'BEA',             href: 'https://www.bea.gov' },
          { label: 'SEC EDGAR',       href: 'https://www.sec.gov/edgar' },
          { label: 'NASDAQ',          href: 'https://www.nasdaq.com' },
          { label: 'Finnhub',         href: 'https://finnhub.io' },
        ].map(({ label, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            {label}
          </a>
        ))}
        <span className="ml-auto text-gray-700 text-xs">© {new Date().getFullYear()} US Market Calendar</span>
      </footer>
    </div>
  );
}

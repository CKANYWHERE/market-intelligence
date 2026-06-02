'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { EventCategory } from '@/types/events';

interface NextEvent {
  id:       string;
  title:    string;
  date:     string;
  time?:    string;
  category: EventCategory;
}

// 카테고리별 색상 (헤더용 — 작은 배지 스타일)
const CHIP: Record<EventCategory, string> = {
  monetary_policy: 'bg-blue-500/20   text-blue-300   border-blue-500/40',
  inflation:       'bg-orange-500/20 text-orange-300 border-orange-500/40',
  employment:      'bg-green-500/20  text-green-300  border-green-500/40',
  growth:          'bg-purple-500/20 text-purple-300 border-purple-500/40',
  earnings:        'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  ipo:             'bg-pink-500/20   text-pink-300   border-pink-500/40',
  breaking:        'bg-red-500/20    text-red-300    border-red-500/40',
};

/** ET 기준 오늘 자정 (UTC Date 반환) */
function todayET(): Date {
  const now = new Date();
  const etStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // "YYYY-MM-DD"
  return new Date(`${etStr}T00:00:00-05:00`);
}

/** YYYY-MM-DD → Date (ET 자정) */
function parseET(dateStr: string, timeStr?: string): Date {
  if (timeStr) return new Date(`${dateStr}T${timeStr}:00-05:00`);
  return new Date(`${dateStr}T00:00:00-05:00`);
}

function calcCountdown(target: Date): { label: string; urgent: boolean } {
  const diffMs   = target.getTime() - Date.now();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMs < 0)            return { label: 'Today',    urgent: true };
  if (diffDays === 0)        return { label: 'Today',    urgent: true };
  if (diffDays === 1)        return { label: 'Tomorrow', urgent: true };
  return { label: `D-${diffDays}`, urgent: false };
}

export default function NextEventCountdown() {
  const { data } = useSWR<{ events: NextEvent[] }>('/api/next-event', fetcher, {
    refreshInterval:   1_800_000, // 30분
    revalidateOnFocus: false,
  });

  // 1초마다 카운트다운 재계산
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const events = data?.events ?? [];
  if (events.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {events.map((ev) => {
        const target              = parseET(ev.date, ev.time);
        const { label, urgent }   = calcCountdown(target);
        const chipClass           = CHIP[ev.category] ?? CHIP.growth;

        // 이벤트 제목 축약 (헤더 공간 절약)
        const shortTitle = ev.title
          .replace(' Decision', '')
          .replace(' Release', '')
          .replace(' Report', '')
          .replace(' Earnings', ' EPS');

        return (
          <div
            key={ev.id}
            className={`flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-xs font-medium ${chipClass}`}
            title={`${ev.title} — ${ev.date}${ev.time ? ' ' + ev.time + ' ET' : ''}`}
          >
            {urgent && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            <span className="hidden sm:inline opacity-70">{shortTitle}</span>
            <span className="sm:hidden opacity-70">{ev.category === 'monetary_policy' ? 'FOMC' : ev.category === 'ipo' ? 'IPO' : shortTitle.split(' ')[0]}</span>
            <span className="font-bold">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

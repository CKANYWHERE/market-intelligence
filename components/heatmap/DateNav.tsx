'use client';

import { useRouter } from 'next/navigation';

interface DateNavProps {
  date:     string;       // YYYY-MM-DD, 현재 보고 있는 날짜
  prevDate: string | null; // 거래일 기준 이전 날짜 (없으면 null)
  nextDate: string | null; // 거래일 기준 다음 날짜 (없으면 null = 오늘이 최신)
}

export default function DateNav({ date, prevDate, nextDate }: DateNavProps) {
  const router = useRouter();

  const go = (d: string) => router.push(`/heatmap?date=${d}`);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => prevDate && go(prevDate)}
        disabled={!prevDate}
        aria-label="Previous trading day"
        className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-900 transition-colors"
      >
        ← Prev
      </button>

      <label className="relative">
        <span className="sr-only">Select date</span>
        <input
          type="date"
          value={date}
          max={nextDate ? undefined : date}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white [color-scheme:dark] hover:bg-gray-800 transition-colors"
        />
      </label>

      <button
        type="button"
        onClick={() => nextDate && go(nextDate)}
        disabled={!nextDate}
        aria-label="Next trading day"
        className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:hover:bg-gray-900 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

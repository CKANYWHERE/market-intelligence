'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { CATEGORY_META } from '@/lib/utils/categorize';
import type { DigestItem } from '@/lib/batch/generate-weekly-digest';
import ScenarioBar from '@/components/weekly/ScenarioBar';

interface FedWatchResponse { cutProb: number | null; }

interface DigestResponse {
  weekStart: string;
  weekEnd:   string;
  items:     DigestItem[];
}

const RANK_COLORS = [
  'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  'text-gray-300  border-gray-600/40   bg-gray-700/20',
  'text-orange-400 border-orange-500/30 bg-orange-500/5',
  'text-gray-500  border-gray-700/40   bg-gray-800/30',
  'text-gray-500  border-gray-700/40   bg-gray-800/30',
];

function formatWeekRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end   + 'T00:00:00Z');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

function SkeletonCard() {
  return (
    <div className="p-4 space-y-2 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-800 rounded" />
        <div className="h-3 bg-gray-800 rounded w-1/3" />
        <div className="h-3 bg-gray-800 rounded w-16 ml-auto" />
      </div>
      <div className="h-4 bg-gray-800 rounded w-2/3" />
      <div className="h-3 bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-800 rounded w-3/4" />
    </div>
  );
}

export default function WeeklyDigestSection() {
  const { data, isLoading, error } = useSWR<DigestResponse>(
    '/api/weekly-digest',
    fetcher,
    {
      // 주 단위 데이터이므로 재검증 간격 길게
      refreshInterval:   60 * 60_000, // 1시간
      dedupingInterval:  30 * 60_000,
      revalidateOnFocus: false,
    },
  );

  const { data: fedData } = useSWR<FedWatchResponse>('/api/fed-watch', fetcher, {
    refreshInterval:   30 * 60_000,
    revalidateOnFocus: false,
  });
  const cutProb = fedData?.cutProb ?? null;

  const items = data?.items ?? [];

  return (
    <section
      aria-label="This Week's Market Focus"
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">This Week's Market Focus</span>
          {data && (
            <span className="text-gray-600 text-xs">
              {formatWeekRange(data.weekStart, data.weekEnd)}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">
          AI Curated
        </span>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-800/60">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">
            Failed to load digest.
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-gray-500 text-sm">
            No events scheduled this week.
          </p>
        ) : (
          items.map((item, idx) => {
            const rankStyle = RANK_COLORS[idx] ?? RANK_COLORS[4];
            const catMeta   =
              CATEGORY_META[item.category as keyof typeof CATEGORY_META] ??
              CATEGORY_META.growth;

            return (
              <div key={item.rank} className="px-4 py-3 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start gap-3">
                  {/* 순위 배지 */}
                  <span
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded border text-[11px] font-black ${rankStyle}`}
                  >
                    {item.rank}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* 타이틀 + 카테고리 + 날짜 */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-white text-sm font-semibold leading-snug">
                        {item.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-px rounded border font-medium ${catMeta.chipClass}`}>
                        {catMeta.label}
                      </span>
                    </div>

                    <p className="text-gray-500 text-xs mb-2">{formatDate(item.date)}</p>

                    {/* Why it matters */}
                    <p className="text-gray-300 text-xs leading-relaxed mb-1.5">
                      {item.why_it_matters}
                    </p>

                    {/* Watch for */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-yellow-500 text-[10px] font-bold flex-shrink-0 mt-px">
                        WATCH
                      </span>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {item.watch_for}
                      </p>
                    </div>

                    {/* Market Scenario */}
                    <ScenarioBar title={item.title} cutProb={cutProb} />
                  </div>

                  {/* 캘린더 링크 */}
                  {item.event_id && (
                    <Link
                      href={`#event-${item.event_id}`}
                      className="flex-shrink-0 text-gray-600 hover:text-blue-400 text-xs transition-colors mt-0.5"
                      title="View on calendar"
                    >
                      →
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

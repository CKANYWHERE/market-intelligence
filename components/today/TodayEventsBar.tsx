'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { CATEGORY_META } from '@/lib/utils/categorize';
import { toSlug } from '@/lib/utils/slug';

interface EcoItem {
  id: string; title: string; time: string | null;
  importance: string; category: string;
  actual: number | null; estimate: number | null;
}
interface EarnItem {
  id: string; symbol: string; company: string;
  hour: string | null; eps_estimate: number | null; eps_actual: number | null;
}
interface TodayData { date: string; eco: EcoItem[]; earnings: EarnItem[]; }

function ImportanceDot({ level }: { level: string }) {
  const color = level === 'high' ? 'bg-red-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-gray-600';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />;
}

export default function TodayEventsBar() {
  const { data, isLoading } = useSWR<TodayData>('/api/today-events', fetcher, {
    refreshInterval:   5 * 60_000,
    revalidateOnFocus: false,
  });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York',
  });

  const hasItems = (data?.eco.length ?? 0) + (data?.earnings.length ?? 0) > 0;

  return (
    <section
      aria-label="Today's Market Events"
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex-shrink-0"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span className="text-white font-bold text-sm">Today's Events</span>
        </div>
        <span className="text-gray-500 text-xs">{today} ET</span>
      </div>

      <div className="px-4 py-2.5">
        {isLoading ? (
          <div className="flex gap-3 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="h-6 bg-gray-800 rounded w-32" />)}
          </div>
        ) : !hasItems ? (
          <p className="text-gray-600 text-xs py-1">No scheduled events today.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data?.eco.map(item => {
              const catMeta = CATEGORY_META[item.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.growth;
              const slug = toSlug(item.title, data.date);
              const hasResult = item.actual !== null;
              return (
                <Link
                  key={item.id}
                  href={`/events/${slug}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors hover:bg-gray-800 ${catMeta.chipClass} ${hasResult ? 'opacity-60' : ''}`}
                >
                  <ImportanceDot level={item.importance} />
                  {item.time && <span className="text-gray-500">{item.time}</span>}
                  <span>{item.title}</span>
                  {hasResult && <span className="text-green-400">✓</span>}
                </Link>
              );
            })}
            {data?.earnings.map(item => {
              const hourLabel = item.hour === 'bmo' ? 'BMO' : item.hour === 'amc' ? 'AMC' : '';
              const hasResult = item.eps_actual !== null;
              return (
                <span
                  key={item.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium ${hasResult ? 'opacity-60' : ''}`}
                >
                  {hourLabel && <span className="text-gray-500">{hourLabel}</span>}
                  <span>{item.symbol}</span>
                  {hasResult && <span className="text-green-400">✓</span>}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

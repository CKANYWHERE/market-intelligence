import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/batch/db';
import { TRACKED_SYMBOLS } from '@/lib/batch/sync-stock-prices';
import { SYMBOL_NAMES } from '@/lib/utils/symbolNames';
import { dayPctToColor, textColorFor } from '@/lib/utils/heatmapColor';
import DateNav from '@/components/heatmap/DateNav';
import HeatmapGrid, { type HeatmapItem } from '@/components/heatmap/HeatmapGrid';

export const revalidate = 1800; // 30분 — 장중에도 너무 자주 재생성 안 되게

const ETFS = new Set(['QQQ', 'SPY']);
const STOCK_SYMBOLS = TRACKED_SYMBOLS.filter((s) => !ETFS.has(s));

export const metadata: Metadata = {
  title: 'QQQ (Nasdaq-100) Heatmap — Daily % Change Map',
  description: 'See every Nasdaq-100 stock\'s daily % change at a glance. Pick a date to view the market reaction on any past trading day.',
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function HeatmapPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: requestedDate } = await searchParams;

  let items: HeatmapItem[] = [];
  let targetDate: string | null = null;
  let prevDate: string | null = null;
  let nextDate: string | null = null;
  let summary = { gainers: 0, losers: 0, flat: 0 };

  try {
    // 최근 400일 중 실제로 데이터가 있는 거래일 목록 (QQQ 기준 — 전 종목 공통 거래일)
    const dateRows = await db.stockDailyPrice.findMany({
      where: { symbol: 'QQQ' },
      orderBy: { date: 'desc' },
      take: 400,
      select: { date: true },
    });
    const availableDates = dateRows.map((r) => toDateStr(r.date)); // desc

    if (availableDates.length > 0) {
      // 요청한 날짜 이하(가장 가까운 과거) 거래일을 선택 — 없으면 최신
      targetDate = requestedDate
        ? availableDates.find((d) => d <= requestedDate) ?? availableDates[availableDates.length - 1]
        : availableDates[0];

      const idx = availableDates.indexOf(targetDate);
      nextDate = idx > 0 ? availableDates[idx - 1] : null; // 더 최신
      prevDate = idx >= 0 && idx < availableDates.length - 1 ? availableDates[idx + 1] : null; // 더 과거

      const rows = await db.stockDailyPrice.findMany({
        where: { symbol: { in: STOCK_SYMBOLS }, date: new Date(`${targetDate}T00:00:00Z`) },
      });

      items = rows
        .map((r) => {
          const color = dayPctToColor(r.day_pct);
          return {
            symbol: r.symbol,
            name: SYMBOL_NAMES[r.symbol] ?? r.symbol,
            close: r.close,
            dayPct: r.day_pct,
            color,
            textColor: textColorFor(color),
          };
        })
        .sort((a, b) => a.symbol.localeCompare(b.symbol));

      for (const it of items) {
        if (it.dayPct === null || Math.abs(it.dayPct) < 0.05) summary.flat++;
        else if (it.dayPct > 0) summary.gainers++;
        else summary.losers++;
      }
    }
  } catch {
    // graceful degradation — 빈 화면 대신 아래 "데이터 로드 실패" 메시지
  } finally {
    db.$disconnect().catch(() => {});
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-white transition-colors">US Market Calendar</Link>
          <span>/</span>
          <span className="text-gray-300">QQQ Heatmap</span>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">QQQ (Nasdaq-100) Heatmap</h1>
            <p className="mt-1 text-sm text-gray-400">
              Daily % change vs. previous close, by stock. Pick a date to view any past trading day.
            </p>
          </div>
          {targetDate && <DateNav date={targetDate} prevDate={prevDate} nextDate={nextDate} />}
        </div>

        {!targetDate ? (
          <p className="text-gray-500">Failed to load data — please try again shortly.</p>
        ) : (
          <>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>
                {new Date(`${targetDate}T12:00:00Z`).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
              <span className="text-blue-400">Gainers {summary.gainers}</span>
              <span className="text-red-400">Losers {summary.losers}</span>
              <span className="text-gray-500">Flat {summary.flat}</span>
            </div>

            <HeatmapGrid items={items} />

            <p className="text-xs text-gray-600">
              Blue = gained, red = lost (color intensity scales to ±3% — beyond that, only the
              number distinguishes magnitude). Blue/red is used instead of green/red for
              color-blind accessibility.
            </p>
          </>
        )}
      </main>
    </div>
  );
}

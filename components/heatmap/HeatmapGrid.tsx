'use client';

export interface HeatmapItem {
  symbol:    string;
  name:      string;
  close:     number;
  dayPct:    number | null;
  color:     string; // bg hex, precomputed server-side
  textColor: string; // '#000' | '#fff', precomputed server-side
}

function formatPct(pct: number | null): string {
  if (pct === null) return '—';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

export default function HeatmapGrid({ items }: { items: HeatmapItem[] }) {
  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))' }}
    >
      {items.map((item) => (
        <div key={item.symbol} className="group relative">
          <div
            className="flex aspect-square flex-col items-center justify-center rounded-md px-1 text-center transition-transform duration-100 ease-out group-hover:z-10 group-hover:scale-110 group-hover:shadow-lg group-focus-within:z-10 group-focus-within:scale-110 cursor-default"
            style={{ backgroundColor: item.color, color: item.textColor }}
            tabIndex={0}
          >
            <span className="text-[11px] font-semibold leading-tight sm:text-xs">{item.symbol}</span>
            <span className="text-[10px] leading-tight opacity-90 sm:text-[11px]">{formatPct(item.dayPct)}</span>
          </div>

          {/* 호버/포커스 툴팁 — 값은 이미 셀에 보이므로 여긴 회사명 + 종가 보강 정보만 */}
          <div
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-[180px] -translate-x-1/2 rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-xs text-gray-200 opacity-0 shadow-xl transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <div className="font-medium text-white">{item.name}</div>
            <div className="text-gray-400">
              ${item.close.toFixed(2)} · {formatPct(item.dayPct)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

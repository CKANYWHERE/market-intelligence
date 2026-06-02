'use client';

import type { MarketDataPoint } from '@/lib/utils/marketReaction';

interface Props {
  data: MarketDataPoint[];
}

export default function MarketReactionChart({ data }: Props) {
  if (data.length < 3) return null;

  const W   = 600;
  const H   = 180;
  const PAD = { top: 20, right: 24, bottom: 36, left: 52 };
  const iW  = W - PAD.left - PAD.right;
  const iH  = H - PAD.top - PAD.bottom;

  const n = data.length;

  // Collect all non-null % values
  const allPcts = data.flatMap((d) =>
    [d.changePctQQQ, d.changePctSPY].filter((v): v is number => v != null),
  );
  if (allPcts.length === 0) return null;

  const rawMin = Math.min(...allPcts);
  const rawMax = Math.max(...allPcts);
  // Pad so zero line is visible
  const pad  = Math.max(Math.abs(rawMax), Math.abs(rawMin)) * 0.2 + 0.1;
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;
  const yRange = yMax - yMin || 1;

  const xScale = (i: number) => (i / (n - 1)) * iW;
  const yScale = (v: number) => iH - ((v - yMin) / yRange) * iH;
  const zeroY  = yScale(0);

  // Find event day index (dayOffset === 0)
  const eventIdx = data.findIndex((d) => d.dayOffset === 0);
  const eventX   = eventIdx >= 0 ? xScale(eventIdx) : null;

  function buildPath(key: 'changePctQQQ' | 'changePctSPY') {
    const pts = data
      .map((d, i) => (d[key] != null ? `${xScale(i)},${yScale(d[key]!)}` : null))
      .filter(Boolean);
    return pts.length >= 2 ? `M ${pts.join(' L ')}` : '';
  }

  const qqqPath = buildPath('changePctQQQ');
  const spyPath = buildPath('changePctSPY');

  // Y ticks
  const yTicks = [yMin, 0, yMax].map((v) => parseFloat(v.toFixed(2)));

  // X labels: show day offset
  const xLabels = data.map((d, i) => ({ i, label: d.dayOffset === 0 ? 'D-day' : `D${d.dayOffset > 0 ? '+' : ''}${d.dayOffset}` }));
  const shownLabels = xLabels.filter((_, i) => i === 0 || i === n - 1 || data[i].dayOffset === 0);

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-emerald-400" />
          QQQ
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-0.5 bg-blue-400" />
          SPY
        </span>
        <span className="text-gray-600">% change vs event day close</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-label="Market reaction chart">
        <defs>
          <linearGradient id="qqqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Zero line */}
          <line
            x1={0} y1={zeroY} x2={iW} y2={zeroY}
            stroke="#4b5563" strokeWidth={1}
          />

          {/* Y-axis grid + labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              {tick !== 0 && (
                <line
                  x1={0} y1={yScale(tick)} x2={iW} y2={yScale(tick)}
                  stroke="#374151" strokeDasharray="3,3" strokeWidth={0.5}
                />
              )}
              <text
                x={-6} y={yScale(tick) + 4}
                textAnchor="end" fill="#6b7280" fontSize={10}
              >
                {tick >= 0 ? '+' : ''}{tick.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Event day vertical line */}
          {eventX != null && (
            <line
              x1={eventX} y1={0} x2={eventX} y2={iH}
              stroke="#f59e0b" strokeDasharray="4,3" strokeWidth={1.5} opacity={0.7}
            />
          )}

          {/* SPY line */}
          {spyPath && (
            <path d={spyPath} fill="none" stroke="#60a5fa" strokeWidth={2} strokeLinejoin="round" />
          )}

          {/* QQQ line */}
          {qqqPath && (
            <path d={qqqPath} fill="none" stroke="#34d399" strokeWidth={2} strokeLinejoin="round" />
          )}

          {/* Event day dot (QQQ) */}
          {eventIdx >= 0 && data[eventIdx].changePctQQQ != null && (
            <circle
              cx={xScale(eventIdx)} cy={yScale(data[eventIdx].changePctQQQ!)}
              r={4} fill="#34d399"
            />
          )}

          {/* X-axis labels */}
          {shownLabels.map(({ i, label }) => (
            <text
              key={i}
              x={xScale(i)} y={iH + 20}
              textAnchor="middle" fill={label === 'D-day' ? '#f59e0b' : '#6b7280'} fontSize={10}
            >
              {label}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

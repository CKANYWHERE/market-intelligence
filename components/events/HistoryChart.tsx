'use client';

interface DataPoint {
  date:  string; // YYYY-MM-DD
  value: number;
}

interface HistoryChartProps {
  data:   DataPoint[];
  unit?:  string;
  title?: string;
}

export default function HistoryChart({ data, unit = '', title }: HistoryChartProps) {
  if (data.length < 2) return null;

  const W = 600;
  const H = 160;
  const PAD = { top: 16, right: 16, bottom: 32, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = data.map((d) => d.value);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const range  = max - min || 1;

  const xScale = (i: number) => (i / (data.length - 1)) * innerW;
  const yScale = (v: number) => innerH - ((v - min) / range) * innerH;

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' ');
  const area   = `${xScale(0)},${innerH} ${points} ${xScale(data.length - 1)},${innerH}`;

  // Y-axis ticks (3개)
  const yTicks = [min, min + range / 2, max];
  // X-axis: 첫/중간/마지막 레이블
  const xLabels = [
    { i: 0,               label: data[0].date.slice(0, 7) },
    { i: Math.floor((data.length - 1) / 2), label: data[Math.floor((data.length - 1) / 2)].date.slice(0, 7) },
    { i: data.length - 1, label: data[data.length - 1].date.slice(0, 7) },
  ];

  const latest = data[data.length - 1];

  return (
    <div className="w-full">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">{title}</span>
          <span className="text-white font-mono font-semibold">
            {latest.value.toFixed(1)}{unit} <span className="text-gray-500 text-xs font-normal">({latest.date.slice(0, 7)})</span>
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        aria-label={`${title ?? 'History'} chart`}
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={0} y1={yScale(tick)}
                x2={innerW} y2={yScale(tick)}
                stroke="#374151" strokeDasharray="4,4" strokeWidth={0.5}
              />
              <text
                x={-6} y={yScale(tick) + 4}
                textAnchor="end"
                fill="#6b7280"
                fontSize={10}
              >
                {tick.toFixed(1)}{unit}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <polygon
            points={area}
            fill="url(#areaGrad)"
            opacity={0.4}
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinejoin="round"
          />

          {/* Latest point dot */}
          <circle
            cx={xScale(data.length - 1)}
            cy={yScale(latest.value)}
            r={4}
            fill="#3b82f6"
          />

          {/* X-axis labels */}
          {xLabels.map(({ i, label }) => (
            <text
              key={i}
              x={xScale(i)}
              y={innerH + 20}
              textAnchor="middle"
              fill="#6b7280"
              fontSize={10}
            >
              {label}
            </text>
          ))}

          {/* Gradient def */}
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
        </g>
      </svg>
    </div>
  );
}

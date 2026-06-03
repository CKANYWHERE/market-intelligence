import { getMarketScenario, ScenarioSide } from '@/lib/utils/marketScenario';

interface Props {
  title:    string;
  cutProb?: number | null;
  compact?: boolean;
}

function isPositive(move: string) {
  return move.trim().startsWith('+');
}
function isNegative(move: string) {
  return move.trim().startsWith('-');
}

function ScenarioHalf({
  side,
  label,
  hot,
}: {
  side:  ScenarioSide;
  label: string;
  hot:   boolean;
}) {
  const accent      = hot ? 'red' : 'blue';
  const bg          = hot ? 'bg-red-500/8'    : 'bg-blue-500/8';
  const border      = hot ? 'border-red-500/20' : 'border-blue-500/20';
  const labelColor  = hot ? 'text-red-400'    : 'text-blue-400';
  const actionBg    = hot ? 'bg-red-500/15 border-red-500/25' : 'bg-blue-500/15 border-blue-500/25';
  const actionText  = hot ? 'text-red-200'    : 'text-blue-200';
  const moveColor   = (move: string) => {
    if (isPositive(move)) return 'text-emerald-400';
    if (isNegative(move)) return 'text-red-400';
    return 'text-gray-400';
  };

  void accent; // silence unused var

  return (
    <div className={`${bg} border-b last:border-b-0 ${border}`}>
      {/* Label */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
        <span className={`text-[11px] font-bold uppercase tracking-wide ${labelColor}`}>
          {hot ? '↑' : '↓'} {label}
        </span>
      </div>

      {/* ACTION — most prominent */}
      <div className={`mx-3 mb-2.5 px-2.5 py-2 rounded-lg border ${actionBg}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Action</p>
        <p className={`text-xs font-semibold leading-snug ${actionText}`}>{side.action}</p>
      </div>

      {/* Index + Bond row */}
      <div className="px-3 pb-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
        <span className="text-gray-500">
          {side.qqqLabel ?? 'QQQ'} <strong className={moveColor(side.qqq)}>{side.qqq}</strong>
        </span>
        <span className="text-gray-500">
          {side.spyLabel ?? 'SPY'} <strong className={moveColor(side.spy)}>{side.spy}</strong>
        </span>
        <span className="text-gray-600 text-[11px]">{side.bonds}</span>
      </div>

      {/* Individual stock grid */}
      {side.stocks.length > 0 && (
        <div className="px-3 pb-2.5 grid grid-cols-3 gap-x-2 gap-y-1">
          {side.stocks.map((s) => (
            <div key={s.symbol} className="flex items-center justify-between">
              <span className="text-gray-600 text-[11px] font-medium">{s.symbol}</span>
              <span className={`text-[11px] font-bold font-mono ${moveColor(s.move)}`}>{s.move}</span>
            </div>
          ))}
        </div>
      )}

      {/* Note */}
      <p className="px-3 pb-2.5 text-gray-600 text-[11px] leading-relaxed">{side.note}</p>
    </div>
  );
}

export default function ScenarioBar({ title, cutProb, compact }: Props) {
  const scenario = getMarketScenario(title);
  if (!scenario) return null;

  const fedContext =
    cutProb != null
      ? cutProb >= 65
        ? 'Market pricing in cuts — hot print hits harder than usual.'
        : cutProb <= 30
          ? 'Hawkish already priced in — cool print triggers bigger rally.'
          : null
      : null;

  // ── Compact mode: one-line for WeeklyDigest ──────────────────
  if (compact) {
    const hotLabel  = scenario.hot.qqqLabel  ?? 'QQQ';
    const coolLabel = scenario.cool.qqqLabel ?? 'QQQ';
    return (
      <div className="flex items-center gap-3 text-[11px] mt-1.5 flex-wrap">
        <span className="text-gray-600 font-medium uppercase tracking-wide text-[10px]">Impact</span>
        <span className="text-red-400">
          ↑ Hot: {hotLabel} <strong>{scenario.hot.qqq}</strong>
        </span>
        <span className="text-gray-700">·</span>
        <span className="text-blue-400">
          ↓ Cool: {coolLabel} <strong>{scenario.cool.qqq}</strong>
        </span>
      </div>
    );
  }

  // ── Full mode: EventDetailPanel ──────────────────────────────
  return (
    <div className="rounded-xl border border-gray-700/60 overflow-hidden text-xs">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-800/80 border-b border-gray-700/60 flex items-center justify-between">
        <span className="text-gray-200 font-bold text-[11px] uppercase tracking-wide">
          If This Happens — What To Do
        </span>
        <span className="text-gray-600 text-[10px]">based on historical avg</span>
      </div>

      {/* Hot scenario */}
      <ScenarioHalf side={scenario.hot} label={scenario.hotLabel} hot={true} />

      {/* Cool scenario */}
      <ScenarioHalf side={scenario.cool} label={scenario.coolLabel} hot={false} />

      {/* FedWatch / neutral context */}
      {(fedContext ?? scenario.neutral) && (
        <div className="px-3 py-2 bg-gray-800/40 border-t border-gray-700/40 flex items-start gap-1.5">
          <span className="text-yellow-500 text-[10px] flex-shrink-0 mt-px">⚡</span>
          <p className="text-yellow-600 text-[11px] leading-relaxed">{fedContext ?? scenario.neutral}</p>
        </div>
      )}
    </div>
  );
}

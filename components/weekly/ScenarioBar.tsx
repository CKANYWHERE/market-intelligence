import { getMarketScenario } from '@/lib/utils/marketScenario';

interface Props {
  title:    string;
  cutProb?: number | null;
  compact?: boolean;  // WeeklyDigest용 한 줄 요약
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

  // ── 컴팩트 모드: 한 줄 요약 ─────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-[11px] mt-1.5 flex-wrap">
        <span className="text-gray-600 font-medium uppercase tracking-wide text-[10px]">Impact</span>
        <span className="text-red-400">
          ↑ Hot: QQQ <strong>{scenario.hot.qqq}</strong>
        </span>
        <span className="text-gray-700">·</span>
        <span className="text-blue-400">
          ↓ Cool: QQQ <strong>{scenario.cool.qqq}</strong>
        </span>
      </div>
    );
  }

  // ── 풀 모드: 디테일 패널용 ──────────────────────────────────
  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden text-xs">
      <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
        <span className="text-gray-300 font-bold text-[11px] uppercase tracking-wide">Market Reaction Scenarios</span>
        <span className="text-gray-600 text-[10px]">based on historical avg</span>
      </div>

      <div className="px-3 py-2.5 bg-red-500/10 border-b border-gray-700/60">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-red-400 font-bold text-[11px]">↑ {scenario.hotLabel}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-gray-400">QQQ <strong className="text-red-300">{scenario.hot.qqq}</strong></span>
          <span className="text-gray-400">SPY <strong className="text-red-300">{scenario.hot.spy}</strong></span>
          <span className="text-gray-500">{scenario.hot.bonds}</span>
        </div>
        <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">{scenario.hot.note}</p>
      </div>

      <div className="px-3 py-2.5 bg-blue-500/10">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-blue-400 font-bold text-[11px]">↓ {scenario.coolLabel}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-gray-400">QQQ <strong className="text-blue-300">{scenario.cool.qqq}</strong></span>
          <span className="text-gray-400">SPY <strong className="text-blue-300">{scenario.cool.spy}</strong></span>
          <span className="text-gray-500">{scenario.cool.bonds}</span>
        </div>
        <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">{scenario.cool.note}</p>
      </div>

      {(fedContext || scenario.neutral) && (
        <div className="px-3 py-2 border-t border-gray-700/60 flex items-start gap-1.5">
          <span className="text-yellow-500 text-[10px] flex-shrink-0 mt-px">⚡</span>
          <p className="text-yellow-600 text-[11px] leading-relaxed">{fedContext ?? scenario.neutral}</p>
        </div>
      )}
    </div>
  );
}

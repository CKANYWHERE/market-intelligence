import { getMarketScenario } from '@/lib/utils/marketScenario';

interface Props {
  title:    string;
  cutProb?: number | null;  // FedWatch cut probability (0-100)
}

export default function ScenarioBar({ title, cutProb }: Props) {
  const scenario = getMarketScenario(title);
  if (!scenario) return null;

  // FedWatch 컨텍스트 — 현재 시장 포지셔닝에 따라 경고 추가
  const fedContext =
    cutProb != null
      ? cutProb >= 65
        ? '↓ Market pricing in cuts — hot print hits harder.'
        : cutProb <= 30
        ? '↑ Hawkish already priced — cool print = bigger rally.'
        : null
      : null;

  return (
    <div className="mt-2 rounded-lg border border-gray-700/50 overflow-hidden text-xs">
      {/* Hot scenario */}
      <div className="flex items-start gap-2 px-3 py-2 bg-red-500/5 border-b border-gray-700/40">
        <span className="flex-shrink-0 font-bold text-red-400 mt-px">↑ {scenario.hotLabel}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-400 min-w-0">
          <span>QQQ <strong className="text-gray-200">{scenario.hot.qqq}</strong></span>
          <span>SPY <strong className="text-gray-200">{scenario.hot.spy}</strong></span>
          <span className="text-gray-500">{scenario.hot.bonds}</span>
          <span className="w-full text-gray-500 text-[10px]">{scenario.hot.note}</span>
        </div>
      </div>

      {/* Cool scenario */}
      <div className="flex items-start gap-2 px-3 py-2 bg-blue-500/5">
        <span className="flex-shrink-0 font-bold text-blue-400 mt-px">↓ {scenario.coolLabel}</span>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-400 min-w-0">
          <span>QQQ <strong className="text-gray-200">{scenario.cool.qqq}</strong></span>
          <span>SPY <strong className="text-gray-200">{scenario.cool.spy}</strong></span>
          <span className="text-gray-500">{scenario.cool.bonds}</span>
          <span className="w-full text-gray-500 text-[10px]">{scenario.cool.note}</span>
        </div>
      </div>

      {/* FedWatch context or neutral note */}
      {(fedContext || scenario.neutral) && (
        <div className="px-3 py-1.5 bg-yellow-500/5 border-t border-gray-700/40 text-yellow-600 text-[10px]">
          ⚡ {fedContext ?? scenario.neutral}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getMarketScenario, ScenarioSide } from '@/lib/utils/marketScenario';

interface Props {
  title:    string;
  cutProb?: number | null;
  compact?: boolean;
}

// ── Real-data types ───────────────────────────────────────────────────────────

interface StatRow { avg: number; p25: number; p75: number; n: number }
interface ScenarioApiData {
  hot:  Record<string, StatRow>;
  cool: Record<string, StatRow>;
}

// Map event title → indicator key (mirrors server-side classifyIndicator)
function titleToIndicator(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes('fomc') || (t.includes('fed') && t.includes('rate')) || t.includes('interest rate decision')) return 'FOMC';
  if (t.includes('core cpi') || t.includes('core consumer price')) return 'CORE_CPI';
  if (t.includes('cpi') || t.includes('consumer price index')) return 'CPI';
  if (t.includes('core pce') || (t.includes('core') && t.includes('pce'))) return 'CORE_PCE';
  if (t.includes('pce') || (t.includes('personal consumption') && t.includes('price'))) return 'PCE';
  if (t.includes('nonfarm') || t.includes('non-farm') || t.includes('nfp') || t.includes('payroll')) return 'NFP';
  if (t.includes('core ppi') || (t.includes('core') && t.includes('producer price'))) return 'CORE_PPI';
  if (t.includes('ppi') || t.includes('producer price')) return 'PPI';
  if (t.includes('gdp') || t.includes('gross domestic')) return 'GDP';
  return null;
}

// Symbols to always fetch for macro events
const MACRO_SYMBOLS = ['QQQ', 'SPY', 'NVDA', 'AAPL', 'MSFT', 'META', 'TSLA', 'AMZN'];

function formatPct(v: number): string {
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function isPositive(move: string) { return move.trim().startsWith('+'); }
function isNegative(move: string) { return move.trim().startsWith('-'); }

function moveColor(move: string) {
  if (isPositive(move)) return 'text-emerald-400';
  if (isNegative(move)) return 'text-red-400';
  return 'text-gray-400';
}

// ── ScenarioHalf ─────────────────────────────────────────────────────────────

function ScenarioHalf({
  side, label, hot, realData,
}: {
  side:     ScenarioSide;
  label:    string;
  hot:      boolean;
  realData: Record<string, StatRow> | null;
}) {
  const bg         = hot ? 'bg-red-500/8'        : 'bg-blue-500/8';
  const border     = hot ? 'border-red-500/20'   : 'border-blue-500/20';
  const labelColor = hot ? 'text-red-400'        : 'text-blue-400';
  const actionBg   = hot
    ? 'bg-red-500/15 border-red-500/25'
    : 'bg-blue-500/15 border-blue-500/25';
  const actionText = hot ? 'text-red-200' : 'text-blue-200';

  // Resolve real vs static move for a symbol
  function resolvedMove(symbol: string, staticMove: string): { value: string; isReal: boolean; n?: number } {
    const stat = realData?.[symbol];
    if (stat && stat.n >= 3) {
      return { value: formatPct(stat.avg), isReal: true, n: stat.n };
    }
    return { value: staticMove, isReal: false };
  }

  // QQQ / SPY labels
  const qqqSymbol = side.qqqLabel ?? 'QQQ';
  const spySymbol = side.spyLabel ?? 'SPY';
  const qqqResolved = resolvedMove(qqqSymbol, side.qqq);
  const spyResolved = resolvedMove(spySymbol, side.spy);

  const hasAnyReal = realData && Object.keys(realData).length > 0;

  return (
    <div className={`${bg} border-b last:border-b-0 ${border}`}>
      {/* Label */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
        <span className={`text-[11px] font-bold uppercase tracking-wide ${labelColor}`}>
          {hot ? '↑' : '↓'} {label}
        </span>
        {hasAnyReal && (
          <span className="text-[9px] text-gray-600 ml-auto">based on historical data</span>
        )}
      </div>

      {/* ACTION */}
      <div className={`mx-3 mb-2.5 px-2.5 py-2 rounded-lg border ${actionBg}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Historical Pattern</p>
        <p className={`text-xs font-semibold leading-snug ${actionText}`}>{side.action}</p>
      </div>

      {/* Index + Bond row */}
      <div className="px-3 pb-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
        <span className="text-gray-500">
          {qqqSymbol}{' '}
          <strong className={moveColor(qqqResolved.value)}>{qqqResolved.value}</strong>
          {qqqResolved.isReal && (
            <span className="text-gray-700 text-[9px] ml-0.5">({qqqResolved.n}x avg)</span>
          )}
        </span>
        <span className="text-gray-500">
          {spySymbol}{' '}
          <strong className={moveColor(spyResolved.value)}>{spyResolved.value}</strong>
          {spyResolved.isReal && (
            <span className="text-gray-700 text-[9px] ml-0.5">({spyResolved.n}x avg)</span>
          )}
        </span>
        <span className="text-gray-600 text-[11px]">{side.bonds}</span>
      </div>

      {/* Individual stock grid */}
      {side.stocks.length > 0 && (
        <div className="px-3 pb-2.5 grid grid-cols-3 gap-x-2 gap-y-1">
          {side.stocks.map((s) => {
            const resolved = resolvedMove(s.symbol, s.move);
            return (
              <div key={s.symbol} className="flex items-center justify-between">
                <span className="text-gray-600 text-[11px] font-medium">{s.symbol}</span>
                <span className={`text-[11px] font-bold font-mono ${moveColor(resolved.value)}`}>
                  {resolved.value}
                  {resolved.isReal && (
                    <span className="text-gray-700 font-normal text-[9px] ml-0.5">{resolved.n}x</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <p className="px-3 pb-2.5 text-gray-600 text-[11px] leading-relaxed">{side.note}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ScenarioBar({ title, cutProb, compact }: Props) {
  const scenario  = getMarketScenario(title);
  const indicator = titleToIndicator(title);

  const [apiData, setApiData] = useState<ScenarioApiData | null>(null);

  useEffect(() => {
    if (!indicator) return;
    const symbols = MACRO_SYMBOLS.join(',');
    fetch(`/api/scenario-data?indicator=${encodeURIComponent(indicator)}&symbols=${symbols}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.ok && json.data) setApiData(json.data);
      })
      .catch(() => null);
  }, [indicator]);

  if (!scenario) return null;

  const fedContext =
    cutProb != null
      ? cutProb >= 65
        ? 'Market pricing in cuts — hot print hits harder than usual.'
        : cutProb <= 30
          ? 'Hawkish already priced in — cool print triggers bigger rally.'
          : null
      : null;

  // ── Compact mode ──────────────────────────────────────────────────────────
  if (compact) {
    const hotSymbol  = scenario.hot.qqqLabel  ?? 'QQQ';
    const coolSymbol = scenario.cool.qqqLabel ?? 'QQQ';

    // Use real data if available
    const hotStat  = apiData?.hot[hotSymbol];
    const coolStat = apiData?.cool[coolSymbol];
    const hotMove  = hotStat  && hotStat.n  >= 3 ? formatPct(hotStat.avg)  : scenario.hot.qqq;
    const coolMove = coolStat && coolStat.n >= 3 ? formatPct(coolStat.avg) : scenario.cool.qqq;

    return (
      <div className="flex items-center gap-3 text-[11px] mt-1.5 flex-wrap">
        <span className="text-gray-600 font-medium uppercase tracking-wide text-[10px]">Impact</span>
        <span className="text-red-400">
          ↑ Hot: {hotSymbol} <strong>{hotMove}</strong>
        </span>
        <span className="text-gray-700">·</span>
        <span className="text-blue-400">
          ↓ Cool: {coolSymbol} <strong>{coolMove}</strong>
        </span>
      </div>
    );
  }

  // ── Full mode ─────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-gray-700/60 overflow-hidden text-xs">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-800/80 border-b border-gray-700/60 flex items-center justify-between">
        <span className="text-gray-200 font-bold text-[11px] uppercase tracking-wide">
          Historical Market Reactions
        </span>
        <span className="text-gray-600 text-[10px]">
          {apiData ? 'real historical avg' : 'based on historical avg'}
        </span>
      </div>

      <ScenarioHalf
        side={scenario.hot}
        label={scenario.hotLabel}
        hot={true}
        realData={apiData?.hot ?? null}
      />
      <ScenarioHalf
        side={scenario.cool}
        label={scenario.coolLabel}
        hot={false}
        realData={apiData?.cool ?? null}
      />

      {(fedContext ?? scenario.neutral) && (
        <div className="px-3 py-2 bg-gray-800/40 border-t border-gray-700/40 flex items-start gap-1.5">
          <span className="text-yellow-500 text-[10px] flex-shrink-0 mt-px">⚡</span>
          <p className="text-yellow-600 text-[11px] leading-relaxed">{fedContext ?? scenario.neutral}</p>
        </div>
      )}
    </div>
  );
}

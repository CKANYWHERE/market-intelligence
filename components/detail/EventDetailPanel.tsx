'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarEvent } from '@/types/events';
import { CATEGORY_META, IMPORTANCE_STARS } from '@/lib/utils/categorize';
import { toSlug } from '@/lib/utils/slug';
import { CATEGORY_CONTEXT, INDICATOR_CONTEXT, getSeriesIdFromTitle } from '@/lib/utils/marketContext';

interface Props {
  event:           CalendarEvent | null;
  dayEvents?:      CalendarEvent[] | null;
  onSelectEvent?:  (event: CalendarEvent) => void;
  onClose:         () => void;
}

function numOrDash(v: number | null | undefined, decimals = 2): string {
  return v != null ? v.toFixed(decimals) : '-';
}

function formatRevenue(v: number | null | undefined): string {
  if (v == null) return '-';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
}

export default function EventDetailPanel({ event, dayEvents, onSelectEvent, onClose }: Props) {
  // 날짜 리스트 모드 — 하루에 이벤트가 여러 개일 때 목록 표시
  if (!event && dayEvents && dayEvents.length > 0) {
    const dateLabel = (() => {
      const [y, m, d] = dayEvents[0].date.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'short', month: 'long', day: 'numeric',
      });
    })();

    return (
      <aside
        aria-label={`Events on ${dateLabel}`}
        className="w-full bg-gray-900 border-0 md:border md:border-gray-800 md:rounded-xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">All events</p>
            <h3 className="text-white font-bold text-base">{dateLabel}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close detail panel"
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-base flex-shrink-0"
          >
            ✕
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-800">
          {dayEvents.map((ev) => {
            const meta = CATEGORY_META[ev.category];
            const stars = IMPORTANCE_STARS[ev.importance ?? 'low'];
            return (
              <li key={ev.id}>
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-800/60 transition-colors flex items-start gap-3"
                  onClick={() => onSelectEvent?.(ev)}
                >
                  <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-semibold border flex-shrink-0 ${meta.chipClass}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium leading-snug truncate">{ev.title}</p>
                    {ev.time && <p className="text-gray-500 text-xs mt-0.5">{ev.time} ET</p>}
                  </div>
                  <span className="text-yellow-500 text-xs flex-shrink-0 self-center">{stars}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    );
  }

  if (!event) return null;

  const meta = CATEGORY_META[event.category];

  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  }

  function DeltaBadge({
    actual,
    estimate,
    unit = '',
  }: {
    actual: number | null | undefined;
    estimate: number | null | undefined;
    unit?: string;
  }) {
    if (actual == null || estimate == null) return null;
    const diff = actual - estimate;
    const sign = diff > 0 ? '+' : '';
    const label = diff > 0 ? 'beats' : diff < 0 ? 'misses' : 'meets';
    const cls =
      diff > 0
        ? 'bg-green-500/10 text-green-300 border-green-500/20'
        : diff < 0
          ? 'bg-red-500/10 text-red-300 border-red-500/20'
          : 'bg-gray-800 text-gray-400 border-gray-700';
    return (
      <div className={`border rounded-lg px-3 py-2 text-sm ${cls}`}>
        vs estimate{' '}
        <strong>
          {sign}
          {Math.abs(diff).toFixed(2)}
          {unit}
        </strong>{' '}
        — {label}
      </div>
    );
  }

  // 시장 맥락 박스
  function MarketContextBox({ title, category }: { title: string; category: string }) {
    const [open, setOpen] = useState(true);

    // 지표별 컨텍스트 우선 (더 구체적), 없으면 카테고리
    const seriesId = getSeriesIdFromTitle(title);
    const indCtx   = seriesId ? INDICATOR_CONTEXT[seriesId] : null;
    const catCtx   = CATEGORY_CONTEXT[category];
    if (!indCtx && !catCtx) return null;

    return (
      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-700/30 transition-colors"
        >
          <span className="text-gray-300 text-xs font-medium">What does this mean for markets?</span>
          <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
        </button>

        {open && (
          <div className="px-3 pb-3 space-y-2.5 border-t border-gray-700/50 pt-2.5">
            {indCtx ? (
              <>
                <p className="text-gray-200 text-xs font-semibold">{indCtx.what}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{indCtx.why}</p>
                <p className="text-gray-500 text-xs leading-relaxed border-t border-gray-700 pt-2">{indCtx.signal}</p>
              </>
            ) : catCtx ? (
              <>
                <p className="text-gray-200 text-xs font-semibold">{catCtx.headline}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{catCtx.body}</p>
                <div className="grid grid-cols-1 gap-1.5 border-t border-gray-700 pt-2">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-400 text-xs mt-0.5">▲</span>
                    <p className="text-gray-400 text-xs leading-relaxed">{catCtx.bullish}</p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-red-400 text-xs mt-0.5">▼</span>
                    <p className="text-gray-400 text-xs leading-relaxed">{catCtx.bearish}</p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  const importanceStars = IMPORTANCE_STARS[event.importance ?? 'low'];

  return (
    <aside
      aria-label={`Event details: ${event.title}`}
      className="w-full bg-gray-900 border-0 md:border md:border-gray-800 md:rounded-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-800">
        <div className="flex-1 pr-2 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${meta.chipClass}`}>
              {meta.label}
            </span>
            <span className="text-yellow-500 text-xs tracking-widest" aria-label={`Importance: ${event.importance}`}>
              {importanceStars}
            </span>
          </div>
          <h3 className="text-white font-bold text-base leading-snug">{event.title}</h3>
          <p className="text-gray-400 text-sm mt-1">{formatDate(event.date)}</p>
          {event.time && (
            <p className="text-gray-600 text-xs mt-0.5">
              {event.time} ET
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-base flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Economic / macro ── */}
        {['monetary_policy', 'inflation', 'employment', 'growth'].includes(event.category) && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Actual', value: event.actual, highlight: true },
                { label: 'Estimate', value: event.estimate, highlight: false },
                { label: 'Previous', value: event.prev, highlight: false },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className={`rounded-lg p-3 text-center ${highlight ? 'bg-gray-800' : 'bg-gray-800/40'}`}
                >
                  <p className="text-gray-500 text-xs mb-1">{label}</p>
                  <p
                    className={`font-mono font-semibold ${highlight ? 'text-white text-lg' : 'text-gray-300 text-base'}`}
                  >
                    {value != null ? `${numOrDash(value)}${event.unit ?? ''}` : '-'}
                  </p>
                </div>
              ))}
            </div>

            <DeltaBadge actual={event.actual} estimate={event.estimate} unit={event.unit} />

            {event.actual == null && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-3 py-2 rounded-lg">
                Results not yet announced
              </div>
            )}
          </>
        )}

        {/* ── Earnings ── */}
        {event.category === 'earnings' && (
          <>
            {event.hour && (
              <p className="text-gray-400 text-sm">
                {event.hour === 'bmo'
                  ? '🌅 Before Market Open'
                  : event.hour === 'amc'
                    ? '🌙 After Market Close'
                    : event.hour === 'dmh'
                      ? '☀️ During Market Hours'
                      : event.hour}
              </p>
            )}

            {/* EPS */}
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-2 font-semibold uppercase tracking-wide">
                EPS
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-xs">Actual</p>
                  <p className="text-white font-mono font-bold text-lg">
                    {event.epsActual != null ? `$${event.epsActual.toFixed(2)}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Estimate</p>
                  <p className="text-gray-300 font-mono text-lg">
                    {event.epsEstimate != null ? `$${event.epsEstimate.toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <DeltaBadge actual={event.epsActual} estimate={event.epsEstimate} unit="$" />
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500 text-xs mb-2 font-semibold uppercase tracking-wide">
                Revenue
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-xs">Actual</p>
                  <p className="text-white font-mono font-bold text-lg">
                    {formatRevenue(event.revenueActual)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Estimate</p>
                  <p className="text-gray-300 font-mono text-lg">
                    {formatRevenue(event.revenueEstimate)}
                  </p>
                </div>
              </div>
            </div>

            {event.quarter && event.year && (
              <p className="text-gray-500 text-sm">
                Q{event.quarter} {event.year} Earnings
              </p>
            )}

            {event.epsActual == null && event.revenueActual == null && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-3 py-2 rounded-lg">
                Results not yet released
              </div>
            )}
          </>
        )}

        {/* ── IPO ── */}
        {event.category === 'ipo' && (
          <>
            <div className="bg-gray-800 rounded-lg p-3 space-y-2.5">
              {[
                { label: 'Exchange', value: event.exchange },
                { label: 'Ticker', value: event.symbol, mono: true },
                {
                  label: 'IPO Price',
                  value: event.price && event.price !== 'undefined' ? `$${event.price}` : null,
                  mono: true,
                },
                {
                  label: 'Shares',
                  value:
                    event.numberOfShares != null
                      ? `${(event.numberOfShares / 1e6).toFixed(1)}M`
                      : null,
                  mono: true,
                },
                {
                  label: 'Deal Size',
                  value:
                    event.totalSharesValue != null && event.totalSharesValue > 0
                      ? event.totalSharesValue >= 1e9
                        ? `$${(event.totalSharesValue / 1e9).toFixed(2)}B`
                        : `$${(event.totalSharesValue / 1e6).toFixed(1)}M`
                      : null,
                  mono: true,
                },
              ]
                .filter((row) => row.value)
                .map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span
                      className={`text-white text-sm font-medium ${mono ? 'font-mono' : ''}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}

              {event.status && event.status !== 'undefined' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      event.status === 'priced'
                        ? 'bg-green-500/20 text-green-300'
                        : event.status === 'filed'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 text-sm text-pink-200 leading-relaxed">
              <strong>⚡ NASDAQ Fast Entry Rule</strong>
              <br />
              Top-40 market cap companies are added within 15 trading days of IPO with a 3× weight
              multiplier. QQQ and other passive ETFs are forced to buy ≈$50B+.
            </div>
          </>
        )}

        {/* ── Market context ── */}
        <MarketContextBox title={event.title} category={event.category} />

        {/* ── Detail page link ── */}
        {event.category !== 'breaking' && (
          <Link
            href={`/events/${toSlug(event.title, event.date)}`}
            className="block text-center py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-blue-400 text-sm transition-colors"
          >
            View full details &amp; history →
          </Link>
        )}

        {/* ── Breaking / news ── */}
        {event.category === 'breaking' && (
          <>
            {event.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.image} alt="" className="w-full h-40 object-cover rounded-lg" />
            )}
            {event.summary && (
              <p className="text-gray-300 text-sm leading-relaxed">{event.summary}</p>
            )}
            {event.source && (
              <p className="text-gray-600 text-xs">Source: {event.source}</p>
            )}
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-blue-400 text-sm transition-colors"
              >
                Read Full Article →
              </a>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

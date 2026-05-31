'use client';

import { useEffect, useState } from 'react';
import { NewsItem } from '@/types/events';

export default function BreakingSection({ initialNews = [] }: { initialNews?: NewsItem[] }) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [loading, setLoading] = useState(initialNews.length === 0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (initialNews.length > 0) return;

    fetch('/api/news')
      .then((r) => r.json())
      .then((data) => {
        setNews(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function timeAgo(unix: number): string {
    const diff = Math.floor(Date.now() / 1000 - unix);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <section
      aria-label="Breaking Market News"
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-controls="breaking-news-list"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
          <span className="text-red-400 font-bold text-sm tracking-wider uppercase">
            Breaking Market News
          </span>
          {!loading && news.length > 0 && (
            <span className="text-gray-600 text-xs">{news.length} articles</span>
          )}
        </div>
        <span className="text-gray-600 text-xs">
          {collapsed ? 'expand ▾' : 'collapse ▴'}
        </span>
      </button>

      {/* News list */}
      {!collapsed && (
        <div
          id="breaking-news-list"
          className="border-t border-gray-800 divide-y divide-gray-800/60"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex gap-3">
                  <div className="w-14 h-10 bg-gray-800 rounded animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-800 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-800 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            : news.slice(0, 5).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors group"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="w-14 h-10 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-10 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center text-gray-600 text-xs">
                      📰
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm leading-snug group-hover:text-white line-clamp-2">
                      {item.headline}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {item.source} · {timeAgo(item.datetime)}
                    </p>
                  </div>
                  <span className="text-gray-600 text-xs flex-shrink-0 group-hover:text-gray-400" aria-hidden="true">
                    →
                  </span>
                </a>
              ))}
        </div>
      )}
    </section>
  );
}

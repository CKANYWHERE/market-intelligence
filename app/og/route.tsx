// GET /og?title=...&date=...&category=...
// Next.js ImageResponse로 동적 OG 이미지 생성 (1200×630)
// 사용: openGraph.images[0].url = `/og?title=${encodeURIComponent(title)}&date=${date}&category=${category}`

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// 카테고리별 색상
const CATEGORY_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  monetary_policy: { bg: '#1e40af', text: '#93c5fd', label: 'Monetary Policy' },
  inflation:       { bg: '#7c2d12', text: '#fca5a5', label: 'Inflation' },
  employment:      { bg: '#14532d', text: '#86efac', label: 'Employment' },
  growth:          { bg: '#4c1d95', text: '#c4b5fd', label: 'Growth' },
  earnings:        { bg: '#854d0e', text: '#fde047', label: 'Earnings' },
  ipo:             { bg: '#1e3a5f', text: '#67e8f9', label: 'IPO' },
  breaking:        { bg: '#7f1d1d', text: '#fca5a5', label: 'Breaking' },
};

function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title    = searchParams.get('title')    ?? 'US Market Calendar';
  const date     = searchParams.get('date')     ?? '';
  const category = searchParams.get('category') ?? 'growth';

  const cat   = CATEGORY_COLOR[category] ?? CATEGORY_COLOR.growth;
  const dateLabel = formatDateLabel(date);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#030712',
          padding: '64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top: site name + category badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px', height: '36px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>M</div>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '20px', fontWeight: 600 }}>
              marketclock.net
            </div>
          </div>
          <div
            style={{
              backgroundColor: cat.bg,
              color: cat.text,
              fontSize: '18px',
              fontWeight: 700,
              padding: '8px 20px',
              borderRadius: '999px',
            }}
          >
            {cat.label}
          </div>
        </div>

        {/* Center: event title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justifyContent: 'center' }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: title.length > 50 ? '46px' : '54px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: '960px',
            }}
          >
            {title}
          </div>
          {dateLabel && (
            <div style={{ color: '#6b7280', fontSize: '28px', fontWeight: 500 }}>
              {dateLabel}
            </div>
          )}
        </div>

        {/* Bottom: divider + tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ height: '1px', backgroundColor: '#1f2937', width: '100%' }} />
          <div style={{ color: '#4b5563', fontSize: '18px' }}>
            FOMC · CPI · Earnings · IPO · Breaking News — All in one real-time dashboard
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    },
  );
}

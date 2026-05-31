/**
 * Mock data — breaking_events table
 *
 * The 30-min batch cron:
 *   1. Fetches raw news (Finnhub /news, Fed RSS, SEC 8-K)
 *   2. Passes each item to Claude Haiku for classification
 *   3. Writes ALL items with their classification
 *   4. Sets is_displayed = true ONLY for HIGH items
 *
 * This mock shows a realistic mix of all three classifications.
 */

export type MockBreakingEvent = {
  id: string;
  source_id: string;
  headline: string;
  summary: string | null;
  url: string;
  image_url: string | null;
  source: string;
  published_at: Date;
  ai_classification: 'HIGH' | 'MEDIUM' | 'LOW';
  ai_reason: string | null;
  ai_classified_at: Date | null;
  is_displayed: boolean;
  created_at: Date;
};

export const mockBreakingEvents: MockBreakingEvent[] = [
  // ── HIGH (displayed in UI) ────────────────────────────────────
  {
    id: 'clx_brk_001',
    source_id: 'finnhub_news_39021847',
    headline: 'Fed Signals Surprise Emergency Rate Cut Amid Tariff Shock',
    summary:
      'The Federal Reserve issued an unscheduled statement indicating it stands ready to cut rates by 50bps following the White House\'s announcement of sweeping 35% tariffs on Chinese semiconductors.',
    url: 'https://www.wsj.com/articles/fed-emergency-rate-cut-tariff',
    image_url: 'https://images.wsj.net/im-fed-emergency.jpg',
    source: 'Federal Reserve',
    published_at: new Date('2026-05-27T14:22:00Z'),
    ai_classification: 'HIGH',
    ai_reason:
      'Emergency Fed action + tariff shock directly and immediately affects equity valuations, interest rate expectations, and currency markets. Immediate impact on US stocks.',
    ai_classified_at: new Date('2026-05-27T14:32:00Z'),
    is_displayed: true,
    created_at: new Date('2026-05-27T14:32:00Z'),
  },
  {
    id: 'clx_brk_002',
    source_id: 'sec_8k_nvidia_20260522',
    headline: 'NVIDIA Announces $40B Share Buyback and Special $1.00 Dividend',
    summary:
      'NVIDIA Corporation filed an 8-K disclosing a board-approved $40 billion share repurchase program and a special one-time cash dividend of $1.00 per share payable June 14.',
    url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=NVDA',
    image_url: null,
    source: 'SEC EDGAR',
    published_at: new Date('2026-05-22T16:05:00Z'),
    ai_classification: 'HIGH',
    ai_reason:
      'Major capital return announcement for one of the largest US companies by market cap. Directly affects NVDA stock price and QQQ/SPY weighting.',
    ai_classified_at: new Date('2026-05-22T16:15:00Z'),
    is_displayed: true,
    created_at: new Date('2026-05-22T16:15:00Z'),
  },
  // ── MEDIUM (stored, not displayed) ───────────────────────────
  {
    id: 'clx_brk_003',
    source_id: 'finnhub_news_39015932',
    headline: 'US Treasury Yields Rise as Bond Market Digests Inflation Data',
    summary:
      '10-year Treasury yields climbed to 4.72% as investors reassessed the Fed\'s rate path following a hotter-than-expected CPI print.',
    url: 'https://www.bloomberg.com/news/treasury-yields-cpi',
    image_url: null,
    source: 'Finnhub',
    published_at: new Date('2026-05-13T12:10:00Z'),
    ai_classification: 'MEDIUM',
    ai_reason:
      'Bond market movement is relevant but not an immediate market-moving event. Yields rising is expected after hot CPI; no sudden shock.',
    ai_classified_at: new Date('2026-05-13T12:20:00Z'),
    is_displayed: false,
    created_at: new Date('2026-05-13T12:20:00Z'),
  },
  {
    id: 'clx_brk_004',
    source_id: 'finnhub_news_39009874',
    headline: 'Apple Vision Pro 2 Pre-Orders Open, Shipping Begins July',
    summary: 'Apple opened pre-orders for Vision Pro 2 at $2,999, with first deliveries scheduled for mid-July.',
    url: 'https://www.apple.com/vision-pro',
    image_url: null,
    source: 'Finnhub',
    published_at: new Date('2026-05-20T09:00:00Z'),
    ai_classification: 'MEDIUM',
    ai_reason:
      'Product launch news for a major company but not a sudden shock. Incremental positive for AAPL; market likely already priced this in.',
    ai_classified_at: new Date('2026-05-20T09:10:00Z'),
    is_displayed: false,
    created_at: new Date('2026-05-20T09:10:00Z'),
  },
  // ── LOW (stored, not displayed) ───────────────────────────────
  {
    id: 'clx_brk_005',
    source_id: 'finnhub_news_39003211',
    headline: 'Goldman Sachs Upgrades Target for Industrials Sector',
    summary: 'Goldman Sachs raised its 12-month target for the S&P 500 Industrials sector by 5%, citing strong order backlogs.',
    url: 'https://www.goldmansachs.com/insights/industrials-upgrade',
    image_url: null,
    source: 'Finnhub',
    published_at: new Date('2026-05-21T07:30:00Z'),
    ai_classification: 'LOW',
    ai_reason: 'Sector upgrade note from a single bank; does not represent a sudden market-moving event. Routine analyst action.',
    ai_classified_at: new Date('2026-05-21T07:40:00Z'),
    is_displayed: false,
    created_at: new Date('2026-05-21T07:40:00Z'),
  },
];

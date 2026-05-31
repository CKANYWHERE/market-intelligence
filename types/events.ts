export type EventCategory =
  | 'monetary_policy'
  | 'inflation'
  | 'employment'
  | 'growth'
  | 'earnings'
  | 'ipo'
  | 'breaking';

export type Importance = 'high' | 'medium' | 'low';

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM (ET)
  title: string;
  category: EventCategory;
  importance: Importance;
  country?: string;

  // Economic indicator
  actual?: number | null;
  estimate?: number | null;
  prev?: number | null;
  unit?: string;

  // Earnings
  symbol?: string;
  epsActual?: number | null;
  epsEstimate?: number | null;
  revenueActual?: number | null;
  revenueEstimate?: number | null;
  hour?: string; // 'bmo' | 'amc' | 'dmh'
  quarter?: number;
  year?: number;

  // IPO
  exchange?: string;
  numberOfShares?: number;
  price?: string;
  status?: string;
  totalSharesValue?: number;

  // Breaking / news
  headline?: string;
  summary?: string;
  url?: string;
  source?: string;
  image?: string;
}

export interface QuoteData {
  symbol: string;
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface NewsItem {
  id: number;
  datetime: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image?: string;
  category: string;
  related?: string;
}

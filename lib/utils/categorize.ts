import { EventCategory, Importance } from '@/types/events';

export function categorizeEconomicEvent(eventName: string): EventCategory {
  const n = eventName.toLowerCase();

  if (
    /fomc|federal open market|fed interest rate|interest rate decision|beige book|powell|federal reserve chair|monetary policy statement|rate hike|rate cut|fed funds|quantitative|fed.*speech|fed.*statement|press conference|fed chair|fed governor|fed president|fed vice|federal reserve.*speech|central bank/.test(n)
  )
    return 'monetary_policy';

  if (
    /\bcpi\b|consumer price index|core cpi|\bppi\b|producer price|\bpce\b|personal consumption expenditure|core pce|inflation expectation|michigan.*inflation|inflation/.test(n)
  )
    return 'inflation';

  if (
    /nonfarm payroll|non-farm payroll|\bnfp\b|unemployment rate|initial jobless|continuing jobless|employment change|jolts|job openings|adp.*employment|labor market/.test(n)
  )
    return 'employment';

  // Default: growth / macro
  return 'growth';
}

export function mapImpact(impact: string): Importance {
  if (impact === 'high') return 'high';
  if (impact === 'medium') return 'medium';
  return 'low';
}

export type CategoryMeta = {
  label: string;
  chipClass: string; // bg + text + border for chips
  dotClass: string;  // solid dot color
  badgeClass: string; // for filter pills (same as chip but used by pill buttons)
};

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  monetary_policy: {
    label: 'Monetary Policy',
    chipClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-400',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  inflation: {
    label: 'Inflation',
    chipClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    dotClass: 'bg-orange-400',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  employment: {
    label: 'Employment',
    chipClass: 'bg-green-500/20 text-green-300 border-green-500/30',
    dotClass: 'bg-green-400',
    badgeClass: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  growth: {
    label: 'Growth & GDP',
    chipClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dotClass: 'bg-purple-400',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  earnings: {
    label: 'Earnings',
    chipClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    dotClass: 'bg-yellow-400',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  ipo: {
    label: 'IPO / NASDAQ',
    chipClass: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    dotClass: 'bg-pink-400',
    badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  },
  breaking: {
    label: 'Breaking',
    chipClass: 'bg-red-500/20 text-red-300 border-red-500/30',
    dotClass: 'bg-red-400',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

export const IMPORTANCE_STARS: Record<Importance, string> = {
  high: '★★★',
  medium: '★★☆',
  low: '★☆☆',
};

/**
 * HOT/COOL badge for economic releases.
 * HOT = actual beat estimate (stronger than expected).
 * COOL = actual missed estimate (weaker than expected).
 * For unemployment & initial jobless claims: inverted (higher = COOL).
 */
export function getHeatBadge(
  title: string,
  actual: number | null | undefined,
  estimate: number | null | undefined,
): 'HOT' | 'COOL' | null {
  if (actual == null || estimate == null) return null;
  const diff = actual - estimate;
  if (diff === 0) return null;

  // Inverted indicators: higher = worse
  const inverted = /unemployment|jobless claims|initial claims|continuing claims/.test(
    title.toLowerCase(),
  );

  const rawBeat = diff > 0;
  const beat = inverted ? !rawBeat : rawBeat;
  return beat ? 'HOT' : 'COOL';
}

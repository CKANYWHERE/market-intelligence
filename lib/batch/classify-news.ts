/**
 * Claude Haiku 뉴스 분류기 + 키워드 fallback 분류기
 *
 * classifyNews()   — Claude Haiku API 사용 (ANTHROPIC_API_KEY 필요)
 * fallbackClassify() — API 키 없을 때 키워드 기반 로컬 분류
 *
 * Model: claude-haiku-4-5-20251001
 * 비용: ~$0.0002 / 10건 배치 → 30분 간격 기준 월 ~$0.29
 */

export type NewsInput = {
  id: string;
  headline: string;
  summary?: string;
};

export type ClassifiedNews = NewsInput & {
  classification: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
};

// ── Claude Haiku 분류 ─────────────────────────────────────────
const SYSTEM_PROMPT = `You are a financial news classifier for US equity investors.

Classify each news item as HIGH, MEDIUM, or LOW based on immediate market impact:

HIGH  — Sudden, unscheduled events that will move equity markets within hours:
        emergency Fed actions, major tariff announcements, geopolitical shocks,
        unexpected earnings warnings/pre-announcements, sudden CEO departures at S&P 500 firms,
        credit rating downgrades of US sovereign debt, confirmed IPO dates for $100B+ companies.

MEDIUM — Relevant but expected or incremental: scheduled data releases, analyst upgrades,
          product launches, merger talks without confirmation, normal earnings beats/misses.

LOW   — Routine, sector-specific, or already priced in: general industry news,
        analyst commentary, company blog posts, international news with no US equity impact.

Respond with a JSON array ONLY. No markdown. Example:
[{"id":"abc","classification":"HIGH","reason":"Emergency Fed statement..."},...]`;

export async function classifyNews(items: NewsInput[]): Promise<ClassifiedNews[]> {
  if (items.length === 0) return [];

  // Dynamic import — ANTHROPIC_API_KEY 없을 때도 모듈 로드 실패하지 않도록
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userContent = items
    .map((item) => `ID: ${item.id}\nHeadline: ${item.headline}\nSummary: ${item.summary ?? ''}`)
    .join('\n---\n');

  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userContent }],
  });

  const raw = (message.content[0] as { type: 'text'; text: string }).text.trim();

  let parsed: Array<{ id: string; classification: 'HIGH' | 'MEDIUM' | 'LOW'; reason: string }>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('[classify-news] JSON parse failed:', raw.slice(0, 200));
    return items.map((item) => fallbackClassify(item));
  }

  return items.map((item) => {
    const result = parsed.find((r) => r.id === item.id);
    return {
      ...item,
      classification: result?.classification ?? 'MEDIUM',
      reason:         result?.reason ?? 'unmatched id',
    };
  });
}

// ── 키워드 기반 Fallback 분류기 ───────────────────────────────
// ANTHROPIC_API_KEY 없는 개발 환경에서 사용
// 정확도는 Claude보다 낮지만 구조 테스트에는 충분함

const HIGH_KEYWORDS = [
  'emergency', 'breaking', 'urgent', 'flash',
  'tariff', 'trade war', 'sanction',
  'fed rate cut', 'fed rate hike', 'fomc emergency',
  'credit downgrade', 'default', 'bankruptcy',
  'ceo resign', 'ceo fired', 'ceo depart',
  'ipo confirmed', 'ipo priced', 'nasdaq listing',
  'market crash', 'circuit breaker', 'halt',
  'recall', 'fda reject', 'sec investigation',
];

const LOW_KEYWORDS = [
  'analyst upgrade', 'analyst downgrade', 'price target',
  'blog post', 'partnership', 'award', 'conference',
  'quarterly review', 'annual report', 'white paper',
];

export function fallbackClassify(item: NewsInput): ClassifiedNews {
  const text = `${item.headline} ${item.summary ?? ''}`.toLowerCase();

  if (HIGH_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      ...item,
      classification: 'HIGH',
      reason: '[fallback] matched HIGH keyword',
    };
  }
  if (LOW_KEYWORDS.some((kw) => text.includes(kw))) {
    return {
      ...item,
      classification: 'LOW',
      reason: '[fallback] matched LOW keyword',
    };
  }
  return {
    ...item,
    classification: 'MEDIUM',
    reason: '[fallback] default classification',
  };
}

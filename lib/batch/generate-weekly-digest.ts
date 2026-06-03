/**
 * Weekly Market Digest 생성기
 *
 * 이번 주 캘린더 이벤트(경제 지표 + 실적 + IPO)를 Claude Haiku에 전달해
 * "시장에 가장 영향을 줄 Top 5"를 선별하고 각각에 맥락 코멘트를 붙인다.
 *
 * 비용: Claude Haiku 주 1회 호출 ≈ $0.001 미만
 */

import { db } from '@/lib/batch/db';

export interface DigestItem {
  rank:           number;
  title:          string;
  date:           string;   // YYYY-MM-DD
  category:       string;
  why_it_matters: string;   // Claude 생성 — 왜 중요한가
  watch_for:      string;   // Claude 생성 — 뭘 봐야 하나
  event_id?:      string;   // DB row id (캘린더 링크용)
}

/** 해당 주의 월요일 00:00 UTC를 반환 */
export function getWeekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon …
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

interface RawEvent {
  id:       string;
  title:    string;
  date:     Date;
  category: string;
  symbol?:  string | null;
  company?: string | null;
}

async function fetchWeekEvents(weekStart: Date): Promise<RawEvent[]> {
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const [ecoEvents, earnEvents, ipoEvents] = await Promise.all([
    db.economicEvent.findMany({
      where: {
        date:       { gte: weekStart, lte: weekEnd },
        importance: { in: ['high', 'medium'] },
      },
      orderBy: { date: 'asc' },
    }),
    db.earningsEvent.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      orderBy: { date: 'asc' },
    }),
    db.ipoEvent.findMany({
      where: {
        date:   { gte: weekStart, lte: weekEnd },
        status: { in: ['expected', 'priced'] },
      },
      orderBy: { date: 'asc' },
    }),
  ]);

  const events: RawEvent[] = [
    ...ecoEvents.map((e) => ({
      id:       e.id,
      title:    e.title,
      date:     e.date,
      category: e.category,
    })),
    ...earnEvents.map((e) => ({
      id:       e.id,
      title:    `${e.symbol} Earnings`,
      date:     e.date,
      category: 'earnings',
      symbol:   e.symbol,
      company:  e.company,
    })),
    ...ipoEvents.map((e) => ({
      id:       e.id,
      title:    `${e.company} IPO`,
      date:     e.date,
      category: 'ipo',
      symbol:   e.symbol,
    })),
  ];

  return events;
}

// ── 카테고리별 우선순위 (fallback 정렬용) ─────────────────────
const CATEGORY_PRIORITY: Record<string, number> = {
  monetary_policy: 1,
  inflation:       2,
  employment:      3,
  growth:          4,
  earnings:        5,
  ipo:             6,
};

// ── 카테고리별 fallback 텍스트 템플릿 ────────────────────────
const FALLBACK_TEMPLATES: Record<string, { why: string; watch: string }> = {
  monetary_policy: {
    why:   'Fed rate decisions directly set the cost of capital for equities and bonds. Any surprise in tone or language moves markets immediately.',
    watch: 'Watch the policy statement language — "patient", "data-dependent", or any shift in forward guidance.',
  },
  inflation: {
    why:   'Inflation data is the primary input for Fed rate decisions. A surprise print can shift rate-cut expectations sharply.',
    watch: 'Core month-over-month reading vs. consensus — even a 0.1% miss or beat matters.',
  },
  employment: {
    why:   'Employment is the Fed\'s second mandate. Strong jobs data delays rate cuts; weak data accelerates them.',
    watch: 'Headline number vs. consensus and any revision to the prior month.',
  },
  growth: {
    why:   'Growth data shapes the macro backdrop for corporate earnings and consumer spending.',
    watch: 'Whether the actual reading confirms, beats, or misses consensus expectations.',
  },
  earnings: {
    why:   'Earnings results drive individual stock moves and can shift sector sentiment.',
    watch: 'EPS vs. estimate and management guidance for the next quarter.',
  },
  ipo: {
    why:   'High-profile IPOs signal risk appetite and can trigger passive ETF rebalancing under the NASDAQ Fast Entry Rule.',
    watch: 'Opening price vs. IPO price and first-day trading volume.',
  },
};

// ── Fallback: Claude 없을 때 알고리즘으로 Top 5 선별 ─────────
function fallbackDigest(events: RawEvent[]): DigestItem[] {
  const sorted = [...events].sort((a, b) => {
    const pa = CATEGORY_PRIORITY[a.category] ?? 9;
    const pb = CATEGORY_PRIORITY[b.category] ?? 9;
    if (pa !== pb) return pa - pb;
    return a.date.getTime() - b.date.getTime();
  });

  return sorted.slice(0, 5).map((e, i) => {
    const tpl = FALLBACK_TEMPLATES[e.category] ?? FALLBACK_TEMPLATES.growth;
    return {
      rank:           i + 1,
      title:          e.title,
      date:           e.date.toISOString().slice(0, 10),
      category:       e.category,
      why_it_matters: tpl.why,
      watch_for:      tpl.watch,
      event_id:       e.id,
    };
  });
}

const SYSTEM_PROMPT = `You are a senior macro strategist writing a weekly market briefing for US equity investors.

Given a list of scheduled market events for the week, select the TOP 5 most market-moving events and explain each one briefly.

Rules:
- Rank 1 = most impactful for US equities this week
- Be direct and specific — no generic phrases like "may impact markets"
- why_it_matters: 1-2 sentences on why this event matters RIGHT NOW in the current macro context
- watch_for: 1 concrete thing investors should watch (a number, a threshold, a Fed tone, etc.)
- Respond ONLY with a valid JSON array. No markdown, no extra text.

JSON format:
[
  {
    "rank": 1,
    "event_id": "<id from input>",
    "title": "<event title>",
    "date": "<YYYY-MM-DD>",
    "category": "<category>",
    "why_it_matters": "...",
    "watch_for": "..."
  }
]`;

export async function generateWeeklyDigest(weekStart: Date): Promise<DigestItem[]> {
  const events = await fetchWeekEvents(weekStart);

  if (events.length === 0) return [];

  // ANTHROPIC_API_KEY 없으면 rule-based fallback 사용
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[weekly-digest] No ANTHROPIC_API_KEY — using fallback');
    return fallbackDigest(events);
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const weekLabel = weekStart.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const weekEndLabel = weekEnd.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });

  const userContent = `Week: ${weekLabel} – ${weekEndLabel}\n\nEvents:\n` +
    events
      .map((e) =>
        `ID: ${e.id}\nTitle: ${e.title}\nDate: ${e.date.toISOString().slice(0, 10)}\nCategory: ${e.category}`,
      )
      .join('\n---\n');

  const message = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userContent }],
  });

  const raw = (message.content[0] as { type: 'text'; text: string }).text.trim();

  let parsed: DigestItem[];
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('[weekly-digest] JSON parse failed:', raw.slice(0, 300));
    parsed = fallbackDigest(events);
  }

  return parsed;
}

/** DB에서 현재 주 digest 조회 또는 생성 후 반환 */
export async function getOrGenerateDigest(weekStart?: Date): Promise<DigestItem[]> {
  const ws = weekStart ?? getWeekStart();

  const existing = await db.weeklyDigest.findUnique({
    where: { week_start: ws },
  });

  if (existing) return existing.items as unknown as DigestItem[];

  // 생성
  const items = await generateWeeklyDigest(ws);
  if (items.length === 0) return [];

  await db.weeklyDigest.upsert({
    where:  { week_start: ws },
    create: { week_start: ws, items: items as object[] },
    update: { items: items as object[], generated_at: new Date() },
  });

  return items;
}

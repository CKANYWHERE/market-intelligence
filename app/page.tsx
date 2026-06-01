import { Metadata } from 'next';
import { getMarketNews } from '@/lib/api/finnhub';
import { db } from '@/lib/batch/db';
import { NewsItem } from '@/types/events';
import HomeClient from '@/components/HomeClient';
import { allSchemas, UpcomingEvent } from '@/lib/seo/json-ld';

type RawNews = Record<string, unknown>;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://market-intelligence-87mm.vercel.app';

// 페이지별 동적 메타데이터 — 현재 달을 타이틀에 포함시켜 날짜별 검색 노출 강화
export async function generateMetadata(): Promise<Metadata> {
  const now   = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year  = now.getFullYear();
  return {
    title: `US Market Calendar ${month} ${year} — FOMC, CPI, Earnings & IPO Dates`,
    description: `Track every major US market event in ${month} ${year}: FOMC meeting dates, CPI/PCE/NFP releases, AAPL MSFT NVDA GOOGL AMZN earnings, upcoming IPOs (SpaceX, Anthropic), and breaking news — free real-time dashboard.`,
    alternates: { canonical: SITE_URL },
  };
}

async function getUpcomingEvents(): Promise<UpcomingEvent[]> {
  try {
    const now = new Date();
    const twoMonthsOut = new Date(now);
    twoMonthsOut.setMonth(twoMonthsOut.getMonth() + 2);

    const [ecoRows, earnRows, ipoRows] = await Promise.all([
      db.economicEvent.findMany({
        where:   { date: { gte: now, lte: twoMonthsOut }, importance: { in: ['high', 'medium'] } },
        orderBy: { date: 'asc' },
        take:    30,
        select:  { title: true, date: true, time: true },
      }),
      db.earningsEvent.findMany({
        where:   { date: { gte: now, lte: twoMonthsOut } },
        orderBy: { date: 'asc' },
        take:    20,
        select:  { symbol: true, date: true, hour: true },
      }),
      db.ipoEvent.findMany({
        where:   { date: { gte: now, lte: twoMonthsOut } },
        orderBy: { date: 'asc' },
        take:    10,
        select:  { company: true, date: true },
      }),
    ]);

    const events: UpcomingEvent[] = [
      ...ecoRows.map((r) => ({
        title:    r.title,
        date:     r.date.toISOString().slice(0, 10),
        time:     r.time ?? undefined,
        category: 'economic',
      })),
      ...earnRows.map((r) => ({
        title:    `${r.symbol} Earnings`,
        date:     r.date.toISOString().slice(0, 10),
        category: 'earnings',
      })),
      ...ipoRows.map((r) => ({
        title:    `${r.company} IPO`,
        date:     r.date.toISOString().slice(0, 10),
        category: 'ipo',
      })),
    ];

    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  } catch {
    return [];
  } finally {
    db.$disconnect().catch(() => {});
  }
}

export default async function Home() {
  const [initialNews, upcomingEvents] = await Promise.all([
    getMarketNews()
      .then((data) =>
        ((data as RawNews[]) ?? []).slice(0, 20).map((item) => ({
          id:       Number(item.id),
          datetime: Number(item.datetime),
          headline: String(item.headline ?? ''),
          summary:  String(item.summary ?? ''),
          source:   String(item.source ?? ''),
          url:      String(item.url ?? ''),
          image:    item.image ? String(item.image) : undefined,
          category: String(item.category ?? ''),
          related:  item.related ? String(item.related) : undefined,
        })) as NewsItem[]
      )
      .catch(() => [] as NewsItem[]),
    getUpcomingEvents(),
  ]);

  // 크롤러가 읽을 수 있는 서버사이드 이벤트 요약 (upcoming events)
  const now   = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year  = now.getFullYear();

  return (
    <>
      {/* JSON-LD — 서버에서 실제 이벤트 데이터 포함 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas(upcomingEvents)) }}
      />

      {/* 크롤러용 서버사이드 렌더링 텍스트 — CSS로 시각적으로 숨기지 않고 실제 표시 */}
      {upcomingEvents.length > 0 && (
        <section
          aria-label="Upcoming US market events"
          className="sr-only"
        >
          <h2>Upcoming US Market Events — {month} {year}</h2>
          <ul>
            {upcomingEvents.slice(0, 20).map((ev, i) => (
              <li key={i}>
                <time dateTime={ev.date}>{ev.date}</time>
                {ev.time ? ` at ${ev.time} ET` : ''}: {ev.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      <HomeClient initialNews={initialNews} />
    </>
  );
}

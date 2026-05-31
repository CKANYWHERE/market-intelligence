import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import { getMarketNews } from '@/lib/api/finnhub';
import { NewsItem } from '@/types/events';

type RawNews = Record<string, unknown>;

export async function GET() {
  try {
    // ── DB 우선: breaking_events에서 HIGH 분류된 뉴스 조회 ────
    const rows = await db.breakingEvent.findMany({
      where:   { is_displayed: true },
      orderBy: { published_at: 'desc' },
      take:    20,
    });

    if (rows.length > 0) {
      const items: NewsItem[] = rows.map((row, i) => ({
        id:       i + 1,  // NewsItem.id는 number — 순서로 대체
        datetime: Math.floor(new Date(row.published_at as string | Date).getTime() / 1000),
        headline: row.headline,
        summary:  row.summary ?? '',
        source:   row.source,
        url:      row.url,
        image:    row.image_url ?? undefined,
        category: 'breaking',
      }));

      return NextResponse.json({ items }, {
        headers: {
          // 배치 30분 주기 → 5분 캐시로 신선도 유지
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // ── DB 비어있으면 (배치 미실행 상태) Finnhub 직접 호출 ────
    const data = (await getMarketNews()) as RawNews[];
    const items: NewsItem[] = (data ?? []).slice(0, 20).map((item) => ({
      id:       Number(item.id),
      datetime: Number(item.datetime),
      headline: String(item.headline ?? ''),
      summary:  String(item.summary ?? ''),
      source:   String(item.source ?? ''),
      url:      String(item.url ?? ''),
      image:    item.image ? String(item.image) : undefined,
      category: String(item.category ?? ''),
      related:  item.related ? String(item.related) : undefined,
    }));

    return NextResponse.json({ items }, {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' },
    });

  } catch (err) {
    console.error('[news/route]', err);
    return NextResponse.json({ items: [] });
  }
}

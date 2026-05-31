import { getMarketNews } from '@/lib/api/finnhub';
import { NewsItem } from '@/types/events';
import HomeClient from '@/components/HomeClient';

type RawNews = Record<string, unknown>;

export default async function Home() {
  let initialNews: NewsItem[] = [];
  try {
    const data = (await getMarketNews()) as RawNews[];
    initialNews = (data ?? []).slice(0, 20).map((item) => ({
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
  } catch {
    // graceful degradation: BreakingSection will retry on the client
  }

  return <HomeClient initialNews={initialNews} />;
}

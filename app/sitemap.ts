import { MetadataRoute } from "next";
import { db } from "@/lib/batch/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // DB에서 가장 최근에 업데이트된 시각을 가져와 lastModified로 사용
  // → 실제 콘텐츠 변경 시각이 찍혀야 Googlebot이 신뢰함
  let lastModified = new Date();

  try {
    const [latestEco, latestBreaking] = await Promise.all([
      db.economicEvent.findFirst({ orderBy: { updated_at: "desc" }, select: { updated_at: true } }),
      db.breakingEvent.findFirst({ orderBy: { published_at: "desc" }, select: { published_at: true } }),
    ]);

    const candidates = [
      latestEco?.updated_at,
      latestBreaking?.published_at,
    ].filter(Boolean) as Date[];

    if (candidates.length > 0) {
      lastModified = candidates.reduce((a, b) => (a > b ? a : b));
    }
  } catch {
    // DB 접근 실패 시 현재 시각으로 fallback (빌드 시점에 DB 없을 수 있음)
  }

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}

import { MetadataRoute } from "next";
import { db } from "@/lib/batch/db";
import { toSlug } from "@/lib/utils/slug";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketclock.net";

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const sixMonthsOut = new Date(now);
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const [ecoRows, earnRows, ipoRows] = await Promise.all([
      db.economicEvent.findMany({
        where:   { date: { gte: now, lte: sixMonthsOut } },
        select:  { title: true, date: true },
        orderBy: { date: "asc" },
      }),
      db.earningsEvent.findMany({
        where:   { date: { gte: now, lte: sixMonthsOut } },
        select:  { symbol: true, date: true },
        orderBy: { date: "asc" },
      }),
      db.ipoEvent.findMany({
        where:   { date: { gte: now, lte: sixMonthsOut } },
        select:  { company: true, date: true },
        orderBy: { date: "asc" },
      }),
    ]);

    eventEntries = [
      ...ecoRows.map((r) => ({
        url:             `${SITE_URL}/events/${toSlug(r.title, toDateStr(r.date))}`,
        lastModified:    now,
        changeFrequency: "daily" as const,
        priority:        0.8,
      })),
      ...earnRows.map((r) => ({
        url:             `${SITE_URL}/events/${toSlug(`${r.symbol} Earnings`, toDateStr(r.date))}`,
        lastModified:    now,
        changeFrequency: "daily" as const,
        priority:        0.7,
      })),
      ...ipoRows.map((r) => ({
        url:             `${SITE_URL}/events/${toSlug(`${r.company} IPO`, toDateStr(r.date))}`,
        lastModified:    now,
        changeFrequency: "daily" as const,
        priority:        0.8,
      })),
    ];
  } catch {
    // DB 오류 시 이벤트 페이지 없이 반환
  } finally {
    db.$disconnect().catch(() => {});
  }

  return [
    {
      url:             SITE_URL,
      lastModified:    now,
      changeFrequency: "hourly",
      priority:        1,
    },
    {
      url:             `${SITE_URL}/spacex-ipo`,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        0.9,
    },
    ...eventEntries,
  ];
}

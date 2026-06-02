import { MetadataRoute } from "next";
import { db } from "@/lib/batch/db";
import { toSlug } from "@/lib/utils/slug";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intelligence-87mm.vercel.app";

function monthUrl(year: number, month: number): string {
  return `${SITE_URL}?year=${year}&month=${String(month).padStart(2, '0')}`;
}

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  // 현재 달 + 앞 2개월 + 뒤 1개월 → 총 4개월치 URL 생성
  const monthEntries: MetadataRoute.Sitemap = [];
  for (let offset = -1; offset <= 2; offset++) {
    let m = month + offset;
    let y = year;
    if (m < 1)  { m += 12; y--; }
    if (m > 12) { m -= 12; y++; }
    monthEntries.push({
      url:             monthUrl(y, m),
      lastModified:    now,
      changeFrequency: offset === 0 ? "hourly" : "daily",
      priority:        offset === 0 ? 0.9 : 0.7,
    });
  }

  // 이벤트 상세 페이지 URLs — high importance 이벤트만
  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const twoMonthsOut = new Date(now);
    twoMonthsOut.setMonth(twoMonthsOut.getMonth() + 2);

    const [ecoRows, earnRows, ipoRows] = await Promise.all([
      db.economicEvent.findMany({
        where:   { date: { gte: now, lte: twoMonthsOut }, importance: "high" },
        select:  { title: true, date: true },
        orderBy: { date: "asc" },
        take:    50,
      }),
      db.earningsEvent.findMany({
        where:   { date: { gte: now, lte: twoMonthsOut } },
        select:  { symbol: true, date: true },
        orderBy: { date: "asc" },
        take:    30,
      }),
      db.ipoEvent.findMany({
        where:   { date: { gte: now, lte: twoMonthsOut } },
        select:  { company: true, date: true },
        orderBy: { date: "asc" },
        take:    20,
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
    ...monthEntries,
    ...eventEntries,
  ];
}

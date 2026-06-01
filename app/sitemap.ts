import { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intelligence-87mm.vercel.app";

function monthUrl(year: number, month: number): string {
  return `${SITE_URL}?year=${year}&month=${String(month).padStart(2, '0')}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [
    {
      url:             SITE_URL,
      lastModified:    now,
      changeFrequency: "hourly",
      priority:        1,
    },
    ...monthEntries,
  ];
}

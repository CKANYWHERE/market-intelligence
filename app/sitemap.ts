import { MetadataRoute } from "next";

// 빌드 타임이 아닌 요청 시점에 동적으로 생성
// (빌드 타임에 DB 호출하면 Vercel 서버리스 연결 초과 발생)
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
  ];
}

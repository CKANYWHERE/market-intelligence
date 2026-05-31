import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // cron 엔드포인트와 관리자 엔드포인트만 차단
        // /api/calendar, /api/news 는 제거 — Googlebot이 JS 렌더링 시
        // 내부 호출하는 리소스를 차단하면 페이지 인덱싱에 악영향
        disallow: ["/api/cron/", "/api/admin/"],
      },
      {
        // AI 스크래퍼는 API 전체 차단 (크롤 비용 통제)
        userAgent: ["GPTBot", "ClaudeBot", "anthropic-ai", "Google-Extended"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

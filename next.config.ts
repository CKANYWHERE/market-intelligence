import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel Toolbar 비활성화 (프리뷰 환경에서도 숨김)
  devIndicators: false,

  // 외부 이미지 허용 도메인 (BreakingSection의 뉴스 썸네일)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.finnhub.io",
      },
      {
        protocol: "https",
        hostname: "**.reuters.com",
      },
      {
        protocol: "https",
        hostname: "**.bloomberg.com",
      },
      {
        protocol: "https",
        hostname: "**.marketwatch.com",
      },
      {
        protocol: "https",
        hostname: "**.wsj.com",
      },
      {
        protocol: "https",
        hostname: "**.cnbc.com",
      },
      {
        protocol: "https",
        hostname: "**.ft.com",
      },
      {
        protocol: "https",
        hostname: "**.seekingalpha.com",
      },
    ],
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 클릭재킹 방지
          { key: "X-Frame-Options", value: "DENY" },
          // MIME 스니핑 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // XSS 방지 (CSP 보완용)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer 정책
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // HSTS (HTTPS 강제)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // 권한 정책
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

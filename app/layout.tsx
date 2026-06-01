import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intelligence-87mm.vercel.app";
const SITE_NAME = "US Market Intelligence Dashboard";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "US Market Intelligence Dashboard — Economic Calendar, Earnings & IPO Tracker",
    template: "%s | US Market Intelligence",
  },

  description:
    "Free US stock market calendar: FOMC dates, CPI/PCE/NFP releases, AAPL MSFT NVDA GOOGL AMZN META TSLA earnings, upcoming IPOs (SpaceX, Anthropic, OpenAI), and AI-filtered breaking market news — all in one real-time dashboard.",

  keywords: [
    "economic calendar 2026",
    "US earnings calendar",
    "IPO calendar 2026",
    "FOMC meeting dates 2026",
    "CPI release date",
    "PCE release schedule",
    "nonfarm payrolls date",
    "Fed interest rate decision",
    "AAPL earnings date",
    "NVDA earnings calendar",
    "MSFT GOOGL AMZN META earnings",
    "SpaceX IPO date",
    "Anthropic IPO",
    "OpenAI IPO 2026",
    "NASDAQ-100 rebalancing",
    "QQQ SPY tracker",
    "stock market events",
    "breaking market news",
    "financial calendar",
    "market intelligence dashboard",
  ],

  applicationName: SITE_NAME,

  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "x-default": SITE_URL,
    },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "US Market Intelligence Dashboard — Economic Calendar, Earnings & IPO Tracker",
    description:
      "Free US stock market calendar: FOMC, CPI, PCE, NFP, earnings (AAPL NVDA MSFT), IPOs (SpaceX, Anthropic), and breaking news — one real-time dashboard.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "US Market Intelligence Dashboard — Economic Calendar, Earnings & IPO Tracker",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "US Market Intelligence Dashboard",
    description:
      "Free economic calendar: FOMC, CPI, earnings (AAPL, NVDA, MSFT), IPO (SpaceX, Anthropic), and breaking news — one dashboard.",
    images: ["/og-image.png"],
    // creator: "@handle" — 실제 계정 생성 후 추가
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  // Google Search Console 소유권 확인 후 주석 해제:
  // verification: {
  //   google: "REPLACE_WITH_GSC_VERIFICATION_TOKEN",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 미국 타겟 geo 메타태그 — Bing/Yahoo 지역 타겟팅 */}
        <meta name="geo.region"      content="US" />
        <meta name="geo.placename"   content="United States" />
        <meta name="language"        content="en-US" />
        <meta httpEquiv="content-language" content="en-us" />
        {/* Google AdSense — NEXT_PUBLIC_ADSENSE_CLIENT_ID 설정 시 활성화 */}
        {ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        {children}
      </body>
    </html>
  );
}

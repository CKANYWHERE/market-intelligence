import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { allSchemas } from "@/lib/seo/json-ld";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intel.app";
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
    "Free US stock market calendar: FOMC dates, CPI/PCE releases, NFP, S&P 500 earnings, upcoming IPOs, and breaking market news — all in one real-time dashboard.",

  keywords: [
    "economic calendar",
    "earnings calendar",
    "IPO calendar",
    "FOMC calendar",
    "CPI release date",
    "PCE release",
    "nonfarm payrolls",
    "stock market events",
    "Fed meeting dates",
    "S&P 500 earnings",
    "NASDAQ IPO",
    "market intelligence",
    "financial calendar 2026",
  ],

  alternates: {
    canonical: "/",
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
      "Free US stock market calendar: FOMC dates, CPI/PCE releases, NFP, S&P 500 earnings, upcoming IPOs, and breaking market news — all in one real-time dashboard.",
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
      "Free economic calendar: FOMC, CPI, earnings, IPO, and breaking news — one dashboard.",
    images: ["/og-image.png"],
    creator: "@marketintelapp",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },

  // Google Search Console 등록 후 주석 해제
  // verification: {
  //   google: "REPLACE_WITH_GSC_TOKEN",
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
        {/* JSON-LD — <head> 안에 있어야 Google이 가장 안정적으로 파싱 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(allSchemas()) }}
        />
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

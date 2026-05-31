/**
 * JSON-LD Structured Data
 *
 * Schema types:
 *  - WebSite        → site identity (SearchAction 제거 — 실제 검색 기능 없음)
 *  - FinancialService → Google이 금융 정보 도구로 분류
 *  - Dataset        → Google Dataset Search 노출 가능성
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://market-intel.app";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "US Market Intelligence Dashboard",
    url: SITE_URL,
    description:
      "Free economic calendar tracking FOMC, CPI, earnings, IPOs, and breaking market news for US stock investors.",
    // SearchAction 제거: 실제 검색 기능이 없는데 선언하면 Google 검증 실패 시 오히려 불이익
  };
}

export function financialServiceSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    "@id": `${SITE_URL}/#service`,
    name: "US Market Intelligence Dashboard",
    url: SITE_URL,
    description:
      "Real-time dashboard for US equity investors: economic indicator calendar, S&P 500 / NASDAQ earnings schedule, IPO tracker, and AI-filtered breaking market news.",
    serviceType: "Financial Information Service",
    audience: {
      "@type": "Audience",
      audienceType: "US stock market investors",
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function datasetSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE_URL}/#dataset`,
    name: "US Economic & Earnings Calendar 2026",
    description:
      "Aggregated calendar of US economic indicator releases (CPI, PCE, NFP, GDP, FOMC), corporate earnings announcements for S&P 500 companies, and upcoming IPO dates.",
    url: SITE_URL,
    keywords: [
      "economic calendar",
      "earnings calendar",
      "IPO calendar",
      "FOMC dates",
      "CPI release date",
      "PCE release",
      "nonfarm payrolls",
    ],
    creator: {
      "@type": "Organization",
      name: "US Market Intelligence",
      url: SITE_URL,
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    temporalCoverage: "2026",
    variableMeasured: [
      "CPI", "Core CPI", "PCE", "Core PCE", "PPI",
      "Nonfarm Payrolls", "Unemployment Rate", "GDP",
      "JOLTS", "Retail Sales", "ISM PMI",
      "S&P 500 EPS", "Revenue", "IPO Price",
    ],
  };
}

export function allSchemas() {
  return [websiteSchema(), financialServiceSchema(), datasetSchema()];
}

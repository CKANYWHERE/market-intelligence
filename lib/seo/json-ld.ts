/**
 * JSON-LD Structured Data
 *
 * @graph 구조로 단일 <script> 태그에 묶음 — Google 권장 방식
 *
 * Schema types:
 *  - WebSite          → site identity
 *  - WebApplication   → 앱 분류 (금융 대시보드)
 *  - FinancialService → Google이 금융 정보 도구로 분류
 *  - Dataset          → Google Dataset Search 노출 가능성
 *  - Event (optional) → 서버에서 수집한 이번 달 주요 이벤트 → Event rich results
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketclock.net";

export interface UpcomingEvent {
  title:     string;
  date:      string; // "YYYY-MM-DD"
  time?:     string; // "HH:MM" ET
  category:  string;
}

function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "US Market Calendar",
    url: SITE_URL,
    description:
      "Free economic calendar tracking FOMC, CPI, PCE, NFP, earnings, IPOs, and breaking market news for US stock investors.",
  };
}

function webApplicationSchema() {
  return {
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#webapp`,
    name: "US Market Calendar",
    url: SITE_URL,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript",
    description:
      "Real-time financial calendar dashboard covering FOMC meetings, CPI/PCE/NFP releases, S&P 500 & NASDAQ earnings, upcoming IPOs (SpaceX, Anthropic, OpenAI), and AI-filtered breaking market news.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "FOMC meeting dates and rate decisions",
      "CPI, PCE, NFP economic calendar",
      "S&P 500 and NASDAQ-100 earnings schedule",
      "IPO calendar with NASDAQ Fast Entry tracking",
      "QQQ, SPY, SCHD real-time price tracker",
      "AI-classified breaking market news",
    ],
  };
}

function financialServiceSchema() {
  return {
    "@type": "FinancialService",
    "@id": `${SITE_URL}/#service`,
    name: "US Market Calendar",
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

function datasetSchema() {
  const now = new Date().toISOString().slice(0, 10);
  return {
    "@type": "Dataset",
    "@id": `${SITE_URL}/#dataset`,
    name: "US Economic & Earnings Calendar 2025–2027",
    description:
      "Aggregated calendar of US economic indicator releases (CPI, PCE, NFP, GDP, FOMC), corporate earnings for AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA, and upcoming IPO dates including SpaceX and Anthropic.",
    url: SITE_URL,
    dateModified: now,
    keywords: [
      "economic calendar", "earnings calendar", "IPO calendar",
      "FOMC dates", "CPI release date", "PCE release", "nonfarm payrolls",
      "SpaceX IPO", "Anthropic IPO", "NASDAQ-100 rebalancing",
    ],
    creator: {
      "@type": "Organization",
      name: "US Market Calendar",
      url: SITE_URL,
    },
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    temporalCoverage: "2025/2027",
    variableMeasured: [
      "CPI", "Core CPI", "PCE", "Core PCE", "PPI",
      "Nonfarm Payrolls", "Unemployment Rate", "GDP",
      "JOLTS", "Retail Sales", "ISM PMI",
      "S&P 500 EPS", "Revenue", "IPO Price",
    ],
  };
}

function eventSchemas(events: UpcomingEvent[]) {
  return events.map((ev) => {
    const startDate = ev.time
      ? `${ev.date}T${ev.time}:00-05:00` // ET (UTC-5 / UTC-4 DST, approximate)
      : ev.date;
    return {
      "@type": "Event",
      name: ev.title,
      startDate,
      location: {
        "@type": "VirtualLocation",
        url: SITE_URL,
      },
      organizer: {
        "@type": "Organization",
        name: "US Market Calendar",
        url: SITE_URL,
      },
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      description: `${ev.title} — Track this US market event on the US Market Calendar.`,
      url: SITE_URL,
    };
  });
}

function faqSchema() {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "When is the next FOMC meeting?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "FOMC meetings are scheduled 8 times per year. Check the US Market Calendar for exact dates, rate decisions, and meeting minutes release schedules.",
        },
      },
      {
        "@type": "Question",
        name: "When is the next CPI release date?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Consumer Price Index (CPI) is released monthly by the Bureau of Labor Statistics, typically 2 weeks after month-end. The US Market Calendar tracks all CPI release dates with estimates and actual data.",
        },
      },
      {
        "@type": "Question",
        name: "What is the SpaceX IPO date?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SpaceX IPO is expected on June 12, 2026. Under the new NASDAQ Fast Entry Rule, SpaceX would be added to NASDAQ-100 within 15 trading days with a 3× weight multiplier, forcing QQQ ETF to buy $50B+ in shares.",
        },
      },
      {
        "@type": "Question",
        name: "When do AAPL, NVDA, MSFT earnings come out?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Apple (AAPL), NVIDIA (NVDA), and Microsoft (MSFT) report earnings quarterly. The US Market Calendar provides the full S&P 500 and NASDAQ-100 earnings calendar with EPS estimates and actual results.",
        },
      },
      {
        "@type": "Question",
        name: "What is the NASDAQ Fast Entry Rule?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Starting May 1, 2026, companies ranked top-40 in NASDAQ-100 by market cap can be added within 15 trading days of their IPO with a 3× weight multiplier. SpaceX ($1.75T), Anthropic ($900B), and OpenAI ($1T) all qualify, forcing massive ETF buying.",
        },
      },
    ],
  };
}

/**
 * 단일 @graph JSON-LD — page.tsx에서 하나의 <script type="application/ld+json">으로 출력
 */
export function allSchemas(upcomingEvents: UpcomingEvent[] = []) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      websiteSchema(),
      webApplicationSchema(),
      financialServiceSchema(),
      datasetSchema(),
      faqSchema(),
      ...eventSchemas(upcomingEvents),
    ],
  };
}

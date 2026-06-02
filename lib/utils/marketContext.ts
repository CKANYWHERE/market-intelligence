/**
 * 경제지표 및 이벤트 카테고리별 시장 맥락 설명 (정적 딕셔너리)
 * AI 없이 하드코딩 — 내용이 변하지 않는 기본 개념
 */

export interface IndicatorContext {
  what: string;    // 무엇을 측정하는가
  why: string;     // 왜 시장에 중요한가
  signal: string;  // 수치 해석 가이드
}

export const INDICATOR_CONTEXT: Record<string, IndicatorContext> = {
  CPIAUCSL: {
    what: 'Consumer Price Index (CPI)',
    why: 'Measures average price change for goods & services paid by urban consumers. The most widely-watched inflation gauge.',
    signal: 'Higher than expected → Fed keeps rates high → pressure on growth stocks. Lower than expected → rate cut expectations rise → positive for equities.',
  },
  CPILFESL: {
    what: 'Core CPI (ex. Food & Energy)',
    why: 'CPI excluding volatile food & energy prices. Fed watches this for a cleaner read on underlying inflation trends.',
    signal: 'Sticky core inflation delays rate cuts. A declining trend is the clearest green light for Fed dovish pivot.',
  },
  PPIACO: {
    what: 'Producer Price Index (PPI)',
    why: 'Measures price changes from the seller\'s perspective — upstream of consumers. Often a leading indicator of CPI by 1–2 months.',
    signal: 'Rising PPI = inflationary pipeline building. Falling PPI = pricing pressure easing, may lead to lower CPI ahead.',
  },
  PCEPI: {
    what: 'Personal Consumption Expenditures (PCE)',
    why: 'Broader inflation measure covering all consumer spending, including services. Fed officially targets PCE at 2%.',
    signal: 'The Fed\'s preferred inflation gauge alongside Core PCE. Consistently above 2% keeps the Fed hawkish.',
  },
  PCEPILFE: {
    what: 'Core PCE (ex. Food & Energy)',
    why: 'The Fed\'s primary inflation target is 2% Core PCE. This single number most directly drives rate decisions.',
    signal: 'Above 2%: rate cuts unlikely. Near or below 2%: Fed has room to cut. Markets price rate probabilities directly off this.',
  },
  PAYEMS: {
    what: 'Nonfarm Payrolls (NFP)',
    why: 'Monthly count of new jobs added (excluding farm workers). Reflects the health of the labor market and consumer spending power.',
    signal: 'Stronger than expected: economy healthy but delays rate cuts → short-term negative for rate-sensitive stocks. Weaker: recession fears or rate cut expectations rise.',
  },
  UNRATE: {
    what: 'Unemployment Rate',
    why: '% of the labor force actively seeking work. A key component of the Fed\'s dual mandate (max employment + price stability).',
    signal: 'Rising unemployment → Fed has cover to cut rates → positive for stocks. Very low unemployment → wage inflation risk → hawkish Fed.',
  },
  GDPC1: {
    what: 'Real GDP (Inflation-Adjusted)',
    why: 'Total economic output adjusted for inflation. Two consecutive negative quarters = technical recession.',
    signal: 'Strong GDP beat: economy resilient, fewer rate cut expectations. GDP miss or contraction: recession fears rise, risk-off sentiment.',
  },
  JTSJOL: {
    what: 'JOLTS Job Openings',
    why: 'Number of unfilled job positions. Measures labor demand beyond just hiring — a leading indicator of future payrolls.',
    signal: 'High openings → tight labor market → wage pressure → Fed stays hawkish. Declining openings → labor market cooling → Fed more comfortable cutting.',
  },
  ICSA: {
    what: 'Initial Jobless Claims (Weekly)',
    why: 'New unemployment insurance filings each week. The most frequent (weekly) labor market data point.',
    signal: 'Rising claims = labor market deteriorating → dovish Fed pivot signal. Low claims = labor market tight → Fed less urgent to cut.',
  },
  RSXFS: {
    what: 'Retail Sales (Ex. Auto)',
    why: 'Monthly consumer spending on retail goods. Consumer spending drives ~70% of US GDP — critical economic health gauge.',
    signal: 'Beat: consumer resilient, economy strong. Miss: spending softening → recession risk rising or inflation cooling faster.',
  },
  DGORDER: {
    what: 'Durable Goods Orders',
    why: 'Orders for manufactured goods lasting 3+ years (aircraft, machinery, cars). A leading indicator of business investment intentions.',
    signal: 'Strong orders: businesses investing in growth. Weak orders: capex pullback, economic slowdown signal.',
  },
  MICH: {
    what: 'UMich Consumer Sentiment',
    why: 'University of Michigan survey of consumer confidence in economic conditions. Forward-looking — consumers spend less when pessimistic.',
    signal: 'Falling sentiment → lower spending ahead → slower growth. Rising sentiment → consumption likely to stay strong.',
  },
};

// ── 이벤트 카테고리별 시장 의미 ────────────────────────────────

export interface CategoryContext {
  headline: string;
  body: string;
  bullish: string;  // 강세 조건
  bearish: string;  // 약세 조건
}

export const CATEGORY_CONTEXT: Record<string, CategoryContext> = {
  monetary_policy: {
    headline: 'Fed decisions set the price of money',
    body: 'Interest rate changes by the Federal Reserve directly affect borrowing costs for companies and consumers. Higher rates compress stock valuations (especially growth/tech); lower rates boost them.',
    bullish: 'Rate cut or dovish language → lower discount rates → higher stock valuations',
    bearish: 'Rate hike or hawkish surprise → higher discount rates → pressure on equities',
  },
  inflation: {
    headline: 'Inflation drives Fed policy expectations',
    body: 'CPI, PCE, and PPI data determine whether the Fed raises, holds, or cuts rates. Markets reprice rate cut odds the moment these numbers hit.',
    bullish: 'Below-estimate print → rate cuts moving closer → risk-on rally',
    bearish: 'Above-estimate print → Fed stays restrictive longer → growth stocks under pressure',
  },
  employment: {
    headline: 'Jobs data reflects economic momentum',
    body: 'Strong labor markets mean consumers keep spending, but also that the Fed has less reason to cut rates. Weak data raises recession fears but can accelerate rate cuts.',
    bullish: 'Weak jobs data in a rate-cut cycle → confirms Fed pivot → bond/equity rally',
    bearish: 'Blowout jobs print during inflation fight → rate cuts delayed → yields rise',
  },
  growth: {
    headline: 'GDP & PMI confirm the economic cycle',
    body: 'These indicators validate or challenge the Fed\'s economic outlook. GDP contractions and PMI below 50 signal recession risk; strong prints support the soft-landing narrative.',
    bullish: 'GDP beat + ISM above 50 → soft landing confirmed → broad market positive',
    bearish: 'GDP miss or ISM below 50 → recession risk rises → defensive rotation',
  },
  earnings: {
    headline: 'Earnings directly determine stock prices',
    body: 'EPS and revenue vs. Wall Street estimates drive immediate stock reactions. NASDAQ-100 megacaps can move index ETFs like QQQ by 1-3% on their earnings alone.',
    bullish: 'Beat on EPS + revenue + raised guidance → stock up 5–15%',
    bearish: 'Miss on revenue or lowered guidance → stock down 5–20%, drags sector',
  },
  ipo: {
    headline: 'Large IPOs create forced ETF demand',
    body: 'Under the NASDAQ Fast Entry Rule (May 2026), top-40 market cap companies are added to NASDAQ-100 within 15 trading days of IPO with a 3× weight multiplier — forcing QQQ and passive ETFs to buy billions.',
    bullish: 'IPO priced + NASDAQ Fast Entry → $50B+ in forced passive buying → price support',
    bearish: 'IPO withdrawn or delayed → sentiment signal for market risk appetite',
  },
  breaking: {
    headline: 'Unscheduled market-moving events',
    body: 'Breaking news — from emergency Fed meetings to geopolitical shocks — can trigger immediate, sharp market moves that bypass normal analysis frameworks.',
    bullish: 'Surprise stimulus, trade deal, or resolution of risk event',
    bearish: 'Emergency Fed action, tariff escalation, geopolitical escalation',
  },
};

// ── 이벤트 제목 키워드 → series_id 매핑 (Detail Panel용) ────────

export function getSeriesIdFromTitle(title: string): string | null {
  const t = title.toLowerCase();
  if (/\bcpi\b|consumer price index/.test(t) && !/core/.test(t)) return 'CPIAUCSL';
  if (/core cpi/.test(t)) return 'CPILFESL';
  if (/\bppi\b|producer price/.test(t)) return 'PPIACO';
  if (/core pce/.test(t)) return 'PCEPILFE';
  if (/\bpce\b|personal consumption/.test(t)) return 'PCEPI';
  if (/nonfarm|non-farm|\bnfp\b/.test(t)) return 'PAYEMS';
  if (/unemployment rate/.test(t)) return 'UNRATE';
  if (/\bgdp\b/.test(t)) return 'GDPC1';
  if (/jolts|job opening/.test(t)) return 'JTSJOL';
  if (/jobless claim|initial claim/.test(t)) return 'ICSA';
  if (/retail sale/.test(t)) return 'RSXFS';
  if (/durable good/.test(t)) return 'DGORDER';
  if (/michigan|consumer sentiment/.test(t)) return 'MICH';
  return null;
}

/**
 * Event-specific descriptive content for SEO
 * Used on /events/[slug] pages to add meaningful text content and FAQ structured data
 */

export interface EventContent {
  what: string;
  whyMatters: string;
  watchFor: string[];
  faq: Array<{ q: string; a: string }>;
}

// ── Cross-link keyword map ────────────────────────────────────────
// Defines which other economic event titles to surface as cross-links
export const CROSS_LINK_KEYWORDS: Record<string, string[]> = {
  fomc:       ['Consumer Price Index', 'PCE', 'Nonfarm Payrolls'],
  rate:       ['Consumer Price Index', 'PCE', 'Nonfarm Payrolls'],
  cpi:        ['Federal', 'PCE', 'Nonfarm Payrolls'],
  'consumer price': ['Federal', 'PCE', 'Nonfarm Payrolls'],
  pce:        ['Consumer Price Index', 'Federal', 'Nonfarm Payrolls'],
  'personal consumption': ['Consumer Price Index', 'Federal', 'Nonfarm Payrolls'],
  nonfarm:    ['Federal', 'Consumer Price Index', 'JOLTS'],
  payroll:    ['Federal', 'Consumer Price Index', 'JOLTS'],
  gdp:        ['Retail Sales', 'ISM', 'Consumer Price'],
  ism:        ['GDP', 'Retail Sales', 'Nonfarm'],
  retail:     ['GDP', 'Consumer Confidence', 'ISM'],
  jolts:      ['Nonfarm Payrolls', 'Initial Jobless', 'Federal'],
  ppi:        ['Consumer Price Index', 'PCE', 'Federal'],
  'producer price': ['Consumer Price Index', 'PCE', 'Federal'],
  unemployment: ['Nonfarm Payrolls', 'JOLTS', 'Federal'],
  jobless:    ['Nonfarm Payrolls', 'Unemployment', 'JOLTS'],
  adp:        ['Nonfarm Payrolls', 'JOLTS', 'Federal'],
};

// ── Economic event descriptions ───────────────────────────────────

function fomc(): EventContent {
  return {
    what: 'The Federal Open Market Committee (FOMC) meets 8 times per year to set the federal funds rate target range — the benchmark interest rate that influences borrowing costs across the entire US economy. The decision is announced at 2:00 PM ET, followed by a press conference with the Fed Chair at 2:30 PM ET.',
    whyMatters: 'Rate decisions directly impact equity valuations through the discount rate applied to future earnings. Higher rates compress P/E multiples on growth stocks (QQQ heavy), while rate cuts tend to lift equities broadly. The statement language and dot plot — released at the March, June, September, and December meetings — often drive more volatility than the rate number itself.',
    watchFor: [
      'Rate decision vs. market expectations (CME FedWatch futures pricing)',
      'Statement language: "data dependent," "higher for longer," or any dovish pivot signals',
      'Updated dot plot — shifts in median 2026/2027 rate projections move markets',
      'Powell\'s tone in the press conference Q&A session',
      'QQQ and 2-year Treasury yield reaction in the first 30 minutes post-announcement',
    ],
    faq: [
      { q: 'How many times does the FOMC meet per year?', a: 'The FOMC meets 8 times per year, approximately every 6 weeks. Four of those meetings (March, June, September, December) also include updated economic projections and the dot plot.' },
      { q: 'What time is the FOMC rate decision announced?', a: 'The FOMC rate decision statement is released at 2:00 PM Eastern Time. The Fed Chair holds a press conference at 2:30 PM ET.' },
      { q: 'How does the Fed rate decision affect QQQ and SPY?', a: 'Rate hikes generally pressure growth stocks (QQQ) by raising the discount rate on future earnings, while rate cuts tend to boost equities. SPY is less rate-sensitive than QQQ due to its higher weighting in value and dividend-paying sectors.' },
    ],
  };
}

function cpi(): EventContent {
  return {
    what: 'The Consumer Price Index (CPI) measures the average change in prices paid by urban consumers for a representative basket of goods and services including food, housing, medical care, and transportation. Core CPI excludes volatile food and energy prices. It is released monthly by the Bureau of Labor Statistics (BLS), typically around the 10th–15th of the month.',
    whyMatters: 'CPI is one of the most market-moving economic releases. A surprise high print signals persistent inflation, raising the odds of more Fed rate hikes and pressuring growth stocks. A cooler-than-expected number can trigger a strong rally in QQQ and bonds. The shelter/housing component — the largest single weight in CPI — has been a key driver of elevated readings.',
    watchFor: [
      'Month-over-month change vs. consensus estimate (±0.1% can move markets significantly)',
      'Core CPI (ex food & energy) — more closely watched by the Fed',
      'Shelter/OER (Owners\' Equivalent Rent) component — largest CPI weight at ~35%',
      'Core services ex-shelter ("supercore") — the Fed\'s preferred inflation gauge within CPI',
      'QQQ and 10-year Treasury reaction in the first hour post-release',
    ],
    faq: [
      { q: 'When is CPI released each month?', a: 'CPI is released by the Bureau of Labor Statistics monthly, typically 2–3 weeks after the reference month ends, usually between the 10th and 15th of the month at 8:30 AM ET.' },
      { q: 'What is the difference between CPI and Core CPI?', a: 'Core CPI excludes food and energy prices, which are volatile and seasonal. The Fed focuses more on Core CPI as it better reflects underlying inflation trends.' },
      { q: 'How does a high CPI print affect stocks?', a: 'A surprise high CPI print often triggers a sell-off in growth stocks (QQQ) as it raises expectations for more Fed rate hikes. Bond yields rise and tech valuations compress. A cool CPI print typically sparks a relief rally.' },
    ],
  };
}

function pce(): EventContent {
  return {
    what: 'The Personal Consumption Expenditures (PCE) price index is the Federal Reserve\'s preferred inflation gauge. Unlike CPI, PCE adjusts for consumer substitution behavior and covers a broader range of expenditures including employer-sponsored healthcare. Core PCE excludes food and energy. It is released monthly by the Bureau of Economic Analysis (BEA) alongside the Personal Income and Spending report.',
    whyMatters: 'The Fed explicitly targets 2% annual PCE inflation. Because PCE is the Fed\'s chosen benchmark, it directly influences rate decisions. Core PCE tends to run slightly below Core CPI due to methodological differences. Sustained PCE above 2.5% keeps the Fed hawkish; readings near 2% increase the probability of rate cuts.',
    watchFor: [
      'Core PCE month-over-month vs. 2% annualized target',
      'Services PCE (excludes housing) — "supercore" watched closely by the Fed',
      'Personal Income and Spending data released alongside PCE',
      'Savings rate — high savings may indicate future consumer spending weakness',
      'How the reading compares to the most recent CPI for consistency',
    ],
    faq: [
      { q: 'Why does the Fed prefer PCE over CPI?', a: 'PCE adjusts for substitution effects (consumers switching to cheaper goods), covers a broader spending universe including employer-paid healthcare, and uses different weights. Historically, PCE runs 0.2–0.4% below CPI annually.' },
      { q: 'What time is PCE released?', a: 'PCE is released at 8:30 AM Eastern Time, typically on the last Friday of the month or the first trading day of the following month.' },
      { q: 'What is the Fed\'s PCE inflation target?', a: 'The Federal Reserve targets 2% annual inflation as measured by the Core PCE price index. Readings significantly above this target keep the Fed in a rate-hiking or "higher for longer" stance.' },
    ],
  };
}

function ppi(): EventContent {
  return {
    what: 'The Producer Price Index (PPI) measures the average change in prices received by domestic producers for their output — essentially inflation from the seller\'s perspective. It covers manufacturing, mining, agriculture, and services. Core PPI excludes food, energy, and trade services. PPI is released monthly by the Bureau of Labor Statistics, typically 1–2 weeks before CPI.',
    whyMatters: 'PPI is a leading indicator of consumer inflation. Rising producer costs are often passed downstream to consumers, showing up in CPI weeks later. Services PPI — especially healthcare and portfolio management fees — feeds directly into Core PCE, the Fed\'s preferred inflation gauge. Investors watch PPI for early signals on future CPI and PCE trends.',
    watchFor: [
      'Month-over-month Core PPI vs. consensus estimate',
      'Healthcare services and portfolio management components (feed into PCE)',
      'Trade services PPI — a measure of wholesale margins',
      'Trend: is PPI running above or below CPI? (convergence = potential CPI relief)',
      'Food and energy PPI for commodity inflation signals',
    ],
    faq: [
      { q: 'What is the difference between PPI and CPI?', a: 'PPI measures prices at the producer/wholesale level before goods reach consumers, while CPI measures prices consumers actually pay. PPI is generally considered a leading indicator of future CPI changes.' },
      { q: 'Why does PPI matter for the Fed?', a: 'Certain PPI components — especially healthcare services and portfolio management — are used directly in calculating PCE, the Fed\'s preferred inflation measure. Rising services PPI can signal future PCE pressure.' },
    ],
  };
}

function nfp(): EventContent {
  return {
    what: 'The Nonfarm Payrolls (NFP) report — the US jobs report — is released by the Bureau of Labor Statistics on the first Friday of each month at 8:30 AM ET. It shows the net change in employment across all non-farm sectors, covering approximately 80% of US workers who contribute to GDP. It also includes the unemployment rate, average hourly earnings, and labor force participation rate.',
    whyMatters: 'Full employment is one of the Fed\'s two mandates (alongside price stability). A strong jobs report can keep the Fed hawkish — maintaining or raising rates. A weak number (below ~150K) can accelerate rate cut expectations. Crucially, average hourly earnings matter as much as payrolls: strong wage growth signals wage-push inflation, keeping the Fed tight even if payrolls disappoint.',
    watchFor: [
      'Payrolls vs. consensus estimate (100-200K range is "healthy"; below 100K signals slowdown)',
      'Unemployment rate vs. prior month (watch for Sahm Rule trigger: +0.5% from 12-month low)',
      'Average hourly earnings month-over-month (above 0.3% MoM = wage inflation concern)',
      'Prior two months\' revisions — often significantly revised and market-moving',
      'Labor force participation rate — rising participation softens unemployment rate signal',
    ],
    faq: [
      { q: 'When is the jobs report released?', a: 'The Nonfarm Payrolls report is released on the first Friday of every month at 8:30 AM Eastern Time by the Bureau of Labor Statistics.' },
      { q: 'What is the Sahm Rule?', a: 'The Sahm Rule is a recession indicator: if the 3-month average unemployment rate rises 0.5 percentage points or more above its 12-month low, a recession has likely already begun. Developed by former Fed economist Claudia Sahm.' },
      { q: 'How many jobs are needed per month to keep unemployment stable?', a: 'Economists estimate approximately 100,000–150,000 jobs per month are needed to absorb new labor force entrants and keep the unemployment rate roughly stable. Numbers consistently below this signal deteriorating labor market conditions.' },
    ],
  };
}

function unemployment(): EventContent {
  return {
    what: 'The unemployment rate, released alongside the monthly Nonfarm Payrolls report by the BLS, measures the percentage of the civilian labor force actively seeking but unable to find work (U-3 measure). The broader U-6 rate also counts underemployed workers and those marginally attached to the labor force.',
    whyMatters: 'Unemployment is one of the Fed\'s two mandates. The Fed considers a rate around 4–4.5% as roughly consistent with "full employment." A sharply rising unemployment rate can trigger rapid rate cuts, while a very low rate (below 3.5%) may signal overheating and upward wage pressure.',
    watchFor: [
      'U-3 headline rate vs. prior month and consensus estimate',
      'U-6 underemployment rate (broader labor slack measure)',
      'Labor force participation rate (LFPR) — declining LFPR masks true weakness',
      'Sahm Rule status: has the 3-month average risen 0.5%+ above its 12-month low?',
      'Average hourly earnings growth alongside the rate reading',
    ],
    faq: [
      { q: 'What is the difference between U-3 and U-6 unemployment?', a: 'U-3 is the official unemployment rate, counting only those actively job-seeking. U-6 (the "real" unemployment rate) adds part-time workers who want full-time jobs and marginally attached workers, typically running 3–4 percentage points higher than U-3.' },
    ],
  };
}

function jolts(): EventContent {
  return {
    what: 'The Job Openings and Labor Turnover Survey (JOLTS) tracks job openings, hires, quits, layoffs, and separations across the US economy. Released monthly by the BLS with a one-month lag, JOLTS provides a detailed look at labor demand and worker confidence.',
    whyMatters: 'JOLTS gained prominence when Fed Chair Powell cited the job openings-to-unemployed ratio as a key metric for labor market tightness. At the 2022 peak, there were 2 job openings for every unemployed worker — a historically tight ratio that justified aggressive rate hikes. The quits rate signals worker confidence: high quits = workers confident they can find better jobs (upward wage pressure).',
    watchFor: [
      'Job openings number vs. consensus and prior month',
      'Job openings-to-unemployed ratio (above 1.0 = tight labor market)',
      'Quits rate — the "Great Resignation" signal; high quits fuel wage inflation',
      'Layoffs and discharges — a rising layoff rate precedes unemployment increases',
      'How the trend compares to pre-pandemic 2019 baselines',
    ],
    faq: [
      { q: 'Why does the Fed watch JOLTS so closely?', a: 'JOLTS provides the clearest picture of labor demand vs. supply. The ratio of job openings to unemployed workers directly informs how much slack exists in the labor market — a key input for Fed rate decisions.' },
      { q: 'What is a normal level for job openings?', a: 'Pre-pandemic (2019), US job openings ranged from 7–7.5 million. The post-pandemic peak hit ~12 million in early 2022. Readings returning toward the 7–8 million range suggest labor market normalization.' },
    ],
  };
}

function adp(): EventContent {
  return {
    what: 'The ADP National Employment Report is a private estimate of US nonfarm private-sector employment, produced by ADP in partnership with the Stanford Digital Economy Lab. Released on the Wednesday before the official BLS jobs report at 8:15 AM ET, it covers approximately 26 million workers on ADP\'s payroll platform.',
    whyMatters: 'ADP serves as an early read on the upcoming official NFP report. While its predictive accuracy is debated (correlation with BLS has varied), large deviations from consensus set market expectations for Friday\'s jobs report. The ADP report also includes pay growth data, providing a real-time wage inflation signal.',
    watchFor: [
      'ADP number vs. consensus estimate (directional signal for Friday\'s NFP)',
      'Pay growth data: median change in annual pay for job-stayers vs. job-changers',
      'Industry breakdown: manufacturing, leisure & hospitality, professional services',
      'How ADP compares to last month\'s actual NFP for directional consistency',
    ],
    faq: [
      { q: 'How accurate is ADP at predicting NFP?', a: 'ADP\'s correlation with the official BLS jobs number has varied significantly — some months track closely, others diverge by 100,000+ jobs. Markets treat it as a directional indicator rather than a precise predictor.' },
    ],
  };
}

function gdp(): EventContent {
  return {
    what: 'Gross Domestic Product (GDP) measures the total monetary value of all goods and services produced in the US economy. The Bureau of Economic Analysis (BEA) releases three estimates per quarter: Advance (first estimate, 3–4 weeks after quarter-end), Preliminary (revision), and Final. The Advance GDP release is the most market-moving.',
    whyMatters: 'GDP is the broadest measure of economic health. Two consecutive quarters of negative GDP growth define a technical recession — a significant threshold for corporate earnings forecasts, credit markets, and Fed policy. Consumer spending (roughly 70% of GDP) and business investment are the key sub-components to watch.',
    watchFor: [
      'Advance GDP annualized rate vs. consensus estimate',
      'Personal Consumption Expenditures component (70% of GDP)',
      'Business fixed investment — signals corporate capex confidence',
      'Government spending contribution',
      'GDI (Gross Domestic Income) — often diverges from GDP and seen as equally valid',
      'GDP deflator for embedded inflation signal',
    ],
    faq: [
      { q: 'What defines a US recession?', a: 'Technically, a recession is defined by the NBER Business Cycle Dating Committee based on multiple indicators. Colloquially, two consecutive quarters of negative GDP growth are called a "technical recession," though the NBER\'s definition is broader.' },
      { q: 'What time is GDP released?', a: 'GDP releases (Advance, Preliminary, and Final) are published at 8:30 AM Eastern Time by the Bureau of Economic Analysis.' },
    ],
  };
}

function retailSales(): EventContent {
  return {
    what: 'The US Retail Sales report, released monthly by the Census Bureau at 8:30 AM ET, measures total receipts at stores selling merchandise and food and beverage services. It covers approximately 30% of total consumer spending. The "Core Retail Sales" (ex-autos) and the "Control Group" (ex-autos, gas, building materials, food services) are watched most closely, as the Control Group feeds directly into GDP calculations.',
    whyMatters: 'Consumer spending drives ~70% of US GDP. Strong retail sales support economic growth and corporate earnings — particularly for consumer discretionary stocks (Amazon, Target, Walmart). Weak retail sales can signal consumer fatigue or recession risk, potentially pushing the Fed toward rate cuts.',
    watchFor: [
      'Headline vs. Core Retail Sales (ex-auto) vs. consensus',
      'Control Group (ex-autos, gas, building materials, food services) — direct GDP input',
      'Online vs. in-store split (Amazon effect)',
      'Gasoline station sales — volatile and can distort headline if oil prices spike',
      'Prior month revisions — often significant and affect GDP tracking estimates',
    ],
    faq: [
      { q: 'Why does the Control Group matter for GDP?', a: 'The retail sales Control Group (excluding autos, gas, building materials, and food services) maps most directly to the consumer spending component of GDP. It\'s used by economists to nowcast Q GDP before the official BEA release.' },
    ],
  };
}

function ism(): EventContent {
  return {
    what: 'The ISM (Institute for Supply Management) PMI is a monthly survey of purchasing managers at US manufacturing and services companies. Readings above 50 indicate expansion; below 50 signals contraction. The Manufacturing PMI is released on the first business day of the month; the Services PMI on the third business day. Both are released at 10:00 AM ET.',
    whyMatters: 'PMI is a leading economic indicator — purchasing managers place orders ahead of production, so their sentiment predicts future activity. The Manufacturing PMI has been in contraction territory for much of 2022–2024 as goods demand normalized. Services PMI (covering ~70%+ of the economy) is more important for broad economic health. The sub-indexes — New Orders, Employment, Prices Paid — each carry significant signal.',
    watchFor: [
      '50 threshold: above = expansion, below = contraction',
      'New Orders sub-index (leading indicator of future activity)',
      'Prices Paid sub-index (inflation signal for the Fed)',
      'Employment sub-index (relevant for Friday\'s jobs report)',
      'Manufacturing vs. Services PMI divergence (goods vs. services economy)',
    ],
    faq: [
      { q: 'What does a PMI below 50 mean?', a: 'A PMI reading below 50 indicates that more purchasing managers reported business conditions are contracting than expanding. Sustained PMI below 50 historically precedes slower GDP growth and potential recession.' },
      { q: 'What is the difference between ISM Manufacturing and ISM Services PMI?', a: 'ISM Manufacturing covers goods-producing industries (roughly 10% of US employment but highly cyclical). ISM Services covers the rest of the economy including finance, healthcare, tech, and retail — more closely tied to GDP and consumer activity.' },
    ],
  };
}

function consumerConfidence(): EventContent {
  return {
    what: 'Consumer confidence surveys measure how optimistic consumers are about their personal financial situation and the broader economy. The Conference Board Consumer Confidence Index and the University of Michigan Consumer Sentiment Index are the two primary US measures, each capturing different aspects of consumer psychology.',
    whyMatters: 'Consumer confidence is a leading indicator of future consumer spending, which drives ~70% of US GDP. Sharp drops in confidence historically precede spending pullbacks and recessions. The Fed watches confidence data as a signal of economic resilience or vulnerability.',
    watchFor: [
      'Present Situation vs. Expectations components (gap = economic uncertainty)',
      'Labor market differential (jobs "plentiful" vs. "hard to get")',
      '1-year and 5-year inflation expectations in the Michigan survey',
      'Trend: 3-month moving average vs. prior cycle levels',
    ],
    faq: [
      { q: 'What is the difference between Conference Board and Michigan consumer confidence?', a: 'The Conference Board index emphasizes labor market conditions and is released monthly. The University of Michigan survey focuses on financial conditions and inflation expectations and has a preliminary and final release each month.' },
    ],
  };
}

// ── Earnings descriptions by symbol ──────────────────────────────

const EARNINGS_DESCRIPTIONS: Record<string, { about: string; context: string }> = {
  AAPL: {
    about: 'Apple Inc. (AAPL) is the world\'s most valuable company by market cap, generating revenue across iPhone, Mac, iPad, Services (App Store, iCloud, Apple TV+), and Wearables. Services is Apple\'s fastest-growing and highest-margin segment, now representing over 25% of total revenue.',
    context: 'Apple typically reports after market close. Key metrics: iPhone revenue (largest segment), Services growth rate, gross margin expansion, and shareholder return guidance. Apple\'s results heavily influence QQQ given its ~9% weighting.',
  },
  MSFT: {
    about: 'Microsoft (MSFT) operates across three segments: Productivity and Business Processes (Office 365, LinkedIn), Intelligent Cloud (Azure), and More Personal Computing (Windows, Xbox). Azure cloud revenue growth is the primary valuation driver, with AI services (Copilot, OpenAI partnership) increasingly material.',
    context: 'Microsoft reports after market close. Key metrics: Azure revenue growth rate (critical vs. AWS/Google Cloud), Office 365 commercial seat growth, operating margins, and AI monetization progress through Copilot.',
  },
  NVDA: {
    about: 'NVIDIA (NVDA) designs GPUs and system-on-chip units used in gaming, data centers, automotive, and AI/ML workloads. The Data Center segment — driven by demand for H100/H200/Blackwell AI training chips — now accounts for over 85% of revenue, making NVDA the primary infrastructure beneficiary of the generative AI boom.',
    context: 'NVIDIA typically reports after market close. Key metrics: Data Center revenue vs. estimate (dominant driver), gross margin trend, Blackwell architecture ramp, and forward guidance. NVDA\'s results move the entire semiconductor sector.',
  },
  GOOGL: {
    about: 'Alphabet (GOOGL) generates ~75% of revenue from Google Search and advertising. Google Cloud is the third-largest cloud provider and a key growth driver. YouTube advertising and subscription services (YouTube Premium, Workspace) are expanding segments. AI integration via Gemini is central to the company\'s competitive strategy.',
    context: 'Alphabet reports after market close. Key metrics: Search revenue growth, Google Cloud growth rate and margin, YouTube advertising revenue, and AI monetization. Regulatory risks from antitrust proceedings affect valuation.',
  },
  META: {
    about: 'Meta Platforms (META) owns Facebook, Instagram, WhatsApp, and Threads. Advertising revenue across these platforms represents nearly all of Meta\'s revenue, with AI-driven ad targeting improvements materially boosting monetization. Reality Labs (Quest VR headsets, metaverse R&D) operates at a significant annual operating loss.',
    context: 'Meta reports after market close. Key metrics: Daily Active People (DAP), average revenue per user (ARPU), advertising revenue growth, AI infrastructure capex guidance, and Reality Labs operating loss trajectory.',
  },
  AMZN: {
    about: 'Amazon (AMZN) operates across three main segments: North America retail, International retail, and Amazon Web Services (AWS). AWS generates the majority of Amazon\'s operating profit despite representing a smaller share of revenue. Advertising is Amazon\'s fastest-growing high-margin segment.',
    context: 'Amazon reports after market close. Key metrics: AWS revenue growth rate vs. Azure/GCP, advertising revenue, retail operating margin improvement, and free cash flow. AWS margin expansion is the primary stock catalyst.',
  },
  TSLA: {
    about: 'Tesla (TSLA) designs and manufactures electric vehicles, energy storage systems, and solar products. Tesla\'s automotive gross margin is closely watched as a measure of manufacturing efficiency and pricing power against increased EV competition. Full Self-Driving (FSD) software and energy storage are emerging high-margin businesses.',
    context: 'Tesla reports after market close. Key metrics: Automotive gross margin (ex-credits), deliveries vs. estimate, energy storage deployment, FSD revenue recognition, and any production or demand guidance for the following quarter.',
  },
  AVGO: {
    about: 'Broadcom (AVGO) is a leading semiconductor and infrastructure software company. It designs custom AI accelerators (XPUs) for hyperscalers including Google and Meta, networking chips for AI data centers, and enterprise software through VMware (acquired 2023). AI-related revenue is growing rapidly.',
    context: 'Broadcom reports after market close. Key metrics: AI semiconductor revenue growth, VMware ARR and margin improvement, networking revenue trends, and custom XPU design win pipeline.',
  },
  AMD: {
    about: 'Advanced Micro Devices (AMD) competes with NVIDIA in AI/ML GPUs (MI300X/MI400 series), Intel in x86 CPUs (EPYC for data centers, Ryzen for consumers), and offers FPGAs through the Xilinx acquisition. AMD is the primary challenger to NVIDIA\'s AI GPU dominance.',
    context: 'AMD reports after market close. Key metrics: Data Center GPU revenue and MI300X ramp, EPYC server CPU market share gains, client PC CPU revenue, and management\'s AI GPU demand commentary vs. NVIDIA.',
  },
  NFLX: {
    about: 'Netflix (NFLX) is the world\'s largest streaming platform with over 300 million subscribers. Revenue growth now comes from paid sharing enforcement, the ad-supported tier scaling, and gradual price increases. Content investment remains the key moat and primary cost driver.',
    context: 'Netflix reports after market close. Key metrics: Global subscriber net adds, average revenue per membership, ad-supported tier penetration, and operating margin guidance. Netflix no longer reports specific subscriber targets quarterly.',
  },
  CRM: {
    about: 'Salesforce (CRM) is the world\'s largest CRM software company, with products covering Sales Cloud, Service Cloud, Marketing Cloud, and the Agentforce AI platform. Recurring subscription revenue and remaining performance obligation (RPO) are the primary growth metrics.',
    context: 'Salesforce reports after market close. Key metrics: Revenue growth, remaining performance obligation (RPO) as a forward revenue indicator, operating margin expansion (activist investor pressure), and Agentforce AI adoption.',
  },
  PANW: {
    about: 'Palo Alto Networks (PANW) is a leading cybersecurity platform company offering network security, cloud security (Prisma Cloud), and AI-powered security operations (Cortex). The company has been consolidating point solutions into a unified platform to drive vendor consolidation.',
    context: 'PANW reports after market close. Key metrics: Next-generation security ARR growth, total RPO, platformization progress (customers adopting multiple products), and free cash flow margin.',
  },
};

// ── IPO descriptions ──────────────────────────────────────────────

const IPO_DESCRIPTIONS: Record<string, { about: string; context: string }> = {
  SpaceX: {
    about: 'SpaceX, founded by Elon Musk, is the world\'s leading private launch provider and operator of the Starlink satellite internet constellation. With over 7,000 Starlink satellites in orbit and growing enterprise/government contracts, SpaceX is valued at approximately $350 billion as of 2026.',
    context: 'Under the NASDAQ Fast Entry Rule enacted May 1, 2026, SpaceX would qualify for NASDAQ-100 inclusion within 15 trading days of IPO with a 3× initial weight multiplier — forcing QQQ, QQQM, and other passive funds to purchase an estimated $50B+ in shares. This mandatory ETF buying could significantly impact QQQ\'s composition.',
  },
  Anthropic: {
    about: 'Anthropic is an AI safety company and the developer of the Claude family of large language models. Founded in 2021 by former OpenAI researchers including Dario and Daniela Amodei, Anthropic has raised over $10 billion from Google, Amazon, and others, and is valued at approximately $61 billion.',
    context: 'Anthropic\'s IPO is expected in late 2026. As an AI safety-focused company with enterprise API revenue from Claude models, Anthropic would likely qualify for NASDAQ Fast Entry Rule inclusion, adding significant ETF buying pressure to QQQ.',
  },
  OpenAI: {
    about: 'OpenAI developed ChatGPT and the GPT-4/o series of large language models, which have become the most widely used AI tools globally. With over 300 million weekly users and growing enterprise revenue, OpenAI is valued at approximately $300 billion as of 2026.',
    context: 'OpenAI\'s IPO is anticipated in 2026 Q4. Its scale and valuation would make it an immediate top-40 NASDAQ-100 candidate, triggering the Fast Entry Rule. Passive ETF forced buying could be among the largest in NASDAQ history given OpenAI\'s valuation.',
  },
};

// ── Main export ───────────────────────────────────────────────────

export function getEventContent(
  type: 'economic' | 'earnings' | 'ipo',
  category: string,
  title: string,
  symbol?: string,
  company?: string,
): EventContent | null {
  if (type === 'earnings') {
    const sym = symbol?.toUpperCase() ?? '';
    const desc = EARNINGS_DESCRIPTIONS[sym];
    if (!desc) return null;
    return {
      what: desc.about,
      whyMatters: desc.context,
      watchFor: ['EPS actual vs. consensus estimate', 'Forward guidance for next quarter', 'Operating margin trend', 'Management commentary on macro environment and demand'],
      faq: [
        { q: `When does ${sym} report earnings?`, a: `${company ?? sym} reports quarterly earnings. Check the date on this page for the exact report date. Results are typically released after market close.` },
        { q: `How do ${sym} earnings affect QQQ?`, a: `${company ?? sym} is a significant component of the NASDAQ-100 (QQQ). A strong earnings beat typically lifts QQQ, while a miss or weak guidance can drag the index lower.` },
      ],
    };
  }

  if (type === 'ipo') {
    const co = company ?? '';
    const desc = Object.entries(IPO_DESCRIPTIONS).find(([k]) => co.toLowerCase().includes(k.toLowerCase()));
    if (!desc) return null;
    return {
      what: desc[1].about,
      whyMatters: desc[1].context,
      watchFor: ['IPO price range and final offer price', 'Opening day trading volume and first-day return', 'Lock-up expiration date (typically 180 days post-IPO)', 'NASDAQ-100 Fast Entry Rule eligibility and timeline'],
      faq: [
        { q: `What is the ${co} IPO valuation?`, a: `Check the valuation listed on this page. Valuations for pre-IPO companies are based on the most recent private funding rounds.` },
        { q: 'What is the NASDAQ Fast Entry Rule?', a: 'Starting May 1, 2026, companies ranking in the top-40 NASDAQ-100 by market cap can be added within 15 trading days of their IPO with a 3× weight multiplier, forcing passive ETFs like QQQ to buy large positions immediately.' },
      ],
    };
  }

  // Economic events — match by title
  const t = title.toLowerCase();

  if (/fomc|federal open market|rate decision|federal funds/i.test(t)) return fomc();
  if (/\bcpi\b|consumer price index/i.test(t)) return cpi();
  if (/\bpce\b|personal consumption expenditure/i.test(t)) return pce();
  if (/\bppi\b|producer price index/i.test(t)) return ppi();
  if (/nonfarm payroll|nfp|jobs report/i.test(t)) return nfp();
  if (/unemployment rate/i.test(t)) return unemployment();
  if (/\bjolts\b|job opening/i.test(t)) return jolts();
  if (/\badp\b|adp employment|adp national/i.test(t)) return adp();
  if (/\bgdp\b|gross domestic product/i.test(t)) return gdp();
  if (/retail sales/i.test(t)) return retailSales();
  if (/\bism\b|purchasing managers|pmi/i.test(t)) return ism();
  if (/consumer confidence|consumer sentiment/i.test(t)) return consumerConfidence();

  return null;
}

/** Returns the cross-link keyword list for a given event title */
export function getCrossLinkKeywords(title: string): string[] {
  const t = title.toLowerCase();
  for (const [key, keywords] of Object.entries(CROSS_LINK_KEYWORDS)) {
    if (t.includes(key)) return keywords;
  }
  return [];
}

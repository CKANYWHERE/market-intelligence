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

// ── Housing indicators ────────────────────────────────────────────

function nahb(): EventContent {
  return {
    what: 'The NAHB/Wells Fargo Housing Market Index (HMI) is a monthly survey of home builders conducted by the National Association of Home Builders. It measures builder confidence in the market for newly built single-family homes on a scale of 0–100. Readings above 50 indicate more builders view conditions as good than poor. The index has three components: current sales conditions, expected sales over the next six months, and prospective buyer traffic.',
    whyMatters: 'Builder confidence is a leading indicator of future housing construction activity. When builders are optimistic, they break ground on more homes — which feeds into Housing Starts and GDP data weeks later. The index is sensitive to mortgage rates: sharp rate increases quickly dampen builder sentiment, while rate cuts can revive it. A sustained HMI below 50 signals a housing market contraction that can weigh on consumer wealth and construction employment.',
    watchFor: [
      'Headline index vs. 50 threshold and consensus estimate',
      'Prospective buyer traffic sub-index — earliest signal of demand shifts',
      'Regional breakdown: South (largest market) and West tend to be most rate-sensitive',
      'Trend vs. prior 3 months: is confidence recovering or deteriorating?',
      'Correlation with 30-year mortgage rates — HMI inversely tracks rate moves closely',
    ],
    faq: [
      { q: 'What is a good NAHB Housing Market Index reading?', a: 'Any reading above 50 indicates that more builders view sales conditions as good than poor. Readings in the 60s–70s reflect a healthy housing market. During the pandemic housing boom, HMI reached record highs above 80.' },
      { q: 'When is the NAHB Housing Market Index released?', a: 'The NAHB HMI is released on the third business day of each month at 10:00 AM Eastern Time, one day before the Housing Starts report.' },
    ],
  };
}

function housingStarts(): EventContent {
  return {
    what: 'The Housing Starts report, released monthly by the US Census Bureau and Department of Housing and Urban Development (HUD), measures the number of new residential construction projects begun during the month. It includes single-family homes and multi-unit buildings. Building Permits — also released in the same report — measure authorizations for new construction and serve as a leading indicator of future starts.',
    whyMatters: 'Residential construction directly contributes to GDP through investment in structures. Housing starts also drive employment in construction, real estate, and related industries. A sharp decline in starts can signal broader economic weakness. Building permits lead starts by 1–2 months, making them a valuable forward-looking gauge. Rising starts alongside falling mortgage rates confirm a housing recovery.',
    watchFor: [
      'Housing Starts MoM change vs. consensus estimate',
      'Building Permits (leading indicator, released simultaneously)',
      'Single-family vs. multi-family split — single-family drives consumer wealth effect',
      'Regional data: South and West account for the majority of US construction',
      'Trend vs. 1-million-unit threshold: below signals housing contraction',
    ],
    faq: [
      { q: 'What is the difference between Housing Starts and Building Permits?', a: 'Building Permits are authorizations issued by local governments before construction begins — they lead Housing Starts by 1–2 months. Housing Starts measure when ground is actually broken on a new home. Permits are generally considered a better forward indicator.' },
      { q: 'When are Housing Starts released?', a: 'Housing Starts and Building Permits are released monthly by the Census Bureau at 8:30 AM Eastern Time, typically around the 17th–19th of the month for the prior month\'s data.' },
    ],
  };
}

function existingHomeSales(): EventContent {
  return {
    what: 'Existing Home Sales, released monthly by the National Association of Realtors (NAR), measures the annualized rate of completed sales of previously owned homes including single-family homes, townhomes, condominiums, and co-ops. It represents roughly 90% of total US home sales and covers closings that occurred during the reference month.',
    whyMatters: 'Existing home sales are a barometer of consumer confidence in housing and the broader economy. Each home sale generates significant economic activity — furniture purchases, renovation spending, real estate commissions, and mortgage originations. The months\' supply metric (inventory ÷ sales rate) signals market tightness: below 4 months is a seller\'s market; above 6 months favors buyers. Falling existing sales alongside rising inventory can signal price corrections.',
    watchFor: [
      'Annualized sales rate vs. consensus estimate and prior month',
      'Months of supply (inventory/sales pace) — below 4 months = tight market',
      'Median home price YoY change',
      'First-time buyer share (typically ~30% of sales)',
      'Impact of current 30-year mortgage rate on affordability and sales pace',
    ],
    faq: [
      { q: 'When are Existing Home Sales released?', a: 'Existing Home Sales are released by the National Association of Realtors on the 3rd or 4th week of each month at 10:00 AM ET, reflecting closings from the prior month.' },
      { q: 'What is a "months of supply" reading?', a: 'Months of supply measures how long it would take to sell all homes currently on the market at the current sales pace. Below 4 months is a seller\'s market (upward price pressure); 6+ months is a buyer\'s market (downward price pressure). The pre-pandemic norm was around 6 months.' },
    ],
  };
}

function newHomeSales(): EventContent {
  return {
    what: 'New Home Sales, released monthly by the Census Bureau, measures the number of newly constructed single-family homes sold or for sale during the reference month. Unlike Existing Home Sales (which are counted at closing), New Home Sales are counted when a sales contract is signed — making them a more timely leading indicator of housing activity.',
    whyMatters: 'New home sales directly measure demand for newly constructed homes, which feeds into builder confidence and future Housing Starts. Because they are counted at contract signing (not closing), they lead Existing Home Sales by 1–2 months. New home sales also proxy consumer confidence in making large, long-term financial commitments. A sharp drop in new home sales typically precedes cuts in housing construction activity.',
    watchFor: [
      'Monthly sales rate vs. consensus and prior month',
      'Median new home price (reflects builder pricing power)',
      'Months of supply of new homes on market',
      'Regional data: South accounts for ~50% of new home sales',
      'Revisions to prior months — often large and market-moving',
    ],
    faq: [
      { q: 'When are New Home Sales released?', a: 'New Home Sales are released by the Census Bureau at 10:00 AM ET, typically in the last week of the month, covering sales from the prior month.' },
      { q: 'Why are New Home Sales more volatile than Existing Home Sales?', a: 'New Home Sales are based on a much smaller sample size (roughly 10% of total home sales vs. 90% for existing) and are counted at contract signing rather than closing, making them subject to large monthly swings and significant revisions.' },
    ],
  };
}

function pendingHomeSales(): EventContent {
  return {
    what: 'The Pending Home Sales Index (PHSI), released monthly by the National Association of Realtors, measures signed real estate contracts for existing single-family homes, condos, and co-ops. Because a contract signing typically precedes closing by 1–2 months, the PHSI is a leading indicator of Existing Home Sales.',
    whyMatters: 'Pending Home Sales provide a 4–6 week forward look at Existing Home Sales closings. A rising PHSI signals improving housing demand that will flow through to closing data in upcoming months. The index is sensitive to mortgage rate changes — rate spikes often cause immediate contract cancellations and PHSI declines. Sustained PHSI weakness typically foreshadows Existing Home Sales contraction.',
    watchFor: [
      'MoM and YoY change vs. consensus estimate',
      'Regional breakdown — Northeast and Midwest often differ from national trend',
      'Contract cancellation rate (tracked separately by NAR)',
      'Lead-lag relationship: PHSI today ≈ Existing Home Sales in 1–2 months',
    ],
    faq: [
      { q: 'How does Pending Home Sales differ from Existing Home Sales?', a: 'Pending Home Sales are counted at contract signing; Existing Home Sales are counted at closing (typically 30–60 days later). This makes PHSI a 1–2 month leading indicator of Existing Home Sales.' },
    ],
  };
}

// ── Manufacturing / Production indicators ─────────────────────────

function industrialProduction(): EventContent {
  return {
    what: 'The Industrial Production (IP) index, released monthly by the Federal Reserve, measures the real output of the manufacturing, mining, and electric and gas utility industries. The Capacity Utilization rate — released simultaneously — shows what percentage of productive capacity is being used across US industries. Manufacturing accounts for roughly 75% of the total IP index.',
    whyMatters: 'Industrial Production is a coincident economic indicator — it moves in line with the broader business cycle rather than leading or lagging it. Sustained IP declines have historically preceded recessions. Capacity Utilization above 80% is associated with inflationary pressures, as factories operating near full capacity face supply constraints. A sharp drop in IP signals weakening corporate revenues in goods-producing sectors.',
    watchFor: [
      'Month-over-month IP change vs. consensus estimate',
      'Manufacturing sub-index (excludes mining and utilities for cleaner signal)',
      'Capacity Utilization rate vs. 80% inflation threshold',
      'Motor vehicle output — often drives large swings in headline IP',
      'Year-over-year trend: consecutive YoY declines signal industrial recession',
    ],
    faq: [
      { q: 'When is Industrial Production released?', a: 'Industrial Production and Capacity Utilization are released monthly by the Federal Reserve at 9:15 AM ET, typically around the 15th–17th of the month for the prior month\'s data.' },
      { q: 'What does capacity utilization above 80% mean?', a: 'Capacity utilization above 80% historically signals that factories are running near full capacity, which can create supply-side inflationary pressure. The Fed watches this metric as one input into inflation risk assessment.' },
    ],
  };
}

function empireState(): EventContent {
  return {
    what: 'The Empire State Manufacturing Index (also called the NY Empire State Manufacturing Survey) is published monthly by the Federal Reserve Bank of New York. It surveys manufacturing executives in New York State on general business conditions, orders, shipments, and employment. Readings above 0 indicate expansion; below 0 signals contraction. It is one of the first regional manufacturing surveys released each month.',
    whyMatters: 'As one of the earliest manufacturing sentiment indicators released each month (typically the 15th), the Empire State survey sets expectations for the national ISM Manufacturing PMI released 2–3 weeks later. While the survey covers only New York State manufacturers, its new orders and prices paid sub-indexes have reasonable predictive value for the national data. Traders use it to fine-tune their ISM expectations.',
    watchFor: [
      'Headline index vs. 0 threshold and consensus estimate',
      'New Orders sub-index (forward-looking demand signal)',
      'Prices Paid vs. Prices Received (margin pressure indicator)',
      'Employment sub-index (preview of manufacturing jobs)',
      'Directional consistency with prior Philly Fed and ISM readings',
    ],
    faq: [
      { q: 'When is the Empire State Manufacturing Index released?', a: 'The Empire State Manufacturing Index is released by the Federal Reserve Bank of New York on the 15th of each month (or the nearest business day) at 8:30 AM ET.' },
      { q: 'How does the Empire State index relate to ISM Manufacturing PMI?', a: 'The Empire State index is a regional leading indicator for the national ISM Manufacturing PMI, which is released 2–3 weeks later. While correlation is imperfect, extreme Empire State readings often foreshadow direction for the national ISM.' },
    ],
  };
}

function phillyFed(): EventContent {
  return {
    what: 'The Philadelphia Fed Manufacturing Index (Business Outlook Survey) is a monthly survey of manufacturers in the Third Federal Reserve District covering Pennsylvania, New Jersey, and Delaware. Published by the Philadelphia Fed, readings above 0 indicate expansion; below 0 signals contraction. Like the Empire State index, it is released early in the month and provides a preview of national manufacturing conditions.',
    whyMatters: 'The Philly Fed survey covers a broader and more industrially diverse region than the Empire State index, making it a widely watched regional preview of the national ISM Manufacturing PMI. Its new orders, shipments, and employment sub-indexes are tracked alongside the Empire State data to build a consensus view ahead of the national ISM release. Significant divergence between Philly Fed and Empire State often resolves in the direction of the national ISM.',
    watchFor: [
      'Headline index vs. 0 and vs. Empire State reading from the same month',
      'New Orders sub-index (forward demand signal)',
      'Prices Paid sub-index (upstream inflation gauge)',
      'Six-month outlook index (forward-looking business expectations)',
      'Combined signal with Empire State as ISM Manufacturing preview',
    ],
    faq: [
      { q: 'When is the Philadelphia Fed Manufacturing Index released?', a: 'The Philadelphia Fed Manufacturing Index is released on the third Thursday of each month at 8:30 AM ET.' },
    ],
  };
}

function factoryOrders(): EventContent {
  return {
    what: 'Factory Orders (Manufacturers\' Shipments, Inventories, and Orders) is a monthly report from the US Census Bureau measuring new orders, shipments, and unfilled orders at US manufacturers. It covers both durable goods (lasting 3+ years) and non-durable goods (consumables). The data provides a comprehensive picture of manufacturing demand and pipeline activity.',
    whyMatters: 'Factory Orders reflect the health of manufacturing demand from both domestic and foreign buyers. Unfilled orders (backlog) signal future production activity — a rising backlog means factories will be busy for months ahead. The shipments component feeds directly into GDP calculations. Core capital goods orders (excluding defense and aircraft) are the most closely watched component as a proxy for business investment.',
    watchFor: [
      'Month-over-month change vs. consensus estimate',
      'Core capital goods orders ex-defense, ex-aircraft (capex proxy)',
      'Unfilled orders (backlog) trend — indicates future production strength',
      'Inventories-to-shipments ratio (rising ratio can signal demand slowdown)',
      'Revisions to prior month Durable Goods orders (released 2 weeks earlier)',
    ],
    faq: [
      { q: 'When is the Factory Orders report released?', a: 'Factory Orders are released by the Census Bureau at 10:00 AM ET, typically on the first business day of the month that is 5 weeks after the reference month.' },
    ],
  };
}

function durableGoods(): EventContent {
  return {
    what: 'The Durable Goods Orders report, released monthly by the US Census Bureau, measures new orders received by US manufacturers for goods intended to last three years or more — including aircraft, machinery, computers, appliances, and defense equipment. Core Durable Goods (ex-transportation, ex-defense, ex-aircraft) strips out volatile categories to reveal underlying business investment trends.',
    whyMatters: 'Durable goods orders are a leading indicator of manufacturing activity and business capital expenditure. The "Core Capex" sub-component (non-defense capital goods ex-aircraft) is the best real-time proxy for business investment in GDP. When companies order new machinery and equipment, it signals confidence in future demand. Sustained weakness in core orders typically precedes earnings guidance cuts in industrials and technology sectors.',
    watchFor: [
      'Core Durable Goods ex-transportation vs. consensus (strips out Boeing orders)',
      'Non-defense capital goods ex-aircraft (core capex, most important sub-index)',
      'Aircraft orders from Boeing — one large order can distort the headline significantly',
      'Defense orders (government spending signal)',
      'Shipments vs. orders: gap indicates future production direction',
    ],
    faq: [
      { q: 'Why is Durable Goods ex-transportation important?', a: 'Transportation orders — especially Boeing aircraft — are extremely lumpy, swinging headline durable goods by billions of dollars based on a handful of aircraft orders. Excluding transportation and defense provides a cleaner read on underlying business investment trends.' },
      { q: 'When are Durable Goods Orders released?', a: 'Durable Goods Orders are released by the Census Bureau at 8:30 AM ET, typically around the 26th of the month for the prior month\'s data.' },
    ],
  };
}

// ── Trade / Energy / Labor / Other indicators ─────────────────────

function tradeBalance(): EventContent {
  return {
    what: 'The US Trade Balance report, released monthly by the Bureau of Economic Analysis (BEA) and Census Bureau, measures the difference between US exports and imports of goods and services. A trade deficit means the US imports more than it exports (negative number); a surplus means exports exceed imports. The US has run a persistent trade deficit for decades, currently in the range of -$60 to -$100 billion per month.',
    whyMatters: 'The trade balance directly affects GDP — a narrowing deficit (or growing surplus) adds to GDP, while a widening deficit subtracts. Trade data is closely watched during periods of tariff policy changes, as tariffs can cause significant swings in both import and export volumes. A widening goods trade deficit typically puts downward pressure on the US dollar. The data also reveals sector-level competitiveness in manufactured goods, agriculture, and services.',
    watchFor: [
      'Headline trade balance vs. consensus estimate',
      'Goods deficit vs. services surplus breakdown',
      'Top trade partners: China, EU, Mexico, Canada deficits/surpluses',
      'Impact of tariff changes on import volumes (especially consumer goods)',
      'Export volumes: a decline signals weak global demand for US goods',
    ],
    faq: [
      { q: 'When is the US Trade Balance released?', a: 'The Trade Balance is released by the Bureau of Economic Analysis and Census Bureau at 8:30 AM ET, typically on the first Friday of the month that is 5 weeks after the reference month.' },
      { q: 'How does the trade deficit affect GDP?', a: 'In the GDP formula (GDP = C + I + G + NX), net exports (NX = exports minus imports) is a direct component. A wider trade deficit subtracts from GDP; a narrowing deficit or growing surplus adds to it. This is why import surges ahead of tariff deadlines can temporarily reduce GDP.' },
    ],
  };
}

function importExportPrices(): EventContent {
  return {
    what: 'The Import and Export Price Indexes, released monthly by the Bureau of Labor Statistics, measure changes in prices of goods traded between the US and other countries. Import prices cover goods entering the US from abroad; export prices cover goods leaving the US. Both exclude services. These indexes are released simultaneously and cover the prior month.',
    whyMatters: 'Import prices are a direct channel through which global inflation (or deflation) enters the US economy. Rising import prices — especially for consumer goods, industrial supplies, and petroleum — can feed into domestic CPI and PPI. Export prices affect the competitiveness of US goods abroad. Both indexes are sensitive to currency movements: a stronger dollar generally reduces import prices and makes US exports more expensive for foreign buyers.',
    watchFor: [
      'Import prices ex-petroleum MoM (strips out oil volatility)',
      'Export prices MoM vs. import prices (terms-of-trade signal)',
      'Petroleum import prices — direct impact on energy CPI',
      'Industrial supplies and materials import prices (feed into PPI)',
      'Currency effect: compare with US Dollar Index trend over the month',
    ],
    faq: [
      { q: 'When are Import and Export Prices released?', a: 'Import and Export Price Indexes are released by the Bureau of Labor Statistics at 8:30 AM ET, typically around the 10th–14th of the month for the prior month\'s data — often on the same day as CPI.' },
    ],
  };
}

function eiaOil(): EventContent {
  return {
    what: 'The EIA Weekly Petroleum Status Report, published every Wednesday by the US Energy Information Administration, provides data on US crude oil and petroleum product inventories, production, imports, and refinery utilization. The headline figures most watched by markets are the change in crude oil stockpiles (in barrels) at Cushing, Oklahoma — the main US delivery hub — and across all domestic storage.',
    whyMatters: 'Crude oil inventories directly influence WTI crude oil prices, which feed into US gasoline prices and energy CPI. A larger-than-expected draw (inventory decrease) signals strong demand or supply constraints and is bullish for oil prices. A larger-than-expected build (inventory increase) is bearish. Energy companies (XOM, CVX, OXY) and refiners are directly affected, and the data can move broader equity markets when moves are extreme.',
    watchFor: [
      'Crude oil stockpile change vs. consensus and prior week API estimate',
      'Cushing, Oklahoma inventory level (WTI delivery hub)',
      'Gasoline and distillate (diesel) inventory changes',
      'Refinery utilization rate (high utilization = strong demand signal)',
      'US crude production level (weekly output trend)',
    ],
    faq: [
      { q: 'What is the difference between EIA and API oil inventory data?', a: 'The API (American Petroleum Institute) releases private inventory estimates on Tuesday evening, a day before the official EIA report. The EIA data is considered more authoritative. Markets often react to both — first to the API as a preview, then to the official EIA.' },
      { q: 'When is the EIA Crude Oil inventory report released?', a: 'The EIA Weekly Petroleum Status Report is released every Wednesday at 10:30 AM ET (or Thursday if Monday was a federal holiday).' },
    ],
  };
}

function eiaGas(): EventContent {
  return {
    what: 'The EIA Weekly Natural Gas Storage Report, released every Thursday by the US Energy Information Administration, measures the change in natural gas held in underground storage facilities across the US, reported in billion cubic feet (Bcf). The report covers the week ending the prior Friday.',
    whyMatters: 'Natural gas storage levels are a key driver of natural gas (Henry Hub) prices. Below-average storage heading into winter (heating season) is bullish for prices; above-average storage is bearish. Natural gas prices affect utility company earnings, electricity generation costs, and industrial energy costs. Utilities, LNG exporters (LNG), and pipeline operators are directly impacted.',
    watchFor: [
      'Weekly injection/withdrawal vs. consensus estimate',
      'Storage level vs. 5-year average and prior year (% above/below normal)',
      'Season context: draws in winter (heating demand), injections in summer (refill season)',
      'Implied demand: warmer-than-normal winter = smaller draws = bearish signal',
    ],
    faq: [
      { q: 'When is the EIA Natural Gas Storage report released?', a: 'The EIA Weekly Natural Gas Storage Report is released every Thursday at 10:30 AM ET.' },
    ],
  };
}

function apiOil(): EventContent {
  return {
    what: 'The American Petroleum Institute (API) Weekly Statistical Bulletin is a private industry report released every Tuesday evening that estimates changes in US crude oil, gasoline, and distillate inventories. It is produced by the oil industry\'s main trade group and serves as a preview of the official EIA inventory data released the following Wednesday morning.',
    whyMatters: 'The API report is the earliest available inventory estimate each week, typically released at 4:30 PM ET on Tuesdays. It often moves crude oil futures in after-hours trading. While less authoritative than the EIA data, large API surprises — especially if confirmed by the EIA the next morning — can significantly move oil prices and energy stocks. The API and EIA figures frequently diverge, which creates a second trading opportunity at the Wednesday EIA release.',
    watchFor: [
      'Crude oil stockpile change vs. analyst estimates',
      'Gasoline and distillate inventory changes',
      'Directional alignment with the subsequent EIA release',
      'Cushing, Oklahoma crude inventory level',
    ],
    faq: [
      { q: 'When is the API oil inventory report released?', a: 'The API Weekly Statistical Bulletin is released every Tuesday at approximately 4:30 PM ET. It is a private report and not always released if Monday was a federal holiday.' },
    ],
  };
}

function mbaMortgage(): EventContent {
  return {
    what: 'The MBA Mortgage Applications Survey, released weekly by the Mortgage Bankers Association every Wednesday morning, tracks mortgage application volume for home purchases and refinances across the US. The 30-Year Fixed Mortgage Rate published alongside the survey reflects the average rate offered by lenders to prime borrowers.',
    whyMatters: 'The 30-year mortgage rate is the single most important price signal in the US housing market. It directly determines monthly payments and therefore housing affordability. When rates rise sharply, purchase applications fall, existing home sales decline, and housing starts slow — creating a chain reaction through the economy. The purchase index (ex-refi) is a leading indicator of Existing Home Sales 30–60 days ahead.',
    watchFor: [
      '30-year fixed mortgage rate vs. prior week and 10-year Treasury yield spread',
      'Purchase applications index (leading indicator for home sales)',
      'Refinance applications index (sensitive to rate moves)',
      'Refinance share of applications (high share = rates have fallen recently)',
      'Trend vs. prior year: YoY comparison controls for seasonality',
    ],
    faq: [
      { q: 'When is the MBA Mortgage Rate data released?', a: 'The Mortgage Bankers Association releases its Weekly Mortgage Applications Survey every Wednesday at 7:00 AM ET, covering the week ending the prior Friday.' },
      { q: 'How does the 30-year mortgage rate relate to the Fed funds rate?', a: 'The 30-year mortgage rate is more closely tied to the 10-year Treasury yield than to the Fed funds rate (which is an overnight rate). The typical spread between the 10-year Treasury and the 30-year mortgage is 1.5–2.0%. Fed rate cuts reduce the funds rate but may not immediately lower mortgage rates if long-term Treasury yields remain elevated.' },
    ],
  };
}

function averageHourlyEarnings(): EventContent {
  return {
    what: 'Average Hourly Earnings (AHE), released as part of the monthly Bureau of Labor Statistics jobs report (alongside Nonfarm Payrolls), measures the average hourly wage paid to private-sector, non-supervisory workers. It is expressed as both a month-over-month and year-over-year percentage change. The data covers approximately 80% of the US workforce.',
    whyMatters: 'Average Hourly Earnings is the Fed\'s most direct real-time measure of wage inflation. Persistent wage growth above 3.5% annually risks becoming embedded in services inflation, as companies pass higher labor costs to consumers. The Fed\'s dual mandate requires balancing full employment with price stability — strong wage growth creates tension between the two goals. Earnings above 0.4% MoM typically trigger a hawkish market reaction.',
    watchFor: [
      'MoM change vs. consensus estimate (above 0.4% = wage inflation concern)',
      'YoY rate vs. CPI inflation (real wage growth = purchasing power)',
      'Trend: is wage growth accelerating or decelerating?',
      'Sector breakdown: leisure & hospitality wages often lead the cycle',
      'Combination with NFP: strong jobs + strong wages = most hawkish signal for Fed',
    ],
    faq: [
      { q: 'What wage growth rate does the Fed consider inflationary?', a: 'The Fed generally considers wage growth above ~3.5% annually as potentially inflationary for services prices (since wage costs drive services CPI). Growth in the 3–3.5% range is broadly consistent with 2% inflation when paired with normal productivity gains.' },
    ],
  };
}

function participationRate(): EventContent {
  return {
    what: 'The Labor Force Participation Rate (LFPR), released monthly by the Bureau of Labor Statistics alongside Nonfarm Payrolls, measures the percentage of the civilian noninstitutional population aged 16 and over that is either employed or actively seeking employment. It is a measure of the active labor supply available to the economy.',
    whyMatters: 'The participation rate critically affects how the unemployment rate should be interpreted. If unemployment falls because discouraged workers stop looking for jobs (exit the labor force), the participation rate falls — making the unemployment rate look artificially low. A rising participation rate with stable unemployment is a genuinely healthy signal: more people are entering the workforce AND finding jobs. The Fed watches participation to assess how much labor supply slack remains in the economy.',
    watchFor: [
      'LFPR vs. prior month and pre-pandemic 2019 baseline (~63.3%)',
      'Prime-age LFPR (ages 25–54) — removes retirement distortions',
      'Direction of change alongside unemployment rate (divergence is significant)',
      'Long-term trend: post-pandemic recovery of workers who left the labor force',
    ],
    faq: [
      { q: 'Why does the participation rate matter for the Fed?', a: 'A low and falling participation rate can mask true labor market weakness — the unemployment rate appears stable only because fewer people are looking for work. The Fed prefers to see high participation alongside low unemployment, which signals genuine labor market strength rather than demographic withdrawal.' },
    ],
  };
}

function businessInventories(): EventContent {
  return {
    what: 'The Business Inventories report, released monthly by the Census Bureau, measures the total value of unsold goods held by manufacturers, wholesalers, and retailers at the end of the reference month. It also includes the inventories-to-sales ratio, which shows how many months of supply are currently on hand at the current sales rate.',
    whyMatters: 'Inventory levels are a key component of GDP (change in private inventories contributes to quarterly GDP growth). A rapid inventory buildup — particularly when sales are slowing — creates a future GDP drag, as businesses cut orders and production to work down excess stock. An unintended inventory build (inventories rising faster than sales) is a leading indicator of production slowdowns and potential layoffs in the goods sector.',
    watchFor: [
      'Inventories-to-sales ratio vs. prior month and historical norms',
      'Retail vs. wholesale vs. manufacturing breakdown',
      'Unintended vs. intended inventory build (context from ISM and sales data)',
      'GDP tracking implications: inventory changes feed directly into quarterly GDP',
    ],
    faq: [
      { q: 'When is the Business Inventories report released?', a: 'Business Inventories are released by the Census Bureau at 10:00 AM ET, typically in the second or third week of the month, covering data from two months prior.' },
    ],
  };
}

function currentAccount(): EventContent {
  return {
    what: 'The Current Account balance, released quarterly by the Bureau of Economic Analysis, measures the broadest measure of US international trade — combining the trade balance in goods and services, net income from foreign investments, and net transfer payments. A current account deficit means the US is a net borrower from the rest of the world; a surplus means it is a net lender.',
    whyMatters: 'The current account deficit must be financed by capital inflows from abroad (foreigners buying US assets — Treasuries, stocks, real estate). A widening deficit can put long-term pressure on the US dollar. Conversely, if foreign demand for US assets weakens, the dollar can fall even without a change in the trade deficit. The current account is a key metric for long-term dollar and Treasury market analysis.',
    watchFor: [
      'Quarterly balance vs. prior quarter and consensus estimate',
      'Services surplus (US competitive strength in finance, tech, education)',
      'Investment income balance (US earns on foreign assets vs. what foreigners earn on US assets)',
      'Trend relative to GDP: current account deficit above 4–5% of GDP raises sustainability concerns',
    ],
    faq: [
      { q: 'When is the Current Account released?', a: 'The Current Account is released quarterly by the BEA at 8:30 AM ET, typically around 75 days after the end of the reference quarter.' },
    ],
  };
}

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

  // ── Monetary policy ────────────────────────────────────────────
  if (/fomc|federal open market|rate decision|federal funds|fed press conference|fed.*projection|\bfed\b.*(speech|remarks|testimony|statement)/i.test(t)) return fomc();

  // ── Inflation ─────────────────────────────────────────────────
  // CPI — Finnhub uses "Inflation Rate MoM/YoY" and "Core Inflation Rate MoM"
  if (/\bcpi\b|consumer price index|inflation rate/i.test(t)) return cpi();
  // PCE — also covers Personal Income & Spending (released in same report)
  if (/\bpce\b|personal consumption expenditure|personal spending|personal income/i.test(t)) return pce();
  if (/\bppi\b|producer price index/i.test(t)) return ppi();
  // Import/Export Prices
  if (/import price|export price/i.test(t)) return importExportPrices();

  // ── Employment ────────────────────────────────────────────────
  // NFP — Finnhub uses "Non Farm Payrolls" (with space)
  if (/non.?farm payroll|nonfarm|\bnfp\b|jobs report/i.test(t)) return nfp();
  // Average Hourly Earnings — released with NFP but distinct signal
  if (/average hourly earnings/i.test(t)) return averageHourlyEarnings();
  // Participation Rate
  if (/participation rate/i.test(t)) return participationRate();
  // Unemployment / Jobless Claims
  if (/unemployment rate|jobless claims/i.test(t)) return unemployment();
  if (/\bjolts\b|job opening/i.test(t)) return jolts();
  if (/\badp\b|adp employment|adp national/i.test(t)) return adp();

  // ── Growth / GDP ──────────────────────────────────────────────
  if (/\bgdp\b|gross domestic product/i.test(t)) return gdp();
  if (/retail sales/i.test(t)) return retailSales();
  if (/durable goods/i.test(t)) return durableGoods();
  if (/factory orders/i.test(t)) return factoryOrders();
  if (/business inventories/i.test(t)) return businessInventories();
  if (/trade balance|balance of trade|goods trade|imports|exports/i.test(t)) return tradeBalance();
  if (/current account/i.test(t)) return currentAccount();

  // ── Manufacturing surveys ─────────────────────────────────────
  if (/\bism\b|purchasing managers|\bpmi\b/i.test(t)) return ism();
  if (/empire state manufacturing/i.test(t)) return empireState();
  if (/philadelphia fed|philly fed/i.test(t)) return phillyFed();
  if (/industrial production|capacity utilization/i.test(t)) return industrialProduction();

  // ── Housing ───────────────────────────────────────────────────
  if (/nahb|housing market index|home builder/i.test(t)) return nahb();
  if (/housing starts|building permits/i.test(t)) return housingStarts();
  if (/existing home sales/i.test(t)) return existingHomeSales();
  if (/new home sales/i.test(t)) return newHomeSales();
  if (/pending home sales/i.test(t)) return pendingHomeSales();
  if (/mortgage rate|mba.*mortgage|mortgage.*application/i.test(t)) return mbaMortgage();

  // ── Energy ───────────────────────────────────────────────────
  if (/eia.*crude|eia.*oil|crude.*stocks|crude.*inventory/i.test(t)) return eiaOil();
  if (/eia.*gasoline|gasoline.*stocks/i.test(t)) return eiaGas();
  if (/api.*crude|api.*oil|api.*stock/i.test(t)) return apiOil();

  // ── Consumer ─────────────────────────────────────────────────
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

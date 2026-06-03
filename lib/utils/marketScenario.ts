/**
 * Rule-based market scenario engine
 * "이번 CPI가 hot/cool이면 QQQ/SPY + 개별 종목에 어떤 영향이?"
 *
 * 근거: 2022-2025년 주요 이벤트 당일 QQQ/SPY/종목 평균 반응 + 시장 구조 논리
 */

export interface StockImpact {
  symbol: string;
  move:   string;
}

export interface ScenarioSide {
  qqq:    string;
  spy:    string;
  bonds:  string;
  note:   string;
  action: string;          // "Trim QQQ / rotate to TLT"
  stocks: StockImpact[];   // individual stock estimates
}

export interface MarketScenario {
  hot:       ScenarioSide;
  cool:      ScenarioSide;
  hotLabel:  string;
  coolLabel: string;
  neutral?:  string;
}

const SCENARIO_MAP: Array<{ match: RegExp; scenario: MarketScenario }> = [

  // ── CPI ──────────────────────────────────────────────────────
  {
    match: /\bCPI\b|consumer price index/i,
    scenario: {
      hotLabel:  'Hotter than expected',
      coolLabel: 'Cooler than expected',
      hot: {
        qqq:    '-1.5 to -2.5%',
        spy:    '-1.0 to -1.8%',
        bonds:  '10Y yield ↑ (+8~15bps)',
        note:   'Rate-cut odds fall sharply. Growth stocks reprice lower.',
        action: 'Trim QQQ / rotate to TLT or cash — rate cut off the table',
        stocks: [
          { symbol: 'NVDA', move: '-3 to -5%' },
          { symbol: 'AAPL', move: '-1.5 to -2.5%' },
          { symbol: 'TSLA', move: '-3 to -5%' },
          { symbol: 'META', move: '-2 to -3%' },
          { symbol: 'MSFT', move: '-1.5 to -2.5%' },
        ],
      },
      cool: {
        qqq:    '+1.0 to +2.0%',
        spy:    '+0.7 to +1.4%',
        bonds:  '10Y yield ↓ (-6~12bps)',
        note:   'June/July cut window re-opens. Tech and growth lead.',
        action: 'Add to QQQ / tech — NVDA and growth stocks outperform',
        stocks: [
          { symbol: 'NVDA', move: '+2 to +5%' },
          { symbol: 'AAPL', move: '+1.5 to +2.5%' },
          { symbol: 'TSLA', move: '+2 to +4%' },
          { symbol: 'META', move: '+1.5 to +3%' },
          { symbol: 'MSFT', move: '+1.5 to +2.5%' },
        ],
      },
    },
  },

  // ── Core CPI ─────────────────────────────────────────────────
  {
    match: /core cpi/i,
    scenario: {
      hotLabel:  'Hotter than expected',
      coolLabel: 'Cooler than expected',
      hot: {
        qqq:    '-1.5 to -2.5%',
        spy:    '-1.0 to -1.8%',
        bonds:  '10Y yield ↑ (+8~15bps)',
        note:   'Core is the Fed\'s primary gauge. Bigger mover than headline CPI.',
        action: 'Trim growth exposure — Core CPI surprise is the Fed\'s #1 concern',
        stocks: [
          { symbol: 'NVDA', move: '-3 to -5%' },
          { symbol: 'AAPL', move: '-1.5 to -2.5%' },
          { symbol: 'TSLA', move: '-3 to -5%' },
          { symbol: 'META', move: '-2 to -3%' },
          { symbol: 'MSFT', move: '-1.5 to -2.5%' },
        ],
      },
      cool: {
        qqq:    '+1.0 to +2.0%',
        spy:    '+0.7 to +1.4%',
        bonds:  '10Y yield ↓ (-6~12bps)',
        note:   'Disinflation narrative strengthens. Rate-cut probability surges.',
        action: 'Add to QQQ / NVDA — disinflation is the best fuel for growth stocks',
        stocks: [
          { symbol: 'NVDA', move: '+2 to +5%' },
          { symbol: 'AAPL', move: '+1.5 to +2.5%' },
          { symbol: 'TSLA', move: '+2 to +4%' },
          { symbol: 'META', move: '+1.5 to +3%' },
          { symbol: 'MSFT', move: '+1.5 to +2.5%' },
        ],
      },
    },
  },

  // ── PCE ──────────────────────────────────────────────────────
  {
    match: /\bPCE\b|personal consumption expenditure/i,
    scenario: {
      hotLabel:  'Hotter than expected',
      coolLabel: 'Cooler than expected',
      hot: {
        qqq:    '-1.0 to -2.0%',
        spy:    '-0.8 to -1.5%',
        bonds:  '10Y yield ↑ (+6~12bps)',
        note:   'PCE is the Fed\'s preferred inflation measure. Hawkish risk.',
        action: 'Trim tech — watch TLT for entry point as yields spike',
        stocks: [
          { symbol: 'NVDA', move: '-2.5 to -4%' },
          { symbol: 'AAPL', move: '-1.5 to -2.5%' },
          { symbol: 'TSLA', move: '-2.5 to -4%' },
          { symbol: 'META', move: '-1.5 to -2.5%' },
          { symbol: 'MSFT', move: '-1 to -2%' },
        ],
      },
      cool: {
        qqq:    '+0.8 to +1.8%',
        spy:    '+0.6 to +1.2%',
        bonds:  '10Y yield ↓ (-5~10bps)',
        note:   'Fed\'s green light — confirms disinflation. Room to cut.',
        action: 'Add to growth and tech — PCE cool is the Fed\'s official green light',
        stocks: [
          { symbol: 'NVDA', move: '+2 to +4%' },
          { symbol: 'AAPL', move: '+1 to +2%' },
          { symbol: 'TSLA', move: '+2 to +4%' },
          { symbol: 'META', move: '+1.5 to +2.5%' },
          { symbol: 'MSFT', move: '+1 to +2%' },
        ],
      },
    },
  },

  // ── FOMC Rate Decision ────────────────────────────────────────
  {
    match: /fomc|fed interest rate|interest rate decision|rate decision/i,
    scenario: {
      hotLabel:  'Hawkish surprise (hold or hike)',
      coolLabel: 'Dovish surprise (cut or soft tone)',
      hot: {
        qqq:    '-2.0 to -4.0%',
        spy:    '-1.5 to -3.0%',
        bonds:  '10Y yield ↑ (+10~20bps)',
        note:   'Higher-for-longer narrative. Growth stocks hit hardest.',
        action: 'Reduce high-duration growth — rotate to value or financials',
        stocks: [
          { symbol: 'NVDA', move: '-4 to -7%' },
          { symbol: 'AAPL', move: '-2.5 to -4%' },
          { symbol: 'TSLA', move: '-5 to -8%' },
          { symbol: 'META', move: '-3 to -5%' },
          { symbol: 'MSFT', move: '-2 to -3.5%' },
        ],
      },
      cool: {
        qqq:    '+1.5 to +3.5%',
        spy:    '+1.0 to +2.5%',
        bonds:  '10Y yield ↓ (-8~18bps)',
        note:   'Cut or dovish pivot. Risk-on. QQQ outperforms.',
        action: 'Buy the dip in QQQ — tech and NVDA lead dovish-pivot rallies',
        stocks: [
          { symbol: 'NVDA', move: '+3 to +7%' },
          { symbol: 'AAPL', move: '+2 to +4%' },
          { symbol: 'TSLA', move: '+3 to +7%' },
          { symbol: 'META', move: '+2.5 to +5%' },
          { symbol: 'MSFT', move: '+2 to +3.5%' },
        ],
      },
      neutral: 'Market usually reacts more to the press conference tone than the decision itself.',
    },
  },

  // ── Fed Minutes ──────────────────────────────────────────────
  {
    match: /fomc minutes|fed minutes/i,
    scenario: {
      hotLabel:  'Hawkish tone in minutes',
      coolLabel: 'Dovish tone in minutes',
      hot: {
        qqq:    '-0.5 to -1.5%',
        spy:    '-0.4 to -1.2%',
        bonds:  '10Y yield ↑ (+4~8bps)',
        note:   'Minutes confirming "higher for longer" revive rate fears.',
        action: 'Light defensive rotation — not as severe as FOMC day, but trim high-beta',
        stocks: [
          { symbol: 'NVDA', move: '-0.8 to -2%' },
          { symbol: 'AAPL', move: '-0.5 to -1.5%' },
          { symbol: 'TSLA', move: '-0.8 to -2%' },
          { symbol: 'META', move: '-0.5 to -1.5%' },
          { symbol: 'MSFT', move: '-0.4 to -1.2%' },
        ],
      },
      cool: {
        qqq:    '+0.5 to +1.2%',
        spy:    '+0.4 to +1.0%',
        bonds:  '10Y yield ↓ (-3~7bps)',
        note:   'Concern about over-tightening signals potential pivot.',
        action: 'Modest tech bounce — confirm with next CPI/PCE before adding size',
        stocks: [
          { symbol: 'NVDA', move: '+0.5 to +1.5%' },
          { symbol: 'AAPL', move: '+0.4 to +1.2%' },
          { symbol: 'TSLA', move: '+0.5 to +1.5%' },
          { symbol: 'META', move: '+0.4 to +1.2%' },
          { symbol: 'MSFT', move: '+0.3 to +1%' },
        ],
      },
    },
  },

  // ── NFP / Nonfarm Payrolls ────────────────────────────────────
  {
    match: /nonfarm payroll|nfp|jobs report/i,
    scenario: {
      hotLabel:  'Stronger than expected',
      coolLabel: 'Weaker than expected',
      hot: {
        qqq:    '-0.5 to -1.5%',
        spy:    '-0.3 to -1.0%',
        bonds:  '10Y yield ↑ (+5~10bps)',
        note:   'Strong jobs = Fed stays hawkish longer. Counterintuitively bearish for growth.',
        action: 'Slight caution on rate-sensitive growth — financials and energy benefit',
        stocks: [
          { symbol: 'NVDA', move: '-1 to -2.5%' },
          { symbol: 'AAPL', move: '-0.8 to -1.5%' },
          { symbol: 'TSLA', move: '-1 to -2.5%' },
          { symbol: 'META', move: '-0.8 to -2%' },
          { symbol: 'MSFT', move: '-0.5 to -1.5%' },
        ],
      },
      cool: {
        qqq:    '+0.5 to +1.5%',
        spy:    '+0.3 to +1.0%',
        bonds:  '10Y yield ↓ (-4~9bps)',
        note:   'Weak jobs gives Fed cover to cut. Markets cheer.',
        action: 'Add to QQQ on dips — rate-cut odds recover, tech leads the bounce',
        stocks: [
          { symbol: 'NVDA', move: '+1 to +2.5%' },
          { symbol: 'AAPL', move: '+0.8 to +1.5%' },
          { symbol: 'TSLA', move: '+1 to +2.5%' },
          { symbol: 'META', move: '+0.8 to +2%' },
          { symbol: 'MSFT', move: '+0.5 to +1.5%' },
        ],
      },
      neutral: 'NFP reaction depends heavily on unemployment rate and wage growth components.',
    },
  },

  // ── Unemployment Rate ─────────────────────────────────────────
  {
    match: /unemployment rate/i,
    scenario: {
      hotLabel:  'Higher than expected (more unemployment)',
      coolLabel: 'Lower than expected (less unemployment)',
      hot: {
        qqq:    '+0.3 to +1.0%',
        spy:    '+0.2 to +0.7%',
        bonds:  '10Y yield ↓ (-3~8bps)',
        note:   'Higher unemployment signals labor cooling → Fed cut sooner.',
        action: 'Counterintuitively bullish for tech — Fed cuts sooner, add to QQQ',
        stocks: [
          { symbol: 'NVDA', move: '+0.5 to +1.5%' },
          { symbol: 'AAPL', move: '+0.4 to +1%' },
          { symbol: 'TSLA', move: '+0.5 to +1.5%' },
          { symbol: 'META', move: '+0.3 to +1%' },
          { symbol: 'MSFT', move: '+0.3 to +0.8%' },
        ],
      },
      cool: {
        qqq:    '-0.3 to -1.0%',
        spy:    '-0.2 to -0.7%',
        bonds:  '10Y yield ↑ (+3~8bps)',
        note:   'Tight labor market → Fed holds. Slight negative for rate-sensitive stocks.',
        action: 'Tight labor = wage pressure = Fed holds — slight headwind for growth',
        stocks: [
          { symbol: 'NVDA', move: '-0.5 to -1%' },
          { symbol: 'AAPL', move: '-0.3 to -0.8%' },
          { symbol: 'TSLA', move: '-0.4 to -1%' },
          { symbol: 'META', move: '-0.3 to -0.8%' },
          { symbol: 'MSFT', move: '-0.2 to -0.6%' },
        ],
      },
    },
  },

  // ── GDP ───────────────────────────────────────────────────────
  {
    match: /\bGDP\b|gross domestic product/i,
    scenario: {
      hotLabel:  'Stronger than expected',
      coolLabel: 'Weaker than expected',
      hot: {
        qqq:    '+0.3 to +1.0%',
        spy:    '+0.3 to +0.8%',
        bonds:  '10Y yield ↑ (+3~7bps)',
        note:   'Strong growth = strong earnings outlook. Mixed for rates.',
        action: 'Mixed signal — growth good for earnings, but rates may stay higher',
        stocks: [
          { symbol: 'NVDA', move: '+0.5 to +1.5%' },
          { symbol: 'AAPL', move: '+0.3 to +1%' },
          { symbol: 'TSLA', move: '+0.3 to +1%' },
          { symbol: 'META', move: '+0.3 to +1%' },
          { symbol: 'MSFT', move: '+0.3 to +1%' },
        ],
      },
      cool: {
        qqq:    '-0.5 to -1.5%',
        spy:    '-0.4 to -1.2%',
        bonds:  '10Y yield ↓ (-4~8bps)',
        note:   'Recession fears creep in. Defensive rotation.',
        action: 'Reduce cyclicals — defensive rotation into staples and utilities',
        stocks: [
          { symbol: 'NVDA', move: '-1 to -2.5%' },
          { symbol: 'AAPL', move: '-0.8 to -1.5%' },
          { symbol: 'TSLA', move: '-1 to -2%' },
          { symbol: 'META', move: '-0.8 to -1.5%' },
          { symbol: 'MSFT', move: '-0.5 to -1.5%' },
        ],
      },
    },
  },

  // ── ISM PMI ───────────────────────────────────────────────────
  {
    match: /\bISM\b|purchasing managers|PMI/i,
    scenario: {
      hotLabel:  'Above 50 (expansion, beat)',
      coolLabel: 'Below 50 (contraction, miss)',
      hot: {
        qqq:    '+0.2 to +0.8%',
        spy:    '+0.2 to +0.6%',
        bonds:  'yields flat to ↑',
        note:   'Manufacturing/services expansion supports earnings.',
        action: 'Modest risk-on — hold positions, expansion supports corporate earnings',
        stocks: [
          { symbol: 'NVDA', move: '+0.3 to +1%' },
          { symbol: 'AAPL', move: '+0.2 to +0.8%' },
          { symbol: 'TSLA', move: '+0.2 to +0.8%' },
          { symbol: 'META', move: '+0.2 to +0.7%' },
          { symbol: 'MSFT', move: '+0.2 to +0.7%' },
        ],
      },
      cool: {
        qqq:    '-0.3 to -1.0%',
        spy:    '-0.2 to -0.8%',
        bonds:  'yields flat to ↓',
        note:   'Contraction signals slowdown risk.',
        action: 'Caution on cyclicals — defensive positioning preferred',
        stocks: [
          { symbol: 'NVDA', move: '-0.5 to -1.2%' },
          { symbol: 'AAPL', move: '-0.3 to -0.8%' },
          { symbol: 'TSLA', move: '-0.3 to -0.8%' },
          { symbol: 'META', move: '-0.3 to -0.8%' },
          { symbol: 'MSFT', move: '-0.3 to -0.7%' },
        ],
      },
    },
  },

  // ── PPI ───────────────────────────────────────────────────────
  {
    match: /\bPPI\b|producer price/i,
    scenario: {
      hotLabel:  'Hotter than expected',
      coolLabel: 'Cooler than expected',
      hot: {
        qqq:    '-0.5 to -1.2%',
        spy:    '-0.4 to -1.0%',
        bonds:  '10Y yield ↑ (+4~8bps)',
        note:   'Producer inflation feeds into future CPI. Rate cut fears rise.',
        action: 'Slight caution on tech — pipeline inflation will show up in next CPI',
        stocks: [
          { symbol: 'NVDA', move: '-0.8 to -2%' },
          { symbol: 'AAPL', move: '-0.5 to -1.2%' },
          { symbol: 'TSLA', move: '-0.8 to -2%' },
          { symbol: 'META', move: '-0.5 to -1.5%' },
          { symbol: 'MSFT', move: '-0.4 to -1%' },
        ],
      },
      cool: {
        qqq:    '+0.4 to +1.0%',
        spy:    '+0.3 to +0.8%',
        bonds:  '10Y yield ↓ (-3~7bps)',
        note:   'Pipeline inflation easing. Supports disinflation narrative.',
        action: 'Modest tech tailwind — disinflation pipeline confirmed for future CPI',
        stocks: [
          { symbol: 'NVDA', move: '+0.5 to +1.5%' },
          { symbol: 'AAPL', move: '+0.4 to +1%' },
          { symbol: 'TSLA', move: '+0.5 to +1.5%' },
          { symbol: 'META', move: '+0.4 to +1%' },
          { symbol: 'MSFT', move: '+0.3 to +0.8%' },
        ],
      },
    },
  },

  // ── Retail Sales ─────────────────────────────────────────────
  {
    match: /retail sales/i,
    scenario: {
      hotLabel:  'Stronger than expected',
      coolLabel: 'Weaker than expected',
      hot: {
        qqq:    '+0.2 to +0.7%',
        spy:    '+0.2 to +0.6%',
        bonds:  'yields flat to ↑',
        note:   'Strong consumer = good for earnings. Mixed for rates.',
        action: 'Consumer stocks benefit most — tech is mixed signal here',
        stocks: [
          { symbol: 'NVDA', move: 'flat to +1%' },
          { symbol: 'AAPL', move: '+0.3 to +0.8%' },
          { symbol: 'TSLA', move: 'flat to +0.8%' },
          { symbol: 'META', move: '+0.2 to +0.7%' },
          { symbol: 'MSFT', move: 'flat to +0.5%' },
        ],
      },
      cool: {
        qqq:    '-0.2 to -0.8%',
        spy:    '-0.2 to -0.7%',
        bonds:  'yields flat to ↓',
        note:   'Consumer slowdown signals economic cooling.',
        action: 'Reduce discretionary exposure — consumer slowdown risk rising',
        stocks: [
          { symbol: 'NVDA', move: '-0.3 to -1%' },
          { symbol: 'AAPL', move: '-0.2 to -0.8%' },
          { symbol: 'TSLA', move: '-0.3 to -1%' },
          { symbol: 'META', move: '-0.2 to -0.7%' },
          { symbol: 'MSFT', move: '-0.2 to -0.5%' },
        ],
      },
    },
  },

  // ── JOLTs ────────────────────────────────────────────────────
  {
    match: /jolts|job openings/i,
    scenario: {
      hotLabel:  'More openings than expected',
      coolLabel: 'Fewer openings than expected',
      hot: {
        qqq:    '-0.3 to -0.8%',
        spy:    '-0.2 to -0.6%',
        bonds:  'yields flat to ↑',
        note:   'Tight labor market → wage pressure → Fed holds.',
        action: 'Wage pressure means Fed stays put — light headwind on growth stocks',
        stocks: [
          { symbol: 'NVDA', move: '-0.5 to -1.2%' },
          { symbol: 'AAPL', move: '-0.3 to -0.8%' },
          { symbol: 'TSLA', move: '-0.3 to -1%' },
          { symbol: 'META', move: '-0.3 to -0.8%' },
          { symbol: 'MSFT', move: '-0.2 to -0.6%' },
        ],
      },
      cool: {
        qqq:    '+0.2 to +0.7%',
        spy:    '+0.2 to +0.5%',
        bonds:  'yields flat to ↓',
        note:   'Labor market cooling gives Fed room to cut.',
        action: 'Labor cooling is bullish for rate-sensitive growth — mild QQQ tailwind',
        stocks: [
          { symbol: 'NVDA', move: '+0.3 to +0.8%' },
          { symbol: 'AAPL', move: '+0.2 to +0.5%' },
          { symbol: 'TSLA', move: '+0.2 to +0.6%' },
          { symbol: 'META', move: '+0.2 to +0.5%' },
          { symbol: 'MSFT', move: '+0.2 to +0.4%' },
        ],
      },
    },
  },

  // ── Earnings (generic) ───────────────────────────────────────
  {
    match: /earnings|results/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:    'stock +3 to +10%',
        spy:    'sector +0.5 to +1.5%',
        bonds:  'no direct impact',
        note:   'Beat + raised guidance = strongest reaction.',
        action: 'Beat + raised guidance = buy the stock / add to sector ETF',
        stocks: [],
      },
      cool: {
        qqq:    'stock -5 to -15%',
        spy:    'sector -0.5 to -1.5%',
        bonds:  'no direct impact',
        note:   'Miss + lowered guidance can trigger sector-wide selloff.',
        action: 'Miss + cut guidance = trim the position, watch for sector contagion',
        stocks: [],
      },
    },
  },
];

export function getMarketScenario(title: string): MarketScenario | null {
  for (const entry of SCENARIO_MAP) {
    if (entry.match.test(title)) return entry.scenario;
  }
  return null;
}

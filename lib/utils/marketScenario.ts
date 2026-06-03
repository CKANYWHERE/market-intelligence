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
  qqq:       string;
  qqqLabel?: string;  // 기본 "QQQ", earnings 시 종목명으로 override
  spy:       string;
  spyLabel?: string;  // 기본 "SPY", earnings 시 "QQQ"로 override
  bonds:     string;
  note:      string;
  action:    string;
  stocks:    StockImpact[];
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

  // ── NVDA Earnings ─────────────────────────────────────────────
  // 역사적 반응: 2023-2025 평균 beat +14%, miss -9% / QQQ weight ~5%
  {
    match: /\bNVDA\b.*earnings|\bNVIDIA\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+10 to +20%',
        qqqLabel: 'NVDA',
        spy:      '+0.5 to +1.5%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Data center / AI revenue beat drives massive short-squeeze. Sector follows.',
        action:   'NVDA beat = buy AMD, AVGO, SMCI — entire AI semiconductor complex rallies',
        stocks: [
          { symbol: 'AMD',  move: '+4 to +8%' },
          { symbol: 'AVGO', move: '+3 to +6%' },
          { symbol: 'SMCI', move: '+5 to +10%' },
          { symbol: 'TSM',  move: '+2 to +4%' },
          { symbol: 'MSFT', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq:      '-8 to -15%',
        qqqLabel: 'NVDA',
        spy:      '-0.4 to -1.2%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'AI capex slowdown fear hits the entire semiconductor sector.',
        action:   'NVDA miss = trim AI names (AMD, SMCI, AVGO) — sector contagion is real',
        stocks: [
          { symbol: 'AMD',  move: '-4 to -8%' },
          { symbol: 'AVGO', move: '-3 to -6%' },
          { symbol: 'SMCI', move: '-6 to -12%' },
          { symbol: 'TSM',  move: '-2 to -4%' },
          { symbol: 'MSFT', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── AAPL Earnings ─────────────────────────────────────────────
  // 역사적 반응: beat +3~6%, miss -3~7% / QQQ weight ~9%
  {
    match: /\bAAPL\b.*earnings|\bApple\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+3 to +7%',
        qqqLabel: 'AAPL',
        spy:      '+0.3 to +0.8%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'iPhone + Services revenue beat signals healthy consumer. Highest QQQ weight.',
        action:   'AAPL beat lifts QQQ meaningfully — largest index weight, modest upside',
        stocks: [
          { symbol: 'QCOM', move: '+2 to +4%' },
          { symbol: 'AVGO', move: '+1.5 to +3%' },
          { symbol: 'MSFT', move: '+0.5 to +1.5%' },
          { symbol: 'GOOGL', move: '+0.5 to +1%' },
          { symbol: 'META', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq:      '-3 to -8%',
        qqqLabel: 'AAPL',
        spy:      '-0.3 to -0.8%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'iPhone demand miss + China slowdown risk. Suppliers and QQQ dragged down.',
        action:   'AAPL miss = reduce QQQ exposure, trim Apple suppliers (QCOM, AVGO)',
        stocks: [
          { symbol: 'QCOM', move: '-2 to -5%' },
          { symbol: 'AVGO', move: '-1.5 to -3%' },
          { symbol: 'MSFT', move: '-0.5 to -1.5%' },
          { symbol: 'GOOGL', move: '-0.5 to -1%' },
          { symbol: 'META', move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── MSFT Earnings ─────────────────────────────────────────────
  // 역사적 반응: beat +3~8%, miss -4~10% / Azure growth key driver
  {
    match: /\bMSFT\b.*earnings|\bMicrosoft\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+3 to +8%',
        qqqLabel: 'MSFT',
        spy:      '+0.3 to +0.8%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Azure cloud growth + Copilot AI adoption signals enterprise AI spending.',
        action:   'MSFT beat = add to cloud/AI names (GOOGL, AMZN, CRM)',
        stocks: [
          { symbol: 'GOOGL', move: '+1 to +2.5%' },
          { symbol: 'AMZN',  move: '+1 to +2%' },
          { symbol: 'CRM',   move: '+2 to +4%' },
          { symbol: 'NVDA',  move: '+1 to +2%' },
          { symbol: 'AAPL',  move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq:      '-4 to -10%',
        qqqLabel: 'MSFT',
        spy:      '-0.3 to -0.8%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Azure deceleration raises enterprise cloud demand concerns across sector.',
        action:   'MSFT miss = trim cloud names, Azure miss is a sector-wide warning',
        stocks: [
          { symbol: 'GOOGL', move: '-1.5 to -3%' },
          { symbol: 'AMZN',  move: '-1 to -2.5%' },
          { symbol: 'CRM',   move: '-2 to -5%' },
          { symbol: 'NVDA',  move: '-1 to -2%' },
          { symbol: 'AAPL',  move: '-0.5 to -1.5%' },
        ],
      },
    },
  },

  // ── META Earnings ─────────────────────────────────────────────
  // 역사적 반응: beat +10~20%, miss -15~25% (극단적 반응)
  {
    match: /\bMETA\b.*earnings|\bMeta\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+10 to +20%',
        qqqLabel: 'META',
        spy:      '+0.3 to +1%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Ad revenue beat + AI-driven engagement signals digital ad recovery.',
        action:   'META beat = add to digital ad names (GOOGL, SNAP, TTD)',
        stocks: [
          { symbol: 'GOOGL', move: '+1.5 to +3%' },
          { symbol: 'SNAP',  move: '+5 to +12%' },
          { symbol: 'TTD',   move: '+3 to +7%' },
          { symbol: 'PINS',  move: '+3 to +6%' },
          { symbol: 'AMZN',  move: '+0.5 to +1.5%' },
        ],
      },
      cool: {
        qqq:      '-15 to -25%',
        qqqLabel: 'META',
        spy:      '-0.5 to -1.2%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Ad slowdown or elevated capex guidance punished severely by market.',
        action:   'META miss = exit digital ad positions — sector selloff can be severe',
        stocks: [
          { symbol: 'GOOGL', move: '-2 to -5%' },
          { symbol: 'SNAP',  move: '-8 to -18%' },
          { symbol: 'TTD',   move: '-5 to -10%' },
          { symbol: 'PINS',  move: '-4 to -8%' },
          { symbol: 'AMZN',  move: '-0.5 to -1.5%' },
        ],
      },
    },
  },

  // ── TSLA Earnings ─────────────────────────────────────────────
  // 역사적 반응: beat +5~15%, miss -8~18% (고변동성)
  {
    match: /\bTSLA\b.*earnings|\bTesla\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+5 to +15%',
        qqqLabel: 'TSLA',
        spy:      '+0.2 to +0.7%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Margin recovery + delivery beat signals EV demand stabilization.',
        action:   'TSLA beat = add to EV/energy storage names, Musk sentiment plays',
        stocks: [
          { symbol: 'RIVN', move: '+4 to +8%' },
          { symbol: 'LCID', move: '+3 to +7%' },
          { symbol: 'ENPH', move: '+2 to +5%' },
          { symbol: 'PANW', move: '+1 to +2%' },
          { symbol: 'NVDA', move: '+0.5 to +1.5%' },
        ],
      },
      cool: {
        qqq:      '-8 to -18%',
        qqqLabel: 'TSLA',
        spy:      '-0.2 to -0.8%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Margin compression + delivery miss raises long-term growth concerns.',
        action:   'TSLA miss = trim EV names — margin pressure is the biggest risk',
        stocks: [
          { symbol: 'RIVN', move: '-5 to -10%' },
          { symbol: 'LCID', move: '-4 to -9%' },
          { symbol: 'ENPH', move: '-2 to -5%' },
          { symbol: 'NIO',  move: '-3 to -7%' },
          { symbol: 'XPEV', move: '-3 to -7%' },
        ],
      },
    },
  },

  // ── GOOGL Earnings ────────────────────────────────────────────
  // 역사적 반응: beat +5~12%, miss -5~12%
  {
    match: /\bGOOGL?\b.*earnings|\bAlphabet\b.*earnings|\bGoogle\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+5 to +12%',
        qqqLabel: 'GOOGL',
        spy:      '+0.2 to +0.8%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Search + Cloud (GCP) beat signals digital ad recovery and AI monetization.',
        action:   'GOOGL beat = buy META and digital ad names — sector rising tide',
        stocks: [
          { symbol: 'META', move: '+2 to +4%' },
          { symbol: 'MSFT', move: '+1 to +2%' },
          { symbol: 'AMZN', move: '+1 to +2%' },
          { symbol: 'SNAP', move: '+3 to +7%' },
          { symbol: 'TTD',  move: '+2 to +5%' },
        ],
      },
      cool: {
        qqq:      '-5 to -12%',
        qqqLabel: 'GOOGL',
        spy:      '-0.2 to -0.7%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'Search deceleration or AI cost pressure triggers digital ad sector concern.',
        action:   'GOOGL miss = reduce digital ad exposure — cloud + ad slowdown signal',
        stocks: [
          { symbol: 'META', move: '-2 to -5%' },
          { symbol: 'MSFT', move: '-1 to -2.5%' },
          { symbol: 'AMZN', move: '-1 to -2%' },
          { symbol: 'SNAP', move: '-4 to -8%' },
          { symbol: 'TTD',  move: '-3 to -6%' },
        ],
      },
    },
  },

  // ── AMZN Earnings ─────────────────────────────────────────────
  // 역사적 반응: beat +5~12%, miss -8~15% (AWS growth 핵심)
  {
    match: /\bAMZN\b.*earnings|\bAmazon\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+5 to +12%',
        qqqLabel: 'AMZN',
        spy:      '+0.2 to +0.7%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'AWS growth reacceleration is the most watched number — cloud capex cycle indicator.',
        action:   'AMZN beat = add to cloud names (MSFT, GOOGL) — AWS momentum confirms cycle',
        stocks: [
          { symbol: 'MSFT', move: '+1 to +2.5%' },
          { symbol: 'GOOGL', move: '+1 to +2%' },
          { symbol: 'SHOP',  move: '+2 to +5%' },
          { symbol: 'NVDA',  move: '+1 to +2%' },
          { symbol: 'CRM',   move: '+1.5 to +3%' },
        ],
      },
      cool: {
        qqq:      '-8 to -15%',
        qqqLabel: 'AMZN',
        spy:      '-0.3 to -0.8%',
        spyLabel: 'QQQ',
        bonds:    'no direct impact',
        note:     'AWS deceleration raises enterprise cloud demand concerns broadly.',
        action:   'AMZN miss = trim cloud stocks — AWS miss is a broad enterprise spending signal',
        stocks: [
          { symbol: 'MSFT',  move: '-1.5 to -3%' },
          { symbol: 'GOOGL', move: '-1 to -2.5%' },
          { symbol: 'SHOP',  move: '-2 to -5%' },
          { symbol: 'NVDA',  move: '-1 to -2%' },
          { symbol: 'CRM',   move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── Earnings (generic fallback) ───────────────────────────────
  {
    match: /earnings|results/i,
    scenario: {
      hotLabel:  'Beat estimates',
      coolLabel: 'Miss estimates',
      hot: {
        qqq:      '+3 to +8%',
        qqqLabel: 'Stock',
        spy:      '+0.2 to +0.8%',
        spyLabel: 'Sector',
        bonds:    'no direct impact',
        note:     'Beat + raised guidance is the strongest reaction catalyst.',
        action:   'Beat + raised guidance = buy the stock / add to sector ETF',
        stocks:   [],
      },
      cool: {
        qqq:      '-5 to -12%',
        qqqLabel: 'Stock',
        spy:      '-0.2 to -0.8%',
        spyLabel: 'Sector',
        bonds:    'no direct impact',
        note:     'Miss + lowered guidance can trigger sector-wide selloff.',
        action:   'Miss + cut guidance = trim the position, watch for sector contagion',
        stocks:   [],
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

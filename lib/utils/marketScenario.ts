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
        action: 'Historically, QQQ and growth stocks declined as rate-cut expectations fell. Bonds outperformed on the day.',
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
        action: 'Historically, QQQ and tech led gains on cool CPI. NVDA typically showed the strongest reaction.',
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
        action: 'Historically, growth stocks faced pressure on Core CPI beats — it is the Fed\'s primary inflation gauge.',
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
        action: 'Historically, QQQ and NVDA outperformed on Core CPI misses as disinflation strengthened rate-cut odds.',
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
        action: 'Historically, tech stocks pulled back as yields spiked on hot PCE. Bond markets saw elevated volume.',
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
        action: 'Historically, growth and tech outperformed when PCE confirmed disinflation — the Fed\'s preferred gauge.',
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
        action: 'Historically, high-duration growth stocks fell hardest on hawkish FOMC surprises. Value and financials held up better.',
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
        action: 'Historically, QQQ and NVDA led the rally in dovish-pivot scenarios. Tech outperformed the broad market.',
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
        action: 'Historically, hawkish minutes caused a smaller move than FOMC day. High-beta stocks saw mild pressure.',
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
        action: 'Historically, dovish minutes produced a modest tech bounce. Follow-through depended on subsequent CPI/PCE data.',
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
        action: 'Historically, strong jobs data was counterintuitively negative for growth — it reduced Fed cut odds. Financials held up better.',
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
        action: 'Historically, weak jobs data triggered rate-cut repricing, with tech leading the recovery.',
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
        action: 'Historically, higher unemployment was counterintuitively positive for tech — it brought forward rate-cut expectations.',
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
        action: 'Historically, tight labor market data created a mild headwind for rate-sensitive growth via wage pressure.',
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
        action: 'Historically, strong GDP sent a mixed signal — positive for earnings but raising concern about sustained higher rates.',
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
        action: 'Historically, weak GDP triggered defensive rotation. Cyclicals underperformed staples and utilities.',
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
        action: 'Historically, expansion readings produced a modest positive. Corporate earnings outlook improved.',
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
        action: 'Historically, contraction readings pressured cyclicals. Defensive names held up relatively better.',
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
        action: 'Historically, hot PPI created a mild headwind for tech — pipeline inflation typically feeds into future CPI data.',
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
        action: 'Historically, cool PPI provided a modest tailwind for tech by signaling disinflation ahead in CPI.',
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
        action: 'Historically, consumer-facing stocks led on strong retail sales. Tech showed a more mixed reaction.',
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
        action: 'Historically, weak retail sales pressured discretionary stocks as consumer slowdown risk increased.',
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
        action: 'Historically, tight labor via JOLTs created a mild headwind for growth stocks through wage pressure.',
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
        action: 'Historically, labor cooling via JOLTs provided a mild tailwind for rate-sensitive growth stocks.',
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

  // ─────────────────────────────────────────────────────────────
  // STOCK-SPECIFIC EARNINGS SCENARIOS
  // 역사적 2022-2025 평균 반응 기반 (당일 종가 기준)
  // ─────────────────────────────────────────────────────────────

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
        action:   'Historically, NVDA beats: historical gains in AMD, AVGO, SMCI — entire AI semiconductor complex rallies',
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
        action:   'Historically, NVDA misses: pressure on AI names (AMD, SMCI, AVGO) — sector contagion is real',
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
        action:   'Historically, AAPL beats lifted QQQ meaningfully — largest index weight, modest upside',
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
        action:   'Historically, AAPL misses: weakness in QQQ exposure, trim Apple suppliers (QCOM, AVGO)',
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
        action:   'Historically, MSFT beats: gains in to cloud/AI names (GOOGL, AMZN, CRM)',
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
        action:   'Historically, MSFT misses: pressure on cloud names, Azure miss is a sector-wide warning',
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
        action:   'Historically, META beats: gains in to digital ad names (GOOGL, SNAP, TTD)',
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
        action:   'Historically, META misses: exit digital ad positions — sector selloff can be severe',
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
        action:   'Historically, TSLA beats: gains in to EV/energy storage names, Musk sentiment plays',
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
        action:   'Historically, TSLA misses: pressure on EV names — margin pressure is the biggest risk',
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
        action:   'Historically, GOOGL beats: historical gains in META and digital ad names — sector rising tide',
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
        action:   'Historically, GOOGL misses: weakness in digital ad exposure — cloud + ad slowdown signal',
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
        action:   'Historically, AMZN beats: gains in to cloud names (MSFT, GOOGL) — AWS momentum confirms cycle',
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
        action:   'Historically, AMZN misses: pressure on cloud stocks — AWS miss is a broad enterprise spending signal',
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

  // ── AVGO (Broadcom) — AI ASIC + networking, ~4% QQQ weight ───
  {
    match: /\bAVGO\b.*earnings|\bBroadcom\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+8 to +15%', qqqLabel: 'AVGO', spy: '+0.3 to +0.7%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'AI custom ASIC (XPU) revenue beat confirms hyperscaler capex cycle.',
        action: 'Historically, AVGO beats: gains in MRVL, CSCO — AI networking complex rallies',
        stocks: [
          { symbol: 'MRVL', move: '+4 to +8%' }, { symbol: 'CSCO', move: '+2 to +4%' },
          { symbol: 'NVDA', move: '+1 to +3%' },  { symbol: 'INTC', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -12%', qqqLabel: 'AVGO', spy: '-0.3 to -0.6%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'AI ASIC demand miss raises hyperscaler spending caution.',
        action: 'Historically, AVGO misses: pressure on MRVL, CSCO — capex cycle concern spreads',
        stocks: [
          { symbol: 'MRVL', move: '-4 to -8%' }, { symbol: 'CSCO', move: '-2 to -4%' },
          { symbol: 'NVDA', move: '-1 to -3%' },  { symbol: 'AMD',  move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── AMD — Data center GPU + EPYC CPU ─────────────────────────
  {
    match: /\bAMD\b.*earnings|Advanced Micro.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'AMD', spy: '+0.2 to +0.5%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Data center GPU (MI300) beat challenges NVDA dominance narrative.',
        action: 'Historically, AMD beats: stability in NVDA, add MRVL — second-source AI chip play confirmed',
        stocks: [
          { symbol: 'NVDA', move: '-0.5 to +1%' }, { symbol: 'INTC', move: '+1 to +3%' },
          { symbol: 'QCOM', move: '+1 to +2%' },    { symbol: 'MRVL', move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'AMD', spy: '-0.2 to -0.5%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'GPU demand miss = NVDA beneficiary, AMD market share concern.',
        action: 'Historically, AMD misses: pressure on AMD, NVDA held up better — clear winner in AI GPU race',
        stocks: [
          { symbol: 'NVDA', move: '+0.5 to +2%' }, { symbol: 'INTC', move: '-1 to -3%' },
          { symbol: 'QCOM', move: '-1 to -2%' },    { symbol: 'MRVL', move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── MU (Micron) — Memory cycle bellwether ────────────────────
  {
    match: /\bMU\b.*earnings|\bMicron\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+10 to +18%', qqqLabel: 'MU', spy: '+0.2 to +0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Memory pricing recovery + HBM (AI memory) demand signals cycle upturn.',
        action: 'Historically, MU beats: broad strength across memory cycle — DRAM recovery benefits all semis',
        stocks: [
          { symbol: 'NVDA', move: '+1 to +3%' }, { symbol: 'INTC', move: '+1 to +2%' },
          { symbol: 'AMAT', move: '+2 to +4%' }, { symbol: 'LRCX', move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-10 to -18%', qqqLabel: 'MU', spy: '-0.2 to -0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Memory oversupply or pricing weakness signals broader semi capex caution.',
        action: 'Historically, MU misses: weakness in semi equipment names — capex cuts follow demand miss',
        stocks: [
          { symbol: 'AMAT', move: '-3 to -6%' }, { symbol: 'LRCX', move: '-3 to -6%' },
          { symbol: 'KLAC', move: '-2 to -5%' }, { symbol: 'INTC', move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── QCOM (Qualcomm) — Mobile chipset + licensing ─────────────
  {
    match: /\bQCOM\b.*earnings|\bQualcomm\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'QCOM', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Snapdragon AI chip demand + handset recovery signals mobile cycle upturn.',
        action: 'Historically, QCOM beats: gains in AAPL suppliers — mobile recovery is broad',
        stocks: [
          { symbol: 'AAPL', move: '+0.5 to +1.5%' }, { symbol: 'MRVL', move: '+1 to +3%' },
          { symbol: 'AVGO', move: '+1 to +2%' },      { symbol: 'AMD',  move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-8 to -12%', qqqLabel: 'QCOM', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Smartphone demand miss or China headwinds signal mobile cycle weakness.',
        action: 'Historically, QCOM misses: pressure on mobile stocks — handset cycle turning negative',
        stocks: [
          { symbol: 'AAPL', move: '-0.5 to -1.5%' }, { symbol: 'MRVL', move: '-1 to -2%' },
          { symbol: 'AVGO', move: '-1 to -2%' },      { symbol: 'INTC', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── TXN (Texas Instruments) — Industrial/auto cycle indicator ─
  {
    match: /\bTXN\b.*earnings|Texas Instruments.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +7%', qqqLabel: 'TXN', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Industrial/auto analog demand beat = broad economy is re-stocking.',
        action: 'Historically, TXN beats: gains in industrial semis (ADI, ON) — cycle inflection signal',
        stocks: [
          { symbol: 'ADI',  move: '+2 to +4%' }, { symbol: 'ON',   move: '+2 to +5%' },
          { symbol: 'MCHP', move: '+2 to +4%' }, { symbol: 'STM',  move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-5 to -10%', qqqLabel: 'TXN', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'TXN miss = industrial/auto demand soft — watch for inventory digestion.',
        action: 'Historically, TXN misses: weakness in industrial semis — cycle still in digestion phase',
        stocks: [
          { symbol: 'ADI',  move: '-2 to -4%' }, { symbol: 'ON',   move: '-3 to -6%' },
          { symbol: 'MCHP', move: '-2 to -4%' }, { symbol: 'STM',  move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── INTC (Intel) — Turnaround story, market share pressure ───
  {
    match: /\bINTC\b.*earnings|\bIntel\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +8%', qqqLabel: 'INTC', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Foundry progress + PC/server market share stabilization beats low bar.',
        action: 'Historically, INTC beats: market share stabilizing — modest upside, stay cautious on size',
        stocks: [
          { symbol: 'AMD',  move: '-1 to -2%' },  { symbol: 'QCOM', move: '+0.5 to +1%' },
          { symbol: 'AVGO', move: '+0.5 to +1%' }, { symbol: 'AMAT', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'INTC', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Continued market share loss to AMD/ARM or foundry delays punished hard.',
        action: 'Historically, INTC misses: rotation toward AMD — market share loss accelerates narrative',
        stocks: [
          { symbol: 'AMD',  move: '+1 to +3%' },  { symbol: 'QCOM', move: '-0.5 to -1%' },
          { symbol: 'AMAT', move: '-1 to -2%' }, { symbol: 'MRVL', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── AMAT (Applied Materials) — Semi equipment leader ─────────
  {
    match: /\bAMAT\b.*earnings|Applied Materials.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'AMAT', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Equipment orders beat = fab expansion cycle accelerating.',
        action: 'Historically, AMAT beats: gains in semi equipment (LRCX, KLAC) — capex cycle confirmed',
        stocks: [
          { symbol: 'LRCX', move: '+3 to +6%' }, { symbol: 'KLAC', move: '+2 to +5%' },
          { symbol: 'ASML', move: '+2 to +4%' }, { symbol: 'MU',   move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-6 to -12%', qqqLabel: 'AMAT', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Equipment orders miss = fab capex pullback, cycle concerns.',
        action: 'Historically, AMAT misses: weakness in semi equipment stocks — cycle peaking concern',
        stocks: [
          { symbol: 'LRCX', move: '-3 to -7%' }, { symbol: 'KLAC', move: '-2 to -5%' },
          { symbol: 'ASML', move: '-2 to -5%' }, { symbol: 'MU',   move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── LRCX (Lam Research) ───────────────────────────────────────
  {
    match: /\bLRCX\b.*earnings|Lam Research.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'LRCX', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Etch/deposition equipment beat = memory and logic fabs investing.',
        action: 'Historically, LRCX beats: gains in AMAT, KLAC — equipment cycle rising together',
        stocks: [
          { symbol: 'AMAT', move: '+3 to +5%' }, { symbol: 'KLAC', move: '+2 to +4%' },
          { symbol: 'ASML', move: '+2 to +3%' }, { symbol: 'MU',   move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-6 to -12%', qqqLabel: 'LRCX', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Equipment bookings miss = memory/logic fab caution.',
        action: 'Historically, LRCX misses: pressure on semi equipment — capex cycle softening',
        stocks: [
          { symbol: 'AMAT', move: '-3 to -5%' }, { symbol: 'KLAC', move: '-2 to -4%' },
          { symbol: 'ASML', move: '-2 to -3%' }, { symbol: 'MU',   move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── KLAC (KLA Corp) ───────────────────────────────────────────
  {
    match: /\bKLAC\b.*earnings|\bKLA\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+4 to +8%', qqqLabel: 'KLAC', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Process control equipment demand beat = advanced node investment ongoing.',
        action: 'Historically, KLAC beats: semi equipment cycle intact — hold AMAT, LRCX',
        stocks: [
          { symbol: 'AMAT', move: '+2 to +4%' }, { symbol: 'LRCX', move: '+2 to +4%' },
          { symbol: 'ASML', move: '+1 to +3%' }, { symbol: 'NVDA', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-5 to -10%', qqqLabel: 'KLAC', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Inspection demand miss signals fab investment slowdown.',
        action: 'Historically, KLAC misses: weakness in semi equipment — advanced node investment stalling',
        stocks: [
          { symbol: 'AMAT', move: '-2 to -4%' }, { symbol: 'LRCX', move: '-2 to -4%' },
          { symbol: 'ASML', move: '-1 to -3%' }, { symbol: 'MU',   move: '-1 to -3%' },
        ],
      },
    },
  },

  // ── ASML — EUV lithography monopoly ──────────────────────────
  {
    match: /\bASML\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'ASML', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'EUV bookings beat = TSMC/Samsung/Intel advanced node expansion.',
        action: 'Historically, ASML beats: broad gains in the semi equipment complex — EUV drives next nodes',
        stocks: [
          { symbol: 'AMAT', move: '+2 to +4%' }, { symbol: 'LRCX', move: '+2 to +4%' },
          { symbol: 'TSM',  move: '+1 to +3%' }, { symbol: 'NVDA', move: '+0.5 to +1.5%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'ASML', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Booking miss raises advanced node timeline risk for all chip makers.',
        action: 'Historically, ASML misses: broad weakness in semi stocks — EUV delay pushes back AI chip roadmap',
        stocks: [
          { symbol: 'AMAT', move: '-3 to -5%' }, { symbol: 'LRCX', move: '-3 to -5%' },
          { symbol: 'TSM',  move: '-2 to -4%' }, { symbol: 'NVDA', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── SNPS (Synopsys) — EDA software ───────────────────────────
  {
    match: /\bSNPS\b.*earnings|\bSynopsys\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +8%', qqqLabel: 'SNPS', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'EDA software demand beat = chip design activity at capacity.',
        action: 'Historically, SNPS beats: gains in CDNS — EDA duopoly both benefit from chip design boom',
        stocks: [
          { symbol: 'CDNS', move: '+2 to +5%' }, { symbol: 'ARM',  move: '+1 to +3%' },
          { symbol: 'NVDA', move: '+0.5 to +1%' }, { symbol: 'AMD', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-4 to -10%', qqqLabel: 'SNPS', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Chip design slowdown = future semiconductor supply chain concern.',
        action: 'Historically, SNPS misses: pressure on CDNS — design activity slowing ahead of next cycle',
        stocks: [
          { symbol: 'CDNS', move: '-2 to -5%' }, { symbol: 'ARM',  move: '-1 to -3%' },
          { symbol: 'INTC', move: '-1 to -2%' }, { symbol: 'MRVL', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── CDNS (Cadence) — EDA software ────────────────────────────
  {
    match: /\bCDNS\b.*earnings|\bCadence\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +8%', qqqLabel: 'CDNS', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'EDA/IP licensing beat confirms chip design boom continues.',
        action: 'Historically, CDNS beats: gains in SNPS — EDA duopoly benefiting from AI chip complexity',
        stocks: [
          { symbol: 'SNPS', move: '+2 to +5%' }, { symbol: 'ARM',  move: '+1 to +3%' },
          { symbol: 'NVDA', move: '+0.5 to +1%' }, { symbol: 'AMD', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-4 to -10%', qqqLabel: 'CDNS', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'License miss signals chip design activity cooling.',
        action: 'Historically, CDNS misses: pressure on SNPS and semi capex names',
        stocks: [
          { symbol: 'SNPS', move: '-2 to -5%' }, { symbol: 'ARM',  move: '-1 to -3%' },
          { symbol: 'INTC', move: '-1 to -2%' }, { symbol: 'MRVL', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── ON (ON Semiconductor) — EV/industrial chips ──────────────
  {
    match: /\bON\b.*earnings|ON Semiconductor.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+4 to +8%', qqqLabel: 'ON', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'SiC power chips for EV beat = EV adoption recovery signal.',
        action: 'Historically, ON beats: gains in EV supply chain — SiC demand confirms EV recovery',
        stocks: [
          { symbol: 'STM',  move: '+2 to +5%' }, { symbol: 'TXN',  move: '+1 to +3%' },
          { symbol: 'TSLA', move: '+1 to +2%' }, { symbol: 'ADI',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'ON', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'EV demand miss or SiC pricing weakness = auto/industrial cycle concern.',
        action: 'Historically, ON misses: weakness in EV supply chain — auto cycle still correcting',
        stocks: [
          { symbol: 'STM',  move: '-3 to -6%' }, { symbol: 'TXN',  move: '-1 to -3%' },
          { symbol: 'TSLA', move: '-0.5 to -1.5%' }, { symbol: 'ADI', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── MRVL (Marvell) — AI networking / custom ASICs ────────────
  {
    match: /\bMRVL\b.*earnings|\bMarvell\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+8 to +15%', qqqLabel: 'MRVL', spy: '+0.2 to +0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'AI custom silicon (XPU) and data center interconnect beat = AI buildout.',
        action: 'Historically, MRVL beats: gains in AVGO, CSCO — AI networking complex confirmed',
        stocks: [
          { symbol: 'AVGO', move: '+3 to +6%' }, { symbol: 'CSCO', move: '+2 to +4%' },
          { symbol: 'AMD',  move: '+1 to +3%' }, { symbol: 'NVDA', move: '+0.5 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'MRVL', spy: '-0.2 to -0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'AI custom chip miss = hyperscaler spending pullback risk.',
        action: 'Historically, MRVL misses: pressure on AVGO, uncertainty around CSCO — AI networking spend in question',
        stocks: [
          { symbol: 'AVGO', move: '-3 to -6%' }, { symbol: 'CSCO', move: '-2 to -4%' },
          { symbol: 'AMD',  move: '-1 to -3%' }, { symbol: 'NVDA', move: '-0.5 to -2%' },
        ],
      },
    },
  },

  // ── ARM — AI chip architecture licensing ─────────────────────
  {
    match: /\bARM\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+10 to +20%', qqqLabel: 'ARM', spy: '+0.2 to +0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Royalty revenue beat = AI/mobile chip adoption exceeding expectations.',
        action: 'Historically, ARM beats: gains in QCOM, NVDA — ARM architecture powering AI edge devices',
        stocks: [
          { symbol: 'QCOM', move: '+2 to +5%' }, { symbol: 'NVDA', move: '+1 to +3%' },
          { symbol: 'AAPL', move: '+0.5 to +1.5%' }, { symbol: 'SNPS', move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-10 to -20%', qqqLabel: 'ARM', spy: '-0.2 to -0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Royalty miss = AI chip proliferation slower than priced in.',
        action: 'Historically, ARM misses: pressure on the AI chip ecosystem — adoption pace disappointing',
        stocks: [
          { symbol: 'QCOM', move: '-2 to -5%' }, { symbol: 'NVDA', move: '-1 to -2%' },
          { symbol: 'SNPS', move: '-2 to -4%' }, { symbol: 'CDNS', move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── ADBE (Adobe) — Creative + Document AI ────────────────────
  {
    match: /\bADBE\b.*earnings|\bAdobe\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'ADBE', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Firefly AI monetization + Creative Cloud retention beats disruption fears.',
        action: 'Historically, ADBE beats: AI disruption narrative fading — add creative software names',
        stocks: [
          { symbol: 'CRM',  move: '+1 to +2%' }, { symbol: 'NOW',  move: '+1 to +2%' },
          { symbol: 'INTU', move: '+1 to +2%' }, { symbol: 'MSFT', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-10 to -20%', qqqLabel: 'ADBE', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Subscriber churn or Firefly miss revives AI disruption fears strongly.',
        action: 'Historically, ADBE misses: AI disruption narrative returns — reduce creative software',
        stocks: [
          { symbol: 'CRM',  move: '-1 to -3%' }, { symbol: 'NOW',  move: '-1 to -2%' },
          { symbol: 'INTU', move: '-1 to -2%' }, { symbol: 'TEAM', move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── PANW (Palo Alto) — Cybersecurity platform ────────────────
  {
    match: /\bPANW\b.*earnings|Palo Alto.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'PANW', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Platformization deal wins confirm cybersecurity consolidation trend.',
        action: 'Historically, PANW beats: gains in CRWD, ZS — cyber budgets are growing not shrinking',
        stocks: [
          { symbol: 'CRWD', move: '+2 to +5%' }, { symbol: 'ZS',   move: '+2 to +5%' },
          { symbol: 'FTNT', move: '+2 to +4%' }, { symbol: 'S',    move: '+3 to +6%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'PANW', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Platform deal slowdown raises enterprise IT budget concern.',
        action: 'Historically, PANW misses: weakness in cybersecurity stocks — consolidation pace slower',
        stocks: [
          { symbol: 'CRWD', move: '-2 to -5%' }, { symbol: 'ZS',   move: '-2 to -5%' },
          { symbol: 'FTNT', move: '-2 to -4%' }, { symbol: 'S',    move: '-3 to -6%' },
        ],
      },
    },
  },

  // ── CRM (Salesforce) — Enterprise CRM / Agentforce AI ────────
  {
    match: /\bCRM\b.*earnings|\bSalesforce\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'CRM', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Agentforce AI + enterprise seat expansion beats IT spending concerns.',
        action: 'Historically, CRM beats: gains in enterprise software (NOW, WDAY) — budgets unfreezing',
        stocks: [
          { symbol: 'NOW',  move: '+2 to +4%' }, { symbol: 'WDAY', move: '+2 to +4%' },
          { symbol: 'HUBS', move: '+2 to +4%' }, { symbol: 'MSFT', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'CRM', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Seat growth miss or deal length elongation = enterprise spending caution.',
        action: 'Historically, CRM misses: weakness in enterprise software — IT budget freeze spreading',
        stocks: [
          { symbol: 'NOW',  move: '-2 to -4%' }, { symbol: 'WDAY', move: '-2 to -4%' },
          { symbol: 'HUBS', move: '-2 to -4%' }, { symbol: 'ADBE', move: '-1 to -3%' },
        ],
      },
    },
  },

  // ── NOW (ServiceNow) — Enterprise workflow AI ─────────────────
  {
    match: /\bNOW\b.*earnings|\bServiceNow\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'NOW', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'AI workflow automation beats confirm enterprise AI ROI is real.',
        action: 'Historically, NOW beats: gains in CRM, WDAY — AI in enterprise = compounding moat',
        stocks: [
          { symbol: 'CRM',  move: '+2 to +4%' }, { symbol: 'WDAY', move: '+2 to +4%' },
          { symbol: 'SAP',  move: '+1 to +2%' }, { symbol: 'MSFT', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-5 to -10%', qqqLabel: 'NOW', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Renewal rate or new logo miss = enterprise AI adoption slower than hoped.',
        action: 'Historically, NOW misses: pressure on enterprise software — deal cycle elongating',
        stocks: [
          { symbol: 'CRM',  move: '-2 to -3%' }, { symbol: 'WDAY', move: '-2 to -3%' },
          { symbol: 'HUBS', move: '-1 to -3%' }, { symbol: 'ADBE', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── INTU (Intuit) — Tax / SMB finance software ───────────────
  {
    match: /\bINTU\b.*earnings|\bIntuit\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'INTU', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'TurboTax/QuickBooks AI growth confirms SMB software resilience.',
        action: 'Historically, INTU beats: gains in SMB software names — small business AI adoption real',
        stocks: [
          { symbol: 'HUBS', move: '+2 to +4%' }, { symbol: 'BILL', move: '+3 to +6%' },
          { symbol: 'PAYC', move: '+2 to +4%' }, { symbol: 'CRM',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-5 to -12%', qqqLabel: 'INTU', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'SMB spending miss or AI cannibalization concern raises forward risk.',
        action: 'Historically, INTU misses: weakness in SMB software — small business budget caution',
        stocks: [
          { symbol: 'HUBS', move: '-2 to -4%' }, { symbol: 'BILL', move: '-3 to -6%' },
          { symbol: 'PAYC', move: '-2 to -4%' }, { symbol: 'CRM',  move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── TEAM (Atlassian) — Dev tools / collaboration ─────────────
  {
    match: /\bTEAM\b.*earnings|\bAtlassian\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'TEAM', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Cloud migration + developer seat expansion beats low expectations.',
        action: 'Historically, TEAM beats: gains in dev-tool SaaS (DDOG, HUBS) — cloud migration ongoing',
        stocks: [
          { symbol: 'DDOG', move: '+2 to +5%' }, { symbol: 'HUBS', move: '+2 to +4%' },
          { symbol: 'MSFT', move: '+0.5 to +1%' }, { symbol: 'CRM', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-10 to -20%', qqqLabel: 'TEAM', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Developer seat churn = tech hiring freeze still biting.',
        action: 'Historically, TEAM misses: weakness in dev-tool SaaS — IT headcount cuts still ongoing',
        stocks: [
          { symbol: 'DDOG', move: '-2 to -5%' }, { symbol: 'HUBS', move: '-2 to -4%' },
          { symbol: 'ZS',   move: '-1 to -3%' }, { symbol: 'CRWD', move: '-1 to -3%' },
        ],
      },
    },
  },

  // ── WDAY (Workday) — HR/Finance enterprise SaaS ──────────────
  {
    match: /\bWDAY\b.*earnings|\bWorkday\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'WDAY', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'HR/Finance cloud subscription beat = enterprises upgrading back-office.',
        action: 'Historically, WDAY beats: gains in enterprise HR software — cloud migration still early',
        stocks: [
          { symbol: 'CRM',  move: '+1 to +3%' }, { symbol: 'NOW',  move: '+1 to +3%' },
          { symbol: 'INTU', move: '+1 to +2%' }, { symbol: 'SAP',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'WDAY', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Deal elongation = enterprise IT budget freeze spreading.',
        action: 'Historically, WDAY misses: weakness in enterprise SaaS — deal cycles getting longer',
        stocks: [
          { symbol: 'CRM',  move: '-1 to -3%' }, { symbol: 'NOW',  move: '-1 to -3%' },
          { symbol: 'INTU', move: '-1 to -2%' }, { symbol: 'HUBS', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── SNOW (Snowflake) — High-multiple cloud data ───────────────
  {
    match: /\bSNOW\b.*earnings|\bSnowflake\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+8 to +15%', qqqLabel: 'SNOW', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Consumption revenue beat = AI data pipeline spending accelerating.',
        action: 'Historically, SNOW beats: gains in high-multiple data names (DDOG, MDB) — AI data demand',
        stocks: [
          { symbol: 'DDOG', move: '+3 to +6%' }, { symbol: 'DBX',  move: '+2 to +4%' },
          { symbol: 'CRM',  move: '+1 to +2%' }, { symbol: 'MSFT', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-15 to -25%', qqqLabel: 'SNOW', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Consumption miss = cloud data spend optimized or AI workloads elsewhere.',
        action: 'Historically, SNOW misses: weakness in cloud data platform names — consumption cycle caution',
        stocks: [
          { symbol: 'DDOG', move: '-3 to -7%' }, { symbol: 'MDB',  move: '-3 to -7%' },
          { symbol: 'CRM',  move: '-1 to -2%' }, { symbol: 'NOW',  move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── ZS (Zscaler) — Zero-trust cloud security ─────────────────
  {
    match: /\bZS\b.*earnings|\bZscaler\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'ZS', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Zero-trust deal wins = enterprises accelerating cloud security migration.',
        action: 'Historically, ZS beats: gains in CRWD, PANW — zero-trust adoption driving entire sector',
        stocks: [
          { symbol: 'CRWD', move: '+2 to +5%' }, { symbol: 'PANW', move: '+2 to +4%' },
          { symbol: 'S',    move: '+3 to +6%' }, { symbol: 'FTNT', move: '+1 to +3%' },
        ],
      },
      cool: {
        qqq: '-10 to -18%', qqqLabel: 'ZS', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Deal slippage = enterprise zero-trust budgets being cut or delayed.',
        action: 'Historically, ZS misses: pressure on cybersecurity stocks — enterprise security budgets under pressure',
        stocks: [
          { symbol: 'CRWD', move: '-2 to -5%' }, { symbol: 'PANW', move: '-2 to -4%' },
          { symbol: 'S',    move: '-3 to -6%' }, { symbol: 'FTNT', move: '-1 to -3%' },
        ],
      },
    },
  },

  // ── CRWD (CrowdStrike) — Endpoint + AI security ──────────────
  {
    match: /\bCRWD\b.*earnings|\bCrowdStrike\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +15%', qqqLabel: 'CRWD', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'ARR growth + customer win-back (post-outage) exceeds expectations.',
        action: 'Historically, CRWD beats: outage impact fully absorbed — add ZS, PANW',
        stocks: [
          { symbol: 'ZS',   move: '+2 to +5%' }, { symbol: 'PANW', move: '+2 to +4%' },
          { symbol: 'S',    move: '+3 to +6%' }, { symbol: 'FTNT', move: '+1 to +3%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'CRWD', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Customer churn or NRR miss = outage reputational damage still lingering.',
        action: 'Historically, CRWD misses: weakness in endpoint security stocks — customer trust still at risk',
        stocks: [
          { symbol: 'ZS',   move: '-2 to -4%' }, { symbol: 'PANW', move: '-2 to -4%' },
          { symbol: 'S',    move: '-3 to -5%' }, { symbol: 'FTNT', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── DDOG (Datadog) — Observability / cloud monitoring ────────
  {
    match: /\bDDOG\b.*earnings|\bDatadog\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +15%', qqqLabel: 'DDOG', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Cloud workload growth + AI observability demand beats optimization fears.',
        action: 'Historically, DDOG beats: gains in SNOW, MDB — cloud spend recovery, optimization done',
        stocks: [
          { symbol: 'SNOW', move: '+3 to +6%' }, { symbol: 'MDB',  move: '+2 to +5%' },
          { symbol: 'TEAM', move: '+2 to +4%' }, { symbol: 'CRM',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -18%', qqqLabel: 'DDOG', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Consumption miss = cloud optimization still ongoing, AI workloads not replacing.',
        action: 'Historically, DDOG misses: weakness in cloud-native SaaS — optimization cycle extended',
        stocks: [
          { symbol: 'SNOW', move: '-3 to -6%' }, { symbol: 'MDB',  move: '-2 to -5%' },
          { symbol: 'TEAM', move: '-2 to -4%' }, { symbol: 'ZS',   move: '-1 to -3%' },
        ],
      },
    },
  },

  // ── HUBS (HubSpot) — SMB marketing/CRM ───────────────────────
  {
    match: /\bHUBS\b.*earnings|\bHubSpot\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'HUBS', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'SMB seat growth + AI Breeze adoption beats small business spend concern.',
        action: 'Historically, HUBS beats: gains in INTU, CRM — SMB software budgets resilient',
        stocks: [
          { symbol: 'INTU', move: '+2 to +4%' }, { symbol: 'CRM',  move: '+1 to +3%' },
          { symbol: 'BILL', move: '+2 to +4%' }, { symbol: 'WDAY', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'HUBS', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'SMB churn spike = small businesses cutting software — macro concern.',
        action: 'Historically, HUBS misses: weakness in SMB software — small business stress signal',
        stocks: [
          { symbol: 'INTU', move: '-2 to -4%' }, { symbol: 'CRM',  move: '-1 to -2%' },
          { symbol: 'BILL', move: '-2 to -4%' }, { symbol: 'WDAY', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── TTD (The Trade Desk) — Programmatic advertising ──────────
  {
    match: /\bTTD\b.*earnings|Trade Desk.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+10 to +20%', qqqLabel: 'TTD', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'CTV/programmatic ad spend beat = brands increasing digital ad budgets.',
        action: 'Historically, TTD beats: gains in META, GOOGL — programmatic recovery is a sector tide',
        stocks: [
          { symbol: 'META', move: '+2 to +4%' }, { symbol: 'GOOGL', move: '+1 to +3%' },
          { symbol: 'MGNI', move: '+5 to +10%' }, { symbol: 'PUBM', move: '+4 to +8%' },
        ],
      },
      cool: {
        qqq: '-15 to -25%', qqqLabel: 'TTD', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'CTV ad spend miss or market share loss to Google/Amazon DSPs.',
        action: 'Historically, TTD misses: weakness in digital ad stocks — brand budgets pulling back',
        stocks: [
          { symbol: 'META',  move: '-2 to -5%' }, { symbol: 'GOOGL', move: '-1 to -2%' },
          { symbol: 'MGNI',  move: '-5 to -12%' }, { symbol: 'PUBM', move: '-4 to -8%' },
        ],
      },
    },
  },

  // ── COST (Costco) — Defensive consumer staple ────────────────
  {
    match: /\bCOST\b.*earnings|\bCostco\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+2 to +5%', qqqLabel: 'COST', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Membership renewal + traffic beat = consumers trading down into value.',
        action: 'Historically, COST beats: consumer is resilient — modest upside, defensive positioning',
        stocks: [
          { symbol: 'WMT',  move: '+0.5 to +1.5%' }, { symbol: 'TGT',  move: '+0.5 to +1.5%' },
          { symbol: 'AMZN', move: '+0.3 to +0.8%' }, { symbol: 'KR',   move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-3 to -7%', qqqLabel: 'COST', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Membership softness = even value consumers pulling back — macro concern.',
        action: 'Historically, COST misses: consumer stress signal — defensive names historically held up better',
        stocks: [
          { symbol: 'WMT',  move: '-0.5 to -1.5%' }, { symbol: 'TGT',  move: '-1 to -3%' },
          { symbol: 'AMZN', move: '-0.5 to -1%' },   { symbol: 'DG',   move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── NFLX (Netflix) — Streaming / ad-tier growth ──────────────
  {
    match: /\bNFLX\b.*earnings|\bNetflix\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+8 to +15%', qqqLabel: 'NFLX', spy: '+0.2 to +0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Subscriber growth + ad-tier revenue beat confirms streaming dominance.',
        action: 'Historically, NFLX beats: gains in streaming/media names — ad-tier model is working',
        stocks: [
          { symbol: 'DIS',  move: '+1 to +3%' }, { symbol: 'PARA', move: '+2 to +5%' },
          { symbol: 'WBD',  move: '+2 to +4%' }, { symbol: 'SPOT', move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-10 to -18%', qqqLabel: 'NFLX', spy: '-0.2 to -0.4%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Churn above estimates or ad revenue miss raises streaming model concern.',
        action: 'Historically, NFLX misses: weakness in streaming stocks — subscriber growth decelerating',
        stocks: [
          { symbol: 'DIS',  move: '-1 to -3%' }, { symbol: 'PARA', move: '-2 to -5%' },
          { symbol: 'WBD',  move: '-2 to -4%' }, { symbol: 'SPOT', move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── ABNB (Airbnb) — Travel/experiences marketplace ───────────
  {
    match: /\bABNB\b.*earnings|\bAirbnb\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'ABNB', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Nights booked + ADR beat = travel demand still strong post-normalization.',
        action: 'Historically, ABNB beats: gains in travel names (BKNG, UBER) — experience spending solid',
        stocks: [
          { symbol: 'BKNG', move: '+2 to +4%' }, { symbol: 'EXPE', move: '+3 to +6%' },
          { symbol: 'UBER', move: '+1 to +3%' }, { symbol: 'HLT',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'ABNB', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Nights booked or pricing miss = travel demand normalizing lower.',
        action: 'Historically, ABNB misses: pressure on travel/leisure stocks — demand normalization ongoing',
        stocks: [
          { symbol: 'BKNG', move: '-2 to -4%' }, { symbol: 'EXPE', move: '-3 to -6%' },
          { symbol: 'UBER', move: '-1 to -2%' }, { symbol: 'MAR',  move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── BKNG (Booking Holdings) — Global OTA ─────────────────────
  {
    match: /\bBKNG\b.*earnings|\bBooking\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'BKNG', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Room nights and gross bookings beat = international travel still robust.',
        action: 'Historically, BKNG beats: gains in ABNB, EXPE — global travel recovery intact',
        stocks: [
          { symbol: 'ABNB', move: '+2 to +4%' }, { symbol: 'EXPE', move: '+2 to +4%' },
          { symbol: 'UBER', move: '+1 to +2%' }, { symbol: 'HLT',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-5 to -10%', qqqLabel: 'BKNG', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Take rate pressure or booking volume miss = travel spend peaking.',
        action: 'Historically, BKNG misses: weakness in online travel — normalization trade is over',
        stocks: [
          { symbol: 'ABNB', move: '-2 to -4%' }, { symbol: 'EXPE', move: '-2 to -4%' },
          { symbol: 'UBER', move: '-1 to -2%' }, { symbol: 'MAR',  move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── PYPL (PayPal) — Fintech turnaround ───────────────────────
  {
    match: /\bPYPL\b.*earnings|\bPayPal\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +10%', qqqLabel: 'PYPL', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'TPV growth + branded checkout share gain beats low turnaround expectations.',
        action: 'Historically, PYPL beats: gains in SQ, AFRM — fintech turnaround gaining credibility',
        stocks: [
          { symbol: 'SQ',   move: '+2 to +5%' }, { symbol: 'AFRM', move: '+3 to +7%' },
          { symbol: 'V',    move: '+0.5 to +1%' }, { symbol: 'MA',  move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'PYPL', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Active account stagnation or margin miss = turnaround thesis in doubt.',
        action: 'Historically, PYPL misses: weakness in legacy fintech — platform moat eroding to Apple Pay / Stripe',
        stocks: [
          { symbol: 'SQ',   move: '-2 to -4%' }, { symbol: 'AFRM', move: '-3 to -6%' },
          { symbol: 'V',    move: '-0.3 to -0.8%' }, { symbol: 'MA', move: '-0.3 to -0.8%' },
        ],
      },
    },
  },

  // ── EBAY — Mature marketplace ─────────────────────────────────
  {
    match: /\bEBAY\b.*earnings|\beBay\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +7%', qqqLabel: 'EBAY', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'GMV stabilization + Focus categories beat shows managed decline slowing.',
        action: 'Historically, EBAY beats: mature marketplace floor confirmed — modest hold',
        stocks: [
          { symbol: 'AMZN', move: '+0.3 to +0.5%' }, { symbol: 'ETSY', move: '+1 to +3%' },
          { symbol: 'PYPL', move: '+0.5 to +1%' },   { symbol: 'SQ',   move: '+0.3 to +0.8%' },
        ],
      },
      cool: {
        qqq: '-5 to -10%', qqqLabel: 'EBAY', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'GMV decline accelerating = consumer spending on discretionary items soft.',
        action: 'Historically, EBAY misses: consumer discretionary stress signal — reduce exposure',
        stocks: [
          { symbol: 'ETSY', move: '-2 to -4%' }, { symbol: 'PYPL', move: '-0.5 to -1.5%' },
          { symbol: 'AMZN', move: '-0.3 to -0.8%' }, { symbol: 'SQ', move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── AMGN (Amgen) — Large-cap biotech ─────────────────────────
  {
    match: /\bAMGN\b.*earnings|\bAmgen\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +7%', qqqLabel: 'AMGN', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Obesity drug (Maritide) or biosimilar sales beat key pipeline milestones.',
        action: 'Historically, AMGN beats: large-cap biotech resilient — add GILD, REGN',
        stocks: [
          { symbol: 'GILD', move: '+1 to +2%' }, { symbol: 'REGN', move: '+1 to +2%' },
          { symbol: 'VRTX', move: '+1 to +2%' }, { symbol: 'BIIB', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-4 to -8%', qqqLabel: 'AMGN', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Biosimilar competition or pipeline miss reduces earnings visibility.',
        action: 'Historically, AMGN misses: rotation out of large-cap biotech — pipeline risk repriced',
        stocks: [
          { symbol: 'GILD', move: '-1 to -2%' }, { symbol: 'REGN', move: '-1 to -2%' },
          { symbol: 'ABBV', move: '-0.5 to -1%' }, { symbol: 'MRK', move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── GILD (Gilead) — HIV/oncology biotech ─────────────────────
  {
    match: /\bGILD\b.*earnings|\bGilead\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +7%', qqqLabel: 'GILD', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'HIV franchise stability + oncology (Trodelvy) pipeline beat.',
        action: 'Historically, GILD beats: defensive biotech with dividend — add AMGN, ABBV',
        stocks: [
          { symbol: 'AMGN', move: '+1 to +2%' }, { symbol: 'ABBV', move: '+0.5 to +1.5%' },
          { symbol: 'MRK',  move: '+0.5 to +1%' }, { symbol: 'BMY', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-4 to -8%', qqqLabel: 'GILD', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'HIV pricing pressure or oncology miss raises LT growth concern.',
        action: 'Historically, GILD misses: pressure on defensive biotech — pricing headwinds increasing',
        stocks: [
          { symbol: 'AMGN', move: '-0.5 to -1.5%' }, { symbol: 'ABBV', move: '-0.5 to -1%' },
          { symbol: 'BMY',  move: '-0.5 to -1%' },   { symbol: 'MRK',  move: '-0.3 to -0.8%' },
        ],
      },
    },
  },

  // ── BIIB (Biogen) — Alzheimer's pipeline ─────────────────────
  {
    match: /\bBIIB\b.*earnings|\bBiogen\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'BIIB', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Leqembi (Alzheimer\'s) uptake beat or pipeline milestone confirmation.',
        action: 'Historically, BIIB beats: Alzheimer\'s market opening — add REGN, VRTX',
        stocks: [
          { symbol: 'REGN', move: '+2 to +4%' }, { symbol: 'VRTX', move: '+1 to +3%' },
          { symbol: 'AMGN', move: '+1 to +2%' }, { symbol: 'LLY',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'BIIB', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Leqembi adoption slower than expected — high-risk pipeline dependency.',
        action: 'Historically, BIIB misses: weakness in CNS-focused biotech — Alzheimer\'s ramp disappointing',
        stocks: [
          { symbol: 'REGN', move: '-1 to -3%' }, { symbol: 'VRTX', move: '-1 to -2%' },
          { symbol: 'AMGN', move: '-0.5 to -1.5%' }, { symbol: 'LLY', move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── REGN (Regeneron) — Dupixent / eye/cancer drugs ───────────
  {
    match: /\bREGN\b.*earnings|\bRegeneron\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +8%', qqqLabel: 'REGN', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Dupixent global expansion beat confirms blockbuster multi-indication drug.',
        action: 'Historically, REGN beats: Dupixent flywheel intact — add VRTX, AMGN',
        stocks: [
          { symbol: 'VRTX', move: '+1 to +3%' }, { symbol: 'AMGN', move: '+1 to +2%' },
          { symbol: 'BIIB', move: '+1 to +2%' }, { symbol: 'LLY',  move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-4 to -10%', qqqLabel: 'REGN', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Dupixent competition or pricing pressure slows growth trajectory.',
        action: 'Historically, REGN misses: weakness in high-PE biotech — pricing risk is real for biologics',
        stocks: [
          { symbol: 'VRTX', move: '-1 to -2%' }, { symbol: 'AMGN', move: '-0.5 to -1.5%' },
          { symbol: 'BIIB', move: '-1 to -2%' }, { symbol: 'ABBV', move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── VRTX (Vertex) — CF / pain pipeline ───────────────────────
  {
    match: /\bVRTX\b.*earnings|\bVertex\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+4 to +10%', qqqLabel: 'VRTX', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Trikafta CF franchise + pain pipeline (suzetrigine) beat.',
        action: 'Historically, VRTX beats: specialty rare disease model working — add REGN, BIIB',
        stocks: [
          { symbol: 'REGN', move: '+1 to +3%' }, { symbol: 'BIIB', move: '+1 to +2%' },
          { symbol: 'MRNA', move: '+1 to +2%' }, { symbol: 'AMGN', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-5 to -12%', qqqLabel: 'VRTX', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Pain drug miss or CF label expansion delay reduces growth optionality.',
        action: 'Historically, VRTX misses: pressure on rare disease names — high-multiple needs pipeline delivery',
        stocks: [
          { symbol: 'REGN', move: '-1 to -2%' }, { symbol: 'BIIB', move: '-1 to -2%' },
          { symbol: 'MRNA', move: '-0.5 to -1.5%' }, { symbol: 'AMGN', move: '-0.3 to -1%' },
        ],
      },
    },
  },

  // ── MRNA (Moderna) — mRNA vaccine + cancer pipeline ──────────
  {
    match: /\bMRNA\b.*earnings|\bModerna\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +15%', qqqLabel: 'MRNA', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'RSV vaccine + flu mRNA pipeline beat reduces post-COVID revenue cliff risk.',
        action: 'Historically, MRNA beats: mRNA platform diversifying — add BNTX as comp',
        stocks: [
          { symbol: 'BNTX', move: '+3 to +7%' }, { symbol: 'PFE',  move: '+1 to +2%' },
          { symbol: 'NVS',  move: '+0.5 to +1%' }, { symbol: 'VRTX', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-10 to -20%', qqqLabel: 'MRNA', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'COVID revenue cliff steeper than expected + pipeline delays.',
        action: 'Historically, MRNA misses: platform diversification concerns — pressure on mRNA names',
        stocks: [
          { symbol: 'BNTX', move: '-3 to -7%' }, { symbol: 'PFE',  move: '-0.5 to -1.5%' },
          { symbol: 'VRTX', move: '-0.3 to -1%' }, { symbol: 'AMGN', move: '-0.2 to -0.5%' },
        ],
      },
    },
  },

  // ── ISRG (Intuitive Surgical) — Robotic surgery ──────────────
  {
    match: /\bISRG\b.*earnings|Intuitive Surgical.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+3 to +8%', qqqLabel: 'ISRG', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Procedure volume beat + da Vinci 5 placements confirm robotic surgery growth.',
        action: 'Historically, ISRG beats: surgical robotics runway long — add MDT, SYK',
        stocks: [
          { symbol: 'MDT', move: '+1 to +2%' }, { symbol: 'SYK', move: '+1 to +2%' },
          { symbol: 'ZBH', move: '+0.5 to +1.5%' }, { symbol: 'BSX', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-4 to -10%', qqqLabel: 'ISRG', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Hospital capex freeze or procedure softness = surgical volume concern.',
        action: 'Historically, ISRG misses: hospital capex still under pressure — reduce medical devices',
        stocks: [
          { symbol: 'MDT', move: '-0.5 to -1.5%' }, { symbol: 'SYK', move: '-0.5 to -1.5%' },
          { symbol: 'ZBH', move: '-0.5 to -1%' },   { symbol: 'BSX', move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── ORCL (Oracle) — Cloud database + AI infra ────────────────
  {
    match: /\bORCL\b.*earnings|\bOracle\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'ORCL', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'OCI (cloud) growth + AI training workloads beat — late-cycle cloud winner.',
        action: 'Historically, ORCL beats: enterprise cloud still has legs — add MSFT, AMZN',
        stocks: [
          { symbol: 'MSFT', move: '+0.5 to +1.5%' }, { symbol: 'AMZN', move: '+0.5 to +1%' },
          { symbol: 'CRM',  move: '+1 to +2%' },      { symbol: 'SAP',  move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-5 to -10%', qqqLabel: 'ORCL', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'OCI bookings miss = enterprise cloud migration slower than MSFT/AWS.',
        action: 'Historically, ORCL misses: preference for hyperscalers — OCI losing share in AI workloads',
        stocks: [
          { symbol: 'MSFT', move: '-0.3 to -0.8%' }, { symbol: 'AMZN', move: '-0.2 to -0.5%' },
          { symbol: 'CRM',  move: '-0.5 to -1.5%' }, { symbol: 'SAP',  move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── UBER — Ride-share + delivery margin expansion ────────────
  {
    match: /\bUBER\b.*earnings|\bUber\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'UBER', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Gross bookings + EBITDA margin expansion beat = platform leverage inflecting.',
        action: 'Historically, UBER beats: gains in LYFT — ride-share category expanding, not zero-sum',
        stocks: [
          { symbol: 'LYFT', move: '+3 to +7%' }, { symbol: 'ABNB', move: '+1 to +2%' },
          { symbol: 'BKNG', move: '+0.5 to +1.5%' }, { symbol: 'DASH', move: '+2 to +4%' },
        ],
      },
      cool: {
        qqq: '-8 to -15%', qqqLabel: 'UBER', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Driver cost spike or demand miss = unit economics story in question.',
        action: 'Historically, UBER misses: pressure on LYFT and DASH — gig economy cost pressures rising',
        stocks: [
          { symbol: 'LYFT', move: '-4 to -9%' }, { symbol: 'DASH', move: '-2 to -5%' },
          { symbol: 'ABNB', move: '-1 to -2%' }, { symbol: 'BKNG', move: '-0.5 to -1%' },
        ],
      },
    },
  },

  // ── LYFT — Ride-share (higher beta than UBER) ─────────────────
  {
    match: /\bLYFT\b.*earnings|\bLyft\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+8 to +15%', qqqLabel: 'LYFT', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Ride volume + profitability beat shows LYFT can sustain margins vs UBER.',
        action: 'Historically, LYFT beats: ride-share category healthy — UBER likely follows',
        stocks: [
          { symbol: 'UBER', move: '+1 to +3%' }, { symbol: 'DASH', move: '+1 to +3%' },
          { symbol: 'ABNB', move: '+0.5 to +1.5%' }, { symbol: 'COIN', move: 'flat to +1%' },
        ],
      },
      cool: {
        qqq: '-10 to -18%', qqqLabel: 'LYFT', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Share loss to UBER or driver incentive costs destroy profitability.',
        action: 'Historically, LYFT misses: UBER historically gained share — LYFT and DASH saw pressure',
        stocks: [
          { symbol: 'UBER', move: '+0.5 to +1.5%' }, { symbol: 'DASH', move: '-1 to -3%' },
          { symbol: 'ABNB', move: '-0.5 to -1%' },   { symbol: 'COIN', move: 'flat' },
        ],
      },
    },
  },

  // ── PLTR (Palantir) — AI/Gov data platform ───────────────────
  {
    match: /\bPLTR\b.*earnings|\bPalantir\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+8 to +20%', qqqLabel: 'PLTR', spy: '+0.1 to +0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'AIP commercial revenue + US government AI contracts beat = real AI ROI.',
        action: 'Historically, PLTR beats: AI deployment story confirmed — add AI infra names',
        stocks: [
          { symbol: 'S',    move: '+3 to +6%' }, { symbol: 'SSTI', move: '+3 to +6%' },
          { symbol: 'MSFT', move: '+0.5 to +1%' }, { symbol: 'CRWD', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-10 to -20%', qqqLabel: 'PLTR', spy: '-0.1 to -0.3%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Commercial deal slippage = AI deployment harder to monetize than expected.',
        action: 'Historically, PLTR misses: AI hype vs. ROI gap still wide — reduce speculative AI names',
        stocks: [
          { symbol: 'S',    move: '-3 to -5%' }, { symbol: 'MSFT', move: '-0.3 to -0.8%' },
          { symbol: 'CRWD', move: '-1 to -2%' }, { symbol: 'SNOW', move: '-2 to -4%' },
        ],
      },
    },
  },

  // ── RBLX (Roblox) — Gaming / metaverse platform ──────────────
  {
    match: /\bRBLX\b.*earnings|\bRoblox\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +15%', qqqLabel: 'RBLX', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'DAU growth + bookings beat = user engagement returning post-normalization.',
        action: 'Historically, RBLX beats: gains in gaming names (EA, TTWO, U) — platform stickiness real',
        stocks: [
          { symbol: 'EA',   move: '+1 to +2%' }, { symbol: 'TTWO', move: '+1 to +3%' },
          { symbol: 'U',    move: '+2 to +5%' }, { symbol: 'SNAP', move: '+1 to +2%' },
        ],
      },
      cool: {
        qqq: '-10 to -20%', qqqLabel: 'RBLX', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'DAU decline or monetization miss = Gen Z attention moving elsewhere.',
        action: 'Historically, RBLX misses: weakness in gaming/metaverse stocks — attention economy losing Gen Z',
        stocks: [
          { symbol: 'EA',   move: '-0.5 to -2%' }, { symbol: 'TTWO', move: '-1 to -3%' },
          { symbol: 'U',    move: '-2 to -5%' },   { symbol: 'SNAP', move: '-1 to -2%' },
        ],
      },
    },
  },

  // ── HOOD (Robinhood) — Retail trading platform ───────────────
  {
    match: /\bHOOD\b.*earnings|\bRobinhood\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +15%', qqqLabel: 'HOOD', spy: '+0.1 to +0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'PFOF revenue + crypto trading beat = retail investors re-engaging.',
        action: 'Historically, HOOD beats: retail sentiment positive — add COIN, SQ',
        stocks: [
          { symbol: 'COIN', move: '+3 to +7%' }, { symbol: 'SQ',   move: '+1 to +3%' },
          { symbol: 'IBKR', move: '+1 to +2%' }, { symbol: 'SCHW', move: '+0.5 to +1%' },
        ],
      },
      cool: {
        qqq: '-10 to -18%', qqqLabel: 'HOOD', spy: '-0.1 to -0.1%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Trading volume miss = retail sentiment declining, crypto activity weak.',
        action: 'Historically, HOOD misses: retail trading volume historically declined — pressure on COIN and SQ',
        stocks: [
          { symbol: 'COIN', move: '-3 to -7%' }, { symbol: 'SQ',   move: '-1 to -3%' },
          { symbol: 'IBKR', move: '-0.5 to -1.5%' }, { symbol: 'SCHW', move: '-0.3 to -0.8%' },
        ],
      },
    },
  },

  // ── COIN (Coinbase) — Crypto exchange ────────────────────────
  {
    match: /\bCOIN\b.*earnings|\bCoinbase\b.*earnings/i,
    scenario: {
      hotLabel: 'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+10 to +25%', qqqLabel: 'COIN', spy: '+0.1 to +0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Crypto trading volume + institutional custody beat = bull market confirmed.',
        action: 'Historically, COIN beats: crypto bull cycle — gains in HOOD, MSTR as levered plays',
        stocks: [
          { symbol: 'HOOD',  move: '+4 to +8%' }, { symbol: 'MSTR', move: '+5 to +15%' },
          { symbol: 'RIOT',  move: '+5 to +12%' }, { symbol: 'MARA', move: '+5 to +12%' },
        ],
      },
      cool: {
        qqq: '-15 to -25%', qqqLabel: 'COIN', spy: '-0.1 to -0.2%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Volume collapse or regulatory fine = crypto bear market signal.',
        action: 'Historically, COIN misses: weakness across all crypto-correlated names — liquidity drying up',
        stocks: [
          { symbol: 'HOOD',  move: '-4 to -8%' }, { symbol: 'MSTR', move: '-8 to -18%' },
          { symbol: 'RIOT',  move: '-6 to -14%' }, { symbol: 'MARA', move: '-6 to -14%' },
        ],
      },
    },
  },

  // ── GOOG (same as GOOGL) ──────────────────────────────────────
  {
    match: /\bGOOG\b.*earnings/i,
    scenario: {
      hotLabel:  'Beat estimates', coolLabel: 'Miss estimates',
      hot: {
        qqq: '+5 to +12%', qqqLabel: 'GOOG', spy: '+0.2 to +0.8%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Search + Cloud (GCP) beat signals digital ad recovery and AI monetization.',
        action: 'Historically, GOOG beats: gains in META and digital ad names — sector rising tide',
        stocks: [
          { symbol: 'META',  move: '+2 to +4%' }, { symbol: 'MSFT', move: '+1 to +2%' },
          { symbol: 'AMZN',  move: '+1 to +2%' }, { symbol: 'TTD',  move: '+2 to +5%' },
        ],
      },
      cool: {
        qqq: '-5 to -12%', qqqLabel: 'GOOG', spy: '-0.2 to -0.7%', spyLabel: 'QQQ',
        bonds: 'no direct impact',
        note: 'Search deceleration or AI cost pressure triggers digital ad sector concern.',
        action: 'Historically, GOOG misses: weakness in digital ad stocks — cloud + ad slowdown signal',
        stocks: [
          { symbol: 'META',  move: '-2 to -5%' }, { symbol: 'MSFT', move: '-1 to -2.5%' },
          { symbol: 'AMZN',  move: '-1 to -2%' }, { symbol: 'TTD',  move: '-3 to -6%' },
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
        action:   'Historically, beats with raised guidance lifted the stock and the broader sector ETF.',
        stocks:   [],
      },
      cool: {
        qqq:      '-5 to -12%',
        qqqLabel: 'Stock',
        spy:      '-0.2 to -0.8%',
        spyLabel: 'Sector',
        bonds:    'no direct impact',
        note:     'Miss + lowered guidance can trigger sector-wide selloff.',
        action:   'Historically, misses with cut guidance pressured the stock, sometimes triggering sector-wide contagion.',
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

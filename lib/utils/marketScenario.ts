/**
 * Rule-based market scenario engine
 * "이번 CPI가 hot/cool이면 QQQ/SPY에 어떤 영향이?"
 *
 * 근거: 2022-2025년 주요 이벤트 당일 QQQ/SPY 평균 반응 + 시장 구조 논리
 */

export interface ScenarioSide {
  qqq:   string;   // e.g. "-1.5 to -2.5%"
  spy:   string;
  bonds: string;   // e.g. "yields ↑"
  note:  string;   // 1-line reason
}

export interface MarketScenario {
  hot:      ScenarioSide;
  cool:     ScenarioSide;
  hotLabel: string;   // "Hotter than expected"
  coolLabel: string;  // "Cooler than expected"
  neutral?: string;   // some events have a neutral note
}

// ── 이벤트 타이틀 → 시나리오 매핑 ──────────────────────────────
const SCENARIO_MAP: Array<{ match: RegExp; scenario: MarketScenario }> = [

  // ── CPI ──────────────────────────────────────────────────────
  {
    match: /\bCPI\b|consumer price index/i,
    scenario: {
      hotLabel:  'Hotter than expected',
      coolLabel: 'Cooler than expected',
      hot: {
        qqq:   '-1.5 to -2.5%',
        spy:   '-1.0 to -1.8%',
        bonds: '10Y yield ↑ (+8~15bps)',
        note:  'Rate-cut odds fall. Growth stocks reprice.',
      },
      cool: {
        qqq:   '+1.0 to +2.0%',
        spy:   '+0.7 to +1.4%',
        bonds: '10Y yield ↓ (-6~12bps)',
        note:  'June/July cut window re-opens. Tech leads.',
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
        qqq:   '-1.5 to -2.5%',
        spy:   '-1.0 to -1.8%',
        bonds: '10Y yield ↑ (+8~15bps)',
        note:  'Core is the Fed\'s primary inflation gauge. Bigger market mover than headline.',
      },
      cool: {
        qqq:   '+1.0 to +2.0%',
        spy:   '+0.7 to +1.4%',
        bonds: '10Y yield ↓ (-6~12bps)',
        note:  'Disinflation narrative strengthens. Rate-cut probability surges.',
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
        qqq:   '-1.0 to -2.0%',
        spy:   '-0.8 to -1.5%',
        bonds: '10Y yield ↑ (+6~12bps)',
        note:  'PCE is the Fed\'s preferred inflation measure. Hawkish risk.',
      },
      cool: {
        qqq:   '+0.8 to +1.8%',
        spy:   '+0.6 to +1.2%',
        bonds: '10Y yield ↓ (-5~10bps)',
        note:  'Confirms disinflation. Fed has room to cut.',
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
        qqq:   '-2.0 to -4.0%',
        spy:   '-1.5 to -3.0%',
        bonds: '10Y yield ↑ (+10~20bps)',
        note:  'Higher-for-longer narrative. Growth stocks hit hardest.',
      },
      cool: {
        qqq:   '+1.5 to +3.5%',
        spy:   '+1.0 to +2.5%',
        bonds: '10Y yield ↓ (-8~18bps)',
        note:  'Cut or dovish pivot. Risk-on. QQQ outperforms.',
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
        qqq:   '-0.5 to -1.5%',
        spy:   '-0.4 to -1.2%',
        bonds: '10Y yield ↑ (+4~8bps)',
        note:  'Minutes confirming "higher for longer" revive rate fears.',
      },
      cool: {
        qqq:   '+0.5 to +1.2%',
        spy:   '+0.4 to +1.0%',
        bonds: '10Y yield ↓ (-3~7bps)',
        note:  'Concern about over-tightening signals potential pivot.',
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
        qqq:   '-0.5 to -1.5%',
        spy:   '-0.3 to -1.0%',
        bonds: '10Y yield ↑ (+5~10bps)',
        note:  'Strong jobs = Fed stays hawkish longer. Counterintuitively bearish for growth.',
      },
      cool: {
        qqq:   '+0.5 to +1.5%',
        spy:   '+0.3 to +1.0%',
        bonds: '10Y yield ↓ (-4~9bps)',
        note:  'Weak jobs gives Fed cover to cut. Markets cheer.',
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
        qqq:   '+0.3 to +1.0%',
        spy:   '+0.2 to +0.7%',
        bonds: '10Y yield ↓ (-3~8bps)',
        note:  'Higher unemployment signals labor cooling → Fed cut sooner.',
      },
      cool: {
        qqq:   '-0.3 to -1.0%',
        spy:   '-0.2 to -0.7%',
        bonds: '10Y yield ↑ (+3~8bps)',
        note:  'Tight labor market → Fed holds. Slight negative for rate-sensitive stocks.',
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
        qqq:   '+0.3 to +1.0%',
        spy:   '+0.3 to +0.8%',
        bonds: '10Y yield ↑ (+3~7bps)',
        note:  'Strong growth = strong earnings outlook. Mixed for rates.',
      },
      cool: {
        qqq:   '-0.5 to -1.5%',
        spy:   '-0.4 to -1.2%',
        bonds: '10Y yield ↓ (-4~8bps)',
        note:  'Recession fears creep in. Defensive rotation.',
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
        qqq:   '+0.2 to +0.8%',
        spy:   '+0.2 to +0.6%',
        bonds: 'yields flat to ↑',
        note:  'Manufacturing/services expansion supports earnings.',
      },
      cool: {
        qqq:   '-0.3 to -1.0%',
        spy:   '-0.2 to -0.8%',
        bonds: 'yields flat to ↓',
        note:  'Contraction signals slowdown risk.',
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
        qqq:   '-0.5 to -1.2%',
        spy:   '-0.4 to -1.0%',
        bonds: '10Y yield ↑ (+4~8bps)',
        note:  'Producer inflation feeds into future CPI. Rate cut fears rise.',
      },
      cool: {
        qqq:   '+0.4 to +1.0%',
        spy:   '+0.3 to +0.8%',
        bonds: '10Y yield ↓ (-3~7bps)',
        note:  'Pipeline inflation easing. Supports disinflation narrative.',
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
        qqq:   '+0.2 to +0.7%',
        spy:   '+0.2 to +0.6%',
        bonds: 'yields flat to ↑',
        note:  'Strong consumer = good for earnings. Mixed for rates.',
      },
      cool: {
        qqq:   '-0.2 to -0.8%',
        spy:   '-0.2 to -0.7%',
        bonds: 'yields flat to ↓',
        note:  'Consumer slowdown signals economic cooling.',
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
        qqq:   '-0.3 to -0.8%',
        spy:   '-0.2 to -0.6%',
        bonds: 'yields flat to ↑',
        note:  'Tight labor market → wage pressure → Fed holds.',
      },
      cool: {
        qqq:   '+0.2 to +0.7%',
        spy:   '+0.2 to +0.5%',
        bonds: 'yields flat to ↓',
        note:  'Labor market cooling gives Fed room to cut.',
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
        qqq:   'stock +3 to +10%',
        spy:   'sector +0.5 to +1.5%',
        bonds: 'no direct impact',
        note:  'Beat + raised guidance = strongest reaction.',
      },
      cool: {
        qqq:   'stock -5 to -15%',
        spy:   'sector -0.5 to -1.5%',
        bonds: 'no direct impact',
        note:  'Miss + lowered guidance can trigger sector-wide selloff.',
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

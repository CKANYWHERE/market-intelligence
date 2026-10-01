/**
 * 2026년 경제지표 발표 일정 — 하드코딩 소스
 *
 * 배경: Finnhub(/calendar/economic)와 FMP(economic-calendar) 둘 다 유료 플랜
 * 전용으로 막혀서(403/402), 경제 캘린더 "일정"을 자동으로 가져올 free API가
 * 없음. BLS/BEA/Census가 직접 공개하는 공식 연간 발표 일정으로 대체 —
 * 아래 날짜들은 실제로 bls.gov/bea.gov/census.gov 페이지를 크롤링해서
 * 가져온 값이며 추측이 아님 (출처는 각 배열 위 주석 참고).
 *
 * 유지보수 방식:
 *  - CPI/PPI/고용/JOLTS/GDP/소매판매/내구재주문 처럼 BLS/BEA/Census가 전체
 *    연간 일정을 미리 공개하는 지표 → 매년 말(보통 10~11월) 다음 해 일정이
 *    나오면 이 배열을 한 번 갱신.
 *  - ADP/ISM PMI/신규실업수당청구 처럼 "매달 n번째 영업일", "매주 목요일" 같은
 *    고정 규칙을 따르는 지표 → 아래 generateXxx() 함수가 매년 자동 계산 (연도만
 *    넘겨주면 됨, 수동 갱신 불필요). 단, 연방 공휴일 목록(US_HOLIDAYS_2026)은
 *    연도별로 바뀌므로 그 해에 맞게 갱신 필요.
 *
 * fredRefDate: 이 이벤트가 FRED 시리즈의 어느 관측치(reference period)에
 * 해당하는지 — /api/cron/fred-update가 actual 값을 "날짜 추정" 없이 정확히
 * 매칭하는 데 씀 (economic_events.fred_ref_date 컬럼에 그대로 저장됨).
 * ADP/ISM PMI는 FRED에 대응 시리즈가 없어서 null.
 *
 * estimate(컨센서스 예상치)는 이 테이블에서 채우지 않음 — /api/cron/estimate-sync
 * (Forex Factory calendar) 가 발표 임박 시점에 채움.
 */

export interface SeedEvent {
  date:        string; // YYYY-MM-DD, 실제 발표일
  title:       string;
  category:    'employment' | 'growth' | 'inflation';
  // 실제 시장 영향력 기준 차등 — 전부 high로 두면 "중요도" 자체가 무의미해짐.
  // high: NFP/실업률/GDP (헤드라인, FOMC 정책 판단에 직결)
  // medium: JOLTS/소매판매/ISM PMI/내구재주문/ADP (보조 지표, 서프라이즈 시 영향)
  // low: 매주 발표되는 신규실업수당청구 (빈도가 높아 개별 발표의 상대적 비중이 낮음)
  importance:  'high' | 'medium' | 'low';
  unit:        string | null;
  fredRefDate: string | null; // YYYY-MM-DD, FRED 관측치 날짜 (해당 시리즈 없으면 null)
}

// ── 2026년 미국 연방 공휴일 (영업일 계산용) ─────────────────────
const US_HOLIDAYS_2026 = new Set([
  '2026-01-01', // New Year's Day
  '2026-01-19', // MLK Day
  '2026-02-16', // Presidents Day
  '2026-05-25', // Memorial Day
  '2026-06-19', // Juneteenth
  '2026-07-03', // Independence Day (observed, 7/4 is Sat)
  '2026-09-07', // Labor Day
  '2026-11-11', // Veterans Day
  '2026-11-26', // Thanksgiving
  '2026-12-25', // Christmas
]);

function isBusinessDay(d: Date): boolean {
  const day = d.getUTCDay();
  if (day === 0 || day === 6) return false; // 주말
  const iso = d.toISOString().slice(0, 10);
  return !US_HOLIDAYS_2026.has(iso);
}

function nthBusinessDayOfMonth(year: number, monthIdx0: number, n: number): string {
  let count = 0;
  const d = new Date(Date.UTC(year, monthIdx0, 1));
  while (true) {
    if (isBusinessDay(d)) {
      count++;
      if (count === n) return d.toISOString().slice(0, 10);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── BLS: Employment Situation (NFP + Unemployment Rate), 같은 날 발표 ──
// https://www.bls.gov/schedule/news_release/empsit.htm ("Reference Month" 열)
const EMPLOYMENT_SITUATION: Array<[release: string, ref: string]> = [
  ['2026-01-09', '2025-12-01'], ['2026-02-11', '2026-01-01'], ['2026-03-06', '2026-02-01'],
  ['2026-04-03', '2026-03-01'], ['2026-05-08', '2026-04-01'], ['2026-06-05', '2026-05-01'],
  ['2026-07-02', '2026-06-01'], ['2026-08-07', '2026-07-01'], ['2026-09-04', '2026-08-01'],
  ['2026-10-02', '2026-09-01'], ['2026-11-06', '2026-10-01'], ['2026-12-04', '2026-11-01'],
];

// ── BLS: JOLTS (Job Openings) ──────────────────────────────────
// https://www.bls.gov/schedule/news_release/jolts.htm ("Reference Month" 열)
const JOLTS: Array<[release: string, ref: string]> = [
  ['2026-03-13', '2026-01-01'], ['2026-03-31', '2026-02-01'], ['2026-05-05', '2026-03-01'],
  ['2026-06-02', '2026-04-01'], ['2026-06-30', '2026-05-01'], ['2026-08-04', '2026-06-01'],
  ['2026-09-01', '2026-07-01'], ['2026-09-29', '2026-08-01'], ['2026-11-03', '2026-09-01'],
  ['2026-12-01', '2026-10-01'],
];

// ── BEA: GDP (Advance/Second/Third estimate), 분기별 ───────────
// https://www.bea.gov/news/schedule — 같은 분기 3개 발표가 전부 같은
// FRED ref(분기 시작월 1일)를 가리킴. actual 매칭은 Advance에만 들어가고
// (FRED 비-vintage 시리즈라 분기당 값 1개뿐) 2nd/3rd는 구조적으로 계속 null —
// 알려진 한계, 버그 아님 (3개 발표를 구분할 실측값 소스가 따로 없음)
const GDP: Array<[release: string, ref: string]> = [
  ['2026-04-30', '2026-01-01'], ['2026-05-28', '2026-01-01'], ['2026-06-25', '2026-01-01'], // Q1 2026
  ['2026-07-30', '2026-04-01'], ['2026-08-26', '2026-04-01'], ['2026-09-30', '2026-04-01'], // Q2 2026
  ['2026-10-29', '2026-07-01'], ['2026-11-25', '2026-07-01'], ['2026-12-23', '2026-07-01'], // Q3 2026
];

// ── Census: Advance Monthly Retail Trade ───────────────────────
// https://www.census.gov/retail/release_schedule.html ("X 2026 data" 표기 → 전월)
const RETAIL_SALES: Array<[release: string, ref: string]> = [
  ['2026-01-14', '2025-11-01'], ['2026-02-10', '2025-12-01'], ['2026-03-06', '2026-01-01'],
  ['2026-04-01', '2026-02-01'], ['2026-04-21', '2026-03-01'], ['2026-05-14', '2026-04-01'],
  ['2026-06-17', '2026-05-01'], ['2026-07-16', '2026-06-01'], ['2026-08-14', '2026-07-01'],
  ['2026-09-16', '2026-08-01'], ['2026-10-15', '2026-09-01'], ['2026-11-17', '2026-10-01'],
  ['2026-12-16', '2026-11-01'],
];

// ── Census: Advance Durable Goods ──────────────────────────────
// https://www.census.gov/manufacturing/m3/release_schedule.html ("X 2026 data" → 전월)
const DURABLE_GOODS: Array<[release: string, ref: string]> = [
  ['2026-03-13', '2026-01-01'], ['2026-04-07', '2026-02-01'], ['2026-04-29', '2026-03-01'],
  ['2026-05-28', '2026-04-01'], ['2026-06-25', '2026-05-01'], ['2026-07-27', '2026-06-01'],
  ['2026-08-26', '2026-07-01'], ['2026-09-25', '2026-08-01'], ['2026-10-27', '2026-09-01'],
  ['2026-11-25', '2026-10-01'],
];

// ── BLS: Consumer Price Index (CPI + Core CPI, 같은 날 발표) ──────
// https://www.bls.gov/schedule/news_release/cpi.htm ("Reference Month" 열)
const CPI: Array<[release: string, ref: string]> = [
  ['2026-01-13', '2025-12-01'], ['2026-02-13', '2026-01-01'], ['2026-03-11', '2026-02-01'],
  ['2026-04-10', '2026-03-01'], ['2026-05-12', '2026-04-01'], ['2026-06-10', '2026-05-01'],
  ['2026-07-14', '2026-06-01'], ['2026-08-12', '2026-07-01'], ['2026-09-11', '2026-08-01'],
  ['2026-10-14', '2026-09-01'], ['2026-11-10', '2026-10-01'], ['2026-12-10', '2026-11-01'],
];

// ── BLS: Producer Price Index ───────────────────────────────────
// https://www.bls.gov/schedule/news_release/ppi.htm ("Reference Month" 열)
// Core PPI는 생략 — fred-update에 대응 FRED 시리즈가 아직 없음 (headline만 연결)
const PPI: Array<[release: string, ref: string]> = [
  ['2026-01-14', '2025-11-01'], ['2026-01-30', '2025-12-01'], ['2026-02-27', '2026-01-01'],
  ['2026-03-18', '2026-02-01'], ['2026-04-14', '2026-03-01'], ['2026-05-13', '2026-04-01'],
  ['2026-06-11', '2026-05-01'], ['2026-07-15', '2026-06-01'], ['2026-08-13', '2026-07-01'],
  ['2026-09-10', '2026-08-01'], ['2026-10-15', '2026-09-01'], ['2026-11-13', '2026-10-01'],
  ['2026-12-15', '2026-11-01'],
];

// ── BEA: Personal Income and Outlays (PCE + Core PCE, 같은 날 발표) ──
// https://www.bea.gov/news/schedule — 2026년 일정 중 7월/8월 참조월분은
// 공식 페이지에서 날짜가 서로 다르게 보여 교차검증 못함 (2026년 정부 셧다운
// 여파로 발표 일정 자체가 한 차례 변경된 걸로 보임 — bea.gov 2026-01-15
// "Economic Release Schedule Updates" 공지 참고). 확실한 10개월분만 포함,
// 7/8월분은 비워둠 — 틀린 날짜 넣느니 비우는 게 나음.
const PCE: Array<[release: string, ref: string]> = [
  ['2026-03-13', '2026-01-01'], ['2026-04-09', '2026-02-01'], ['2026-04-30', '2026-03-01'],
  ['2026-05-28', '2026-04-01'], ['2026-06-25', '2026-05-01'], ['2026-07-30', '2026-06-01'],
  ['2026-10-29', '2026-09-01'], ['2026-11-25', '2026-10-01'], ['2026-12-23', '2026-11-01'],
];

function generateAdpDates(): string[] {
  // ADP National Employment Report — NFP 발표(금요일) 이틀 전 수요일에 발표
  return EMPLOYMENT_SITUATION.map(([release]) => addDays(release, -2));
}

function generateJoblessClaimsDates(year: number): string[] {
  // Initial Jobless Claims — 매주 목요일 (연방공휴일과 겹치면 수요일로 당겨지기도
  // 하나, 캘린더 상 정확한 날짜보다 "매주" 존재 자체가 중요하므로 단순화)
  const dates: string[] = [];
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() + 1); // 첫 목요일
  while (d.getUTCFullYear() === year) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return dates;
}

function generateIsmManufacturingDates(year: number): string[] {
  // ISM Manufacturing PMI — 매달 1영업일
  return Array.from({ length: 12 }, (_, m) => nthBusinessDayOfMonth(year, m, 1));
}

function generateIsmServicesDates(year: number): string[] {
  // ISM Services PMI — 매달 3영업일
  return Array.from({ length: 12 }, (_, m) => nthBusinessDayOfMonth(year, m, 3));
}

export function buildEconomicCalendar2026(): SeedEvent[] {
  const events: SeedEvent[] = [];

  for (const [date, ref] of EMPLOYMENT_SITUATION) {
    events.push({ date, title: 'Non Farm Payrolls',  category: 'employment', importance: 'high', unit: 'K', fredRefDate: ref });
    events.push({ date, title: 'Unemployment Rate',   category: 'employment', importance: 'high', unit: '%', fredRefDate: ref });
  }
  for (const [date, ref] of JOLTS) {
    events.push({ date, title: 'JOLTS Job Openings', category: 'employment', importance: 'medium', unit: 'K', fredRefDate: ref });
  }
  for (const date of generateAdpDates()) {
    events.push({ date, title: 'ADP Non-Farm Employment Change', category: 'employment', importance: 'medium', unit: 'K', fredRefDate: null });
  }
  for (const date of generateJoblessClaimsDates(2026)) {
    // FRED(ICSA)는 "week ending" 토요일을 ref로 씀 — 발표(목) 기준 5일 전 토요일
    events.push({ date, title: 'Initial Jobless Claims', category: 'employment', importance: 'low', unit: 'K', fredRefDate: addDays(date, -5) });
  }
  for (const [date, ref] of CPI) {
    events.push({ date, title: 'Inflation Rate MoM',      category: 'inflation', importance: 'high', unit: '%', fredRefDate: ref });
    events.push({ date, title: 'Core Inflation Rate MoM', category: 'inflation', importance: 'high', unit: '%', fredRefDate: ref });
  }
  for (const [date, ref] of PPI) {
    events.push({ date, title: 'PPI MoM', category: 'inflation', importance: 'medium', unit: '%', fredRefDate: ref });
  }
  for (const [date, ref] of PCE) {
    events.push({ date, title: 'PCE Price Index MoM',      category: 'inflation', importance: 'high', unit: '%', fredRefDate: ref });
    events.push({ date, title: 'Core PCE Price Index MoM', category: 'inflation', importance: 'high', unit: '%', fredRefDate: ref });
  }
  for (const [date, ref] of GDP) {
    events.push({ date, title: 'GDP q/q', category: 'growth', importance: 'high', unit: '%', fredRefDate: ref });
  }
  for (const [date, ref] of RETAIL_SALES) {
    events.push({ date, title: 'Retail Sales m/m', category: 'growth', importance: 'medium', unit: '%', fredRefDate: ref });
  }
  for (const [date, ref] of DURABLE_GOODS) {
    events.push({ date, title: 'Durable Goods Orders m/m', category: 'growth', importance: 'medium', unit: '%', fredRefDate: ref });
  }
  for (const date of generateIsmManufacturingDates(2026)) {
    events.push({ date, title: 'ISM Manufacturing PMI', category: 'growth', importance: 'medium', unit: null, fredRefDate: null });
  }
  for (const date of generateIsmServicesDates(2026)) {
    events.push({ date, title: 'ISM Services PMI', category: 'growth', importance: 'medium', unit: null, fredRefDate: null });
  }

  return events;
}

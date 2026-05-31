CLAUDE.md — Market Intelligence Dashboard
🧭 Claude 행동 원칙 (최우선 적용)
이 프로젝트에서 Claude는 아래 두 가지 원칙을 모든 작업보다 우선한다.
원칙 1 — 모르거나 애매하면 무조건 먼저 물어본다
개발을 시작하기 전, 요구사항이 1%라도 불명확하다면 반드시 질문 먼저 한다.
추측으로 구현하지 않는다. 틀린 방향으로 빠르게 달리는 것보다 느리더라도 올바른 방향으로 가는 것이 낫다.
질문해야 하는 상황의 예시:

기능의 범위가 명확하지 않을 때
두 가지 이상의 구현 방식이 존재하고 선택 기준이 없을 때
기존 코드나 설계와 충돌 가능성이 있을 때
"이 정도면 알아서 하겠지"라는 생각이 들 때 → 그때가 바로 물어봐야 할 때

질문 방식: 구체적으로, 선택지를 제시하며 묻는다.

❌ "어떻게 할까요?"
✅ "캘린더 이벤트 클릭 시 A(사이드 패널)와 B(모달) 두 가지 방식이 있는데, 어떤 걸 원하시나요?"


원칙 2 — 제1원칙(First Principles)까지 분해해서 개발한다
기능을 구현하기 전에 "왜 이게 필요한가"를 가장 근본적인 수준까지 쪼갠다.
관행, 기존 코드, 빠른 해결책에 의존하지 않는다.
분해 방식:

목적: 이 기능이 존재하는 이유가 무엇인가?
최소 단위: 이 기능을 구성하는 가장 작은 요소는 무엇인가?
제약: 무엇이 이 기능을 어렵게 만드는가? (기술적 한계, 데이터 부재, 비용 등)
검증: 이 구현이 목적을 실제로 달성하는가?

예시 — "Breaking 이슈 자동 감지" 기능을 구현할 때:


목적: 일정이 없는 시장 충격 이벤트를 사용자에게 빠르게 전달
최소 단위: 뉴스 텍스트 → AI 분류 → HIGH 판정 → DB 저장 → UI 표시
제약: AI 분류의 false positive, 뉴스 소스의 딜레이, API 비용
검증: 실제 시장 충격 이벤트(예: 긴급 FOMC)가 발생했을 때 30분 내 표시되는가?



프로젝트 개요
미국 주식 투자자를 위한 공개 웹 서비스. 경제 지표 발표 일정, 기업 실적, IPO 이벤트, ETF 변화, Breaking 이슈를 캘린더 형식으로 한 곳에서 보여주는 대시보드.
인터넷에 공개 배포되며, 누구나 접근 가능한 서비스를 목표로 함.

기술 스택

프레임워크: Next.js (App Router)
호스팅: Vercel (Cron Jobs으로 배치 자동화)
데이터베이스: Supabase (PostgreSQL)
AI 분류: Claude API — Haiku 모델 사용 (비용 최소화, Breaking 이슈 분류 전용)


핵심 기능
1. 캘린더 뷰 (Core)
   모든 이벤트를 월별 캘린더로 표시. 이벤트 클릭 시 디테일 패널에서 상세 정보 확인.
   이벤트 종류:

통화정책: FOMC 금리 결정, 의사록, 점도표, 파월 연설, 베이지북
인플레이션: CPI, Core CPI, PPI, Core PPI, PCE, Core PCE, 기대인플레이션
고용: NFP, 실업률, ADP, JOLTS, 주간 실업수당
경기/성장: GDP, 소매판매, ISM PMI (제조/서비스), 내구재 주문, 소비자신뢰
기업 실적: QQQ 상위 종목 (AAPL, MSFT, NVDA, GOOGL, AMZN, META, TSLA 등) + 커스텀 종목
IPO/나스닥: SpaceX(2026.06.12 확정), Anthropic(2026.10 예상), OpenAI(2026 Q4 예상), NASDAQ-100 Fast Entry, 분기 리밸런싱

2. Breaking 이슈 섹션
   정해지지 않은 중요한 시장 이슈 자동 감지. AI가 HIGH/MEDIUM/LOW로 분류 후 HIGH만 표시.
   감지 대상: 긴급 FOMC, 관세/무역 발표, 지정학적 리스크, 기업 돌발 이슈, IPO 날짜 확정, 신용등급 변경
3. ETF 트래커
   QQQ, SPY, SCHD 실시간 주가 및 NASDAQ 룰 변경 영향 분석.

데이터 소스 & API 엔드포인트
Finnhub (Base: https://finnhub.io/api/v1)
데이터엔드포인트파라미터경제 캘린더GET /calendar/economicfrom={YYYY-MM-DD}&to={YYYY-MM-DD}&token={token}실적 캘린더GET /calendar/earningsfrom={YYYY-MM-DD}&to={YYYY-MM-DD}&symbol={symbol}&token={token}IPO 캘린더GET /calendar/ipofrom={YYYY-MM-DD}&to={YYYY-MM-DD}&token={token}주가GET /quotesymbol={symbol}&token={token}시장 뉴스GET /newscategory=general&minId=0&token={token}종목 뉴스GET /company-newssymbol={symbol}&from={YYYY-MM-DD}&to={YYYY-MM-DD}&token={token}
⚠️ /calendar/economic 무료 티어 가능 여부 반드시 확인 필요. 막혀있을 경우 FRED API + 하드코딩으로 대체.
FRED API (Base: https://api.stlouisfed.org/fred/series/observations)
공통 쿼리 파라미터: ?series_id={ID}&api_key={key}&file_type=json&observation_start={YYYY-MM-DD}&sort_order=desc&limit=24
지표Series ID상태CPICPIAUCSL✅ 확인Core CPICPILFESL✅ 확인PPIPPIACO✅ 확인Core PPIPPICOR⚠️ 요확인PCEPCEPI✅ 확인Core PCEPCEPILFE✅ 확인NFPPAYEMS✅ 확인실업률UNRATE✅ 확인GDPGDPC1✅ 확인JOLTSJTSJOL✅ 확인주간 실업수당ICSA✅ 확인소매판매RSXFS✅ 확인내구재 주문DGORDER✅ 확인기대인플레이션MICH✅ 확인
역할 분리 원칙:

발표 당일 actual 수치 → Finnhub (FRED보다 빠름)
히스토리 차트 데이터 → FRED API

Federal Reserve RSS
피드URL모든 공식 보도자료https://www.federalreserve.gov/feeds/press_all.xml통화정책 전용https://www.federalreserve.gov/feeds/press_monetary.xml파월 의장 연설https://www.federalreserve.gov/feeds/s_t_powell.xml전체 연설/증언https://www.federalreserve.gov/feeds/speeches_and_testimony.xml
SEC EDGAR RSS
피드URLS-1 (IPO 등록)https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=S-1&dateb=&owner=include&count=40&output=atom8-K (중요 공시)https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=40&output=atomSEC 보도자료https://www.sec.gov/news/pressreleases.rss

배치 스케줄
매 30분 — Breaking 이슈 파이프라인
수집: Finnhub /news + Fed RSS (press_monetary) + SEC EDGAR RSS
↓
Claude API Haiku: "이 뉴스가 미국 주식시장에 즉각적 영향을 주는가?" → HIGH / MEDIUM / LOW
↓
HIGH만 Supabase breaking_events 테이블에 저장
⚠️ Vercel 무료 티어는 30분 간격 Cron 불가능할 수 있음. Pro 플랜 또는 GitHub Actions로 대체 고려.
매일 오전 (ET 08:00 / KST 21:00)

Finnhub /calendar/economic → 경제 이벤트 일정 갱신
Finnhub /calendar/earnings → 실적 일정 갱신
Finnhub /calendar/ipo → IPO 일정 갱신
FRED API 전체 지표 → 최신 수치 갱신

발표 당일 추가 (ET 09:00)

FRED API 해당 지표 재호출 → actual 수치 업데이트

장중 매 1시간 (ET 09:30–16:00)

Finnhub /quote → QQQ, SPY, SCHD 주가


중요 컨텍스트 — NASDAQ Fast Entry Rule
2026년 5월 1일부터 시행된 새 규정:

나스닥-100 상위 40위권 기업은 IPO 후 15거래일 내 즉시 편입
편입 시 3배 가중치 적용
SpaceX($1.75T), OpenAI($1T), Anthropic($900B) 모두 해당
QQQ 등 패시브 ETF가 강제 매수해야 하는 구조 → $50B+ 규모 예상


미확정 항목 (개발 전 결정 필요)

캘린더 이벤트 클릭 시 디테일 패널 UI — 어떤 정보를 어떻게 보여줄지
Breaking 이슈 섹션 UI/UX — 캘린더와 별도 섹션? 통합?
DB 스키마 — 아직 설계 안 됨
Finnhub 경제 캘린더 무료 여부 — API 키 발급 후 테스트 필요
Core PPI Series ID (PPICOR) 실제 존재 여부 확인
Vercel Cron 제한 — 30분 배치 가능 여부 확인
Next.js 세부 스택 — 버전, CSS 솔루션, 상태관리 라이브러리


코딩 가이드라인

모든 API 키는 환경변수로 관리 (FINNHUB_API_KEY, FRED_API_KEY, ANTHROPIC_API_KEY)
API 키는 절대 클라이언트 사이드에 노출 금지 → 모든 외부 API 호출은 Next.js API Route(서버)에서만
배치 로직은 /app/api/cron/ 디렉토리에 분리
데이터 fetching 실패 시 graceful degradation — 빈 화면 대신 "데이터 로드 실패" 메시지 + 마지막 성공 데이터 표시
Breaking 이슈 AI 분류는 Claude Haiku 사용 (비용 절감), 한 번에 최대 10개 뉴스씩 배치 처리
지표 발표 전: estimate 표시 / 발표 후: actual vs estimate 비교 표시


환경변수 목록 (예정)
envFINNHUB_API_KEY=
FRED_API_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=


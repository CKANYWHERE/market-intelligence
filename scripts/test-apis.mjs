/**
 * Finnhub API 엔드포인트 검증 스크립트
 * 실행: node scripts/test-apis.mjs
 */

const API_KEY = "d8aqg3hr01qk20sod3i0d8aqg3hr01qk20sod3ig";
const BASE = "https://finnhub.io/api/v1";
const TODAY = "2026-05-26";
const TO = "2026-06-30";

async function test(name, url) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`▶ ${name}`);
  console.log(`  URL: ${url}`);
  try {
    const res = await fetch(url);
    const status = res.status;
    const body = await res.json();

    if (status !== 200) {
      console.log(`  ❌ HTTP ${status}`);
      console.log(`  응답:`, JSON.stringify(body, null, 2));
      return { name, ok: false, status, body };
    }

    // 응답 shape 요약
    const keys = Object.keys(body);
    console.log(`  ✅ HTTP ${status}`);
    console.log(`  최상위 키:`, keys);

    // 배열이 있으면 첫 번째 항목 출력
    for (const key of keys) {
      if (Array.isArray(body[key]) && body[key].length > 0) {
        console.log(`  [${key}] 항목 수: ${body[key].length}`);
        console.log(`  [${key}][0] 필드:`, Object.keys(body[key][0]));
        console.log(`  [${key}][0] 샘플:`, JSON.stringify(body[key][0], null, 2));
        break;
      }
    }

    // 배열이 아닌 경우 (quote 등)
    if (!keys.some(k => Array.isArray(body[k]))) {
      console.log(`  전체 응답:`, JSON.stringify(body, null, 2));
    }

    return { name, ok: true, status, body };
  } catch (e) {
    console.log(`  ❌ 오류: ${e.message}`);
    return { name, ok: false, error: e.message };
  }
}

async function main() {
  console.log("🔍 Finnhub API 엔드포인트 검증 시작\n");

  const results = await Promise.allSettled([
    test(
      "1. 경제 캘린더 /calendar/economic",
      `${BASE}/calendar/economic?from=${TODAY}&to=${TO}&token=${API_KEY}`
    ),
    test(
      "2. 실적 캘린더 /calendar/earnings",
      `${BASE}/calendar/earnings?from=${TODAY}&to=${TO}&token=${API_KEY}`
    ),
    test(
      "3. IPO 캘린더 /calendar/ipo",
      `${BASE}/calendar/ipo?from=${TODAY}&to=${TO}&token=${API_KEY}`
    ),
    test(
      "4. 주가 /quote (QQQ)",
      `${BASE}/quote?symbol=QQQ&token=${API_KEY}`
    ),
    test(
      "5. 주가 /quote (SPY)",
      `${BASE}/quote?symbol=SPY&token=${API_KEY}`
    ),
    test(
      "6. 주가 /quote (SCHD)",
      `${BASE}/quote?symbol=SCHD&token=${API_KEY}`
    ),
    test(
      "7. 시장 뉴스 /news",
      `${BASE}/news?category=general&minId=0&token=${API_KEY}`
    ),
  ]);

  console.log(`\n${"=".repeat(60)}`);
  console.log("📋 결과 요약");
  results.forEach(r => {
    const v = r.value;
    if (v) console.log(`  ${v.ok ? "✅" : "❌"} ${v.name}`);
  });
}

main();

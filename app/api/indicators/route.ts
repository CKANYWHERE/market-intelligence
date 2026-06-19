/**
 * GET /api/indicators
 * 주요 경제지표 최신값 + 스파크라인 데이터 반환
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

const INDICATORS = [
  { series_id: 'CPIAUCSL', name: 'CPI',             unit: '%',  type: 'yoy'   },
  { series_id: 'CPILFESL', name: 'Core CPI',         unit: '%',  type: 'yoy'   },
  { series_id: 'PPIACO',   name: 'PPI',              unit: '',   type: 'level' },
  { series_id: 'PCEPILFE', name: 'Core PCE',         unit: '%',  type: 'yoy'   },
  { series_id: 'PAYEMS',   name: 'Nonfarm Payrolls', unit: 'K',  type: 'diff'  },
  { series_id: 'UNRATE',   name: 'Unemployment',     unit: '%',  type: 'level' },
] as const;

function toDateStr(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export async function GET() {
  try {
    const results = await Promise.all(
      INDICATORS.map(async (ind) => {
        const rows = await db.fredSnapshot.findMany({
          where:   { series_id: ind.series_id },
          orderBy: { date: 'desc' },
          take:    13, // 최신 13개 (스파크라인 12개 + 여유)
          select:  { date: true, value: true },
        });

        if (rows.length === 0) return null;

        // 날짜 오름차순으로 정렬
        const sorted = rows.reverse();
        const latest = sorted[sorted.length - 1];
        const prev   = sorted.length >= 2 ? sorted[sorted.length - 2] : null;

        // 스파크라인: 최근 12개 (없으면 있는 것 전부)
        const sparkline = sorted.slice(-12).map((r) => ({
          date:  toDateStr(r.date),
          value: Number(r.value),
        }));

        const latestVal = Number(latest.value);
        const prevVal   = prev ? Number(prev.value) : null;

        // 변화량 계산
        let change: number | null = null;
        if (prevVal !== null) {
          change = latestVal - prevVal;
        }

        // 표시용 값 계산
        // yoy  → DB에는 raw FRED 레벨 저장. 가장 오래된 sparkline row(12개월 전)와 비교해 YoY% 산출
        // diff → 레벨 차이가 곧 월간 증가분 (PAYEMS 단위: 천 명 = K)
        // level→ 그대로
        let displayValue: number = latestVal;
        if (ind.type === 'yoy' && sorted.length >= 2) {
          const yearAgoVal = Number(sorted[0].value);
          if (yearAgoVal !== 0) {
            displayValue = ((latestVal - yearAgoVal) / yearAgoVal) * 100;
          }
        } else if (ind.type === 'diff' && change !== null) {
          displayValue = change; // 월간 증가분 (K)
        }

        return {
          series_id: ind.series_id,
          name:      ind.name,
          unit:      ind.unit,
          type:      ind.type,
          latestDate: toDateStr(latest.date),
          latest:    latestVal,
          prev:      prevVal,
          change,
          displayValue,
          sparkline,
        };
      }),
    );

    const indicators = results.filter(Boolean);

    return NextResponse.json({ indicators }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (err) {
    console.error('[indicators]', err);
    return NextResponse.json({ indicators: [] });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

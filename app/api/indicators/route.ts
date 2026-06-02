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
          if (ind.type === 'diff') {
            change = latestVal - prevVal; // 절대 변화 (K jobs)
          } else {
            change = latestVal - prevVal; // percentage point 변화
          }
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

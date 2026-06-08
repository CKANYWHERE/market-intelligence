import { NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

export const revalidate = 300; // 5분 캐시

export async function GET() {
  try {
    const analysis = await db.marketAnalysis.findFirst({
      where:   { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ analysis: analysis ?? null });
  } catch (error) {
    console.error('[market-analysis] fetch error:', error);
    return NextResponse.json({ analysis: null }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

import { NextResponse } from 'next/server';
import { getRealtimeQuotes } from '@/lib/api/yahooFinance';

const SYMBOLS = ['QQQ', 'SPY', 'SCHD'];

export async function GET() {
  try {
    const results = await getRealtimeQuotes(SYMBOLS);
    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[quote/route]', err);
    return NextResponse.json({}, { status: 500 });
  }
}

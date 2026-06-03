import { NextResponse } from 'next/server';
import { getIndexQuote } from '@/lib/api/yahooFinance';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [vix, tny] = await Promise.allSettled([
    getIndexQuote('^VIX'),
    getIndexQuote('^TNX'),
  ]);

  return NextResponse.json(
    {
      vix: vix.status === 'fulfilled' ? vix.value : null,
      tny: tny.status === 'fulfilled' ? tny.value : null,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}

// GET /api/fed-watch
// Returns next-FOMC rate cut probability from CME FedWatch
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface FedWatchData {
  meetingDate: string; // YYYY-MM-DD
  cutProb:     number; // 0–100 (any cut: 25bp+)
  holdProb:    number;
  hikeProb:    number;
  currentRate: number; // upper bound of target range
}

/** CME FedWatch public endpoint */
const CME_URL =
  'https://www.cmegroup.com/CmeWS/mvc/MarketData/v1/GetCmeFedWatchToolData.json';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html',
};

export async function GET() {
  try {
    const res = await fetch(CME_URL, {
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ data: null, error: `CME HTTP ${res.status}` });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json();

    // CME response shape: { nMonths: number, meetings: [ { month, probabilities: [...] } ] }
    const meetings = json?.meetings ?? json?.marketData ?? [];
    if (!Array.isArray(meetings) || meetings.length === 0) {
      return NextResponse.json({ data: null, error: 'No meetings in response' });
    }

    // First upcoming meeting
    const next = meetings[0];

    // Probabilities array: each item has { probDown25, probUnchanged, probUp25, ... } or similar
    // CME uses "probabilities" as an object keyed by rate level or as an array
    const probs: Record<string, number> =
      Array.isArray(next.probabilities)
        ? // Array form: [{ label: 'UNCH', probability: 15.5 }, ...]
          Object.fromEntries(
            (next.probabilities as Array<{ label: string; probability: number }>).map(
              (p) => [p.label, p.probability],
            ),
          )
        : (next.probabilities ?? {});

    // Keys used by CME: UNCH = no change, various negative labels = cut
    const holdProb = probs['UNCH'] ?? probs['unchanged'] ?? 0;
    // Sum all cut probabilities (negative = cut)
    const cutProb = Object.entries(probs)
      .filter(([k]) => k !== 'UNCH' && k !== 'unchanged' && parseFloat(k) < 0)
      .reduce((s, [, v]) => s + v, 0);
    const hikeProb = Object.entries(probs)
      .filter(([k]) => parseFloat(k) > 0)
      .reduce((s, [, v]) => s + v, 0);

    // Meeting date
    const rawDate: string = next.month ?? next.date ?? '';
    const meetingDate =
      rawDate.length === 7
        ? `${rawDate}-01` // YYYY-MM → first of month (approximate)
        : rawDate;

    // Current target rate — CME provides as topOfRange or similar
    const currentRate: number =
      (next.topOfTargetRange ?? json.topOfTargetRange ?? next.currentTarget ?? 0) as number;

    const data: FedWatchData = {
      meetingDate,
      cutProb:     Math.round(cutProb * 10) / 10,
      holdProb:    Math.round(holdProb * 10) / 10,
      hikeProb:    Math.round(hikeProb * 10) / 10,
      currentRate,
    };

    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=60' } },
    );
  } catch (err) {
    console.error('[fed-watch]', err);
    return NextResponse.json({ data: null, error: String(err) });
  }
}

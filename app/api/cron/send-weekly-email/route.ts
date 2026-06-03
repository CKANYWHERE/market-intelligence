// GET /api/cron/send-weekly-email
// 매주 월요일 11:00 UTC (07:00 ET) — weekly digest 이메일 발송

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/batch/db';
import { getWeekStart, getOrGenerateDigest } from '@/lib/batch/generate-weekly-digest';
import { buildWeeklyDigestEmail } from '@/lib/email/weekly-digest-template';

export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://market-intelligence-87mm.vercel.app';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${weekStart.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not set' }, { status: 500 });
  }

  const startedAt = Date.now();

  try {
    const weekStart = getWeekStart();
    const items     = await getOrGenerateDigest(weekStart);
    if (items.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no digest items' });
    }

    const subscribers = await db.emailSubscriber.findMany({
      select: { email: true, token: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, reason: 'no subscribers' });
    }

    const resend     = new Resend(resendKey);
    const weekRange  = formatWeekRange(weekStart);
    const htmlBase   = buildWeeklyDigestEmail(items, weekRange);
    const fromEmail  = process.env.RESEND_FROM_EMAIL ?? 'digest@market-intelligence-87mm.vercel.app';

    let sent = 0;
    let failed = 0;

    // 배치 전송 (Resend free tier: 100/day)
    for (const sub of subscribers) {
      const html = htmlBase.replace('{{TOKEN}}', sub.token);
      try {
        await resend.emails.send({
          from:    `US Market Calendar <${fromEmail}>`,
          to:      sub.email,
          subject: `This Week's Market Focus: ${weekRange}`,
          html,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      total:     subscribers.length,
      weekRange,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error('[cron/send-weekly-email]', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

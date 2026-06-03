import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';
import crypto from 'crypto';

function generateToken(email: string): string {
  return crypto
    .createHmac('sha256', process.env.CRON_SECRET ?? 'secret')
    .update(email)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const token = generateToken(email);

    await db.emailSubscriber.upsert({
      where:  { email },
      create: { email, token },
      update: {},  // 이미 있으면 그대로
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    db.$disconnect().catch(() => {});
  }
}

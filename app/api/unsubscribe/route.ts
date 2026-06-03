import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/', req.url));

  try {
    await db.emailSubscriber.delete({ where: { token } });
  } catch {
    // already deleted or not found — ok
  } finally {
    db.$disconnect().catch(() => {});
  }

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#030712;color:#fff">
    <h2>Unsubscribed</h2><p style="color:#9ca3af">You've been removed from the US Market Calendar weekly digest.</p>
    <a href="/" style="color:#60a5fa">← Back to calendar</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  );
}

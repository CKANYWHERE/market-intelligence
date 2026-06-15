// 일회성 수동 수정 엔드포인트
// PPI MoM / Core PPI MoM의 오염된 FRED 인덱스값(283.764)을 null로 리셋
//
// 사용법:
//   curl -H "Authorization: Bearer <CRON_SECRET>" \
//        https://marketclock.net/api/admin/fix-ppi-corrupt
//
// 실행 후 daily-calendar cron을 수동으로 돌리면 Finnhub에서 실제값으로 채워짐:
//   curl -H "Authorization: Bearer <CRON_SECRET>" \
//        "https://marketclock.net/api/cron/daily-calendar?from=2026-05-15&to=2026-06-30"

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/batch/db';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 오염된 이벤트 조회: actual이 인덱스 레벨 범위(200~400)인 PPI 이벤트
  // 정상 PPI MoM actual은 -5 ~ +5% 범위이므로 200+ 는 명확히 이상값
  const corrupted = await db.economicEvent.findMany({
    where: {
      title: { contains: 'PPI', mode: 'insensitive' },
      actual: { gt: 100 }, // 정상 MoM % 범위를 벗어난 값
    },
    select: { id: true, title: true, date: true, actual: true },
  });

  if (corrupted.length === 0) {
    return NextResponse.json({ ok: true, message: 'No corrupted PPI values found', fixed: 0 });
  }

  // actual → null 리셋 (이후 daily-calendar cron이 Finnhub에서 실제값으로 채움)
  const ids = corrupted.map((e) => e.id);
  await db.economicEvent.updateMany({
    where: { id: { in: ids } },
    data:  { actual: null },
  });

  const log = corrupted.map((e) =>
    `Reset: "${e.title}" (${e.date.toISOString().slice(0, 10)}) — was ${e.actual}`,
  );

  return NextResponse.json({
    ok: true,
    fixed: corrupted.length,
    log,
    next_step: 'Run /api/cron/daily-calendar?from=2026-05-15&to=2026-06-30 to refill from Finnhub',
  });
}

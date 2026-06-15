// 일회성 DB 클린업 엔드포인트
// FRED 버그로 인해 오염된 actual 값들을 null로 리셋
//
// 오염 패턴:
//   1. PPI/Core PPI: actual = 283.764 (PPIACO 인덱스 레벨, 정상 MoM은 -5~+5%)
//   2. Retail Sales: actual = 656115 (RSXFS 달러 금액, 정상 MoM은 -5~+10%)
//   3. 미래 이벤트에 actual 설정됨 (아직 발표 안 됐는데 FRED가 채운 것)
//
// 사용법:
//   curl "https://marketclock.net/api/admin/fix-ppi-corrupt?secret=<CRON_SECRET>"

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

  const now = new Date();
  const log: string[] = [];
  let total = 0;

  // ── 1. 미래 이벤트에 잘못 설정된 actual 리셋
  //    아직 발표되지 않은 이벤트가 actual 값을 가지면 FRED 버그가 원인
  const futureWithActual = await db.economicEvent.findMany({
    where: {
      date:   { gt: now },
      actual: { not: null },
    },
    select: { id: true, title: true, date: true, actual: true },
  });
  if (futureWithActual.length > 0) {
    await db.economicEvent.updateMany({
      where: { id: { in: futureWithActual.map((e) => e.id) } },
      data:  { actual: null },
    });
    for (const e of futureWithActual) {
      log.push(`[미래이벤트] Reset: "${e.title}" (${e.date.toISOString().slice(0, 10)}) — was ${e.actual}`);
    }
    total += futureWithActual.length;
  }

  // ── 2. PPI / Core PPI: actual > 10 은 인덱스 레벨 오염 (정상 MoM % 범위: -5~+5)
  const corruptPpi = await db.economicEvent.findMany({
    where: {
      title:  { contains: 'PPI', mode: 'insensitive' },
      actual: { gt: 10 },
    },
    select: { id: true, title: true, date: true, actual: true },
  });
  if (corruptPpi.length > 0) {
    await db.economicEvent.updateMany({
      where: { id: { in: corruptPpi.map((e) => e.id) } },
      data:  { actual: null },
    });
    for (const e of corruptPpi) {
      log.push(`[PPI오염] Reset: "${e.title}" (${e.date.toISOString().slice(0, 10)}) — was ${e.actual}`);
    }
    total += corruptPpi.length;
  }

  // ── 3. Retail Sales: actual > 1000 은 달러 금액 레벨 오염 (정상 MoM % 범위: -5~+10)
  const corruptRetail = await db.economicEvent.findMany({
    where: {
      title:  { contains: 'Retail Sales', mode: 'insensitive' },
      actual: { gt: 1000 },
    },
    select: { id: true, title: true, date: true, actual: true },
  });
  if (corruptRetail.length > 0) {
    await db.economicEvent.updateMany({
      where: { id: { in: corruptRetail.map((e) => e.id) } },
      data:  { actual: null },
    });
    for (const e of corruptRetail) {
      log.push(`[소매판매오염] Reset: "${e.title}" (${e.date.toISOString().slice(0, 10)}) — was ${e.actual}`);
    }
    total += corruptRetail.length;
  }

  // ── 4. 기타: actual > 50000 인 모든 이벤트 (명백한 달러/인덱스 레벨 오염)
  const corruptOther = await db.economicEvent.findMany({
    where: {
      actual: { gt: 50000 },
      // PPI/Retail은 이미 위에서 처리
      NOT: [
        { title: { contains: 'PPI',          mode: 'insensitive' } },
        { title: { contains: 'Retail Sales', mode: 'insensitive' } },
      ],
    },
    select: { id: true, title: true, date: true, actual: true },
  });
  if (corruptOther.length > 0) {
    await db.economicEvent.updateMany({
      where: { id: { in: corruptOther.map((e) => e.id) } },
      data:  { actual: null },
    });
    for (const e of corruptOther) {
      log.push(`[기타오염] Reset: "${e.title}" (${e.date.toISOString().slice(0, 10)}) — was ${e.actual}`);
    }
    total += corruptOther.length;
  }

  return NextResponse.json({
    ok:   true,
    fixed: total,
    log,
    next_step: total > 0
      ? 'Deploy fix then run: /api/cron/daily-calendar?from=2026-05-15&to=2026-07-01 to refill from Finnhub'
      : 'No corrupted values found — DB is clean',
  });
}

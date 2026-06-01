/**
 * Prisma Client 싱글턴
 *
 * Vercel 서버리스 환경에서 매 요청마다 TCP 커넥션을 새로 맺는 오버헤드를 피하기 위해
 * Neon 서버리스 드라이버(WebSocket 기반)를 사용.
 * 로컬 개발에서는 일반 PrismaClient를 사용.
 */

import { PrismaClient } from '@prisma/client';

function createPrismaClient() {
  if (process.env.NODE_ENV === 'production') {
    // Vercel 서버리스 — Neon WebSocket 드라이버로 커넥션 오버헤드 제거
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require('@neondatabase/serverless');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require('@prisma/adapter-neon');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaNeon(pool);
    return new PrismaClient({ adapter, log: ['error'] });
  }

  // 로컬 개발 — 일반 TCP 커넥션
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

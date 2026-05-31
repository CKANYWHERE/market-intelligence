/**
 * Prisma Client 싱글턴
 *
 * Next.js dev 모드에서 hot-reload 시마다 새 PrismaClient 인스턴스가 생기면
 * DB 연결이 빠르게 고갈되는 문제를 방지하는 공식 패턴.
 * https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

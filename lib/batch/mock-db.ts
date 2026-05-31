/**
 * File-based Mock DB
 *
 * Prisma와 동일한 인터페이스를 제공하는 JSON 파일 기반 저장소.
 * 실제 DB가 연결되면 이 파일 대신 lib/batch/db.ts(Prisma)로만 교체하면 됩니다.
 *
 * 저장 위치: {PROJECT_ROOT}/data/{table}.json
 *
 * 지원 메서드:
 *   table.findMany(opts?)         — 전체 조회 (where.source_id.in 필터 지원)
 *   table.findFirst(opts)         — 단건 조회
 *   table.create({ data })        — 새 row 삽입
 *   table.upsert({ where, create, update }) — source_id 기준 upsert
 *   table.updateMany({ where, data })       — 조건 일치 row 일괄 수정
 *   table.count()                 — row 수
 */

import fs from 'fs';
import path from 'path';

// ── 경로 ──────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');

function filePath(table: string): string {
  return path.join(DATA_DIR, `${table}.json`);
}

// ── 저수준 파일 I/O ───────────────────────────────────────────
function readTable<T>(table: string): T[] {
  const fp = filePath(table);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as T[];
  } catch {
    return [];
  }
}

function writeTable<T>(table: string, rows: T[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(table), JSON.stringify(rows, null, 2), 'utf-8');
}

// ── 공통 타입 ─────────────────────────────────────────────────
type Row = Record<string, unknown>;

type WhereClause = {
  source_id?: string | { in: string[] };
  series_id?: string;
  date?: Date | string;
  symbol?: string;
  ai_classification?: string;
  title?: { contains: string; mode?: string };
  actual?: null;
};

type FindManyOpts = {
  where?: WhereClause;
  select?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
};

type UpsertOpts<T extends Row> = {
  where: { source_id?: string; series_id_date?: { series_id: string; date: Date | string } };
  create: T;
  update: Partial<T>;
};

type UpdateManyOpts = {
  where: WhereClause;
  data: Partial<Row>;
};

// ── 매칭 헬퍼 ─────────────────────────────────────────────────
function matchesWhere(row: Row, where: WhereClause): boolean {
  // source_id 단건 또는 IN 매칭
  if (where.source_id !== undefined) {
    if (typeof where.source_id === 'string') {
      if (row['source_id'] !== where.source_id) return false;
    } else if ('in' in where.source_id) {
      if (!where.source_id.in.includes(row['source_id'] as string)) return false;
    }
  }

  // series_id
  if (where.series_id !== undefined) {
    if (row['series_id'] !== where.series_id) return false;
  }

  // symbol
  if (where.symbol !== undefined) {
    if (row['symbol'] !== where.symbol) return false;
  }

  // ai_classification
  if (where.ai_classification !== undefined) {
    if (row['ai_classification'] !== where.ai_classification) return false;
  }

  // actual: null (값이 없는 행만)
  if ('actual' in where && where.actual === null) {
    if (row['actual'] !== null && row['actual'] !== undefined) return false;
  }

  // title contains (case-insensitive)
  if (where.title?.contains !== undefined) {
    const haystack = String(row['title'] ?? '').toLowerCase();
    if (!haystack.includes(where.title.contains.toLowerCase())) return false;
  }

  // date 일치 (Date or string 모두 허용)
  if (where.date !== undefined) {
    const rowDate = String(row['date']).slice(0, 10);
    const targetDate = where.date instanceof Date
      ? where.date.toISOString().slice(0, 10)
      : String(where.date).slice(0, 10);
    if (rowDate !== targetDate) return false;
  }

  return true;
}

// ── 테이블 빌더 ───────────────────────────────────────────────
function makeTable<T extends Row>(tableName: string) {
  return {
    /** 전체 조회 */
    findMany(opts: FindManyOpts = {}): T[] {
      let rows = readTable<T>(tableName);

      if (opts.where) {
        rows = rows.filter((r) => matchesWhere(r as Row, opts.where!));
      }
      if (opts.orderBy) {
        const [field, dir] = Object.entries(opts.orderBy)[0];
        rows.sort((a, b) => {
          const av = String(a[field] ?? '');
          const bv = String(b[field] ?? '');
          return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      }
      if (opts.take !== undefined) {
        rows = rows.slice(0, opts.take);
      }
      if (opts.select) {
        const keys = Object.keys(opts.select).filter((k) => opts.select![k]);
        return rows.map((r) => Object.fromEntries(keys.map((k) => [k, r[k]])) as T);
      }
      return rows;
    },

    /** 단건 조회 */
    findFirst(opts: FindManyOpts = {}): T | null {
      const results = this.findMany({ ...opts, take: 1 });
      return results[0] ?? null;
    },

    /** 새 row 삽입 */
    create({ data }: { data: T }): T {
      const rows = readTable<T>(tableName);
      const newRow: T = {
        ...data,
        id: data['id'] ?? `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        created_at: data['created_at'] ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as T;
      rows.push(newRow);
      writeTable(tableName, rows);
      return newRow;
    },

    /** source_id 또는 series_id+date 기준 upsert */
    upsert(opts: UpsertOpts<T>): T {
      const rows = readTable<T>(tableName);

      // 매칭 조건 결정
      let existingIndex = -1;
      if (opts.where.source_id !== undefined) {
        existingIndex = rows.findIndex((r) => r['source_id'] === opts.where.source_id);
      } else if (opts.where.series_id_date !== undefined) {
        const { series_id, date } = opts.where.series_id_date;
        const targetDate = date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
        existingIndex = rows.findIndex(
          (r) =>
            r['series_id'] === series_id &&
            String(r['date']).slice(0, 10) === targetDate,
        );
      }

      if (existingIndex >= 0) {
        // UPDATE
        rows[existingIndex] = {
          ...rows[existingIndex],
          ...opts.update,
          updated_at: new Date().toISOString(),
        } as T;
        writeTable(tableName, rows);
        return rows[existingIndex];
      } else {
        // CREATE
        const newRow: T = {
          ...opts.create,
          id: opts.create['id'] ?? `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as T;
        rows.push(newRow);
        writeTable(tableName, rows);
        return newRow;
      }
    },

    /** 조건 일치 row들 일괄 업데이트 */
    updateMany(opts: UpdateManyOpts): { count: number } {
      const rows = readTable<T>(tableName);
      let count = 0;
      for (let i = 0; i < rows.length; i++) {
        if (matchesWhere(rows[i] as Row, opts.where)) {
          rows[i] = { ...rows[i], ...opts.data, updated_at: new Date().toISOString() } as T;
          count++;
        }
      }
      if (count > 0) writeTable(tableName, rows);
      return { count };
    },

    /** row 수 */
    count(opts: { where?: WhereClause } = {}): number {
      return this.findMany({ where: opts.where }).length;
    },
  };
}

// ── 테이블 인스턴스 (Prisma의 prisma.tableName 과 동일한 사용법) ──
export const mockDb = {
  economicEvent:  makeTable('economic_events'),
  earningsEvent:  makeTable('earnings_events'),
  ipoEvent:       makeTable('ipo_events'),
  breakingEvent:  makeTable('breaking_events'),
  etfQuote:       makeTable('etf_quotes'),
  fredSnapshot:   makeTable('fred_snapshots'),
};

// Prisma로 전환할 때: 아래 export만 db.ts의 prisma로 교체
export const db = mockDb;

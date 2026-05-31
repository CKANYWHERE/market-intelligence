export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayKey(): string {
  return formatDateKey(new Date());
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export interface GridDay {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function buildMonthGrid(year: number, month: number): GridDay[] {
  const today = getTodayKey();
  const firstDay = new Date(year, month - 1, 1);
  const lastDayNum = new Date(year, month, 0).getDate();
  const startDow = firstDay.getDay(); // 0 = Sunday

  const days: GridDay[] = [];

  // Pad with days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i);
    days.push({ date: d, dateKey: formatDateKey(d), isCurrentMonth: false, isToday: false });
  }

  // Days in current month
  for (let d = 1; d <= lastDayNum; d++) {
    const date = new Date(year, month - 1, d);
    const dateKey = formatDateKey(date);
    days.push({ date, dateKey, isCurrentMonth: true, isToday: dateKey === today });
  }

  // Pad with days from next month
  let next = 1;
  while (days.length % 7 !== 0) {
    const d = new Date(year, month, next++);
    days.push({ date: d, dateKey: formatDateKey(d), isCurrentMonth: false, isToday: false });
  }

  return days;
}

export function formatMonthTitle(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
}

import { addDays, formatISODate, parseISODate, type ISODateString } from "@/lib/cycle-engine";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 0 = Sunday .. 6 = Saturday, computed in UTC to stay consistent with the rest of the date math here. */
function weekdayOf(epochDay: number): number {
  return new Date(epochDay * MS_PER_DAY).getUTCDay();
}

export interface MonthGridDay {
  date: ISODateString;
  isCurrentMonth: boolean;
}

/** A Sunday-start grid for the given month, padded with adjacent-month days to fill whole weeks. */
export function buildMonthGrid(year: number, month: number): MonthGridDay[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  const firstOfMonth = parseISODate(`${year}-${pad(month)}-01`);
  const firstWeekday = weekdayOf(firstOfMonth);
  const gridStart = addDays(firstOfMonth, -firstWeekday);

  const nextMonthFirst =
    month === 12 ? parseISODate(`${year + 1}-01-01`) : parseISODate(`${year}-${pad(month + 1)}-01`);
  const daysInMonth = nextMonthFirst - firstOfMonth;
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const days: MonthGridDay[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = addDays(gridStart, i);
    days.push({
      date: formatISODate(date),
      isCurrentMonth: date >= firstOfMonth && date < nextMonthFirst,
    });
  }
  return days;
}

export function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroIndexed = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(zeroIndexed / 12), month: (((zeroIndexed % 12) + 12) % 12) + 1 };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

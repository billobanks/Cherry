import type { CalendarDayCell as CalendarDayCellData } from "@/lib/calendar";
import { DayCell } from "./day-cell";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarGrid({
  cells,
  selectedDate,
  onSelect,
}: {
  cells: CalendarDayCellData[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <span
            key={i}
            className="text-center font-mono text-[11px] font-semibold uppercase text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((cell) => (
          <DayCell
            key={cell.date}
            cell={cell}
            isSelected={cell.date === selectedDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

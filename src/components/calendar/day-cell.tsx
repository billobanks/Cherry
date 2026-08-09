"use client";

import { PHASE_COLOR_VAR } from "@/lib/phase-colors";
import type { CalendarDayCell as CalendarDayCellData } from "@/lib/calendar";

const LOGGED_FLOW_VALUES = new Set(["spotting", "light", "medium", "heavy"]);

function dayNumber(date: string): string {
  return String(Number(date.slice(8, 10)));
}

export function DayCell({
  cell,
  isSelected,
  onSelect,
}: {
  cell: CalendarDayCellData;
  isSelected: boolean;
  onSelect: (date: string) => void;
}) {
  const isLoggedPeriod = cell.loggedFlow != null && LOGGED_FLOW_VALUES.has(cell.loggedFlow);

  return (
    <button
      type="button"
      onClick={() => onSelect(cell.date)}
      aria-label={`${cell.date}${cell.isToday ? ", today" : ""}`}
      aria-pressed={isSelected}
      className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-xl border transition-colors ${
        isSelected
          ? "border-primary"
          : cell.isToday
            ? "border-foreground/50"
            : "border-transparent"
      } ${cell.isCurrentMonth ? "" : "opacity-35"}`}
      style={{
        background: cell.phase
          ? `color-mix(in srgb, ${PHASE_COLOR_VAR[cell.phase]} 16%, var(--card))`
          : "var(--card)",
      }}
    >
      <span
        className={`text-[13px] tabular-nums ${cell.isToday ? "font-bold" : "font-medium"} text-foreground`}
      >
        {dayNumber(cell.date)}
      </span>

      <span className="mt-0.5 flex h-2 items-center justify-center">
        {isLoggedPeriod ? (
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--primary)" }} aria-hidden />
        ) : cell.isPredictedPeriod ? (
          <span
            className="h-1.5 w-1.5 rounded-full border"
            style={{ borderColor: "var(--primary)" }}
            aria-hidden
          />
        ) : null}
      </span>

      <span className="absolute bottom-1 flex gap-0.5">
        {cell.hasSymptoms ? (
          <span className="h-1 w-1 rounded-full bg-foreground/50" aria-hidden />
        ) : null}
        {cell.hasMood ? <span className="h-1 w-1 rounded-full bg-moss" aria-hidden /> : null}
        {cell.hasIntercourse ? (
          <span className="h-1 w-1 rounded-full" style={{ background: "var(--chart-2)" }} aria-hidden />
        ) : null}
      </span>
    </button>
  );
}

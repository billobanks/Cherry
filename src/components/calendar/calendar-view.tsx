"use client";

import { useState } from "react";
import type { CalendarMonthData } from "@/lib/calendar";
import { CalendarGrid } from "./calendar-grid";
import { DayDetailPanel } from "./day-detail-panel";
import { FertilityToggle } from "./fertility-toggle";
import { Legend } from "./legend";
import { MonthNav } from "./month-nav";

export function CalendarView({ data }: { data: CalendarMonthData }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(data.today);

  const selectedDetail = selectedDate ? data.details[selectedDate] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-5 py-8 sm:px-8">
      <MonthNav year={data.year} month={data.month} monthLabel={data.monthLabel} />

      <CalendarGrid cells={data.cells} selectedDate={selectedDate} onSelect={setSelectedDate} />

      {selectedDetail ? (
        <DayDetailPanel
          detail={selectedDetail}
          fertilityTrackingEnabled={data.fertilityTrackingEnabled}
          onClose={() => setSelectedDate(null)}
        />
      ) : null}

      <Legend />

      <FertilityToggle enabled={data.fertilityTrackingEnabled} />
    </div>
  );
}

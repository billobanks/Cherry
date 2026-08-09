import { notFound } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";
import {
  buildCalendarDayEstimates,
  buildMonthGrid,
  formatMonthLabel,
  type CalendarDayCell,
  type CalendarDayDetail,
  type CalendarMonthData,
} from "@/lib/calendar";
import { calculateCycleInsights } from "@/lib/cycle-engine";
import { PHASE_SECTION_CONTENT } from "@/lib/insights";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function CalendarPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const today = "2026-08-08";
  const year = 2026;
  const month = 8;

  // A couple of logged historical cycles plus the current (real) one.
  const historicalStartDates = ["2026-06-01", "2026-06-29", "2026-07-27"];
  const mostRecentPeriodStartDate = historicalStartDates[historicalStartDates.length - 1];

  const cycleInsights = calculateCycleInsights({
    mostRecentPeriodStartDate,
    historicalPeriodStartDates: historicalStartDates,
    today,
  });

  const cells = buildMonthGrid(year, month);
  const rangeStart = cells[0].date;
  const rangeEnd = cells[cells.length - 1].date;

  const estimates = buildCalendarDayEstimates({
    historicalStartDates,
    effectiveCycleLengthDays: cycleInsights.effectiveCycleLengthDays,
    effectivePeriodLengthDays: cycleInsights.effectivePeriodLengthDays,
    rangeStart,
    rangeEnd,
  });
  const estimateByDate = new Map(estimates.map((e) => [e.date, e]));

  // Fixture "logged" data: the current period (Jul 27 - Jul 31), a symptom+mood
  // day, and one intercourse day, to demonstrate every visual state at once.
  const loggedFlowByDate: Record<string, "spotting" | "light" | "medium" | "heavy" | "none"> = {
    "2026-07-27": "medium",
    "2026-07-28": "heavy",
    "2026-07-29": "medium",
    "2026-07-30": "light",
    "2026-07-31": "spotting",
  };
  const symptomsByDate: Record<string, { key: string; label: string }[]> = {
    "2026-08-05": [
      { key: "headache", label: "Headache" },
      { key: "bloating", label: "Bloating" },
    ],
  };
  const moodByDate: Record<string, ("happy" | "calm" | "stressed")[]> = {
    "2026-08-05": ["stressed"],
    "2026-08-08": ["calm", "happy"],
  };
  const intercourseDates = new Set(["2026-08-03"]);

  const dayCells: CalendarDayCell[] = [];
  const details: Record<string, CalendarDayDetail> = {};

  for (const cell of cells) {
    const estimate = estimateByDate.get(cell.date) ?? null;
    const loggedFlow = loggedFlowByDate[cell.date] ?? null;
    const isPredictedPeriod = estimate?.phase === "menstrual" && estimate.isProjectedCycle && loggedFlow === null;
    const symptoms = symptomsByDate[cell.date] ?? [];
    const mood = moodByDate[cell.date] ?? [];
    const hasIntercourse = intercourseDates.has(cell.date);

    dayCells.push({
      date: cell.date,
      isCurrentMonth: cell.isCurrentMonth,
      isToday: cell.date === today,
      cycleDay: estimate?.cycleDay ?? null,
      phase: estimate?.phase ?? null,
      loggedFlow,
      isPredictedPeriod,
      hasSymptoms: symptoms.length > 0,
      hasMood: mood.length > 0,
      hasIntercourse,
    });

    details[cell.date] = {
      date: cell.date,
      cycleDay: estimate?.cycleDay ?? null,
      phase: estimate?.phase ?? null,
      phaseLabel: estimate
        ? estimate.phase === "ovulation_window"
          ? "Estimated ovulation window"
          : `Estimated ${estimate.phase} phase`
        : null,
      isPredictedPeriod,
      loggedFlow,
      mood,
      energyLevel: cell.date === "2026-08-08" ? 4 : null,
      sleepQuality: cell.date === "2026-08-08" ? 3 : null,
      symptoms,
      notes: cell.date === "2026-08-08" ? "Felt good on a walk this morning." : null,
      dailyInsight: estimate ? PHASE_SECTION_CONTENT[estimate.phase].body_overview.summary : null,
      intercourse: hasIntercourse ? true : null,
      hasCheckin: loggedFlow !== null || symptoms.length > 0 || mood.length > 0 || cell.date === "2026-08-08",
    };
  }

  const data: CalendarMonthData = {
    year,
    month,
    monthLabel: formatMonthLabel(year, month),
    today,
    cells: dayCells,
    details,
    fertilityTrackingEnabled: true,
  };

  return <CalendarView data={data} />;
}

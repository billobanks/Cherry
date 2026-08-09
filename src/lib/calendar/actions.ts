"use server";

import { CHECKIN_SYMPTOM_OPTIONS } from "@/lib/checkin";
import { calculateCycleInsights, type CyclePhase } from "@/lib/cycle-engine";
import { PHASE_SECTION_CONTENT } from "@/lib/insights";
import { createClient } from "@/lib/supabase/server";
import { buildMonthGrid, formatMonthLabel } from "./grid";
import { buildCalendarDayEstimates } from "./phase-map";
import type { CalendarDayCell, CalendarDayDetail, CalendarMonthData } from "./types";

export type GetCalendarMonthResult =
  | { status: "ready"; data: CalendarMonthData }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "error"; message: string };

const SYMPTOM_LABEL_BY_KEY = Object.fromEntries(CHECKIN_SYMPTOM_OPTIONS.map((s) => [s.key, s.label]));

function phaseLabelFor(phase: CyclePhase | null): string | null {
  if (!phase) return null;
  return phase === "ovulation_window" ? "Estimated ovulation window" : `Estimated ${phase} phase`;
}

export async function getCalendarMonth(year: number, month: number): Promise<GetCalendarMonthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity, fertility_tracking_enabled",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { status: "error", message: "We couldn't load your profile." };
  }
  if (!profile.last_period_start_date) {
    return { status: "needs_period_date" };
  }

  const { data: cycles } = await supabase
    .from("cycles")
    .select("start_date")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });
  const cycleStartDates = (cycles ?? []).map((c) => c.start_date);

  let cycleInsights;
  try {
    cycleInsights = calculateCycleInsights({
      mostRecentPeriodStartDate: profile.last_period_start_date,
      historicalPeriodStartDates: cycleStartDates,
      averageCycleLengthDays: profile.avg_cycle_length_days,
      averagePeriodDurationDays: profile.avg_period_length_days,
      cycleVariability: profile.cycle_regularity,
    });
  } catch {
    return { status: "error", message: "We couldn't estimate your cycle." };
  }

  const cells = buildMonthGrid(year, month);
  const rangeStart = cells[0].date;
  const rangeEnd = cells[cells.length - 1].date;

  const estimates = buildCalendarDayEstimates({
    historicalStartDates: cycleStartDates,
    effectiveCycleLengthDays: cycleInsights.effectiveCycleLengthDays,
    effectivePeriodLengthDays: cycleInsights.effectivePeriodLengthDays,
    rangeStart,
    rangeEnd,
  });
  const estimateByDate = new Map(estimates.map((e) => [e.date, e]));

  const [{ data: periodLogs }, { data: checkins }] = await Promise.all([
    supabase
      .from("period_day_logs")
      .select("log_date, flow_intensity")
      .eq("user_id", user.id)
      .gte("log_date", rangeStart)
      .lte("log_date", rangeEnd),
    supabase
      .from("daily_checkins")
      .select("id, checkin_date, flow, mood, energy_level, sleep_quality, notes, intercourse")
      .eq("user_id", user.id)
      .gte("checkin_date", rangeStart)
      .lte("checkin_date", rangeEnd),
  ]);

  const periodLogByDate = new Map((periodLogs ?? []).map((p) => [p.log_date, p.flow_intensity]));
  const checkinByDate = new Map((checkins ?? []).map((c) => [c.checkin_date, c]));

  const checkinIds = (checkins ?? []).map((c) => c.id);
  const { data: symptomRows } =
    checkinIds.length > 0
      ? await supabase
          .from("checkin_symptoms")
          .select("checkin_id, symptom_key")
          .in("checkin_id", checkinIds)
      : { data: [] as { checkin_id: string; symptom_key: string }[] };

  const symptomsByCheckinId = new Map<string, string[]>();
  for (const row of symptomRows ?? []) {
    const list = symptomsByCheckinId.get(row.checkin_id) ?? [];
    list.push(row.symptom_key);
    symptomsByCheckinId.set(row.checkin_id, list);
  }

  const dayCells: CalendarDayCell[] = [];
  const details: Record<string, CalendarDayDetail> = {};

  for (const cell of cells) {
    const estimate = estimateByDate.get(cell.date) ?? null;
    const checkin = checkinByDate.get(cell.date) ?? null;
    const loggedFlow = checkin?.flow ?? periodLogByDate.get(cell.date) ?? null;
    const isPredictedPeriod =
      estimate?.phase === "menstrual" && estimate.isProjectedCycle && loggedFlow === null;
    const symptomKeys = checkin ? (symptomsByCheckinId.get(checkin.id) ?? []) : [];

    dayCells.push({
      date: cell.date,
      isCurrentMonth: cell.isCurrentMonth,
      isToday: cell.date === cycleInsights.today,
      cycleDay: estimate?.cycleDay ?? null,
      phase: estimate?.phase ?? null,
      loggedFlow,
      isPredictedPeriod,
      hasSymptoms: symptomKeys.length > 0,
      hasMood: (checkin?.mood.length ?? 0) > 0,
      hasIntercourse: profile.fertility_tracking_enabled && checkin?.intercourse === true,
    });

    details[cell.date] = {
      date: cell.date,
      cycleDay: estimate?.cycleDay ?? null,
      phase: estimate?.phase ?? null,
      phaseLabel: phaseLabelFor(estimate?.phase ?? null),
      isPredictedPeriod,
      loggedFlow,
      mood: checkin?.mood ?? [],
      energyLevel: checkin?.energy_level ?? null,
      sleepQuality: checkin?.sleep_quality ?? null,
      symptoms: symptomKeys.map((key) => ({ key, label: SYMPTOM_LABEL_BY_KEY[key] ?? key })),
      notes: checkin?.notes ?? null,
      dailyInsight: estimate ? PHASE_SECTION_CONTENT[estimate.phase].body_overview.summary : null,
      intercourse: checkin?.intercourse ?? null,
      hasCheckin: checkin !== null,
    };
  }

  return {
    status: "ready",
    data: {
      year,
      month,
      monthLabel: formatMonthLabel(year, month),
      today: cycleInsights.today,
      cells: dayCells,
      details,
      fertilityTrackingEnabled: profile.fertility_tracking_enabled,
    },
  };
}

export async function toggleFertilityTracking(
  enabled: boolean,
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({ fertility_tracking_enabled: enabled })
    .eq("id", user.id);

  return error ? { success: false, message: "Couldn't update that setting." } : { success: true };
}

export async function setIntercourseForDate(
  date: string,
  value: boolean | null,
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("daily_checkins")
    .upsert(
      { user_id: user.id, checkin_date: date, intercourse: value },
      { onConflict: "user_id,checkin_date" },
    );

  return error ? { success: false, message: "Couldn't save that." } : { success: true };
}

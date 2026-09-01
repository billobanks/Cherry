"use server";

import { CHECKIN_SYMPTOM_OPTIONS } from "@/lib/checkin";
import { calculateCycleInsights, type CyclePhase } from "@/lib/cycle-engine";
import { PHASE_SECTION_CONTENT } from "@/lib/insights";
import { createClient } from "@/lib/supabase/server";
import type { Mood } from "@/types/database";
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

  const [{ data: profile, error: profileError }, { data: preferences }] = await Promise.all([
    supabase
      .from("profiles")
      .select("last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity")
      .eq("id", user.id)
      .single(),
    supabase.from("user_preferences").select("fertility_tracking_enabled").eq("user_id", user.id).maybeSingle(),
  ]);

  if (profileError || !profile) {
    return { status: "error", message: "We couldn't load your profile." };
  }
  if (!profile.last_period_start_date) {
    return { status: "needs_period_date" };
  }

  const fertilityTrackingEnabled = preferences?.fertility_tracking_enabled ?? false;

  const { data: cycles } = await supabase
    .from("menstrual_cycles")
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
      .from("period_logs")
      .select("log_date, flow_intensity")
      .eq("user_id", user.id)
      .gte("log_date", rangeStart)
      .lte("log_date", rangeEnd),
    supabase
      .from("daily_logs")
      .select("id, checkin_date, flow, notes, intercourse")
      .eq("user_id", user.id)
      .gte("checkin_date", rangeStart)
      .lte("checkin_date", rangeEnd),
  ]);

  const periodLogByDate = new Map((periodLogs ?? []).map((p) => [p.log_date, p.flow_intensity]));
  const checkinByDate = new Map((checkins ?? []).map((c) => [c.checkin_date, c]));

  const checkinIds = (checkins ?? []).map((c) => c.id);
  const [{ data: symptomRows }, { data: moodRows }, { data: sleepRows }, { data: energyRows }] =
    checkinIds.length > 0
      ? await Promise.all([
          supabase.from("symptom_logs").select("daily_log_id, symptom_key").in("daily_log_id", checkinIds),
          supabase.from("mood_logs").select("daily_log_id, mood_key").in("daily_log_id", checkinIds),
          supabase.from("sleep_logs").select("daily_log_id, sleep_quality").in("daily_log_id", checkinIds),
          supabase.from("energy_logs").select("daily_log_id, energy_level").in("daily_log_id", checkinIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const symptomsByCheckinId = new Map<string, string[]>();
  for (const row of symptomRows ?? []) {
    const list = symptomsByCheckinId.get(row.daily_log_id) ?? [];
    list.push(row.symptom_key);
    symptomsByCheckinId.set(row.daily_log_id, list);
  }
  const moodsByCheckinId = new Map<string, Mood[]>();
  for (const row of moodRows ?? []) {
    const list = moodsByCheckinId.get(row.daily_log_id) ?? [];
    list.push(row.mood_key);
    moodsByCheckinId.set(row.daily_log_id, list);
  }
  const sleepByCheckinId = new Map((sleepRows ?? []).map((r) => [r.daily_log_id, r.sleep_quality]));
  const energyByCheckinId = new Map((energyRows ?? []).map((r) => [r.daily_log_id, r.energy_level]));

  const dayCells: CalendarDayCell[] = [];
  const details: Record<string, CalendarDayDetail> = {};

  for (const cell of cells) {
    const estimate = estimateByDate.get(cell.date) ?? null;
    const checkin = checkinByDate.get(cell.date) ?? null;
    const loggedFlow = checkin?.flow ?? periodLogByDate.get(cell.date) ?? null;
    const isPredictedPeriod =
      estimate?.phase === "menstrual" && estimate.isProjectedCycle && loggedFlow === null;
    const symptomKeys = checkin ? (symptomsByCheckinId.get(checkin.id) ?? []) : [];
    const mood = checkin ? (moodsByCheckinId.get(checkin.id) ?? []) : [];

    dayCells.push({
      date: cell.date,
      isCurrentMonth: cell.isCurrentMonth,
      isToday: cell.date === cycleInsights.today,
      cycleDay: estimate?.cycleDay ?? null,
      phase: estimate?.phase ?? null,
      loggedFlow,
      isPredictedPeriod,
      hasSymptoms: symptomKeys.length > 0,
      hasMood: mood.length > 0,
      hasIntercourse: fertilityTrackingEnabled && checkin?.intercourse === true,
    });

    details[cell.date] = {
      date: cell.date,
      cycleDay: estimate?.cycleDay ?? null,
      phase: estimate?.phase ?? null,
      phaseLabel: phaseLabelFor(estimate?.phase ?? null),
      isPredictedPeriod,
      loggedFlow,
      mood,
      energyLevel: checkin ? (energyByCheckinId.get(checkin.id) ?? null) : null,
      sleepQuality: checkin ? (sleepByCheckinId.get(checkin.id) ?? null) : null,
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
      fertilityTrackingEnabled,
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
    .from("user_preferences")
    .upsert({ user_id: user.id, fertility_tracking_enabled: enabled }, { onConflict: "user_id" });

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
    .from("daily_logs")
    .upsert(
      { user_id: user.id, checkin_date: date, intercourse: value },
      { onConflict: "user_id,checkin_date" },
    );

  return error ? { success: false, message: "Couldn't save that." } : { success: true };
}

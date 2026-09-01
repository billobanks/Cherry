"use server";

import { DEFAULT_PERIOD_LENGTH_DAYS, calculateCycleInsights, formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { labelForSymptomKey } from "@/lib/insights";
import { analyzeSymptomPatterns, buildCompletedCycles, type SymptomLogEntry } from "@/lib/patterns";
import { saveCyclePrediction } from "@/lib/repository/predictions";
import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/types/database";
import { buildTodayEngineOutput } from "./engine";
import type { HistoricalSymptomPattern, TodayEngineOutput, TodayEngineSignals } from "./types";

export type GetTodayEngineResult =
  | { status: "ready"; output: TodayEngineOutput }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getTodayEngineOutput(): Promise<GetTodayEngineResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const [{ data: profile, error: profileError }, { data: preferences }, { data: goalRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("dietary_preference, food_allergies, foods_to_avoid, workout_preferences")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_goals").select("goal_key").eq("user_id", user.id),
  ]);

  if (profileError || !profile) {
    return { status: "error", message: "We couldn't load your profile." };
  }
  if (!profile.last_period_start_date) {
    return { status: "needs_period_date" };
  }

  const goals: Goal[] = (goalRows ?? []).map((g) => g.goal_key);

  const { data: cycles } = await supabase
    .from("menstrual_cycles")
    .select("start_date, period_length_days")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  let cycleInsights;
  try {
    cycleInsights = calculateCycleInsights({
      mostRecentPeriodStartDate: profile.last_period_start_date,
      historicalPeriodStartDates: (cycles ?? []).map((c) => c.start_date),
      averageCycleLengthDays: profile.avg_cycle_length_days,
      averagePeriodDurationDays: profile.avg_period_length_days,
      cycleVariability: profile.cycle_regularity,
    });
  } catch {
    return { status: "error", message: "We couldn't estimate today's cycle phase." };
  }

  const todayISO = formatISODate(todayEpochDays());

  const [today, historicalPatterns] = await Promise.all([
    getTodaysSignals(supabase, user.id, todayISO),
    getHistoricalPatterns(supabase, user.id, cycleInsights.currentPhase, cycles ?? [], profile.avg_period_length_days),
  ]);

  // Best-effort snapshot — never fail the Today response over this.
  void saveCyclePrediction(supabase, user.id, {
    predictedPeriodStart: cycleInsights.estimatedNextPeriod.date,
    confidence: cycleInsights.estimatedNextPeriod.confidence,
    currentPhase: cycleInsights.currentPhase,
    currentCycleDay: cycleInsights.currentCycleDay,
  });

  const output = buildTodayEngineOutput({
    cycleDay: cycleInsights.currentCycleDay,
    phase: cycleInsights.currentPhase,
    today,
    historicalPatterns,
    goals,
    dietaryPreference: preferences?.dietary_preference ?? "none",
    foodAllergies: preferences?.food_allergies ?? [],
    foodsToAvoid: preferences?.foods_to_avoid ?? [],
    preferredMovementTypes: preferences?.workout_preferences ?? [],
  });

  return { status: "ready", output };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getTodaysSignals(supabase: Supabase, userId: string, todayISO: string): Promise<TodayEngineSignals | null> {
  const { data: dailyLog } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("checkin_date", todayISO)
    .maybeSingle();

  if (!dailyLog) return null;

  const [{ data: moodRows }, { data: sleepRow }, { data: energyRow }, { data: symptoms }] = await Promise.all([
    supabase.from("mood_logs").select("mood_key").eq("daily_log_id", dailyLog.id),
    supabase.from("sleep_logs").select("sleep_quality").eq("daily_log_id", dailyLog.id).maybeSingle(),
    supabase.from("energy_logs").select("energy_level").eq("daily_log_id", dailyLog.id).maybeSingle(),
    supabase.from("symptom_logs").select("symptom_key").eq("daily_log_id", dailyLog.id),
  ]);

  return {
    energyLevel: energyRow?.energy_level ?? null,
    sleepQuality: sleepRow?.sleep_quality ?? null,
    mood: (moodRows ?? []).map((m) => m.mood_key),
    symptomKeys: (symptoms ?? []).map((s) => s.symptom_key),
  };
}

async function getHistoricalPatterns(
  supabase: Supabase,
  userId: string,
  currentPhase: Parameters<typeof analyzeSymptomPatterns>[0]["currentPhase"],
  cycles: { start_date: string; period_length_days: number | null }[],
  fallbackPeriodLengthDays: number | null,
): Promise<HistoricalSymptomPattern[]> {
  if (cycles.length < 3) return []; // need at least 2 completed cycles (3 boundary dates)

  const completedCycles = buildCompletedCycles(cycles, fallbackPeriodLengthDays, DEFAULT_PERIOD_LENGTH_DAYS);

  const { data: dailyLogs } = await supabase.from("daily_logs").select("id, checkin_date").eq("user_id", userId);
  if (!dailyLogs || dailyLogs.length === 0) return [];

  const logDateById = new Map(dailyLogs.map((c) => [c.id, c.checkin_date]));

  const { data: symptomRows } = await supabase
    .from("symptom_logs")
    .select("daily_log_id, symptom_key")
    .eq("user_id", userId)
    .in(
      "daily_log_id",
      dailyLogs.map((c) => c.id),
    );

  const symptomLogs: SymptomLogEntry[] = (symptomRows ?? [])
    .map((row) => {
      const date = logDateById.get(row.daily_log_id);
      return date ? { date, symptomKey: row.symptom_key } : null;
    })
    .filter((entry): entry is SymptomLogEntry => entry !== null);

  const patterns = analyzeSymptomPatterns({ currentPhase, completedCycles, symptomLogs });

  return patterns.slice(0, 3).map((pattern) => ({
    symptomKey: pattern.symptomKey,
    label: labelForSymptomKey(pattern.symptomKey),
    occurrences: pattern.occurrences,
    eligibleCycles: pattern.eligibleCycles,
  }));
}

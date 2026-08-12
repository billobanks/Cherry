"use server";

import { DEFAULT_PERIOD_LENGTH_DAYS, calculateCycleInsights, formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { labelForSymptomKey } from "@/lib/insights";
import { analyzeSymptomPatterns, buildCompletedCycles, type SymptomLogEntry } from "@/lib/patterns";
import { createClient } from "@/lib/supabase/server";
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity, goals, dietary_preference, food_allergies, foods_to_avoid, workout_preferences",
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

  const output = buildTodayEngineOutput({
    cycleDay: cycleInsights.currentCycleDay,
    phase: cycleInsights.currentPhase,
    today,
    historicalPatterns,
    goals: profile.goals,
    dietaryPreference: profile.dietary_preference,
    foodAllergies: profile.food_allergies,
    foodsToAvoid: profile.foods_to_avoid,
    preferredMovementTypes: profile.workout_preferences,
  });

  return { status: "ready", output };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getTodaysSignals(supabase: Supabase, userId: string, todayISO: string): Promise<TodayEngineSignals | null> {
  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("id, mood, energy_level, sleep_quality")
    .eq("user_id", userId)
    .eq("checkin_date", todayISO)
    .maybeSingle();

  if (!checkin) return null;

  const { data: symptoms } = await supabase.from("checkin_symptoms").select("symptom_key").eq("checkin_id", checkin.id);

  return {
    energyLevel: checkin.energy_level,
    sleepQuality: checkin.sleep_quality,
    mood: checkin.mood,
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

  const { data: checkins } = await supabase.from("daily_checkins").select("id, checkin_date").eq("user_id", userId);
  if (!checkins || checkins.length === 0) return [];

  const checkinDateById = new Map(checkins.map((c) => [c.id, c.checkin_date]));

  const { data: symptomRows } = await supabase
    .from("checkin_symptoms")
    .select("checkin_id, symptom_key")
    .eq("user_id", userId)
    .in(
      "checkin_id",
      checkins.map((c) => c.id),
    );

  const symptomLogs: SymptomLogEntry[] = (symptomRows ?? [])
    .map((row) => {
      const date = checkinDateById.get(row.checkin_id);
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

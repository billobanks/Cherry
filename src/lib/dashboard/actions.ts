"use server";

import { CHECKIN_SYMPTOM_OPTIONS } from "@/lib/checkin";
import { DEFAULT_PERIOD_LENGTH_DAYS, calculateCycleInsights } from "@/lib/cycle-engine";
import { SECTION_TITLES } from "@/lib/insights";
import { analyzeSymptomPatterns, buildCompletedCycles } from "@/lib/patterns";
import type { SymptomLogEntry } from "@/lib/patterns";
import { createClient } from "@/lib/supabase/server";
import { buildTodayEngineOutput } from "@/lib/today-engine";
import type { TodayEngineSignals } from "@/lib/today-engine";
import type { Goal } from "@/types/database";
import { computeUpcomingChanges } from "./upcoming-changes";
import type { DashboardData, PatternDisplay, RecommendedCard, TodaysBody } from "./types";

export type GetDashboardDataResult =
  | { status: "ready"; data: DashboardData }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "error"; message: string };

const SYMPTOM_LABEL_BY_KEY = Object.fromEntries(
  CHECKIN_SYMPTOM_OPTIONS.map((s) => [s.key, s.label]),
);

export async function getDashboardData(): Promise<GetDashboardDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const [{ data: profile, error: profileError }, { data: preferences }, { data: goalRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity")
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
    return { status: "error", message: "We couldn't estimate today's cycle phase." };
  }

  const [{ body: todaysBody, signals: todaySignals }, patterns] = await Promise.all([
    getTodaysData(supabase, user.id, cycleInsights.today),
    getPatterns(
      supabase,
      user.id,
      cycleInsights.currentPhase,
      cycles ?? [],
      profile.avg_period_length_days,
    ),
  ]);

  const upcomingChanges = computeUpcomingChanges({
    today: cycleInsights.today,
    currentCycleDay: cycleInsights.currentCycleDay,
    phases: cycleInsights.phases,
    nextPeriodDate: cycleInsights.estimatedNextPeriod.date,
  });

  // The single personalized-recommendation composer — combines cycle
  // position, today's real signals, this user's own historical patterns,
  // goals, and preferences. Rules-based and deterministic; see
  // src/lib/today-engine/engine.ts.
  const todayEngineOutput = buildTodayEngineOutput({
    cycleDay: cycleInsights.currentCycleDay,
    phase: cycleInsights.currentPhase,
    today: todaySignals,
    historicalPatterns: patterns,
    goals,
    dietaryPreference: preferences?.dietary_preference ?? "none",
    foodAllergies: preferences?.food_allergies ?? [],
    foodsToAvoid: preferences?.foods_to_avoid ?? [],
    preferredMovementTypes: preferences?.workout_preferences ?? [],
  });

  const recommended: RecommendedCard[] = [
    {
      key: "nutrition",
      title: SECTION_TITLES.nutrition,
      teaser: `${todayEngineOutput.nutrition.meal.title} — ${todayEngineOutput.nutrition.meal.description}`,
    },
    { key: "exercise", title: SECTION_TITLES.exercise, teaser: todayEngineOutput.movement.why },
    { key: "self_care", title: SECTION_TITLES.self_care, teaser: todayEngineOutput.selfCare.suggestion },
    { key: "sleep", title: SECTION_TITLES.sleep, teaser: todayEngineOutput.sleep.suggestion },
  ];

  const data: DashboardData = {
    displayName: profile.display_name,
    today: cycleInsights.today,
    currentCycleDay: cycleInsights.currentCycleDay,
    cycleLengthDays: cycleInsights.effectiveCycleLengthDays,
    phase: cycleInsights.currentPhase,
    phaseLabel: cycleInsights.currentPhase === "ovulation_window"
      ? "Estimated ovulation window"
      : `Estimated ${cycleInsights.currentPhase} phase`,
    phases: cycleInsights.phases,
    nextPeriod: {
      date: cycleInsights.estimatedNextPeriod.date,
      daysUntil: cycleInsights.estimatedNextPeriod.daysUntil,
      confidence: cycleInsights.estimatedNextPeriod.confidence,
    },
    todaysInsight: {
      headline: todayEngineOutput.headline,
      explanation: todayEngineOutput.bodyInsight,
    },
    todaysBody,
    upcomingChanges,
    recommended,
    patterns,
  };

  return { status: "ready", data };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getTodaysData(
  supabase: Supabase,
  userId: string,
  today: string,
): Promise<{ body: TodaysBody; signals: TodayEngineSignals | null }> {
  const { data: dailyLog } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .maybeSingle();

  if (!dailyLog) {
    return {
      body: { hasLoggedToday: false, mood: [], energyLevel: null, sleepQuality: null, hasCravings: false },
      signals: null,
    };
  }

  const [{ data: moodRows }, { data: sleepRow }, { data: energyRow }, { data: symptoms }] = await Promise.all([
    supabase.from("mood_logs").select("mood_key").eq("daily_log_id", dailyLog.id),
    supabase.from("sleep_logs").select("sleep_quality").eq("daily_log_id", dailyLog.id).maybeSingle(),
    supabase.from("energy_logs").select("energy_level").eq("daily_log_id", dailyLog.id).maybeSingle(),
    supabase.from("symptom_logs").select("symptom_key").eq("daily_log_id", dailyLog.id),
  ]);

  const mood = (moodRows ?? []).map((m) => m.mood_key);
  const energyLevel = energyRow?.energy_level ?? null;
  const sleepQuality = sleepRow?.sleep_quality ?? null;
  const symptomKeys = (symptoms ?? []).map((s) => s.symptom_key);

  return {
    body: {
      hasLoggedToday: true,
      mood,
      energyLevel,
      sleepQuality,
      hasCravings: symptomKeys.includes("food_cravings"),
    },
    signals: { energyLevel, sleepQuality, mood, symptomKeys },
  };
}

async function getPatterns(
  supabase: Supabase,
  userId: string,
  currentPhase: DashboardData["phase"],
  cycles: { start_date: string; period_length_days: number | null }[],
  fallbackPeriodLengthDays: number | null,
): Promise<PatternDisplay[]> {
  if (cycles.length < 3) return []; // need at least 2 completed cycles (3 boundary dates)

  const completedCycles = buildCompletedCycles(
    cycles,
    fallbackPeriodLengthDays,
    DEFAULT_PERIOD_LENGTH_DAYS,
  );

  const { data: dailyLogs } = await supabase
    .from("daily_logs")
    .select("id, checkin_date")
    .eq("user_id", userId);

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
    label: SYMPTOM_LABEL_BY_KEY[pattern.symptomKey] ?? pattern.symptomKey.replace(/_/g, " "),
    occurrences: pattern.occurrences,
    eligibleCycles: pattern.eligibleCycles,
  }));
}

"use server";

import { CHECKIN_SYMPTOM_OPTIONS } from "@/lib/checkin";
import { DEFAULT_PERIOD_LENGTH_DAYS, calculateCycleInsights } from "@/lib/cycle-engine";
import { PHASE_SECTION_CONTENT, SECTION_TITLES } from "@/lib/insights";
import { analyzeSymptomPatterns, buildCompletedCycles } from "@/lib/patterns";
import type { SymptomLogEntry } from "@/lib/patterns";
import { createClient } from "@/lib/supabase/server";
import { computeUpcomingChanges } from "./upcoming-changes";
import type { DashboardData, PatternDisplay, RecommendedCard } from "./types";

export type GetDashboardDataResult =
  | { status: "ready"; data: DashboardData }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "error"; message: string };

const SYMPTOM_LABEL_BY_KEY = Object.fromEntries(
  CHECKIN_SYMPTOM_OPTIONS.map((s) => [s.key, s.label]),
);

const RECOMMENDED_KEYS = ["nutrition", "exercise", "self_care", "sleep"] as const;

export async function getDashboardData(): Promise<GetDashboardDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "display_name, last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity",
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

  const phaseContent = PHASE_SECTION_CONTENT[cycleInsights.currentPhase];

  const [todaysBody, patterns] = await Promise.all([
    getTodaysBody(supabase, user.id, cycleInsights.today),
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

  const recommended: RecommendedCard[] = RECOMMENDED_KEYS.map((key) => ({
    key,
    title: SECTION_TITLES[key],
    teaser: phaseContent[key].points[0] ?? phaseContent[key].summary,
  }));

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
      headline: phaseContent.energy.summary,
      explanation: phaseContent.energy.points[0] ?? "",
    },
    todaysBody,
    upcomingChanges,
    recommended,
    patterns,
  };

  return { status: "ready", data };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getTodaysBody(
  supabase: Supabase,
  userId: string,
  today: string,
): Promise<DashboardData["todaysBody"]> {
  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("id, mood, energy_level, sleep_quality")
    .eq("user_id", userId)
    .eq("checkin_date", today)
    .maybeSingle();

  if (!checkin) {
    return {
      hasLoggedToday: false,
      mood: [],
      energyLevel: null,
      sleepQuality: null,
      hasCravings: false,
    };
  }

  const { data: symptoms } = await supabase
    .from("checkin_symptoms")
    .select("symptom_key")
    .eq("checkin_id", checkin.id);

  return {
    hasLoggedToday: true,
    mood: checkin.mood,
    energyLevel: checkin.energy_level,
    sleepQuality: checkin.sleep_quality,
    hasCravings: (symptoms ?? []).some((s) => s.symptom_key === "food_cravings"),
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

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("id, checkin_date")
    .eq("user_id", userId);

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
    label: SYMPTOM_LABEL_BY_KEY[pattern.symptomKey] ?? pattern.symptomKey.replace(/_/g, " "),
    occurrences: pattern.occurrences,
    eligibleCycles: pattern.eligibleCycles,
  }));
}

"use server";

import { calculateCycleInsights, parseISODate } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import type { MovementType } from "@/types/database";
import { generateMovementRecommendation } from "./recommend";
import type { MovementRecommendation } from "./types";

export type GetMovementRecommendationResult =
  | {
      status: "ready";
      recommendation: MovementRecommendation;
      hasLoggedToday: boolean;
      workoutPreferences: MovementType[];
    }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getMovementRecommendation(): Promise<GetMovementRecommendationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity, workout_preferences",
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

  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("id, energy_level, sleep_quality")
    .eq("user_id", user.id)
    .eq("checkin_date", cycleInsights.today)
    .maybeSingle();

  let hasCramps = false;
  let hasFatigue = false;
  if (checkin) {
    const { data: symptoms } = await supabase
      .from("checkin_symptoms")
      .select("symptom_key")
      .eq("checkin_id", checkin.id);
    const keys = new Set((symptoms ?? []).map((s) => s.symptom_key));
    hasCramps = keys.has("cramps");
    hasFatigue = keys.has("fatigue");
  }

  const recommendation = generateMovementRecommendation({
    phase: cycleInsights.currentPhase,
    energyLevel: checkin?.energy_level ?? null,
    hasCramps,
    hasFatigue,
    sleepQuality: checkin?.sleep_quality ?? null,
    preferredTypes: profile.workout_preferences,
    dayNumber: parseISODate(cycleInsights.today),
  });

  return {
    status: "ready",
    recommendation,
    hasLoggedToday: checkin !== null,
    workoutPreferences: profile.workout_preferences,
  };
}

export async function updateWorkoutPreferences(
  preferences: MovementType[],
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({ workout_preferences: preferences })
    .eq("id", user.id);

  return error ? { success: false, message: "Couldn't save your preferences." } : { success: true };
}

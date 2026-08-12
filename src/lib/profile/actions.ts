"use server";

import { createClient } from "@/lib/supabase/server";
import type { CycleRegularity, DietaryPreference, Goal, MovementType, PrimaryFocus } from "@/types/database";

export interface ProfileData {
  displayName: string | null;
  email: string | null;
  primaryFocus: PrimaryFocus | null;
  avgCycleLengthDays: number | null;
  avgPeriodLengthDays: number | null;
  cycleRegularity: CycleRegularity | null;
  goals: Goal[];
  dietaryPreference: DietaryPreference;
  foodAllergies: string[];
  foodsToAvoid: string[];
  workoutPreferences: MovementType[];
}

export type GetProfileResult =
  | { status: "ready"; profile: ProfileData }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getProfile(): Promise<GetProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "display_name, primary_focus, avg_cycle_length_days, avg_period_length_days, cycle_regularity, goals, dietary_preference, food_allergies, foods_to_avoid, workout_preferences",
    )
    .eq("id", user.id)
    .single();

  if (error || !profile) return { status: "error", message: "We couldn't load your profile." };

  return {
    status: "ready",
    profile: {
      displayName: profile.display_name,
      email: user.email ?? null,
      primaryFocus: profile.primary_focus,
      avgCycleLengthDays: profile.avg_cycle_length_days,
      avgPeriodLengthDays: profile.avg_period_length_days,
      cycleRegularity: profile.cycle_regularity,
      goals: profile.goals,
      dietaryPreference: profile.dietary_preference,
      foodAllergies: profile.food_allergies,
      foodsToAvoid: profile.foods_to_avoid,
      workoutPreferences: profile.workout_preferences,
    },
  };
}

export interface UpdateProfileInput {
  displayName: string;
  primaryFocus: PrimaryFocus | null;
  avgCycleLengthDays: number | null;
  avgPeriodLengthDays: number | null;
  cycleRegularity: CycleRegularity | null;
  goals: Goal[];
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim() || null,
      primary_focus: input.primaryFocus,
      avg_cycle_length_days: input.avgCycleLengthDays,
      avg_period_length_days: input.avgPeriodLengthDays,
      cycle_regularity: input.cycleRegularity,
      goals: input.goals,
    })
    .eq("id", user.id);

  return error ? { success: false, message: "Couldn't save your profile." } : { success: true };
}

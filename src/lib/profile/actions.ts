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

  const [{ data: profile, error }, { data: preferences }, { data: goalRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, primary_focus, avg_cycle_length_days, avg_period_length_days, cycle_regularity")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("dietary_preference, food_allergies, foods_to_avoid, workout_preferences")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_goals").select("goal_key").eq("user_id", user.id),
  ]);

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
      goals: (goalRows ?? []).map((g) => g.goal_key),
      dietaryPreference: preferences?.dietary_preference ?? "none",
      foodAllergies: preferences?.food_allergies ?? [],
      foodsToAvoid: preferences?.foods_to_avoid ?? [],
      workoutPreferences: preferences?.workout_preferences ?? [],
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
    })
    .eq("id", user.id);

  if (error) return { success: false, message: "Couldn't save your profile." };

  const { error: deleteGoalsError } = await supabase.from("user_goals").delete().eq("user_id", user.id);
  if (deleteGoalsError) return { success: false, message: "Couldn't save your goals." };

  if (input.goals.length > 0) {
    const { error: insertGoalsError } = await supabase
      .from("user_goals")
      .insert(input.goals.map((goalKey) => ({ user_id: user.id, goal_key: goalKey })));
    if (insertGoalsError) return { success: false, message: "Couldn't save your goals." };
  }

  return { success: true };
}

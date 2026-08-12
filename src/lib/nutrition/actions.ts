"use server";

import { calculateCycleInsights } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import { hasPremiumAccessForUser } from "@/lib/subscription";
import type { DietaryPreference } from "@/types/database";
import { PHASE_NUTRITION_CONTENT } from "./content";
import { filterFoods, filterMeals } from "./filter";
import { FOOD_DATABASE, NUTRIENT_CATEGORY_LABELS, NUTRIENT_CATEGORY_ORDER } from "./foods";
import type { NutritionData } from "./types";

export type GetNutritionDataResult =
  | { status: "ready"; data: NutritionData }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

export async function getNutritionData(): Promise<GetNutritionDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  // Nutrition guidance is a Premium feature — checked here, not just at the
  // page level, so calling this action directly can't bypass entitlement.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity, dietary_preference, food_allergies, foods_to_avoid",
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

  const copy = PHASE_NUTRITION_CONTENT[cycleInsights.currentPhase];
  const avoidTerms = [...profile.food_allergies, ...profile.foods_to_avoid];

  const foodCategories = NUTRIENT_CATEGORY_ORDER.map((category) => ({
    category,
    label: NUTRIENT_CATEGORY_LABELS[category],
    guidance: copy.categoryGuidance[category],
    foods: filterFoods(FOOD_DATABASE[category], profile.dietary_preference, avoidTerms),
  }));

  const data: NutritionData = {
    phase: cycleInsights.currentPhase,
    phaseLabel:
      cycleInsights.currentPhase === "ovulation_window"
        ? "Estimated ovulation window"
        : `Estimated ${cycleInsights.currentPhase} phase`,
    intro: copy.intro,
    whyHelpful: copy.whyHelpful,
    hydration: copy.hydration,
    foodCategories,
    meals: filterMeals(copy.meals, profile.dietary_preference, avoidTerms),
    dietaryPreference: profile.dietary_preference,
    foodAllergies: profile.food_allergies,
    foodsToAvoid: profile.foods_to_avoid,
  };

  return { status: "ready", data };
}

export async function updateNutritionPreferences(input: {
  dietaryPreference: DietaryPreference;
  foodAllergies: string[];
  foodsToAvoid: string[];
}): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const clean = (list: string[]) =>
    Array.from(new Set(list.map((s) => s.trim()).filter(Boolean))).slice(0, 25);

  const { error } = await supabase
    .from("profiles")
    .update({
      dietary_preference: input.dietaryPreference,
      food_allergies: clean(input.foodAllergies),
      foods_to_avoid: clean(input.foodsToAvoid),
    })
    .eq("id", user.id);

  return error ? { success: false, message: "Couldn't save your preferences." } : { success: true };
}

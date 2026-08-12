"use server";

import { createClient } from "@/lib/supabase/server";
import { hasPremiumAccessForUser } from "@/lib/subscription";
import type { PregnancyDietaryPreference } from "@/types/database";
import { calculatePregnancyDating } from "./dating-engine";
import {
  CONSTIPATION_FOOD_TIPS,
  dietaryPreferenceIsPlantBased,
  FOOD_SAFETY_GUIDANCE,
  FOODS_TO_LIMIT_OR_AVOID,
  HYDRATION_GUIDANCE,
  NAUSEA_FOOD_TIPS,
  NUTRIENT_CATEGORIES,
  TRIMESTER_NUTRITION,
} from "./nutrition-content";
import { getActivePregnancy } from "./pregnancy-lookup";

export interface PregnancyNutritionData {
  trimester: "first" | "second" | "third";
  intro: string;
  thisTrimester: string;
  nutrientCategories: { label: string; guidance: string }[];
  hydration: string;
  mealIdeas: string[];
  snacks: string[];
  nauseaTips: string[];
  constipationTips: string[];
  foodSafety: string[];
  foodsToLimitOrAvoid: string[];
  dietaryPreferences: PregnancyDietaryPreference[];
  culturalPreferences: string | null;
  foodAllergies: string[];
}

export type GetPregnancyNutritionResult =
  | { status: "ready"; data: PregnancyNutritionData }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

export async function getPregnancyNutrition(): Promise<GetPregnancyNutritionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  // Nutrition guidance is a Premium feature — checked here so calling this
  // action directly can't bypass entitlement.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const dating = calculatePregnancyDating({
    lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
    clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
    ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
    userEnteredDueDate: pregnancy.estimatedDueDate,
  });

  const { data: prefs } = await supabase
    .from("pregnancy_nutrition_preferences")
    .select("dietary_preferences, cultural_preferences, food_allergies")
    .eq("pregnancy_id", pregnancy.id)
    .maybeSingle();

  const dietaryPreferences = prefs?.dietary_preferences ?? [];
  const plantBased = dietaryPreferenceIsPlantBased(dietaryPreferences);
  const copy = TRIMESTER_NUTRITION[dating.currentTrimester];

  return {
    status: "ready",
    data: {
      trimester: dating.currentTrimester,
      intro: copy.intro,
      thisTrimester: copy.thisTrimester,
      nutrientCategories: NUTRIENT_CATEGORIES.map((c) => ({
        label: c.label,
        guidance: plantBased && c.planBasedNote ? `${c.general} ${c.planBasedNote}` : c.general,
      })),
      hydration: HYDRATION_GUIDANCE,
      mealIdeas: copy.mealIdeas,
      snacks: copy.snacks,
      nauseaTips: NAUSEA_FOOD_TIPS,
      constipationTips: CONSTIPATION_FOOD_TIPS,
      foodSafety: FOOD_SAFETY_GUIDANCE,
      foodsToLimitOrAvoid: FOODS_TO_LIMIT_OR_AVOID,
      dietaryPreferences,
      culturalPreferences: prefs?.cultural_preferences ?? null,
      foodAllergies: prefs?.food_allergies ?? [],
    },
  };
}

export async function updatePregnancyNutritionPreferences(input: {
  dietaryPreferences: PregnancyDietaryPreference[];
  culturalPreferences: string;
  foodAllergies: string[];
}): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false, message: "No active pregnancy found." };

  const clean = (list: string[]) => Array.from(new Set(list.map((s) => s.trim()).filter(Boolean))).slice(0, 25);

  const { error } = await supabase.from("pregnancy_nutrition_preferences").upsert(
    {
      pregnancy_id: pregnancy.id,
      user_id: user.id,
      dietary_preferences: input.dietaryPreferences,
      cultural_preferences: input.culturalPreferences.trim() || null,
      food_allergies: clean(input.foodAllergies),
    },
    { onConflict: "pregnancy_id" },
  );

  return error ? { success: false, message: "Couldn't save your preferences." } : { success: true };
}

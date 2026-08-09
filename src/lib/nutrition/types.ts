import type { CyclePhase } from "@/lib/cycle-engine";
import type { DietaryPreference } from "@/types/database";

export type { DietaryPreference };

/** The most restrictive diet a food still fits — "vegan" satisfies every preference, "omnivore" only satisfies "none". */
export type FoodDietClass = "vegan" | "vegetarian" | "pescatarian" | "omnivore";

export type NutrientCategory = "protein" | "fiber" | "iron" | "magnesium" | "carbohydrates";

export interface FoodItem {
  name: string;
  dietClass: FoodDietClass;
  /** Extra search terms (plurals, alternate names) checked against allergies/avoidances. */
  keywords: string[];
}

export interface MealIdea {
  title: string;
  description: string;
  dietClass: FoodDietClass;
  keywords: string[];
}

export interface PhaseNutritionCopy {
  intro: string;
  whyHelpful: string;
  hydration: { guidance: string; tip: string };
  categoryGuidance: Record<NutrientCategory, string>;
  meals: MealIdea[];
}

export interface FilteredFoodCategory {
  category: NutrientCategory;
  label: string;
  guidance: string;
  foods: FoodItem[];
}

export interface NutritionData {
  phase: CyclePhase;
  phaseLabel: string;
  intro: string;
  whyHelpful: string;
  hydration: { guidance: string; tip: string };
  foodCategories: FilteredFoodCategory[];
  meals: MealIdea[];
  dietaryPreference: DietaryPreference;
  foodAllergies: string[];
  foodsToAvoid: string[];
}

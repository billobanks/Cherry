import { notFound } from "next/navigation";
import { NutritionView } from "@/components/nutrition/nutrition-view";
import { PHASE_NUTRITION_CONTENT } from "@/lib/nutrition/content";
import { filterFoods, filterMeals } from "@/lib/nutrition/filter";
import { FOOD_DATABASE, NUTRIENT_CATEGORY_LABELS, NUTRIENT_CATEGORY_ORDER } from "@/lib/nutrition/foods";
import type { NutritionData } from "@/lib/nutrition/types";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function NutritionPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const phase = "luteal" as const;
  const copy = PHASE_NUTRITION_CONTENT[phase];
  const dietaryPreference = "vegetarian" as const;
  const foodAllergies = ["peanuts"];
  const foodsToAvoid = ["salmon"];
  const avoidTerms = [...foodAllergies, ...foodsToAvoid];

  const foodCategories = NUTRIENT_CATEGORY_ORDER.map((category) => ({
    category,
    label: NUTRIENT_CATEGORY_LABELS[category],
    guidance: copy.categoryGuidance[category],
    foods: filterFoods(FOOD_DATABASE[category], dietaryPreference, avoidTerms),
  }));

  const data: NutritionData = {
    phase,
    phaseLabel: "Estimated luteal phase",
    intro: copy.intro,
    whyHelpful: copy.whyHelpful,
    hydration: copy.hydration,
    foodCategories,
    meals: filterMeals(copy.meals, dietaryPreference, avoidTerms),
    dietaryPreference,
    foodAllergies,
    foodsToAvoid,
  };

  return <NutritionView data={data} />;
}

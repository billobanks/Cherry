import { notFound } from "next/navigation";
import { PregnancyNutritionView } from "@/components/pregnancy/pregnancy-nutrition-view";
import { NUTRIENT_CATEGORIES, TRIMESTER_NUTRITION, HYDRATION_GUIDANCE, NAUSEA_FOOD_TIPS, CONSTIPATION_FOOD_TIPS, FOOD_SAFETY_GUIDANCE, FOODS_TO_LIMIT_OR_AVOID } from "@/lib/pregnancy/nutrition-content";
import type { PregnancyNutritionData } from "@/lib/pregnancy/nutrition-actions";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancyNutritionPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const copy = TRIMESTER_NUTRITION.second;
  const data: PregnancyNutritionData = {
    trimester: "second",
    intro: copy.intro,
    thisTrimester: copy.thisTrimester,
    nutrientCategories: NUTRIENT_CATEGORIES.map((c) => ({ label: c.label, guidance: c.general })),
    hydration: HYDRATION_GUIDANCE,
    mealIdeas: copy.mealIdeas,
    snacks: copy.snacks,
    nauseaTips: NAUSEA_FOOD_TIPS,
    constipationTips: CONSTIPATION_FOOD_TIPS,
    foodSafety: FOOD_SAFETY_GUIDANCE,
    foodsToLimitOrAvoid: FOODS_TO_LIMIT_OR_AVOID,
    dietaryPreferences: ["vegetarian"],
    culturalPreferences: null,
    foodAllergies: ["peanuts"],
  };

  return (
    <PregnancyNutritionView
      data={data}
      onUpdatePreferences={async () => {
        "use server";
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      }}
    />
  );
}

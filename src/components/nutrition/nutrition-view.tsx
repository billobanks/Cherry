import type { NutritionData } from "@/lib/nutrition";
import { DietaryPreferencesCard } from "./dietary-preferences-card";
import { FoodsToConsider } from "./foods-to-consider";
import { HydrationCard } from "./hydration-card";
import { SimpleMealIdeas } from "./simple-meal-ideas";
import { TodayNutritionHeader } from "./today-nutrition-header";
import { WhyHelpfulCard } from "./why-helpful-card";

export function NutritionView({ data }: { data: NutritionData }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <TodayNutritionHeader phaseLabel={data.phaseLabel} intro={data.intro} />

      <FoodsToConsider categories={data.foodCategories} />
      <SimpleMealIdeas meals={data.meals} />
      <HydrationCard guidance={data.hydration.guidance} tip={data.hydration.tip} />
      <WhyHelpfulCard text={data.whyHelpful} />
      <DietaryPreferencesCard data={data} />

      <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
        General wellness suggestions only — not a diet plan, not a prescription, and never a
        substitute for guidance from a registered dietitian or doctor.
      </p>
    </div>
  );
}

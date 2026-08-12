import type { PregnancyNutritionData } from "@/lib/pregnancy/nutrition-actions";
import type { PregnancyDietaryPreference } from "@/types/database";
import { PregnancyNutritionPreferencesCard } from "./pregnancy-nutrition-preferences-card";

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">{title}</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[15px] leading-relaxed text-foreground">
            <span className="text-primary" aria-hidden>
              •
            </span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PregnancyNutritionView({
  data,
  onUpdatePreferences,
}: {
  data: PregnancyNutritionData;
  onUpdatePreferences: (input: {
    dietaryPreferences: PregnancyDietaryPreference[];
    culturalPreferences: string;
    foodAllergies: string[];
  }) => Promise<{ success: boolean; message?: string }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Nutrition</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Nutrition today</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{data.intro}</p>
      </div>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Nutrition this trimester</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground">{data.thisTrimester}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Foods to consider</h2>
        <div className="mt-3 flex flex-col gap-4">
          {data.nutrientCategories.map((category) => (
            <div key={category.label}>
              <span className="text-sm font-semibold text-foreground">{category.label}</span>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{category.guidance}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Hydration</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground">{data.hydration}</p>
      </section>

      <ListSection title="Meal ideas" items={data.mealIdeas} />
      <ListSection title="Snacks" items={data.snacks} />
      <ListSection title="Managing nausea through food" items={data.nauseaTips} />
      <ListSection title="Managing constipation through food" items={data.constipationTips} />
      <ListSection title="Food safety" items={data.foodSafety} />
      <ListSection title="Foods and beverages to limit or avoid" items={data.foodsToLimitOrAvoid} />

      <PregnancyNutritionPreferencesCard
        initialDietaryPreferences={data.dietaryPreferences}
        initialCulturalPreferences={data.culturalPreferences ?? ""}
        initialFoodAllergies={data.foodAllergies}
        onUpdate={onUpdatePreferences}
      />

      <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
        General education only — not individualized medical or nutrition advice. Supplement and prenatal
        vitamin decisions should always go through your healthcare provider.
      </p>
    </div>
  );
}

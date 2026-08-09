import { UtensilsCrossed } from "lucide-react";
import type { MealIdea } from "@/lib/nutrition";

const DIET_CLASS_LABEL: Record<MealIdea["dietClass"], string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  pescatarian: "Pescatarian",
  omnivore: "",
};

export function SimpleMealIdeas({ meals }: { meals: MealIdea[] }) {
  return (
    <section>
      <h2 className="px-1 font-heading text-lg font-medium">Simple Meal Ideas</h2>
      {meals.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2.5">
          {meals.map((meal) => (
            <div key={meal.title} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <UtensilsCrossed className="h-4.5 w-4.5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-medium text-foreground">{meal.title}</span>
                  {DIET_CLASS_LABEL[meal.dietClass] ? (
                    <span className="rounded-full bg-moss-soft px-2 py-0.5 text-xs font-medium text-moss">
                      {DIET_CLASS_LABEL[meal.dietClass]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{meal.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          Nothing here fits your current preferences today — check back tomorrow for new ideas.
        </p>
      )}
    </section>
  );
}

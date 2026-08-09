import type { FilteredFoodCategory } from "@/lib/nutrition";

export function FoodsToConsider({ categories }: { categories: FilteredFoodCategory[] }) {
  return (
    <section>
      <h2 className="px-1 font-heading text-lg font-medium">Foods to Consider</h2>
      <div className="mt-3 flex flex-col gap-4">
        {categories.map((cat) => (
          <div key={cat.category} className="rounded-2xl border border-border bg-card px-5 py-4">
            <h3 className="text-[15px] font-medium text-foreground">{cat.label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{cat.guidance}</p>
            {cat.foods.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {cat.foods.map((food) => (
                  <span
                    key={food.name}
                    className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-sm text-foreground"
                  >
                    {food.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing here fits your current preferences — adjust them below to see more.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

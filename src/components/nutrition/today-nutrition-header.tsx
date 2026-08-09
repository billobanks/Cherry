export function TodayNutritionHeader({ phaseLabel, intro }: { phaseLabel: string; intro: string }) {
  return (
    <div>
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
        Today&apos;s Nutrition
      </span>
      <h1 className="mt-2 font-heading text-3xl font-medium text-balance">{phaseLabel}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground text-pretty">{intro}</p>
    </div>
  );
}

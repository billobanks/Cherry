import type { PregnancyTodayOutput } from "@/lib/pregnancy/dashboard-actions";

export function TodaySection({ today, hasLoggedToday }: { today: PregnancyTodayOutput; hasLoggedToday: boolean }) {
  const tiles = [
    { label: "Energy", value: today.todayInsight },
    { label: "Sleep", value: today.sleepSuggestion },
    { label: "Hydration", value: today.hydrationSuggestion },
    { label: "Nutrition", value: today.nutritionSuggestion },
    { label: "Movement", value: today.movementSuggestion },
    {
      label: "Symptoms",
      value: hasLoggedToday
        ? today.symptomEducation.length > 0
          ? `${today.symptomEducation.length} logged today`
          : "None logged today"
        : "Not logged yet today",
    },
    { label: "Mood", value: today.emotionalWellnessSuggestion },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Today</span>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-secondary/60 px-3.5 py-3">
            <span className="text-xs font-medium text-muted-foreground">{tile.label}</span>
            <p className="mt-1 text-sm leading-snug text-foreground">{tile.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

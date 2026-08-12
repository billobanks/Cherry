import { notFound } from "next/navigation";
import { MovementView } from "@/components/movement/movement-view";
import { generateMovementRecommendation } from "@/lib/movement";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function MovementPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  // Ovulation window would default to vigorous — but logged cramps override
  // that phase assumption and force a gentler recommendation, exercising the
  // core "actual signals beat generic phase-based assumptions" rule.
  const recommendation = generateMovementRecommendation({
    phase: "ovulation_window",
    energyLevel: 5,
    hasCramps: true,
    hasFatigue: false,
    sleepQuality: 4,
    preferredTypes: ["yoga", "walking"],
    dayNumber: 12,
  });

  return (
    <MovementView
      recommendation={recommendation}
      hasLoggedToday={true}
      workoutPreferences={["yoga", "walking"]}
    />
  );
}

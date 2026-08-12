import { notFound } from "next/navigation";
import { PregnancyPatternsView } from "@/components/pregnancy/pregnancy-patterns-view";
import type { PatternSentence } from "@/lib/pregnancy/patterns-engine";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancyPatternsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const patterns: PatternSentence[] = [
    { key: "energy_trend", sentence: "Your energy has generally felt a bit higher this week than last week." },
    { key: "symptom_heartburn", sentence: "You've noticed heartburn coming up on 6 of your last 14 days." },
    { key: "symptom_nausea", sentence: "You've noticed nausea coming up on 3 of your last 14 days." },
  ];

  return <PregnancyPatternsView patterns={patterns} hasAnyData={true} />;
}

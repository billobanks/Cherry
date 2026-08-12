import { notFound } from "next/navigation";
import { BirthPreparationView } from "@/components/pregnancy/birth-preparation-view";
import { getRevealedBirthPrepTopics, getUpcomingBirthPrepTopics } from "@/lib/pregnancy/topic-disclosure";

const FIXTURE_WEEK = 33;

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function BirthPreparationPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <BirthPreparationView
      initialPreferences={{ supportPeople: "", painManagement: "", environment: "", feedingPlan: "", notes: "" }}
      revealedTopics={getRevealedBirthPrepTopics(FIXTURE_WEEK)}
      upcomingTopics={getUpcomingBirthPrepTopics(FIXTURE_WEEK)}
      onUpdate={async () => {
        "use server";
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { success: true };
      }}
    />
  );
}

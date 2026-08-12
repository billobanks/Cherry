import { notFound } from "next/navigation";
import { ContractionTrackerView } from "@/components/pregnancy/contraction-tracker-view";
import type { ContractionWithStats } from "@/lib/pregnancy/contraction-engine";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function ContractionsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const contractions: ContractionWithStats[] = [
    { id: "3", startedAt: "2026-08-08T10:15:00Z", endedAt: "2026-08-08T10:15:30Z", intensity: "moderate", durationSeconds: 30, intervalSinceLastSeconds: 300 },
    { id: "2", startedAt: "2026-08-08T10:10:00Z", endedAt: "2026-08-08T10:10:35Z", intensity: "mild", durationSeconds: 35, intervalSinceLastSeconds: 280 },
    { id: "1", startedAt: "2026-08-08T10:05:00Z", endedAt: "2026-08-08T10:05:40Z", intensity: "mild", durationSeconds: 40, intervalSinceLastSeconds: null },
  ];

  return (
    <ContractionTrackerView
      contractions={contractions}
      activeContractionId={null}
      onStart={async () => {
        "use server";
        return { success: true, id: "new" };
      }}
      onEnd={async () => {
        "use server";
        return { success: true };
      }}
      onDelete={async () => {
        "use server";
        return { success: true };
      }}
      onLogDelivery={async () => {
        "use server";
        return { status: "ready" as const };
      }}
    />
  );
}

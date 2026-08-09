import { notFound } from "next/navigation";
import { CheckinForm } from "@/components/checkin/checkin-form";
import { RecentEntries } from "@/components/checkin/recent-entries";
import { emptyCheckinFormValues, type CheckinSummary } from "@/lib/checkin";

/** Dev-only design preview — mirrors src/app/insights/preview. 404s in production. */
export default function CheckinPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const todayISO = "2026-08-08";
  const initialValues = {
    ...emptyCheckinFormValues(todayISO),
    flow: "medium" as const,
    mood: ["stressed" as const],
  };

  const recentEntries: CheckinSummary[] = [
    {
      checkinDate: "2026-08-08",
      flow: "medium",
      mood: ["stressed", "calm"],
      energyLevel: 2,
      sleepQuality: 3,
      symptomCount: 2,
      hasNotes: true,
    },
    {
      checkinDate: "2026-08-07",
      flow: "light",
      mood: ["happy"],
      energyLevel: 4,
      sleepQuality: 4,
      symptomCount: 0,
      hasNotes: false,
    },
    {
      checkinDate: "2026-08-06",
      flow: "none",
      mood: [],
      energyLevel: null,
      sleepQuality: null,
      symptomCount: 1,
      hasNotes: false,
    },
  ];

  return (
    <div className="pb-28">
      <CheckinForm
        initialValues={initialValues}
        isToday
        onSave={async (values) => {
          "use server";
          console.log("[preview] would save", values);
          await new Promise((resolve) => setTimeout(resolve, 300));
          return { success: true, message: "Check-in saved." };
        }}
      />
      <div className="mx-auto mt-10 w-full max-w-2xl">
        <h2 className="px-5 font-heading text-xl font-medium sm:px-8">Recent entries</h2>
        <p className="mt-1 px-5 text-sm text-muted-foreground sm:px-8">Tap any day to edit it.</p>
        <div className="mt-4">
          <RecentEntries entries={recentEntries} todayISO={todayISO} />
        </div>
      </div>
    </div>
  );
}

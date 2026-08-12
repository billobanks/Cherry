import { notFound } from "next/navigation";
import { DataOverviewCard } from "@/components/privacy/data-overview-card";
import { DeleteAccountSection } from "@/components/privacy/delete-account-section";
import { ExportDataButton } from "@/components/privacy/export-data-button";
import { ManageEntriesCard } from "@/components/privacy/manage-entries-card";
import type { CheckinEntrySummary, CycleEntrySummary, DataOverview } from "@/lib/privacy";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function DataSettingsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const overview: DataOverview = {
    memberSince: "2026-02-14",
    cyclesLogged: 5,
    checkinsLogged: 42,
    symptomsLoggedTotal: 118,
    assistantMessages: 6,
    hasStripeCustomer: true,
    pregnancyCheckinsLogged: 0,
  };

  const cycles: CycleEntrySummary[] = [
    { id: "cycle-1", startDate: "2026-07-12", endDate: "2026-07-17", periodLengthDays: 5, cycleLengthDays: 28, source: "logged" },
    { id: "cycle-2", startDate: "2026-06-14", endDate: "2026-06-19", periodLengthDays: 5, cycleLengthDays: 29, source: "logged" },
  ];

  const checkins: CheckinEntrySummary[] = [
    { checkinDate: "2026-08-09", flow: "none", symptomCount: 2, hasNotes: false },
    { checkinDate: "2026-08-08", flow: "none", symptomCount: 1, hasNotes: true },
  ];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Data</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          See what&apos;s stored about you, export it, delete individual entries, or delete your account entirely.
        </p>
      </div>

      <DataOverviewCard overview={overview} />
      <ExportDataButton
        onExport={async () => {
          "use server";
          return { status: "ready" as const, exportedAt: "2026-08-09T00:00:00.000Z", data: {} };
        }}
      />
      <ManageEntriesCard
        cycles={cycles}
        checkins={checkins}
        onDeleteCycle={async () => {
          "use server";
          return { success: true };
        }}
        onDeleteCheckin={async () => {
          "use server";
          return { success: true };
        }}
      />
      <DeleteAccountSection
        onDeleteAccount={async () => {
          "use server";
          return { status: "deleted" as const };
        }}
      />
    </div>
  );
}

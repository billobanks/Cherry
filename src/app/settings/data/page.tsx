import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DataOverviewCard } from "@/components/privacy/data-overview-card";
import { DeleteAccountSection } from "@/components/privacy/delete-account-section";
import { ExportDataButton } from "@/components/privacy/export-data-button";
import { ManageEntriesCard } from "@/components/privacy/manage-entries-card";
import {
  deleteAccount,
  deleteCheckinEntry,
  deleteCycleEntry,
  exportUserData,
  getDataOverview,
  getRecentEntries,
} from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Data — Cherry",
};

export default async function DataSettingsPage() {
  const [overviewResult, entriesResult] = await Promise.all([getDataOverview(), getRecentEntries()]);

  if (overviewResult.status === "signed_out") {
    redirect("/login");
  }

  if (overviewResult.status === "error" || entriesResult.status !== "ready") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">
          {overviewResult.status === "error" ? overviewResult.message : "We couldn't load your data."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Data</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          See what&apos;s stored about you, export it, delete individual entries, or delete your account entirely.
        </p>
      </div>

      <DataOverviewCard overview={overviewResult.overview} />
      <ExportDataButton onExport={exportUserData} />
      <ManageEntriesCard
        cycles={entriesResult.cycles}
        checkins={entriesResult.checkins}
        onDeleteCycle={deleteCycleEntry}
        onDeleteCheckin={deleteCheckinEntry}
      />
      <DeleteAccountSection onDeleteAccount={deleteAccount} />
    </div>
  );
}

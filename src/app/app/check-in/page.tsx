import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckinForm } from "@/components/checkin/checkin-form";
import { RecentEntries } from "@/components/checkin/recent-entries";
import { getCheckinForDate, getRecentCheckins, saveCheckin, RECENT_CHECKINS_LIMIT } from "@/lib/checkin";
import { formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { getSafetyContextForCheckin } from "@/lib/safety";

export const metadata: Metadata = {
  title: "Daily check-in — Cherry",
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default async function CheckinPage(props: PageProps<"/app/check-in">) {
  const searchParams = await props.searchParams;
  const todayISO = formatISODate(todayEpochDays());
  const dateParam = typeof searchParams.date === "string" ? searchParams.date : undefined;
  const checkinDate = dateParam && DATE_PATTERN.test(dateParam) ? dateParam : todayISO;

  const [checkinResult, recentResult, safetyContextResult] = await Promise.all([
    getCheckinForDate(checkinDate),
    getRecentCheckins(RECENT_CHECKINS_LIMIT),
    getSafetyContextForCheckin(checkinDate),
  ]);

  if (checkinResult.status === "signed_out") {
    redirect("/login");
  }

  if (checkinResult.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{checkinResult.message}</p>
        <a
          href="/app/check-in"
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </a>
      </div>
    );
  }

  const recentEntries = recentResult.status === "ready" ? recentResult.entries : [];
  const safetyRules = safetyContextResult.status === "ready" ? safetyContextResult.rules : [];
  const safetyHistory =
    safetyContextResult.status === "ready"
      ? safetyContextResult.history
      : { previousPainSeverity: null, priorConsecutiveBleedingDays: 0, isOutsideExpectedBleedingWindow: false };

  return (
    <div className="pb-28">
      <CheckinForm
        initialValues={checkinResult.values}
        isToday={checkinDate === todayISO}
        onSave={saveCheckin}
        safetyRules={safetyRules}
        safetyHistory={safetyHistory}
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

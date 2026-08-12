import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PregnancyCheckinForm } from "@/components/pregnancy/pregnancy-checkin-form";
import { formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { getPregnancyCheckinForDate, savePregnancyCheckin } from "@/lib/pregnancy";

export const metadata: Metadata = {
  title: "Today's check-in — Cherry",
};

export default async function PregnancyCheckinPage() {
  const todayISO = formatISODate(todayEpochDays());
  const result = await getPregnancyCheckinForDate(todayISO);

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
  }
  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return (
    <PregnancyCheckinForm
      initialValues={result.values}
      gestationalAgeWeeks={result.gestationalAgeWeeks}
      onSave={savePregnancyCheckin}
    />
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getCalendarMonth } from "@/lib/calendar";
import { formatISODate, todayEpochDays } from "@/lib/cycle-engine";

export const metadata: Metadata = {
  title: "Calendar — Cherry",
};

export default async function CalendarPage(props: PageProps<"/calendar">) {
  const searchParams = await props.searchParams;
  const todayISO = formatISODate(todayEpochDays());
  const [defaultYear, defaultMonth] = todayISO.split("-").map(Number);

  const year = Number(searchParams.year) || defaultYear;
  const month = Number(searchParams.month) || defaultMonth;

  const result = await getCalendarMonth(year, month);

  if (result.status === "signed_out") {
    redirect("/onboarding");
  }

  if (result.status === "needs_period_date") {
    return (
      <EmptyState
        title="Log your last period to see your calendar"
        description="Your calendar is built around where you are in your cycle — once you've logged a period start date, it'll show up here."
      />
    );
  }

  if (result.status === "error") {
    return <EmptyState title="Something went wrong" description={result.message} />;
  }

  return <CalendarView data={result.data} />;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-medium text-balance">{title}</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>
      <Link
        href="/checkin"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        Go to check-in
      </Link>
    </div>
  );
}

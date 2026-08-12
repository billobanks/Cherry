import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/dashboard";
import { getActivePregnancy } from "@/lib/pregnancy";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — Cherry",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pregnancy Mode replaces the cycle dashboard entirely once active — same
  // "home" destination, different content.
  if (user) {
    const activePregnancy = await getActivePregnancy(supabase, user.id);
    if (activePregnancy) redirect("/app/pregnancy");
  }

  const result = await getDashboardData();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  if (result.status === "needs_period_date") {
    return (
      <EmptyState
        title="Log your last period to see your dashboard"
        description="Your dashboard is built around where you are in your cycle — once you've logged a period start date, it'll show up here."
      />
    );
  }

  if (result.status === "error") {
    return <EmptyState title="Something went wrong" description={result.message} />;
  }

  return <DashboardView data={result.data} />;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-medium text-balance">{title}</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>
      <Link
        href="/app/check-in"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        Go to check-in
      </Link>
    </div>
  );
}

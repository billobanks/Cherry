import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";
import { getAdminDashboardStats } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Dashboard — Cherry admin",
};

export default async function AdminDashboardPage() {
  const result = await getAdminDashboardStats();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  if (result.status === "forbidden") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return <AdminDashboardView stats={result.stats} />;
}

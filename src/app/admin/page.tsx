import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminHubView } from "@/components/admin/admin-hub-view";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin — Cherry",
};

export default async function AdminPage() {
  const guard = await requireAdmin();

  if (!guard.ok && guard.reason === "signed_out") {
    redirect("/login");
  }

  if (!guard.ok) {
    notFound();
  }

  return <AdminHubView />;
}

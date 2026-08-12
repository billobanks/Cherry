import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { listAdminUsers, setUserAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Users — Cherry admin",
};

export default async function AdminUsersPage() {
  const result = await listAdminUsers();

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

  return <AdminUsersView users={result.users} onSetUserAdmin={setUserAdmin} />;
}

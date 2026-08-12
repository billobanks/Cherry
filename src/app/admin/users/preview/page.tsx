import { notFound } from "next/navigation";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import type { AdminUserRow } from "@/lib/admin";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function AdminUsersPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const users: AdminUserRow[] = [
    {
      id: "user-1",
      email: "maya@example.com",
      displayName: "Maya",
      createdAt: "2026-07-20T00:00:00.000Z",
      isAdmin: true,
      subscriptionPlan: "premium",
      subscriptionStatus: "active",
    },
    {
      id: "user-2",
      email: "jordan@example.com",
      displayName: "Jordan",
      createdAt: "2026-07-18T00:00:00.000Z",
      isAdmin: false,
      subscriptionPlan: "free",
      subscriptionStatus: null,
    },
  ];

  return (
    <AdminUsersView
      users={users}
      onSetUserAdmin={async () => {
        "use server";
        return { success: true };
      }}
    />
  );
}

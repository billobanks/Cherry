import { notFound } from "next/navigation";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function AdminDashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <AdminDashboardView stats={{ totalUsers: 482, newUsersLast7Days: 17, activeSubscriptions: 63, totalAdmins: 3 }} />;
}

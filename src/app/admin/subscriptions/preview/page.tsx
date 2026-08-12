import { notFound } from "next/navigation";
import { AdminSubscriptionsView } from "@/components/admin/admin-subscriptions-view";
import type { AdminSubscriptionRow } from "@/lib/admin";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function AdminSubscriptionsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const subscriptions: AdminSubscriptionRow[] = [
    {
      id: "sub-1",
      userId: "user-1",
      displayName: "Maya",
      plan: "premium",
      status: "active",
      currentPeriodEnd: "2026-09-09T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      createdAt: "2026-07-20T00:00:00.000Z",
    },
    {
      id: "sub-2",
      userId: "user-2",
      displayName: "Jordan",
      plan: "premium",
      status: "active",
      currentPeriodEnd: "2026-08-15T00:00:00.000Z",
      cancelAtPeriodEnd: true,
      createdAt: "2026-06-01T00:00:00.000Z",
    },
  ];

  return <AdminSubscriptionsView subscriptions={subscriptions} />;
}

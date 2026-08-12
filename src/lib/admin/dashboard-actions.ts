"use server";

import { addDays, formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { requireAdmin } from "./require-admin";

export interface AdminDashboardStats {
  totalUsers: number;
  newUsersLast7Days: number;
  activeSubscriptions: number;
  totalAdmins: number;
}

export type GetAdminDashboardStatsResult =
  | { status: "ready"; stats: AdminDashboardStats }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

export async function getAdminDashboardStats(): Promise<GetAdminDashboardStatsResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { status: guard.reason };
  const { supabase } = guard;

  const sevenDaysAgo = formatISODate(addDays(todayEpochDays(), -7));

  const [totalUsers, newUsers, activeSubscriptions, admins] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", true),
  ]);

  if (totalUsers.error || newUsers.error || activeSubscriptions.error || admins.error) {
    return { status: "error", message: "Couldn't load admin stats." };
  }

  return {
    status: "ready",
    stats: {
      totalUsers: totalUsers.count ?? 0,
      newUsersLast7Days: newUsers.count ?? 0,
      activeSubscriptions: activeSubscriptions.count ?? 0,
      totalAdmins: admins.count ?? 0,
    },
  };
}

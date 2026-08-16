"use server";

import { createServiceRoleClient } from "@/lib/supabase/service";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";
import { requireAdmin } from "./require-admin";

export interface AdminUserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  isAdmin: boolean;
  subscriptionPlan: SubscriptionPlan | null;
  subscriptionStatus: SubscriptionStatus | null;
}

export type ListAdminUsersResult =
  | { status: "ready"; users: AdminUserRow[] }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

const PAGE_SIZE = 100;

/** Isolates the service-role call so a missing/misconfigured SUPABASE_SERVICE_ROLE_KEY surfaces as a clean error, not a crash. */
async function listAuthUsers(): Promise<{ status: "ready"; users: { id: string; email: string | null; created_at: string }[] } | { status: "error" }> {
  try {
    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: PAGE_SIZE });
    if (error) {
      console.error("listAdminUsers: auth.admin.listUsers failed:", error.message);
      return { status: "error" };
    }
    return {
      status: "ready",
      users: data.users.map((u) => ({ id: u.id, email: u.email ?? null, created_at: u.created_at })),
    };
  } catch (err) {
    console.error("listAdminUsers: couldn't reach the service-role client:", err);
    return { status: "error" };
  }
}

export async function listAdminUsers(): Promise<ListAdminUsersResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { status: guard.reason };
  const { supabase } = guard;

  const authResult = await listAuthUsers();
  if (authResult.status === "error") return { status: "error", message: "Couldn't load users." };
  const authUsers = authResult.users;

  const ids = authUsers.map((u) => u.id);
  if (ids.length === 0) return { status: "ready", users: [] };

  const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, is_admin, created_at").in("id", ids),
    supabase.from("subscriptions").select("user_id, plan, status").in("user_id", ids),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const subscriptionByUserId = new Map((subscriptions ?? []).map((s) => [s.user_id, s]));

  const users: AdminUserRow[] = authUsers
    .map((authUser) => {
      const profile = profileById.get(authUser.id);
      const subscription = subscriptionByUserId.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email ?? null,
        displayName: profile?.display_name ?? null,
        createdAt: profile?.created_at ?? authUser.created_at,
        isAdmin: profile?.is_admin ?? false,
        subscriptionPlan: subscription?.plan ?? null,
        subscriptionStatus: subscription?.status ?? null,
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return { status: "ready", users };
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<{ success: boolean; message?: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) return { success: false, message: "You don't have permission to do that." };
  const { supabase, userId: adminUserId } = guard;

  if (userId === adminUserId && !isAdmin) {
    return { success: false, message: "You can't remove your own admin access." };
  }

  const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
  return error ? { success: false, message: "Couldn't update that user." } : { success: true };
}

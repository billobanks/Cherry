"use server";

import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";
import { requireAdmin } from "./require-admin";

export interface AdminSubscriptionRow {
  id: string;
  userId: string;
  displayName: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
}

export type ListAdminSubscriptionsResult =
  | { status: "ready"; subscriptions: AdminSubscriptionRow[] }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

const PAGE_SIZE = 100;

export async function listAdminSubscriptions(): Promise<ListAdminSubscriptionsResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { status: guard.reason };
  const { supabase } = guard;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, plan, status, current_period_end, cancel_at_period_end, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (error) return { status: "error", message: "Couldn't load subscriptions." };

  const userIds = (data ?? []).map((row) => row.user_id);
  const { data: profiles } =
    userIds.length > 0 ? await supabase.from("profiles").select("id, display_name").in("id", userIds) : { data: [] };
  const displayNameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const subscriptions: AdminSubscriptionRow[] = (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    displayName: displayNameById.get(row.user_id) ?? null,
    plan: row.plan,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    createdAt: row.created_at,
  }));

  return { status: "ready", subscriptions };
}

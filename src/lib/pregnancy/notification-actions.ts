"use server";

import { createClient } from "@/lib/supabase/server";
import type { NotificationPreviewDetail, PregnancyNotificationCategory } from "@/types/database";

export interface PregnancyNotificationPreference {
  category: PregnancyNotificationCategory;
  enabled: boolean;
  previewDetail: NotificationPreviewDetail;
}

const CATEGORIES: PregnancyNotificationCategory[] = [
  "weekly_milestone",
  "appointment_reminder",
  "daily_checkin_reminder",
  "safety_follow_up",
];

export type GetPregnancyNotificationsResult =
  | { status: "ready"; preferences: PregnancyNotificationPreference[] }
  | { status: "signed_out" };

export async function getPregnancyNotificationPreferences(): Promise<GetPregnancyNotificationsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data } = await supabase.from("pregnancy_notifications").select("category, enabled, preview_detail").eq("user_id", user.id);
  const byCategory = new Map((data ?? []).map((row) => [row.category, row]));

  return {
    status: "ready",
    preferences: CATEGORIES.map((category) => {
      const row = byCategory.get(category);
      return {
        category,
        enabled: row?.enabled ?? false,
        // Defaults to private — a detailed preview is opt-in only.
        previewDetail: row?.preview_detail ?? "private",
      };
    }),
  };
}

/**
 * One global privacy choice applied across every category, matching how
 * the setting is presented to the user (a single "keep previews private"
 * choice) even though it's stored per-category to allow per-category
 * overrides later without a schema change.
 */
export async function updateAllNotificationPreviewDetail(previewDetail: NotificationPreviewDetail): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { data: existingRows } = await supabase.from("pregnancy_notifications").select("category, enabled").eq("user_id", user.id);
  const enabledByCategory = new Map((existingRows ?? []).map((r) => [r.category, r.enabled]));

  const { error } = await supabase.from("pregnancy_notifications").upsert(
    CATEGORIES.map((category) => ({
      user_id: user.id,
      category,
      enabled: enabledByCategory.get(category) ?? false,
      preview_detail: previewDetail,
    })),
    { onConflict: "user_id,category" },
  );

  return error ? { success: false, message: "Couldn't save that setting." } : { success: true };
}

export async function updatePregnancyNotificationPreference(
  category: PregnancyNotificationCategory,
  update: { enabled?: boolean; previewDetail?: NotificationPreviewDetail },
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { data: existing } = await supabase
    .from("pregnancy_notifications")
    .select("enabled, preview_detail")
    .eq("user_id", user.id)
    .eq("category", category)
    .maybeSingle();

  const { error } = await supabase.from("pregnancy_notifications").upsert(
    {
      user_id: user.id,
      category,
      enabled: update.enabled ?? existing?.enabled ?? false,
      preview_detail: update.previewDetail ?? existing?.preview_detail ?? "private",
    },
    { onConflict: "user_id,category" },
  );

  return error ? { success: false, message: "Couldn't save that setting." } : { success: true };
}

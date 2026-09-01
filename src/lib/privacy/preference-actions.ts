"use server";

import { NOTIFICATION_OPTIONS } from "@/lib/onboarding/constants";
import { createClient } from "@/lib/supabase/server";
import type { NotificationCategory } from "@/types/database";
import type { NotificationPreferenceRow } from "./types";

export type GetPrivacyPreferencesResult =
  | {
      status: "ready";
      notificationPreferences: NotificationPreferenceRow[];
      personalizationEnabled: boolean;
    }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getPrivacyPreferences(): Promise<GetPrivacyPreferencesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const [{ data: preferences }, { data: notificationRows }] = await Promise.all([
    supabase.from("user_preferences").select("personalization_enabled").eq("user_id", user.id).maybeSingle(),
    supabase.from("notification_preferences").select("category, enabled").eq("user_id", user.id),
  ]);

  const enabledByCategory = new Map((notificationRows ?? []).map((r) => [r.category, r.enabled]));
  const notificationPreferences: NotificationPreferenceRow[] = NOTIFICATION_OPTIONS.map((option) => ({
    category: option.value,
    enabled: enabledByCategory.get(option.value) ?? false,
  }));

  return {
    status: "ready",
    notificationPreferences,
    personalizationEnabled: preferences?.personalization_enabled ?? true,
  };
}

export async function updateNotificationPreference(
  category: NotificationCategory,
  enabled: boolean,
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      { user_id: user.id, channel: "email", category, enabled },
      { onConflict: "user_id,channel,category" },
    );

  return error ? { success: false, message: "Couldn't save that setting." } : { success: true };
}

export async function updatePersonalizationSetting(
  enabled: boolean,
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: user.id, personalization_enabled: enabled }, { onConflict: "user_id" });

  return error ? { success: false, message: "Couldn't save that setting." } : { success: true };
}

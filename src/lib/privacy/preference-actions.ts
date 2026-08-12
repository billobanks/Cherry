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

  const [{ data: profile, error: profileError }, { data: notificationRows }] = await Promise.all([
    supabase.from("profiles").select("personalization_enabled").eq("id", user.id).single(),
    supabase.from("notification_preferences").select("category, enabled").eq("user_id", user.id),
  ]);

  if (profileError || !profile) {
    return { status: "error", message: "We couldn't load your preferences." };
  }

  const enabledByCategory = new Map((notificationRows ?? []).map((r) => [r.category, r.enabled]));
  const notificationPreferences: NotificationPreferenceRow[] = NOTIFICATION_OPTIONS.map((option) => ({
    category: option.value,
    enabled: enabledByCategory.get(option.value) ?? false,
  }));

  return {
    status: "ready",
    notificationPreferences,
    personalizationEnabled: profile.personalization_enabled,
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
    .from("profiles")
    .update({ personalization_enabled: enabled })
    .eq("id", user.id);

  return error ? { success: false, message: "Couldn't save that setting." } : { success: true };
}

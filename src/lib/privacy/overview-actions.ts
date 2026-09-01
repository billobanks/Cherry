"use server";

import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import type { CheckinEntrySummary, CycleEntrySummary, DataOverview } from "./types";

export type GetDataOverviewResult =
  | { status: "ready"; overview: DataOverview }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getDataOverview(): Promise<GetDataOverviewResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { status: "error", message: "We couldn't load your account." };
  }

  const { data: conversation } = await supabase.from("ai_conversations").select("id").eq("user_id", user.id).maybeSingle();

  const [
    { count: cyclesLogged },
    { count: checkinsLogged },
    { count: symptomsLoggedTotal },
    { count: assistantMessages },
    { count: pregnancyCheckinsLogged },
  ] = await Promise.all([
    supabase.from("menstrual_cycles").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("daily_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("symptom_logs").select("daily_log_id", { count: "exact", head: true }).eq("user_id", user.id),
    conversation
      ? supabase.from("ai_messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversation.id)
      : Promise.resolve({ count: 0 }),
    supabase.from("pregnancy_daily_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  return {
    status: "ready",
    overview: {
      memberSince: profile.created_at,
      cyclesLogged: cyclesLogged ?? 0,
      checkinsLogged: checkinsLogged ?? 0,
      symptomsLoggedTotal: symptomsLoggedTotal ?? 0,
      assistantMessages: assistantMessages ?? 0,
      hasStripeCustomer: profile.stripe_customer_id !== null,
      pregnancyCheckinsLogged: pregnancyCheckinsLogged ?? 0,
    },
  };
}

const RECENT_ENTRIES_LIMIT = 30;

export type GetRecentEntriesResult =
  | { status: "ready"; cycles: CycleEntrySummary[]; checkins: CheckinEntrySummary[] }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getRecentEntries(): Promise<GetRecentEntriesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const [{ data: cycleRows, error: cycleError }, { data: checkinRows, error: checkinError }] = await Promise.all([
    supabase
      .from("menstrual_cycles")
      .select("id, start_date, end_date, period_length_days, cycle_length_days, source")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(RECENT_ENTRIES_LIMIT),
    supabase
      .from("daily_logs")
      .select("id, checkin_date, flow, notes")
      .eq("user_id", user.id)
      .order("checkin_date", { ascending: false })
      .limit(RECENT_ENTRIES_LIMIT),
  ]);

  if (cycleError || checkinError) {
    return { status: "error", message: "Couldn't load your entries." };
  }

  const checkinIds = (checkinRows ?? []).map((c) => c.id);
  const { data: symptomRows } =
    checkinIds.length > 0
      ? await supabase.from("symptom_logs").select("daily_log_id").in("daily_log_id", checkinIds)
      : { data: [] as { daily_log_id: string }[] };

  const symptomCountByCheckinId = new Map<string, number>();
  for (const row of symptomRows ?? []) {
    symptomCountByCheckinId.set(row.daily_log_id, (symptomCountByCheckinId.get(row.daily_log_id) ?? 0) + 1);
  }

  return {
    status: "ready",
    cycles: (cycleRows ?? []).map((c) => ({
      id: c.id,
      startDate: c.start_date,
      endDate: c.end_date,
      periodLengthDays: c.period_length_days,
      cycleLengthDays: c.cycle_length_days,
      source: c.source,
    })),
    checkins: (checkinRows ?? []).map((c) => ({
      checkinDate: c.checkin_date,
      flow: c.flow,
      symptomCount: symptomCountByCheckinId.get(c.id) ?? 0,
      hasNotes: Boolean(c.notes && c.notes.trim().length > 0),
    })),
  };
}

export type ExportUserDataResult =
  | { status: "ready"; exportedAt: string; data: Record<string, unknown> }
  | { status: "signed_out" }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "error"; message: string };

/**
 * Everything Cherry has stored about this user, gathered into one plain
 * object for a client-side JSON download. No admin-only or other-user data
 * — every query below is scoped by `user_id = auth.uid()` via RLS, same as
 * any other read in the app.
 */
export async function exportUserData(): Promise<ExportUserDataResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const rateLimit = await checkRateLimit("accountExport", user.id);
  if (!rateLimit.allowed) {
    return { status: "rate_limited", retryAfterSeconds: rateLimit.retryAfterSeconds };
  }

  const { data: conversation } = await supabase.from("ai_conversations").select("id").eq("user_id", user.id).maybeSingle();

  const [
    profile,
    preferences,
    goals,
    cycles,
    periodDayLogs,
    checkins,
    moodLogs,
    sleepLogs,
    energyLogs,
    checkinSymptoms,
    commonSymptoms,
    notificationPreferences,
    assistantMessages,
    subscription,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, primary_focus, last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity, created_at",
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("fertility_tracking_enabled, dietary_preference, food_allergies, foods_to_avoid, workout_preferences, personalization_enabled")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("user_goals").select("goal_key").eq("user_id", user.id),
    supabase.from("menstrual_cycles").select("start_date, end_date, cycle_length_days, period_length_days, source").eq("user_id", user.id),
    supabase.from("period_logs").select("log_date, flow_intensity").eq("user_id", user.id),
    supabase
      .from("daily_logs")
      .select("id, checkin_date, flow, pain_severity, discharge, exercise, libido, notes, intercourse")
      .eq("user_id", user.id),
    supabase.from("mood_logs").select("daily_log_id, mood_key").eq("user_id", user.id),
    supabase.from("sleep_logs").select("daily_log_id, sleep_quality").eq("user_id", user.id),
    supabase.from("energy_logs").select("daily_log_id, energy_level").eq("user_id", user.id),
    supabase.from("symptom_logs").select("daily_log_id, symptom_key").eq("user_id", user.id),
    supabase.from("profile_common_symptoms").select("symptom_key, created_at").eq("user_id", user.id),
    supabase.from("notification_preferences").select("channel, category, enabled").eq("user_id", user.id),
    conversation
      ? supabase.from("ai_messages").select("role, content, created_at").eq("conversation_id", conversation.id).order("created_at")
      : Promise.resolve({ data: [] as { role: string; content: string; created_at: string }[] }),
    supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").eq("user_id", user.id).maybeSingle(),
  ]);

  const [
    pregnancies,
    pregnancyProfiles,
    pregnancyDailyLogs,
    pregnancySymptoms,
    pregnancyMoods,
    pregnancyNutritionPreferences,
    pregnancyAppointments,
    pregnancyQuestions,
    pregnancyNotes,
    pregnancyNotifications,
    pregnancyBirthPreferences,
    contractionLogs,
    deliveryRecords,
  ] = await Promise.all([
    supabase
      .from("pregnancies")
      .select("status, last_menstrual_period, estimated_due_date, due_date_source, clinician_due_date, ultrasound_due_date, date_pregnancy_confirmed, pregnancy_start_date, delivery_date, gestational_age_at_delivery_days, created_at")
      .eq("user_id", user.id),
    supabase.from("pregnancy_profiles").select("is_first_pregnancy, has_scheduled_prenatal_care, focus_areas").eq("user_id", user.id),
    supabase.from("pregnancy_daily_logs").select("log_date, energy_level, sleep_quality, hydration_level, appetite_level, notes").eq("user_id", user.id),
    supabase.from("pregnancy_symptoms").select("daily_log_id, symptom_key, severity").eq("user_id", user.id),
    supabase.from("pregnancy_moods").select("daily_log_id, mood_key").eq("user_id", user.id),
    supabase.from("pregnancy_nutrition_preferences").select("dietary_preferences, cultural_preferences, food_allergies").eq("user_id", user.id),
    supabase.from("pregnancy_appointments").select("appointment_date, appointment_time, provider_name, location, appointment_type, reminder_enabled").eq("user_id", user.id),
    supabase.from("pregnancy_questions").select("question, answered, created_at").eq("user_id", user.id),
    supabase.from("pregnancy_notes").select("note, created_at").eq("user_id", user.id),
    supabase.from("pregnancy_notifications").select("category, enabled, preview_detail").eq("user_id", user.id),
    supabase.from("pregnancy_birth_preferences").select("preferences, notes").eq("user_id", user.id),
    supabase.from("contraction_logs").select("started_at, ended_at, intensity").eq("user_id", user.id),
    supabase.from("delivery_records").select("delivery_date, delivery_time, delivery_type, location, notes").eq("user_id", user.id),
  ]);

  return {
    status: "ready",
    exportedAt: new Date().toISOString(),
    data: {
      account: { email: user.email, ...(profile.data ?? {}) },
      preferences: preferences.data ?? {},
      goals: (goals.data ?? []).map((g) => g.goal_key),
      cycles: cycles.data ?? [],
      periodDayLogs: periodDayLogs.data ?? [],
      dailyCheckins: checkins.data ?? [],
      moodLogs: moodLogs.data ?? [],
      sleepLogs: sleepLogs.data ?? [],
      energyLogs: energyLogs.data ?? [],
      checkinSymptoms: checkinSymptoms.data ?? [],
      commonSymptoms: commonSymptoms.data ?? [],
      notificationPreferences: notificationPreferences.data ?? [],
      assistantConversation: assistantMessages.data ?? [],
      subscription: subscription.data ?? null,
      pregnancies: pregnancies.data ?? [],
      pregnancyProfiles: pregnancyProfiles.data ?? [],
      pregnancyDailyLogs: pregnancyDailyLogs.data ?? [],
      pregnancySymptoms: pregnancySymptoms.data ?? [],
      pregnancyMoods: pregnancyMoods.data ?? [],
      pregnancyNutritionPreferences: pregnancyNutritionPreferences.data ?? [],
      pregnancyAppointments: pregnancyAppointments.data ?? [],
      pregnancyQuestions: pregnancyQuestions.data ?? [],
      pregnancyNotes: pregnancyNotes.data ?? [],
      pregnancyNotifications: pregnancyNotifications.data ?? [],
      pregnancyBirthPreferences: pregnancyBirthPreferences.data ?? [],
      contractionLogs: contractionLogs.data ?? [],
      deliveryRecords: deliveryRecords.data ?? [],
    },
  };
}

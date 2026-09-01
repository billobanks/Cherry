"use server";

import { createClient } from "@/lib/supabase/server";
import type { Mood } from "@/types/database";
import { checkinFormSchema } from "./schema";
import { derivePeriodLogSyncAction } from "./sync";
import { emptyCheckinFormValues, type CheckinFormValues, type CheckinSummary } from "./types";

export type GetCheckinResult =
  | { status: "ready"; values: CheckinFormValues }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getCheckinForDate(checkinDate: string): Promise<GetCheckinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: row, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("checkin_date", checkinDate)
    .maybeSingle();

  if (error) {
    return { status: "error", message: "Couldn't load that day's check-in." };
  }

  if (!row) {
    return { status: "ready", values: emptyCheckinFormValues(checkinDate) };
  }

  const [{ data: symptomRows }, { data: moodRows }, { data: sleepRow }, { data: energyRow }] = await Promise.all([
    supabase.from("symptom_logs").select("symptom_key").eq("daily_log_id", row.id),
    supabase.from("mood_logs").select("mood_key").eq("daily_log_id", row.id),
    supabase.from("sleep_logs").select("sleep_quality").eq("daily_log_id", row.id).maybeSingle(),
    supabase.from("energy_logs").select("energy_level").eq("daily_log_id", row.id).maybeSingle(),
  ]);

  return {
    status: "ready",
    values: {
      checkinDate: row.checkin_date,
      flow: row.flow,
      mood: (moodRows ?? []).map((m) => m.mood_key),
      energyLevel: energyRow?.energy_level ?? null,
      sleepQuality: sleepRow?.sleep_quality ?? null,
      painSeverity: row.pain_severity,
      symptomKeys: (symptomRows ?? []).map((s) => s.symptom_key),
      discharge: row.discharge,
      exercise: row.exercise,
      libido: row.libido,
      notes: row.notes ?? "",
    },
  };
}

export async function saveCheckin(
  values: CheckinFormValues,
): Promise<{ success: boolean; message?: string }> {
  const parsed = checkinFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "That doesn't look right." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in to save your check-in." };

  const data = parsed.data;

  const { data: dailyLog, error: dailyLogError } = await supabase
    .from("daily_logs")
    .upsert(
      {
        user_id: user.id,
        checkin_date: data.checkinDate,
        flow: data.flow,
        pain_severity: data.painSeverity,
        discharge: data.discharge,
        exercise: data.exercise,
        libido: data.libido,
        notes: data.notes.trim().length > 0 ? data.notes.trim() : null,
      },
      { onConflict: "user_id,checkin_date" },
    )
    .select("id")
    .single();

  if (dailyLogError || !dailyLog) {
    return { success: false, message: "Couldn't save your check-in — please try again." };
  }

  const [symptomSyncFailed, moodSyncFailed, sleepSyncFailed, energySyncFailed] = await Promise.all([
    syncSymptomLogs(supabase, dailyLog.id, user.id, data.symptomKeys),
    syncMoodLogs(supabase, dailyLog.id, user.id, data.mood),
    syncSleepLog(supabase, dailyLog.id, user.id, data.sleepQuality),
    syncEnergyLog(supabase, dailyLog.id, user.id, data.energyLevel),
  ]);
  if (symptomSyncFailed || moodSyncFailed || sleepSyncFailed || energySyncFailed) {
    return { success: true, message: "Saved, but a few fields didn't all save — try re-entering them." };
  }

  const periodLogError = await syncPeriodLog(supabase, user.id, data.checkinDate, data.flow);
  if (periodLogError) {
    return { success: true, message: "Saved. Your period-day log didn't sync — you can fix it from the calendar." };
  }

  return { success: true };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function syncSymptomLogs(
  supabase: Supabase,
  dailyLogId: string,
  userId: string,
  symptomKeys: string[],
): Promise<boolean> {
  const { error: deleteError } = await supabase
    .from("symptom_logs")
    .delete()
    .eq("daily_log_id", dailyLogId);
  if (deleteError) return true;

  if (symptomKeys.length === 0) return false;

  const { error: insertError } = await supabase.from("symptom_logs").insert(
    symptomKeys.map((symptomKey) => ({
      daily_log_id: dailyLogId,
      user_id: userId,
      symptom_key: symptomKey,
    })),
  );
  return Boolean(insertError);
}

async function syncMoodLogs(supabase: Supabase, dailyLogId: string, userId: string, mood: Mood[]): Promise<boolean> {
  const { error: deleteError } = await supabase.from("mood_logs").delete().eq("daily_log_id", dailyLogId);
  if (deleteError) return true;

  if (mood.length === 0) return false;

  const { error: insertError } = await supabase
    .from("mood_logs")
    .insert(mood.map((moodKey) => ({ daily_log_id: dailyLogId, user_id: userId, mood_key: moodKey })));
  return Boolean(insertError);
}

// sleep_logs and energy_logs are both "at most one row per daily_logs entry"
// — delete-then-insert keeps null vs. set consistent without an
// upsert-on-nullable-unique dance. Kept as two small functions rather than
// one generic helper so each insert's shape stays concretely typed.
async function syncSleepLog(supabase: Supabase, dailyLogId: string, userId: string, sleepQuality: number | null): Promise<boolean> {
  const { error: deleteError } = await supabase.from("sleep_logs").delete().eq("daily_log_id", dailyLogId);
  if (deleteError) return true;
  if (sleepQuality == null) return false;

  const { error: insertError } = await supabase
    .from("sleep_logs")
    .insert({ daily_log_id: dailyLogId, user_id: userId, sleep_quality: sleepQuality });
  return Boolean(insertError);
}

async function syncEnergyLog(supabase: Supabase, dailyLogId: string, userId: string, energyLevel: number | null): Promise<boolean> {
  const { error: deleteError } = await supabase.from("energy_logs").delete().eq("daily_log_id", dailyLogId);
  if (deleteError) return true;
  if (energyLevel == null) return false;

  const { error: insertError } = await supabase
    .from("energy_logs")
    .insert({ daily_log_id: dailyLogId, user_id: userId, energy_level: energyLevel });
  return Boolean(insertError);
}

async function syncPeriodLog(
  supabase: Supabase,
  userId: string,
  checkinDate: string,
  flow: CheckinFormValues["flow"],
): Promise<boolean> {
  const action = derivePeriodLogSyncAction(flow);

  if (action.type === "none") return false;

  if (action.type === "delete") {
    const { error } = await supabase
      .from("period_logs")
      .delete()
      .eq("user_id", userId)
      .eq("log_date", checkinDate);
    return Boolean(error);
  }

  const { error } = await supabase
    .from("period_logs")
    .upsert(
      { user_id: userId, log_date: checkinDate, flow_intensity: action.flowIntensity },
      { onConflict: "user_id,log_date" },
    );
  return Boolean(error);
}

export type GetRecentCheckinsResult =
  | { status: "ready"; entries: CheckinSummary[] }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getRecentCheckins(limit: number): Promise<GetRecentCheckinsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: rows, error } = await supabase
    .from("daily_logs")
    .select("id, checkin_date, flow, notes")
    .eq("user_id", user.id)
    .order("checkin_date", { ascending: false })
    .limit(limit);

  if (error) {
    return { status: "error", message: "Couldn't load your recent check-ins." };
  }
  if (!rows || rows.length === 0) {
    return { status: "ready", entries: [] };
  }

  const dailyLogIds = rows.map((r) => r.id);
  const [{ data: symptomRows }, { data: moodRows }, { data: sleepRows }, { data: energyRows }] = await Promise.all([
    supabase.from("symptom_logs").select("daily_log_id").in("daily_log_id", dailyLogIds),
    supabase.from("mood_logs").select("daily_log_id, mood_key").in("daily_log_id", dailyLogIds),
    supabase.from("sleep_logs").select("daily_log_id, sleep_quality").in("daily_log_id", dailyLogIds),
    supabase.from("energy_logs").select("daily_log_id, energy_level").in("daily_log_id", dailyLogIds),
  ]);

  const symptomCounts = new Map<string, number>();
  for (const row of symptomRows ?? []) {
    symptomCounts.set(row.daily_log_id, (symptomCounts.get(row.daily_log_id) ?? 0) + 1);
  }
  const moodsByDailyLog = new Map<string, Mood[]>();
  for (const row of moodRows ?? []) {
    const existing = moodsByDailyLog.get(row.daily_log_id);
    if (existing) existing.push(row.mood_key);
    else moodsByDailyLog.set(row.daily_log_id, [row.mood_key]);
  }
  const sleepByDailyLog = new Map((sleepRows ?? []).map((r) => [r.daily_log_id, r.sleep_quality]));
  const energyByDailyLog = new Map((energyRows ?? []).map((r) => [r.daily_log_id, r.energy_level]));

  return {
    status: "ready",
    entries: rows.map((row) => ({
      checkinDate: row.checkin_date,
      flow: row.flow,
      mood: moodsByDailyLog.get(row.id) ?? [],
      energyLevel: energyByDailyLog.get(row.id) ?? null,
      sleepQuality: sleepByDailyLog.get(row.id) ?? null,
      symptomCount: symptomCounts.get(row.id) ?? 0,
      hasNotes: Boolean(row.notes && row.notes.trim().length > 0),
    })),
  };
}

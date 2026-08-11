"use server";

import { createClient } from "@/lib/supabase/server";
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
    .from("daily_checkins")
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

  const { data: symptomRows } = await supabase
    .from("checkin_symptoms")
    .select("symptom_key")
    .eq("checkin_id", row.id);

  return {
    status: "ready",
    values: {
      checkinDate: row.checkin_date,
      flow: row.flow,
      mood: row.mood,
      energyLevel: row.energy_level,
      sleepQuality: row.sleep_quality,
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

  const { data: checkin, error: checkinError } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: user.id,
        checkin_date: data.checkinDate,
        flow: data.flow,
        mood: data.mood,
        energy_level: data.energyLevel,
        sleep_quality: data.sleepQuality,
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

  if (checkinError || !checkin) {
    return { success: false, message: "Couldn't save your check-in — please try again." };
  }

  const symptomSyncError = await syncCheckinSymptoms(
    supabase,
    checkin.id,
    user.id,
    data.symptomKeys,
  );
  if (symptomSyncError) {
    return { success: true, message: "Saved, but your symptoms didn't all save — try re-selecting them." };
  }

  const periodLogError = await syncPeriodLog(supabase, user.id, data.checkinDate, data.flow);
  if (periodLogError) {
    return { success: true, message: "Saved. Your period-day log didn't sync — you can fix it from the calendar." };
  }

  return { success: true };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function syncCheckinSymptoms(
  supabase: Supabase,
  checkinId: string,
  userId: string,
  symptomKeys: string[],
): Promise<boolean> {
  const { error: deleteError } = await supabase
    .from("checkin_symptoms")
    .delete()
    .eq("checkin_id", checkinId);
  if (deleteError) return true;

  if (symptomKeys.length === 0) return false;

  const { error: insertError } = await supabase.from("checkin_symptoms").insert(
    symptomKeys.map((symptomKey) => ({
      checkin_id: checkinId,
      user_id: userId,
      symptom_key: symptomKey,
    })),
  );
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
      .from("period_day_logs")
      .delete()
      .eq("user_id", userId)
      .eq("log_date", checkinDate);
    return Boolean(error);
  }

  const { error } = await supabase
    .from("period_day_logs")
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
    .from("daily_checkins")
    .select("id, checkin_date, flow, mood, energy_level, sleep_quality, notes")
    .eq("user_id", user.id)
    .order("checkin_date", { ascending: false })
    .limit(limit);

  if (error) {
    return { status: "error", message: "Couldn't load your recent check-ins." };
  }
  if (!rows || rows.length === 0) {
    return { status: "ready", entries: [] };
  }

  const { data: symptomRows } = await supabase
    .from("checkin_symptoms")
    .select("checkin_id")
    .in(
      "checkin_id",
      rows.map((r) => r.id),
    );

  const symptomCounts = new Map<string, number>();
  for (const row of symptomRows ?? []) {
    symptomCounts.set(row.checkin_id, (symptomCounts.get(row.checkin_id) ?? 0) + 1);
  }

  return {
    status: "ready",
    entries: rows.map((row) => ({
      checkinDate: row.checkin_date,
      flow: row.flow,
      mood: row.mood,
      energyLevel: row.energy_level,
      sleepQuality: row.sleep_quality,
      symptomCount: symptomCounts.get(row.id) ?? 0,
      hasNotes: Boolean(row.notes && row.notes.trim().length > 0),
    })),
  };
}

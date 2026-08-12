"use server";

import { createClient } from "@/lib/supabase/server";
import type { PregnancySymptomKey, PregnancySymptomSeverity } from "@/types/database";
import { emptyPregnancyCheckinFormValues, type PregnancyCheckinFormValues } from "./checkin-types";
import { calculatePregnancyDating } from "./dating-engine";
import { getActivePregnancy } from "./pregnancy-lookup";
import { getActivePregnancySafetyRules } from "./safety-actions";
import { evaluatePregnancySafety } from "./safety-evaluate";
import type { PregnancySafetyAlert } from "./safety-types";

export type GetPregnancyCheckinResult =
  | { status: "ready"; values: PregnancyCheckinFormValues; gestationalAgeWeeks: number }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

export async function getPregnancyCheckinForDate(logDate: string): Promise<GetPregnancyCheckinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const dating = calculatePregnancyDating({
    lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
    clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
    ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
    userEnteredDueDate: pregnancy.estimatedDueDate,
    today: logDate,
  });

  const { data: log } = await supabase
    .from("pregnancy_daily_logs")
    .select("id, energy_level, sleep_quality, hydration_level, appetite_level, notes")
    .eq("pregnancy_id", pregnancy.id)
    .eq("log_date", logDate)
    .maybeSingle();

  if (!log) {
    return {
      status: "ready",
      values: emptyPregnancyCheckinFormValues(logDate),
      gestationalAgeWeeks: dating.gestationalAgeWeeks,
    };
  }

  const [{ data: moodRows }, { data: symptomRows }] = await Promise.all([
    supabase.from("pregnancy_moods").select("mood_key").eq("daily_log_id", log.id),
    supabase.from("pregnancy_symptoms").select("symptom_key, severity").eq("daily_log_id", log.id),
  ]);

  const symptoms: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>> = {};
  for (const row of symptomRows ?? []) {
    if (row.severity) symptoms[row.symptom_key] = row.severity;
  }

  return {
    status: "ready",
    values: {
      logDate,
      mood: (moodRows ?? []).map((m) => m.mood_key),
      energyLevel: log.energy_level,
      sleepQuality: log.sleep_quality,
      hydrationLevel: log.hydration_level,
      appetiteLevel: log.appetite_level,
      symptoms,
      notes: log.notes ?? "",
    },
    gestationalAgeWeeks: dating.gestationalAgeWeeks,
  };
}

export type SavePregnancyCheckinResult =
  | { status: "ready"; safetyAlerts: PregnancySafetyAlert[] }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

export async function savePregnancyCheckin(values: PregnancyCheckinFormValues): Promise<SavePregnancyCheckinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const { data: log, error: logError } = await supabase
    .from("pregnancy_daily_logs")
    .upsert(
      {
        pregnancy_id: pregnancy.id,
        user_id: user.id,
        log_date: values.logDate,
        energy_level: values.energyLevel,
        sleep_quality: values.sleepQuality,
        hydration_level: values.hydrationLevel,
        appetite_level: values.appetiteLevel,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : null,
      },
      { onConflict: "pregnancy_id,log_date" },
    )
    .select("id")
    .single();

  if (logError || !log) {
    return { status: "error", message: "Couldn't save your check-in — please try again." };
  }

  await supabase.from("pregnancy_moods").delete().eq("daily_log_id", log.id);
  if (values.mood.length > 0) {
    await supabase
      .from("pregnancy_moods")
      .insert(values.mood.map((moodKey) => ({ daily_log_id: log.id, user_id: user.id, mood_key: moodKey })));
  }

  await supabase.from("pregnancy_symptoms").delete().eq("daily_log_id", log.id);
  const symptomEntries = Object.entries(values.symptoms) as [PregnancySymptomKey, PregnancySymptomSeverity][];
  if (symptomEntries.length > 0) {
    await supabase.from("pregnancy_symptoms").insert(
      symptomEntries.map(([symptomKey, severity]) => ({
        daily_log_id: log.id,
        user_id: user.id,
        symptom_key: symptomKey,
        severity,
      })),
    );
  }

  const dating = calculatePregnancyDating({
    lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
    clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
    ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
    userEnteredDueDate: pregnancy.estimatedDueDate,
    today: values.logDate,
  });

  await supabase.from("pregnancy_insights").upsert(
    {
      pregnancy_id: pregnancy.id,
      user_id: user.id,
      log_date: values.logDate,
      gestational_age_days: dating.totalGestationalAgeDays,
      trimester: dating.currentTrimester,
    },
    { onConflict: "pregnancy_id,log_date" },
  );

  const rules = await getActivePregnancySafetyRules();
  const safetyAlerts = evaluatePregnancySafety(
    { gestationalAgeWeeks: dating.gestationalAgeWeeks, symptomSeverities: values.symptoms },
    rules,
  );

  return { status: "ready", safetyAlerts };
}

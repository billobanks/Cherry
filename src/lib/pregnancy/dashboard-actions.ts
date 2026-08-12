"use server";

import { formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import { calculatePregnancyDating } from "./dating-engine";
import { getMostRecentPregnancy } from "./pregnancy-lookup";
import { getActivePregnancySafetyRules } from "./safety-actions";
import { evaluatePregnancySafety } from "./safety-evaluate";
import type { PregnancySafetyAlert } from "./safety-types";
import { buildPregnancyToday, type PregnancyTodayOutput, type PregnancyTodaySignals } from "./today-engine";
import { getPublishedWeekContent } from "./week-content-actions";

export type GetPregnancyTodayResult =
  | {
      status: "ready";
      today: PregnancyTodayOutput;
      displayName: string | null;
      hasLoggedToday: boolean;
      safetyAlerts: PregnancySafetyAlert[];
    }
  | { status: "delivered"; displayName: string | null; deliveryDate: string | null }
  | { status: "pregnancy_ended"; displayName: string | null }
  | { status: "no_pregnancy" }
  | { status: "signed_out" }
  | { status: "error"; message: string };

export async function getPregnancyToday(): Promise<GetPregnancyTodayResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getMostRecentPregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_pregnancy" };

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
  const displayName = profile?.display_name ?? null;

  if (pregnancy.status === "PREGNANCY_ENDED") {
    return { status: "pregnancy_ended", displayName };
  }

  if (pregnancy.status === "DELIVERED") {
    const { data: delivery } = await supabase
      .from("delivery_records")
      .select("delivery_date")
      .eq("pregnancy_id", pregnancy.id)
      .maybeSingle();
    return { status: "delivered", displayName, deliveryDate: delivery?.delivery_date ?? null };
  }

  if (pregnancy.status === "ARCHIVED") {
    return { status: "no_pregnancy" };
  }

  // PREGNANT
  let dating;
  try {
    dating = calculatePregnancyDating({
      lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
      clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
      ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
      userEnteredDueDate: pregnancy.estimatedDueDate,
    });
  } catch {
    return { status: "error", message: "We couldn't calculate your pregnancy timeline." };
  }

  const todayISO = formatISODate(todayEpochDays());

  const { data: log } = await supabase
    .from("pregnancy_daily_logs")
    .select("id, energy_level, sleep_quality, hydration_level, appetite_level")
    .eq("pregnancy_id", pregnancy.id)
    .eq("log_date", todayISO)
    .maybeSingle();

  let todaySignals: PregnancyTodaySignals | null = null;
  if (log) {
    const [{ data: moodRows }, { data: symptomRows }] = await Promise.all([
      supabase.from("pregnancy_moods").select("mood_key").eq("daily_log_id", log.id),
      supabase.from("pregnancy_symptoms").select("symptom_key, severity").eq("daily_log_id", log.id),
    ]);
    const symptoms: PregnancyTodaySignals["symptoms"] = {};
    for (const row of symptomRows ?? []) {
      if (row.severity) symptoms[row.symptom_key] = row.severity;
    }
    todaySignals = {
      mood: (moodRows ?? []).map((m) => m.mood_key),
      energyLevel: log.energy_level,
      sleepQuality: log.sleep_quality,
      hydrationLevel: log.hydration_level,
      appetiteLevel: log.appetite_level,
      symptoms,
    };
  }

  const [weekContent, rules] = await Promise.all([
    getPublishedWeekContent(dating.gestationalAgeWeeks),
    getActivePregnancySafetyRules(),
  ]);

  const safetyAlerts = todaySignals
    ? evaluatePregnancySafety({ gestationalAgeWeeks: dating.gestationalAgeWeeks, symptomSeverities: todaySignals.symptoms }, rules)
    : [];

  const today = buildPregnancyToday({ dating, today: todaySignals, publishedWeekContent: weekContent, safetyAlerts });

  return { status: "ready", today, displayName, hasLoggedToday: log !== null, safetyAlerts };
}

export type { PregnancyTodayOutput };

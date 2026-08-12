"use server";

import { formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import { hasPremiumAccessForUser } from "@/lib/subscription";
import { PREGNANCY_SYMPTOM_OPTIONS } from "./constants";
import { calculatePregnancyDating } from "./dating-engine";
import { buildPregnancyIntelligence, type PregnancyIntelligenceOutput, type PregnancyIntelligenceTodaySignals } from "./intelligence-engine";
import { analyzeEnergyTrend, analyzeSleepTrend, analyzeSymptomFrequency, type PatternSentence } from "./patterns-engine";
import { getActivePregnancy } from "./pregnancy-lookup";
import { getActivePregnancySafetyRules } from "./safety-actions";
import { evaluatePregnancySafety } from "./safety-evaluate";
import { getPublishedWeekContent } from "./week-content-actions";

const HISTORY_WINDOW_DAYS = 30;
const SYMPTOM_WINDOW_DAYS = 14;

const SYMPTOM_LABELS = Object.fromEntries(PREGNANCY_SYMPTOM_OPTIONS.map((o) => [o.key, o.label])) as Record<string, string>;

export type GetPregnancyIntelligenceResult =
  | { status: "ready"; intelligence: PregnancyIntelligenceOutput; hasLoggedToday: boolean }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

/**
 * Composes the daily "five questions" experience for an active pregnancy.
 * The core answer (baby/body/why/today/safety) is available to every user —
 * only the trend-based `personalized.patterns` sentences are gated behind
 * Premium, matching "My Pregnancy Patterns" elsewhere in the app. A free
 * user with no trend data simply sees an empty patterns list, never a
 * paywall on the whole daily experience.
 */
export async function getPregnancyIntelligence(): Promise<GetPregnancyIntelligenceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

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
    .select("id, energy_level, sleep_quality")
    .eq("pregnancy_id", pregnancy.id)
    .eq("log_date", todayISO)
    .maybeSingle();

  let todaySignals: PregnancyIntelligenceTodaySignals | null = null;
  if (log) {
    const [{ data: moodRows }, { data: symptomRows }] = await Promise.all([
      supabase.from("pregnancy_moods").select("mood_key").eq("daily_log_id", log.id),
      supabase.from("pregnancy_symptoms").select("symptom_key, severity").eq("daily_log_id", log.id),
    ]);
    const symptoms: PregnancyIntelligenceTodaySignals["symptoms"] = {};
    for (const row of symptomRows ?? []) {
      if (row.severity) symptoms[row.symptom_key] = row.severity;
    }
    todaySignals = {
      mood: (moodRows ?? []).map((m) => m.mood_key),
      energyLevel: log.energy_level,
      sleepQuality: log.sleep_quality,
      symptoms,
    };
  }

  const [weekContent, rules, profile, isPremium] = await Promise.all([
    getPublishedWeekContent(dating.gestationalAgeWeeks),
    getActivePregnancySafetyRules(),
    supabase.from("pregnancy_profiles").select("focus_areas").eq("pregnancy_id", pregnancy.id).maybeSingle(),
    hasPremiumAccessForUser(supabase, user.id),
  ]);

  const safetyAlerts = todaySignals
    ? evaluatePregnancySafety({ gestationalAgeWeeks: dating.gestationalAgeWeeks, symptomSeverities: todaySignals.symptoms }, rules)
    : [];

  let patternSentences: PatternSentence[] = [];
  if (isPremium) {
    const { data: historyLogs } = await supabase
      .from("pregnancy_daily_logs")
      .select("id, log_date, energy_level, sleep_quality")
      .eq("pregnancy_id", pregnancy.id)
      .order("log_date", { ascending: false })
      .limit(HISTORY_WINDOW_DAYS);

    const logIds = (historyLogs ?? []).map((l) => l.id);
    const { data: symptomRows } =
      logIds.length > 0
        ? await supabase.from("pregnancy_symptoms").select("daily_log_id, symptom_key").in("daily_log_id", logIds)
        : { data: [] as { daily_log_id: string; symptom_key: string }[] };

    const logDateById = new Map((historyLogs ?? []).map((l) => [l.id, l.log_date]));
    const energyEntries = (historyLogs ?? []).filter((l) => l.energy_level != null).map((l) => ({ logDate: l.log_date, value: l.energy_level as number }));
    const sleepEntries = (historyLogs ?? []).filter((l) => l.sleep_quality != null).map((l) => ({ logDate: l.log_date, value: l.sleep_quality as number }));
    const symptomLogs = (symptomRows ?? [])
      .map((row) => {
        const logDate = logDateById.get(row.daily_log_id);
        return logDate ? { logDate, symptomKey: row.symptom_key } : null;
      })
      .filter((entry): entry is { logDate: string; symptomKey: string } => entry !== null);

    patternSentences = [
      analyzeEnergyTrend(energyEntries, todayISO),
      analyzeSleepTrend(sleepEntries, todayISO),
      ...analyzeSymptomFrequency(symptomLogs as never, todayISO, SYMPTOM_WINDOW_DAYS, SYMPTOM_LABELS as never),
    ].filter((p): p is PatternSentence => p !== null);
  }

  const intelligence = buildPregnancyIntelligence({
    dating,
    today: todaySignals,
    publishedWeekContent: weekContent,
    patternSentences,
    focusAreas: profile.data?.focus_areas ?? [],
    safetyAlerts,
  });

  return { status: "ready", intelligence, hasLoggedToday: log !== null };
}

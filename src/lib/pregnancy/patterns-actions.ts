"use server";

import { formatISODate, todayEpochDays } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import { hasPremiumAccessForUser } from "@/lib/subscription";
import { PREGNANCY_SYMPTOM_OPTIONS } from "./constants";
import { analyzeEnergyTrend, analyzeSleepTrend, analyzeSymptomFrequency, type PatternSentence } from "./patterns-engine";
import { getActivePregnancy } from "./pregnancy-lookup";

const SYMPTOM_WINDOW_DAYS = 14;
const HISTORY_WINDOW_DAYS = 30;

const SYMPTOM_LABELS = Object.fromEntries(PREGNANCY_SYMPTOM_OPTIONS.map((o) => [o.key, o.label])) as Record<string, string>;

export type GetPregnancyPatternsResult =
  | { status: "ready"; patterns: PatternSentence[]; hasAnyData: boolean }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

export async function getPregnancyPatterns(): Promise<GetPregnancyPatternsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  // Pattern recognition / historical trend analysis is a Premium feature.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const todayISO = formatISODate(todayEpochDays());

  const { data: logs, error } = await supabase
    .from("pregnancy_daily_logs")
    .select("id, log_date, energy_level, sleep_quality")
    .eq("pregnancy_id", pregnancy.id)
    .order("log_date", { ascending: false })
    .limit(HISTORY_WINDOW_DAYS);

  if (error) return { status: "error", message: "Couldn't load your patterns." };

  const logIds = (logs ?? []).map((l) => l.id);
  const { data: symptomRows } =
    logIds.length > 0
      ? await supabase.from("pregnancy_symptoms").select("daily_log_id, symptom_key").in("daily_log_id", logIds)
      : { data: [] as { daily_log_id: string; symptom_key: string }[] };

  const logDateById = new Map((logs ?? []).map((l) => [l.id, l.log_date]));

  const energyEntries = (logs ?? []).filter((l) => l.energy_level != null).map((l) => ({ logDate: l.log_date, value: l.energy_level as number }));
  const sleepEntries = (logs ?? []).filter((l) => l.sleep_quality != null).map((l) => ({ logDate: l.log_date, value: l.sleep_quality as number }));
  const symptomLogs = (symptomRows ?? [])
    .map((row) => {
      const logDate = logDateById.get(row.daily_log_id);
      return logDate ? { logDate, symptomKey: row.symptom_key } : null;
    })
    .filter((entry): entry is { logDate: string; symptomKey: string } => entry !== null);

  const patterns: PatternSentence[] = [
    analyzeEnergyTrend(energyEntries, todayISO),
    analyzeSleepTrend(sleepEntries, todayISO),
    ...analyzeSymptomFrequency(symptomLogs as never, todayISO, SYMPTOM_WINDOW_DAYS, SYMPTOM_LABELS as never),
  ].filter((p): p is PatternSentence => p !== null);

  return { status: "ready", patterns, hasAnyData: (logs ?? []).length > 0 };
}

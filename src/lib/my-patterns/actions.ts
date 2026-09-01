"use server";

import { CHECKIN_SYMPTOM_OPTIONS, MOOD_OPTIONS } from "@/lib/checkin";
import {
  DEFAULT_PERIOD_LENGTH_DAYS,
  formatISODate,
  todayEpochDays,
  type CyclePhase,
} from "@/lib/cycle-engine";
import {
  analyzeCycleLengthTrend,
  analyzeEnergyPatterns,
  analyzeMostCommonSymptoms,
  analyzePeriodDurationTrend,
  analyzeSleepPatterns,
  analyzeTaggedPatternsAllPhases,
  buildCompletedCycles,
  type DailyMetricEntry,
  type TaggedLogEntry,
} from "@/lib/patterns";
import { saveUserPatternInsights, type UserPatternInsightInput } from "@/lib/repository/pattern-insights";
import { createClient } from "@/lib/supabase/server";
import { hasPremiumAccessForUser } from "@/lib/subscription";
import type { MyPatternsData, PhasePatternSentence } from "./types";

export type GetMyPatternsResult =
  | { status: "ready"; data: MyPatternsData }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "premium_required" }
  | { status: "error"; message: string };

const SYMPTOM_LABEL_BY_KEY = Object.fromEntries(CHECKIN_SYMPTOM_OPTIONS.map((s) => [s.key, s.label]));
const MOOD_LABEL_BY_KEY = Object.fromEntries(MOOD_OPTIONS.map((m) => [m.value, m.label.toLowerCase()]));

function phasePhrase(phase: CyclePhase): string {
  return phase === "ovulation_window" ? "ovulation window" : `${phase} phase`;
}

function toSentence(
  key: string,
  label: string,
  phase: CyclePhase,
  occurrences: number,
  eligibleCycles: number,
): PhasePatternSentence {
  return {
    key,
    label,
    phase,
    phaseLabel: phasePhrase(phase),
    occurrences,
    eligibleCycles,
    sentence: `You've noticed ${label} coming up during the ${phasePhrase(phase)} — ${occurrences} of your last ${eligibleCycles} cycles.`,
  };
}

export async function getMyPatterns(): Promise<GetMyPatternsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  // Pattern recognition, advanced cycle reports, and historical trend
  // analysis are Premium features — checked here, not just at the page
  // level, so calling this action directly can't bypass entitlement.
  if (!(await hasPremiumAccessForUser(supabase, user.id))) {
    return { status: "premium_required" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("last_period_start_date, avg_period_length_days")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { status: "error", message: "We couldn't load your profile." };
  }
  if (!profile.last_period_start_date) {
    return { status: "needs_period_date" };
  }

  const { data: cycles } = await supabase
    .from("menstrual_cycles")
    .select("start_date, period_length_days")
    .eq("user_id", user.id)
    .order("start_date", { ascending: true });

  const completedCycles = buildCompletedCycles(
    cycles ?? [],
    profile.avg_period_length_days,
    DEFAULT_PERIOD_LENGTH_DAYS,
  );
  const today = formatISODate(todayEpochDays());

  const [{ data: periodLogs }, { data: checkins }] = await Promise.all([
    supabase.from("period_logs").select("log_date").eq("user_id", user.id),
    supabase.from("daily_logs").select("id, checkin_date").eq("user_id", user.id),
  ]);

  const checkinDateById = new Map((checkins ?? []).map((c) => [c.id, c.checkin_date]));
  const checkinIds = (checkins ?? []).map((c) => c.id);

  const [{ data: symptomRows }, { data: moodRows }, { data: energyRows }, { data: sleepRows }] =
    checkinIds.length > 0
      ? await Promise.all([
          supabase.from("symptom_logs").select("daily_log_id, symptom_key").in("daily_log_id", checkinIds),
          supabase.from("mood_logs").select("daily_log_id, mood_key").in("daily_log_id", checkinIds),
          supabase.from("energy_logs").select("daily_log_id, energy_level").in("daily_log_id", checkinIds),
          supabase.from("sleep_logs").select("daily_log_id, sleep_quality").in("daily_log_id", checkinIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const symptomLogs: TaggedLogEntry[] = (symptomRows ?? [])
    .map((row) => {
      const date = checkinDateById.get(row.daily_log_id);
      return date ? { date, key: row.symptom_key } : null;
    })
    .filter((entry): entry is TaggedLogEntry => entry !== null);

  const moodLogs: TaggedLogEntry[] = (moodRows ?? [])
    .map((row) => {
      const date = checkinDateById.get(row.daily_log_id);
      return date ? { date, key: row.mood_key as string } : null;
    })
    .filter((entry): entry is TaggedLogEntry => entry !== null);

  const energyEntries: DailyMetricEntry[] = (energyRows ?? [])
    .map((row) => {
      const date = checkinDateById.get(row.daily_log_id);
      return date ? { date, value: row.energy_level } : null;
    })
    .filter((entry): entry is DailyMetricEntry => entry !== null);

  const sleepEntries: DailyMetricEntry[] = (sleepRows ?? [])
    .map((row) => {
      const date = checkinDateById.get(row.daily_log_id);
      return date ? { date, value: row.sleep_quality } : null;
    })
    .filter((entry): entry is DailyMetricEntry => entry !== null);

  const cycleLength = analyzeCycleLengthTrend(completedCycles, today);
  const periodDuration = analyzePeriodDurationTrend(
    completedCycles,
    (periodLogs ?? []).map((p) => p.log_date),
    today,
  );
  const commonSymptoms = analyzeMostCommonSymptoms(
    symptomLogs.map((s) => ({ date: s.date, symptomKey: s.key })),
  )
    .slice(0, 8)
    .map((s) => ({ key: s.key, label: SYMPTOM_LABEL_BY_KEY[s.key] ?? s.key, count: s.count }));

  const symptomPhasePatterns = analyzeTaggedPatternsAllPhases(completedCycles, symptomLogs)
    .slice(0, 3)
    .map((p) =>
      toSentence(p.key, (SYMPTOM_LABEL_BY_KEY[p.key] ?? p.key).toLowerCase(), p.phase, p.occurrences, p.eligibleCycles),
    );

  const moodFrequency = analyzeMostCommonSymptoms(moodLogs.map((m) => ({ date: m.date, symptomKey: m.key })))
    .slice(0, 7)
    .map((m) => ({ key: m.key, label: MOOD_LABEL_BY_KEY[m.key] ?? m.key, count: m.count }));

  const moodPatterns = analyzeTaggedPatternsAllPhases(completedCycles, moodLogs)
    .slice(0, 3)
    .map((p) =>
      toSentence(p.key, `feeling ${MOOD_LABEL_BY_KEY[p.key] ?? p.key}`, p.phase, p.occurrences, p.eligibleCycles),
    );

  const cravingLogs = symptomLogs.filter((s) => s.key === "food_cravings");
  const cravingPatterns = analyzeTaggedPatternsAllPhases(completedCycles, cravingLogs)
    .slice(0, 2)
    .map((p) => toSentence(p.key, "cravings", p.phase, p.occurrences, p.eligibleCycles));

  const energy = analyzeEnergyPatterns(completedCycles, energyEntries);
  const sleep = analyzeSleepPatterns(completedCycles, sleepEntries);

  const hasAnyData =
    cycleLength !== null ||
    periodDuration !== null ||
    commonSymptoms.length > 0 ||
    moodPatterns.length > 0 ||
    symptomPhasePatterns.length > 0 ||
    cravingPatterns.length > 0 ||
    energy.patterns.length > 0 ||
    sleep.patterns.length > 0 ||
    energy.profile.length > 0 ||
    sleep.profile.length > 0;

  const patternRows: UserPatternInsightInput[] = [
    ...symptomPhasePatterns.map((p) => ({
      patternType: "symptom_phase" as const,
      subjectKey: p.key,
      sentence: p.sentence,
      occurrences: p.occurrences,
      eligibleCycles: p.eligibleCycles,
    })),
    ...moodPatterns.map((p) => ({
      patternType: "mood_phase" as const,
      subjectKey: p.key,
      sentence: p.sentence,
      occurrences: p.occurrences,
      eligibleCycles: p.eligibleCycles,
    })),
    ...cravingPatterns.map((p) => ({
      patternType: "craving_phase" as const,
      subjectKey: p.key,
      sentence: p.sentence,
      occurrences: p.occurrences,
      eligibleCycles: p.eligibleCycles,
    })),
    ...energy.patterns.map((p) => ({
      patternType: "energy_window" as const,
      subjectKey: null,
      sentence: p.sentence,
      occurrences: null,
      eligibleCycles: p.cycleCount,
    })),
    ...sleep.patterns.map((p) => ({
      patternType: "sleep_window" as const,
      subjectKey: null,
      sentence: p.sentence,
      occurrences: null,
      eligibleCycles: p.cycleCount,
    })),
  ];

  // Best-effort snapshot — never fail the My Patterns response over this.
  void saveUserPatternInsights(supabase, user.id, patternRows);

  return {
    status: "ready",
    data: {
      cycleLength,
      periodDuration,
      commonSymptoms,
      moodFrequency,
      moodPatterns,
      energy,
      sleep,
      symptomPhasePatterns,
      cravingPatterns,
      hasAnyData,
    },
  };
}

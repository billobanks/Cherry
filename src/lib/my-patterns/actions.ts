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
    .from("cycles")
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
    supabase.from("period_day_logs").select("log_date").eq("user_id", user.id),
    supabase
      .from("daily_checkins")
      .select("id, checkin_date, energy_level, sleep_quality, mood")
      .eq("user_id", user.id),
  ]);

  const checkinDateById = new Map((checkins ?? []).map((c) => [c.id, c.checkin_date]));
  const checkinIds = (checkins ?? []).map((c) => c.id);

  const { data: symptomRows } =
    checkinIds.length > 0
      ? await supabase.from("checkin_symptoms").select("checkin_id, symptom_key").in("checkin_id", checkinIds)
      : { data: [] as { checkin_id: string; symptom_key: string }[] };

  const symptomLogs: TaggedLogEntry[] = (symptomRows ?? [])
    .map((row) => {
      const date = checkinDateById.get(row.checkin_id);
      return date ? { date, key: row.symptom_key } : null;
    })
    .filter((entry): entry is TaggedLogEntry => entry !== null);

  const moodLogs: TaggedLogEntry[] = (checkins ?? []).flatMap((c) =>
    c.mood.map((m) => ({ date: c.checkin_date, key: m })),
  );

  const energyEntries: DailyMetricEntry[] = (checkins ?? [])
    .filter((c) => c.energy_level != null)
    .map((c) => ({ date: c.checkin_date, value: c.energy_level as number }));

  const sleepEntries: DailyMetricEntry[] = (checkins ?? [])
    .filter((c) => c.sleep_quality != null)
    .map((c) => ({ date: c.checkin_date, value: c.sleep_quality as number }));

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

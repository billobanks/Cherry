"use server";

import { calculateCycleInsights } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import type { InsightFeedbackResponse, InsightSectionKey } from "@/types/database";
import { generateDailyBodyInsight } from "./generate";
import type { DailyBodyInsight } from "./types";

export type DailyBodyInsightResult =
  | { status: "ready"; insight: DailyBodyInsight }
  | { status: "needs_period_date" }
  | { status: "signed_out" }
  | { status: "error"; message: string };

/**
 * Loads everything needed to render today's (or a specific date's) Daily
 * Body Insights page: the user's cycle position from the calculation
 * engine, their onboarding-reported common symptoms, and any feedback
 * they've already logged — then composes it into a DailyBodyInsight.
 */
export async function getDailyBodyInsight(dateOverride?: string): Promise<DailyBodyInsightResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "signed_out" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { status: "error", message: "We couldn't load your profile. Please try again." };
  }

  if (!profile.last_period_start_date) {
    return { status: "needs_period_date" };
  }

  const [{ data: cycles }, { data: commonSymptoms }] = await Promise.all([
    supabase.from("cycles").select("start_date").order("start_date", { ascending: false }).limit(24),
    supabase.from("profile_common_symptoms").select("symptom_key").eq("user_id", user.id),
  ]);

  let cycleInsights;
  try {
    cycleInsights = calculateCycleInsights({
      mostRecentPeriodStartDate: profile.last_period_start_date,
      historicalPeriodStartDates: (cycles ?? []).map((c) => c.start_date),
      averageCycleLengthDays: profile.avg_cycle_length_days,
      averagePeriodDurationDays: profile.avg_period_length_days,
      cycleVariability: profile.cycle_regularity,
      today: dateOverride,
    });
  } catch {
    return {
      status: "error",
      message: "We couldn't estimate today's cycle phase from your logged dates.",
    };
  }

  const insightDate = cycleInsights.today;

  const [{ data: todayFeedback }, { data: priorPhaseFeedback }] = await Promise.all([
    supabase
      .from("daily_insight_feedback")
      .select("section_key, response")
      .eq("user_id", user.id)
      .eq("insight_date", insightDate),
    supabase
      .from("daily_insight_feedback")
      .select("section_key")
      .eq("user_id", user.id)
      .eq("cycle_phase", cycleInsights.currentPhase)
      .eq("response", "yes")
      .lt("insight_date", insightDate),
  ]);

  const existingFeedback: Partial<Record<InsightSectionKey, InsightFeedbackResponse>> = {};
  for (const row of todayFeedback ?? []) {
    existingFeedback[row.section_key] = row.response;
  }

  const priorPhaseAgreementSections = Array.from(
    new Set((priorPhaseFeedback ?? []).map((row) => row.section_key)),
  );

  const insight = generateDailyBodyInsight({
    date: insightDate,
    cycleDay: cycleInsights.currentCycleDay,
    phase: cycleInsights.currentPhase,
    commonSymptomKeys: (commonSymptoms ?? []).map((s) => s.symptom_key),
    existingFeedback,
    priorPhaseAgreementSections,
  });

  return { status: "ready", insight };
}

export async function submitInsightFeedback(input: {
  insightDate: string;
  cyclePhase: DailyBodyInsight["phase"];
  sectionKey: InsightSectionKey;
  response: InsightFeedbackResponse;
}): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Please sign in to save your response." };
  }

  const { error } = await supabase.from("daily_insight_feedback").upsert(
    {
      user_id: user.id,
      insight_date: input.insightDate,
      cycle_phase: input.cyclePhase,
      section_key: input.sectionKey,
      response: input.response,
    },
    { onConflict: "user_id,insight_date,section_key" },
  );

  if (error) {
    return { success: false, message: "Couldn't save that just now — please try again." };
  }

  return { success: true };
}

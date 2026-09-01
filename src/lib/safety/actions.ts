"use server";

import { addDays, calculateCycleInsights, formatISODate, parseISODate } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";
import type { SafetyRuleContent } from "./types";

export interface SafetyHistoryContext {
  previousPainSeverity: number | null;
  /** Consecutive bleeding days ending the day before `checkinDate` — today isn't included. */
  priorConsecutiveBleedingDays: number;
  isOutsideExpectedBleedingWindow: boolean;
}

export type GetSafetyContextResult =
  | { status: "ready"; rules: SafetyRuleContent[]; history: SafetyHistoryContext }
  | { status: "signed_out" }
  | { status: "error"; message: string };

const CONSECUTIVE_BLEEDING_LOOKBACK_DAYS = 21;

function isoOffset(dateISO: string, offsetDays: number): string {
  return formatISODate(addDays(parseISODate(dateISO), offsetDays));
}

function countConsecutiveBleedingDays(
  rows: { checkin_date: string; flow: string | null }[],
  startingFrom: string,
): number {
  const flowByDate = new Map(rows.map((row) => [row.checkin_date, row.flow]));
  let count = 0;
  let cursor = startingFrom;
  while (true) {
    const flow = flowByDate.get(cursor);
    if (!flow || flow === "none") break;
    count += 1;
    cursor = isoOffset(cursor, -1);
  }
  return count;
}

/**
 * Everything the safety engine needs for a given check-in date: the active,
 * medically reviewed rule content plus the small slice of recent history
 * (yesterday's pain reading, an in-progress bleeding streak, whether today's
 * phase estimate makes bleeding unexpected) that today's live form values
 * alone can't tell it. Kept separate from `@/lib/checkin` on purpose — this
 * is safety-rule plumbing, not check-in plumbing.
 */
export async function getSafetyContextForCheckin(checkinDate: string): Promise<GetSafetyContextResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: ruleRows, error: rulesError } = await supabase
    .from("safety_rules")
    .select("rule_key, label, severity, message, active, params")
    .eq("active", true);

  if (rulesError) {
    return { status: "error", message: "Couldn't load safety rules." };
  }

  const rules: SafetyRuleContent[] = (ruleRows ?? []).map((row) => ({
    ruleKey: row.rule_key,
    label: row.label,
    severity: row.severity,
    message: row.message,
    active: row.active,
    params: row.params,
  }));

  const previousDate = isoOffset(checkinDate, -1);
  const lookbackStart = isoOffset(checkinDate, -CONSECUTIVE_BLEEDING_LOOKBACK_DAYS);

  const [{ data: previousCheckin }, { data: recentCheckins }, { data: profile }] = await Promise.all([
    supabase
      .from("daily_logs")
      .select("pain_severity")
      .eq("user_id", user.id)
      .eq("checkin_date", previousDate)
      .maybeSingle(),
    supabase
      .from("daily_logs")
      .select("checkin_date, flow")
      .eq("user_id", user.id)
      .gte("checkin_date", lookbackStart)
      .lt("checkin_date", checkinDate)
      .order("checkin_date", { ascending: false }),
    supabase
      .from("profiles")
      .select("last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity")
      .eq("id", user.id)
      .single(),
  ]);

  const priorConsecutiveBleedingDays = countConsecutiveBleedingDays(recentCheckins ?? [], previousDate);

  let isOutsideExpectedBleedingWindow = false;
  if (profile?.last_period_start_date) {
    const { data: cycles } = await supabase
      .from("menstrual_cycles")
      .select("start_date")
      .eq("user_id", user.id)
      .order("start_date", { ascending: true });

    try {
      const insights = calculateCycleInsights({
        mostRecentPeriodStartDate: profile.last_period_start_date,
        historicalPeriodStartDates: (cycles ?? []).map((c) => c.start_date),
        averageCycleLengthDays: profile.avg_cycle_length_days,
        averagePeriodDurationDays: profile.avg_period_length_days,
        cycleVariability: profile.cycle_regularity,
        today: checkinDate,
      });
      // Bleeding is typically expected during (or just before) the menstrual
      // phase; mid-cycle bleeding during follicular/ovulation windows is the
      // pattern worth a nudge toward professional evaluation.
      isOutsideExpectedBleedingWindow =
        insights.currentPhase === "follicular" || insights.currentPhase === "ovulation_window";
    } catch {
      isOutsideExpectedBleedingWindow = false;
    }
  }

  return {
    status: "ready",
    rules,
    history: {
      previousPainSeverity: previousCheckin?.pain_severity ?? null,
      priorConsecutiveBleedingDays,
      isOutsideExpectedBleedingWindow,
    },
  };
}

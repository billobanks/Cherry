"use server";

import { calculateCycleInsights, type CyclePhase } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";

export type GetLearnContextResult =
  | { status: "ready"; currentPhase: CyclePhase | null }
  | { status: "signed_out" };

/** Just enough to default the phase tab to "where you are now" — the content itself is a static, always-browsable library. */
export async function getLearnContext(): Promise<GetLearnContextResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_period_start_date, avg_cycle_length_days, avg_period_length_days, cycle_regularity")
    .eq("id", user.id)
    .single();

  if (!profile?.last_period_start_date) return { status: "ready", currentPhase: null };

  const { data: cycles } = await supabase
    .from("cycles")
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
    });
    return { status: "ready", currentPhase: insights.currentPhase };
  } catch {
    return { status: "ready", currentPhase: null };
  }
}

import type { CyclePhase } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface PersonalizedInsightSnapshot {
  insightDate: string;
  cyclePhase: CyclePhase;
  headline: string;
  sections: unknown[];
}

/** Persists the composed Daily Body Insight so it has a durable history, separate from the yes/no feedback rows in daily_insight_feedback. */
export async function savePersonalizedInsight(
  supabase: Supabase,
  userId: string,
  snapshot: PersonalizedInsightSnapshot,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("personalized_insights").insert({
    user_id: userId,
    insight_date: snapshot.insightDate,
    cycle_phase: snapshot.cyclePhase,
    headline: snapshot.headline,
    sections: snapshot.sections,
  });

  return { error: error?.message ?? null };
}

export async function getPersonalizedInsightForDate(supabase: Supabase, userId: string, insightDate: string) {
  const { data, error } = await supabase
    .from("personalized_insights")
    .select("headline, sections, cycle_phase, created_at")
    .eq("user_id", userId)
    .eq("insight_date", insightDate)
    .maybeSingle();

  if (error) return { insight: null, error: error.message };
  return { insight: data, error: null };
}

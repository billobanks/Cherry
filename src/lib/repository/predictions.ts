import type { CyclePhase } from "@/lib/cycle-engine";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface CyclePredictionSnapshot {
  predictedPeriodStart: string;
  confidence: "high" | "moderate" | "low";
  currentPhase: CyclePhase;
  currentCycleDay: number;
}

/**
 * Persists a snapshot of what the live cycle-engine calculation produced.
 * The engine itself (src/lib/cycle-engine) stays the source of truth for
 * what a user sees right now — this table is a queryable history of past
 * predictions, e.g. for later "how accurate were we" analysis. Best-effort:
 * callers should not fail a read-path response because this write failed.
 */
export async function saveCyclePrediction(
  supabase: Supabase,
  userId: string,
  snapshot: CyclePredictionSnapshot,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("cycle_predictions").insert({
    user_id: userId,
    predicted_period_start: snapshot.predictedPeriodStart,
    confidence: snapshot.confidence,
    current_phase: snapshot.currentPhase,
    current_cycle_day: snapshot.currentCycleDay,
  });

  return { error: error?.message ?? null };
}

export async function getLatestCyclePrediction(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("cycle_predictions")
    .select("predicted_period_start, confidence, current_phase, current_cycle_day, computed_at")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { prediction: null, error: error.message };
  return { prediction: data, error: null };
}

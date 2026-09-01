import { createClient } from "@/lib/supabase/server";
import type { PatternType } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface UserPatternInsightInput {
  patternType: PatternType;
  subjectKey: string | null;
  sentence: string;
  occurrences: number | null;
  eligibleCycles: number | null;
}

/**
 * Replaces this user's stored pattern snapshot with a freshly computed one.
 * These rows are a persisted cache of what My Patterns most recently showed
 * — the live analysis in src/lib/patterns remains the source of truth,
 * this just gives other surfaces (e.g. a future digest email) something to
 * query without re-running the analysis.
 */
export async function saveUserPatternInsights(
  supabase: Supabase,
  userId: string,
  patterns: UserPatternInsightInput[],
): Promise<{ error: string | null }> {
  const { error: deleteError } = await supabase.from("user_pattern_insights").delete().eq("user_id", userId);
  if (deleteError) return { error: deleteError.message };

  if (patterns.length === 0) return { error: null };

  const { error } = await supabase.from("user_pattern_insights").insert(
    patterns.map((p) => ({
      user_id: userId,
      pattern_type: p.patternType,
      subject_key: p.subjectKey,
      sentence: p.sentence,
      occurrences: p.occurrences,
      eligible_cycles: p.eligibleCycles,
    })),
  );

  return { error: error?.message ?? null };
}

export async function getUserPatternInsights(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from("user_pattern_insights")
    .select("pattern_type, subject_key, sentence, occurrences, eligible_cycles, computed_at")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false });

  if (error) return { patterns: [], error: error.message };
  return { patterns: data ?? [], error: null };
}

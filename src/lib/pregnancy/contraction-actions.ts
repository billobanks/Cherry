"use server";

import { createClient } from "@/lib/supabase/server";
import type { ContractionIntensity } from "@/types/database";
import { computeContractionStats, type ContractionWithStats } from "./contraction-engine";
import { getActivePregnancy } from "./pregnancy-lookup";

const RECENT_CONTRACTIONS_LIMIT = 30;

export type GetContractionsResult =
  | { status: "ready"; contractions: ContractionWithStats[] }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

export async function getRecentContractions(): Promise<GetContractionsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const { data, error } = await supabase
    .from("contraction_logs")
    .select("id, started_at, ended_at, intensity")
    .eq("pregnancy_id", pregnancy.id)
    .order("started_at", { ascending: true })
    .limit(RECENT_CONTRACTIONS_LIMIT);

  if (error) return { status: "error", message: "Couldn't load your contraction log." };

  const stats = computeContractionStats(
    (data ?? []).map((row) => ({ id: row.id, startedAt: row.started_at, endedAt: row.ended_at, intensity: row.intensity })),
  );

  return { status: "ready", contractions: [...stats].reverse() };
}

export async function startContraction(): Promise<{ success: boolean; message?: string; id?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false, message: "No active pregnancy found." };

  const { data, error } = await supabase
    .from("contraction_logs")
    .insert({ pregnancy_id: pregnancy.id, user_id: user.id, started_at: new Date().toISOString() })
    .select("id")
    .single();

  return error || !data ? { success: false, message: "Couldn't start tracking that contraction." } : { success: true, id: data.id };
}

export async function endContraction(id: string, intensity: ContractionIntensity | null): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("contraction_logs")
    .update({ ended_at: new Date().toISOString(), intensity })
    .eq("id", id)
    .eq("user_id", user.id);

  return error ? { success: false, message: "Couldn't save that contraction." } : { success: true };
}

export async function deleteContraction(id: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase.from("contraction_logs").delete().eq("id", id).eq("user_id", user.id);
  return error ? { success: false, message: "Couldn't delete that entry." } : { success: true };
}

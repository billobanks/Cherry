"use server";

import { createClient } from "@/lib/supabase/server";
import type { PregnancyChecklistItemKey } from "@/types/database";
import { NEWLY_PREGNANT_CHECKLIST } from "./checklist-content";
import { getActivePregnancy } from "./pregnancy-lookup";

export type GetPregnancyChecklistResult =
  | { status: "ready"; completedKeys: PregnancyChecklistItemKey[] }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

export async function getPregnancyChecklist(): Promise<GetPregnancyChecklistResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const { data, error } = await supabase
    .from("pregnancy_checklist_items")
    .select("item_key")
    .eq("pregnancy_id", pregnancy.id);

  if (error) return { status: "error", message: "Couldn't load your checklist." };

  return { status: "ready", completedKeys: (data ?? []).map((row) => row.item_key) };
}

export type ToggleChecklistItemResult =
  | { status: "ready"; completed: boolean }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

export async function togglePregnancyChecklistItem(itemKey: PregnancyChecklistItemKey): Promise<ToggleChecklistItemResult> {
  if (!NEWLY_PREGNANT_CHECKLIST.some((item) => item.key === itemKey)) {
    return { status: "error", message: "That isn't a checklist item." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const { data: existing } = await supabase
    .from("pregnancy_checklist_items")
    .select("id")
    .eq("pregnancy_id", pregnancy.id)
    .eq("item_key", itemKey)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("pregnancy_checklist_items").delete().eq("id", existing.id);
    if (error) return { status: "error", message: "Couldn't update your checklist." };
    return { status: "ready", completed: false };
  }

  const { error } = await supabase
    .from("pregnancy_checklist_items")
    .insert({ pregnancy_id: pregnancy.id, user_id: user.id, item_key: itemKey });
  if (error) return { status: "error", message: "Couldn't update your checklist." };
  return { status: "ready", completed: true };
}

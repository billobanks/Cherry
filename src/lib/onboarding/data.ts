import { createClient } from "@/lib/supabase/server";
import { FALLBACK_SYMPTOMS } from "./constants";

export interface SymptomOption {
  key: string;
  label: string;
}

/** Reads the public symptom_catalog for onboarding's symptom-picker step (screen 7). */
export async function getSymptomOptions(): Promise<SymptomOption[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("symptom_catalog")
      .select("key, label")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return FALLBACK_SYMPTOMS;
    }

    return data;
  } catch {
    return FALLBACK_SYMPTOMS;
  }
}

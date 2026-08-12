"use server";

import { createClient } from "@/lib/supabase/server";
import type { PregnancySafetyRuleContent, PregnancySafetyRuleKey } from "./safety-types";

/** Active pregnancy safety rules, read fresh from the DB — never cached, never client-editable. */
export async function getActivePregnancySafetyRules(): Promise<PregnancySafetyRuleContent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pregnancy_safety_rules")
    .select("rule_key, label, severity, message, active, params")
    .eq("active", true);

  return (data ?? []).map((row) => ({
    ruleKey: row.rule_key as PregnancySafetyRuleKey,
    label: row.label,
    severity: row.severity,
    message: row.message,
    active: row.active,
    params: row.params,
  }));
}

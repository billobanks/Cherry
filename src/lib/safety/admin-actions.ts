"use server";

import { createClient } from "@/lib/supabase/server";
import { SAFETY_RULE_KEYS } from "./catalog";
import type { SafetyRuleKey, SafetyRuleSeverity } from "./types";

export interface AdminSafetyRule {
  ruleKey: SafetyRuleKey;
  label: string;
  /** Explains WHEN the rule fires (owned by the code in evaluate.ts) — shown read-only in the admin UI. */
  description: string;
  severity: SafetyRuleSeverity;
  message: string;
  active: boolean;
  params: Record<string, number | string | boolean>;
  updatedAt: string;
}

export type ListSafetyRulesResult =
  | { status: "ready"; rules: AdminSafetyRule[] }
  | { status: "signed_out" }
  | { status: "forbidden" }
  | { status: "error"; message: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function requireAdmin(): Promise<
  | { ok: true; supabase: Supabase; userId: string }
  | { ok: false; reason: "signed_out" | "forbidden" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "signed_out" };

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { ok: false, reason: "forbidden" };

  return { ok: true, supabase, userId: user.id };
}

export async function listSafetyRulesForAdmin(): Promise<ListSafetyRulesResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return { status: guard.reason };

  const { data, error } = await guard.supabase
    .from("safety_rules")
    .select("rule_key, label, description, severity, message, active, params, updated_at");

  if (error || !data) {
    return { status: "error", message: "Couldn't load safety rules." };
  }

  const rules: AdminSafetyRule[] = [...data]
    .sort((a, b) => SAFETY_RULE_KEYS.indexOf(a.rule_key) - SAFETY_RULE_KEYS.indexOf(b.rule_key))
    .map((row) => ({
      ruleKey: row.rule_key,
      label: row.label,
      description: row.description,
      severity: row.severity,
      message: row.message,
      active: row.active,
      params: row.params,
      updatedAt: row.updated_at,
    }));

  return { status: "ready", rules };
}

export interface SafetyRuleUpdate {
  label: string;
  message: string;
  severity: SafetyRuleSeverity;
  active: boolean;
  params: Record<string, number | string | boolean>;
}

export async function updateSafetyRule(
  ruleKey: SafetyRuleKey,
  updates: SafetyRuleUpdate,
): Promise<{ success: boolean; message?: string }> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return {
      success: false,
      message: guard.reason === "signed_out" ? "Please sign in." : "You don't have access to manage safety rules.",
    };
  }

  const label = updates.label.trim();
  const message = updates.message.trim();
  if (!label || !message) {
    return { success: false, message: "Label and message can't be empty." };
  }

  const { error } = await guard.supabase
    .from("safety_rules")
    .update({
      label,
      message,
      severity: updates.severity,
      active: updates.active,
      params: updates.params,
      updated_by: guard.userId,
    })
    .eq("rule_key", ruleKey);

  return error ? { success: false, message: "Couldn't save changes — please try again." } : { success: true };
}

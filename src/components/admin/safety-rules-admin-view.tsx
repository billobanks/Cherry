import { SafetyRuleEditor } from "./safety-rule-editor";
import type { AdminSafetyRule, SafetyRuleUpdate } from "@/lib/safety";

export function SafetyRulesAdminView({
  rules,
  onSave,
}: {
  rules: AdminSafetyRule[];
  onSave: (ruleKey: AdminSafetyRule["ruleKey"], updates: SafetyRuleUpdate) => Promise<{ success: boolean; message?: string }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Admin</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Symptom safety rules</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          This copy should be medically reviewed before it goes live. Rules never diagnose a cause — they
          frame things as &ldquo;several possible causes&rdquo; and point toward professional evaluation.
          When a rule fires (its trigger condition) is decided in code, not here; this page only controls
          what gets said, its urgency, and whether it&apos;s active.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {rules.map((rule) => (
          <SafetyRuleEditor key={rule.ruleKey} rule={rule} onSave={onSave} />
        ))}
      </div>
    </div>
  );
}

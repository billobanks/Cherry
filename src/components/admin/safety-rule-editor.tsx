"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminSafetyRule, SafetyRuleUpdate } from "@/lib/safety";

const SEVERITY_OPTIONS = [
  { value: "routine" as const, label: "Routine" },
  { value: "urgent" as const, label: "Urgent" },
];

export function SafetyRuleEditor({
  rule,
  onSave,
}: {
  rule: AdminSafetyRule;
  onSave: (ruleKey: AdminSafetyRule["ruleKey"], updates: SafetyRuleUpdate) => Promise<{ success: boolean; message?: string }>;
}) {
  const [label, setLabel] = useState(rule.label);
  const [message, setMessage] = useState(rule.message);
  const [severity, setSeverity] = useState(rule.severity);
  const [active, setActive] = useState(rule.active);
  const [thresholdDays, setThresholdDays] = useState(
    typeof rule.params.thresholdDays === "number" ? String(rule.params.thresholdDays) : "",
  );
  const [isPending, startTransition] = useTransition();

  const isDirty =
    label !== rule.label ||
    message !== rule.message ||
    severity !== rule.severity ||
    active !== rule.active ||
    (rule.ruleKey === "prolonged_bleeding" &&
      thresholdDays !== (typeof rule.params.thresholdDays === "number" ? String(rule.params.thresholdDays) : ""));

  function handleSave() {
    const params: SafetyRuleUpdate["params"] = { ...rule.params };
    if (rule.ruleKey === "prolonged_bleeding") {
      const parsed = Number.parseInt(thresholdDays, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        params.thresholdDays = parsed;
      }
    }

    startTransition(async () => {
      const result = await onSave(rule.ruleKey, { label, message, severity, active, params });
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save this rule.");
        return;
      }
      toast.success(`"${label}" saved.`);
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            {rule.ruleKey}
          </span>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rule.description}</p>
        </div>
        <Switch checked={active} onCheckedChange={setActive} aria-label={`${label} active`} />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-foreground" htmlFor={`${rule.ruleKey}-label`}>
          Label
        </label>
        <Input
          id={`${rule.ruleKey}-label`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-2"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-foreground" htmlFor={`${rule.ruleKey}-message`}>
          Message shown to users
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Non-diagnostic context only — explain that this can have several possible causes, never name a
          condition. The call-to-action (&ldquo;consider contacting a healthcare professional&rdquo; /
          &ldquo;seek timely medical care&rdquo;) is appended automatically based on severity below.
        </p>
        <Textarea
          id={`${rule.ruleKey}-message`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-2 rounded-2xl"
        />
      </div>

      <div className="mt-4">
        <ChipSelect label="Severity" options={SEVERITY_OPTIONS} multi={false} value={severity} onChange={setSeverity} />
      </div>

      {rule.ruleKey === "prolonged_bleeding" ? (
        <div className="mt-4">
          <label className="text-sm font-medium text-foreground" htmlFor={`${rule.ruleKey}-threshold`}>
            Threshold (consecutive bleeding days)
          </label>
          <Input
            id={`${rule.ruleKey}-threshold`}
            type="number"
            min={1}
            value={thresholdDays}
            onChange={(e) => setThresholdDays(e.target.value)}
            className="mt-2 w-24"
          />
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Last updated {new Date(rule.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </button>
      </div>
    </section>
  );
}

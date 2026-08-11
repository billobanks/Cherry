import { notFound } from "next/navigation";
import { SafetyRulesAdminView } from "@/components/admin/safety-rules-admin-view";
import type { AdminSafetyRule } from "@/lib/safety";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function SafetyRulesAdminPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const rules: AdminSafetyRule[] = [
    {
      ruleKey: "heavy_bleeding",
      label: "Unusually heavy bleeding",
      description: 'Fires when today\'s logged flow is "heavy".',
      severity: "routine",
      message: "Bleeding that's heavier than what's typical for you can have several possible causes.",
      active: true,
      params: {},
      updatedAt: "2026-08-15T00:00:00Z",
    },
    {
      ruleKey: "severe_or_worsening_pain",
      label: "Severe or rapidly worsening pain",
      description:
        "Fires when logged pain severity is at the top of the scale, or has jumped sharply since the previous day's check-in.",
      severity: "urgent",
      message:
        "Pain that's severe, or that's getting noticeably worse quickly, can have several possible causes and is more than typical cycle discomfort.",
      active: true,
      params: {},
      updatedAt: "2026-08-15T00:00:00Z",
    },
    {
      ruleKey: "fainting",
      label: "Fainting",
      description: 'Fires when "fainting" is logged as a symptom for the day.',
      severity: "urgent",
      message: "Fainting, or feeling like you might faint, can have several possible causes, and some warrant prompt attention.",
      active: true,
      params: {},
      updatedAt: "2026-08-15T00:00:00Z",
    },
    {
      ruleKey: "dizziness_with_heavy_bleeding",
      label: "Dizziness with heavy bleeding",
      description: 'Fires when "dizziness" is logged alongside a "heavy" flow on the same day.',
      severity: "urgent",
      message:
        "Feeling dizzy along with heavier bleeding can have several possible causes, and together they're more than typical cycle discomfort.",
      active: true,
      params: {},
      updatedAt: "2026-08-14T00:00:00Z",
    },
    {
      ruleKey: "unusual_bleeding_pattern",
      label: "Unusual bleeding pattern",
      description:
        "Fires when bleeding is logged during a phase window where it isn't typically expected (e.g. well before the estimated period).",
      severity: "routine",
      message: "Bleeding outside of when you'd expect your period can have several possible causes.",
      active: true,
      params: {},
      updatedAt: "2026-08-10T00:00:00Z",
    },
    {
      ruleKey: "prolonged_bleeding",
      label: "Prolonged bleeding",
      description: "Fires when bleeding has been logged for more consecutive days than the configured threshold.",
      severity: "routine",
      message: "Bleeding that continues longer than what's typical for you can have several possible causes.",
      active: false,
      params: { thresholdDays: 8 },
      updatedAt: "2026-08-09T00:00:00Z",
    },
  ];

  return (
    <SafetyRulesAdminView
      rules={rules}
      onSave={async (ruleKey, updates) => {
        "use server";
        console.log("[preview] would save", ruleKey, updates);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      }}
    />
  );
}

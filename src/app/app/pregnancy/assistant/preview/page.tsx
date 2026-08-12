import { notFound } from "next/navigation";
import { PregnancyAssistantChatView } from "@/components/pregnancy/pregnancy-assistant-chat-view";
import {
  buildPregnancyAssistantContext,
  buildPregnancyAssistantSystemPrompt,
  evaluatePregnancyAssistantSafety,
  type PregnancyAssistantMessage,
} from "@/lib/pregnancy/assistant";
import { MockAssistantProvider } from "@/lib/assistant";
import { calculatePregnancyDating } from "@/lib/pregnancy";
import type { PregnancySafetyRuleContent } from "@/lib/pregnancy";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancyAssistantPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const initialMessages: PregnancyAssistantMessage[] = [
    { role: "user", content: "I'm 22 weeks and exhausted again. Why?" },
    {
      role: "assistant",
      content:
        "Your sleep quality has been on the lower side lately, and that alone can leave you dragging. Fatigue also tends to creep back in around this point in pregnancy, as your body carries more weight and rest gets harder to come by — so the two together make a lot of sense.\n\nThis is general education, not medical advice.",
    },
  ];

  const dating = calculatePregnancyDating({ clinicianEstimatedDueDate: "2026-12-01", today: "2026-07-15" });

  const safetyRules: PregnancySafetyRuleContent[] = [
    {
      ruleKey: "fever",
      label: "Fever",
      severity: "urgent",
      message: "A fever during pregnancy can have several possible causes.",
      active: true,
      params: {},
    },
  ];

  const context = buildPregnancyAssistantContext({
    dating,
    today: { mood: ["stressed"], energyLevel: 2, sleepQuality: 2, symptomSeverities: { heartburn: "mild" } },
    recentSymptomCounts: [{ symptomKey: "heartburn", count: 5 }],
    recentWindowDays: 14,
    symptomLabels: { heartburn: "Heartburn" },
  });

  return (
    <PregnancyAssistantChatView
      initialMessages={initialMessages}
      providerConfigured={true}
      onSend={async (message) => {
        "use server";
        // Constructed here, not captured from the outer closure — a class
        // instance can't cross the Server Action serialization boundary.
        const provider = new MockAssistantProvider();
        const systemPrompt = buildPregnancyAssistantSystemPrompt(context);
        const result = await provider.generateReply({
          systemPrompt,
          messages: [...initialMessages, { role: "user", content: message }],
        });
        const safetyAlerts = evaluatePregnancyAssistantSafety(context.gestationalAgeWeeks, context.today, safetyRules);
        return { status: "ready" as const, reply: { role: "assistant" as const, content: result.content }, safetyAlerts };
      }}
    />
  );
}

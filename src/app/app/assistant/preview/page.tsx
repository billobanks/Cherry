import { notFound } from "next/navigation";
import { AssistantChatView } from "@/components/assistant/chat-view";
import {
  buildAssistantContext,
  buildAssistantSystemPrompt,
  evaluateAssistantSafety,
  MockAssistantProvider,
  type AssistantMessage,
} from "@/lib/assistant";
import type { SafetyRuleContent } from "@/lib/safety";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function AssistantPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const initialMessages: AssistantMessage[] = [
    { role: "user", content: "Why am I so tired today?" },
    {
      role: "assistant",
      content:
        "That tracks with what you've logged lately — your energy and sleep have both been running a little low, and that combination can really add up. Feeling more tired in the days leading up to a period is common too, though it varies a lot from person to person.\n\nThis is general education, not medical advice.",
    },
  ];

  // Fixture signals that also exercise the deterministic safety-engine
  // integration: heavy flow + dizziness should surface an urgent alert
  // alongside whatever the (mock) AI says.
  const safetyRules: SafetyRuleContent[] = [
    {
      ruleKey: "dizziness_with_heavy_bleeding",
      label: "Dizziness with heavy bleeding",
      severity: "urgent",
      message:
        "Feeling dizzy along with heavier bleeding can have several possible causes, and together they're more than typical cycle discomfort.",
      active: true,
      params: {},
    },
    {
      ruleKey: "heavy_bleeding",
      label: "Unusually heavy bleeding",
      severity: "routine",
      message: "Bleeding that's heavier than what's typical for you can have several possible causes.",
      active: true,
      params: {},
    },
  ];

  const context = buildAssistantContext({
    cycleInsights: null,
    today: {
      flow: "heavy",
      energyLevel: 2,
      sleepQuality: 2,
      painSeverity: null,
      mood: ["stressed"],
      symptomKeys: ["dizziness", "fatigue"],
    },
    recentSymptomCounts: [{ symptomKey: "fatigue", count: 5 }],
    recentWindowDays: 14,
    symptomLabels: { fatigue: "Fatigue" },
  });

  return (
    <AssistantChatView
      initialMessages={initialMessages}
      providerConfigured={true}
      onSend={async (message) => {
        "use server";
        // Constructed here, not captured from the outer closure — a class
        // instance can't cross the Server Action serialization boundary.
        const provider = new MockAssistantProvider();
        const systemPrompt = buildAssistantSystemPrompt(context);
        const result = await provider.generateReply({
          systemPrompt,
          messages: [...initialMessages, { role: "user", content: message }],
        });
        const safetyAlerts = evaluateAssistantSafety(
          context.today,
          { previousPainSeverity: null, priorConsecutiveBleedingDays: 0, isOutsideExpectedBleedingWindow: false },
          safetyRules,
        );
        return { status: "ready" as const, reply: { role: "assistant" as const, content: result.content }, safetyAlerts };
      }}
    />
  );
}

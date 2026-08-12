import type { AssistantProvider, AssistantProviderRequest, AssistantProviderResponse } from "./types";

const EDUCATION_FOOTER = "\n\nThis is general education, not medical advice.";

const CANNED_REPLIES: { pattern: RegExp; reply: string }[] = [
  {
    pattern: /tired|energy|exhaust/i,
    reply:
      "That tracks with what you've logged lately — your energy and sleep have both been running a little low, and that combination can really add up. Feeling more tired in the days leading up to a period is common too, though it varies a lot from person to person.",
  },
  {
    pattern: /crav(e|ing)|sweet/i,
    reply:
      "Some people notice more cravings, including for sweet foods, in the days before their period — this is commonly reported but far from universal. Pairing something sweet with a bit of protein or fiber is a common approach if you'd like one.",
  },
  {
    pattern: /bloat/i,
    reply:
      "Bloating is commonly reported around the late luteal phase and into the first days of a period for many people, and it often eases once bleeding starts.",
  },
  {
    pattern: /exercise|workout|movement|active/i,
    reply:
      "Gentle movement like walking, yoga, or stretching is a common choice on lower-energy days, while some people feel ready for more vigorous activity at other points in their cycle — it really varies by person and by day.",
  },
  {
    pattern: /food|eat|nutrition|meal/i,
    reply:
      "Foods with iron, fiber, and balanced carbohydrates are commonly suggested as general wellness support around a period, alongside staying hydrated.",
  },
];

const FALLBACK_REPLY =
  "In preview mode I only have a few canned answers. In a real conversation I'd draw on your logged cycle data and the safety guidelines in my system prompt to answer thoughtfully.";

/**
 * Deterministic, no-network provider. Used by the dev-only preview route and
 * by tests — never wired up for real users, so nobody mistakes a canned
 * reply for a live AI response.
 */
export class MockAssistantProvider implements AssistantProvider {
  readonly name = "mock";

  async generateReply(request: AssistantProviderRequest): Promise<AssistantProviderResponse> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === "user");
    const text = lastUserMessage?.content ?? "";
    const match = CANNED_REPLIES.find((c) => c.pattern.test(text));
    return { content: (match?.reply ?? FALLBACK_REPLY) + EDUCATION_FOOTER };
  }
}

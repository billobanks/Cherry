import { AnthropicAssistantProvider } from "./anthropic";
import type { AssistantProvider } from "./types";

export { AnthropicAssistantProvider } from "./anthropic";
export { MockAssistantProvider } from "./mock";
export { AssistantProviderError } from "./types";
export type { AssistantProvider, AssistantProviderRequest, AssistantProviderResponse } from "./types";

/**
 * The only place application code learns which AI provider is active.
 * Swapping vendors later means adding one adapter file behind
 * `AssistantProvider` and pointing this factory at it — no call site in the
 * app touches a provider-specific request/response shape.
 *
 * Returns null when no provider is configured, so callers can show a clear
 * "not set up yet" state instead of silently serving a fallback reply.
 */
export function getAssistantProvider(): AssistantProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new AnthropicAssistantProvider(apiKey);
}

import type { AssistantMessage } from "../types";

export interface AssistantProviderRequest {
  systemPrompt: string;
  /** Conversation so far, oldest first, ending with the new user message. */
  messages: AssistantMessage[];
}

export interface AssistantProviderResponse {
  content: string;
}

/**
 * The one interface application code (server actions, UI) is allowed to
 * depend on. Every concrete AI vendor lives behind this — swapping providers
 * means writing one new file that implements it and pointing the factory in
 * `./index.ts` at it, never touching call sites.
 */
export interface AssistantProvider {
  readonly name: string;
  generateReply(request: AssistantProviderRequest): Promise<AssistantProviderResponse>;
}

export class AssistantProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AssistantProviderError";
  }
}

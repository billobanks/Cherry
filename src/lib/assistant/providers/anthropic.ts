import { AssistantProviderError } from "./types";
import type { AssistantProvider, AssistantProviderRequest, AssistantProviderResponse } from "./types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;

interface AnthropicResponseBody {
  content: { type: string; text?: string }[];
}

/** Real adapter over Anthropic's Messages API. Server-side only — the API key must never reach the client. */
export class AnthropicAssistantProvider implements AssistantProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  async generateReply(request: AssistantProviderRequest): Promise<AssistantProviderResponse> {
    let response: Response;
    try {
      response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: MAX_TOKENS,
          system: request.systemPrompt,
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
    } catch (err) {
      throw new AssistantProviderError("Couldn't reach the AI provider.", err);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AssistantProviderError(`AI provider error (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as AnthropicResponseBody;
    const text = data.content.find((block) => block.type === "text")?.text;
    if (!text) {
      throw new AssistantProviderError("AI provider returned an empty response.");
    }

    return { content: text };
  }
}

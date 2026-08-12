import { describe, expect, it, afterEach } from "vitest";
import { getAssistantProvider } from "../index";
import { MockAssistantProvider } from "../mock";

describe("MockAssistantProvider", () => {
  const provider = new MockAssistantProvider();

  it("implements the AssistantProvider interface shape", () => {
    expect(provider.name).toBe("mock");
    expect(typeof provider.generateReply).toBe("function");
  });

  it("matches a canned reply to the last user message", async () => {
    const result = await provider.generateReply({
      systemPrompt: "irrelevant for the mock",
      messages: [{ role: "user", content: "Why am I so tired today?" }],
    });
    expect(result.content).toMatch(/energy/i);
    expect(result.content).toMatch(/general education, not medical advice/i);
  });

  it("falls back to a generic reply for unmatched questions, still labeled as education", async () => {
    const result = await provider.generateReply({
      systemPrompt: "irrelevant for the mock",
      messages: [{ role: "user", content: "What's the capital of France?" }],
    });
    expect(result.content).toMatch(/general education, not medical advice/i);
  });

  it("responds to the last user message even with prior assistant turns in history", async () => {
    const result = await provider.generateReply({
      systemPrompt: "irrelevant for the mock",
      messages: [
        { role: "user", content: "Why am I craving sweets?" },
        { role: "assistant", content: "Some people notice more cravings..." },
        { role: "user", content: "Is bloating common during this part of my cycle?" },
      ],
    });
    expect(result.content).toMatch(/bloat/i);
  });
});

describe("getAssistantProvider", () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it("returns null when no API key is configured", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(getAssistantProvider()).toBeNull();
  });

  it("returns an Anthropic-backed provider when an API key is configured", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const provider = getAssistantProvider();
    expect(provider).not.toBeNull();
    expect(provider?.name).toBe("anthropic");
  });
});

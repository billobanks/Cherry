import { describe, expect, it } from "vitest";
import { accountSchema } from "../schema";

describe("accountSchema", () => {
  it("accepts the exact shape completeOnboarding's server action sends (no confirmPassword)", () => {
    // AccountDetails (what the server action actually receives) has no
    // confirmPassword field — only the client form does, to compare against a
    // second typed-in value. Regression test for a bug where the server-side
    // parse always failed here, blocking every real signup.
    const result = accountSchema.safeParse({
      displayName: null,
      email: "person@example.com",
      password: "correct-horse-1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a client-form payload with a matching confirmPassword", () => {
    const result = accountSchema.safeParse({
      displayName: "Alex",
      email: "person@example.com",
      password: "correct-horse-1",
      confirmPassword: "correct-horse-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a client-form payload with a mismatched confirmPassword", () => {
    const result = accountSchema.safeParse({
      displayName: null,
      email: "person@example.com",
      password: "correct-horse-1",
      confirmPassword: "different-password-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password without a number", () => {
    const result = accountSchema.safeParse({
      displayName: null,
      email: "person@example.com",
      password: "onlyletters",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = accountSchema.safeParse({
      displayName: null,
      email: "not-an-email",
      password: "correct-horse-1",
    });
    expect(result.success).toBe(false);
  });
});

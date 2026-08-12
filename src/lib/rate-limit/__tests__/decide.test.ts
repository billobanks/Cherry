import { describe, expect, it } from "vitest";
import { decideRateLimit } from "../decide";

const CONFIG = { limit: 3, windowSeconds: 600 };

describe("decideRateLimit", () => {
  it("allows the first request in a window", () => {
    const result = decideRateLimit(0, CONFIG);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.retryAfterSeconds).toBeNull();
  });

  it("allows requests right up to the limit", () => {
    const result = decideRateLimit(2, CONFIG);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("denies the request that would exceed the limit", () => {
    const result = decideRateLimit(3, CONFIG);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBe(600);
  });

  it("denies further requests well past the limit", () => {
    const result = decideRateLimit(50, CONFIG);
    expect(result.allowed).toBe(false);
  });

  it("never reports negative remaining", () => {
    const result = decideRateLimit(10, CONFIG);
    expect(result.remaining).toBe(0);
  });
});

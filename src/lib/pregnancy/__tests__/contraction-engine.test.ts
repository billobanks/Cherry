import { describe, expect, it } from "vitest";
import { computeContractionStats } from "../contraction-engine";

describe("computeContractionStats", () => {
  it("computes duration from start to end", () => {
    const result = computeContractionStats([
      { id: "1", startedAt: "2026-08-08T10:00:00Z", endedAt: "2026-08-08T10:00:45Z", intensity: null },
    ]);
    expect(result[0].durationSeconds).toBe(45);
  });

  it("reports null duration for an ongoing contraction (no end time yet)", () => {
    const result = computeContractionStats([{ id: "1", startedAt: "2026-08-08T10:00:00Z", endedAt: null, intensity: null }]);
    expect(result[0].durationSeconds).toBeNull();
  });

  it("reports null interval for the first contraction in the list", () => {
    const result = computeContractionStats([{ id: "1", startedAt: "2026-08-08T10:00:00Z", endedAt: null, intensity: null }]);
    expect(result[0].intervalSinceLastSeconds).toBeNull();
  });

  it("computes interval since the previous contraction for subsequent entries", () => {
    const result = computeContractionStats([
      { id: "1", startedAt: "2026-08-08T10:00:00Z", endedAt: "2026-08-08T10:00:40Z", intensity: null },
      { id: "2", startedAt: "2026-08-08T10:05:00Z", endedAt: "2026-08-08T10:05:50Z", intensity: null },
    ]);
    expect(result[1].intervalSinceLastSeconds).toBe(300);
  });
});

import { describe, expect, it } from "vitest";
import { analyzeEnergyTrend, analyzeSleepTrend, analyzeSymptomFrequency } from "../patterns-engine";

const TODAY = "2026-08-15";

function daysAgo(n: number): string {
  const d = new Date("2026-08-15T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

describe("analyzeEnergyTrend", () => {
  it("reports higher energy this week when the difference is meaningful", () => {
    const entries = [
      { logDate: daysAgo(0), value: 4 },
      { logDate: daysAgo(1), value: 4 },
      { logDate: daysAgo(2), value: 4 },
      { logDate: daysAgo(7), value: 2 },
      { logDate: daysAgo(8), value: 2 },
      { logDate: daysAgo(9), value: 2 },
    ];
    const result = analyzeEnergyTrend(entries, TODAY);
    expect(result?.sentence).toMatch(/higher this week/i);
  });

  it("reports lower energy this week when the difference is meaningful and negative", () => {
    const entries = [
      { logDate: daysAgo(0), value: 1 },
      { logDate: daysAgo(1), value: 1 },
      { logDate: daysAgo(2), value: 1 },
      { logDate: daysAgo(7), value: 4 },
      { logDate: daysAgo(8), value: 4 },
      { logDate: daysAgo(9), value: 4 },
    ];
    const result = analyzeEnergyTrend(entries, TODAY);
    expect(result?.sentence).toMatch(/lower this week/i);
  });

  it("returns null when there isn't enough data in one of the two windows", () => {
    const entries = [
      { logDate: daysAgo(0), value: 4 },
      { logDate: daysAgo(7), value: 2 },
    ];
    expect(analyzeEnergyTrend(entries, TODAY)).toBeNull();
  });

  it("returns null when the difference is too small to be meaningful", () => {
    const entries = [
      { logDate: daysAgo(0), value: 3 },
      { logDate: daysAgo(1), value: 3 },
      { logDate: daysAgo(2), value: 3 },
      { logDate: daysAgo(7), value: 3.1 },
      { logDate: daysAgo(8), value: 3.1 },
      { logDate: daysAgo(9), value: 3.1 },
    ];
    expect(analyzeEnergyTrend(entries, TODAY)).toBeNull();
  });
});

describe("analyzeSleepTrend", () => {
  it("uses 'sleep' in its sentence, not 'energy'", () => {
    const entries = [
      { logDate: daysAgo(0), value: 5 },
      { logDate: daysAgo(1), value: 5 },
      { logDate: daysAgo(2), value: 5 },
      { logDate: daysAgo(7), value: 2 },
      { logDate: daysAgo(8), value: 2 },
      { logDate: daysAgo(9), value: 2 },
    ];
    const result = analyzeSleepTrend(entries, TODAY);
    expect(result?.sentence).toMatch(/sleep/i);
    expect(result?.sentence).not.toMatch(/energy/i);
  });
});

describe("analyzeSymptomFrequency", () => {
  const labels = { heartburn: "Heartburn", nausea: "Nausea" } as Record<string, string>;

  it("reports a symptom logged at least twice within the window", () => {
    const logs = [
      { logDate: daysAgo(1), symptomKey: "heartburn" as const },
      { logDate: daysAgo(3), symptomKey: "heartburn" as const },
    ];
    const result = analyzeSymptomFrequency(logs, TODAY, 14, labels as never);
    expect(result).toHaveLength(1);
    expect(result[0].sentence).toBe("You've noticed heartburn coming up on 2 of your last 14 days.");
  });

  it("never claims a diagnosis in the sentence", () => {
    const logs = [
      { logDate: daysAgo(1), symptomKey: "heartburn" as const },
      { logDate: daysAgo(3), symptomKey: "heartburn" as const },
      { logDate: daysAgo(5), symptomKey: "heartburn" as const },
    ];
    const result = analyzeSymptomFrequency(logs, TODAY, 14, labels as never);
    expect(result[0].sentence).not.toMatch(/you have|diagnos|this means/i);
    expect(result[0].sentence).toMatch(/^You've noticed/);
  });

  it("excludes a symptom logged only once", () => {
    const logs = [{ logDate: daysAgo(1), symptomKey: "nausea" as const }];
    const result = analyzeSymptomFrequency(logs, TODAY, 14, labels as never);
    expect(result).toEqual([]);
  });

  it("ignores occurrences outside the requested window", () => {
    const logs = [
      { logDate: daysAgo(1), symptomKey: "heartburn" as const },
      { logDate: daysAgo(20), symptomKey: "heartburn" as const },
    ];
    const result = analyzeSymptomFrequency(logs, TODAY, 14, labels as never);
    expect(result).toEqual([]);
  });

  it("sorts the most frequent symptom first", () => {
    const logs = [
      { logDate: daysAgo(1), symptomKey: "nausea" as const },
      { logDate: daysAgo(2), symptomKey: "nausea" as const },
      { logDate: daysAgo(3), symptomKey: "heartburn" as const },
      { logDate: daysAgo(4), symptomKey: "heartburn" as const },
      { logDate: daysAgo(5), symptomKey: "heartburn" as const },
    ];
    const result = analyzeSymptomFrequency(logs, TODAY, 14, labels as never);
    expect(result[0].key).toBe("symptom_heartburn");
  });
});

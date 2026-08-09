import { describe, expect, it } from "vitest";
import { CYCLE_DISCLAIMERS, PHASE_LABELS } from "@/lib/cycle-engine";
import { generateDailyBodyInsight } from "../generate";
import { SECTION_ORDER } from "../sections";

describe("generateDailyBodyInsight", () => {
  it("returns all 13 sections in the documented order", () => {
    const result = generateDailyBodyInsight({
      date: "2026-03-15",
      cycleDay: 18,
      phase: "luteal",
    });

    expect(result.sections.map((s) => s.key)).toEqual(SECTION_ORDER);
    expect(result.sections).toHaveLength(13);
  });

  it("carries through the date, cycle day, and phase label", () => {
    const result = generateDailyBodyInsight({
      date: "2026-03-15",
      cycleDay: 18,
      phase: "luteal",
    });

    expect(result.date).toBe("2026-03-15");
    expect(result.cycleDay).toBe(18);
    expect(result.phase).toBe("luteal");
    expect(result.phaseLabel).toBe(PHASE_LABELS.luteal);
    expect(result.phaseLabel).toBe("Estimated luteal phase");
  });

  it("attaches the shared disclaimer text unmodified", () => {
    const result = generateDailyBodyInsight({ date: "2026-03-15", cycleDay: 1, phase: "menstrual" });
    expect(result.disclaimers).toEqual(CYCLE_DISCLAIMERS);
  });

  it("pulls phase-appropriate copy for each section", () => {
    const menstrual = generateDailyBodyInsight({ date: "2026-03-01", cycleDay: 1, phase: "menstrual" });
    const luteal = generateDailyBodyInsight({ date: "2026-03-01", cycleDay: 25, phase: "luteal" });

    const menstrualEnergy = menstrual.sections.find((s) => s.key === "energy");
    const lutealEnergy = luteal.sections.find((s) => s.key === "energy");
    expect(menstrualEnergy?.summary).not.toBe(lutealEnergy?.summary);
  });

  describe("symptom personalization", () => {
    it("adds a personalized note when a reported symptom overlaps this phase's related symptoms", () => {
      const result = generateDailyBodyInsight({
        date: "2026-03-15",
        cycleDay: 25,
        phase: "luteal",
        commonSymptomKeys: ["bloating", "insomnia"],
      });
      const section = result.sections.find((s) => s.key === "symptoms_to_monitor");
      const personalizedPoint = section?.points.find((p) => p.startsWith("You mentioned"));
      expect(personalizedPoint).toBeDefined();
      expect(personalizedPoint).toContain("bloating");
      expect(personalizedPoint).toContain("trouble sleeping"); // insomnia -> humanized label
    });

    it("adds no personalized note when there's no overlap", () => {
      const result = generateDailyBodyInsight({
        date: "2026-03-15",
        cycleDay: 25,
        phase: "luteal",
        commonSymptomKeys: ["hot_flashes"], // not in luteal's relatedSymptomKeys
      });
      const section = result.sections.find((s) => s.key === "symptoms_to_monitor");
      expect(section?.points.some((p) => p.startsWith("You mentioned"))).toBe(false);
    });

    it("adds no personalized note when no symptoms were reported at all", () => {
      const result = generateDailyBodyInsight({ date: "2026-03-15", cycleDay: 25, phase: "luteal" });
      const section = result.sections.find((s) => s.key === "symptoms_to_monitor");
      expect(section?.points.some((p) => p.startsWith("You mentioned"))).toBe(false);
    });

    it("joins three or more overlapping symptoms in natural English", () => {
      const result = generateDailyBodyInsight({
        date: "2026-03-15",
        cycleDay: 25,
        phase: "luteal",
        commonSymptomKeys: ["bloating", "acne", "fatigue"],
      });
      const section = result.sections.find((s) => s.key === "symptoms_to_monitor");
      const personalizedPoint = section?.points.find((p) => p.startsWith("You mentioned"));
      expect(personalizedPoint).toMatch(/bloating, acne, and fatigue/);
    });

    it("only ever personalizes the symptoms_to_monitor section", () => {
      const result = generateDailyBodyInsight({
        date: "2026-03-15",
        cycleDay: 25,
        phase: "luteal",
        commonSymptomKeys: ["bloating", "acne", "fatigue", "insomnia", "mood_swings"],
      });
      for (const section of result.sections) {
        if (section.key !== "symptoms_to_monitor") {
          expect(section.points.some((p) => p.startsWith("You mentioned"))).toBe(false);
        }
      }
    });
  });

  describe("feedback state", () => {
    it("surfaces today's already-saved response per section", () => {
      const result = generateDailyBodyInsight({
        date: "2026-03-15",
        cycleDay: 25,
        phase: "luteal",
        existingFeedback: { mood: "yes", sleep: "a_little" },
      });
      expect(result.sections.find((s) => s.key === "mood")?.existingResponse).toBe("yes");
      expect(result.sections.find((s) => s.key === "sleep")?.existingResponse).toBe("a_little");
      expect(result.sections.find((s) => s.key === "energy")?.existingResponse).toBeNull();
    });

    it("flags sections the user has previously agreed with during this phase", () => {
      const result = generateDailyBodyInsight({
        date: "2026-03-15",
        cycleDay: 25,
        phase: "luteal",
        priorPhaseAgreementSections: ["mood", "skin"],
      });
      expect(result.sections.find((s) => s.key === "mood")?.previouslyResonated).toBe(true);
      expect(result.sections.find((s) => s.key === "skin")?.previouslyResonated).toBe(true);
      expect(result.sections.find((s) => s.key === "energy")?.previouslyResonated).toBe(false);
    });
  });
});

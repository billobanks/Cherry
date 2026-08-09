import { describe, expect, it } from "vitest";
import type { CyclePhase } from "@/lib/cycle-engine";
import { PHASE_SECTION_CONTENT } from "../content";
import { SECTION_ORDER } from "../sections";

const PHASES: CyclePhase[] = ["menstrual", "follicular", "ovulation_window", "luteal"];

/**
 * Patterns that turn an educational hedge into a diagnostic-sounding claim.
 * This is the regression test for the app's hardest compliance requirement:
 * the copy must never assert a symptom as certain or diagnose anything.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /you definitely (have|are|experience|feel)/i,
  /this (symptom|feeling|change) means/i,
  /you (have|are) definitely/i,
  /you will (experience|have|feel|notice)/i,
  /this (proves|confirms|diagnoses|indicates you have)/i,
  /you must have/i,
  /you are (pregnant|ovulating|infertile)\b/i,
  /diagnos(e|is|ed|ing)/i,
];

function allContentStrings(): { path: string; text: string }[] {
  const entries: { path: string; text: string }[] = [];
  for (const phase of PHASES) {
    for (const section of SECTION_ORDER) {
      const copy = PHASE_SECTION_CONTENT[phase][section];
      entries.push({ path: `${phase}.${section}.summary`, text: copy.summary });
      copy.points.forEach((point, i) => {
        entries.push({ path: `${phase}.${section}.points[${i}]`, text: point });
      });
    }
  }
  return entries;
}

describe("PHASE_SECTION_CONTENT — coverage", () => {
  it("has content for all 4 phases and all 13 sections, with no gaps", () => {
    for (const phase of PHASES) {
      expect(Object.keys(PHASE_SECTION_CONTENT[phase]).sort()).toEqual([...SECTION_ORDER].sort());
      for (const section of SECTION_ORDER) {
        const copy = PHASE_SECTION_CONTENT[phase][section];
        expect(copy.summary.length).toBeGreaterThan(20);
        expect(copy.points.length).toBeGreaterThanOrEqual(2);
        for (const point of copy.points) {
          expect(point.length).toBeGreaterThan(10);
        }
      }
    }
  });

  it("only symptoms_to_monitor carries relatedSymptomKeys", () => {
    for (const phase of PHASES) {
      for (const section of SECTION_ORDER) {
        const copy = PHASE_SECTION_CONTENT[phase][section];
        if (section === "symptoms_to_monitor") {
          expect(copy.relatedSymptomKeys?.length).toBeGreaterThan(0);
        } else {
          expect(copy.relatedSymptomKeys).toBeUndefined();
        }
      }
    }
  });
});

describe("PHASE_SECTION_CONTENT — no deterministic or diagnostic language", () => {
  const strings = allContentStrings();

  it.each(strings.map((s): [string, string] => [s.path, s.text]))(
    "%s does not contain a forbidden deterministic phrase",
    (_path, text) => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(text).not.toMatch(pattern);
      }
    },
  );

  it("never claims the app is or can be used as contraception", () => {
    for (const { text } of strings) {
      expect(text.toLowerCase()).not.toContain("contracept");
    }
  });
});

describe("PHASE_SECTION_CONTENT — professional_guidance", () => {
  it("consistently points to a licensed professional, not a diagnosis", () => {
    for (const phase of PHASES) {
      const copy = PHASE_SECTION_CONTENT[phase].professional_guidance;
      const combined = [copy.summary, ...copy.points].join(" ").toLowerCase();
      expect(combined).not.toMatch(/you have/i);
    }
  });
});

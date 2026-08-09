import { describe, expect, it } from "vitest";
import type { CyclePhase } from "@/lib/cycle-engine";
import { PHASE_NUTRITION_CONTENT } from "../content";
import { FOOD_DATABASE, NUTRIENT_CATEGORY_ORDER } from "../foods";

const PHASES: CyclePhase[] = ["menstrual", "follicular", "ovulation_window", "luteal"];

/**
 * The task's two hard rules: never prescribe a supplement, and never claim a
 * food treats/cures/prevents a medical condition. This scans every string in
 * the content module against both.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /supplement/i,
  /\bdos(e|age|ing)\b/i,
  /\bmg\b/i,
  /\bmilligram/i,
  /\bpill(s)?\b/i,
  /\bcapsule/i,
  /\btablet/i,
  /\btreats?\b/i,
  /\bcures?\b/i,
  /\bprevents?\b/i,
  /\bdiagnos(e|is|ed|ing)/i,
];

function collectAllStrings(): { path: string; text: string }[] {
  const entries: { path: string; text: string }[] = [];

  for (const category of NUTRIENT_CATEGORY_ORDER) {
    for (const food of FOOD_DATABASE[category]) {
      entries.push({ path: `foods.${category}.${food.name}`, text: food.name });
    }
  }

  for (const phase of PHASES) {
    const copy = PHASE_NUTRITION_CONTENT[phase];
    entries.push({ path: `${phase}.intro`, text: copy.intro });
    entries.push({ path: `${phase}.whyHelpful`, text: copy.whyHelpful });
    entries.push({ path: `${phase}.hydration.guidance`, text: copy.hydration.guidance });
    entries.push({ path: `${phase}.hydration.tip`, text: copy.hydration.tip });
    for (const [category, text] of Object.entries(copy.categoryGuidance)) {
      entries.push({ path: `${phase}.categoryGuidance.${category}`, text });
    }
    copy.meals.forEach((meal, i) => {
      entries.push({ path: `${phase}.meals[${i}].title`, text: meal.title });
      entries.push({ path: `${phase}.meals[${i}].description`, text: meal.description });
    });
  }

  return entries;
}

describe("nutrition content — no supplement or medical-claim language", () => {
  const strings = collectAllStrings();

  it.each(strings.map((s): [string, string] => [s.path, s.text]))(
    "%s does not contain forbidden language",
    (_path, text) => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(text).not.toMatch(pattern);
      }
    },
  );
});

describe("nutrition content — coverage", () => {
  it("has every nutrient category populated for every phase", () => {
    for (const phase of PHASES) {
      const copy = PHASE_NUTRITION_CONTENT[phase];
      for (const category of NUTRIENT_CATEGORY_ORDER) {
        expect(copy.categoryGuidance[category].length).toBeGreaterThan(10);
      }
    }
  });

  it("has at least one vegan meal idea per phase, so vegan users always see something", () => {
    for (const phase of PHASES) {
      const meals = PHASE_NUTRITION_CONTENT[phase].meals;
      expect(meals.some((m) => m.dietClass === "vegan")).toBe(true);
    }
  });

  it("every food category has at least one vegan-compatible food", () => {
    for (const category of NUTRIENT_CATEGORY_ORDER) {
      expect(FOOD_DATABASE[category].some((f) => f.dietClass === "vegan")).toBe(true);
    }
  });
});

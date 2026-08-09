import { describe, expect, it } from "vitest";
import {
  filterFoods,
  filterMeals,
  isDietCompatible,
  isFoodAllowed,
  isMealAllowed,
  matchesAvoidance,
} from "../filter";
import type { FoodItem, MealIdea } from "../types";

describe("isDietCompatible", () => {
  it("a vegan food fits every preference", () => {
    expect(isDietCompatible("vegan", "vegan")).toBe(true);
    expect(isDietCompatible("vegan", "vegetarian")).toBe(true);
    expect(isDietCompatible("vegan", "pescatarian")).toBe(true);
    expect(isDietCompatible("vegan", "none")).toBe(true);
  });

  it("a vegetarian food does not fit a vegan preference", () => {
    expect(isDietCompatible("vegetarian", "vegan")).toBe(false);
    expect(isDietCompatible("vegetarian", "vegetarian")).toBe(true);
    expect(isDietCompatible("vegetarian", "pescatarian")).toBe(true);
    expect(isDietCompatible("vegetarian", "none")).toBe(true);
  });

  it("a pescatarian food only fits pescatarian or no-restriction", () => {
    expect(isDietCompatible("pescatarian", "vegan")).toBe(false);
    expect(isDietCompatible("pescatarian", "vegetarian")).toBe(false);
    expect(isDietCompatible("pescatarian", "pescatarian")).toBe(true);
    expect(isDietCompatible("pescatarian", "none")).toBe(true);
  });

  it("an omnivore food only fits no restrictions", () => {
    expect(isDietCompatible("omnivore", "vegan")).toBe(false);
    expect(isDietCompatible("omnivore", "vegetarian")).toBe(false);
    expect(isDietCompatible("omnivore", "pescatarian")).toBe(false);
    expect(isDietCompatible("omnivore", "none")).toBe(true);
  });
});

describe("matchesAvoidance", () => {
  it("matches an exact term case-insensitively", () => {
    expect(matchesAvoidance(["Peanuts"], ["peanuts"])).toBe(true);
    expect(matchesAvoidance(["Peanuts"], ["PEANUTS"])).toBe(true);
  });

  it("matches a plural/singular variant either direction", () => {
    expect(matchesAvoidance(["Almonds"], ["almond"])).toBe(true);
    expect(matchesAvoidance(["almond"], ["Almonds"])).toBe(true);
  });

  it("matches a substring within a longer search term", () => {
    expect(matchesAvoidance(["peanuts", "legumes"], ["nut"])).toBe(true);
  });

  it("does not match unrelated terms", () => {
    expect(matchesAvoidance(["Spinach", "leafy greens"], ["shellfish"])).toBe(false);
  });

  it("never matches with an empty avoid list", () => {
    expect(matchesAvoidance(["Spinach"], [])).toBe(false);
  });

  it("ignores blank/whitespace-only avoid entries", () => {
    expect(matchesAvoidance(["Spinach"], ["  ", ""])).toBe(false);
  });

  it("leans toward over-excluding on compound-word overlap — the safer failure mode for allergies", () => {
    // "shellfish" contains "fish" as a substring, so an avoidance of "shellfish"
    // also filters out plain fish like salmon. A false-positive exclusion here
    // is far safer than a false negative that lets an allergen through.
    expect(matchesAvoidance(["fish"], ["shellfish"])).toBe(true);
  });
});

describe("isFoodAllowed / filterFoods", () => {
  const foods: FoodItem[] = [
    { name: "Almonds", dietClass: "vegan", keywords: ["nuts"] },
    { name: "Salmon", dietClass: "pescatarian", keywords: ["fish"] },
    { name: "Chicken breast", dietClass: "omnivore", keywords: ["poultry", "meat"] },
  ];

  it("filters out foods that don't fit the diet, independent of avoidance", () => {
    expect(filterFoods(foods, "vegan", [])).toEqual([foods[0]]);
    expect(filterFoods(foods, "pescatarian", [])).toEqual([foods[0], foods[1]]);
    expect(filterFoods(foods, "none", [])).toEqual(foods);
  });

  it("filters out foods matching an allergy even when diet-compatible", () => {
    expect(isFoodAllowed(foods[0], "vegan", ["nuts"])).toBe(false);
    expect(filterFoods(foods, "none", ["nuts", "dairy"])).toEqual([foods[1], foods[2]]);
  });

  it("combines diet and avoidance filters", () => {
    // Salmon is pescatarian-compatible but avoided by name.
    expect(filterFoods(foods, "pescatarian", ["salmon"])).toEqual([foods[0]]);
  });
});

describe("isMealAllowed / filterMeals", () => {
  const meals: MealIdea[] = [
    { title: "Chickpea salad", description: "", dietClass: "vegan", keywords: ["chickpea"] },
    { title: "Salmon bowl", description: "", dietClass: "pescatarian", keywords: ["salmon", "fish"] },
  ];

  it("excludes a meal whose ingredients match an avoidance", () => {
    expect(isMealAllowed(meals[1], "none", ["fish"])).toBe(false);
    expect(filterMeals(meals, "none", ["fish"])).toEqual([meals[0]]);
  });

  it("excludes a meal that doesn't fit the diet", () => {
    expect(filterMeals(meals, "vegan", [])).toEqual([meals[0]]);
  });
});

import type { FoodItem, NutrientCategory } from "./types";

/**
 * A shared food database, not phase-specific — which foods are good sources
 * of iron or magnesium doesn't change with cycle phase. What changes per
 * phase (see content.ts) is the guidance text, the meal ideas, and how much
 * a category gets emphasized.
 */
export const FOOD_DATABASE: Record<NutrientCategory, FoodItem[]> = {
  protein: [
    { name: "Eggs", dietClass: "vegetarian", keywords: ["egg"] },
    { name: "Greek yogurt", dietClass: "vegetarian", keywords: ["yogurt", "dairy"] },
    { name: "Tofu", dietClass: "vegan", keywords: ["soy", "soybean"] },
    { name: "Lentils", dietClass: "vegan", keywords: ["legumes", "dal"] },
    { name: "Chickpeas", dietClass: "vegan", keywords: ["garbanzo", "legumes"] },
    { name: "Edamame", dietClass: "vegan", keywords: ["soybean", "soy"] },
    { name: "Salmon", dietClass: "pescatarian", keywords: ["fish", "seafood"] },
    { name: "Chicken breast", dietClass: "omnivore", keywords: ["poultry", "meat"] },
  ],
  fiber: [
    { name: "Oats", dietClass: "vegan", keywords: ["oatmeal", "porridge"] },
    { name: "Chia seeds", dietClass: "vegan", keywords: ["seeds"] },
    { name: "Raspberries", dietClass: "vegan", keywords: ["berries"] },
    { name: "Lentils", dietClass: "vegan", keywords: ["legumes", "dal"] },
    { name: "Broccoli", dietClass: "vegan", keywords: ["vegetable", "cruciferous"] },
    { name: "Pears", dietClass: "vegan", keywords: ["fruit"] },
    { name: "Black beans", dietClass: "vegan", keywords: ["beans", "legumes"] },
    { name: "Whole grain bread", dietClass: "vegan", keywords: ["bread", "wheat", "grain"] },
  ],
  iron: [
    { name: "Spinach", dietClass: "vegan", keywords: ["leafy greens"] },
    { name: "Lentils", dietClass: "vegan", keywords: ["legumes", "dal"] },
    { name: "Pumpkin seeds", dietClass: "vegan", keywords: ["seeds"] },
    { name: "Tofu", dietClass: "vegan", keywords: ["soy", "soybean"] },
    { name: "Quinoa", dietClass: "vegan", keywords: ["grain"] },
    { name: "Dark chocolate", dietClass: "vegan", keywords: ["cacao", "cocoa"] },
    { name: "Fortified cereal", dietClass: "vegan", keywords: ["cereal", "grain"] },
    { name: "Lean beef", dietClass: "omnivore", keywords: ["red meat", "meat"] },
  ],
  magnesium: [
    { name: "Almonds", dietClass: "vegan", keywords: ["nuts"] },
    { name: "Spinach", dietClass: "vegan", keywords: ["leafy greens"] },
    { name: "Pumpkin seeds", dietClass: "vegan", keywords: ["seeds"] },
    { name: "Dark chocolate", dietClass: "vegan", keywords: ["cacao", "cocoa"] },
    { name: "Avocado", dietClass: "vegan", keywords: [] },
    { name: "Black beans", dietClass: "vegan", keywords: ["beans", "legumes"] },
    { name: "Bananas", dietClass: "vegan", keywords: ["banana"] },
  ],
  carbohydrates: [
    { name: "Sweet potatoes", dietClass: "vegan", keywords: ["yam"] },
    { name: "Quinoa", dietClass: "vegan", keywords: ["grain"] },
    { name: "Brown rice", dietClass: "vegan", keywords: ["rice", "grain"] },
    { name: "Oats", dietClass: "vegan", keywords: ["oatmeal", "porridge"] },
    { name: "Whole grain bread", dietClass: "vegan", keywords: ["bread", "wheat", "grain"] },
    { name: "Bananas", dietClass: "vegan", keywords: ["banana"] },
    { name: "Berries", dietClass: "vegan", keywords: ["fruit"] },
  ],
};

export const NUTRIENT_CATEGORY_LABELS: Record<NutrientCategory, string> = {
  protein: "Protein",
  fiber: "Fiber",
  iron: "Iron-rich foods",
  magnesium: "Magnesium-containing foods",
  carbohydrates: "Balanced carbohydrates",
};

export const NUTRIENT_CATEGORY_ORDER: NutrientCategory[] = [
  "protein",
  "fiber",
  "iron",
  "magnesium",
  "carbohydrates",
];

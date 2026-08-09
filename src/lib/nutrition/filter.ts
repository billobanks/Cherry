import type { DietaryPreference, FoodDietClass, FoodItem, MealIdea } from "./types";

const DIET_CLASS_RANK: Record<FoodDietClass, number> = {
  vegan: 0,
  vegetarian: 1,
  pescatarian: 2,
  omnivore: 3,
};

const MAX_RANK_FOR_PREFERENCE: Record<DietaryPreference, number> = {
  vegan: 0,
  vegetarian: 1,
  pescatarian: 2,
  none: 3,
};

/** A vegan food fits every preference; an omnivore food only fits "no restrictions." */
export function isDietCompatible(foodClass: FoodDietClass, preference: DietaryPreference): boolean {
  return DIET_CLASS_RANK[foodClass] <= MAX_RANK_FOR_PREFERENCE[preference];
}

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

/** True if any avoid-term matches the food's name or keywords (substring either direction). */
export function matchesAvoidance(searchTerms: string[], avoidTerms: string[]): boolean {
  const normalizedAvoid = avoidTerms.map(normalizeTerm).filter(Boolean);
  if (normalizedAvoid.length === 0) return false;

  const normalizedSearch = searchTerms.map(normalizeTerm).filter(Boolean);
  return normalizedAvoid.some((avoid) =>
    normalizedSearch.some((term) => term.includes(avoid) || avoid.includes(term)),
  );
}

export function isFoodAllowed(
  food: FoodItem,
  preference: DietaryPreference,
  avoidTerms: string[],
): boolean {
  if (!isDietCompatible(food.dietClass, preference)) return false;
  return !matchesAvoidance([food.name, ...food.keywords], avoidTerms);
}

export function isMealAllowed(
  meal: MealIdea,
  preference: DietaryPreference,
  avoidTerms: string[],
): boolean {
  if (!isDietCompatible(meal.dietClass, preference)) return false;
  return !matchesAvoidance([meal.title, ...meal.keywords], avoidTerms);
}

export function filterFoods(
  foods: FoodItem[],
  preference: DietaryPreference,
  avoidTerms: string[],
): FoodItem[] {
  return foods.filter((food) => isFoodAllowed(food, preference, avoidTerms));
}

export function filterMeals(
  meals: MealIdea[],
  preference: DietaryPreference,
  avoidTerms: string[],
): MealIdea[] {
  return meals.filter((meal) => isMealAllowed(meal, preference, avoidTerms));
}

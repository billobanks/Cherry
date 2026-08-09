export {
  getNutritionData,
  updateNutritionPreferences,
  type GetNutritionDataResult,
} from "./actions";
export { PHASE_NUTRITION_CONTENT } from "./content";
export {
  filterFoods,
  filterMeals,
  isDietCompatible,
  isFoodAllowed,
  isMealAllowed,
  matchesAvoidance,
} from "./filter";
export { FOOD_DATABASE, NUTRIENT_CATEGORY_LABELS, NUTRIENT_CATEGORY_ORDER } from "./foods";
export type {
  DietaryPreference,
  FilteredFoodCategory,
  FoodDietClass,
  FoodItem,
  MealIdea,
  NutrientCategory,
  NutritionData,
  PhaseNutritionCopy,
} from "./types";

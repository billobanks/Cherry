import type { PregnancyDietaryPreference, Trimester } from "@/types/database";

export interface NutrientCategoryGuidance {
  label: string;
  general: string;
  /** Only present where plant-based guidance is meaningfully different. */
  planBasedNote?: string;
}

export const NUTRIENT_CATEGORIES: NutrientCategoryGuidance[] = [
  {
    label: "Protein",
    general: "Your body needs more protein during pregnancy than it used to. Eggs, poultry, fish (within food-safety guidance), beans, lentils, and dairy are all good places to get it.",
    planBasedNote: "On a vegetarian or vegan pattern, lentils, beans, tofu, tempeh, and quinoa are solid ways to meet that higher protein need.",
  },
  {
    label: "Iron-rich foods",
    general: "Iron needs climb during pregnancy, especially in the second and third trimesters. Red meat, poultry, and fortified cereals are good sources — pairing them with vitamin C helps your body absorb the iron.",
    planBasedNote: "Plant sources of iron include lentils, beans, tofu, and fortified cereals. Pairing them with something vitamin-C-rich, like citrus or peppers, helps your body take it in on a vegetarian or vegan pattern.",
  },
  {
    label: "Folate-containing foods",
    general: "Folate matters a lot early in pregnancy in particular. Leafy greens, citrus, beans, and fortified grains are good food sources, alongside your prenatal vitamin as directed by your provider.",
  },
  {
    label: "Calcium sources",
    general: "Calcium needs stay elevated throughout pregnancy. Dairy, fortified plant milks, tofu made with calcium sulfate, and leafy greens are all good sources to lean on.",
  },
  {
    label: "Fiber",
    general: "Whole grains, fruits, vegetables, and legumes are great fiber sources — and many people find fiber genuinely helps if constipation becomes an issue.",
  },
  {
    label: "Healthy fats",
    general: "Avocado, nuts, seeds, olive oil, and fatty fish (within food-safety guidance) are all worth including as part of a balanced pattern during pregnancy.",
  },
];

export const HYDRATION_GUIDANCE =
  "You'll likely find yourself thirstier than usual as your blood volume expands during pregnancy. Water is the simplest choice — keeping a bottle within reach through the day can help it become a habit.";

export const FOOD_SAFETY_GUIDANCE = [
  "Cook meat, poultry, and eggs all the way through.",
  "Skip unpasteurized dairy and juices.",
  "Give produce a thorough wash to cut down on foodborne illness risk.",
  "Some fish are worth limiting because of mercury — your provider or a resource like the FDA's fish guidance can help you figure out what fits.",
];

export const FOODS_TO_LIMIT_OR_AVOID = [
  "High-mercury fish (worth limiting)",
  "Unpasteurized dairy and juices (worth avoiding)",
  "Raw or undercooked meat, poultry, eggs, and seafood (worth avoiding)",
  "Deli meats and smoked seafood, unless heated until steaming (worth limiting)",
  "Alcohol (worth avoiding — bring any questions to your provider)",
  "A lot of caffeine (worth limiting — many providers suggest keeping it moderate)",
];

export const NAUSEA_FOOD_TIPS = [
  "Small, frequent meals tend to sit better than a few big ones.",
  "Bland, room-temperature foods like crackers or toast are often easier to manage.",
  "Ginger, whether in food or tea, is something a lot of people find genuinely helpful.",
  "Sipping fluids slowly through the day usually goes down easier than drinking a lot at once.",
];

export const CONSTIPATION_FOOD_TIPS = [
  "Fruits, vegetables, whole grains, and legumes bring more fiber into your day.",
  "Staying well hydrated makes a real difference alongside more fiber.",
  "Gentle movement, as approved by your provider, often helps alongside these dietary changes.",
];

interface TrimesterNutritionCopy {
  intro: string;
  thisTrimester: string;
  mealIdeas: string[];
  snacks: string[];
}

export const TRIMESTER_NUTRITION: Record<Trimester, TrimesterNutritionCopy> = {
  first: {
    intro: "Nausea can make eating feel like a challenge early on — small, frequent, simple meals are usually easier to manage than three big ones.",
    thisTrimester: "Folate matters a lot right now, alongside your prenatal vitamin as directed by your provider. And if your appetite feels unpredictable this trimester, that's genuinely normal.",
    mealIdeas: ["Toast with peanut butter and banana", "Scrambled eggs with toast", "Plain yogurt with berries", "Crackers with cheese"],
    snacks: ["Dry cereal", "Saltine crackers", "Applesauce", "Ginger tea"],
  },
  second: {
    intro: "Many people find their appetite comes back in the second trimester, which opens the door to more varied, balanced meals.",
    thisTrimester: "Iron and calcium needs climb now. A balanced plate with protein, whole grains, and vegetables is a solid general pattern to aim for.",
    mealIdeas: ["Grilled chicken or tofu with quinoa and roasted vegetables", "Lentil soup with whole-grain bread", "Salmon (within food-safety guidance) with sweet potato and greens"],
    snacks: ["Greek yogurt with granola", "Hummus with vegetables", "A handful of nuts and dried fruit"],
  },
  third: {
    intro: "As your growing size leaves less room for big meals, smaller and more frequent ones tend to feel better.",
    thisTrimester: "Keep leaning on a balanced pattern with attention to iron, calcium, and fiber. Heartburn is common at this point — smaller meals and staying upright after eating both tend to help.",
    mealIdeas: ["Oatmeal with fruit and nuts", "Turkey and avocado wrap with a side salad", "Stir-fried vegetables with tofu or chicken and rice"],
    snacks: ["Cottage cheese with fruit", "Whole-grain crackers with nut butter", "A small smoothie"],
  },
};

export function dietaryPreferenceIsPlantBased(preferences: PregnancyDietaryPreference[]): boolean {
  return preferences.includes("vegan") || preferences.includes("vegetarian");
}

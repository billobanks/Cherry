import type { CyclePhase } from "@/lib/cycle-engine";
import type { PhaseNutritionCopy } from "./types";

/**
 * General wellness food ideas, not a diet plan. Every line here is careful
 * to stay in "some people find / may help / is commonly suggested" territory
 * — never a claim that a food treats, cures, or prevents anything, and never
 * a supplement or dosage recommendation. See __tests__/content.test.ts for
 * the automated scan that enforces this.
 */
export const PHASE_NUTRITION_CONTENT: Record<CyclePhase, PhaseNutritionCopy> = {
  menstrual: {
    intro:
      "Your body is doing real physical work today. Here are some general food ideas that may feel supportive during your period.",
    whyHelpful:
      "Since you're losing some blood during your period, food choices that include iron and steady hydration are commonly suggested, alongside comforting, easy-to-digest meals. None of this is a fix for anything — it's general wellness thinking some people find useful.",
    hydration: {
      guidance:
        "Staying hydrated is a reasonable habit any day, and some people notice it helps a little with bloating or fatigue during their period.",
      tip: "Warm water or herbal tea can feel especially soothing right now.",
    },
    categoryGuidance: {
      protein: "Protein-rich foods can help you feel steadier if your energy dips today.",
      fiber: "Fiber supports regular digestion, which can be helpful if bloating shows up during your period.",
      iron: "Since you're losing blood, some people find it worth leaning on iron-rich foods a little more than usual right now.",
      magnesium: "Magnesium-containing foods are sometimes mentioned alongside cramping, though everyone's experience is different.",
      carbohydrates: "Balanced carbohydrates can offer steady energy if today feels like a lower-energy day.",
    },
    meals: [
      {
        title: "Warm lentil and spinach soup",
        description: "A cozy, iron-leaning bowl that's easy to make in one pot.",
        dietClass: "vegan",
        keywords: ["lentil", "spinach"],
      },
      {
        title: "Greek yogurt with berries and pumpkin seeds",
        description: "A quick combination of protein, iron, and magnesium.",
        dietClass: "vegetarian",
        keywords: ["yogurt", "berries", "pumpkin seeds"],
      },
      {
        title: "Salmon with quinoa and roasted broccoli",
        description: "A simple, balanced plate with protein, iron, and fiber.",
        dietClass: "pescatarian",
        keywords: ["salmon", "quinoa", "broccoli"],
      },
    ],
  },

  follicular: {
    intro:
      "As your period wraps up, energy often starts to build. Here are some general food ideas for today.",
    whyHelpful:
      "This phase is often described as a good stretch for balanced, energizing meals as activity levels may pick back up. None of this is required — just general ideas some people find fit well right now.",
    hydration: {
      guidance:
        "Regular hydration continues to matter here, especially if you're feeling more active than during your period.",
      tip: "Carrying a water bottle can make it easier to sip throughout the day.",
    },
    categoryGuidance: {
      protein: "Protein can help support whatever activity or momentum you're building this week.",
      fiber: "Fiber-rich foods are a reasonable everyday habit that fits well in this phase.",
      iron: "Continuing to include iron sources can help rebuild what was used during your period.",
      magnesium: "Magnesium-containing foods are a normal part of balanced eating, even outside the phases where they get more attention.",
      carbohydrates: "Balanced carbohydrates can fuel higher energy or activity levels some people notice right now.",
    },
    meals: [
      {
        title: "Chickpea and quinoa salad with lemon",
        description: "A bright, fiber-and-protein-rich bowl that keeps well for later.",
        dietClass: "vegan",
        keywords: ["chickpea", "quinoa"],
      },
      {
        title: "Veggie stir-fry with tofu and brown rice",
        description: "An easy way to combine protein, fiber, and balanced carbohydrates.",
        dietClass: "vegan",
        keywords: ["tofu", "stir-fry", "rice"],
      },
      {
        title: "Grilled chicken with sweet potato and greens",
        description: "A straightforward, protein-forward plate.",
        dietClass: "omnivore",
        keywords: ["chicken", "sweet potato"],
      },
    ],
  },

  ovulation_window: {
    intro:
      "Around your estimated ovulation window, some people notice a bit more energy. Here are some general food ideas for today.",
    whyHelpful:
      "This is often one of the more energetic stretches of the cycle for people who notice a pattern at all. General, balanced eating continues to apply here — there's no special ovulation diet needed.",
    hydration: {
      guidance:
        "Hydration needs don't dramatically change here, but it's worth keeping up the habit, especially with any extra activity.",
      tip: "A glass of water alongside meals is a simple way to stay on track.",
    },
    categoryGuidance: {
      protein: "Protein continues to support steady energy through this window.",
      fiber: "Fiber remains a helpful everyday habit for digestion.",
      iron: "Iron needs are typically lower right now than during your period, but including it as part of balanced eating is still reasonable.",
      magnesium: "Magnesium-containing foods are a normal part of a varied diet at any point in the cycle.",
      carbohydrates: "Balanced carbohydrates can support whatever activity level feels good today.",
    },
    meals: [
      {
        title: "Edamame and avocado grain bowl",
        description: "A simple bowl combining plant protein, fiber, and healthy fats.",
        dietClass: "vegan",
        keywords: ["edamame", "avocado"],
      },
      {
        title: "Egg and avocado toast on whole grain bread",
        description: "A quick, balanced option for a lower-effort day.",
        dietClass: "vegetarian",
        keywords: ["egg", "avocado", "toast"],
      },
      {
        title: "Salmon salad with mixed greens and chickpeas",
        description: "A protein-and-fiber-rich plate that's easy to prep ahead.",
        dietClass: "pescatarian",
        keywords: ["salmon", "chickpeas"],
      },
    ],
  },

  luteal: {
    intro:
      "In the lead-up to your next period, some people notice cravings or a dip in energy. Here are some general food ideas for today.",
    whyHelpful:
      "Cravings and appetite changes are commonly reported in this phase, and there's nothing wrong with honoring them in moderation. Some people find that leaning on magnesium-containing foods, fiber, and balanced carbohydrates feels more comfortable than restriction right now — this is general wellness thinking, not a treatment for anything.",
    hydration: {
      guidance: "Staying hydrated may help with the bloating some people notice in the days before their period.",
      tip: "Pairing steady water intake with less very salty food is a common, optional habit some people try.",
    },
    categoryGuidance: {
      protein: "Pairing protein with carbohydrates can help balance out stronger cravings for some people.",
      fiber: "Fiber-rich foods may help with the digestive changes some people notice before their period.",
      iron: "Iron needs haven't increased yet at this point in the cycle, but it's still a normal part of balanced eating.",
      magnesium: "Magnesium-containing foods are frequently mentioned around this phase — a dark chocolate craving has a real food source behind it.",
      carbohydrates: "Balanced carbohydrates, rather than restriction, are commonly suggested if cravings feel stronger than usual right now.",
    },
    meals: [
      {
        title: "Black bean and sweet potato chili",
        description: "A warming, fiber-and-magnesium-rich bowl for a cozy night.",
        dietClass: "vegan",
        keywords: ["black bean", "sweet potato", "chili"],
      },
      {
        title: "Oatmeal with banana, almond butter, and dark chocolate",
        description: "A craving-friendly breakfast with fiber and magnesium built in.",
        dietClass: "vegan",
        keywords: ["oatmeal", "banana", "almond", "chocolate"],
      },
      {
        title: "Baked salmon with brown rice and steamed spinach",
        description: "A balanced, comforting plate with protein, iron, and magnesium.",
        dietClass: "pescatarian",
        keywords: ["salmon", "rice", "spinach"],
      },
    ],
  },
};

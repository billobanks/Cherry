import type { PlanDefinition } from "./types";

export const FREE_PLAN: PlanDefinition = {
  key: "free",
  name: "Free",
  priceLabel: "$0",
  tagline: "Everything you need to start understanding your cycle.",
  features: [
    "Period tracking",
    "Basic calendar",
    "Basic cycle prediction",
    "Symptom logging",
    "Limited daily insights",
  ],
};

export const PREMIUM_PLAN: PlanDefinition = {
  key: "premium",
  name: "Premium",
  priceLabel: "$7.99/month",
  tagline: "Deeper, personalized insight into your body and patterns.",
  features: [
    "Detailed daily body insights",
    "Personalized pattern recognition",
    "Advanced cycle reports",
    "Nutrition guidance",
    "Exercise guidance",
    "AI wellness assistant",
    "Historical trend analysis",
    "Unlimited educational content",
  ],
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [FREE_PLAN, PREMIUM_PLAN];

/**
 * Which app feature areas require Premium. Keys are used consistently by
 * server-side guards (`@/lib/subscription/guard`) and the upgrade-prompt UI —
 * one place to look up "does X need Premium," rather than a scattered
 * per-feature boolean.
 */
export const PREMIUM_FEATURE_KEYS = {
  nutrition: "nutrition guidance",
  movement: "exercise guidance",
  patterns: "personalized pattern recognition and historical trend analysis",
  assistant: "the AI wellness assistant",
} as const;

export type PremiumFeatureKey = keyof typeof PREMIUM_FEATURE_KEYS;

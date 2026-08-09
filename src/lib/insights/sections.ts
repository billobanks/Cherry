import type { InsightSectionKey } from "@/types/database";

export const SECTION_ORDER: InsightSectionKey[] = [
  "body_overview",
  "hormonal_changes",
  "energy",
  "mood",
  "skin",
  "digestion",
  "appetite_and_cravings",
  "sleep",
  "exercise",
  "nutrition",
  "self_care",
  "symptoms_to_monitor",
  "professional_guidance",
];

export const SECTION_TITLES: Record<InsightSectionKey, string> = {
  body_overview: "What may be happening in your body",
  hormonal_changes: "Hormonal changes",
  energy: "Energy",
  mood: "Mood",
  skin: "Skin",
  digestion: "Digestion",
  appetite_and_cravings: "Appetite and cravings",
  sleep: "Sleep",
  exercise: "Exercise",
  nutrition: "Nutrition",
  self_care: "Self-care",
  symptoms_to_monitor: "Symptoms to monitor",
  professional_guidance: "When to consider speaking with a healthcare professional",
};

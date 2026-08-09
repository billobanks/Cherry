import type { CyclePhase } from "./types";

/**
 * Display labels for UI use. Every one is prefixed "Estimated" — none of
 * this is ever presented as a certainty, ovulation least of all.
 */
export const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: "Estimated menstrual phase",
  follicular: "Estimated follicular phase",
  ovulation_window: "Estimated ovulation window",
  luteal: "Estimated luteal phase",
};

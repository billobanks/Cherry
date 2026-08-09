import type { CyclePhase } from "@/lib/cycle-engine";

/**
 * Shared phase -> color mapping for anything that visualizes cycle phases
 * (the dashboard's CycleRing, the calendar's day cells). Reuses the design
 * system's existing chart-1..4 tokens rather than introducing new ones.
 */
export const PHASE_COLOR_VAR: Record<CyclePhase, string> = {
  menstrual: "var(--chart-1)",
  follicular: "var(--chart-3)",
  ovulation_window: "var(--chart-4)",
  luteal: "var(--chart-2)",
};

import type { CycleDisclaimers } from "./types";

/**
 * Centralized so the exact required wording ("estimated ovulation window",
 * the not-contraception statement) is defined once and shared by every
 * caller — the engine, the dashboard, onboarding's summary, etc. — instead
 * of being retyped (and potentially drifting) at each call site.
 */
export const CYCLE_DISCLAIMERS: CycleDisclaimers = {
  general:
    "These are general wellness estimates based on the dates you've logged, not a medical prediction. Your actual cycle can vary.",
  ovulation:
    "This is an estimated ovulation window, not a confirmed ovulation date. Actual ovulation timing varies and can't be determined from cycle dates alone.",
  notContraception:
    "Cherry's estimates should never be used as contraception or as a way to avoid or achieve pregnancy. If you need reliable fertility or contraceptive guidance, talk to a licensed healthcare professional.",
};

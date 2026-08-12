import { ONBOARDING_STEPS, type OnboardingStepId } from "@/types/onboarding";

/** The 5 routed onboarding screens — each hosts one or more of the wizard's underlying question steps in sequence. */
export const ANSWER_STEP_SLUGS = ["goals", "last-period", "cycle", "symptoms", "preferences"] as const;
export type AnswerStepSlug = (typeof ANSWER_STEP_SLUGS)[number];

export const SLUG_STEP_IDS: Record<AnswerStepSlug, OnboardingStepId[]> = {
  goals: ["focus", "goals"],
  "last-period": ["last-period"],
  cycle: ["cycle-length", "period-duration", "regularity"],
  symptoms: ["symptoms"],
  preferences: ["notifications"],
};

export function isAnswerStepSlug(value: string): value is AnswerStepSlug {
  return (ANSWER_STEP_SLUGS as readonly string[]).includes(value);
}

export function nextSlug(slug: AnswerStepSlug): AnswerStepSlug | null {
  const index = ANSWER_STEP_SLUGS.indexOf(slug);
  return ANSWER_STEP_SLUGS[index + 1] ?? null;
}

export function previousSlug(slug: AnswerStepSlug): AnswerStepSlug | null {
  const index = ANSWER_STEP_SLUGS.indexOf(slug);
  return index > 0 ? ANSWER_STEP_SLUGS[index - 1] : null;
}

/** Global position within ONBOARDING_STEPS, for the shared progress bar. */
export function globalStepIndex(stepId: OnboardingStepId): number {
  return ONBOARDING_STEPS.indexOf(stepId);
}

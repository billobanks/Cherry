import type {
  CycleRegularity,
  FlowIntensity,
  Goal,
  NotificationCategory,
  PrimaryFocus,
} from "./database";

/** The wizard's 11 screens, in order. Used to derive step index / progress. */
export const ONBOARDING_STEPS = [
  "welcome",
  "focus",
  "last-period",
  "cycle-length",
  "period-duration",
  "regularity",
  "symptoms",
  "goals",
  "notifications",
  "account",
  "personalized-welcome",
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

/**
 * Everything collected before an account exists. Held in memory (and mirrored
 * to sessionStorage as a draft) — nothing here touches Supabase until the
 * account-creation step succeeds.
 */
export interface OnboardingAnswers {
  primaryFocus: PrimaryFocus | null;
  lastPeriodStartDate: string | null; // ISO yyyy-mm-dd
  lastPeriodFlowIntensity: FlowIntensity | null;
  avgCycleLengthDays: number | null;
  avgPeriodLengthDays: number | null;
  cycleRegularity: CycleRegularity | null;
  commonSymptomKeys: string[];
  goals: Goal[];
  notificationPreferences: Record<NotificationCategory, boolean>;
}

export const EMPTY_ONBOARDING_ANSWERS: OnboardingAnswers = {
  primaryFocus: null,
  lastPeriodStartDate: null,
  lastPeriodFlowIntensity: null,
  avgCycleLengthDays: null,
  avgPeriodLengthDays: null,
  cycleRegularity: null,
  commonSymptomKeys: [],
  goals: [],
  notificationPreferences: {
    daily_checkin_reminder: false,
    period_prediction: false,
    insight_digest: false,
    product_updates: false,
  },
};

/**
 * Parses a sessionStorage draft defensively. Before onboarding was split
 * into routed steps, the same storage key held a different shape
 * (`{ stepIndex, answers, email, displayName }`), and any browser tab that
 * still has that stale draft sitting around would otherwise get a
 * shape-mismatched object back — e.g. `.goals` reads as `undefined` instead
 * of `[]`, and the first `.includes()` call on it throws. Merging onto
 * `EMPTY_ONBOARDING_ANSWERS` guarantees every field the app reads actually
 * exists, regardless of what was really in storage.
 */
export function parseStoredOnboardingAnswers(raw: string | null): OnboardingAnswers {
  if (!raw) return EMPTY_ONBOARDING_ANSWERS;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingAnswers> | null;
    if (!parsed || typeof parsed !== "object") return EMPTY_ONBOARDING_ANSWERS;
    return { ...EMPTY_ONBOARDING_ANSWERS, ...parsed };
  } catch {
    return EMPTY_ONBOARDING_ANSWERS;
  }
}

export interface AccountDetails {
  email: string;
  password: string;
  displayName: string | null;
}

export type FinalizeOnboardingResult =
  | { status: "ready"; displayName: string | null; warning?: string }
  | { status: "confirm_email" }
  | { status: "error"; message: string; field?: "email" | "password" };

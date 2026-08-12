import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";

export type { SubscriptionPlan, SubscriptionStatus };

export interface PlanDefinition {
  key: SubscriptionPlan;
  name: string;
  priceLabel: string;
  tagline: string;
  features: string[];
}

/** What the app actually knows about a user's subscription right now. */
export interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const FREE_SUBSCRIPTION_STATE: SubscriptionState = {
  plan: "free",
  status: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Goal,
  NotificationCategory,
} from "@/types/database";
import type {
  AccountDetails,
  FinalizeOnboardingResult,
  OnboardingAnswers,
} from "@/types/onboarding";
import { accountSchema, stepSchemas } from "./schema";

/**
 * Creates the account, then persists every onboarding answer under it.
 *
 * Assumes the Supabase project has email confirmation OFF (the default we're
 * recommending for a low-friction consumer onboarding — see the architecture
 * proposal's open items). If confirmation is required, `signUp` returns no
 * session, RLS blocks the writes below, and we return `confirm_email`
 * instead — the caller keeps the answers cached locally so nothing is lost,
 * but re-applying them after confirmation isn't wired up yet.
 */
export async function completeOnboarding(
  answers: OnboardingAnswers,
  account: AccountDetails,
): Promise<FinalizeOnboardingResult> {
  const accountResult = accountSchema.safeParse(account);
  if (!accountResult.success) {
    const issue = accountResult.error.issues[0];
    return {
      status: "error",
      message: issue?.message ?? "Check your account details and try again.",
      field: issue?.path[0] === "email" ? "email" : "password",
    };
  }

  const parsedAnswers = parseAnswers(answers);
  if (!parsedAnswers.success) {
    return { status: "error", message: parsedAnswers.message };
  }

  const supabase = await createClient();
  const { displayName, email, password } = accountResult.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "user_already_exists" ||
        error.message.toLowerCase().includes("already registered")
          ? "That email already has an account — try logging in instead."
          : error.message,
      field: "email",
    };
  }

  // Supabase returns a user with no identities (instead of an error) for an
  // email that's already registered, to avoid leaking which emails exist.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      status: "error",
      message: "That email already has an account — try logging in instead.",
      field: "email",
    };
  }

  if (!data.user) {
    return { status: "error", message: "Something went wrong creating your account. Please try again." };
  }

  if (!data.session) {
    return { status: "confirm_email" };
  }

  const userId = data.user.id;
  let warning: string | undefined;

  try {
    await persistOnboardingAnswers(supabase, userId, parsedAnswers.data);
  } catch (err) {
    console.error("Failed to persist onboarding answers", err);
    warning =
      "Your account is ready, but a few of your answers didn't save. You can re-enter them anytime in Settings.";
  }

  return { status: "ready", displayName, warning };
}

/**
 * Used after an OAuth redirect (Google), where the account already exists by
 * the time the wizard regains control — there's no signUp step to run answers
 * through, just a currently-authenticated user to attach them to.
 */
export async function persistOnboardingForCurrentUser(
  answers: OnboardingAnswers,
): Promise<FinalizeOnboardingResult> {
  const parsedAnswers = parseAnswers(answers);
  if (!parsedAnswers.success) {
    return { status: "error", message: parsedAnswers.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      status: "error",
      message: "Your session expired before we could save your answers — please sign in again.",
    };
  }

  let warning: string | undefined;
  try {
    await persistOnboardingAnswers(supabase, user.id, parsedAnswers.data);
  } catch (err) {
    console.error("Failed to persist onboarding answers", err);
    warning =
      "You're signed in, but a few of your answers didn't save. You can re-enter them anytime in Settings.";
  }

  return {
    status: "ready",
    displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
    warning,
  };
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function persistOnboardingAnswers(
  supabase: Supabase,
  userId: string,
  answers: OnboardingAnswers,
) {
  const profileUpdate = supabase
    .from("profiles")
    .update({
      primary_focus: answers.primaryFocus,
      last_period_start_date: answers.lastPeriodStartDate,
      avg_cycle_length_days: answers.avgCycleLengthDays,
      avg_period_length_days: answers.avgPeriodLengthDays,
      cycle_regularity: answers.cycleRegularity,
      goals: answers.goals,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);

  const notificationRows = (
    Object.entries(answers.notificationPreferences) as [
      NotificationCategory,
      boolean,
    ][]
  ).map(([category, enabled]) => ({
    user_id: userId,
    channel: "email" as const,
    category,
    enabled,
  }));

  const symptomRows = answers.commonSymptomKeys.map((symptomKey) => ({
    user_id: userId,
    symptom_key: symptomKey,
  }));

  const tasks: PromiseLike<{ error: { message: string } | null }>[] = [
    profileUpdate,
    supabase.from("notification_preferences").upsert(notificationRows),
  ];

  if (symptomRows.length > 0) {
    tasks.push(supabase.from("profile_common_symptoms").upsert(symptomRows));
  }

  if (answers.lastPeriodStartDate) {
    tasks.push(seedFirstCycle(supabase, userId, answers));
  }

  const results = await Promise.all(tasks);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}

async function seedFirstCycle(
  supabase: Supabase,
  userId: string,
  answers: OnboardingAnswers,
): Promise<{ error: { message: string } | null }> {
  if (!answers.lastPeriodStartDate) return { error: null };

  const { data: cycle, error: cycleError } = await supabase
    .from("cycles")
    .insert({
      user_id: userId,
      start_date: answers.lastPeriodStartDate,
      period_length_days: answers.avgPeriodLengthDays,
      source: "logged",
    })
    .select("id")
    .single();

  if (cycleError || !cycle) {
    return { error: cycleError ?? { message: "Could not create initial cycle." } };
  }

  const { error: logError } = await supabase.from("period_day_logs").upsert({
    user_id: userId,
    cycle_id: cycle.id,
    log_date: answers.lastPeriodStartDate,
    flow_intensity: answers.lastPeriodFlowIntensity,
  });

  return { error: logError };
}

function parseAnswers(
  answers: OnboardingAnswers,
):
  | { success: true; data: OnboardingAnswers }
  | { success: false; message: string } {
  const checks = [
    stepSchemas.focus.safeParse({ primaryFocus: answers.primaryFocus }),
    stepSchemas.lastPeriod.safeParse({
      lastPeriodStartDate: answers.lastPeriodStartDate,
      lastPeriodFlowIntensity: answers.lastPeriodFlowIntensity,
    }),
    stepSchemas.cycleLength.safeParse({
      avgCycleLengthDays: answers.avgCycleLengthDays,
    }),
    stepSchemas.periodDuration.safeParse({
      avgPeriodLengthDays: answers.avgPeriodLengthDays,
    }),
    stepSchemas.regularity.safeParse({
      cycleRegularity: answers.cycleRegularity,
    }),
    stepSchemas.symptoms.safeParse({
      commonSymptomKeys: answers.commonSymptomKeys,
    }),
    stepSchemas.goals.safeParse({ goals: answers.goals as Goal[] }),
    stepSchemas.notifications.safeParse({
      notificationPreferences: answers.notificationPreferences,
    }),
  ];

  const failed = checks.find((check) => !check.success);
  if (failed && !failed.success) {
    return {
      success: false,
      message: failed.error.issues[0]?.message ?? "One of your answers looks invalid.",
    };
  }

  return { success: true, data: answers };
}

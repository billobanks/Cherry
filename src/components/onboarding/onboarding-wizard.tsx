"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  completeOnboarding,
  persistOnboardingForCurrentUser,
} from "@/lib/onboarding/actions";
import { ONBOARDING_DRAFT_STORAGE_KEY } from "@/lib/onboarding/constants";
import type { SymptomOption } from "@/lib/onboarding/data";
import { signInWithGoogle } from "@/lib/onboarding/oauth";
import type {
  CycleRegularity,
  FlowIntensity,
  Goal,
  NotificationCategory,
  PrimaryFocus,
} from "@/types/database";
import {
  EMPTY_ONBOARDING_ANSWERS,
  ONBOARDING_STEPS,
  type FinalizeOnboardingResult,
  type OnboardingAnswers,
} from "@/types/onboarding";
import { AccountStep } from "./steps/account-step";
import { ConfirmEmailStep } from "./steps/confirm-email-step";
import { CycleLengthStep } from "./steps/cycle-length-step";
import { FocusStep } from "./steps/focus-step";
import { GoalsStep } from "./steps/goals-step";
import { LastPeriodStep } from "./steps/last-period-step";
import { NotificationsStep } from "./steps/notifications-step";
import { PeriodDurationStep } from "./steps/period-duration-step";
import { PersonalizedWelcomeStep } from "./steps/personalized-welcome-step";
import { RegularityStep } from "./steps/regularity-step";
import { SymptomsStep } from "./steps/symptoms-step";
import { WelcomeStep } from "./steps/welcome-step";

interface StoredDraft {
  stepIndex: number;
  answers: OnboardingAnswers;
  email: string;
  displayName: string;
}

export function OnboardingWizard({
  symptomOptions,
}: {
  symptomOptions: SymptomOption[];
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(
    EMPTY_ONBOARDING_ANSWERS,
  );
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [serverError, setServerError] = useState<{
    message: string;
    field?: "email" | "password";
  } | null>(null);
  const [confirmEmailPending, setConfirmEmailPending] = useState(false);
  const [oauthFinalizing, setOauthFinalizing] = useState(false);
  const [result, setResult] = useState<{
    displayName: string | null;
    warning?: string;
  } | null>(null);

  const hydratedRef = useRef(false);

  useEffect(() => {
    let draft: StoredDraft | null = null;
    try {
      const raw = sessionStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
      draft = raw ? (JSON.parse(raw) as StoredDraft) : null;
    } catch {
      draft = null;
    }

    const params = new URLSearchParams(window.location.search);
    const isOAuthReturn = params.get("oauth") === "1";
    const oauthFailed = params.get("oauthError") === "1";

    if (draft) {
      // sessionStorage only exists client-side, so this can't be a lazy
      // useState initializer without desyncing from the server-rendered HTML.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(draft.answers);
      setEmail(draft.email ?? "");
      setDisplayName(draft.displayName ?? "");
      if (!isOAuthReturn) setStepIndex(draft.stepIndex ?? 0);
    }

    if (oauthFailed) {
      toast.error("Google sign-in didn't go through — try again, or use email.");
      window.history.replaceState({}, "", "/onboarding");
    }

    hydratedRef.current = true;

    if (isOAuthReturn) {
      window.history.replaceState({}, "", "/onboarding");
      setOauthFinalizing(true);
      startSubmitTransition(async () => {
        const result = await persistOnboardingForCurrentUser(
          draft?.answers ?? EMPTY_ONBOARDING_ANSWERS,
        );
        setOauthFinalizing(false);
        handleFinalizeResult(result);
      });
    }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const draft: StoredDraft = { stepIndex, answers, email, displayName };
    try {
      sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // sessionStorage unavailable (private browsing, etc.) — draft resilience is best-effort.
    }
  }, [stepIndex, answers, email, displayName]);

  function updateAnswers(partial: Partial<OnboardingAnswers>) {
    setAnswers((prev) => ({ ...prev, ...partial }));
  }

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  }
  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function toggleSymptom(key: string) {
    setAnswers((prev) => ({
      ...prev,
      commonSymptomKeys: prev.commonSymptomKeys.includes(key)
        ? prev.commonSymptomKeys.filter((k) => k !== key)
        : [...prev.commonSymptomKeys, key],
    }));
  }

  function toggleGoal(goal: Goal) {
    setAnswers((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }));
  }

  function toggleNotification(category: NotificationCategory) {
    setAnswers((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [category]: !prev.notificationPreferences[category],
      },
    }));
  }

  function handleFinalizeResult(finalizeResult: FinalizeOnboardingResult) {
    if (finalizeResult.status === "ready") {
      try {
        sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
      } catch {
        // best-effort cleanup
      }
      setServerError(null);
      setConfirmEmailPending(false);
      setResult({
        displayName: finalizeResult.displayName,
        warning: finalizeResult.warning,
      });
      if (finalizeResult.warning) toast.warning(finalizeResult.warning);
      setStepIndex(ONBOARDING_STEPS.length - 1);
      return;
    }

    if (finalizeResult.status === "confirm_email") {
      setConfirmEmailPending(true);
      return;
    }

    setServerError({ message: finalizeResult.message, field: finalizeResult.field });
    toast.error(finalizeResult.message);
  }

  function handleCreateAccount(password: string) {
    setServerError(null);
    startSubmitTransition(async () => {
      const finalizeResult = await completeOnboarding(answers, {
        email,
        password,
        displayName: displayName || null,
      });
      handleFinalizeResult(finalizeResult);
    });
  }

  async function handleGoogleSignIn() {
    setServerError(null);
    setIsGoogleLoading(true);
    try {
      // Flush the draft synchronously — the redirect leaves this component immediately.
      const draft: StoredDraft = { stepIndex, answers, email, displayName };
      sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      await signInWithGoogle();
    } catch {
      setIsGoogleLoading(false);
      toast.error("Couldn't reach Google — check your connection and try again.");
    }
  }

  if (oauthFinalizing) {
    return <FinalizingScreen />;
  }

  if (confirmEmailPending) {
    return <ConfirmEmailStep email={email} />;
  }

  const step = ONBOARDING_STEPS[stepIndex];

  switch (step) {
    case "welcome":
      return <WelcomeStep onNext={goNext} />;

    case "focus":
      return (
        <FocusStep
          stepIndex={stepIndex}
          value={answers.primaryFocus}
          onChange={(value: PrimaryFocus) => updateAnswers({ primaryFocus: value })}
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "last-period":
      return (
        <LastPeriodStep
          stepIndex={stepIndex}
          date={answers.lastPeriodStartDate}
          flowIntensity={answers.lastPeriodFlowIntensity}
          onChangeDate={(value) => updateAnswers({ lastPeriodStartDate: value })}
          onChangeFlow={(value: FlowIntensity) =>
            updateAnswers({ lastPeriodFlowIntensity: value })
          }
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "cycle-length":
      return (
        <CycleLengthStep
          stepIndex={stepIndex}
          value={answers.avgCycleLengthDays}
          onChange={(value) => updateAnswers({ avgCycleLengthDays: value })}
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "period-duration":
      return (
        <PeriodDurationStep
          stepIndex={stepIndex}
          value={answers.avgPeriodLengthDays}
          onChange={(value) => updateAnswers({ avgPeriodLengthDays: value })}
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "regularity":
      return (
        <RegularityStep
          stepIndex={stepIndex}
          value={answers.cycleRegularity}
          onChange={(value: CycleRegularity) => updateAnswers({ cycleRegularity: value })}
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "symptoms":
      return (
        <SymptomsStep
          stepIndex={stepIndex}
          options={symptomOptions}
          values={answers.commonSymptomKeys}
          onToggle={toggleSymptom}
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "goals":
      return (
        <GoalsStep
          stepIndex={stepIndex}
          values={answers.goals}
          onToggle={toggleGoal}
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "notifications":
      return (
        <NotificationsStep
          stepIndex={stepIndex}
          values={answers.notificationPreferences}
          onToggle={toggleNotification}
          onBack={goBack}
          onSkip={goNext}
          onNext={goNext}
        />
      );

    case "account":
      return (
        <AccountStep
          stepIndex={stepIndex}
          displayName={displayName}
          email={email}
          onChangeDisplayName={setDisplayName}
          onChangeEmail={setEmail}
          onBack={goBack}
          isSubmitting={isSubmitting}
          isGoogleLoading={isGoogleLoading}
          serverError={serverError}
          onSubmit={handleCreateAccount}
          onGoogleSignIn={handleGoogleSignIn}
        />
      );

    case "personalized-welcome":
      return (
        <PersonalizedWelcomeStep
          displayName={result?.displayName ?? (displayName || null)}
          answers={answers}
          warning={result?.warning}
          onFinish={() => router.push("/dashboard")}
        />
      );

    default:
      return null;
  }
}

function FinalizingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Setting things up…</p>
    </div>
  );
}

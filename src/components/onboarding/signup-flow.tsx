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
import { signInWithGoogle } from "@/lib/onboarding/oauth";
import {
  EMPTY_ONBOARDING_ANSWERS,
  parseStoredOnboardingAnswers,
  type FinalizeOnboardingResult,
  type OnboardingAnswers,
} from "@/types/onboarding";
import { AccountStep } from "./steps/account-step";
import { ConfirmEmailStep } from "./steps/confirm-email-step";
import { PersonalizedWelcomeStep } from "./steps/personalized-welcome-step";

/**
 * Account creation, split out from the answer-collecting wizard at
 * `/onboarding/*` so the two concerns have their own URLs. Reads whatever
 * `OnboardingAnswers` draft the wizard left in sessionStorage (empty
 * defaults if someone lands here directly) — the draft itself never
 * required an account to exist.
 */
export function SignupFlow() {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ONBOARDING_ANSWERS);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [serverError, setServerError] = useState<{ message: string; field?: "email" | "password" } | null>(null);
  const [confirmEmailPending, setConfirmEmailPending] = useState(false);
  const [oauthFinalizing, setOauthFinalizing] = useState(false);
  const [result, setResult] = useState<{ displayName: string | null; warning?: string } | null>(null);

  const hydratedRef = useRef(false);

  useEffect(() => {
    const draft = parseStoredOnboardingAnswers(sessionStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY));

    const params = new URLSearchParams(window.location.search);
    const isOAuthReturn = params.get("oauth") === "1";
    const oauthFailed = params.get("oauthError") === "1";

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(draft);

    if (oauthFailed) {
      toast.error("Google sign-in didn't go through — try again, or use email.");
      window.history.replaceState({}, "", "/signup");
    }

    hydratedRef.current = true;

    if (isOAuthReturn) {
      window.history.replaceState({}, "", "/signup");
      setOauthFinalizing(true);
      startSubmitTransition(async () => {
        const result = await persistOnboardingForCurrentUser(draft);
        setOauthFinalizing(false);
        handleFinalizeResult(result);
      });
    }
  }, []);

  function handleFinalizeResult(finalizeResult: FinalizeOnboardingResult) {
    if (finalizeResult.status === "ready") {
      try {
        sessionStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
      } catch {
        // best-effort cleanup
      }
      setServerError(null);
      setConfirmEmailPending(false);
      setResult({ displayName: finalizeResult.displayName, warning: finalizeResult.warning });
      if (finalizeResult.warning) toast.warning(finalizeResult.warning);
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
      sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(answers));
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

  if (result) {
    return (
      <PersonalizedWelcomeStep
        displayName={result.displayName ?? (displayName || null)}
        answers={answers}
        warning={result.warning}
        onFinish={() => router.push("/app/today")}
      />
    );
  }

  return (
    <AccountStep
      stepIndex={-1}
      displayName={displayName}
      email={email}
      onChangeDisplayName={setDisplayName}
      onChangeEmail={setEmail}
      onBack={() => router.push("/onboarding/preferences")}
      isSubmitting={isSubmitting}
      isGoogleLoading={isGoogleLoading}
      serverError={serverError}
      onSubmit={handleCreateAccount}
      onGoogleSignIn={handleGoogleSignIn}
    />
  );
}

function FinalizingScreen() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Setting things up…</p>
    </div>
  );
}

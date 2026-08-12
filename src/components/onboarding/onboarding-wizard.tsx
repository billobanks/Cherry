"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ONBOARDING_DRAFT_STORAGE_KEY } from "@/lib/onboarding/constants";
import type { SymptomOption } from "@/lib/onboarding/data";
import { globalStepIndex, nextSlug, previousSlug, SLUG_STEP_IDS, type AnswerStepSlug } from "@/lib/onboarding/step-routes";
import type {
  CycleRegularity,
  FlowIntensity,
  Goal,
  NotificationCategory,
  PrimaryFocus,
} from "@/types/database";
import { EMPTY_ONBOARDING_ANSWERS, type OnboardingAnswers } from "@/types/onboarding";
import { CycleLengthStep } from "./steps/cycle-length-step";
import { FocusStep } from "./steps/focus-step";
import { GoalsStep } from "./steps/goals-step";
import { LastPeriodStep } from "./steps/last-period-step";
import { NotificationsStep } from "./steps/notifications-step";
import { PeriodDurationStep } from "./steps/period-duration-step";
import { RegularityStep } from "./steps/regularity-step";
import { SymptomsStep } from "./steps/symptoms-step";

/**
 * Purely the Q&A portion of onboarding — one routed screen per `slug`
 * (`/onboarding/[step]`), each hosting one or more underlying question
 * steps in sequence. Account creation lives at `/signup`, entirely
 * separate: this component never touches auth, only `OnboardingAnswers`.
 * Draft answers are mirrored to sessionStorage so refreshing mid-flow (or
 * moving on to /signup) doesn't lose anything.
 */
export function OnboardingWizard({
  slug,
  symptomOptions,
}: {
  slug: AnswerStepSlug;
  symptomOptions: SymptomOption[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ONBOARDING_ANSWERS);
  const [subIndex, setSubIndex] = useState(0);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let draft: OnboardingAnswers | null = null;
    try {
      const raw = sessionStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
      draft = raw ? (JSON.parse(raw) as OnboardingAnswers) : null;
    } catch {
      draft = null;
    }
    if (draft) {
      // sessionStorage only exists client-side, so this can't be a lazy
      // useState initializer without desyncing from the server-rendered HTML.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(draft);
    }
    setSubIndex(0);
    hydratedRef.current = true;
  }, [slug]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // sessionStorage unavailable (private browsing, etc.) — draft resilience is best-effort.
    }
  }, [answers]);

  function updateAnswers(partial: Partial<OnboardingAnswers>) {
    setAnswers((prev) => ({ ...prev, ...partial }));
  }

  const stepIds = SLUG_STEP_IDS[slug];
  const stepId = stepIds[subIndex];
  const stepIndex = globalStepIndex(stepId);

  function goNext() {
    if (subIndex < stepIds.length - 1) {
      setSubIndex((i) => i + 1);
      return;
    }
    const next = nextSlug(slug);
    router.push(next ? `/onboarding/${next}` : "/signup");
  }

  function goBack() {
    if (subIndex > 0) {
      setSubIndex((i) => i - 1);
      return;
    }
    const previous = previousSlug(slug);
    router.push(previous ? `/onboarding/${previous}` : "/onboarding");
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
      goals: prev.goals.includes(goal) ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
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

  switch (stepId) {
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
          onChangeFlow={(value: FlowIntensity) => updateAnswers({ lastPeriodFlowIntensity: value })}
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

    default:
      return null;
  }
}

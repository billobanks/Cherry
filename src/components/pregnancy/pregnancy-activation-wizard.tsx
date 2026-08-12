"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import type { ActivatePregnancyInput, ActivatePregnancyResult } from "@/lib/pregnancy";
import type { PregnancyFocusArea } from "@/types/database";

const FOCUS_AREA_OPTIONS: { value: PregnancyFocusArea; label: string }[] = [
  { value: "understanding_body", label: "Understanding my changing body" },
  { value: "fetal_development", label: "Understanding fetal development" },
  { value: "nutrition", label: "Nutrition" },
  { value: "managing_discomforts", label: "Managing common pregnancy discomforts" },
  { value: "exercise_movement", label: "Exercise and movement" },
  { value: "sleep", label: "Sleep" },
  { value: "emotional_wellbeing", label: "Emotional wellbeing" },
  { value: "appointments", label: "Preparing for appointments" },
  { value: "birth_preparation", label: "Preparing for birth" },
  { value: "baby_preparation", label: "Preparing for my baby" },
  { value: "all", label: "All of the above" },
];

const YES_NO_OPTIONS = [
  { value: "yes" as const, label: "Yes" },
  { value: "no" as const, label: "No" },
];

const TOTAL_STEPS = 7;
const today = () => new Date().toISOString().slice(0, 10);

function Shell({
  step,
  title,
  description,
  onBack,
  onSkip,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  errorMessage,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  onBack?: () => void;
  onSkip?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  errorMessage?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3 sm:px-8">
        <div className="mx-auto flex w-full max-w-md items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={!onBack}
            aria-label="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary disabled:opacity-0"
          >
            ←
          </button>
          <div className="flex flex-1 items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
          ) : (
            <span className="w-9 shrink-0" aria-hidden />
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-8 sm:px-8">
        <h1 className="font-heading text-[2rem] leading-[1.15] font-medium text-balance">{title}</h1>
        {description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>
        ) : null}
        <div className="mt-8 flex-1">{children}</div>
        {errorMessage ? (
          <p role="alert" className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </main>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/85 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="flex h-13 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground disabled:opacity-70"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PregnancyActivationWizard({
  onActivate,
}: {
  onActivate: (input: ActivatePregnancyInput) => Promise<ActivatePregnancyResult>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [hadPositiveTest, setHadPositiveTest] = useState<"yes" | "no" | null>(null);
  const [lmpDate, setLmpDate] = useState("");
  const [clinicianProvided, setClinicianProvided] = useState<"yes" | "no" | null>(null);
  const [clinicianDueDate, setClinicianDueDate] = useState("");
  const [isFirstPregnancy, setIsFirstPregnancy] = useState<"yes" | "no" | null>(null);
  const [hasScheduledCare, setHasScheduledCare] = useState<"yes" | "no" | null>(null);
  const [focusAreas, setFocusAreas] = useState<PregnancyFocusArea[]>([]);
  const [datingError, setDatingError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function next() {
    setDatingError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleSubmit() {
    const hasDatingInfo = Boolean(lmpDate) || (clinicianProvided === "yes" && Boolean(clinicianDueDate));
    if (!hasDatingInfo) {
      setDatingError(
        "We need at least the first day of your last period, or a clinician-provided due date, to set up your pregnancy timeline.",
      );
      setStep(2);
      return;
    }

    startTransition(async () => {
      const result = await onActivate({
        hadPositiveTest: hadPositiveTest === null ? null : hadPositiveTest === "yes",
        lastMenstrualPeriodDate: lmpDate || null,
        clinicianProvidedDueDate: clinicianProvided === null ? null : clinicianProvided === "yes",
        clinicianDueDate: clinicianProvided === "yes" ? clinicianDueDate || null : null,
        isFirstPregnancy: isFirstPregnancy === null ? null : isFirstPregnancy === "yes",
        hasScheduledPrenatalCare: hasScheduledCare === null ? null : hasScheduledCare === "yes",
        focusAreas,
      });

      if (result.status === "ready") {
        router.push("/app/pregnancy");
        return;
      }
      if (result.status === "needs_dating_info") {
        setDatingError(
          "We need at least the first day of your last period, or a clinician-provided due date, to set up your pregnancy timeline.",
        );
        setStep(2);
        return;
      }
      if (result.status === "signed_out") {
        toast.error("Please sign in again.");
        return;
      }
      toast.error(result.message);
    });
  }

  if (step === 0) {
    return (
      <Shell step={0} title="Congratulations." onPrimary={next} primaryLabel="Continue">
        <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">
          We can help you understand what may be happening in your body and what to expect as your pregnancy
          progresses.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          A few quick questions — most are optional, and you can always update them later.
        </p>
      </Shell>
    );
  }

  if (step === 1) {
    return (
      <Shell
        step={1}
        title="Have you had a positive pregnancy test?"
        onBack={back}
        onSkip={next}
        primaryLabel="Continue"
        onPrimary={next}
      >
        <ChipSelect label="" options={YES_NO_OPTIONS} multi={false} value={hadPositiveTest} onChange={setHadPositiveTest} />
      </Shell>
    );
  }

  if (step === 2) {
    return (
      <Shell
        step={2}
        title="What was the first day of your last menstrual period?"
        description="This is the standard basis for an early due-date estimate."
        onBack={back}
        onSkip={next}
        primaryLabel="Continue"
        onPrimary={next}
        errorMessage={datingError}
      >
        <input
          type="date"
          value={lmpDate}
          max={today()}
          onChange={(e) => setLmpDate(e.target.value)}
          className="h-13 w-full rounded-2xl border border-border bg-card px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary"
        />
      </Shell>
    );
  }

  if (step === 3) {
    return (
      <Shell
        step={3}
        title="Has a healthcare professional given you an estimated due date?"
        onBack={back}
        onSkip={next}
        primaryLabel="Continue"
        onPrimary={next}
      >
        <div className="flex flex-col gap-6">
          <ChipSelect label="" options={YES_NO_OPTIONS} multi={false} value={clinicianProvided} onChange={setClinicianProvided} />
          {clinicianProvided === "yes" ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">Clinician-provided due date</span>
              <input
                type="date"
                value={clinicianDueDate}
                onChange={(e) => setClinicianDueDate(e.target.value)}
                className="h-13 w-full rounded-2xl border border-border bg-card px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary"
              />
            </label>
          ) : null}
        </div>
      </Shell>
    );
  }

  if (step === 4) {
    return (
      <Shell
        step={4}
        title="Is this your first pregnancy?"
        onBack={back}
        onSkip={next}
        primaryLabel="Continue"
        onPrimary={next}
      >
        <ChipSelect label="" options={YES_NO_OPTIONS} multi={false} value={isFirstPregnancy} onChange={setIsFirstPregnancy} />
      </Shell>
    );
  }

  if (step === 5) {
    return (
      <Shell
        step={5}
        title="Have you already scheduled prenatal care?"
        onBack={back}
        onSkip={next}
        primaryLabel="Continue"
        onPrimary={next}
      >
        <div className="flex flex-col gap-4">
          <ChipSelect label="" options={YES_NO_OPTIONS} multi={false} value={hasScheduledCare} onChange={setHasScheduledCare} />
          {hasScheduledCare === "no" ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
              Establishing prenatal care early is one of the most valuable things you can do for you and your
              pregnancy — it&apos;s worth prioritizing soon if you haven&apos;t yet.
            </p>
          ) : null}
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      step={6}
      title="Which areas would you like help with?"
      description="Optional — helps us prioritize what to show you first."
      onBack={back}
      onSkip={handleSubmit}
      primaryLabel={isPending ? "Setting up…" : "Start Pregnancy Mode"}
      onPrimary={handleSubmit}
      primaryDisabled={isPending}
      errorMessage={datingError}
    >
      <ChipSelect label="" options={FOCUS_AREA_OPTIONS} multi={true} value={focusAreas} onChange={setFocusAreas} />
    </Shell>
  );
}

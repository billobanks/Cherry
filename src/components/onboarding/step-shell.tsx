"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "./progress";

interface StepShellProps {
  stepIndex: number;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  errorMessage?: string | null;
}

export function StepShell({
  stepIndex,
  eyebrow,
  title,
  description,
  children,
  onBack,
  onSkip,
  skipLabel = "Skip",
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  errorMessage,
}: StepShellProps) {
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
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="flex-1">
            <OnboardingProgress stepIndex={stepIndex} />
          </div>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="shrink-0 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {skipLabel}
            </button>
          ) : (
            <span className="w-9 shrink-0" aria-hidden />
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-6 pb-8 sm:px-8">
        {eyebrow ? (
          <span className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="font-heading text-[2rem] leading-[1.15] font-medium text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">
            {description}
          </p>
        ) : null}

        <div className="mt-8 flex-1">{children}</div>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {errorMessage}
          </p>
        ) : null}
      </main>

      <div className="sticky bottom-0 border-t border-border/60 bg-background/85 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <Button
            size="lg"
            data-testid="onboarding-primary"
            className="h-13 w-full rounded-full text-base font-semibold"
            onClick={onPrimary}
            disabled={primaryDisabled || primaryLoading}
          >
            {primaryLoading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              primaryLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

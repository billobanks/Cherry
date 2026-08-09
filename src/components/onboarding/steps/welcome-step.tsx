"use client";

import { Button } from "@/components/ui/button";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col justify-between px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          Welcome to Cherry
        </span>
        <h1 className="mt-4 font-heading text-[2.25rem] leading-[1.12] font-medium text-balance">
          A few quick questions, so Cherry fits you — not the other way around.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground text-pretty">
          Under two minutes. Skip anything you&apos;d rather not answer — you
          can always add it later.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
          Cherry offers general wellness information, not medical advice.
          Estimates for periods and cycle phases are just that — estimates —
          and shouldn&apos;t be used as contraception or for a diagnosis.
        </div>
      </div>

      <div className="mx-auto w-full max-w-md pt-8">
        <Button
          size="lg"
          data-testid="onboarding-primary"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={onNext}
        >
          Let&apos;s begin
        </Button>
      </div>
    </div>
  );
}

"use client";

import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingAnswers } from "@/types/onboarding";

function estimateNextPeriod(answers: OnboardingAnswers) {
  if (!answers.lastPeriodStartDate) return null;
  const cycleLength = answers.avgCycleLengthDays ?? 28;
  const start = new Date(`${answers.lastPeriodStartDate}T00:00:00`);
  const next = new Date(start);
  next.setDate(next.getDate() + cycleLength);
  return next;
}

function describePosition(answers: OnboardingAnswers) {
  if (!answers.lastPeriodStartDate) return null;
  const cycleLength = answers.avgCycleLengthDays ?? 28;
  const periodLength = answers.avgPeriodLengthDays ?? 5;
  const start = new Date(`${answers.lastPeriodStartDate}T00:00:00`);
  const today = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSince = Math.floor((today.getTime() - start.getTime()) / msPerDay);
  const cycleDay = (daysSince % cycleLength) + 1;

  let phase = "luteal phase";
  if (cycleDay <= periodLength) phase = "menstrual phase";
  else if (cycleDay <= Math.round(cycleLength / 2) - 1) phase = "follicular phase";
  else if (cycleDay <= Math.round(cycleLength / 2) + 1) phase = "ovulation window";

  return { cycleDay, phase };
}

export function PersonalizedWelcomeStep({
  displayName,
  answers,
  warning,
  onFinish,
}: {
  displayName: string | null;
  answers: OnboardingAnswers;
  warning?: string;
  onFinish: () => void;
}) {
  const nextPeriod = estimateNextPeriod(answers);
  const position = describePosition(answers);
  const greetingName = displayName?.trim() ? `, ${displayName.trim()}` : "";

  return (
    <div className="flex min-h-dvh flex-col justify-between px-6 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <PartyPopper className="h-7 w-7 text-primary" />
        <h1 className="mt-4 font-heading text-[2.15rem] leading-[1.15] font-medium text-balance">
          You&apos;re all set{greetingName}.
        </h1>

        {position ? (
          <div className="mt-6 rounded-2xl border border-border bg-card px-5 py-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
              Today, roughly
            </span>
            <p className="mt-1.5 font-heading text-xl font-medium">
              Day {position.cycleDay} · {position.phase}
            </p>
            {nextPeriod ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Next period estimated around{" "}
                {nextPeriod.toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })}
                .
              </p>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              An estimate from what you told us — not a diagnosis, and not
              contraception. It gets sharper as you log more cycles.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground text-pretty">
            Log your first period from the dashboard whenever it starts, and
            we&apos;ll begin building your estimates from there.
          </p>
        )}

        {warning ? (
          <p className="mt-4 rounded-lg border border-primary/25 bg-accent px-3.5 py-2.5 text-sm text-accent-foreground">
            {warning}
          </p>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-md pt-8">
        <Button
          size="lg"
          className="h-13 w-full rounded-full text-base font-semibold"
          onClick={onFinish}
        >
          Go to my dashboard
        </Button>
      </div>
    </div>
  );
}

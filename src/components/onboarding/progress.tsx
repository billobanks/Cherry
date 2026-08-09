import { ONBOARDING_STEPS } from "@/types/onboarding";

/** Dots for the 9 answerable steps; welcome and the final screen aren't "progress" to track. */
const TRACKED_RANGE = { start: 1, end: ONBOARDING_STEPS.length - 2 };

export function OnboardingProgress({ stepIndex }: { stepIndex: number }) {
  if (stepIndex < TRACKED_RANGE.start || stepIndex > TRACKED_RANGE.end) {
    return null;
  }

  const total = TRACKED_RANGE.end - TRACKED_RANGE.start + 1;
  const current = stepIndex - TRACKED_RANGE.start + 1;

  return (
    <div
      className="flex items-center gap-3"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i < current ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {current}/{total}
      </span>
    </div>
  );
}

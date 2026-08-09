import { CycleRing } from "./cycle-ring";
import { GreetingText } from "./greeting-text";
import type { DashboardData } from "@/lib/dashboard";

function formatNextPeriodValue(daysUntil: number): string {
  if (daysUntil === 1) return "Tomorrow";
  return `${daysUntil} days`;
}

export function GreetingHeader({
  displayName,
  data,
}: {
  displayName: string | null;
  data: DashboardData;
}) {
  return (
    <div
      className="rounded-b-[2.5rem] px-5 pb-8 pt-[max(1.75rem,env(safe-area-inset-top))] sm:px-8"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, var(--accent) 0%, var(--background) 70%)",
      }}
    >
      <GreetingText displayName={displayName} />

      <div className="mt-6">
        <CycleRing
          phases={data.phases}
          cycleLengthDays={data.cycleLengthDays}
          currentCycleDay={data.currentCycleDay}
          cycleDay={data.currentCycleDay}
          phaseLabel={data.phaseLabel}
        />
      </div>

      <div className="mt-5 flex flex-col items-center gap-1 text-center">
        <span className="text-lg font-medium text-foreground">{data.phaseLabel}</span>
        <span className="text-sm text-muted-foreground">
          Next estimated period ·{" "}
          <span className="font-medium text-foreground">
            {formatNextPeriodValue(data.nextPeriod.daysUntil)}
          </span>
        </span>
      </div>
    </div>
  );
}

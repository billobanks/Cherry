import { PHASE_COLOR_VAR } from "@/lib/phase-colors";
import type { CyclePhase } from "@/lib/cycle-engine";

const PHASE_ITEMS: { phase: CyclePhase; label: string }[] = [
  { phase: "menstrual", label: "Menstrual" },
  { phase: "follicular", label: "Follicular" },
  { phase: "ovulation_window", label: "Ovulation window" },
  { phase: "luteal", label: "Luteal" },
];

export function Legend() {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Legend
      </span>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--primary)" }} aria-hidden />
          Logged period
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <span
            className="h-2 w-2 rounded-full border"
            style={{ borderColor: "var(--primary)" }}
            aria-hidden
          />
          Predicted period
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground/50" aria-hidden />
          Symptoms logged
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-moss" aria-hidden />
          Mood logged
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3">
        {PHASE_ITEMS.map((item) => (
          <div key={item.phase} className="flex items-center gap-1.5 text-xs text-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: `color-mix(in srgb, ${PHASE_COLOR_VAR[item.phase]} 55%, var(--card))` }}
              aria-hidden
            />
            Estimated {item.label.toLowerCase()}
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Phases and predicted period days are estimates, not confirmed facts — they update as you
        log more.
      </p>
    </div>
  );
}

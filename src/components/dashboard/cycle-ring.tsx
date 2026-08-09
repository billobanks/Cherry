import type { PhaseRange } from "@/lib/cycle-engine";
import { computeMarkerAngleDegrees, computeRingSegments, describeArc, polarToCartesian } from "@/lib/dashboard";
import { PHASE_COLOR_VAR } from "@/lib/phase-colors";

const SIZE = 220;
const STROKE_WIDTH = 14;
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE_WIDTH;
const GAP_DEGREES = 3;

export function CycleRing({
  phases,
  cycleLengthDays,
  currentCycleDay,
  cycleDay,
  phaseLabel,
}: {
  phases: PhaseRange[];
  cycleLengthDays: number;
  currentCycleDay: number;
  cycleDay: number;
  phaseLabel: string;
}) {
  const segments = computeRingSegments(phases, cycleLengthDays);
  const markerAngle = computeMarkerAngleDegrees(currentCycleDay, cycleLengthDays);
  const marker = polarToCartesian(CENTER, CENTER, RADIUS, markerAngle);

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Cycle day ${cycleDay} of ${cycleLengthDays}, ${phaseLabel}`}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE_WIDTH}
        />
        {segments.map((segment) => {
          const start = Math.min(segment.startAngle + GAP_DEGREES / 2, segment.endAngle);
          const end = Math.max(segment.endAngle - GAP_DEGREES / 2, start);
          return (
            <path
              key={segment.phase}
              d={describeArc(CENTER, CENTER, RADIUS, start, end)}
              fill="none"
              stroke={PHASE_COLOR_VAR[segment.phase]}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              className="transition-[stroke-dasharray] duration-500 ease-out"
            />
          );
        })}
        <circle
          cx={marker.x}
          cy={marker.y}
          r={7}
          fill="var(--background)"
          stroke="var(--foreground)"
          strokeWidth={2.5}
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Cycle Day
        </span>
        <span className="font-heading text-5xl font-medium tabular-nums leading-none">
          {cycleDay}
        </span>
      </div>
    </div>
  );
}

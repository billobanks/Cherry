import type { CyclePhase, PhaseRange } from "@/lib/cycle-engine";

export interface RingSegment {
  phase: CyclePhase;
  /** Degrees, 0 = top (12 o'clock), increasing clockwise. */
  startAngle: number;
  endAngle: number;
}

/** Converts each phase's day-of-cycle range into a proportional angle range around the ring. */
export function computeRingSegments(
  phases: PhaseRange[],
  cycleLengthDays: number,
): RingSegment[] {
  return phases.map((phase) => ({
    phase: phase.phase,
    startAngle: ((phase.startDayOfCycle - 1) / cycleLengthDays) * 360,
    endAngle: (phase.endDayOfCycle / cycleLengthDays) * 360,
  }));
}

/** Where "today" sits on the ring — centered within its day, clamped so a late/overdue day still reads near the end rather than wrapping. */
export function computeMarkerAngleDegrees(
  currentCycleDay: number,
  cycleLengthDays: number,
): number {
  const clampedDay = Math.min(Math.max(currentCycleDay, 1), cycleLengthDays);
  return ((clampedDay - 0.5) / cycleLengthDays) * 360;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDegrees: number,
): { x: number; y: number } {
  const angleRad = ((angleDegrees - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

/** SVG path `d` for a ring arc from startAngle to endAngle (degrees, 0 = top, clockwise). */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

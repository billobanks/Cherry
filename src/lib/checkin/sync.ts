import type { CheckinFlow, FlowIntensity } from "@/types/database";

export type PeriodLogSyncAction =
  | { type: "upsert"; flowIntensity: FlowIntensity }
  | { type: "delete" }
  | { type: "none" };

/**
 * The check-in's flow field is the fast, everyday way flow gets logged, and
 * period_day_logs (used by the cycle-engine's history) should stay in sync
 * with it — but only for what the check-in actually asserts:
 *
 * - "None" is an explicit answer ("no flow today") -> any existing
 *   period_day_logs row for that date should be removed.
 * - A flow intensity -> upsert that day's row.
 * - Never answered (flow left blank) -> leave period_day_logs alone. There's
 *   deliberately no way to distinguish "never answered" from "cleared" here,
 *   which is why the UI always makes "None" an explicit, separate choice
 *   rather than treating an empty selection as equivalent to it.
 *
 * This intentionally never creates or modifies a `cycles` row or
 * `profiles.last_period_start_date` — deciding whether a given day starts a
 * new cycle is a separate, more deliberate action (see the /log/period
 * flow), not something a fast daily check-in should infer on its own.
 */
export function derivePeriodLogSyncAction(flow: CheckinFlow | null): PeriodLogSyncAction {
  if (flow === null) return { type: "none" };
  if (flow === "none") return { type: "delete" };
  return { type: "upsert", flowIntensity: flow };
}

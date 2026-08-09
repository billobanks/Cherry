import { describe, expect, it } from "vitest";
import { derivePeriodLogSyncAction } from "../sync";

describe("derivePeriodLogSyncAction", () => {
  it("does nothing when flow was never answered", () => {
    expect(derivePeriodLogSyncAction(null)).toEqual({ type: "none" });
  });

  it("deletes any existing period log when flow is explicitly 'none'", () => {
    expect(derivePeriodLogSyncAction("none")).toEqual({ type: "delete" });
  });

  it.each(["spotting", "light", "medium", "heavy"] as const)(
    "upserts a period log with the matching intensity for '%s'",
    (flow) => {
      expect(derivePeriodLogSyncAction(flow)).toEqual({
        type: "upsert",
        flowIntensity: flow,
      });
    },
  );
});

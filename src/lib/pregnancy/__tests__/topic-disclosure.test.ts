import { describe, expect, it } from "vitest";
import { BIRTH_PREP_TOPICS, getRevealedBirthPrepTopics, getUpcomingBirthPrepTopics } from "../topic-disclosure";

describe("topic-disclosure", () => {
  it("reveals nothing before week 28", () => {
    expect(getRevealedBirthPrepTopics(20)).toEqual([]);
  });

  it("reveals only signs_of_labor at week 28", () => {
    const revealed = getRevealedBirthPrepTopics(28);
    expect(revealed.map((t) => t.key)).toEqual(["signs_of_labor"]);
  });

  it("reveals everything by the final topic's week", () => {
    const lastWeek = Math.max(...BIRTH_PREP_TOPICS.map((t) => t.revealFromWeek));
    expect(getRevealedBirthPrepTopics(lastWeek)).toHaveLength(BIRTH_PREP_TOPICS.length);
  });

  it("revealed + upcoming always covers every topic exactly once", () => {
    for (const week of [20, 28, 30, 32, 34, 36, 40]) {
      const total = getRevealedBirthPrepTopics(week).length + getUpcomingBirthPrepTopics(week).length;
      expect(total).toBe(BIRTH_PREP_TOPICS.length);
    }
  });

  it("orders upcoming topics soonest-first", () => {
    const upcoming = getUpcomingBirthPrepTopics(20);
    const weeks = upcoming.map((t) => t.revealFromWeek);
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b));
  });
});

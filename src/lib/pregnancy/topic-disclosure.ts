export interface BirthPrepTopic {
  key: string;
  label: string;
  blurb: string;
  revealFromWeek: number;
}

/**
 * Labor/birth preparation topics, gated by gestational week so the third
 * trimester doesn't dump everything (hospital bag, labor signs, postpartum
 * planning) on the user all at once at week 28 — each topic appears only
 * once it's reasonably relevant to think about.
 */
export const BIRTH_PREP_TOPICS: BirthPrepTopic[] = [
  {
    key: "signs_of_labor",
    label: "Signs of labor",
    blurb: "What labor commonly looks like, and how it can differ from Braxton Hicks practice contractions.",
    revealFromWeek: 28,
  },
  {
    key: "hospital_bag",
    label: "Packing a hospital bag",
    blurb: "A general starting checklist for what people commonly bring — adjust it to what matters to you.",
    revealFromWeek: 32,
  },
  {
    key: "support_planning",
    label: "Support planning",
    blurb: "Who you want with you, and how to loop in support people ahead of time.",
    revealFromWeek: 34,
  },
  {
    key: "feeding_education",
    label: "Feeding basics",
    blurb: "General information on feeding options, to think through at your own pace.",
    revealFromWeek: 34,
  },
  {
    key: "postpartum_planning",
    label: "Postpartum planning",
    blurb: "What the early postpartum period commonly involves, and what support can look like.",
    revealFromWeek: 36,
  },
  {
    key: "labor_education",
    label: "Labor education",
    blurb: "A general overview of how labor commonly progresses — every labor is different.",
    revealFromWeek: 36,
  },
];

/** Topics relevant to introduce now, given the current gestational week. */
export function getRevealedBirthPrepTopics(gestationalAgeWeeks: number): BirthPrepTopic[] {
  return BIRTH_PREP_TOPICS.filter((topic) => gestationalAgeWeeks >= topic.revealFromWeek);
}

/** Topics not yet introduced, soonest first — used to preview "coming up." */
export function getUpcomingBirthPrepTopics(gestationalAgeWeeks: number): BirthPrepTopic[] {
  return BIRTH_PREP_TOPICS.filter((topic) => gestationalAgeWeeks < topic.revealFromWeek).sort(
    (a, b) => a.revealFromWeek - b.revealFromWeek,
  );
}

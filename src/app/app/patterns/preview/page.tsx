import { notFound } from "next/navigation";
import { MyPatternsView } from "@/components/patterns/my-patterns-view";
import { CHECKIN_SYMPTOM_OPTIONS, MOOD_OPTIONS } from "@/lib/checkin";
import { addDays, formatISODate, parseISODate } from "@/lib/cycle-engine";
import type { MyPatternsData } from "@/lib/my-patterns";
import {
  analyzeCycleLengthTrend,
  analyzeEnergyPatterns,
  analyzeMostCommonSymptoms,
  analyzePeriodDurationTrend,
  analyzeSleepPatterns,
  analyzeTaggedPatternsAllPhases,
  type DailyMetricEntry,
  type HistoricalCycle,
  type TaggedLogEntry,
} from "@/lib/patterns";

const SYMPTOM_LABEL_BY_KEY = Object.fromEntries(CHECKIN_SYMPTOM_OPTIONS.map((s) => [s.key, s.label]));
const MOOD_LABEL_BY_KEY = Object.fromEntries(MOOD_OPTIONS.map((m) => [m.value, m.label.toLowerCase()]));

function phasePhrase(phase: string) {
  return phase === "ovulation_window" ? "ovulation window" : `${phase} phase`;
}

/** Dev-only design preview, built from real analyze.ts calls over fixture data. 404s in production. */
export default function PatternsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const today = "2026-08-08";

  // 7 cycle-start dates, 28 days apart -> 6 completed cycles.
  const cycleStarts: string[] = [];
  let cursor = parseISODate("2026-02-01");
  for (let i = 0; i < 7; i++) {
    cycleStarts.push(formatISODate(cursor));
    cursor = addDays(cursor, 28);
  }

  const completedCycles: HistoricalCycle[] = cycleStarts.slice(0, -1).map((startDate) => ({
    startDate,
    cycleLengthDays: 28,
    periodLengthDays: 5,
  }));

  // Period logs: 5 days of flow at the start of each completed cycle (varies slightly for realism).
  const periodLogDates: string[] = [];
  const periodLengths = [5, 4, 5, 6, 4, 5];
  completedCycles.forEach((cycle, i) => {
    const start = parseISODate(cycle.startDate);
    for (let d = 0; d < periodLengths[i]; d++) periodLogDates.push(formatISODate(addDays(start, d)));
  });

  // Symptom/mood/craving logs placed in the luteal window (days 17-28) of a subset of cycles.
  const symptomLogs: TaggedLogEntry[] = [];
  const moodLogs: TaggedLogEntry[] = [];
  completedCycles.forEach((cycle, i) => {
    const start = parseISODate(cycle.startDate);
    if (i < 4) symptomLogs.push({ date: formatISODate(addDays(start, 19)), key: "headache" }); // day 20, 4/6 cycles
    if ([0, 1, 2].includes(i)) symptomLogs.push({ date: formatISODate(addDays(start, 5)), key: "cramps" }); // day 6, 3/6
    if ([0, 1, 3, 4].includes(i)) moodLogs.push({ date: formatISODate(addDays(start, 21)), key: "stressed" }); // day 22, 4/6
    if ([0, 2, 4, 5].includes(i)) moodLogs.push({ date: formatISODate(addDays(start, 3)), key: "calm" }); // day 4, 4/6
    if ([1, 3, 5].includes(i)) symptomLogs.push({ date: formatISODate(addDays(start, 23)), key: "food_cravings" }); // day 24, 3/6
  });

  // Energy/sleep: a dip 2-3 days before each period, a rise around days 8-13, flat otherwise.
  const energyEntries: DailyMetricEntry[] = [];
  const sleepEntries: DailyMetricEntry[] = [];
  completedCycles.forEach((cycle) => {
    const start = parseISODate(cycle.startDate);
    for (let d = 0; d < cycle.cycleLengthDays; d++) {
      const day = d + 1;
      const date = formatISODate(addDays(start, d));
      const energy = day === 26 || day === 27 ? 2 : day >= 8 && day <= 13 ? 4 : 3;
      const sleep = day === 26 || day === 27 ? 2 : day >= 8 && day <= 13 ? 4 : 3;
      energyEntries.push({ date, value: energy });
      sleepEntries.push({ date, value: sleep });
    }
  });

  const cycleLength = analyzeCycleLengthTrend(completedCycles, today);
  const periodDuration = analyzePeriodDurationTrend(completedCycles, periodLogDates, today);
  const commonSymptoms = analyzeMostCommonSymptoms(
    symptomLogs.map((s) => ({ date: s.date, symptomKey: s.key })),
  ).map((s) => ({ key: s.key, label: SYMPTOM_LABEL_BY_KEY[s.key] ?? s.key, count: s.count }));
  const moodFrequency = analyzeMostCommonSymptoms(
    moodLogs.map((m) => ({ date: m.date, symptomKey: m.key })),
  ).map((m) => ({ key: m.key, label: MOOD_LABEL_BY_KEY[m.key] ?? m.key, count: m.count }));

  const symptomPhasePatterns = analyzeTaggedPatternsAllPhases(completedCycles, symptomLogs)
    .slice(0, 3)
    .map((p) => ({
      key: p.key,
      label: SYMPTOM_LABEL_BY_KEY[p.key] ?? p.key,
      phase: p.phase,
      phaseLabel: phasePhrase(p.phase),
      occurrences: p.occurrences,
      eligibleCycles: p.eligibleCycles,
      sentence: `You've noticed ${SYMPTOM_LABEL_BY_KEY[p.key]?.toLowerCase() ?? p.key} coming up during the ${phasePhrase(p.phase)} — ${p.occurrences} of your last ${p.eligibleCycles} cycles.`,
    }));

  const moodPatterns = analyzeTaggedPatternsAllPhases(completedCycles, moodLogs)
    .slice(0, 3)
    .map((p) => ({
      key: p.key,
      label: `feeling ${MOOD_LABEL_BY_KEY[p.key] ?? p.key}`,
      phase: p.phase,
      phaseLabel: phasePhrase(p.phase),
      occurrences: p.occurrences,
      eligibleCycles: p.eligibleCycles,
      sentence: `You've noticed feeling ${MOOD_LABEL_BY_KEY[p.key] ?? p.key} coming up during the ${phasePhrase(p.phase)} — ${p.occurrences} of your last ${p.eligibleCycles} cycles.`,
    }));

  const cravingPatterns = analyzeTaggedPatternsAllPhases(
    completedCycles,
    symptomLogs.filter((s) => s.key === "food_cravings"),
  ).map((p) => ({
    key: p.key,
    label: "cravings",
    phase: p.phase,
    phaseLabel: phasePhrase(p.phase),
    occurrences: p.occurrences,
    eligibleCycles: p.eligibleCycles,
    sentence: `You've noticed cravings coming up during the ${phasePhrase(p.phase)} — ${p.occurrences} of your last ${p.eligibleCycles} cycles.`,
  }));

  const energy = analyzeEnergyPatterns(completedCycles, energyEntries);
  const sleep = analyzeSleepPatterns(completedCycles, sleepEntries);

  const data: MyPatternsData = {
    cycleLength,
    periodDuration,
    commonSymptoms,
    moodFrequency,
    moodPatterns,
    energy,
    sleep,
    symptomPhasePatterns,
    cravingPatterns,
    hasAnyData: true,
  };

  return <MyPatternsView data={data} />;
}

import { diffDays, parseISODate } from "@/lib/cycle-engine";
import type { PregnancySymptomKey } from "@/types/database";

export interface DailyMetricEntry {
  logDate: string;
  value: number;
}

export interface SymptomLogEntry {
  logDate: string;
  symptomKey: PregnancySymptomKey;
}

export interface PatternSentence {
  key: string;
  sentence: string;
}

const MIN_DAYS_FOR_TREND = 3;
const MIN_SYMPTOM_OCCURRENCES = 2;
const TREND_WINDOW_DAYS = 7;
const MEANINGFUL_DIFFERENCE = 0.5;

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compares the trailing 7 days to the 7 days before that. Only speaks up
 * when both windows have enough data points and the difference is large
 * enough to be worth mentioning — never infers a cause, only reports the
 * comparison itself.
 */
function analyzeTrend(entries: DailyMetricEntry[], todayISO: string, key: string, label: string): PatternSentence | null {
  const today = parseISODate(todayISO);

  const thisWeek: number[] = [];
  const lastWeek: number[] = [];

  for (const entry of entries) {
    const daysAgo = diffDays(today, parseISODate(entry.logDate));
    if (daysAgo >= 0 && daysAgo < TREND_WINDOW_DAYS) thisWeek.push(entry.value);
    else if (daysAgo >= TREND_WINDOW_DAYS && daysAgo < TREND_WINDOW_DAYS * 2) lastWeek.push(entry.value);
  }

  if (thisWeek.length < MIN_DAYS_FOR_TREND || lastWeek.length < MIN_DAYS_FOR_TREND) return null;

  const diff = average(thisWeek) - average(lastWeek);
  if (Math.abs(diff) < MEANINGFUL_DIFFERENCE) return null;

  return {
    key,
    sentence: `Your ${label} has generally felt a bit ${diff > 0 ? "higher" : "lower"} this week than last week.`,
  };
}

export function analyzeEnergyTrend(entries: DailyMetricEntry[], todayISO: string): PatternSentence | null {
  return analyzeTrend(entries, todayISO, "energy_trend", "energy");
}

export function analyzeSleepTrend(entries: DailyMetricEntry[], todayISO: string): PatternSentence | null {
  return analyzeTrend(entries, todayISO, "sleep_trend", "sleep");
}

export function analyzeSymptomFrequency(
  logs: SymptomLogEntry[],
  todayISO: string,
  windowDays: number,
  labels: Record<PregnancySymptomKey, string>,
): PatternSentence[] {
  const today = parseISODate(todayISO);
  const counts = new Map<PregnancySymptomKey, number>();

  for (const log of logs) {
    const daysAgo = diffDays(today, parseISODate(log.logDate));
    if (daysAgo < 0 || daysAgo >= windowDays) continue;
    counts.set(log.symptomKey, (counts.get(log.symptomKey) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= MIN_SYMPTOM_OCCURRENCES)
    .sort((a, b) => b[1] - a[1])
    .map(([symptomKey, count]) => ({
      key: `symptom_${symptomKey}`,
      sentence: `You've noticed ${labels[symptomKey].toLowerCase()} coming up on ${count} of your last ${windowDays} days.`,
    }));
}

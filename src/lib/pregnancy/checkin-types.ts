import type { Mood, PregnancySymptomKey, PregnancySymptomSeverity } from "@/types/database";

export interface PregnancyCheckinFormValues {
  logDate: string;
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  hydrationLevel: number | null;
  appetiteLevel: number | null;
  symptoms: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>>;
  notes: string;
}

export function emptyPregnancyCheckinFormValues(logDate: string): PregnancyCheckinFormValues {
  return {
    logDate,
    mood: [],
    energyLevel: null,
    sleepQuality: null,
    hydrationLevel: null,
    appetiteLevel: null,
    symptoms: {},
    notes: "",
  };
}

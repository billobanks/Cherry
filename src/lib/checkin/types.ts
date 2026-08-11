import type {
  CheckinFlow,
  DischargeType,
  ExerciseIntensity,
  Mood,
} from "@/types/database";

/** The editable shape of a single day's check-in — everything optional except the date. */
export interface CheckinFormValues {
  checkinDate: string; // ISO yyyy-mm-dd
  flow: CheckinFlow | null;
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  painSeverity: number | null;
  symptomKeys: string[];
  discharge: DischargeType | null;
  exercise: ExerciseIntensity | null;
  libido: number | null;
  notes: string;
}

export function emptyCheckinFormValues(checkinDate: string): CheckinFormValues {
  return {
    checkinDate,
    flow: null,
    mood: [],
    energyLevel: null,
    sleepQuality: null,
    painSeverity: null,
    symptomKeys: [],
    discharge: null,
    exercise: null,
    libido: null,
    notes: "",
  };
}

/** A compact row for the recent-entries list — enough to summarize without a second round trip. */
export interface CheckinSummary {
  checkinDate: string;
  flow: CheckinFlow | null;
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  symptomCount: number;
  hasNotes: boolean;
}

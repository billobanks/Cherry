import type { CyclePhase, ISODateString } from "@/lib/cycle-engine";
import type { CheckinFlow, Mood } from "@/types/database";

export interface CalendarDayCell {
  date: ISODateString;
  isCurrentMonth: boolean;
  isToday: boolean;
  cycleDay: number | null;
  phase: CyclePhase | null;
  loggedFlow: CheckinFlow | null;
  /** A period day the model expects but that hasn't happened (or been logged) yet. */
  isPredictedPeriod: boolean;
  hasSymptoms: boolean;
  hasMood: boolean;
  hasIntercourse: boolean;
}

export interface CalendarSymptomEntry {
  key: string;
  label: string;
}

export interface CalendarDayDetail {
  date: ISODateString;
  cycleDay: number | null;
  phase: CyclePhase | null;
  phaseLabel: string | null;
  isPredictedPeriod: boolean;
  loggedFlow: CheckinFlow | null;
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  symptoms: CalendarSymptomEntry[];
  notes: string | null;
  dailyInsight: string | null;
  intercourse: boolean | null;
  hasCheckin: boolean;
}

export interface CalendarMonthData {
  year: number;
  month: number;
  monthLabel: string;
  today: ISODateString;
  cells: CalendarDayCell[];
  details: Record<ISODateString, CalendarDayDetail>;
  fertilityTrackingEnabled: boolean;
}

import type { CheckinFlow, CycleSource, NotificationCategory } from "@/types/database";

export interface DataOverview {
  memberSince: string;
  cyclesLogged: number;
  checkinsLogged: number;
  symptomsLoggedTotal: number;
  assistantMessages: number;
  hasStripeCustomer: boolean;
  pregnancyCheckinsLogged: number;
}

export interface CycleEntrySummary {
  id: string;
  startDate: string;
  endDate: string | null;
  periodLengthDays: number | null;
  cycleLengthDays: number | null;
  source: CycleSource;
}

export interface CheckinEntrySummary {
  checkinDate: string;
  flow: CheckinFlow | null;
  symptomCount: number;
  hasNotes: boolean;
}

export interface NotificationPreferenceRow {
  category: NotificationCategory;
  enabled: boolean;
}

/**
 * Hand-authored to match the migrations under supabase/migrations/.
 * Once the project is linked, regenerate with:
 *   supabase gen types typescript --linked > src/types/database.ts
 * and fold any future migrations' tables in here.
 */

import type { CyclePhase } from "@/lib/cycle-engine";

export type InsightSectionKey =
  | "body_overview"
  | "hormonal_changes"
  | "energy"
  | "mood"
  | "skin"
  | "digestion"
  | "appetite_and_cravings"
  | "sleep"
  | "exercise"
  | "nutrition"
  | "self_care"
  | "symptoms_to_monitor"
  | "professional_guidance";

export type InsightFeedbackResponse = "yes" | "no" | "a_little";

export type PrimaryFocus =
  | "track_cycle"
  | "understand_symptoms"
  | "energy_sleep_mood"
  | "fertility_awareness"
  | "exploring";

export type CycleRegularity =
  | "regular"
  | "somewhat_irregular"
  | "irregular"
  | "not_sure";

export type Goal =
  | "understand_cycle"
  | "predict_period"
  | "understand_pms"
  | "improve_energy"
  | "improve_sleep"
  | "understand_mood"
  | "nutrition_guidance"
  | "exercise_guidance"
  | "track_symptoms"
  | "fertility_awareness";

export type FlowIntensity = "spotting" | "light" | "medium" | "heavy";
export type CycleSource = "logged" | "predicted";
export type NotificationChannel = "email" | "push";
export type NotificationCategory =
  | "daily_checkin_reminder"
  | "period_prediction"
  | "insight_digest"
  | "product_updates";

interface ProfilesTable {
  Row: {
    id: string;
    display_name: string | null;
    primary_focus: PrimaryFocus | null;
    last_period_start_date: string | null;
    avg_cycle_length_days: number | null;
    avg_period_length_days: number | null;
    cycle_regularity: CycleRegularity | null;
    goals: Goal[];
    onboarding_completed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    display_name?: string | null;
    primary_focus?: PrimaryFocus | null;
    last_period_start_date?: string | null;
    avg_cycle_length_days?: number | null;
    avg_period_length_days?: number | null;
    cycle_regularity?: CycleRegularity | null;
    goals?: Goal[];
    onboarding_completed_at?: string | null;
  };
  Update: Partial<ProfilesTable["Insert"]>;
  Relationships: [];
}

interface SymptomCatalogTable {
  Row: {
    id: string;
    key: string;
    label: string;
    sort_order: number;
    is_active: boolean;
  };
  Insert: {
    id?: string;
    key: string;
    label: string;
    sort_order?: number;
    is_active?: boolean;
  };
  Update: Partial<SymptomCatalogTable["Insert"]>;
  Relationships: [];
}

interface ProfileCommonSymptomsTable {
  Row: {
    user_id: string;
    symptom_key: string;
    created_at: string;
  };
  Insert: {
    user_id: string;
    symptom_key: string;
  };
  Update: Partial<ProfileCommonSymptomsTable["Insert"]>;
  Relationships: [];
}

interface CyclesTable {
  Row: {
    id: string;
    user_id: string;
    start_date: string;
    end_date: string | null;
    cycle_length_days: number | null;
    period_length_days: number | null;
    source: CycleSource;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    start_date: string;
    end_date?: string | null;
    cycle_length_days?: number | null;
    period_length_days?: number | null;
    source?: CycleSource;
  };
  Update: Partial<CyclesTable["Insert"]>;
  Relationships: [];
}

interface PeriodDayLogsTable {
  Row: {
    id: string;
    user_id: string;
    cycle_id: string | null;
    log_date: string;
    flow_intensity: FlowIntensity | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    cycle_id?: string | null;
    log_date: string;
    flow_intensity?: FlowIntensity | null;
  };
  Update: Partial<PeriodDayLogsTable["Insert"]>;
  Relationships: [];
}

interface NotificationPreferencesTable {
  Row: {
    user_id: string;
    channel: NotificationChannel;
    category: NotificationCategory;
    enabled: boolean;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    channel: NotificationChannel;
    category: NotificationCategory;
    enabled?: boolean;
  };
  Update: Partial<NotificationPreferencesTable["Insert"]>;
  Relationships: [];
}

interface DailyInsightFeedbackTable {
  Row: {
    id: string;
    user_id: string;
    insight_date: string;
    cycle_phase: CyclePhase;
    section_key: InsightSectionKey;
    response: InsightFeedbackResponse;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    insight_date: string;
    cycle_phase: CyclePhase;
    section_key: InsightSectionKey;
    response: InsightFeedbackResponse;
  };
  Update: Partial<DailyInsightFeedbackTable["Insert"]>;
  Relationships: [];
}

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      profiles: ProfilesTable;
      symptom_catalog: SymptomCatalogTable;
      profile_common_symptoms: ProfileCommonSymptomsTable;
      cycles: CyclesTable;
      period_day_logs: PeriodDayLogsTable;
      notification_preferences: NotificationPreferencesTable;
      daily_insight_feedback: DailyInsightFeedbackTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

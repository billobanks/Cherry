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
/** Check-in flow adds "none" on top of period_day_logs' FlowIntensity — "logged today, no flow." */
export type CheckinFlow = "none" | FlowIntensity;
export type Mood = "happy" | "calm" | "anxious" | "irritable" | "sad" | "emotional" | "stressed";
export type DischargeType =
  | "none"
  | "spotting"
  | "sticky"
  | "creamy"
  | "watery"
  | "egg_white"
  | "unusual";
export type ExerciseIntensity = "none" | "light" | "moderate" | "intense";
export type CycleSource = "logged" | "predicted";
export type DietaryPreference = "none" | "vegetarian" | "vegan" | "pescatarian";
export type MovementType =
  | "walking"
  | "yoga"
  | "stretching"
  | "strength_training"
  | "pilates"
  | "cycling"
  | "running"
  | "hiit"
  | "recovery_rest";
export type NotificationChannel = "email" | "push";
export type NotificationCategory =
  | "daily_checkin_reminder"
  | "period_prediction"
  | "insight_digest"
  | "product_updates";
export type SafetyRuleKey =
  | "heavy_bleeding"
  | "severe_or_worsening_pain"
  | "fainting"
  | "dizziness_with_heavy_bleeding"
  | "unusual_bleeding_pattern"
  | "prolonged_bleeding";
export type SafetyRuleSeverity = "routine" | "urgent";

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
    fertility_tracking_enabled: boolean;
    dietary_preference: DietaryPreference;
    food_allergies: string[];
    foods_to_avoid: string[];
    workout_preferences: MovementType[];
    is_admin: boolean;
    stripe_customer_id: string | null;
    personalization_enabled: boolean;
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
    fertility_tracking_enabled?: boolean;
    dietary_preference?: DietaryPreference;
    food_allergies?: string[];
    foods_to_avoid?: string[];
    workout_preferences?: MovementType[];
    is_admin?: boolean;
    stripe_customer_id?: string | null;
    personalization_enabled?: boolean;
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

interface DailyCheckinsTable {
  Row: {
    id: string;
    user_id: string;
    checkin_date: string;
    flow: CheckinFlow | null;
    mood: Mood[];
    energy_level: number | null;
    sleep_quality: number | null;
    pain_severity: number | null;
    discharge: DischargeType | null;
    exercise: ExerciseIntensity | null;
    libido: number | null;
    notes: string | null;
    intercourse: boolean | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    checkin_date: string;
    flow?: CheckinFlow | null;
    mood?: Mood[];
    energy_level?: number | null;
    sleep_quality?: number | null;
    pain_severity?: number | null;
    discharge?: DischargeType | null;
    exercise?: ExerciseIntensity | null;
    libido?: number | null;
    notes?: string | null;
    intercourse?: boolean | null;
  };
  Update: Partial<DailyCheckinsTable["Insert"]>;
  Relationships: [];
}

interface CheckinSymptomsTable {
  Row: {
    checkin_id: string;
    user_id: string;
    symptom_key: string;
  };
  Insert: {
    checkin_id: string;
    user_id: string;
    symptom_key: string;
  };
  Update: Partial<CheckinSymptomsTable["Insert"]>;
  Relationships: [];
}

interface SafetyRulesTable {
  Row: {
    rule_key: SafetyRuleKey;
    label: string;
    description: string;
    severity: SafetyRuleSeverity;
    message: string;
    active: boolean;
    params: Record<string, number | string | boolean>;
    updated_at: string;
    updated_by: string | null;
  };
  Insert: {
    rule_key: SafetyRuleKey;
    label: string;
    description: string;
    severity?: SafetyRuleSeverity;
    message: string;
    active?: boolean;
    params?: Record<string, number | string | boolean>;
    updated_by?: string | null;
  };
  Update: Partial<SafetyRulesTable["Insert"]>;
  Relationships: [];
}

export type AssistantMessageRole = "user" | "assistant";

interface AssistantMessagesTable {
  Row: {
    id: string;
    user_id: string;
    role: AssistantMessageRole;
    content: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    role: AssistantMessageRole;
    content: string;
  };
  Update: Partial<AssistantMessagesTable["Insert"]>;
  Relationships: [];
}

export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

interface SubscriptionsTable {
  Row: {
    id: string;
    user_id: string;
    stripe_customer_id: string;
    stripe_subscription_id: string | null;
    plan: SubscriptionPlan;
    status: SubscriptionStatus | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    stripe_customer_id: string;
    stripe_subscription_id?: string | null;
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
  };
  Update: Partial<SubscriptionsTable["Insert"]>;
  Relationships: [];
}

interface StripeWebhookEventsTable {
  Row: {
    id: string;
    type: string;
    processed_at: string;
  };
  Insert: {
    id: string;
    type: string;
  };
  Update: Partial<StripeWebhookEventsTable["Insert"]>;
  Relationships: [];
}

interface RateLimitHitsTable {
  Row: {
    id: string;
    bucket_key: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    bucket_key: string;
  };
  Update: Partial<RateLimitHitsTable["Insert"]>;
  Relationships: [];
}

interface AccountDeletionLogTable {
  Row: {
    id: string;
    deleted_user_id: string;
    deleted_at: string;
  };
  Insert: {
    id?: string;
    deleted_user_id: string;
  };
  Update: Partial<AccountDeletionLogTable["Insert"]>;
  Relationships: [];
}

// ---------------------------------------------------------------------------
// Pregnancy Mode
// ---------------------------------------------------------------------------

export type PregnancyStatus = "PREGNANT" | "DELIVERED" | "PREGNANCY_ENDED" | "ARCHIVED";
export type DueDateSource = "LMP_ESTIMATE" | "ULTRASOUND" | "CLINICIAN" | "USER_ENTERED";
export type PregnancyFocusArea =
  | "understanding_body"
  | "fetal_development"
  | "nutrition"
  | "managing_discomforts"
  | "exercise_movement"
  | "sleep"
  | "emotional_wellbeing"
  | "appointments"
  | "birth_preparation"
  | "baby_preparation"
  | "all";
export type PregnancySymptomKey =
  | "nausea"
  | "vomiting"
  | "headache"
  | "heartburn"
  | "constipation"
  | "bloating"
  | "back_discomfort"
  | "pelvic_discomfort"
  | "cramping"
  | "breast_tenderness"
  | "swelling"
  | "shortness_of_breath"
  | "vaginal_discharge"
  | "spotting_bleeding"
  | "fetal_movement"
  | "contractions"
  | "fever"
  | "vision_changes"
  | "fluid_leaking"
  | "other";
export type PregnancySymptomSeverity = "mild" | "moderate" | "severe";
export type PregnancyMoodKey = Mood;
export type PregnancyDietaryPreference = "vegetarian" | "vegan" | "pescatarian" | "gluten_free" | "dairy_free";
export type PregnancyWeekSection =
  | "baby_development"
  | "body_changes"
  | "what_you_may_notice"
  | "nutrition"
  | "movement"
  | "self_care"
  | "questions_for_provider"
  | "coming_up";
export type ContentGovernanceStatus = "DRAFT" | "MEDICAL_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";
export type PregnancySafetySeverity = "routine" | "urgent";
export type Trimester = "first" | "second" | "third";
export type PregnancyNotificationCategory =
  | "weekly_milestone"
  | "appointment_reminder"
  | "daily_checkin_reminder"
  | "safety_follow_up";
export type NotificationPreviewDetail = "private" | "detailed";
export type DeliveryType = "vaginal" | "cesarean" | "other";
export type ContractionIntensity = "mild" | "moderate" | "strong";

interface PregnanciesTable {
  Row: {
    id: string;
    user_id: string;
    status: PregnancyStatus;
    last_menstrual_period: string | null;
    estimated_due_date: string | null;
    due_date_source: DueDateSource | null;
    clinician_due_date: string | null;
    ultrasound_due_date: string | null;
    date_pregnancy_confirmed: string | null;
    pregnancy_start_date: string | null;
    delivery_date: string | null;
    gestational_age_at_delivery_days: number | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    status?: PregnancyStatus;
    last_menstrual_period?: string | null;
    estimated_due_date?: string | null;
    due_date_source?: DueDateSource | null;
    clinician_due_date?: string | null;
    ultrasound_due_date?: string | null;
    date_pregnancy_confirmed?: string | null;
    pregnancy_start_date?: string | null;
    delivery_date?: string | null;
    gestational_age_at_delivery_days?: number | null;
  };
  Update: Partial<PregnanciesTable["Insert"]>;
  Relationships: [];
}

interface PregnancyProfilesTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    is_first_pregnancy: boolean | null;
    has_scheduled_prenatal_care: boolean | null;
    focus_areas: PregnancyFocusArea[];
    last_seen_gestational_week: number | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    is_first_pregnancy?: boolean | null;
    has_scheduled_prenatal_care?: boolean | null;
    focus_areas?: PregnancyFocusArea[];
    last_seen_gestational_week?: number | null;
  };
  Update: Partial<PregnancyProfilesTable["Insert"]>;
  Relationships: [];
}

interface PregnancyDailyLogsTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    log_date: string;
    energy_level: number | null;
    sleep_quality: number | null;
    hydration_level: number | null;
    appetite_level: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    log_date: string;
    energy_level?: number | null;
    sleep_quality?: number | null;
    hydration_level?: number | null;
    appetite_level?: number | null;
    notes?: string | null;
  };
  Update: Partial<PregnancyDailyLogsTable["Insert"]>;
  Relationships: [];
}

interface PregnancySymptomsTable {
  Row: {
    id: string;
    daily_log_id: string;
    user_id: string;
    symptom_key: PregnancySymptomKey;
    severity: PregnancySymptomSeverity | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    daily_log_id: string;
    user_id: string;
    symptom_key: PregnancySymptomKey;
    severity?: PregnancySymptomSeverity | null;
  };
  Update: Partial<PregnancySymptomsTable["Insert"]>;
  Relationships: [];
}

interface PregnancyMoodsTable {
  Row: {
    id: string;
    daily_log_id: string;
    user_id: string;
    mood_key: PregnancyMoodKey;
    created_at: string;
  };
  Insert: {
    id?: string;
    daily_log_id: string;
    user_id: string;
    mood_key: PregnancyMoodKey;
  };
  Update: Partial<PregnancyMoodsTable["Insert"]>;
  Relationships: [];
}

interface PregnancyNutritionPreferencesTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    dietary_preferences: PregnancyDietaryPreference[];
    cultural_preferences: string | null;
    food_allergies: string[];
    updated_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    dietary_preferences?: PregnancyDietaryPreference[];
    cultural_preferences?: string | null;
    food_allergies?: string[];
  };
  Update: Partial<PregnancyNutritionPreferencesTable["Insert"]>;
  Relationships: [];
}

interface PregnancyAppointmentsTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    appointment_date: string;
    appointment_time: string | null;
    provider_name: string | null;
    location: string | null;
    appointment_type: string | null;
    reminder_enabled: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    appointment_date: string;
    appointment_time?: string | null;
    provider_name?: string | null;
    location?: string | null;
    appointment_type?: string | null;
    reminder_enabled?: boolean;
  };
  Update: Partial<PregnancyAppointmentsTable["Insert"]>;
  Relationships: [];
}

interface PregnancyQuestionsTable {
  Row: {
    id: string;
    pregnancy_id: string;
    appointment_id: string | null;
    user_id: string;
    question: string;
    answered: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    appointment_id?: string | null;
    user_id: string;
    question: string;
    answered?: boolean;
  };
  Update: Partial<PregnancyQuestionsTable["Insert"]>;
  Relationships: [];
}

interface PregnancyNotesTable {
  Row: {
    id: string;
    pregnancy_id: string;
    appointment_id: string | null;
    user_id: string;
    note: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    appointment_id?: string | null;
    user_id: string;
    note: string;
  };
  Update: Partial<PregnancyNotesTable["Insert"]>;
  Relationships: [];
}

interface PregnancyWeekContentTable {
  Row: {
    id: string;
    week_number: number;
    section: PregnancyWeekSection;
    content: string;
    status: ContentGovernanceStatus;
    source: string | null;
    source_url: string | null;
    medical_reviewer: string | null;
    date_reviewed: string | null;
    content_version: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    week_number: number;
    section: PregnancyWeekSection;
    content: string;
    status?: ContentGovernanceStatus;
    source?: string | null;
    source_url?: string | null;
    medical_reviewer?: string | null;
    date_reviewed?: string | null;
    content_version?: number;
  };
  Update: Partial<PregnancyWeekContentTable["Insert"]>;
  Relationships: [];
}

interface PregnancySafetyRulesTable {
  Row: {
    rule_key: string;
    label: string;
    description: string;
    severity: PregnancySafetySeverity;
    message: string;
    active: boolean;
    params: Record<string, number | string | boolean>;
    updated_at: string;
    updated_by: string | null;
  };
  Insert: {
    rule_key: string;
    label: string;
    description: string;
    severity?: PregnancySafetySeverity;
    message: string;
    active?: boolean;
    params?: Record<string, number | string | boolean>;
    updated_by?: string | null;
  };
  Update: Partial<PregnancySafetyRulesTable["Insert"]>;
  Relationships: [];
}

interface PregnancyInsightsTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    log_date: string;
    gestational_age_days: number;
    trimester: Trimester;
    created_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    log_date: string;
    gestational_age_days: number;
    trimester: Trimester;
  };
  Update: Partial<PregnancyInsightsTable["Insert"]>;
  Relationships: [];
}

interface PregnancyNotificationsTable {
  Row: {
    user_id: string;
    category: PregnancyNotificationCategory;
    enabled: boolean;
    preview_detail: NotificationPreviewDetail;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    category: PregnancyNotificationCategory;
    enabled?: boolean;
    preview_detail?: NotificationPreviewDetail;
  };
  Update: Partial<PregnancyNotificationsTable["Insert"]>;
  Relationships: [];
}

interface PregnancyBirthPreferencesTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    preferences: Record<string, unknown>;
    notes: string | null;
    updated_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    preferences?: Record<string, unknown>;
    notes?: string | null;
  };
  Update: Partial<PregnancyBirthPreferencesTable["Insert"]>;
  Relationships: [];
}

interface ContractionLogsTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    started_at: string;
    ended_at: string | null;
    intensity: ContractionIntensity | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    started_at: string;
    ended_at?: string | null;
    intensity?: ContractionIntensity | null;
  };
  Update: Partial<ContractionLogsTable["Insert"]>;
  Relationships: [];
}

interface DeliveryRecordsTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    delivery_date: string;
    delivery_time: string | null;
    delivery_type: DeliveryType | null;
    location: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    delivery_date: string;
    delivery_time?: string | null;
    delivery_type?: DeliveryType | null;
    location?: string | null;
    notes?: string | null;
  };
  Update: Partial<DeliveryRecordsTable["Insert"]>;
  Relationships: [];
}

export type PregnancyChecklistItemKey =
  | "schedule_prenatal_care"
  | "review_medications_with_clinician"
  | "review_prenatal_nutrition"
  | "review_food_safety"
  | "record_clinician_due_date"
  | "prepare_first_appointment_questions";

interface PregnancyChecklistItemsTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    item_key: PregnancyChecklistItemKey;
    completed_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    item_key: PregnancyChecklistItemKey;
  };
  Update: Partial<PregnancyChecklistItemsTable["Insert"]>;
  Relationships: [];
}

interface PregnancySavedWeeksTable {
  Row: {
    id: string;
    pregnancy_id: string;
    user_id: string;
    week_number: number;
    saved_at: string;
  };
  Insert: {
    id?: string;
    pregnancy_id: string;
    user_id: string;
    week_number: number;
  };
  Update: Partial<PregnancySavedWeeksTable["Insert"]>;
  Relationships: [];
}

interface PregnancyAssistantMessagesTable {
  Row: {
    id: string;
    user_id: string;
    role: AssistantMessageRole;
    content: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    role: AssistantMessageRole;
    content: string;
  };
  Update: Partial<PregnancyAssistantMessagesTable["Insert"]>;
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
      daily_checkins: DailyCheckinsTable;
      checkin_symptoms: CheckinSymptomsTable;
      safety_rules: SafetyRulesTable;
      assistant_messages: AssistantMessagesTable;
      subscriptions: SubscriptionsTable;
      stripe_webhook_events: StripeWebhookEventsTable;
      rate_limit_hits: RateLimitHitsTable;
      account_deletion_log: AccountDeletionLogTable;
      pregnancies: PregnanciesTable;
      pregnancy_profiles: PregnancyProfilesTable;
      pregnancy_daily_logs: PregnancyDailyLogsTable;
      pregnancy_symptoms: PregnancySymptomsTable;
      pregnancy_moods: PregnancyMoodsTable;
      pregnancy_nutrition_preferences: PregnancyNutritionPreferencesTable;
      pregnancy_appointments: PregnancyAppointmentsTable;
      pregnancy_questions: PregnancyQuestionsTable;
      pregnancy_notes: PregnancyNotesTable;
      pregnancy_week_content: PregnancyWeekContentTable;
      pregnancy_safety_rules: PregnancySafetyRulesTable;
      pregnancy_insights: PregnancyInsightsTable;
      pregnancy_notifications: PregnancyNotificationsTable;
      pregnancy_birth_preferences: PregnancyBirthPreferencesTable;
      contraction_logs: ContractionLogsTable;
      delivery_records: DeliveryRecordsTable;
      pregnancy_checklist_items: PregnancyChecklistItemsTable;
      pregnancy_saved_weeks: PregnancySavedWeeksTable;
      pregnancy_assistant_messages: PregnancyAssistantMessagesTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

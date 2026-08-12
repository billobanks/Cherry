"use server";

import { createClient } from "@/lib/supabase/server";
import { calculatePregnancyDating } from "./dating-engine";
import { getActivePregnancy } from "./pregnancy-lookup";
import { TRIMESTER_GUIDANCE } from "./trimester-content";
import { getPublishedWeekContent } from "./week-content-actions";

export interface WeeklyWelcomeSummary {
  weekNumber: number;
  babyDevelopment: string;
  bodyChanges: string;
}

export type GetWeeklyWelcomeResult =
  | { status: "ready"; show: false }
  | { status: "ready"; show: true; summary: WeeklyWelcomeSummary }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

/**
 * Shows the "Welcome to Week X" screen at most once per gestational week —
 * tracked via `pregnancy_profiles.last_seen_gestational_week`, advanced by
 * `markWeeklyWelcomeSeen` once the user has actually seen it (not just
 * fetched it, so a page refresh before dismissal doesn't silently skip it).
 */
export async function getWeeklyWelcome(): Promise<GetWeeklyWelcomeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  let gestationalAgeWeeks: number;
  let guidance: (typeof TRIMESTER_GUIDANCE)[keyof typeof TRIMESTER_GUIDANCE];
  try {
    const dating = calculatePregnancyDating({
      lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
      clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
      ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
      userEnteredDueDate: pregnancy.estimatedDueDate,
    });
    gestationalAgeWeeks = dating.gestationalAgeWeeks;
    guidance = TRIMESTER_GUIDANCE[dating.currentTrimester];
  } catch {
    return { status: "error", message: "We couldn't calculate your pregnancy timeline." };
  }

  const { data: profile } = await supabase
    .from("pregnancy_profiles")
    .select("last_seen_gestational_week")
    .eq("pregnancy_id", pregnancy.id)
    .maybeSingle();

  if (profile?.last_seen_gestational_week === gestationalAgeWeeks) {
    return { status: "ready", show: false };
  }

  const weekContent = await getPublishedWeekContent(gestationalAgeWeeks);

  return {
    status: "ready",
    show: true,
    summary: {
      weekNumber: gestationalAgeWeeks,
      babyDevelopment: weekContent.baby_development ?? guidance.babyDevelopment,
      bodyChanges: weekContent.body_changes ?? guidance.bodyChanges,
    },
  };
}

export async function markWeeklyWelcomeSeen(weekNumber: number): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false };

  const { error } = await supabase
    .from("pregnancy_profiles")
    .update({ last_seen_gestational_week: weekNumber })
    .eq("pregnancy_id", pregnancy.id);

  return { success: !error };
}

export async function saveWeeklySummary(weekNumber: number): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false };

  const { error } = await supabase
    .from("pregnancy_saved_weeks")
    .upsert({ pregnancy_id: pregnancy.id, user_id: user.id, week_number: weekNumber }, { onConflict: "pregnancy_id,week_number" });

  return { success: !error };
}

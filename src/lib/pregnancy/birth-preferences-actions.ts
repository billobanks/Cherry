"use server";

import { createClient } from "@/lib/supabase/server";
import { calculatePregnancyDating } from "./dating-engine";
import { getActivePregnancy } from "./pregnancy-lookup";
import { getRevealedBirthPrepTopics, getUpcomingBirthPrepTopics, type BirthPrepTopic } from "./topic-disclosure";

export interface BirthPreferences {
  supportPeople: string;
  painManagement: string;
  environment: string;
  feedingPlan: string;
  notes: string;
}

const EMPTY_PREFERENCES: BirthPreferences = { supportPeople: "", painManagement: "", environment: "", feedingPlan: "", notes: "" };

export type GetBirthPreferencesResult =
  | { status: "ready"; preferences: BirthPreferences; revealedTopics: BirthPrepTopic[]; upcomingTopics: BirthPrepTopic[] }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" };

export async function getBirthPreferences(): Promise<GetBirthPreferencesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  let gestationalAgeWeeks = 0;
  try {
    gestationalAgeWeeks = calculatePregnancyDating({
      lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
      clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
      ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
      userEnteredDueDate: pregnancy.estimatedDueDate,
    }).gestationalAgeWeeks;
  } catch {
    gestationalAgeWeeks = 0;
  }

  const revealedTopics = getRevealedBirthPrepTopics(gestationalAgeWeeks);
  const upcomingTopics = getUpcomingBirthPrepTopics(gestationalAgeWeeks);

  const { data } = await supabase
    .from("pregnancy_birth_preferences")
    .select("preferences, notes")
    .eq("pregnancy_id", pregnancy.id)
    .maybeSingle();

  if (!data) return { status: "ready", preferences: EMPTY_PREFERENCES, revealedTopics, upcomingTopics };

  const stored = data.preferences as Partial<BirthPreferences>;
  return {
    status: "ready",
    preferences: {
      supportPeople: stored.supportPeople ?? "",
      painManagement: stored.painManagement ?? "",
      environment: stored.environment ?? "",
      feedingPlan: stored.feedingPlan ?? "",
      notes: data.notes ?? "",
    },
    revealedTopics,
    upcomingTopics,
  };
}

export async function updateBirthPreferences(input: BirthPreferences): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { success: false, message: "No active pregnancy found." };

  const { error } = await supabase.from("pregnancy_birth_preferences").upsert(
    {
      pregnancy_id: pregnancy.id,
      user_id: user.id,
      preferences: {
        supportPeople: input.supportPeople,
        painManagement: input.painManagement,
        environment: input.environment,
        feedingPlan: input.feedingPlan,
      },
      notes: input.notes || null,
    },
    { onConflict: "pregnancy_id" },
  );

  return error ? { success: false, message: "Couldn't save your birth preferences." } : { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import type { PregnancyFocusArea } from "@/types/database";
import { calculatePregnancyDating, PregnancyDatingError } from "./dating-engine";

export interface ActivatePregnancyInput {
  hadPositiveTest: boolean | null;
  lastMenstrualPeriodDate: string | null;
  clinicianProvidedDueDate: boolean | null;
  clinicianDueDate: string | null;
  isFirstPregnancy: boolean | null;
  hasScheduledPrenatalCare: boolean | null;
  focusAreas: PregnancyFocusArea[];
}

export type ActivatePregnancyResult =
  | { status: "ready"; pregnancyId: string }
  | { status: "signed_out" }
  | { status: "needs_dating_info" }
  | { status: "error"; message: string };

/**
 * Activation is purely a self-report — the app never determines pregnancy
 * on its own. This just records what the user told us and runs the
 * deterministic dating engine once, at creation time.
 */
export async function activatePregnancy(input: ActivatePregnancyInput): Promise<ActivatePregnancyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const clinicianDueDate = input.clinicianProvidedDueDate ? input.clinicianDueDate : null;

  if (!input.lastMenstrualPeriodDate && !clinicianDueDate) {
    return { status: "needs_dating_info" };
  }

  let dating;
  try {
    dating = calculatePregnancyDating({
      lastMenstrualPeriodDate: input.lastMenstrualPeriodDate,
      clinicianEstimatedDueDate: clinicianDueDate,
    });
  } catch (err) {
    if (err instanceof PregnancyDatingError) return { status: "needs_dating_info" };
    return { status: "error", message: "We couldn't calculate your pregnancy dates." };
  }

  const { data: pregnancy, error } = await supabase
    .from("pregnancies")
    .insert({
      user_id: user.id,
      status: "PREGNANT",
      last_menstrual_period: input.lastMenstrualPeriodDate,
      estimated_due_date: dating.estimatedDueDate,
      due_date_source: dating.dueDateSource,
      clinician_due_date: clinicianDueDate,
      date_pregnancy_confirmed: input.hadPositiveTest ? dating.estimatedDueDate : null,
      pregnancy_start_date: input.lastMenstrualPeriodDate,
    })
    .select("id")
    .single();

  if (error || !pregnancy) {
    return { status: "error", message: "Couldn't start Pregnancy Mode — please try again." };
  }

  await supabase.from("pregnancy_profiles").insert({
    pregnancy_id: pregnancy.id,
    user_id: user.id,
    is_first_pregnancy: input.isFirstPregnancy,
    has_scheduled_prenatal_care: input.hasScheduledPrenatalCare,
    focus_areas: input.focusAreas,
  });

  return { status: "ready", pregnancyId: pregnancy.id };
}

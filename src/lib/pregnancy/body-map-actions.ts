"use server";

import { createClient } from "@/lib/supabase/server";
import type { Trimester } from "@/types/database";
import { calculatePregnancyDating } from "./dating-engine";
import { getActivePregnancy } from "./pregnancy-lookup";

export type GetBodyMapContextResult =
  | { status: "ready"; gestationalAgeWeeks: number; trimester: Trimester }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" };

/** Just enough context (current week) to frame the body-map content — the content itself is a static, reviewed-in-spirit lookup by body area. */
export async function getBodyMapContext(): Promise<GetBodyMapContextResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const dating = calculatePregnancyDating({
    lastMenstrualPeriodDate: pregnancy.lastMenstrualPeriod,
    clinicianEstimatedDueDate: pregnancy.clinicianDueDate,
    ultrasoundEstimatedDueDate: pregnancy.ultrasoundDueDate,
    userEnteredDueDate: pregnancy.estimatedDueDate,
  });

  return { status: "ready", gestationalAgeWeeks: dating.gestationalAgeWeeks, trimester: dating.currentTrimester };
}

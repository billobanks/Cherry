import type { createClient } from "@/lib/supabase/server";
import type { DueDateSource, PregnancyStatus } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export interface ActivePregnancy {
  id: string;
  lastMenstrualPeriod: string | null;
  estimatedDueDate: string | null;
  dueDateSource: DueDateSource | null;
  clinicianDueDate: string | null;
  ultrasoundDueDate: string | null;
  status: PregnancyStatus;
}

/**
 * The user's current pregnancy, if any. "Current" means status = PREGNANT —
 * delivered/ended/archived pregnancies are historical records, not the
 * active one the rest of Pregnancy Mode reads from.
 */
export async function getActivePregnancy(supabase: Supabase, userId: string): Promise<ActivePregnancy | null> {
  const { data } = await supabase
    .from("pregnancies")
    .select(
      "id, last_menstrual_period, estimated_due_date, due_date_source, clinician_due_date, ultrasound_due_date, status",
    )
    .eq("user_id", userId)
    .eq("status", "PREGNANT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    lastMenstrualPeriod: data.last_menstrual_period,
    estimatedDueDate: data.estimated_due_date,
    dueDateSource: data.due_date_source,
    clinicianDueDate: data.clinician_due_date,
    ultrasoundDueDate: data.ultrasound_due_date,
    status: data.status,
  };
}

/**
 * The user's most recent pregnancy regardless of status — used only where
 * the caller specifically needs to distinguish "never pregnant" from
 * "pregnancy exists but isn't active anymore" (delivered, ended, archived),
 * e.g. routing the dashboard to the right view. Everything else should use
 * `getActivePregnancy` above.
 */
export async function getMostRecentPregnancy(supabase: Supabase, userId: string): Promise<ActivePregnancy | null> {
  const { data } = await supabase
    .from("pregnancies")
    .select(
      "id, last_menstrual_period, estimated_due_date, due_date_source, clinician_due_date, ultrasound_due_date, status",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    lastMenstrualPeriod: data.last_menstrual_period,
    estimatedDueDate: data.estimated_due_date,
    dueDateSource: data.due_date_source,
    clinicianDueDate: data.clinician_due_date,
    ultrasoundDueDate: data.ultrasound_due_date,
    status: data.status,
  };
}

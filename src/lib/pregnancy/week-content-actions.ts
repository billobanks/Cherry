"use server";

import { createClient } from "@/lib/supabase/server";
import type { PregnancyWeekSection } from "@/types/database";

/**
 * Only ever selects status = 'PUBLISHED' — this is the one place unreviewed
 * (DRAFT/MEDICAL_REVIEW/APPROVED/RETIRED) pregnancy content is guaranteed to
 * never reach an end user, enforced in the query itself, not just by
 * convention.
 */
export async function getPublishedWeekContent(weekNumber: number): Promise<Partial<Record<PregnancyWeekSection, string>>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pregnancy_week_content")
    .select("section, content")
    .eq("week_number", weekNumber)
    .eq("status", "PUBLISHED");

  const result: Partial<Record<PregnancyWeekSection, string>> = {};
  for (const row of data ?? []) {
    result[row.section] = row.content;
  }
  return result;
}

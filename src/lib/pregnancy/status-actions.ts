"use server";

import { createClient } from "@/lib/supabase/server";
import { getActivePregnancy } from "./pregnancy-lookup";

export type EndPregnancyResult =
  | { status: "ready" }
  | { status: "signed_out" }
  | { status: "no_active_pregnancy" }
  | { status: "error"; message: string };

/**
 * For pregnancy loss. Deliberately minimal — a status change and nothing
 * else. No form asking for a reason, no follow-up prompts. Once set, every
 * milestone/celebratory surface in the app stops showing for this
 * pregnancy: see the dashboard action's status branch and
 * pregnancy_notifications, which this does not touch but which reads
 * status before sending anything.
 */
export async function endPregnancy(): Promise<EndPregnancyResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const pregnancy = await getActivePregnancy(supabase, user.id);
  if (!pregnancy) return { status: "no_active_pregnancy" };

  const { error } = await supabase
    .from("pregnancies")
    .update({ status: "PREGNANCY_ENDED" })
    .eq("id", pregnancy.id)
    .eq("user_id", user.id);

  return error ? { status: "error", message: "Couldn't update your pregnancy status — please try again." } : { status: "ready" };
}

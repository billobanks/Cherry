"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteCycleEntry(cycleId: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase.from("cycles").delete().eq("id", cycleId).eq("user_id", user.id);

  return error ? { success: false, message: "Couldn't delete that entry." } : { success: true };
}

export async function deleteCheckinEntry(checkinDate: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  // checkin_symptoms rows cascade-delete with their parent daily_checkins row.
  const { error } = await supabase
    .from("daily_checkins")
    .delete()
    .eq("checkin_date", checkinDate)
    .eq("user_id", user.id);

  return error ? { success: false, message: "Couldn't delete that entry." } : { success: true };
}

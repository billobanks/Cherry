"use server";

import { createClient } from "@/lib/supabase/server";

export interface AccountData {
  displayName: string | null;
  email: string | null;
}

export type GetAccountResult = { status: "ready"; account: AccountData } | { status: "signed_out" };

export async function getAccount(): Promise<GetAccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();

  return { status: "ready", account: { displayName: profile?.display_name ?? null, email: user.email ?? null } };
}

export async function updateDisplayName(displayName: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Please sign in." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName.trim() || null })
    .eq("id", user.id);

  return error ? { success: false, message: "Couldn't save your name." } : { success: true };
}

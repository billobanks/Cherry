import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type RequireAdminResult =
  | { ok: true; supabase: Supabase; userId: string }
  | { ok: false; reason: "signed_out" | "forbidden" };

/** Shared admin gate for new admin modules — verifies profiles.is_admin server-side before any admin data is read or written. */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "signed_out" };

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { ok: false, reason: "forbidden" };

  return { ok: true, supabase, userId: user.id };
}

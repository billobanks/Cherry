import { createClient } from "@/lib/supabase/client";

/** Client-only: kicks off the Google OAuth redirect for a returning user logging in (as opposed to onboarding's signup flow). */
export async function signInWithGoogleForLogin() {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/login/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
}

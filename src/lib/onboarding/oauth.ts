import { createClient } from "@/lib/supabase/client";

/** Client-only: kicks off the Google OAuth redirect. Draft answers must already be in sessionStorage. */
export async function signInWithGoogle() {
  const supabase = createClient();
  const redirectTo = `${window.location.origin}/onboarding/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuth PKCE callback for the onboarding→signup flow: exchange the
 * code for a session, then hand back to /signup (not /onboarding — account
 * creation lives there now, separate from the answer-collecting wizard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/signup?oauth=1`);
    }
  }

  return NextResponse.redirect(`${origin}/signup?oauthError=1`);
}

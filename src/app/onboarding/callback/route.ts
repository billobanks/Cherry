import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Google OAuth PKCE callback: exchange the code for a session, then hand back to the wizard. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/onboarding?oauth=1`);
    }
  }

  return NextResponse.redirect(`${origin}/onboarding?oauthError=1`);
}

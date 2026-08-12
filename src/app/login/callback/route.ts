import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Google OAuth PKCE callback for a returning user logging in — exchange the code for a session, then go straight to the app. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/app/today`);
    }
  }

  return NextResponse.redirect(`${origin}/login?oauthError=1`);
}

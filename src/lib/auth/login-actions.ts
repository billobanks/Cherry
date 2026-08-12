"use server";

import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginResult =
  | { status: "ready" }
  | { status: "error"; message: string; field?: "email" | "password" };

export async function logIn(input: { email: string; password: string }): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: issue?.message ?? "Check your details and try again.",
      field: issue?.path[0] === "email" ? "email" : "password",
    };
  }

  const rateLimit = await checkRateLimit("logIn", parsed.data.email);
  if (!rateLimit.allowed) {
    return { status: "error", message: "Too many attempts — please wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: "That email and password don't match — try again." };
  }

  return { status: "ready" };
}

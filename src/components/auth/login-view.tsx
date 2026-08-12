"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { signInWithGoogleForLogin } from "@/lib/auth/oauth";
import type { LoginResult } from "@/lib/auth/login-actions";

export function LoginView({ onLogIn }: { onLogIn: (input: { email: string; password: string }) => Promise<LoginResult> }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field?: "email" | "password" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauthError") === "1") {
      toast.error("Google sign-in didn't go through — try again, or use email.");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await onLogIn({ email, password });
      if (result.status === "error") {
        setError({ message: result.message, field: result.field });
        toast.error(result.message);
        return;
      }
      router.push("/app/today");
      router.refresh();
    });
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogleForLogin();
    } catch {
      setIsGoogleLoading(false);
      toast.error("Couldn't reach Google — check your connection and try again.");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-12">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Cherry</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Welcome back</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Log in to pick up where you left off.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-2 w-full rounded-xl border bg-secondary/40 px-3.5 py-2.5 text-[15px] outline-none focus:border-primary ${
              error?.field === "email" ? "border-destructive" : "border-border"
            }`}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-2 w-full rounded-xl border bg-secondary/40 px-3.5 py-2.5 text-[15px] outline-none focus:border-primary ${
              error?.field === "password" ? "border-destructive" : "border-border"
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !email || !password}
          className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="flex h-12 w-full items-center justify-center rounded-full border border-border text-[15px] font-medium text-foreground disabled:opacity-60"
      >
        {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
      </button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Cherry?{" "}
        <Link href="/onboarding" className="font-medium text-primary underline">
          Get started
        </Link>
      </p>
    </div>
  );
}

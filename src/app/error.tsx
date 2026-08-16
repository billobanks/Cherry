"use client";

import { useEffect } from "react";

/**
 * Catches any unhandled exception thrown while rendering a route segment
 * (a failed data fetch, a schema mismatch, etc.) and shows something
 * recoverable instead of the bare Next.js crash screen. `error.digest` is
 * the one thing safe to show a user — the full message/stack can leak
 * internal details, so it's logged server-side only.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-medium text-balance">Something went wrong</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">
        This page hit an unexpected error. Trying again usually fixes it — if it keeps happening, let us know.
      </p>
      {error.digest ? <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p> : null}
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}

"use client";

import { useEffect } from "react";

/** Catches errors thrown by the root layout itself (rare) — must render its own <html>/<body> since it replaces the layout entirely. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-medium text-balance">Something went wrong</h1>
          <p className="text-[15px] leading-relaxed text-gray-500 text-pretty">
            The app hit an unexpected error loading. Trying again usually fixes it.
          </p>
          {error.digest ? <p className="font-mono text-xs text-gray-500">Reference: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

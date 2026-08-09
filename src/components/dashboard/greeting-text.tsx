"use client";

import { useEffect, useState } from "react";
import { greetingForHour } from "@/lib/dashboard";

/**
 * The greeting reflects the viewer's local time of day, which a Server
 * Component can't know (the server's clock could be in any timezone) — so
 * this renders a neutral fallback during SSR/hydration and swaps in the
 * real greeting on mount, same pattern as the onboarding draft hydration.
 */
export function GreetingText({ displayName }: { displayName: string | null }) {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    // The viewer's local hour is only knowable client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  const name = displayName ? `, ${displayName}` : "";

  return (
    <p className="text-center font-heading text-xl font-medium text-balance">
      {greeting ?? "Hello"}
      {name}
    </p>
  );
}

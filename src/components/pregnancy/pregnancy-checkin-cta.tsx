import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function PregnancyCheckinCta({ hasLoggedToday }: { hasLoggedToday: boolean }) {
  return (
    <Link
      href="/app/pregnancy/checkin"
      className="flex items-center justify-between gap-3 rounded-2xl bg-primary px-5 py-4 text-primary-foreground transition-opacity hover:opacity-90"
    >
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest opacity-80">
          Today&apos;s check-in
        </span>
        <p className="mt-1 font-heading text-lg font-medium">
          {hasLoggedToday ? "Update how you're feeling today" : "How are you feeling today?"}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0" />
    </Link>
  );
}

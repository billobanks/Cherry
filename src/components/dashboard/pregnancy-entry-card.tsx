import { Sparkles } from "lucide-react";
import Link from "next/link";

export function PregnancyEntryCard() {
  return (
    <Link
      href="/app/pregnancy/activate"
      className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-accent/40 px-4 py-4 transition-colors hover:border-primary/60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sparkles className="h-4.5 w-4.5" />
      </span>
      <span>
        <span className="block text-[15px] font-medium">I&apos;m pregnant</span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
          Switch to a week-by-week pregnancy companion.
        </span>
      </span>
    </Link>
  );
}

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function TodaysInsightCard({
  headline,
  explanation,
}: {
  headline: string;
  explanation: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
        Today&apos;s insight
      </span>
      <p className="mt-2 font-heading text-xl leading-snug font-medium text-balance">
        {headline}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{explanation}</p>
      <Link
        href="/app/insights"
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-opacity hover:opacity-70"
      >
        Learn more
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

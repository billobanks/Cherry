import { Sparkles } from "lucide-react";

export function InsightSentenceCard({
  sentence,
  dataPointLabel,
}: {
  sentence: string;
  dataPointLabel: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="text-sm leading-relaxed text-foreground">{sentence}</p>
        <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Based on {dataPointLabel}
        </span>
      </div>
    </div>
  );
}

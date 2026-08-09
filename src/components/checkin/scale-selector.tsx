"use client";

const SCALE = [1, 2, 3, 4, 5] as const;

export function ScaleSelector({
  label,
  value,
  onChange,
  scaleLabels,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  scaleLabels: string[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {value ? scaleLabels[value - 1] : "Not set"}
        </span>
      </div>
      <div className="mt-2 flex gap-2" role="group" aria-label={label}>
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${label}: ${n} — ${scaleLabels[n - 1]}`}
            onClick={() => onChange(n)}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-[15px] font-semibold tabular-nums transition-colors ${
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

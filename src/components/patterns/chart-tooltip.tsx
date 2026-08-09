interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string; color?: string; name?: string }[];
  valueFormatter?: (value: number | string) => string;
}

/** Values lead, label follows — the tooltip's value is the strong element, the series name secondary. */
export function ChartTooltip({ active, label, payload, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  const formatted = valueFormatter && point.value !== undefined ? valueFormatter(point.value) : point.value;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span
          className="h-0.5 w-3 shrink-0 rounded-full"
          style={{ background: point.color ?? "var(--viz-primary)" }}
          aria-hidden
        />
        <span className="text-sm font-semibold tabular-nums text-popover-foreground">{formatted}</span>
      </div>
      {label !== undefined ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </div>
  );
}

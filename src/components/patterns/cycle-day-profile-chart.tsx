"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CycleMetricAnalysis } from "@/lib/patterns";
import { ChartTooltip } from "./chart-tooltip";

/**
 * A day-of-cycle line (day 1 -> last day, pooled average across logged
 * cycles). The mid-cycle "days 8-13" pattern, when detected, is shaded
 * directly on the chart — its boundaries are fixed absolute cycle days, so
 * they map cleanly onto this axis. The "before your period" pattern varies
 * per cycle length and can't be drawn as one region on a pooled axis, so
 * it's surfaced as a sentence instead (see InsightSentenceCard).
 */
export function CycleDayProfileChart({
  analysis,
  color,
  unit,
}: {
  analysis: CycleMetricAnalysis;
  color: "primary" | "secondary";
  unit: string;
}) {
  const colorVar = color === "primary" ? "var(--viz-primary)" : "var(--viz-secondary)";
  const data = analysis.profile.map((p) => ({ day: p.cycleDay, value: Math.round(p.average * 10) / 10 }));
  const midCyclePattern = analysis.patterns.find((p) => p.windowLabel === "days 8-13");

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          label={{ value: "Cycle day", position: "insideBottom", offset: -2, fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={28}
          domain={[1, 5]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        {midCyclePattern ? (
          <ReferenceArea
            x1={8}
            x2={13}
            fill={colorVar}
            fillOpacity={0.08}
            label={{ value: "Notable window", position: "insideTop", fill: "var(--muted-foreground)", fontSize: 10 }}
          />
        ) : null}
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => `${v} ${unit}`} />}
          cursor={{ stroke: "var(--border)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={colorVar}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5, fill: colorVar, stroke: "var(--card)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PeriodDurationTrend } from "@/lib/patterns";
import { ChartTooltip } from "./chart-tooltip";
import { formatShortDate } from "./chart-utils";

export function PeriodDurationChart({ trend }: { trend: PeriodDurationTrend }) {
  const data = trend.dataPoints.map((d) => ({ date: formatShortDate(d.startDate), value: d.durationDays }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={24}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          allowDecimals={false}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => `${v} days`} />}
          cursor={{ fill: "var(--secondary)" }}
        />
        <Bar dataKey="value" fill="var(--viz-primary)" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

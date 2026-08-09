"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export function FrequencyBarChart({
  items,
  unit = "time",
}: {
  items: { label: string; count: number }[];
  unit?: string;
}) {
  const height = Math.max(items.length * 34, 100);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={items}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
        barCategoryGap="25%"
      >
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={128}
          tick={{ fill: "var(--foreground)", fontSize: 12.5 }}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => `${v} ${unit}${v === 1 ? "" : "s"}`} />}
          cursor={{ fill: "var(--secondary)" }}
        />
        <Bar dataKey="count" fill="var(--viz-primary)" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

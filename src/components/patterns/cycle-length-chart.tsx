"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CycleLengthTrend } from "@/lib/patterns";
import { ChartTooltip } from "./chart-tooltip";
import { formatShortDate } from "./chart-utils";

export function CycleLengthChart({ trend }: { trend: CycleLengthTrend }) {
  const data = trend.dataPoints.map((d) => ({ date: formatShortDate(d.startDate), value: d.lengthDays }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="cycleLengthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--viz-primary)" stopOpacity={0.14} />
            <stop offset="100%" stopColor="var(--viz-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={32}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <ReferenceLine
          y={trend.averageDays}
          stroke="var(--muted-foreground)"
          strokeDasharray="3 3"
          label={{
            value: `Avg ${trend.averageDays}d`,
            position: "right",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
        <Tooltip
          content={<ChartTooltip valueFormatter={(v) => `${v} days`} />}
          cursor={{ stroke: "var(--border)" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--viz-primary)"
          strokeWidth={2}
          fill="url(#cycleLengthFill)"
          dot={{ r: 4, fill: "var(--viz-primary)", stroke: "var(--card)", strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

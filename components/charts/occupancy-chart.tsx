"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface OccupancyChartProps {
  data: { name: string; value: number }[];
  mode: "rate" | "rooms";
  className?: string;
}

export function OccupancyChart({ data, mode, className }: OccupancyChartProps) {
  const yFormatter = (val: number) =>
    mode === "rate" ? `${val}%` : `${val} rooms`;

  return (
    <div className={`h-[300px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis
            domain={[0, mode === "rate" ? 150 : "auto"]}
            tickFormatter={yFormatter}
          />
          <Tooltip formatter={yFormatter} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#27AAE1"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

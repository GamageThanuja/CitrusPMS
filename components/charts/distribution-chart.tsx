"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface DistributionData {
  name: string
  value: number
}

interface DistributionChartProps {
  data?: DistributionData[]
  className?: string
}

export function DistributionChart({
  data = [
    { name: "Standard", value: 45 },
    { name: "Deluxe", value: 30 },
    { name: "Suite", value: 15 },
    { name: "Executive", value: 10 },
  ],
  className,
}: DistributionChartProps) {
  const COLORS = ["#10b981", "#6366f1", "#f43f5e", "#f59e0b", "#84cc16", "#06b6d4"]

  return (
    <div className={`h-[300px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}


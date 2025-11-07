"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface RoomCountData {
  name: string; // e.g. '21 Jul'
  value: number; // occuRoomCount
}

interface OccuRoomCountChartProps {
  data: RoomCountData[];
  className?: string;
}

export function OccuRoomCountChart({
  data,
  className,
}: OccuRoomCountChartProps) {
  return (
    <div className={`h-[300px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number) => `${value} rooms`} />
          <Bar
            dataKey="value"
            fill="#27AAE1"
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

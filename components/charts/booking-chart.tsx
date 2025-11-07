"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface BookingData {
  name: string
  bookings?: number
  direct?: number
  online?: number
  agent?: number
}

interface BookingChartProps {
  data?: BookingData[]
  title?: string
  description?: string
  className?: string
}

export function BookingChart({
  data = [
    { name: "Mon", bookings: 35 },
    { name: "Tue", bookings: 28 },
    { name: "Wed", bookings: 42 },
    { name: "Thu", bookings: 39 },
    { name: "Fri", bookings: 53 },
    { name: "Sat", bookings: 65 },
    { name: "Sun", bookings: 47 },
  ],
  className,
}: BookingChartProps) {
  // Check if data has direct, online, agent properties
  const hasDetailedData =
    data.length > 0 && (data[0].direct !== undefined || data[0].online !== undefined || data[0].agent !== undefined)

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
          <Tooltip />
          {hasDetailedData && <Legend />}

          {!hasDetailedData && <Bar dataKey="bookings" fill="#10b981" radius={[4, 4, 0, 0]} />}

          {hasDetailedData && (
            <>
              <Bar dataKey="direct" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="online" fill="#6366f1" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="agent" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


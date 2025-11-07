"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

interface RevenueData {
  name: string
  revenue: number
  profit?: number
  target?: number
}

interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
  showTabs?: boolean
  className?: string
}

export function RevenueChart({
  data,
  title = "Revenue Overview",
  description = "Monthly revenue",
  showTabs = true,
  className,
}: RevenueChartProps) {
  const [chartType, setChartType] = useState("area")

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showTabs && (
            <Tabs value={chartType} onValueChange={setChartType} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="area">Area</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart
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
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b98133" />
                {data[0]?.profit !== undefined && (
                  <Area type="monotone" dataKey="profit" stroke="#6366f1" fill="#6366f133" />
                )}
                {data[0]?.target !== undefined && (
                  <Area type="monotone" dataKey="target" stroke="#f43f5e" fill="#f43f5e33" />
                )}
              </AreaChart>
            ) : (
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
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                {data[0]?.profit !== undefined && <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} />}
                {data[0]?.target !== undefined && <Bar dataKey="target" fill="#f43f5e" radius={[4, 4, 0, 0]} />}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}


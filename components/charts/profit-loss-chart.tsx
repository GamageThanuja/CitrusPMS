"use client"

import { useState } from "react"
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Legend } from "recharts"

interface ProfitLossData {
  name: string
  revenue: number
  expenses: number
}

interface ProfitLossChartProps {
  data?: ProfitLossData[]
  className?: string
}

export function ProfitLossChart({
  data = [
    { name: "Jan", revenue: 12500, expenses: 8000 },
    { name: "Feb", revenue: 15000, expenses: 8500 },
    { name: "Mar", revenue: 18000, expenses: 9000 },
    { name: "Apr", revenue: 22000, expenses: 10000 },
    { name: "May", revenue: 19500, expenses: 9500 },
    { name: "Jun", revenue: 24000, expenses: 11000 },
  ],
  className,
}: ProfitLossChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const [period, setPeriod] = useState("yearly")

  // Calculate totals
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0)
  const totalProfit = data.reduce((sum, item) => sum + (item.revenue - item.expenses), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs defaultValue="yearly" value={period} onValueChange={setPeriod} className="w-[400px]">
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-sm">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm">Expenses</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm">Profit</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalProfit.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="area">
        <TabsList className="mb-4">
          <TabsTrigger value="area">Area</TabsTrigger>
          <TabsTrigger value="bar">Bar</TabsTrigger>
          <TabsTrigger value="newbar">New Bar</TabsTrigger>
        </TabsList>

        <TabsContent value="area" className="h-[300px]">
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  fill="rgba(239, 68, 68, 0.2)"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>

        <TabsContent value="bar" className="h-[300px]">
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="rgb(59, 130, 246)" />
                <Bar dataKey="expenses" fill="rgb(239, 68, 68)" />
                <Line type="monotone" dataKey="profit" stroke="rgb(34, 197, 94)" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
        <TabsContent value="newbar" className={`h-[300px] ${className}`}>
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
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) {
    return null
  }

  return (
    <ChartTooltip>
      <ChartTooltipContent>
        <div className="font-bold">{label}</div>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm">Revenue:</span>
            </div>
            <span className="font-medium">${payload[0]?.value?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-sm">Expenses:</span>
            </div>
            <span className="font-medium">${payload[1]?.value?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Profit:</span>
            </div>
            <span className="font-medium">${payload[2]?.value?.toLocaleString()}</span>
          </div>
        </div>
      </ChartTooltipContent>
    </ChartTooltip>
  )
}


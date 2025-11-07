"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Trophy, Info } from "lucide-react"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50"]


function JSONChart({ data }: { data: any }) {
  return (
    <div className="bg-muted p-4 rounded max-h-[300px] overflow-auto border text-xs">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}

export function AgentsTab() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "annually" | "lastYear">("monthly");
  const generateData = () => {
    switch (timeRange) {
      case "daily":
        return [
          { name: "Booking.com", value: 10, trend: [8, 9, 10, 10] },
          { name: "Agoda", value: 8, trend: [6, 7, 7, 8] },
          { name: "Expedia", value: 5, trend: [4, 4, 5, 5] },
          { name: "Other", value: 3, trend: [2, 2, 3, 3] },
        ];
      case "weekly":
        return [
          { name: "Booking.com", value: 35, trend: [30, 32, 33, 35] },
          { name: "Agoda", value: 25, trend: [20, 22, 24, 25] },
          { name: "Expedia", value: 20, trend: [18, 19, 19, 20] },
          { name: "Other", value: 10, trend: [8, 9, 9, 10] },
        ];
      case "annually":
        return [
          { name: "Booking.com", value: 500, trend: [400, 420, 480, 500] },
          { name: "Agoda", value: 400, trend: [350, 360, 390, 400] },
          { name: "Expedia", value: 350, trend: [300, 320, 330, 350] },
          { name: "Other", value: 200, trend: [150, 170, 180, 200] },
        ];
      case "lastYear":
      case "monthly":
      default:
        return [
          { name: "Booking.com", value: 90, trend: [65, 70, 80, 90] },
          { name: "Agoda", value: 70, trend: [55, 60, 65, 70] },
          { name: "Expedia", value: 50, trend: [45, 47, 49, 50] },
          { name: "Other", value: 30, trend: [28, 29, 30, 30] },
        ];
    }
  };

  const data = generateData();
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const topAgent = data.reduce((prev, curr) => (curr.value > prev.value ? curr : prev)).name
  const average = Math.round(total / data.length)

  const radarData = data.map((d) => ({
    agent: d.name,
    bookings: d.value,
    avg: d.value / 3,
  }))

  const jsonData = data.map((d) => ({
    source: d.name,
    target: "Confirmed",
    value: d.value,
  }))

  return (
    <Card className="shadow rounded-lg">
      <div className="flex justify-between items-start px-6 pt-6">
        <CardHeader className="p-0">
          <CardTitle>Online Travel Agents Dashboard</CardTitle>
          <CardDescription>Performance, insights, and growth of OTAs</CardDescription>
        </CardHeader>
        <div className="relative inline-block" style={{
          top: "85px",
          position: "absolute",
          right: "40px",
          zIndex: 10,
          width: "200px",
        }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
            className="appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-10 py-2 text-gray-900 dark:text-gray-100"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="lastYear">Last Year</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <CardContent className="space-y-6 px-[10px] mt-4">

        {/* 📈 Summary & Trends */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-2xl font-bold mt-1">{total}</p>
          </Card>
          <Card className="bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Top Agent</p>
            <p className="text-lg font-semibold mt-1 flex items-center justify-center gap-1">
              <Trophy className="w-4 h-4 text-yellow-500" /> {topAgent}
            </p>
          </Card>
          <Card className="bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Avg per Agent</p>
            <p className="text-xl font-semibold mt-1">{average}</p>
          </Card>
          <Card className="bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Growth Trend</p>
            <p className="text-md mt-1 text-green-600 flex justify-center items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +18.5%
            </p>
          </Card>
        </div>

        {/* 🏅 Agent Leaderboard */}
        <div>
          <h4 className="text-lg font-semibold mb-2">Top Performing Agents</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.map((agent, idx) => (
              <Card key={agent.name} className="p-4 bg-background border hover:shadow-md transition-all">
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="text-lg font-bold">{agent.value} bookings</p>
                <p className="text-xs text-muted-foreground">{Math.round((agent.value / total) * 100)}% share</p>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* 📊 Multi-Chart Tabs */}
        <Tabs defaultValue="bar">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="pie">Pie</TabsTrigger>
            <TabsTrigger value="area">Area</TabsTrigger>
            <TabsTrigger value="radar">Radar</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="line" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="pie" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="area" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="radar" className="mt-4">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="agent" />
                <PolarRadiusAxis />
                <Radar
                  name="Bookings"
                  dataKey="bookings"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="json" className="mt-4">
            <JSONChart data={jsonData} />
          </TabsContent>
        </Tabs>

        {/* 📌 CTA/Insights */}
        <Card className="bg-muted p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-500" />
            <p className="text-sm font-medium">Insights</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Focus on increasing visibility on Agoda & Expedia to balance dependency on Booking.com. Try offering exclusive perks on underperforming channels.
          </p>
        </Card>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { DistributionChart } from "@/components/charts/distribution-chart"
import { format, subMonths } from "date-fns"

export function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "annually" | "lastYear">("monthly");

  const getRevenueData = () => {
    switch (timeRange) {
      case "daily":
        return Array.from({ length: 7 }).map((_, index) => ({
          name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
          revenue: Math.floor(Math.random() * 3000) + 1000,
          profit: Math.floor(Math.random() * 2000) + 500,
          target: Math.floor(Math.random() * 4000) + 1500,
        }));
      case "weekly":
        return Array.from({ length: 4 }).map((_, index) => ({
          name: `Week ${index + 1}`,
          revenue: Math.floor(Math.random() * 10000) + 5000,
          profit: Math.floor(Math.random() * 8000) + 3000,
          target: Math.floor(Math.random() * 12000) + 6000,
        }));
      case "annually":
        return Array.from({ length: 5 }).map((_, index) => ({
          name: `${new Date().getFullYear() - (4 - index)}`,
          revenue: Math.floor(Math.random() * 300000) + 100000,
          profit: Math.floor(Math.random() * 200000) + 50000,
          target: Math.floor(Math.random() * 350000) + 150000,
        }));
      case "lastYear":
        return Array.from({ length: 12 }).map((_, index) => ({
          name: format(subMonths(new Date(), 12 + (11 - index)), "MMM"),
          revenue: Math.floor(Math.random() * 30000) + 15000,
          profit: Math.floor(Math.random() * 20000) + 10000,
          target: Math.floor(Math.random() * 35000) + 20000,
        }));
      case "monthly":
      default:
        return Array.from({ length: 12 }).map((_, index) => ({
          name: format(subMonths(new Date(), 11 - index), "MMM"),
          revenue: Math.floor(Math.random() * 30000) + 15000,
          profit: Math.floor(Math.random() * 20000) + 10000,
          target: Math.floor(Math.random() * 35000) + 20000,
        }));
    }
  };

  const revenueData = getRevenueData();

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <div>{/* Optional: tab navigation could go here */}</div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow rounded">
          <RevenueChart data={revenueData} title="Profit & Loss" description="Financial performance overview" />
        </Card>
        <Card className="col-span-3 shadow rounded">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by department</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart
              data={[
                { name: "Rooms", value: 65 },
                { name: "F&B", value: 20 },
                { name: "Spa", value: 10 },
                { name: "Other", value: 5 },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3 shadow rounded">
          <CardHeader>
            <CardTitle>Guest Demographics</CardTitle>
            <CardDescription>Guest profile analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart
              data={[
                { name: "Business", value: 40 },
                { name: "Leisure", value: 35 },
                { name: "Groups", value: 15 },
                { name: "Other", value: 10 },
              ]}
            />
          </CardContent>
        </Card>
        <Card className="col-span-4 shadow rounded">
          <RevenueChart
            data={revenueData.slice(6)}
            title="Performance Metrics"
            description="Key performance indicators"
            showTabs={false}
          />
        </Card>
      </div>
    </>
  )
}

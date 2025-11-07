"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { OccupancyChart } from "@/components/charts/occupancy-chart";
import { DistributionChart } from "@/components/charts/distribution-chart";
import { BookingChart } from "@/components/charts/booking-chart";
import { format, subDays, subWeeks, subMonths, subYears } from "date-fns";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchOccupancyRate } from "@/redux/slices/occupancyRateSlice";
import { fetchDashboardData } from "@/redux/slices/dashboardSlice";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OccuRoomCountChart } from "../charts/occuRoomCountChart";
import { useAppSelector } from "@/redux/hooks";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { fetchPerformanceByAgent } from "@/redux/slices/performanceByAgentSlice";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";

export function OverviewTab() {
  const [timeRange, setTimeRange] = useState("daily");
  const handleTimeRangeChange = (range) => setTimeRange(range);
  const dispatch = useDispatch<AppDispatch>();
  const currencyCode = useStoredCurrencyCode();

  console.log("currencyCode : ", currencyCode);

  const { data: dashboardData } = useSelector(
    (state: RootState) => state.dashboard
  );

  console.log("dashboardData : ", dashboardData);

  const { data: occupancyRateData, loading: occupancyLoading } = useSelector(
    (state: RootState) => state.occupancyRate
  );

  const { data: performanceData, status: performanceStatus } = useSelector(
    (state: RootState) => state.performanceByAgent
  );

  console.log("occupancyRateData : ", occupancyRateData);

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );
  const systemDateLoading = useAppSelector(
    (state: RootState) => state.systemDate.status === "loading"
  );

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  const [mode, setMode] = useState("rate");

  console.log("Dashboard Data 🎾🎾🎾 :", dashboardData);

  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelCode = selectedProperty?.hotelCode || "0";
    const token = tokens?.accessToken;

    if (!systemDate) return; // don't proceed until systemDate is loaded

    let startDate = new Date(systemDate);
    const endDate = new Date(systemDate);

    switch (timeRange) {
      case "daily":
        startDate = subDays(endDate, 1);
        break;
      case "weekly":
        startDate = subWeeks(endDate, 1);
        break;
      case "monthly":
        startDate = subMonths(endDate, 1);
        break;
      case "annually":
        startDate = subYears(endDate, 1);
        break;
      case "lastYear":
        startDate = new Date(endDate.getFullYear() - 1, 0, 1);
        endDate.setFullYear(endDate.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = subMonths(endDate, 1);
    }

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    console.log("Fetching dashboard data for range:", startISO, endISO);

    if (token && hotelCode) {
      dispatch(
        fetchDashboardData({
          hotelCode,
          startDate: startISO,
          endDate: endISO,
          token,
        })
      );
      dispatch(fetchOccupancyRate({ startDate: startISO, endDate: endISO }));
      dispatch(
        fetchPerformanceByAgent({
          startDate: startISO,
          endDate: endISO,
        })
      );
    }
  }, [dispatch, timeRange, systemDate]);

  // add under your imports
  const formatINRNoCents = (
    amount: number | string | null | undefined,
    code?: string
  ) => {
    const n = Math.round(Number(amount || 0));
    const formatted = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n);
    return code ? `${formatted} ${code}` : formatted;
  };

  const bookingSources = performanceData.map((item) => ({
    name: item.name,
    value: item.revenue,
  }));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-muted-foreground italic">
            Data processed as of{" "}
            <span className="font-medium text-primary">{systemDate}</span>
          </p>
        </div>
        <div className="relative inline-block">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-10 py-2 text-gray-900 dark:text-gray-100"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
            <option value="lastYear">Last Year</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Revenue ",
            value: formatINRNoCents(
              dashboardData?.revenue?.totalRevenue,
              currencyCode
            ),
            sub: "from dashboard",
          },
          {
            title: "Bookings",
            value: dashboardData?.roomNights?.roomNights || 0,
            sub: "room nights",
          },
          {
            title: "Occupancy Rate",
            value: `${dashboardData?.roomNightsPercentage || 0}%`,
            sub: "percentage",
          },
          {
            title: "Average Daily Rate",
            value: formatINRNoCents(
              dashboardData?.averageRoomRate,
              currencyCode
            ),

            sub: "from dashboard",
          },
        ].map((item) => (
          <Card key={item.title} className="shadow rounded">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value} </div>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        {[
          {
            title: "Arrivals Expected",
            value: dashboardData?.expectedArrivals?.expectedArrivals || 0,
          },
          {
            title: "Departures Expected",
            value: dashboardData?.expectedDepartures?.expectedDepartures || 0,
          },
          {
            title: "Overnight Stays",
            value: dashboardData?.stayover?.stayover || 0,
          },
          {
            title: "Inhouse Now",
            value: dashboardData?.inhouseGuestCount?.inhouseGuestCount || 0,
          },
        ].map((item) => (
          <Card key={item.title} className="shadow rounded">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">as of today</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4 shadow rounded">
          <RevenueChart data={dashboardData?.revenueTimeline || []} />
        </Card>

        <Card className="col-span-3 shadow rounded">
          <CardHeader className="flex items-center justify-between">
            <div className="flex justify-between items-center w-full">
              <CardTitle>Occupancy</CardTitle>
              <Tabs defaultValue="rate" onValueChange={(val) => setMode(val)}>
                <TabsList className="bg-muted">
                  <TabsTrigger value="rate">%</TabsTrigger>
                  <TabsTrigger value="rooms">Room Nights</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {occupancyLoading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : mode === "rate" ? (
              <OccupancyChart
                mode="rate"
                data={occupancyRateData.map((item) => ({
                  name: format(new Date(item.dt), "dd MMM"),
                  value: item.occupancyRate,
                }))}
              />
            ) : (
              <OccuRoomCountChart
                data={occupancyRateData.map((item) => ({
                  name: format(new Date(item.dt), "dd MMM"),
                  value: item.occuRoomCount,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-3 shadow rounded">
          <CardHeader>
            <CardTitle>Booking Sources</CardTitle>
            <CardDescription>
              Distribution of bookings by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart data={bookingSources} />
          </CardContent>
        </Card>

        <Card className="col-span-4 shadow rounded">
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Number of bookings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <BookingChart
              data={Array.from({ length: 7 }).map((_, index) => ({
                name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
                bookings: Math.floor(Math.random() * 50) + 20,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

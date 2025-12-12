"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RootState } from "@/redux/store";
import { fetchTransactionList } from "@/redux/slices/fetchTransactionListSlice";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { useTranslatedText } from "@/lib/translation";
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from "lucide-react";

interface TodaySalesDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedPosCenterId?: number | null;
  outletCurrency?: string;
}

// ✅ Helper: normalize any date string to local YYYY-MM-DD
const normalizeToLocalYMD = (
  value: string | null | undefined
): string | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function TodaySalesDrawer({
  open,
  onClose,
  selectedPosCenterId,
  outletCurrency = "",
}: TodaySalesDrawerProps) {
  const dispatch = useDispatch();
  const { data: transactions, loading } = useSelector(
    (state: RootState) => state.transactionList
  );

  console.log("transactions today sales drawer : ", transactions);


  const systemDate = useSelector((state: RootState) => state.systemDate.value);

  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [hotelCode, setHotelCode] = useState<string>("");

  // Get hotelCode from localStorage
  useEffect(() => {
    try {
      const selectedProperty = localStorage.getItem("selectedProperty");
      if (selectedProperty) {
        const property = JSON.parse(selectedProperty);
        const code = property?.hotelCode || property?.code || property?.id;
        setHotelCode(String(code || ""));
      }
    } catch (error) {
      console.error("Error reading hotelCode:", error);
    }
  }, []);

  // Fetch system date on mount
  useEffect(() => {
    dispatch(fetchSystemDate() as any);
  }, [dispatch]);

  // Fetch transactions when drawer opens
  useEffect(() => {
    if (open && hotelCode) {
      // Fetch transactions with tranTypeId = 2 (POS sales)
      dispatch(
        fetchTransactionList({
          hotelCode,
          tranTypeId: 2,
        }) as any
      );
    }
  }, [dispatch, open, hotelCode]);

  // ✅ Filter today's orders using systemDate in LOCAL time
  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      setTodayOrders([]);
      return;
    }

    if (!systemDate) {
      console.log("Waiting for systemDate to load...");
      setTodayOrders([]);
      return;
    }

    const todayDateStr = normalizeToLocalYMD(systemDate);
    console.log("🔍 FILTERING DEBUG:");
    console.log("  - systemDate (raw):", systemDate);
    console.log("  - systemDate (normalized):", todayDateStr);
    console.log("  - Transactions count:", transactions?.length);
    console.log("  - selectedPosCenterId:", selectedPosCenterId);

    // Log sample transaction structure
    if (transactions && transactions.length > 0) {
      const sample = transactions[0] as any;
      console.log("  - Sample transaction structure:", {
        tranMasId: sample.tranMasId,
        tranDate: sample.tranDate,
        tranDateNormalized: normalizeToLocalYMD(sample.tranDate),
        hotelPosCenterId: sample.hotelPosCenterId,
        hasHotelPosCenterId: "hotelPosCenterId" in sample,
        keys: Object.keys(sample)
      });
    }

    const filtered = transactions.filter((transaction: any) => {
      // ✅ Use tranDate as primary field to compare with systemDate
      if (!transaction.tranDate) {
        console.log("  ❌ Skipping transaction", transaction.tranMasId, "- no tranDate");
        return false; // Skip transactions without tranDate
      }

      // Normalize transaction tranDate to local YYYY-MM-DD format
      const transactionDateStr = normalizeToLocalYMD(transaction.tranDate);

      if (!transactionDateStr) {
        console.warn(
          "  ⚠️ Invalid tranDate:",
          transaction.tranDate,
          "for transaction:",
          transaction.tranMasId
        );
        return false;
      }

      // Compare normalized transaction date with normalized system date
      const dateMatches = transactionDateStr === todayDateStr;

      // Filter by selected POS center if provided
      // If selectedPosCenterId is null/undefined, include all transactions
      // If selectedPosCenterId is provided, only include matching transactions
      // If transaction doesn't have hotelPosCenterId, include it only if no center filter is set
      let matchesCenter = true;
      if (selectedPosCenterId != null && selectedPosCenterId !== undefined) {
        if (transaction.hotelPosCenterId != null && transaction.hotelPosCenterId !== undefined) {
          matchesCenter = Number(transaction.hotelPosCenterId) === Number(selectedPosCenterId);
        } else {
          // Transaction has no hotelPosCenterId but we're filtering by center - exclude it
          matchesCenter = false;
        }
      }

      // Debug logging for first few transactions
      if (transaction.tranMasId <= 90) {
        console.log(
          "  📊 Transaction",
          transaction.tranMasId,
          ":",
          "tranDate (raw) =",
          transaction.tranDate,
          "| tranDate (normalized) =",
          transactionDateStr,
          "| matches date =",
          dateMatches,
          "| matches center =",
          matchesCenter,
          "| hotelPosCenterId =",
          transaction.hotelPosCenterId
        );
      }

      if (dateMatches && matchesCenter) {
        console.log(
          "  ✅ MATCH:",
          transaction.tranMasId || transaction.docNo || transaction.id,
          "- tranDate:",
          transaction.tranDate,
          "- normalized:",
          transactionDateStr
        );
      } else if (!dateMatches) {
        // Only log first few non-matches to avoid spam
        if (transaction.tranMasId <= 90) {
          console.log(
            "  ❌ NO DATE MATCH:",
            transaction.tranMasId,
            "- tranDate (normalized):",
            transactionDateStr,
            "≠ systemDate (normalized):",
            todayDateStr
          );
        }
      } else if (!matchesCenter) {
        console.log(
          "  ❌ NO CENTER MATCH:",
          transaction.tranMasId,
          "- hotelPosCenterId:",
          transaction.hotelPosCenterId,
          "≠ selectedPosCenterId:",
          selectedPosCenterId
        );
      }

      return dateMatches && matchesCenter;
    });

    console.log("✅ Filtered orders count:", filtered.length);
    console.log("✅ Filtered transactions:", filtered.map((t: any) => t.tranMasId));
    setTodayOrders(filtered);
  }, [transactions, systemDate, selectedPosCenterId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce(
      (sum, order) =>
        sum +
        (Number(order.tranValue) ||
          Number(order.currAmount) ||
          Number(order.amount) ||
          Number(order.total) ||
          0),
      0
    );
    const totalItems = todayOrders.reduce((sum, order) => {
      const itemsCount = Array.isArray(order.items)
        ? order.items.length
        : Array.isArray(order.transactionDetails)
          ? order.transactionDetails.length
          : 0;
      return sum + itemsCount;
    }, 0);

    return {
      totalOrders,
      totalRevenue,
      totalItems,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }, [todayOrders]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatCurrency = (amount: number) => {
    return `${outletCurrency || ""} ${Number(amount || 0).toFixed(2)}`.trim();
  };

  // i18n
  const todaySales = useTranslatedText("Today's Sales");
  const orders = useTranslatedText("Orders");
  const revenue = useTranslatedText("Revenue");
  const items = useTranslatedText("Items");
  const averageOrder = useTranslatedText("Average Order");
  const orderNo = useTranslatedText("Order No");
  const table = useTranslatedText("Table");
  const time = useTranslatedText("Time");
  const total = useTranslatedText("Total");
  const noSales = useTranslatedText("No sales recorded for today");
  const loadingText = useTranslatedText("Loading...");

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {todaySales}
          </SheetTitle>
          <SheetDescription>
            {systemDate ? formatDate(systemDate) : "Today"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {orders}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {revenue}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {items}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
              </CardContent>
            </Card> */}

            {/* <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {averageOrder}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.averageOrderValue)}
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Orders List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{orders}</h3>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                {loadingText}
              </div>
            ) : todayOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">{noSales}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {todayOrders.map((transaction: any) => {
                  const orderTotal =
                    Number(transaction.tranValue) ||
                    Number(transaction.currAmount) ||
                    Number(transaction.amount) ||
                    Number(transaction.total) ||
                    0;
                  const orderDate =
                    transaction.tranDate ||
                    transaction.effectiveDate ||
                    transaction.createdOn;
                  const itemsCount =
                    (transaction.items && Array.isArray(transaction.items)
                      ? transaction.items.length
                      : 0) ||
                    (transaction.transactionDetails &&
                      Array.isArray(transaction.transactionDetails)
                      ? transaction.transactionDetails.length
                      : 0);

                  return (
                    <Card
                      key={
                        transaction.tranMasId ||
                        transaction.docNo ||
                        transaction.id
                      }
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold">
                                {orderNo}:{" "}
                                {transaction.docNo ||
                                  transaction.tranMasId ||
                                  transaction.id ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {transaction.tableNo && (
                                <div>
                                  {table}: {transaction.tableNo}
                                </div>
                              )}
                              {transaction.posCenter && (
                                <div>Outlet: {transaction.posCenter}</div>
                              )}
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {formatDate(orderDate)} {formatTime(orderDate)}
                              </div>
                              {transaction.deliveryMethod && (
                                <div>Method: {transaction.deliveryMethod}</div>
                              )}
                              {itemsCount > 0 && (
                                <div>
                                  {items}: {itemsCount}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatCurrency(orderTotal)}
                            </div>
                            {transaction.paymentMethod && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {transaction.paymentMethod}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

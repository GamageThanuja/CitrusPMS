"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2 } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useAppSelector } from "@/redux/hooks";

import {
  fetchMealAllocation,
  selectMealAllocationItems,
  selectMealAllocationLoading,
  selectMealAllocationError,
} from "@/redux/slices/fetchMealAllocationSlice";

import {
  createMealAllocation,
  selectCreateMealAllocationLoading,
  selectCreateMealAllocationError,
} from "@/redux/slices/createMealAllocationSlice";

import {
  updateMealAllocation,
  selectUpdateMealAllocationLoading,
  selectUpdateMealAllocationError,
} from "@/redux/slices/updateMealAllocationSlice";

import {
  deleteMealAllocation,
  selectDeleteMealAllocationLoading,
  selectDeleteMealAllocationError,
} from "@/redux/slices/deleteMealAllocationSlice";

import {
  fetchCurrencyMas,
  selectCurrencyMasItems,
  selectCurrencyMasLoading,
  selectCurrencyMasError,
} from "@/redux/slices/fetchCurrencyMasSlice";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface MealUI {
  id: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  currency: string;
  ai: number; // 0/1 on backend
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
}

type Mode = "create" | "edit";

export default function MealAllocationPage() {
  const dispatch = useDispatch<any>();

  // --- Global state via selectors ---
  const items = useAppSelector(selectMealAllocationItems);
  const loadingList = useAppSelector(selectMealAllocationLoading);
  const listError = useAppSelector(selectMealAllocationError);

  const creating = useAppSelector(selectCreateMealAllocationLoading);
  const createError = useAppSelector(selectCreateMealAllocationError);

  const updating = useAppSelector(selectUpdateMealAllocationLoading);
  const updateError = useAppSelector(selectUpdateMealAllocationError);

  const deleting = useAppSelector(selectDeleteMealAllocationLoading);
  const deleteError = useAppSelector(selectDeleteMealAllocationError);

  // 🔹 Currency state from CurrencyMas
  const currencyItems = useAppSelector(selectCurrencyMasItems);
  const currencyLoading = useAppSelector(selectCurrencyMasLoading);
  const currencyError = useAppSelector(selectCurrencyMasError);

  // Build unique currency code list
  const currencyCodes = useMemo(() => {
    const set = new Set<string>();
    currencyItems.forEach((c) => {
      if (c.currencyCode) set.add(c.currencyCode.toUpperCase());
    });
    return Array.from(set);
  }, [currencyItems]);

  // Determine a sensible default currency (home if available)
  const defaultCurrency = useMemo(() => {
    const home = currencyItems.find((c) => c.isHome);
    if (home?.currencyCode) return home.currencyCode.toUpperCase();
    return currencyCodes[0] || "USD";
  }, [currencyItems, currencyCodes]);

  // --- Local UI state ---
  const [username, setUsername] = useState<string>("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("create");

  const [mealForm, setMealForm] = useState<{
    id: number;
    breakfast: string;
    lunch: string;
    dinner: string;
    currency: string;
    ai: boolean;
  }>({
    id: 0,
    breakfast: "0",
    lunch: "0",
    dinner: "0",
    currency: "USD", // temp; will be replaced by defaultCurrency once loaded
    ai: false,
  });

  const createLocked = false;

  /** Pagination state (if still needed) – left as-is, though you’re not using the controls in this snippet */
  const [pageIndex] = useState(1);
  const [pageSize] = useState(10);

  // Load remembered username
  useEffect(() => {
    const stored = localStorage.getItem("rememberedUsername");
    if (stored) setUsername(stored);
  }, []);

  // Initial fetches
  useEffect(() => {
    dispatch(fetchMealAllocation());
    dispatch(fetchCurrencyMas(undefined));
  }, [dispatch]);

  // Once currencies are loaded, set default currency if none chosen
  useEffect(() => {
    if (currencyCodes.length === 0) return;
    setMealForm((f) => ({
      ...f,
      currency: f.currency || defaultCurrency,
    }));
  }, [currencyCodes, defaultCurrency]);

  // Map + filter list
  const filtered: MealUI[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    const mapped: MealUI[] = items.map((m: any) => ({
      id: m.id,
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner,
      currency: m.currency,
      ai: m.ai,
      hotelCode: m.hotelCode,
      createdBy: m.createdBy,
      createdOn: m.createdOn,
      lastUpdatedBy: m.lastUpdatedBy,
      lastUpdatedOn: m.lastUpdatedOn,
    }));

    if (!q) return mapped;

    return mapped.filter(
      (m) =>
        m.hotelCode.toLowerCase().includes(q) ||
        m.currency.toLowerCase().includes(q) ||
        m.createdBy.toLowerCase().includes(q)
    );
  }, [items, query]);

  const paginated = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, pageIndex, pageSize]);

  // --- Create / Update handler ---
  const handleSave = async () => {
    const b = Number(mealForm.breakfast || 0);
    const l = Number(mealForm.lunch || 0);
    const d = Number(mealForm.dinner || 0);
    if (b < 0 || l < 0 || d < 0) {
      toast.error("Meal counts cannot be negative.");
      return;
    }

    const hotelCode = localStorage.getItem("hotelCode") || "";
    if (!hotelCode) {
      toast.error("Hotel code is required. Please check your settings.");
      return;
    }

    if (!username) {
      toast.error("Username is required for tracking changes.");
      return;
    }

    if (!mealForm.currency) {
      toast.error("Currency is required.");
      return;
    }

    try {
      const now = new Date().toISOString();

      if (mode === "create") {
        await dispatch(
          createMealAllocation({
            breakfast: b,
            lunch: l,
            dinner: d,
            currency: mealForm.currency,
            ai: mealForm.ai ? 1 : 0,
            hotelCode,
            createdBy: username,
            createdOn: now,
            lastUpdatedBy: username,
            lastUpdatedOn: now,
          }) as any
        ).unwrap();
        toast.success("Meal allocation created");
      } else {
        const originalItem = items.find((item) => item.id === mealForm.id);
        if (!originalItem) {
          toast.error("Original meal allocation not found.");
          return;
        }

        await dispatch(
          updateMealAllocation({
            id: mealForm.id,
            breakfast: b,
            lunch: l,
            dinner: d,
            currency: mealForm.currency,
            ai: mealForm.ai ? 1 : 0,
            hotelCode,
            createdBy: originalItem.createdBy,
            createdOn: originalItem.createdOn,
            lastUpdatedBy: username,
            lastUpdatedOn: now,
          }) as any
        ).unwrap();
        toast.success("Meal allocation updated");
      }

      dispatch(fetchMealAllocation());
      setMode("create");
      setMealForm((f) => ({
        id: 0,
        breakfast: "0",
        lunch: "0",
        dinner: "0",
        currency: f.currency || defaultCurrency,
        ai: false,
      }));
    } catch (err: any) {
      console.error("Meal allocation save failed:", err);
      toast.error("Failed to save meal allocation");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Meal Allocations</h1>
            <p className="text-xs text-muted-foreground">
              Configure daily meal counts and view existing allocations.
            </p>
          </div>
        </div>

        {/* Error area */}
        {(listError || createError || updateError || deleteError || currencyError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {listError || createError || updateError || deleteError || currencyError}
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">
                {mode === "create"
                  ? "Create Allocation"
                  : `Edit Allocation #${mealForm.id}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Breakfast / Lunch / Dinner */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Breakfast</Label>
                  <Input
                    inputMode="numeric"
                    value={mealForm.breakfast}
                    onChange={(e) =>
                      setMealForm((f) => ({
                        ...f,
                        breakfast: e.target.value.replace(/\D/g, "") || "0",
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Lunch</Label>
                  <Input
                    inputMode="numeric"
                    value={mealForm.lunch}
                    onChange={(e) =>
                      setMealForm((f) => ({
                        ...f,
                        lunch: e.target.value.replace(/\D/g, "") || "0",
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Dinner</Label>
                  <Input
                    inputMode="numeric"
                    value={mealForm.dinner}
                    onChange={(e) =>
                      setMealForm((f) => ({
                        ...f,
                        dinner: e.target.value.replace(/\D/g, "") || "0",
                      }))
                    }
                  />
                </div>
              </div>

              {/* Currency + AI switch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={mealForm.currency || defaultCurrency}
                    onValueChange={(val) =>
                      setMealForm((f) => ({ ...f, currency: val }))
                    }
                    disabled={currencyLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={currencyLoading ? "Loading…" : "Currency"} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyCodes.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Label className="whitespace-nowrap">All-Inclusive</Label>
                  <Switch
                    checked={mealForm.ai}
                    onCheckedChange={(v) =>
                      setMealForm((f) => ({ ...f, ai: v }))
                    }
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={creating || updating || currencyLoading}
                >
                  {creating || updating ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "create" ? "Saving..." : "Updating..."}
                    </span>
                  ) : mode === "create" ? (
                    "Create"
                  ) : (
                    "Update"
                  )}
                </Button>

                {mode === "edit" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("create");
                      setMealForm((f) => ({
                        id: 0,
                        breakfast: "0",
                        lunch: "0",
                        dinner: "0",
                        currency: f.currency || defaultCurrency,
                        ai: false,
                      }));
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List Card – unchanged except still showing currency */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Existing Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingList ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No meal allocations found.
                </p>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Breakfast</TableHead>
                        <TableHead>Lunch</TableHead>
                        <TableHead>Dinner</TableHead>
                        <TableHead>All-Inclusive</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead className="text-right w-[180px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.breakfast}</TableCell>
                          <TableCell>{row.lunch}</TableCell>
                          <TableCell>{row.dinner}</TableCell>
                          <TableCell>{row.ai ? "Yes" : "No"}</TableCell>
                          <TableCell>{row.currency}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setMode("edit");
                                  setMealForm({
                                    id: row.id,
                                    breakfast: String(row.breakfast ?? "0"),
                                    lunch: String(row.lunch ?? "0"),
                                    dinner: String(row.dinner ?? "0"),
                                    currency: row.currency || defaultCurrency,
                                    ai: Boolean(row.ai),
                                  });
                                }}
                              >
                                Edit
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deleting}
                                onClick={async () => {
                                  try {
                                    const hotelCode =
                                      localStorage.getItem("hotelCode") || "";
                                    if (!hotelCode) {
                                      toast.error(
                                        "Hotel code not found. Please check your settings."
                                      );
                                      return;
                                    }

                                    await dispatch(
                                      deleteMealAllocation({
                                        hotelCode,
                                        id: row.id,
                                      }) as any
                                    ).unwrap();
                                    toast.success("Meal allocation deleted");
                                    dispatch(fetchMealAllocation());
                                  } catch (err) {
                                    console.error("Delete failed:", err);
                                    toast.error(
                                      "Failed to delete meal allocation"
                                    );
                                  }
                                }}
                              >
                                {deleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
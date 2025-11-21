"use client";

import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { PopoverContentInDialog } from "@/components/PopoverContentInDialog";
import React, { useEffect, useMemo } from "react";
import { format, addDays } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRateCodes,
  selectRateCodes,
  selectRateCodesLoading,
  selectRateCodesError,
} from "@/redux/slices/fetchRateCodesSlice";
import {
  fetchRateMas,
  selectRateMasItems,
  selectRateMasLoading,
  selectRateMasError,
} from "@/redux/slices/fetchRateMasSlice";
import {
  fetchRateMasAvailability,
  selectRateMasAvailabilityItems,
  selectRateMasAvailabilityLoading,
  selectRateMasAvailabilityError,
} from "@/redux/slices/fetchRateMasAvailabilitySlice";
import {
  fetchRoomTypeMas,
  selectRoomTypeMas,
  selectRoomTypeMasLoading,
  selectRoomTypeMasError,
} from "@/redux/slices/roomTypeMasSlice";
import {
  fetchCurrencyMas,
  selectCurrencyMasItems,
  selectCurrencyMasLoading,
  selectCurrencyMasError,
} from "@/redux/slices/fetchCurrencyMasSlice";
import {
  fetchHotelRatePlans,
  selectHotelRatePlansItems,
  selectHotelRatePlansLoading,
  selectHotelRatePlansError,
} from "@/redux/slices/fetchHotelRatePlanSlice";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader as UITableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ChevronLeftCircle,
  ChevronRightCircle,
  Save,
  RefreshCw,
  XCircle,
  User,
  Tag,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const VideoButton = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <Button
    variant="secondary"
    size="sm"
    onClick={onClick}
    className="h-8 text-sm"
  >
    {label}
  </Button>
);

export default function AvailabilityPage() {
  const [startDate, setStartDate] = React.useState(new Date());
  const [gridDays, setGridDays] = React.useState(14);
  const [selectedRateCodeId, setSelectedRateCodeId] = React.useState<
    number | undefined
  >(undefined);

  // Rate editing dialog state
  const [isRateDialogOpen, setIsRateDialogOpen] = React.useState(false);
  const [editingRate, setEditingRate] = React.useState<{
    roomType: string;
    roomTypeId: number;
    paxCount: number;
    date: Date;
    currentRate: number;
    mealPlan: string;
    rateCode: string;
    currencyCode: string;
  } | null>(null);

  // Value Override state
  const [rateMode, setRateMode] = React.useState<RateMode>("set");
  const [isPercentMode, setIsPercentMode] = React.useState(false);
  const [rateValue, setRateValue] = React.useState<number>(0);
  const [rateInputTouched, setRateInputTouched] = React.useState(false);

  // Date range for override
  const [editRange, setEditRange] = React.useState<DateRange | undefined>();
  const [customDaysInput, setCustomDaysInput] = React.useState<string>("1");

  // Save spinner
  const [isSaving, setIsSaving] = React.useState(false);

  // To anchor Calendar popover inside dialog
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  const dates = React.useMemo(
    () => Array.from({ length: gridDays }, (_, i) => addDays(startDate, i)),
    [startDate, gridDays]
  );
  const endDate = dates[dates.length - 1] ?? startDate;

  const handlePrevRange = () =>
    setStartDate((prev) => addDays(prev, -gridDays));
  const handleNextRange = () => setStartDate((prev) => addDays(prev, gridDays));

  const dispatch = useDispatch<any>();

  const rateCodes = useSelector(selectRateCodes);
  const rateCodesLoading = useSelector(selectRateCodesLoading);
  const rateCodesError = useSelector(selectRateCodesError);

  const rateMasItems = useSelector(selectRateMasItems);
  const rateMasLoading = useSelector(selectRateMasLoading);
  const rateMasError = useSelector(selectRateMasError);

  const availabilityItems = useSelector(selectRateMasAvailabilityItems);
  const availabilityLoading = useSelector(selectRateMasAvailabilityLoading);
  const availabilityError = useSelector(selectRateMasAvailabilityError);

  // Debug log to check data structure
  React.useEffect(() => {
    if (availabilityItems && availabilityItems.length > 0) {
      console.log("=== Availability Items Debug ===");
      console.log("Items count:", availabilityItems.length);
      console.log("First item:", availabilityItems[0]);
      if (availabilityItems[0]?.hotelRates) {
        console.log(
          "Hotel rates in first item:",
          availabilityItems[0].hotelRates
        );
      }
    }
  }, [availabilityItems]);

  const roomTypes = useSelector(selectRoomTypeMas);
  const roomTypesLoading = useSelector(selectRoomTypeMasLoading);
  const roomTypesError = useSelector(selectRoomTypeMasError);

  // ✅ Currency state
  const currencies = useSelector(selectCurrencyMasItems);
  const currenciesLoading = useSelector(selectCurrencyMasLoading);
  const currenciesError = useSelector(selectCurrencyMasError);

  // ✅ Hotel Rate Plans state
  const hotelRatePlans = useSelector(selectHotelRatePlansItems);
  const hotelRatePlansLoading = useSelector(selectHotelRatePlansLoading);
  const hotelRatePlansError = useSelector(selectHotelRatePlansError);

  useEffect(() => {
    dispatch(fetchRateCodes());
    dispatch(fetchRateMas());
    dispatch(fetchRoomTypeMas());
    dispatch(fetchCurrencyMas()); // ✅ fetch all currencies (no params)
    dispatch(fetchHotelRatePlans()); // ✅ fetch hotel rate plans
    dispatch(fetchHotelRatePlans()); // ✅ fetch hotel rate plans
  }, [dispatch]);

  useEffect(() => {
    // Read from localStorage.selectedProperty

    const hotelCode = localStorage.getItem("hotelCode");
    const selectedPropertyRaw =
      typeof window !== "undefined"
        ? localStorage.getItem("selectedProperty")
        : null;

    let hotelId: number | null = null;

    try {
      if (selectedPropertyRaw) {
        const parsed = JSON.parse(selectedPropertyRaw);
        hotelId = parsed?.id ?? null;
      }
    } catch {
      hotelId = null;
    }

    if (!hotelId) return;

    // Backend expects month-day-year like 11-13-2025 => "MM-dd-yyyy"
    const start = format(startDate, "MM-dd-yyyy");
    const end = format(endDate, "MM-dd-yyyy");

    console.log("Fetching availability for:", {
      hotelId,
      start,
      end,
      selectedRateCodeId,
    });

    dispatch(
      fetchRateMasAvailability({
        hotelId,
        startDate: start,
        endDate: end,
        rateCodeId: selectedRateCodeId, // 👈 NEW: from dropdown
        hotelCode: hotelCode ?? undefined, // ensure type is string | undefined
      })
    );
  }, [dispatch, startDate, endDate, selectedRateCodeId]);

  // For the "Rates Filter" dropdown
  const rateTypeOptions = useMemo(() => {
    const set = new Set<string>();
    (rateMasItems ?? []).forEach((r) => {
      if (r?.rateType) set.add(r.rateType);
    });
    return Array.from(set).sort();
  }, [rateMasItems]);

  const roomTypeById = useMemo(() => {
    const map = new Map<number, any>();

    // First, populate from roomTypes data
    (roomTypes ?? []).forEach((rt: any) => {
      if (rt?.roomTypeID) {
        map.set(rt.roomTypeID, rt);
      }
    });

    // Also populate from availability items (in case they contain room type info)
    (availabilityItems ?? []).forEach((item: any) => {
      const roomId = Number(item.roomTypeId ?? item.roomTypeID ?? 0);
      if (roomId && !map.has(roomId)) {
        map.set(roomId, {
          roomTypeID: roomId,
          roomType: item.roomType || `Room Type ${roomId}`,
          shortCode: `RT${roomId}`,
        });
      }
    });

    return map;
  }, [roomTypes, availabilityItems]);

  // Availability: quick access by roomTypeID + date
  const availabilityByRoomAndDate = useMemo(() => {
    const map = new Map<number, Map<string, any>>();
    (availabilityItems ?? []).forEach((item) => {
      // Handle both roomTypeID and roomTypeId (API inconsistency)
      const roomId = Number(item.roomTypeId ?? item.roomTypeID ?? 0);
      if (!roomId) return;

      // console.log("Processing availability for room:", roomId, "item:", item); // Debug log

      // If item has availability array, process each date
      if (item.availability && Array.isArray(item.availability)) {
        item.availability.forEach((avail: any) => {
          const dateKey = format(new Date(avail.date), "yyyy-MM-dd");
          if (!map.has(roomId)) map.set(roomId, new Map());
          // Store the availability data with the item info
          map.get(roomId)!.set(dateKey, {
            ...item,
            availabilityCount: avail.count,
            rateDate: avail.date,
          });
        });
      } else if (item.rateDate) {
        // Fallback for old format
        const dateKey = format(new Date(item.rateDate), "yyyy-MM-dd");
        if (!map.has(roomId)) map.set(roomId, new Map());
        map.get(roomId)!.set(dateKey, item);
      }
    });
    return map;
  }, [availabilityItems]);

  // Hotel Rate Plans: organize by roomTypeID and date with meal plan and rate code info
  const hotelRatePlansByRoom = useMemo(() => {
    const map = new Map<number, Map<string, any[]>>();

    (hotelRatePlans ?? []).forEach((plan: any) => {
      const roomId = Number(plan.roomTypeID ?? 0);
      if (!roomId || !plan.rateDate) return;

      const dateKey = format(new Date(plan.rateDate), "yyyy-MM-dd");

      if (!map.has(roomId)) map.set(roomId, new Map());
      const dateMap = map.get(roomId)!;

      if (!dateMap.has(dateKey)) dateMap.set(dateKey, []);
      dateMap.get(dateKey)!.push(plan);
    });

    return map;
  }, [hotelRatePlans]);

  // Rates: roomTypeID -> occupancy -> date -> rateValue
  const ratesByRoom = useMemo(() => {
    const map = new Map<number, Map<number, Map<string, number>>>();

    // helper to upsert into the nested map
    const upsert = (
      roomId: number,
      occ: number,
      dateKey: string,
      value: number | null | undefined
    ) => {
      if (value == null || Number.isNaN(value)) return;

      if (!map.has(roomId)) map.set(roomId, new Map());
      const occMap = map.get(roomId)!;

      if (!occMap.has(occ)) occMap.set(occ, new Map());
      const dateMap = occMap.get(occ)!;

      dateMap.set(dateKey, value);
    };

    // Process availability items with hotelRates data (main data source)
    (availabilityItems ?? []).forEach((item: any) => {
      const roomId = Number(item.roomTypeId ?? item.roomTypeID ?? 0);
      if (!roomId) return;

      // Process hotelRates array if it exists
      if (Array.isArray(item.hotelRates) && item.hotelRates.length > 0) {
        item.hotelRates.forEach((rate: any) => {
          if (!rate.rateDate) return;

          const dateKey = format(new Date(rate.rateDate), "yyyy-MM-dd");

          // Process pax1 to pax18 rates
          for (let occ = 1; occ <= 18; occ++) {
            const paxKey = `pax${occ}`;
            const paxValue = rate[paxKey];
            if (typeof paxValue === "number" && paxValue > 0) {
              upsert(roomId, occ, dateKey, paxValue);
            }
          }

          // Process default rate if available
          if (typeof rate.defaultRate === "number" && rate.defaultRate > 0) {
            const primaryOcc = 2; // Default to 2 pax if not specified
            upsert(roomId, primaryOcc, dateKey, rate.defaultRate);
          }

          // Process child rate
          if (typeof rate.child === "number" && rate.child > 0) {
            upsert(roomId, 0, dateKey, rate.child); // Use 0 for child occupancy
          }
        });
      }
      // Fallback: if no hotelRates, try to use item-level rates
      else if (item.rateDate || item.averageRate) {
        const dateKey = item.rateDate
          ? format(new Date(item.rateDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd");

        // Use averageRate as fallback
        if (typeof item.averageRate === "number" && item.averageRate > 0) {
          for (let occ = 1; occ <= 3; occ++) {
            // Show for first 3 occupancies
            upsert(roomId, occ, dateKey, item.averageRate);
          }
        }
      }
    });

    // Process hotel rate plans as additional data source
    (hotelRatePlans ?? []).forEach((plan: any) => {
      const roomId = Number(plan.roomTypeID ?? 0);
      if (!roomId || !plan.rateDate) return;

      const dateKey = format(new Date(plan.rateDate), "yyyy-MM-dd");

      // Default rate for primary occupancy
      if (typeof plan.defaultRate === "number" && plan.defaultRate > 0) {
        const primaryOcc = Number(plan.primaryOccupancy ?? 2);
        upsert(roomId, primaryOcc, dateKey, plan.defaultRate);
      }

      // Pax-specific rates (pax1 to pax18)
      for (let occ = 1; occ <= 18; occ++) {
        const paxKey = `pax${occ}`;
        const paxValue = plan[paxKey];
        if (typeof paxValue === "number" && paxValue > 0) {
          upsert(roomId, occ, dateKey, paxValue);
        }
      }

      // Child rate
      if (typeof plan.child === "number" && plan.child > 0) {
        upsert(roomId, 0, dateKey, plan.child);
      }
    });

    return map;
  }, [availabilityItems, hotelRatePlans]);

  // Distinct roomTypeIDs present in availability
  const roomTypeIds = useMemo(() => {
    const set = new Set<number>();
    (availabilityItems ?? []).forEach((i) => {
      // Handle both roomTypeID and roomTypeId (API inconsistency)
      const id = Number(i.roomTypeId ?? i.roomTypeID ?? 0);
      if (id) set.add(id);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [availabilityItems]);

  const handleNoop = () => {};
  const headerTitle = "Rate and Availability";

  type RateMode = "set" | "increase" | "decrease";

  const round2 = (n: number) => Math.max(0, Math.round(n * 100) / 100);

  const applyOp = (
    base: number,
    mode: RateMode,
    value: number,
    isPct: boolean
  ) => {
    if (mode === "set") return round2(value);
    if (mode === "increase") {
      return round2(isPct ? base + (base * value) / 100 : base + value);
    }
    // decrease
    return round2(isPct ? base - (base * value) / 100 : base - value);
  };

  // Handle rate cell click to open edit dialog
  const handleRateClick = (
    roomTypeId: number,
    roomType: string,
    paxCount: number,
    date: Date,
    currentRate: number,
    mealPlan: string,
    rateCode: string,
    currencyCode: string
  ) => {
    setEditingRate({
      roomType,
      roomTypeId,
      paxCount,
      date,
      currentRate,
      mealPlan,
      rateCode,
      currencyCode,
    });

    // Initialise override state
    const safeCurrent = currentRate > 0 ? currentRate : 0;
    setRateMode("set");
    setIsPercentMode(false);
    setRateValue(safeCurrent);
    setRateInputTouched(false);

    // Default date range = clicked date only
    const from = new Date(date);
    setEditRange({ from, to: from });
    setCustomDaysInput("1");

    setIsRateDialogOpen(true);
  };

  // Handle saving rate changes (placeholder for future API integration)
  const handleSaveRate = async () => {
    if (!editingRate) return;
    if (!editRange?.from || !editRange?.to) {
      alert("Please select a valid date range.");
      return;
    }
    if (rateValue <= 0) {
      alert("Value should be a positive number.");
      return;
    }

    setIsSaving(true);

    try {
      const base = editingRate.currentRate || 0;
      const finalValue = applyOp(base, rateMode, rateValue, isPercentMode);

      const dateFromIso = editRange.from.toISOString();
      const dateToIso = editRange.to.toISOString();

      console.log("[ValueOverride] Saving:", {
        roomTypeId: editingRate.roomTypeId,
        roomType: editingRate.roomType,
        paxCount: editingRate.paxCount,
        dateFrom: dateFromIso,
        dateTo: dateToIso,
        baseRate: base,
        rateMode,
        isPercentMode,
        rateValue,
        finalValue,
        mealPlan: editingRate.mealPlan,
        rateCode: editingRate.rateCode,
        currency: editingRate.currencyCode,
      });

      // TODO: wire to your API/Redux thunk here
      // await dispatch(updateRatesThunk({ ...payload })).unwrap();

      alert(
        `Rate updated to ${finalValue} ${editingRate.currencyCode} for ` +
          `${editingRate.roomType} – ${editingRate.paxCount} pax`
      );

      handleCloseRateDialog();
    } catch (err: any) {
      console.error("[ValueOverride] Failed to save:", err);
      alert(
        typeof err === "string"
          ? err
          : err?.message || "Failed to override rates"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseRateDialog = () => {
    setIsRateDialogOpen(false);
    setEditingRate(null);
    setRateValue(0);
    setRateMode("set");
    setIsPercentMode(false);
    setRateInputTouched(false);
    setEditRange(undefined);
    setCustomDaysInput("1");
  };


  return (
    <DashboardLayout>
      {/* Top Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
          {/* Left control group */}
          <div className="flex flex-row gap-4">
            <Select onValueChange={handleNoop}>
              <SelectTrigger className="w-[180px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {currenciesLoading && (
                  <SelectItem value="__loading" disabled>
                    Loading currencies...
                  </SelectItem>
                )}
                {!currenciesLoading && currenciesError && (
                  <SelectItem value="__error" disabled>
                    Failed to load currencies
                  </SelectItem>
                )}

                {!currenciesLoading &&
                  !currenciesError &&
                  currencies.map((c: any) => (
                    <SelectItem key={c.currencyCode} value={c.currencyCode}>
                      {c.currencyCode} – {c.currencyName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select
              value={
                selectedRateCodeId !== undefined
                  ? String(selectedRateCodeId)
                  : "all"
              }
              onValueChange={(value) => {
                if (value === "all") {
                  setSelectedRateCodeId(undefined);
                } else {
                  setSelectedRateCodeId(Number(value));
                }
              }}
            >
              <SelectTrigger className="w-[180px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Rate Code Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rate Codes</SelectItem>

                {rateCodesLoading && (
                  <SelectItem value="__loading" disabled>
                    Loading...
                  </SelectItem>
                )}

                {!rateCodesLoading && rateCodesError && (
                  <SelectItem value="__error" disabled>
                    Failed to load rate codes
                  </SelectItem>
                )}

                {!rateCodesLoading &&
                  !rateCodesError &&
                  rateCodes.map((rc) => (
                    <SelectItem
                      key={rc.rateCodeID}
                      value={String(rc.rateCodeID)} // 👈 this is rateCodeId from API
                    >
                      {rc.rateCode}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select onValueChange={handleNoop}>
              <SelectTrigger className="w-[160px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Select Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Options</SelectItem>
                <SelectItem value="rate">Rate Only</SelectItem>
                <SelectItem value="availability">Availability Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right control group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* ✅ Rooms Filter now uses RoomTypeMas */}
            <Select onValueChange={handleNoop}>
              <SelectTrigger className="w-[200px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Rooms Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>

                {roomTypesLoading && (
                  <SelectItem value="__loading" disabled>
                    Loading rooms...
                  </SelectItem>
                )}

                {!roomTypesLoading && roomTypesError && (
                  <SelectItem value="__error" disabled>
                    Failed to load rooms
                  </SelectItem>
                )}

                {!roomTypesLoading &&
                  !roomTypesError &&
                  roomTypes?.map((rt: any) => (
                    <SelectItem
                      key={rt.roomTypeID}
                      value={String(rt.roomTypeID)}
                    >
                      {rt.roomType || rt.shortCode || `Room #${rt.roomTypeID}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select onValueChange={handleNoop}>
              <SelectTrigger className="w-[140px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Rates Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>

                {rateMasLoading && (
                  <SelectItem value="__loading" disabled>
                    Loading...
                  </SelectItem>
                )}

                {!rateMasLoading && rateMasError && (
                  <SelectItem value="__error" disabled>
                    Failed to load
                  </SelectItem>
                )}

                {!rateMasLoading &&
                  !rateMasError &&
                  rateTypeOptions.map((rt) => (
                    <SelectItem key={rt} value={rt}>
                      {rt}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button
              variant="default"
              size="sm"
              className="h-8 text-sm flex items-center gap-1"
            >
              <Save className="h-4 w-4" /> Save Changes
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-sm flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" /> Reset Changes
            </Button>

            <Select>
              <SelectTrigger className="w-[120px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bulk">Bulk Update</SelectItem>
                <SelectItem value="rules">Availability Rules</SelectItem>
                <SelectItem value="logs">Show Logs</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between w-full">
            {/* Left: Title */}
            <CardTitle className="text-xl font-semibold m-0">
              {headerTitle}
            </CardTitle>

            {/* Right: Date and grid controls (dynamic) */}
            <div className="flex flex-row items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handlePrevRange}
              >
                <ChevronLeftCircle className="h-5 w-5" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm h-8 flex items-center gap-1"
                  >
                    {format(startDate, "dd MMM yyyy")} –{" "}
                    {format(endDate, "dd MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4 text-sm" align="start">
                  {/* Calendar placeholder */}
                  Calendar here
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleNextRange}
              >
                <ChevronRightCircle className="h-5 w-5" />
              </Button>

              <div className="flex flex-row items-center gap-2">
                <span className="text-sm font-medium">Grid Days:</span>
                <Select onValueChange={(v) => setGridDays(Number(v))}>
                  <SelectTrigger className="w-[80px] h-8 text-sm px-3 border rounded-md [&>svg]:hidden">
                    {gridDays} Days
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="14">14</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="overflow-auto px-4">
            <Card>
              <Table className="border-collapse !border-0">
                <UITableHeader style={{ border: "none" }}>
                  <TableRow
                    className="pt-4 border-b border-gray-300 border-opacity-40"
                    style={{ padding: 0 }}
                  >
                    <TableHead
                      style={{ padding: 0, border: "none" }}
                      className="w-[200px] text-left border-r border-gray-400 border-opacity-40"
                    >
                      <div className="ml-1.5 text-gray-600 text-xs font-bold">
                        Room Type
                      </div>
                    </TableHead>

                    {dates.map((date) => {
                      const isWeekend = [0, 6].includes(date.getDay());
                      const isToday =
                        new Date().toDateString() === date.toDateString();
                      return (
                        <TableHead
                          key={+date}
                          style={{
                            padding: 0,
                            border: "none",
                            lineHeight: "1",
                          }}
                          className={`text-center font-medium border border-r border-gray-400 border-opacity-40 rounded-t-md ${
                            isToday
                              ? "bg-green-100 text-black font-bold"
                              : isWeekend
                              ? "bg-red-100 text-red-700 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center leading-tight py-1">
                            <span className="text-[10px] font-medium">
                              {format(date, "EEE")}
                            </span>
                            <span className="text-xs font-semibold">
                              {format(date, "MMM dd")}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </UITableHeader>

                <TableBody>
                  {/* Availability / rate loading & error states */}
                  {availabilityLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={1 + dates.length}
                        className="text-center py-4"
                      >
                        Loading availability & rates...
                      </TableCell>
                    </TableRow>
                  )}

                  {!availabilityLoading && availabilityError && (
                    <TableRow>
                      <TableCell
                        colSpan={1 + dates.length}
                        className="text-center py-4 text-red-600"
                      >
                        {availabilityError}
                      </TableCell>
                    </TableRow>
                  )}

                  {!availabilityLoading &&
                    !availabilityError &&
                    roomTypeIds.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={1 + dates.length}
                          className="text-center py-4"
                        >
                          No data for the selected range.
                        </TableCell>
                      </TableRow>
                    )}

                  {/* Availability + Rates rows per room */}
                  {!availabilityLoading &&
                    !availabilityError &&
                    roomTypeIds.map((roomTypeID) => {
                      const occMap = ratesByRoom.get(roomTypeID);
                      const occKeys = occMap
                        ? Array.from(occMap.keys()).sort((a, b) => a - b)
                        : [];

                      const rt = roomTypeById.get(roomTypeID);
                      const roomLabel =
                        rt?.roomType || rt?.shortCode || `Room #${roomTypeID}`;

                      return (
                        <React.Fragment key={roomTypeID}>
                          {/* Availability row */}
                          <TableRow className="border-b border-gray-400 border-opacity-40">
                            <TableCell className="p-1 text-primary text-sm font-semibold border-r border-gray-400 border-opacity-40 bg-[#EEF4FB]">
                              {roomLabel}
                              <br />
                              <span className="block text-[11px] font-normal uppercase mt-1">
                                AVL
                              </span>
                            </TableCell>
                            {dates.map((d) => {
                              const dateKey = format(d, "yyyy-MM-dd");
                              const rec = availabilityByRoomAndDate
                                .get(roomTypeID)
                                ?.get(dateKey);
                              // Show availability count if available, otherwise show rate or dash
                              const cellValue =
                                rec?.availabilityCount ??
                                (typeof rec?.defaultRate === "number"
                                  ? rec.defaultRate
                                  : typeof rec?.averageRate === "number"
                                  ? rec.averageRate
                                  : "-");
                              return (
                                <TableCell
                                  key={`${roomTypeID}-AVL-${dateKey}`}
                                  className="text-center text-xs font-bold p-1 border-r border-gray-400 border-opacity-40 bg-[#EEF4FB]"
                                >
                                  {cellValue}
                                </TableCell>
                              );
                            })}
                          </TableRow>

                          {/* Rate rows with meal plan and rate code info */}
                          {(() => {
                            // Get room info from availability items for this room type
                            const roomInfo = availabilityItems.find(
                              (item) =>
                                Number(item.roomTypeId ?? item.roomTypeID) ===
                                roomTypeID
                            );

                            // Get hotel rate plans for this room type to get meal plan basis and currency
                            const roomRatePlans = new Map<string, any>();
                            dates.forEach((date) => {
                              const dateKey = format(date, "yyyy-MM-dd");
                              const plansForDate =
                                hotelRatePlansByRoom
                                  .get(roomTypeID)
                                  ?.get(dateKey) || [];
                              plansForDate.forEach((plan) => {
                                const key = `${plan.rateCodeID}-${plan.mealPlanID}`;
                                if (!roomRatePlans.has(key)) {
                                  roomRatePlans.set(key, plan);
                                }
                              });
                            });

                            const uniqueRatePlans = Array.from(
                              roomRatePlans.values()
                            );

                            if (roomInfo) {
                              const rateCodeName = roomInfo.rateCode;

                              // Get meal plan basis and currency from hotel rate plans if available
                              const ratePlan = uniqueRatePlans[0]; // Use first rate plan for meal plan info
                              const mealPlanBasis =
                                ratePlan?.mealPlanMaster?.basis ||
                                roomInfo.mealPlan;
                              const currencyCode = ratePlan?.currencyCode;

                              // Show all available pax rates (1-18) that actually exist in the data
                              const availablePax = [];
                              for (let pax = 1; pax <= 18; pax++) {
                                if (occMap?.has(pax)) {
                                  availablePax.push(pax);
                                }
                              }

                              return availablePax.map((paxCount) => {
                                const dateMap = occMap?.get(paxCount);

                                return (
                                  <TableRow
                                    key={`${roomTypeID}-pax-${paxCount}`}
                                    className="border-b border-gray-400 border-opacity-40"
                                  >
                                    <TableCell className="p-1 text-muted-foreground text-xs border-r border-gray-400 border-opacity-40">
                                      <div className="flex flex-col pl-4">
                                        <span className="font-semibold">
                                          {roomLabel}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-primary">
                                            {mealPlanBasis} ({currencyCode})
                                          </span>
                                          <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                            <User className="w-4 h-4" />
                                            <span>{paxCount}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                            <Tag className="w-4 h-4" />
                                            <span className="bg-gray-100 px-1 rounded text-gray-600">
                                              {rateCodeName}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    {dates.map((d) => {
                                      const dateKey = format(d, "yyyy-MM-dd");
                                      const val = dateMap?.get(dateKey);
                                      return (
                                        <TableCell
                                          key={`${roomTypeID}-pax-${paxCount}-${dateKey}`}
                                          className="text-center p-1 text-xs border-r border-gray-400 border-opacity-40 hover:bg-accent cursor-pointer"
                                          onClick={() => {
                                            const currentRate =
                                              typeof val === "number" ? val : 0;
                                            handleRateClick(
                                              roomTypeID,
                                              roomLabel,
                                              paxCount,
                                              d,
                                              currentRate,
                                              mealPlanBasis,
                                              rateCodeName,
                                              currencyCode
                                            );
                                          }}
                                        >
                                          {typeof val === "number"
                                            ? Math.round(val)
                                            : "-"}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                );
                              });
                            } else {
                              // Fallback to generic occupancy display
                              return occKeys.map((occ) => {
                                const dateMap = occMap!.get(occ)!;
                                return (
                                  <TableRow
                                    key={`${roomTypeID}-occ-${occ}`}
                                    className="border-b border-gray-400 border-opacity-40"
                                  >
                                    <TableCell className="p-1 text-muted-foreground text-xs border-r border-gray-400 border-opacity-40">
                                      <div className="flex flex-col pl-4">
                                        <span className="font-semibold">
                                          {roomLabel}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-primary"></span>
                                          <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                            <User className="w-4 h-4" />
                                            <span>{occ}</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                            <Tag className="w-4 h-4" />
                                            <span className="bg-gray-100 px-1 rounded text-gray-600">
                                              IBE
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    {dates.map((d) => {
                                      const dateKey = format(d, "yyyy-MM-dd");
                                      const val = dateMap.get(dateKey);
                                      return (
                                        <TableCell
                                          key={`${roomTypeID}-occ-${occ}-${dateKey}`}
                                          className="text-center p-1 text-xs border-r border-gray-400 border-opacity-40 hover:bg-accent cursor-pointer"
                                          onClick={() => {
                                            const currentRate =
                                              typeof val === "number" ? val : 0;
                                            handleRateClick(
                                              roomTypeID,
                                              roomLabel,
                                              occ,
                                              d,
                                              currentRate,
                                              "FB",
                                              "IBE",
                                              "USD"
                                            );
                                          }}
                                        >
                                          {typeof val === "number"
                                            ? Math.round(val)
                                            : "-"}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                );
                              });
                            }
                          })()}
                        </React.Fragment>
                      );
                    })}
                </TableBody>
              </Table>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Value Override Dialog */}
      <Dialog open={isRateDialogOpen} onOpenChange={setIsRateDialogOpen}>
        <DialogContent ref={dialogRef} className="overflow-visible max-w-lg">
          <DialogHeader>
            <DialogTitle>Value Override</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {editingRate && (
                  <>
                    <div className="mb-1">
                      <span className="font-medium">Room Type:</span>{" "}
                      {editingRate.roomType}
                      <span className="ml-3 inline-flex items-center gap-1 text-muted-foreground text-sm">
                        <User className="h-4 w-4" /> {editingRate.paxCount}
                      </span>
                    </div>
                    <div className="mb-1">
                      <span className="font-medium">Plan:</span>{" "}
                      {editingRate.mealPlan}_{editingRate.rateCode}
                    </div>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Restriction (disabled) */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Restriction
              </label>
              <Select defaultValue="Rate" disabled>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rate">Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Price</span>
              <span className="text-base font-bold">
                {editingRate
                  ? `${editingRate.currentRate || 0} ${
                      editingRate.currencyCode || "USD"
                    }`
                  : ""}
              </span>
            </div>

            {/* SET / + / - / % controls */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center gap-2">
                <Button
                  type="button"
                  variant={rateMode === "set" ? "default" : "outline"}
                  size="sm"
                  className={`px-3 py-1 ${
                    rateMode === "set" ? "font-bold" : ""
                  }`}
                  onClick={() => setRateMode("set")}
                >
                  SET
                </Button>
                <Button
                  type="button"
                  variant={rateMode === "increase" ? "default" : "outline"}
                  size="sm"
                  className={`px-3 py-1 ${
                    rateMode === "increase" ? "font-bold" : ""
                  }`}
                  onClick={() => setRateMode("increase")}
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant={rateMode === "decrease" ? "default" : "outline"}
                  size="sm"
                  className={`px-3 py-1 ${
                    rateMode === "decrease" ? "font-bold" : ""
                  }`}
                  onClick={() => setRateMode("decrease")}
                >
                  -
                </Button>
                <div className="flex-1" />
                <Button
                  type="button"
                  variant={isPercentMode ? "default" : "outline"}
                  size="sm"
                  className={`px-2 py-1 ${isPercentMode ? "font-bold" : ""}`}
                  onClick={() => setIsPercentMode((p) => !p)}
                  aria-pressed={isPercentMode}
                >
                  %
                </Button>
              </div>

              {/* Value input + preview */}
              <div>
                <label className="text-sm font-medium mb-1 block">Value</label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min={0}
                    step={isPercentMode ? "0.01" : "1"}
                    value={Number.isNaN(rateValue) ? "" : rateValue}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setRateValue(Number.isNaN(n) ? 0 : n);
                      setRateInputTouched(true);
                    }}
                    onBlur={() => setRateInputTouched(true)}
                    className={`mt-0.5 pr-12 py-1.5 ${
                      rateInputTouched && rateValue <= 0
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    style={{ paddingRight: "3.5rem" }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {isPercentMode ? "%" : editingRate?.currencyCode || "USD"}
                  </span>
                </div>
                {rateInputTouched && rateValue <= 0 && (
                  <span className="block text-xs text-red-500 mt-1">
                    Should be a positive value
                  </span>
                )}
                <span className="block text-xs text-muted-foreground mt-1">
                  {(() => {
                    if (!editingRate) return "";
                    const base = editingRate.currentRate || 0;
                    let previewValue = base;
                    if (rateMode === "set") {
                      previewValue = rateValue;
                      return `Price will be set to ${rateValue} ${
                        isPercentMode ? "%" : editingRate.currencyCode || "USD"
                      }`;
                    }
                    if (rateMode === "increase") {
                      previewValue = applyOp(
                        base,
                        "increase",
                        rateValue,
                        isPercentMode
                      );
                      return `Price will increase to ${previewValue} ${
                        editingRate.currencyCode || "USD"
                      }`;
                    }
                    if (rateMode === "decrease") {
                      previewValue = applyOp(
                        base,
                        "decrease",
                        rateValue,
                        isPercentMode
                      );
                      return `Price will decrease to ${previewValue} ${
                        editingRate.currencyCode || "USD"
                      }`;
                    }
                    return "";
                  })()}
                </span>
              </div>
            </div>

            {/* Custom Date Range */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Custom Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="mt-0.5 w-full justify-start text-left font-normal py-1.5"
                  >
                    {editRange?.from && editRange?.to
                      ? `${format(editRange.from, "MMM d, yyyy")} - ${format(
                          editRange.to,
                          "MMM d, yyyy"
                        )}`
                      : editingRate
                      ? `${format(editingRate.date, "MMM d, yyyy")} - ${format(
                          editingRate.date,
                          "MMM d, yyyy"
                        )}`
                      : "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContentInDialog
                  container={dialogRef.current}
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  collisionPadding={8}
                  className="p-0"
                >
                  <Calendar
                    mode="range"
                    selected={editRange}
                    onSelect={(range) => {
                      setEditRange((prev) => range ?? prev ?? undefined);

                      if (range?.from && range?.to) {
                        const diff =
                          Math.floor(
                            (range.to.getTime() - range.from.getTime()) /
                              (1000 * 3600 * 24)
                          ) + 1;
                        setCustomDaysInput(String(diff));
                      } else if (range?.from && !range?.to) {
                        setCustomDaysInput("1");
                      } else {
                        setCustomDaysInput("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContentInDialog>
              </Popover>
            </div>

            {/* Number of days input */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Enter Number of Days
              </label>
              <Input
                type="number"
                min={1}
                max={50}
                placeholder="Number of Days"
                className="mt-0.5 py-1.5"
                value={customDaysInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomDaysInput(value);
                  const days = Number(value);
                  const baseStart =
                    editRange?.from ?? editingRate?.date ?? null;

                  if (!Number.isNaN(days) && baseStart) {
                    const fromDate = new Date(baseStart);
                    const toDate = addDays(
                      new Date(baseStart),
                      Math.max(1, days) - 1
                    );
                    setEditRange({ from: fromDate, to: toDate });
                  }
                }}
              />
              {editRange?.from && editRange?.to && (
                <div className="text-xs text-muted-foreground mt-1">
                  Calculated Range: {format(editRange.from, "MMM d, yyyy")} –{" "}
                  {format(editRange.to, "MMM d, yyyy")}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="secondary"
              onClick={handleCloseRateDialog}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={handleSaveRate}
              className="flex items-center gap-1"
              disabled={rateValue <= 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

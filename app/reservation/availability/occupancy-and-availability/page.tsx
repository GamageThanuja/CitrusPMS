"use client";

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

  const roomTypes = useSelector(selectRoomTypeMas);
  const roomTypesLoading = useSelector(selectRoomTypeMasLoading);
  const roomTypesError = useSelector(selectRoomTypeMasError);

  // ✅ Currency state
  const currencies = useSelector(selectCurrencyMasItems);
  const currenciesLoading = useSelector(selectCurrencyMasLoading);
  const currenciesError = useSelector(selectCurrencyMasError);

  useEffect(() => {
    dispatch(fetchRateCodes());
    dispatch(fetchRateMas());
    dispatch(fetchRoomTypeMas());
    dispatch(fetchCurrencyMas()); // ✅ fetch all currencies (no params)
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

  // Rates: roomTypeID -> occupancy -> date -> defaultRate
  const ratesByRoom = useMemo(() => {
    const map = new Map<number, Map<number, Map<string, number>>>();
    (availabilityItems ?? []).forEach((item) => {
      // Handle both roomTypeID and roomTypeId (API inconsistency)
      const roomId = Number(item.roomTypeId ?? item.roomTypeID ?? 0);
      if (!roomId) return;

      // console.log("Processing item:", item); // Debug log

      // If item has hotelRates array, process each rate
      if (item.hotelRates && Array.isArray(item.hotelRates) && item.hotelRates.length > 0) {
        item.hotelRates.forEach((rate: any) => {
          const occ = Number(rate.primaryOccupancy ?? 1);
          // Process availability dates if they exist
          if (item.availability && Array.isArray(item.availability)) {
            item.availability.forEach((avail: any) => {
              const dateKey = format(new Date(avail.date), "yyyy-MM-dd");
              if (!map.has(roomId)) map.set(roomId, new Map());
              const occMap = map.get(roomId)!;
              if (!occMap.has(occ)) occMap.set(occ, new Map());
              const dateMap = occMap.get(occ)!;
              dateMap.set(dateKey, item.averageRate ?? 0);
            });
          }
        });
      } else {
        // Fallback for when no hotelRates array or empty hotelRates
        const occ = Number(item.primaryOccupancy ?? item.adultCount ?? 2); // Default to 2 adults
        if (item.availability && Array.isArray(item.availability)) {
          item.availability.forEach((avail: any) => {
            const dateKey = format(new Date(avail.date), "yyyy-MM-dd");
            if (!map.has(roomId)) map.set(roomId, new Map());
            const occMap = map.get(roomId)!;
            if (!occMap.has(occ)) occMap.set(occ, new Map());
            const dateMap = occMap.get(occ)!;
            dateMap.set(dateKey, item.averageRate ?? 0);
          });
        } else if (item.rateDate) {
          // Old format fallback
          const dateKey = format(new Date(item.rateDate), "yyyy-MM-dd");
          if (!map.has(roomId)) map.set(roomId, new Map());
          const occMap = map.get(roomId)!
          if (!occMap.has(occ)) occMap.set(occ, new Map());
          const dateMap = occMap.get(occ)!;
          dateMap.set(dateKey, item.averageRate ?? 0);
        }
      }
    });
    return map;
  }, [availabilityItems]);

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

                          {/* Rate rows per occupancy */}
                          {occKeys.map((occ) => {
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
                                      <span>
                                        Rate{" "}
                                        <small className="text-muted-foreground">
                                          (default)
                                        </small>
                                      </span>
                                      <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                        <User className="w-4 h-4" />
                                        <span>{occ}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                        <Tag className="w-4 h-4" />
                                        <span>Standard</span>
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
                                      className="text-center p-1 text-xs border-r border-gray-400 border-opacity-40 hover:bg-accent"
                                    >
                                      {typeof val === "number" ? val : "-"}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                </TableBody>
              </Table>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Rate Override Dialog (still static for now) */}
      <Dialog open={false} onOpenChange={handleNoop}>
        <DialogContent className="overflow-visible">
          <DialogHeader>
            <DialogTitle>Value Override</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <div className="mb-1">
                  <span className="font-medium">Room Type:</span> Deluxe Room
                  <span className="ml-3 inline-flex items-center gap-1 text-muted-foreground text-sm">
                    <User className="h-4 w-4" /> 2
                  </span>
                </div>
                <div className="mb-1">
                  <span className="font-medium">Plan:</span> BB
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="mb-2">
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

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Current Price</span>
            <span className="text-base font-bold">120 USD</span>
          </div>

          <div className="mb-2">
            <label className="text-sm font-medium mb-1 block">Value</label>
            <Input type="number" className="py-1.5" placeholder="Enter value" />
            <span className="block text-xs text-muted-foreground mt-1">
              Preview will appear here
            </span>
          </div>

          <div className="mb-2">
            <label className="text-sm font-medium">Custom Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="mt-0.5 w-full justify-start text-left font-normal py-1.5"
                >
                  Select date range
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                sideOffset={6}
                collisionPadding={8}
                className="p-4"
              >
                Calendar here
              </PopoverContent>
            </Popover>
          </div>

          <div className="mb-2">
            <label className="text-sm font-medium">Enter Number of Days</label>
            <Input
              type="number"
              min={1}
              max={50}
              placeholder="Number of Days"
              className="mt-0.5 py-1.5"
            />
            <div className="text-sm mt-1">
              Calculated Range: Jan 01, 2025 - Jan 07, 2025
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleNoop}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleNoop} className="flex items-center gap-1">
              <Save className="h-4 w-4" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

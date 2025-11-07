"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import { format, addDays } from "date-fns";

// Lucide icons
import {
  ChevronLeftCircle,
  ChevronRightCircle,
  Save,
  RefreshCw,
  XCircle,
  User,
  Link2,
  Tag,
} from "lucide-react";

// Layout component for sidebar/header
import { DashboardLayout } from "@/components/dashboard-layout";

// shadcn/ui components
import {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  createHotelRatePlan,
  getHotelRatePlans,
} from "@/controllers/hotelRatePlanController";
import { getHotelRatePlansAvailability } from "@/controllers/hotelRatePlanAvailabilityController";
import { toast } from "sonner";
import { fetchRateCodes } from "@/redux/slices/rateCodeSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { PopoverContentInDialog } from "@/components/PopoverContentInDialog";
import type { DateRange } from "react-day-picker";
import {
  postHotelRatePlan,
  selectPostHotelRatePlan,
  resetPostHotelRatePlan,
} from "@/redux/slices/postHotelRatePlanSlice";
import { useToast } from "@/components/toast/ToastProvider";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";

// Helper function: generate a list of consecutive dates
function generateDates(startDate: Date, totalDays: number) {
  return Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));
}

export default function RoomInventoryPage() {
  const prevStartDateRef = useRef<Date | null>(null);
  const prevEndDateRef = useRef<Date | null>(null);
  // Grid date states
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [gridDays, setGridDays] = useState<number>(14);
  const dates = generateDates(startDate, gridDays);
  const endDate = addDays(startDate, gridDays - 1);
  const { show } = useToast();

  // Dynamic text size classes based on gridDays
  // Fixed text size classes to match 21-day layout
  const headerTextSizeClass = "text-xs";
  const cellTextSizeClass = "text-sm";

  // Display filter state: "all" | "rate" | "availability"
  const [displayFilter, setDisplayFilter] = useState<string>("all");

  // Compute header title based on display filter selection
  const headerTitle =
    displayFilter === "all"
      ? "Rate and Availability"
      : displayFilter === "rate"
      ? "Rate Only"
      : "Availability Only";

  // States for modals and overrides
  const [openModal, setOpenModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedRate, setSelectedRate] = useState<number>(0);
  const [selectedCellDate, setSelectedCellDate] = useState<Date | null>(null);
  const [editRange, setEditRange] = useState<DateRange | undefined>(undefined);
  const [customDaysInput, setCustomDaysInput] = useState<string>("");
  const [selectedOccupancy, setSelectedOccupancy] = useState<number | null>(
    null
  );
  // Value override logic state for Rate Override modal
  const [rateMode, setRateMode] = useState<"set" | "increase" | "decrease">(
    "set"
  );
  const [rateValue, setRateValue] = useState<number>(0);
  const [isPercentMode, setIsPercentMode] = useState<boolean>(false);
  const [rateInputTouched, setRateInputTouched] = useState<boolean>(false);

  const [inventoryOverrideModal, setInventoryOverrideModal] = useState(false);
  const [selectedInventoryRoom, setSelectedInventoryRoom] = useState("");
  const [selectedInventory, setSelectedInventory] = useState<number>(0);
  const [selectedInventoryCellDate, setSelectedInventoryCellDate] =
    useState<Date | null>(null);
  const [inventoryEditRange, setInventoryEditRange] = useState<any>({
    from: undefined,
    to: undefined,
  });
  const [inventoryDaysInput, setInventoryDaysInput] = useState<string>("");
  // NEW: Rate Code filter state (selected value) and available options
  const [rateCodeIdFilter, setRateCodeIdFilter] = useState<string>("all");

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  const postState = useSelector(selectPostHotelRatePlan);

  const refreshGrid = React.useCallback(async () => {
    try {
      const tokenData = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const propertyData = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const accessToken = tokenData.accessToken;
      const hotelId = propertyData.id;
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");

      // 1) Availability
      const availabilityData = await getHotelRatePlansAvailability({
        token: accessToken,
        hotelId,
        startDate: start,
        endDate: end,
      });

      // 2) Rate plans
      const ratePlansData = await getHotelRatePlans({
        token: accessToken,
        hotelId,
      });

      // 3) Build grouped rates (same as your useEffect)
      const groupedRates = ratePlansData.reduce((acc: any, plan: any) => {
        const roomTypeID =
          plan.hotelRoomType?.hotelRoomTypeID ?? plan.roomTypeID;
        const planShort = plan.mealPlanMaster?.shortCode || "STD";
        const rcId = plan.rateCodeID ?? plan.rateCode?.rateCodeID ?? null;
        const uniquePlanKey = `${planShort}__rc_${rcId ?? "NA"}`;
        const isLinked = plan.rateMode === "Auto";
        const primaryOccupancy = plan.primaryOccupancy || 1;
        const currencyCode =
          plan.currencyCode ?? plan.hotelMaster?.currencyCode ?? "USD";

        const ratePlanName =
          plan.ratePlan?.code ??
          plan.ratePlan?.shortCode ??
          plan.ratePlan?.name ??
          plan.ratePlanName ??
          plan.planName ??
          plan.planType ??
          plan.channelCode ??
          plan.sourceCode ??
          plan.sourceName ??
          plan.channelName ??
          plan.source ??
          plan.channel ??
          plan.title ??
          null;

        if (!roomTypeID || !Array.isArray(plan.hotelRates)) return acc;

        plan.hotelRates.forEach((rate: any) => {
          const dateKey = format(new Date(rate.rateDate), "yyyy-MM-dd");
          acc[roomTypeID] ??= {};
          acc[roomTypeID][dateKey] ??= [];

          const defaultPaxKey = `pax${
            rate.primaryOccupancy ?? primaryOccupancy
          }`;
          const paxRates = Object.entries(rate).filter(
            ([key, value]) => key.startsWith("pax") && value != null
          );

          if (paxRates.length > 0) {
            paxRates.forEach(([key, value]) => {
              const paxCount = Number(String(key).replace("pax", ""));
              acc[roomTypeID][dateKey].push({
                planKey: uniquePlanKey,
                planLabel: planShort,
                rateCodeID: rcId,
                rateCode: plan.rateCode?.rateCode ?? null,
                ratePlan: ratePlanName,
                rate: value,
                occupancy: paxCount,
                isLinked,
                isDefaultRate: key === defaultPaxKey,
                otas: [],
                date: dateKey,
                currencyCode,
              });
            });
          } else {
            acc[roomTypeID][dateKey].push({
              planKey: uniquePlanKey,
              planLabel: planShort,
              rateCodeID: rcId,
              ratePlan: ratePlanName,
              rate: rate.defaultRate,
              occupancy: rate.primaryOccupancy ?? primaryOccupancy,
              isLinked,
              currencyCode,
              isDefaultRate: true,
              otas: [],
              date: dateKey,
            });
          }
        });
        return acc;
      }, {});

      // 4) Merge per-room (same as your useEffect)
      const mergedRooms = availabilityData.map((room: any) => {
        const roomRatesByDate = groupedRates[room.roomTypeId] || {};
        const plansByPlan: Record<string, Record<string, any[]>> = {};
        const planMetaMap: Record<
          string,
          {
            label: string;
            rateCodeID: number | null;
            currencyCode: string | null;
            ratePlan?: string | null;
          }
        > = {};

        Object.keys(roomRatesByDate).forEach((dateKey) => {
          roomRatesByDate[dateKey].forEach((entry: any) => {
            const k = entry.planKey;
            plansByPlan[k] = plansByPlan[k] || {};
            plansByPlan[k][dateKey] = plansByPlan[k][dateKey] || [];
            plansByPlan[k][dateKey].push(entry);

            planMetaMap[k] ??= {
              label: entry.planLabel,
              rateCodeID: entry.rateCodeID ?? null,
              currencyCode: entry.currencyCode ?? null,
              ratePlan: planMetaMap[k]?.ratePlan ?? entry.ratePlan ?? null,
            };
          });
        });

        return { ...room, plansByPlan, planMetaMap };
      });

      setApiRooms(mergedRooms);
    } catch (error) {
      console.error("Error refreshing grid:", error);
      toast.error("Failed to refresh grid data.");
    }
  }, [startDate, endDate]);

  // Do not call setRateCodeOptions in render afterwards.

  // Existing filter states for room type and rate type (kept in top controls)
  const [roomFilter, setRoomFilter] = useState("all");
  const [rateFilter, setRateFilter] = useState("all");

  // State for expanded OTA rows
  const [expandedRates, setExpandedRates] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");

  function buildExistingPaxForDateNull(room: any, planKey: string, date: Date) {
    const dateKey = format(date, "yyyy-MM-dd");
    const existing = (room?.plansByPlan?.[planKey]?.[dateKey] ?? []) as any[];

    // Start everything as null to avoid wiping with zeros
    const pax: Record<string, number | null> = {};
    for (let i = 1; i <= 18; i++) pax[`pax${i}`] = null;

    // Keep only the pax that actually exist on the grid
    existing.forEach((e) => {
      const pc = Number(e.occupancy);
      if (pc >= 1 && pc <= 18) pax[`pax${pc}`] = Number(e.rate ?? 0);
    });

    return pax; // { pax1: number|null, ... }
  }

  // Navigation handlers for the date range
  const handlePrevRange = () => {
    setStartDate((prev) => addDays(prev, -gridDays));
  };
  const handleNextRange = () => {
    setStartDate((prev) => addDays(prev, gridDays));
  };

  const expandDateRange = (from: Date, to: Date): string[] => {
    const out: string[] = [];
    let d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    while (d.getTime() <= end.getTime()) {
      out.push(format(d, "yyyy-MM-dd"));
      d = addDays(d, 1);
    }
    return out;
  };

  const round2 = (n: number) => Math.max(0, Math.round(n * 100) / 100);

  type RateOp = "set" | "increase" | "decrease";
  const applyOp = (
    base: number,
    mode: RateOp,
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

  // Handler for opening the rate override modal
  const handleRateClick = (
    roomType: string,
    planLabel: string,
    rateValue_: number,
    cellDate: Date,
    occupancy: number
  ) => {
    setSelectedRoomType(roomType);
    setSelectedPlan(planLabel);
    setSelectedRate(rateValue_);
    setSelectedCellDate(cellDate);
    setSelectedOccupancy(occupancy);
    // Reset override modal states
    setRateMode("set");
    setIsPercentMode(false);
    setRateValue(rateValue_);
    setRateInputTouched(false);
    setOpenModal(true);

    const from = new Date(cellDate);
    setEditRange({ from, to: from });
    setCustomDaysInput("1");

    setOpenModal(true);
  };

  // Handler for opening the inventory override modal
  const handleInventoryClick = (
    roomType: string,
    availability: number,
    cellDate: Date
  ) => {
    setSelectedInventoryRoom(roomType);
    setSelectedInventory(availability);
    setSelectedInventoryCellDate(cellDate);

    const from = new Date(cellDate);
    setInventoryEditRange({ from, to: from });
    setInventoryDaysInput("1");

    setInventoryOverrideModal(true);
  };

  // Toggle OTA details for a given rate row
  const handleToggleRateOta = (roomType: string, planName: string) => {
    const id = `${roomType}-${planName}`;
    setExpandedRates((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  function getExistingIncreaseDecrease(matchedRatePlan: any, date: Date) {
    const dateKey = format(date, "yyyy-MM-dd");
    const day = (matchedRatePlan?.hotelRates ?? []).find(
      (r: any) => format(new Date(r.rateDate), "yyyy-MM-dd") === dateKey
    );
    // Return null if not present so we don't wipe to 0 on the backend
    const increaseBy =
      day && typeof day.increaseBy === "number" ? day.increaseBy : null;
    const decreaseBy =
      day && typeof day.decreaseBy === "number" ? day.decreaseBy : null;

    return { increaseBy, decreaseBy };
  }

  function findExistingIncDec(matchedRatePlan: any, date: Date) {
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");
    const dateKey = fmt(date);

    const day = (matchedRatePlan?.hotelRates ?? []).find(
      (r: any) => fmt(new Date(r.rateDate)) === dateKey
    );

    // 1) Try the exact date (strongest signal)
    const inc1 =
      day && typeof day.increaseBy === "number" ? day.increaseBy : undefined;
    const dec1 =
      day && typeof day.decreaseBy === "number" ? day.decreaseBy : undefined;

    if (inc1 !== undefined || dec1 !== undefined) {
      return { increaseBy: inc1, decreaseBy: dec1 };
    }

    // 2) Try plan-level fields
    const inc2 =
      typeof matchedRatePlan?.increaseBy === "number"
        ? matchedRatePlan.increaseBy
        : undefined;
    const dec2 =
      typeof matchedRatePlan?.decreaseBy === "number"
        ? matchedRatePlan.decreaseBy
        : undefined;

    if (inc2 !== undefined || dec2 !== undefined) {
      return { increaseBy: inc2, decreaseBy: dec2 };
    }

    // 3) Scan any other dated row that has numbers
    const anyWithValues = (matchedRatePlan?.hotelRates ?? []).find(
      (r: any) =>
        typeof r.increaseBy === "number" || typeof r.decreaseBy === "number"
    );
    const inc3 =
      anyWithValues && typeof anyWithValues.increaseBy === "number"
        ? anyWithValues.increaseBy
        : undefined;
    const dec3 =
      anyWithValues && typeof anyWithValues.decreaseBy === "number"
        ? anyWithValues.decreaseBy
        : undefined;

    return { increaseBy: inc3, decreaseBy: dec3 };
  }

  function findExistingChildRates(matchedRatePlan: any, date: Date) {
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");

    // 1) Exact date
    const day = (matchedRatePlan?.hotelRates ?? []).find(
      (r: any) => fmt(new Date(r.rateDate)) === fmt(date)
    );

    const child1 = day && typeof day.child === "number" ? day.child : undefined;
    const childRate1 =
      day && typeof day.childRate === "number" ? day.childRate : undefined;

    if (child1 !== undefined || childRate1 !== undefined) {
      return { child: child1, childRate: childRate1 };
    }

    // 2) Plan-level fields
    const child2 =
      typeof matchedRatePlan?.child === "number"
        ? matchedRatePlan.child
        : undefined;
    const childRate2 =
      typeof matchedRatePlan?.childRate === "number"
        ? matchedRatePlan.childRate
        : undefined;

    if (child2 !== undefined || childRate2 !== undefined) {
      return { child: child2, childRate: childRate2 };
    }

    // 3) Any other dated row
    const anyWith = (matchedRatePlan?.hotelRates ?? []).find(
      (r: any) => typeof r.child === "number" || typeof r.childRate === "number"
    );
    const child3 =
      anyWith && typeof anyWith.child === "number" ? anyWith.child : undefined;
    const childRate3 =
      anyWith && typeof anyWith.childRate === "number"
        ? anyWith.childRate
        : undefined;

    return { child: child3, childRate: childRate3 };
  }

  const handleSave = async () => {
    try {
      if (!editRange?.from || !editRange?.to || !selectedCellDate) {
        toast.error("Please select a valid date range.");
        return;
      }

      setIsSaving(true);

      // 1) Find matched room + plan (same as you already do)
      const matchedRoom = apiRooms.find(
        (room) =>
          room.roomType === selectedRoomType || room.type === selectedRoomType
      );
      if (!matchedRoom) {
        toast.error("No matching room found for selected room type.");
        return;
      }

      const tokenData = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const propertyData = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const accessToken = tokenData.accessToken;
      const hotelId = Number(propertyData?.id ?? propertyData?.hotelID);

      const planDefs = await getHotelRatePlans({
        token: accessToken,
        hotelId,
        isCmActive: false,
      });

      const roomTypeId =
        matchedRoom.roomTypeId ??
        matchedRoom.roomTypeID ??
        matchedRoom.hotelRoomTypeId ??
        matchedRoom.hotelRoomTypeID;

      if (!roomTypeId) {
        toast.error("Missing roomTypeID for the selected room.");
        return;
      }

      // selectedPlan is your unique plan key; map it back to label/rateCodeID
      const planMeta = matchedRoom.planMetaMap?.[selectedPlan] ?? null;
      const selectedLabel = planMeta?.label ?? null;
      const selectedRcId = planMeta?.rateCodeID ?? null;

      const defsForRoom = (planDefs ?? []).filter(
        (def: any) =>
          (def.roomTypeID ?? def.hotelRoomType?.hotelRoomTypeID) === roomTypeId
      );

      const matchedRatePlan = defsForRoom.find((def: any) => {
        const defLabel = (
          def.mealPlanMaster?.shortCode ||
          def.title ||
          def.rateCode?.rateCode ||
          ""
        )
          .toString()
          .toLowerCase();
        const defRcId = def.rateCodeID ?? def.rateCode?.rateCodeID ?? null;
        const labelOk = selectedLabel
          ? defLabel === selectedLabel.toString().toLowerCase()
          : false;
        const rcOk =
          selectedRcId == null || String(defRcId) === String(selectedRcId);
        return labelOk && rcOk;
      });

      if (!matchedRatePlan) {
        toast.error(
          "Couldn't match the selected rate plan. Check plan label & rate code."
        );
        return;
      }

      // 2) Compute the final value for the override (we’ll use defaultRate + pax{occ})
      const occ = selectedOccupancy || matchedRatePlan.primaryOccupancy || 1;

      // base number for clicked cell:
      const base = Number(selectedRate) || 0;
      const finalValue =
        rateMode === "set"
          ? Math.max(0, Math.round(rateValue * 100) / 100)
          : rateMode === "increase"
          ? Math.max(
              0,
              Math.round(
                (isPercentMode
                  ? base + (base * rateValue) / 100
                  : base + rateValue) * 100
              ) / 100
            )
          : Math.max(
              0,
              Math.round(
                (isPercentMode
                  ? base - (base * rateValue) / 100
                  : base - rateValue) * 100
              ) / 100
            );

      // 3) Build the **flat** payload EXACTLY like your sample and ATTACH hotelRatePlanID
      const nowIso = new Date().toISOString();
      const dateFromIso = editRange.from.toISOString();
      const dateToIso = editRange.to.toISOString();

      // derive ids/codes safely
      const hotelRatePlanID = Number(matchedRatePlan.hotelRatePlanID ?? 0);
      const rateCodeID = Number(
        matchedRatePlan.rateCodeID ??
          matchedRatePlan.rateCode?.rateCodeID ??
          selectedRcId ??
          0
      );
      const mealPlanID = Number(
        matchedRatePlan.mealPlanID ??
          matchedRatePlan.mealPlanMaster?.mealPlanID ??
          0
      );
      const currencyCode =
        matchedRatePlan.currencyCode ??
        matchedRatePlan.hotelMaster?.currencyCode ??
        planMeta?.currencyCode ??
        "LKR";

      // initialize pax 1..18 with 0, and set selected occupancy to finalValue
      let pax: Record<string, number | null> = buildExistingPaxForDateNull(
        matchedRoom,
        selectedPlan,
        selectedCellDate!
      );

      // Override ONLY the chosen occupancy with the new value
      pax[`pax${occ}`] = finalValue;

      const { increaseBy: foundIncreaseBy, decreaseBy: foundDecreaseBy } =
        findExistingIncDec(matchedRatePlan, selectedCellDate!);

      // If you want this only for Per Person + Auto, keep this flag:
      const shouldCarryIncDec =
        (matchedRatePlan.sellMode ?? "Per Person") === "Per Person" &&
        (matchedRatePlan.rateMode ?? "Auto") === "Auto";

      // Decide what to post: existing value or null (not 0)
      const increaseByForPayload = shouldCarryIncDec
        ? foundIncreaseBy
        : undefined;
      const decreaseByForPayload = shouldCarryIncDec
        ? foundDecreaseBy
        : undefined;

      const { child: foundChild, childRate: foundChildRate } =
        findExistingChildRates(matchedRatePlan, selectedCellDate!);

      // If you want to restrict to Per Person + Auto, keep a guard like you did:
      const shouldCarryChild =
        (matchedRatePlan.sellMode ?? "Per Person") === "Per Person" &&
        (matchedRatePlan.rateMode ?? "Auto") === "Auto";

      // Decide what to include; undefined means "do not send the key"
      const childForPayload = shouldCarryChild ? foundChild : undefined;
      const childRateForPayload = shouldCarryChild ? foundChildRate : undefined;

      const flatPayload: any = {
        recordID: 0,
        hotelRatePlanID,
        defaultRate: finalValue,
        ...pax,

        dateFrom: dateFromIso,
        dateTo: dateToIso,
        sellMode: matchedRatePlan.sellMode ?? "Per Person",
        rateMode: matchedRatePlan.rateMode ?? "Auto",
        roomTypeID: Number(roomTypeId),
        primaryOccupancy: Number(occ),
        hotelID: Number(hotelId ?? 0),
        rateCodeID,
        mealPlanID,
        currencyCode,
        createdOn: nowIso,
        createdBy: "string",
        title:
          matchedRatePlan.title ??
          matchedRatePlan.ratePlan?.name ??
          matchedRatePlan.ratePlanName ??
          "Rate Plan",
        hotelMaster: { hotelID: Number(hotelId ?? 0) },
        rateCode: { rateCodeID },
        hotelRoomType: {
          hotelRoomTypeID: Number(roomTypeId),
          hotelID: Number(hotelId ?? 0),
        },
        mealPlanMaster: { mealPlanID },
        cmid: "string",
      };

      // ✅ Attach only if we have a number; otherwise omit the key completely.
      if (typeof increaseByForPayload === "number") {
        flatPayload.increaseBy = increaseByForPayload;
      }
      if (typeof decreaseByForPayload === "number") {
        flatPayload.decreaseBy = decreaseByForPayload;
      }

      if (typeof childForPayload === "number") {
        flatPayload.child = childForPayload;
      }
      if (typeof childRateForPayload === "number") {
        flatPayload.childRate = childRateForPayload;
      }

      // If you specifically want child=100 and childRate=100 as in your sample:
      // flatPayload.child = 100;
      // flatPayload.childRate = 100;
      console.log("payload:\n" + JSON.stringify(flatPayload, null, 2));
      // 4) POST with isUpdate=true
      await dispatch(
        postHotelRatePlan({
          payload: flatPayload,
          options: { isUpdate: true, autoFillHotelId: false },
        })
      ).unwrap();

      console.log("payload : ", flatPayload);

      // toast.success("Rate plan updated.");

      show({
        variant: "success",
        title: "Recorded successfully!",
        description: "Rate plan updated.",
      });

      await refreshGrid();

      setOpenModal(false);
    } catch (err: any) {
      const msg =
        typeof err === "string"
          ? err
          : err?.message || err?.payload?.message || "Failed to override rates";
      toast.error(msg);
    } finally {
      setIsSaving(false); // ⬅️ stop spinner
    }
  };

  const handleInventorySave = () => {
    console.log("Saved room inventory override:", {
      roomType: selectedInventoryRoom,
      newInventory: selectedInventory,
      overrideRange: inventoryEditRange,
      clickedCellDate: selectedInventoryCellDate,
    });
    setInventoryOverrideModal(false);
  };

  // API Rooms state and effect
  const [apiRooms, setApiRooms] = useState<any[]>([]);

  // Filter rooms based on roomFilter and rateFilter states, using apiRooms
  const filteredRooms = apiRooms.filter((room) => {
    // Safely handle missing roomType or type
    const rawRoomType = room.roomType ?? room.type ?? "";
    const normalizedType = rawRoomType.toLowerCase().replace(/\s/g, "");
    // Filter by room type
    if (roomFilter !== "all" && normalizedType !== roomFilter) return false;
    // Filter by rate plans
    if (rateFilter !== "all") {
      const planKeys = Object.keys(room.plansByPlan || {});
      if (!planKeys.includes(rateFilter)) return false;
    }
    return true;
  });

  useEffect(() => {
    if (
      prevStartDateRef.current?.getTime() === startDate.getTime() &&
      prevEndDateRef.current?.getTime() === endDate.getTime()
    ) {
      return;
    }

    (async () => {
      await refreshGrid();
      prevStartDateRef.current = startDate;
      prevEndDateRef.current = endDate;
    })();
  }, [startDate, endDate, refreshGrid]);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchRateCodes() as any);
  }, [dispatch]);

  const { data: rateCodes, loading: rateCodesLoading } = useSelector(
    (s: RootState) => s.rateCode
  );
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  const rateCodeOptions = useMemo(
    () =>
      (rateCodes ?? []).map((rc) => ({
        id: rc.rateCodeID,
        code: rc.rateCode,
      })),
    [rateCodes]
  );

  const currencyOptions = useMemo(() => {
    const set = new Set<string>();
    apiRooms.forEach((room: any) => {
      const meta = room.planMetaMap || {};
      Object.values(meta).forEach((m: any) => {
        if (m?.currencyCode) set.add(m.currencyCode);
      });
    });
    return Array.from(set).sort();
  }, [apiRooms]);
  return (
    <DashboardLayout>
      {/* Top Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-row gap-4">
            <Select onValueChange={(value) => setCurrencyFilter(value)}>
              <SelectTrigger className="w-[150px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {currencyOptions.map((cur) => (
                  <SelectItem key={cur} value={cur}>
                    {cur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setRateCodeIdFilter(value)}>
              <SelectTrigger className="w-[180px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Rate Code Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rate Codes</SelectItem>
                {rateCodesLoading && (
                  <SelectItem disabled value="__loading">
                    Loading...
                  </SelectItem>
                )}
                {!rateCodesLoading &&
                  rateCodeOptions.map((rc) => (
                    <SelectItem key={rc.id} value={String(rc.id)}>
                      {rc.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setDisplayFilter(value)}>
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="pr-4">
              <VideoButton
                onClick={() => setShowRawOverlay(true)}
                label="Watch Video"
              />
            </div>

            <Select onValueChange={(value) => setRoomFilter(value)}>
              <SelectTrigger className="w-[160px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Rooms Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {Array.from(
                  new Set(
                    apiRooms.map((room) => {
                      const rawRoomType = room.roomType ?? room.type ?? "";
                      return rawRoomType.toLowerCase().replace(/\s/g, "");
                    })
                  )
                )
                  .filter((typeKey) => typeKey !== "")
                  .map((typeKey) => {
                    const originalRoom = apiRooms.find((room) => {
                      const rawRoomType = room.roomType ?? room.type ?? "";
                      return (
                        rawRoomType.toLowerCase().replace(/\s/g, "") === typeKey
                      );
                    });
                    const original =
                      originalRoom?.roomType ?? originalRoom?.type ?? "";
                    return (
                      <SelectItem key={typeKey} value={typeKey}>
                        {original}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setRateFilter(value)}>
              <SelectTrigger className="w-[140px] h-8 text-sm flex items-center gap-1">
                <SelectValue placeholder="Rates Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>
                <SelectItem value="BB">BB</SelectItem>
                <SelectItem value="HB">HB</SelectItem>
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
            {/* Right: Date and grid controls */}
            <div className="flex flex-row items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevRange}
                className="h-8 w-8"
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextRange}
                className="h-8 w-8"
              >
                <ChevronRightCircle className="h-5 w-5" />
              </Button>
              <div className="flex flex-row items-center gap-2">
                <span className="text-sm font-medium">Grid Days:</span>
                <Select onValueChange={(value) => setGridDays(Number(value))}>
                  <SelectTrigger className="w-[80px] h-8 text-sm px-3 border border-gray-300 rounded-md shadow-sm [&>svg]:hidden">
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
                <TableHeader style={{ border: "none" }}>
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
                    {dates.map((date, i) => {
                      // Helper to check if given date is today
                      const isToday = (d: Date) => {
                        const now = new Date();
                        return (
                          d.getFullYear() === now.getFullYear() &&
                          d.getMonth() === now.getMonth() &&
                          d.getDate() === now.getDate()
                        );
                      };
                      return (
                        <TableHead
                          key={i}
                          style={{
                            padding: 0,
                            border: "none",
                            lineHeight: "1",
                          }}
                          className={`text-center font-medium border  border-r border-gray-400 border-opacity-40 rounded-t-md ${headerTextSizeClass} ${
                            isToday(date)
                              ? "bg-green-100 text-black font-bold"
                              : date.getDay() === 0 || date.getDay() === 6
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
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room) => {
                    // Render Availability Row
                    return (
                      <React.Fragment key={room.roomType || room.type}>
                        {(displayFilter === "all" ||
                          displayFilter === "availability") && (
                          <TableRow className="border-b border-gray-400 border-opacity-40">
                            <TableCell
                              className={`p-1 text-primary text-sm font-semibold border-r border-gray-400 border-opacity-40 hover:cursor-pointer bg-[#EEF4FB] dark:bg-slate-300 dark:text-black `}
                            >
                              {room.roomType || room.type}
                              <br />
                              <span
                                className={`block text-[11px] font-normal uppercase mt-1`}
                              >
                                AVL
                              </span>
                            </TableCell>
                            {dates.map((date, idx) => {
                              // Find the availability object for this date
                              const dayAvailability = Array.isArray(
                                room.availability
                              )
                                ? room.availability.find(
                                    (d: any) =>
                                      format(new Date(d.date), "yyyy-MM-dd") ===
                                      format(date, "yyyy-MM-dd")
                                  )
                                : null;
                              return (
                                <TableCell
                                  key={idx}
                                  className={`text-center ${cellTextSizeClass} font-bold hover:cursor-pointer hover:bg-accent p-1 border-r border-gray-400 border-opacity-40 bg-[#EEF4FB] dark:text-black dark:bg-slate-300`}
                                  onClick={() =>
                                    handleInventoryClick(
                                      room.roomType || room.type,
                                      dayAvailability
                                        ? dayAvailability.count
                                        : 0,
                                      date
                                    )
                                  }
                                >
                                  {dayAvailability
                                    ? dayAvailability.count
                                    : "-"}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        )}
                        {/* Begin: Restore full rate plan rendering logic */}
                        {(displayFilter === "all" ||
                          displayFilter === "rate") &&
                          (() => {
                            const planKeys = Object.keys(
                              room.plansByPlan || {}
                            );
                            let plansToRender = planKeys;

                            // Filter by meal-plan (BB/HB/RO) using the label from planMetaMap
                            if (rateFilter !== "all") {
                              plansToRender = plansToRender.filter(
                                (k) =>
                                  room.planMetaMap?.[k]?.label === rateFilter
                              );
                            }

                            // Filter by selected rateCodeID
                            if (rateCodeIdFilter !== "all") {
                              plansToRender = plansToRender.filter(
                                (k) =>
                                  String(room.planMetaMap?.[k]?.rateCodeID) ===
                                  rateCodeIdFilter
                              );
                            }

                            // currency
                            if (currencyFilter !== "all") {
                              plansToRender = plansToRender.filter(
                                (k) =>
                                  room.planMetaMap?.[k]?.currencyCode ===
                                  currencyFilter
                              );
                            }

                            return plansToRender.flatMap((planKey, pIdx) => {
                              const planDates =
                                room.plansByPlan?.[planKey] || {};
                              const paxCounts = new Set<number>();
                              (Object.values(planDates) as any[][]).forEach(
                                (entries: any[]) =>
                                  entries.forEach((e) =>
                                    paxCounts.add(e.occupancy)
                                  )
                              );

                              return Array.from(paxCounts).map(
                                (paxCount, rowIdx) => {
                                  const firstRateEntry = Object.values(
                                    planDates
                                  )
                                    .flat()
                                    .find((e: any) => e.occupancy === paxCount);
                                  const rateId = `${
                                    room.roomType || room.type
                                  }-${planKey}-pax${paxCount}-${rowIdx}`;

                                  return (
                                    <React.Fragment key={rateId}>
                                      <TableRow className="border-b border-gray-400 border-opacity-40">
                                        <TableCell className="p-1 text-muted-foreground text-xs border-r border-gray-400 border-opacity-40 hover:cursor-pointer">
                                          <div className="flex flex-col pl-4">
                                            <span className="font-semibold">
                                              {room.roomType || room.type}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <span>
                                                {
                                                  room.planMetaMap?.[planKey]
                                                    ?.label
                                                }{" "}
                                                <small className="text-muted-foreground">
                                                  (
                                                  {
                                                    room.planMetaMap?.[planKey]
                                                      ?.currencyCode
                                                  }
                                                  )
                                                </small>
                                              </span>

                                              <Link2
                                                className={`h-4 w-4 ${
                                                  firstRateEntry?.isLinked
                                                    ? "text-blue-500 cursor-pointer"
                                                    : "text-gray-400"
                                                }`}
                                                onClick={() => {
                                                  if (
                                                    firstRateEntry?.isLinked
                                                  ) {
                                                    handleToggleRateOta(
                                                      room.roomType ||
                                                        room.type,
                                                      planKey
                                                    );
                                                  }
                                                }}
                                              />
                                              <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                                <User className="w-4 h-4" />
                                                <span>{paxCount}</span>
                                              </div>
                                              <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                                <Tag className="w-4 h-4" />
                                                <span>
                                                  {(
                                                    room.planMetaMap?.[planKey]
                                                      ?.ratePlan ??
                                                    firstRateEntry?.ratePlan ??
                                                    "-"
                                                  )
                                                    .toString()
                                                    .split(/[-–—|]/)[0]
                                                    .trim()}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        {dates.map((date, cellIdx) => {
                                          const dateKey = format(
                                            date,
                                            "yyyy-MM-dd"
                                          );
                                          const rates = planDates?.[dateKey];
                                          const rateForPax = Array.isArray(
                                            rates
                                          )
                                            ? rates.find(
                                                (r) => r.occupancy === paxCount
                                              )
                                            : null;
                                          const isAuto =
                                            firstRateEntry?.isLinked;
                                          const isEditable =
                                            !isAuto ||
                                            (isAuto &&
                                              rateForPax?.isDefaultRate);

                                          return (
                                            <TableCell
                                              key={cellIdx}
                                              className={`text-center p-1 ${cellTextSizeClass} border-r border-gray-400 border-opacity-40 ${
                                                rateForPax
                                                  ? isEditable
                                                    ? "hover:cursor-pointer hover:bg-accent"
                                                    : "text-black bg-gray-100 opacity-40"
                                                  : ""
                                              }`}
                                              onClick={() => {
                                                if (isEditable) {
                                                  handleRateClick(
                                                    room.roomType || room.type,
                                                    planKey,
                                                    rateForPax?.rate ?? 0,
                                                    date,
                                                    paxCount
                                                  );
                                                }
                                              }}
                                            >
                                              {rateForPax ? (
                                                <span className="text-xs">
                                                  {rateForPax.rate}
                                                </span>
                                              ) : (
                                                (() => {
                                                  const isAutoDash =
                                                    firstRateEntry?.isLinked;
                                                  const isDefaultRateRow =
                                                    Object.values(
                                                      planDates || {}
                                                    )
                                                      .flat()
                                                      .some(
                                                        (r: any) =>
                                                          r.isDefaultRate &&
                                                          r.occupancy ===
                                                            paxCount
                                                      );
                                                  const isEditableDash =
                                                    isAutoDash
                                                      ? isDefaultRateRow
                                                      : true;
                                                  return (
                                                    <span
                                                      className={`text-xs ${
                                                        isEditableDash
                                                          ? "hover:cursor-pointer"
                                                          : "text-muted-foreground"
                                                      }`}
                                                      onClick={() => {
                                                        if (isEditableDash) {
                                                          handleRateClick(
                                                            room.roomType ||
                                                              room.type,
                                                            planKey,
                                                            0,
                                                            date,
                                                            paxCount
                                                          );
                                                        }
                                                      }}
                                                    >
                                                      -
                                                    </span>
                                                  );
                                                })()
                                              )}
                                            </TableCell>
                                          );
                                        })}
                                      </TableRow>
                                    </React.Fragment>
                                  );
                                }
                              );
                            });
                          })()}
                        {/* End: Restore full rate plan rendering logic */}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* Rate Override Dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent ref={dialogRef} className="overflow-visible">
          <DialogHeader>
            <DialogTitle>Value Override</DialogTitle>

            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {/* Room Type, Occupancy, and Plan (stacked) */}
                <div className="mb-1">
                  <span className="font-medium">Room Type:</span>{" "}
                  {selectedRoomType}
                  {selectedOccupancy && (
                    <span className="ml-3 inline-flex items-center gap-1 text-muted-foreground text-sm">
                      <User className="h-4 w-4" />
                      {selectedOccupancy}
                    </span>
                  )}
                </div>
                <div className="mb-1">
                  <span className="font-medium">Plan:</span> {selectedPlan}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          {/* Restriction Dropdown */}
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
          {/* Current Price */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Current Price</span>
            <span className="text-base font-bold">{selectedRate} USD</span>
          </div>
          {/* SET, +, -, Value */}
          <div className="mb-2 flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <Button
                variant={rateMode === "set" ? "default" : "outline"}
                size="sm"
                className={`px-3 py-1 ${rateMode === "set" ? "font-bold" : ""}`}
                onClick={() => setRateMode("set")}
                type="button"
              >
                SET
              </Button>
              <Button
                variant={rateMode === "increase" ? "default" : "outline"}
                size="sm"
                className={`px-3 py-1 ${
                  rateMode === "increase" ? "font-bold" : ""
                }`}
                onClick={() => setRateMode("increase")}
                type="button"
              >
                +
              </Button>
              <Button
                variant={rateMode === "decrease" ? "default" : "outline"}
                size="sm"
                className={`px-3 py-1 ${
                  rateMode === "decrease" ? "font-bold" : ""
                }`}
                onClick={() => setRateMode("decrease")}
                type="button"
              >
                -
              </Button>
              <div className="flex-1"></div>
              <Button
                variant={isPercentMode ? "default" : "outline"}
                size="sm"
                className={`px-2 py-1 ${isPercentMode ? "font-bold" : ""}`}
                onClick={() => setIsPercentMode((p) => !p)}
                type="button"
                aria-pressed={isPercentMode}
                tabIndex={0}
              >
                %
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Value</label>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  value={rateValue}
                  min={0}
                  step={isPercentMode ? "0.01" : "1"}
                  onChange={(e) => {
                    setRateValue(Number(e.target.value));
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
                  {isPercentMode ? "%" : "USD"}
                </span>
              </div>
              {rateInputTouched && rateValue <= 0 && (
                <span className="block text-xs text-red-500 mt-1">
                  Should be a positive value
                </span>
              )}
              <span className="block text-xs text-muted-foreground mt-1">
                {(() => {
                  let preview = "";
                  let previewValue = selectedRate;
                  if (rateMode === "set") {
                    previewValue = rateValue;
                    preview = `Price will be set to ${rateValue} ${
                      isPercentMode ? "%" : "USD"
                    }`;
                  } else if (rateMode === "increase") {
                    if (isPercentMode) {
                      previewValue =
                        selectedRate + (selectedRate * rateValue) / 100;
                      preview = `Price will increase by ${rateValue}% to ${
                        Math.round(previewValue * 100) / 100
                      } USD`;
                    } else {
                      previewValue = selectedRate + rateValue;
                      preview = `Price will increase by ${rateValue} USD to ${
                        Math.round(previewValue * 100) / 100
                      } USD`;
                    }
                  } else if (rateMode === "decrease") {
                    if (isPercentMode) {
                      previewValue =
                        selectedRate - (selectedRate * rateValue) / 100;
                      preview = `Price will decrease by ${rateValue}% to ${
                        Math.round(previewValue * 100) / 100
                      } USD`;
                    } else {
                      previewValue = selectedRate - rateValue;
                      preview = `Price will decrease by ${rateValue} USD to ${
                        Math.round(previewValue * 100) / 100
                      } USD`;
                    }
                  }
                  return preview;
                })()}
              </span>
            </div>
          </div>
          {/* Custom Date Range */}
          <div className="mb-2">
            <label className="text-sm font-medium">Custom Date Range</label>
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
                    : "Select date range"}
                </Button>
              </PopoverTrigger>

              {/* ⬇️ this is the only real change */}
              <PopoverContentInDialog
                container={dialogRef.current} // mount inside DialogContent
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
                    // if range is cleared (undefined), keep previous selection instead of crashing
                    setEditRange((prev) => range ?? prev ?? undefined);

                    if (range?.from && range?.to) {
                      const diff =
                        Math.floor(
                          (range.to.getTime() - range.from.getTime()) /
                            (1000 * 3600 * 24)
                        ) + 1;
                      setCustomDaysInput(String(diff));
                    } else if (range?.from && !range?.to) {
                      setCustomDaysInput("1"); // single-day start picked
                    } else {
                      setCustomDaysInput(""); // fully cleared
                    }
                  }}
                  initialFocus
                />
              </PopoverContentInDialog>
            </Popover>
          </div>
          {/* Or Enter Number of Days */}
          <div className="mb-2">
            <label className="text-sm font-medium">Enter Number of Days</label>
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
                // Use current range start if set, else the clicked cell date
                const baseStart = editRange?.from ?? selectedCellDate;

                if (!isNaN(days) && baseStart) {
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
              <div className="text-sm mt-1">
                Calculated Range: {format(editRange.from, "MMM d, yyyy")} -{" "}
                {format(editRange.to, "MMM d, yyyy")}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpenModal(false)}
              className="flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={handleSave}
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
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </DashboardLayout>
  );
}

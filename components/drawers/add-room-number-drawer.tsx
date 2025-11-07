// @ts-nocheck
"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format, differenceInDays, addDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { fetchAvailableRooms } from "@/redux/slices/availableRoomsSlice";
import {
  addRoomToReservation,
  resetAddRoomState,
} from "@/redux/slices/reservationAddRoomSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Auto-rate helpers
import { fetchCalculatedRate } from "@/redux/slices/calculateRateSlice";
import { fetchMealPlans } from "@/redux/slices/mealPlanSlice";
import { getHotelRatePlans } from "@/controllers/hotelRatePlanController";
import { getRateCodes } from "@/controllers/rateCodeController";
import { getHotelRoomTypes } from "@/controllers/hotelRoomTypeController";
import { fetchReservationById } from "@/redux/slices/reservationByIdSlice";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { useToast } from "../toast/ToastProvider";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

export type RoomTypeOption = { id: number; name: string };

interface AvailableRoom {
  roomTypeID?: number;
  roomType?: string;
  finAct?: boolean;
  roomId: number;
  roomNo: string;
  is_foc?: boolean;
  bed_type?: string;
  bedType?: string;
  res_occupancy?: string;
  occupancy?: { adults?: number; children?: number };
  adults?: number;
  children?: number;
  net_rate?: number;
  amount?: number | string;
  meta?: {
    days_breakdown?: Array<{ amount?: string | number; date?: string }>;
    meal_plan?: string;
  };
}

export interface AddRoomNumberDrawerProps {
  open: boolean;
  onClose: () => void;
  reservationId: number;
  defaultCheckInISO: string;
  defaultCheckOutISO: string;
  roomTypeOptions: RoomTypeOption[];
  onAdded?: (payload?: any) => void;
  defaultAdults?: number;
  defaultChildren?: number;
  extraBody?: Record<string, any>;
  defaultCurrency?: string;
  defaultRateCodeId?: number | string;
  defaultMealPlanId?: number | string;
  booking?: any;
}

export default function AddRoomNumberDrawer({
  open,
  onClose,
  reservationId,
  defaultCheckInISO,
  defaultCheckOutISO,
  roomTypeOptions,
  onAdded,
  defaultAdults = 2,
  defaultChildren = 0,
  extraBody = {},
  defaultCurrency = "LKR",
  defaultRateCodeId,
  defaultMealPlanId,
  booking,
}: AddRoomNumberDrawerProps) {
  const dispatch = useAppDispatch();

  console.log("booking add room : ", booking);

  // --- Core state ---
  const [roomTypeId, setRoomTypeId] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState<string>(defaultCheckInISO ?? "");
  const [checkOut, setCheckOut] = useState<string>(defaultCheckOutISO ?? "");
  const [adults, setAdults] = useState<number>(defaultAdults);
  const [children, setChildren] = useState<number>(defaultChildren);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  const reservationState = useAppSelector((s: RootState) => s.reservationById);

  useEffect(() => {
    if (open && reservationId) {
      dispatch(fetchReservationById(reservationId) as any);
    }
  }, [open, reservationId, dispatch]);

  const reservationCtx = reservationState?.data ?? null;

  // --- Extra fields ---
  const [occupancy, setOccupancy] = useState<string>("");
  const [bedType, setBedType] = useState<string>("");
  const [isFOC, setIsFOC] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>(
    booking?.currencyCode || defaultCurrency
  );

  const [selectedMealPlan, setSelectedMealPlan] = useState<string>("");
  const [mealPlanName, setMealPlanName] = useState<string>("");
  const [rateCodeId, setRateCodeId] = useState<string>(
    defaultRateCodeId != null ? String(defaultRateCodeId) : ""
  );

  // --- Auto-rate state ---
  const [rateLoading, setRateLoading] = useState<boolean>(false);
  const [userEditedRate, setUserEditedRate] = useState<boolean>(false);
  const [avgRate, setAvgRate] = useState<number>(0);
  const [totalRate, setTotalRate] = useState<number>(0);
  const [daysMap, setDaysMap] = useState<Record<string, number>>({});
  const [childDaysMap, setChildDaysMap] = useState<Record<string, number>>({});
  const [childRateAvg, setChildRateAvg] = useState<number>(0);

  // --- lookups ---
  const availableRoomsState = useSelector((s: RootState) => s.availableRooms);
  const addRoomState = useSelector((s: RootState) => s.reservationAddRoom);
  const { data: mealPlans } = useAppSelector((s) => s.mealPlan);

  const [hotelRatePlans, setHotelRatePlans] = useState<any[]>([]);
  const [rateCodes, setRateCodes] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const { show } = useToast();

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "system",
    "addAnotherRoom"
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  const availableForSelectedType: AvailableRoom[] =
    (roomTypeId != null ? (availableRoomsState.data as any)[roomTypeId] : []) ??
    [];

  const isParsableDate = (s?: string) => {
    if (!s) return false;
    const d = new Date(s);
    return !Number.isNaN(d.getTime());
  };

  const toYmdSafe = (s?: string) => {
    if (!s) return "";
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
  };

  useEffect(() => {
    dispatch(fetchMealPlans());
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      try {
        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const selectedProperty = JSON.parse(
          localStorage.getItem("selectedProperty") || "{}"
        );
        const plans = await getHotelRatePlans({
          token: tokens.accessToken,
          hotelId: selectedProperty.id,
        });
        setHotelRatePlans(plans || []);
        const codes = await getRateCodes({ token: tokens.accessToken });
        setRateCodes(codes || []);
      } catch (e) {
        console.warn("Failed to load plans/codes (optional):", e);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const selectedProperty = JSON.parse(
          localStorage.getItem("selectedProperty") || "{}"
        );
        const types = await getHotelRoomTypes({
          token: tokens.accessToken,
          hotelId: selectedProperty.id,
        });
        setRoomTypes(types || []);
      } catch (e) {
        console.warn("Failed to load room types (capacity):", e);
      }
    })();
  }, []);

  const findPlanFor = (
    plans: any[],
    _rateCodeId?: string | number,
    _roomTypeId?: number | string
  ) => {
    if (!_rateCodeId || !_roomTypeId) return null;
    const rc = Number(_rateCodeId);
    const rt = Number(_roomTypeId);
    return (
      plans.find(
        (p) =>
          Number(p?.rateCodeID) === rc &&
          Number(p?.hotelRoomType?.hotelRoomTypeID) === rt
      ) || null
    );
  };

  const selectedType = useMemo(
    () =>
      roomTypes.find(
        (rt: any) => Number(rt?.hotelRoomTypeID) === Number(roomTypeId)
      ) || null,
    [roomTypes, roomTypeId]
  );
  const maxAdults = Math.max(1, Number(selectedType?.adultSpace ?? 2));
  const maxChildren = Math.max(0, Number(selectedType?.childSpace ?? 0));

  useEffect(() => {
    if (!roomTypeId) return;
    if (adults > maxAdults) setAdults(maxAdults);
    if (children > maxChildren) setChildren(maxChildren);
  }, [roomTypeId, maxAdults, maxChildren, adults, children]);

  useEffect(() => {
    if (!roomTypeId || !checkIn || !checkOut) return;
    dispatch(
      fetchAvailableRooms({
        hotelRoomTypeId: roomTypeId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
      }) as any
    );
  }, [dispatch, roomTypeId, checkIn, checkOut]);

  useEffect(() => {
    if (!open) {
      setRoomTypeId(null);
      setSelectedRoomId(null);
      setOccupancy("");
      setBedType("");
      setIsFOC(false);
      setAvgRate(0);
      setTotalRate(0);
      setDaysMap({});
      setChildDaysMap({});
      setChildRateAvg(0);
      setUserEditedRate(false);
      setRateCodeId(defaultRateCodeId != null ? String(defaultRateCodeId) : "");
      setSelectedMealPlan(
        defaultMealPlanId != null ? String(defaultMealPlanId) : ""
      );
      dispatch(resetAddRoomState());
      return;
    }
    setCheckIn(defaultCheckInISO ?? "");
    setCheckOut(defaultCheckOutISO ?? "");
    setRateCodeId(defaultRateCodeId != null ? String(defaultRateCodeId) : "");
    setSelectedMealPlan(
      defaultMealPlanId != null ? String(defaultMealPlanId) : ""
    );
  }, [
    open,
    defaultCheckInISO,
    defaultCheckOutISO,
    defaultRateCodeId,
    defaultMealPlanId,
    dispatch,
  ]);

  useEffect(() => {
    if (!selectedMealPlan) {
      setMealPlanName("");
      return;
    }
    const mp = mealPlans.find(
      (m) => String(m.mealPlanID) === String(selectedMealPlan)
    );
    setMealPlanName(mp?.shortCode || mp?.mealPlan || "");
  }, [mealPlans, selectedMealPlan]);

  const rateCodeText = useMemo(() => {
    if (!rateCodeId) return "";
    const rc = rateCodes.find(
      (r) => String(r.rateCodeID) === String(rateCodeId)
    );
    return rc?.rateCode || "";
  }, [rateCodes, rateCodeId]);

  const requiredDates = useMemo(() => {
    try {
      if (!checkIn || !checkOut) return [];
      const ci = new Date(checkIn);
      const co = new Date(checkOut);
      const n = Math.max(1, differenceInDays(co, ci)); // 👈 ensure >= 1
      return Array.from({ length: n }, (_, i) =>
        format(addDays(ci, i), "yyyy-MM-dd")
      );
    } catch {
      return [];
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (!reservationCtx) return;

    // prefer reservation data if not already set
    if (!rateCodeId && reservationCtx.rateCodeId != null) {
      setRateCodeId(String(reservationCtx.rateCodeId));
    }
    if (!selectedMealPlan && reservationCtx.ratePlanId != null) {
      // if you have a mapping from ratePlanId -> mealPlanId, set it here.
      // otherwise leave selectedMealPlan as-is; rate calc below doesn't require it strictly
    }
    if (!currency && reservationCtx.currencyCode) {
      setCurrency(reservationCtx.currencyCode);
    }
  }, [reservationCtx]);

  const getActivePlan = (
    plans: any[],
    rcId?: string | number,
    rtId?: string | number,
    fallbackRatePlanId?: string | number
  ) => {
    // primary match: by rate code + room type
    const primary = findPlanFor(plans, rcId, rtId);
    if (primary) return primary;

    // secondary: exact ratePlanId match for this room type
    if (fallbackRatePlanId && rtId) {
      const rp = plans.find(
        (p) =>
          Number(p?.hotelRatePlanID) === Number(fallbackRatePlanId) &&
          Number(p?.hotelRoomType?.hotelRoomTypeID) === Number(rtId)
      );
      if (rp) return rp;
    }

    // tertiary: any plan for this room type (last resort)
    if (rtId) {
      const anyRt = plans.find(
        (p) => Number(p?.hotelRoomType?.hotelRoomTypeID) === Number(rtId)
      );
      if (anyRt) return anyRt;
    }

    return null;
  };

  const toMoney = (n: number) => (isNaN(n) ? "0.00" : n.toFixed(2));

  useEffect(() => {
    if (!reservationCtx) return;
    if (roomTypeId && checkIn && checkOut && !isFOC) {
      recomputeFromAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationCtx]);

  // when plans are fetched later
  useEffect(() => {
    if (hotelRatePlans?.length && roomTypeId && checkIn && checkOut && !isFOC) {
      recomputeFromAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelRatePlans]);

  const recomputeFromAPI = async () => {
    if (!roomTypeId || !checkIn || !checkOut || isFOC) return;

    const fallbackRatePlanId = reservationCtx?.ratePlanId;
    const plan = getActivePlan(
      hotelRatePlans,
      rateCodeId,
      roomTypeId,
      fallbackRatePlanId
    );
    const ratePlanId = plan?.hotelRatePlanID;

    if (!ratePlanId) {
      // Don't spam toasts on every minor change; show once when user tries to calc
      console.warn("No matching rate plan for", {
        rateCodeId,
        roomTypeId,
        fallbackRatePlanId,
      });
      setDaysMap({});
      setChildDaysMap({});
      setTotalRate(0);
      if (!userEditedRate) setAvgRate(0);
      setChildRateAvg(0);
      return;
    }

    try {
      setRateLoading(true);
      const payload = {
        ratePlanId: Number(ratePlanId),
        currencyCode: String(currency || "LKR"),
        mealPlanId: Number(selectedMealPlan || 0),
        roomTypeId: Number(roomTypeId),
        startDate: `${format(new Date(checkIn), "yyyy-MM-dd")}T00:00:00`,
        endDate: `${format(new Date(checkOut), "yyyy-MM-dd")}T00:00:00`,
        paxCount: Number(adults || 1),
        childPaxCount: Number(children || 0),
        childAges: [],
      };

      const res = await dispatch(fetchCalculatedRate(payload) as any).unwrap();

      const daily = Array.isArray(res?.dailyRates) ? res.dailyRates : [];
      const _childDays: Record<string, number> = {};
      const _combinedDays: Record<string, number> = {};

      // fill from API first
      for (const d of daily) {
        const date = String(d.date);
        const adultRate = Number(d.rate ?? d.adultRate ?? 0);
        const perChild = Number(d.childRate ?? d.child_rate ?? d.child ?? 0);
        const childTotalFromAPI = Number(d.childTotal ?? d.child_amount ?? 0);
        const childForDay =
          childTotalFromAPI > 0
            ? childTotalFromAPI
            : perChild * Number(children || 0);
        _childDays[date] = isFOC ? 0 : childForDay;
        _combinedDays[date] = isFOC ? 0 : adultRate + childForDay;
      }

      // fallback from plan table if API didn't return all required dates
      const hotelRates: any[] = Array.isArray(plan?.hotelRates)
        ? plan!.hotelRates
        : [];
      const byDate = new Map<string, any>(
        hotelRates.map((r: any) => [String(r.rateDate), r])
      );

      const computeFromPlan = (dateStr: string) => {
        const rec = byDate.get(dateStr);
        if (!rec) return { total: 0, child: 0 };
        const sellMode = String(rec.sellMode || "").toLowerCase();
        let adultAmount = 0;
        if (sellMode === "per person") {
          const capped = Math.min(Math.max(Number(adults) || 1, 1), 18);
          const col = `pax${capped}`;
          adultAmount = Number(rec[col] ?? rec.defaultRate ?? 0);
        } else {
          adultAmount = Number(rec.defaultRate ?? 0);
        }
        const perChild = Number(rec.child ?? 0);
        const childTotal = perChild * (Number(children) || 0);
        return { total: adultAmount + childTotal, child: childTotal };
      };

      // ensure every required date has values
      const fallbackAvg = (() => {
        const vals = Object.values(_combinedDays);
        if (!vals.length) return 0;
        return vals.reduce((s, v) => s + Number(v || 0), 0) / vals.length;
      })();

      for (const d of requiredDates) {
        const hasCombined = Object.prototype.hasOwnProperty.call(
          _combinedDays,
          d
        );
        if (!hasCombined) {
          const fromPlan = computeFromPlan(d);
          _combinedDays[d] = fromPlan.total || fallbackAvg;
          _childDays[d] = fromPlan.child || 0;
        } else if ((children || 0) > 0 && !_childDays[d]) {
          const fromPlan = computeFromPlan(d);
          _childDays[d] = fromPlan.child || 0;
          _combinedDays[d] = fromPlan.total || _combinedDays[d];
        }
      }

      // compute totals/averages
      const total = Object.values(_combinedDays).reduce(
        (s, v) => s + Number(v || 0),
        0
      );
      const nights = requiredDates.length; // always >= 1 because of patch #1
      const avg = nights > 0 ? total / nights : 0;
      const childTotal = Object.values(_childDays).reduce(
        (s, v) => s + Number(v || 0),
        0
      );
      const childAvg = nights > 0 ? childTotal / nights : 0;

      setDaysMap(_combinedDays);
      setChildDaysMap(_childDays);
      setTotalRate(isFOC ? 0 : total);
      if (!userEditedRate) setAvgRate(isFOC ? 0 : avg);
      setChildRateAvg(childAvg);
    } catch (e) {
      console.error("Auto-rate failed:", e);
      // fail closed so submit button doesn’t send empty days
      setDaysMap({});
      setChildDaysMap({});
      setTotalRate(0);
      if (!userEditedRate) setAvgRate(0);
      setChildRateAvg(0);
    } finally {
      setRateLoading(false);
    }
  };

  useEffect(() => {
    if (!isFOC && roomTypeId && rateCodeId && checkIn && checkOut) {
      recomputeFromAPI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    roomTypeId,
    rateCodeId,
    selectedMealPlan,
    currency,
    adults,
    children,
    checkIn,
    checkOut,
  ]);
  const handleSubmit = async () => {
    if (!roomTypeId) return toast.error("Please select a room type.");
    if (!checkIn || !checkOut) return toast.error("Please set both dates.");
    if (!selectedRoomId) return toast.error("Please select a room number.");

    // // Must have nightly breakdown unless FOC
    // if (!isFOC && Object.keys(daysMap).length === 0) {
    //   toast.error("Rate calculation failed. Please refresh or adjust dates.");
    //   return;
    // }

    const plan = findPlanFor(hotelRatePlans, rateCodeId, roomTypeId);
    const ratePlanId = plan?.hotelRatePlanID;

    try {
      if (!reservationCtx) {
        toast.error("Reservation not loaded. Try again.");
        return;
      }

      // ---- FIXES & SAFETY DEFAULTS -----------------------------------------
      const arrival_date = toYmdSafe(checkIn);
      const departure_date = toYmdSafe(checkOut);

      const occAdults = Number(adults || 0);
      const occChildren = Number(children || 0);

      const res_occupancy_final =
        (occupancy && occupancy.trim()) ||
        (occAdults <= 1 ? "single" : "double");

      const meal_plan_final = (mealPlanName && mealPlanName.trim()) || "FB"; // <- REQUIRED by your PMS

      const currencyFinal = (
        reservationCtx.currencyCode ||
        booking?.currencyCode ||
        currency ||
        defaultCurrency ||
        "USD"
      ).toUpperCase();

      // customer.country cannot be empty in your PMS
      const safeCountry =
        reservationCtx.countryCode ||
        booking?.customer?.country ||
        booking?.country ||
        "N/A" ||
        "N/A";

      // Build per-day string map (2 dp). When FOC, empty object is allowed.
      const formattedDays = isFOC
        ? {}
        : Object.fromEntries(
            Object.entries(daysMap).map(([d, v]) => [
              d,
              Number(v || 0).toFixed(2),
            ])
          );

      // Totals
      const calculatedTotal = isFOC
        ? 0
        : Object.values(daysMap).reduce((s, v) => s + Number(v || 0), 0);

      // Child-only day map (from your computed childDaysMap)
      const daysAdultOnly = Object.fromEntries(
        Object.entries(formattedDays).map(([d, combinedStr]) => {
          const combined = Number(combinedStr || 0);
          const childOnly = Number(childDaysMap?.[d] ?? 0);
          const adultOnly = Math.max(0, combined - childOnly);
          return [d, adultOnly.toFixed(2)];
        })
      );

      // If something went off and adult map is empty while not FOC, backfill evenly
      if (!isFOC && Object.keys(daysAdultOnly).length === 0) {
        const nights = Math.max(
          1,
          (() => {
            try {
              return differenceInDays(
                new Date(departure_date),
                new Date(arrival_date)
              );
            } catch {
              return 1;
            }
          })()
        );
        const nightly = calculatedTotal / nights;
        const dates = requiredDates.length ? requiredDates : [arrival_date];
        for (const d of dates) daysAdultOnly[d] = nightly.toFixed(2);
      }

      // Compose the “body” used for line values
      const body = {
        hotelRoomTypeId: Number(roomTypeId),
        roomId: Number(selectedRoomId),
        checkInDate: arrival_date,
        checkOutDate: departure_date,
        adults: occAdults,
        child: occChildren,
        is_foc: !!isFOC,
        reservation_status_id: 1,
        bed_type: bedType || "",
        res_occupancy: res_occupancy_final, // FIX: required
        currency: currencyFinal,
        rate_code_id:
          Number(reservationCtx.rateCodeId ?? defaultRateCodeId ?? 0) ||
          undefined,
        meal_plan_id: selectedMealPlan ? Number(selectedMealPlan) : undefined,
        rate_plan_id: ratePlanId ? Number(ratePlanId) : undefined,
        net_rate: isFOC ? 0 : Number(avgRate || 0),
        child_rate: Number(childRateAvg || 0),
        amount: String(calculatedTotal.toFixed(2)), // FIX: non-zero when not FOC
        days: formattedDays,
        meta: {
          meal_plan: meal_plan_final, // FIX: required
          days_breakdown: isFOC
            ? []
            : Object.keys(daysMap).map((d) => ({
                date: d,
                amount: String(Number(daysMap[d] || 0).toFixed(2)),
              })),
        },
        is_day_room: false,
        suppliment: 0,
        discount: 0,
      };

      // High-level context
      const nowIso = new Date(systemDate).toISOString();
      const hotelIdFinal = Number(reservationCtx.hotelID || 0);

      // For adding a room to EXISTING booking, use the real booking id (reservationNo).
      const bookingUniqueId = String(
        reservationCtx.reservationNo || reservationId
      );

      const guestProfileIdFinal = Number(
        reservationCtx.guestProfileId ??
          booking?.guestProfileId ??
          booking?.guest_profile_id ??
          0
      );

      const agentFinal =
        reservationCtx.sourceOfBooking ||
        booking?.agent ||
        booking?.ota_name ||
        "";

      const rateCodeIdFinal =
        Number(reservationCtx.rateCodeId ?? body.rate_code_id ?? 0) || null;

      const ratePlanIdFinal =
        Number(reservationCtx.ratePlanId ?? body.rate_plan_id ?? 0) || null;

      // ---- Build room line ---------------------------------------------------
      const roomLine = {
        reservation_status_id: Number(body.reservation_status_id || 1),
        is_foc: !!body.is_foc,
        taxes: [],
        services: [],
        amount: body.amount, // FIX: must match header’s amount roll-up logic per-line
        days: daysAdultOnly, // FIX: adult-only map (child handled by child_rate)
        guest_profile_id: guestProfileIdFinal || 0, // 0 when not binding a profile
        ota_commission: "0",
        guests: [],
        occupancy: {
          children: occChildren,
          adults: occAdults,
          ages: [],
          infants: 0,
        },
        rate_plan_id: String(ratePlanIdFinal || "1"),
        room_type_id: "0",
        hotel_room_type_id: Number(body.hotelRoomTypeId || 0),
        booking_room_id: String(body.roomId || ""),
        checkin_date: arrival_date,
        checkout_date: departure_date,
        is_cancelled: false,
        ota_unique_id: "",
        disc_percen: 0,
        discount: 0,
        child_rate: Number(body.child_rate || 0),
        suppliment: Number(body.suppliment || body.supplement || 0),
        net_rate: Number(body.net_rate || 0),
        is_day_room: !!body.is_day_room,
        bed_type: String(body.bed_type || ""),
        res_occupancy: String(body.res_occupancy || ""),
        meta: { meal_plan: String(body?.meta?.meal_plan || "") },
      };

      // ---- Envelope (attributes) --------------------------------------------
      const revId = `addroom-rev-${Date.now()}`;
      const attributes = {
        id: revId,
        meta: { ruid: revId, is_genius: false },
        status: "new",
        services: [],
        currency: currencyFinal,
        amount: body.amount, // header amount = line total (single room add)
        rate_code_id: rateCodeIdFinal,
        created_by:
          (typeof fullName !== "undefined" && fullName) ||
          reservationCtx.createdBy ||
          "system",
        remarks_internal: "",
        remarks_guest: reservationCtx.remarksGuest || "",
        guest_profile_id: guestProfileIdFinal || 0, // match good payload behavior
        agent: agentFinal,
        inserted_at: nowIso,
        channel_id: "",
        property_id: "",
        hotel_id: hotelIdFinal,
        unique_id: bookingUniqueId,
        system_id: "FIT",
        ota_name: agentFinal,
        booking_id: bookingUniqueId,
        notes: reservationCtx.remarksGuest || "",
        arrival_date,
        arrival_hour: "",
        customer: {
          meta: { ruid: "", is_genius: false },
          name: reservationCtx.bookerFullName || "",
          zip: "",
          address: "",
          country: safeCountry, // FIX: cannot be empty
          city: "",
          language: "en",
          mail: reservationCtx.email || "",
          phone: reservationCtx.phone || "",
          surname: "",
          company: "",
        },
        departure_date,
        deposits: [],
        ota_commission: "0",
        ota_reservation_code: "", // FIX: empty when payment_collect is property
        payment_collect: "property",
        payment_type: "",
        rooms: [roomLine],
        occupancy: {
          children: occChildren,
          adults: occAdults,
          ages: [],
          infants: 0,
        },
        guarantee: undefined,
        secondary_ota: "",
        acknowledge_status: "pending",
        raw_message: "{}",
        is_crs_revision: false,
        is_day_room: !!body.is_day_room,
        ref_no: reservationCtx.refNo || "",
        group_name: "",
        tour_no: "",
      };

      const addRoomPayload = {
        data: [
          {
            attributes,
            id: revId,
            type: "booking_revision",
            relationships: {
              data: {
                property: { id: String(hotelIdFinal || 0), type: "property" },
                booking: { id: bookingUniqueId, type: "booking" },
              },
            },
          },
        ],
        meta: {
          total: 1,
          limit: 10,
          order_by: "inserted_at",
          page: 1,
          order_direction: "asc",
        },
        dateTime: nowIso,
      };

      console.log(
        "ADD-ROOM ▶ payload (json)\n",
        JSON.stringify(addRoomPayload, null, 2)
      );

      // ---- Dispatch ----------------------------------------------------------
      toast.loading("Adding room…", { id: "add-room" });
      const result = await dispatch(
        addRoomToReservation({
          reservationId,
          bookingRevision: addRoomPayload,
        }) as any
      );

      if (addRoomToReservation.fulfilled.match(result)) {
        show({
          variant: "success",
          title: "Recorded successfully!",
          description: `Room added to reservation.", ${id}: "add-room"`,
        });

        // toast.success("Room added to reservation.", { id: "add-room" });
        onAdded?.(result.payload);
        onClose();
      } else {
        const msg =
          (result.payload as string) || "Failed to add room to reservation.";
        toast.error(msg, { id: "add-room" });
        console.log("Add room error payload:", msg);
      }
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong.");
    }
  };

  const currentRoomTypeName = useMemo(() => {
    if (!roomTypeId) return "";
    return roomTypeOptions.find((rt) => rt.id === roomTypeId)?.name ?? "";
  }, [roomTypeId, roomTypeOptions]);

  const loadingAvail = availableRoomsState.loading && !!roomTypeId;
  const loadingAvailOrRate = loadingAvail || rateLoading;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="z-[90] w-full sm:max-w-3xl rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Add Room to Reservation</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Check-in</Label>
              <Input
                type="text"
                value={
                  isParsableDate(checkIn)
                    ? format(new Date(checkIn), "yyyy-MM-dd")
                    : checkIn || ""
                }
                readOnly
                aria-readonly="true"
              />
            </div>
            <div>
              <Label className="mb-1 block">Check-out</Label>
              <Input
                type="text"
                value={
                  isParsableDate(checkOut)
                    ? format(new Date(checkOut), "yyyy-MM-dd")
                    : checkOut || ""
                }
                readOnly
                aria-readonly="true"
              />
            </div>
          </div>

          {/* READ-ONLY: Rate Code + Meal Plan (autofilled from existing reservation) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block">Rate Code</Label>
              <Input
                type="text"
                value={rateCodeText || "—"}
                readOnly
                aria-readonly="true"
                title={
                  rateCodeId
                    ? `ID: ${rateCodeId}`
                    : "Rate Code not found on reservation"
                }
              />
            </div>
            <div>
              <Label className="mb-1 block">Meal Plan</Label>
              <Input
                type="text"
                value={mealPlanName || "—"}
                readOnly
                aria-readonly="true"
                title={
                  selectedMealPlan
                    ? `ID: ${selectedMealPlan}`
                    : "Meal Plan not found on reservation"
                }
              />
            </div>
          </div>

          {/* Room Type */}
          <div>
            <Label className="mb-1 block">Room Type</Label>
            <div className="grid grid-cols-1 gap-2">
              <div className="relative">
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={roomTypeId != null ? String(roomTypeId) : ""}
                  onChange={(e) => {
                    setRoomTypeId(Number(e.target.value));
                    setSelectedRoomId(null);
                    setUserEditedRate(false);
                  }}
                >
                  <option value="" disabled>
                    Select a room type
                  </option>
                  {roomTypeOptions?.map((rt) => (
                    <option key={rt.id} value={String(rt.id)}>
                      {rt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Availability table (select room) */}
          <div>
            <div className="flex items-end gap-2 mb-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!roomTypeId || !checkIn || !checkOut) {
                    toast.error("Select room type and ensure both dates.");
                    return;
                  }
                  dispatch(
                    fetchAvailableRooms({
                      hotelRoomTypeId: roomTypeId,
                      checkInDate: checkIn,
                      checkOutDate: checkOut,
                    }) as any
                  );
                }}
                disabled={!roomTypeId || !checkIn || !checkOut || loadingAvail}
                title="Refresh availability"
              >
                {loadingAvail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Shows available rooms for the selected type & dates.
              </p>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Room No</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAvail ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <div className="flex items-center gap-2 py-6">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Loading rooms…
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : availableForSelectedType?.length ? (
                    availableForSelectedType.map((r) => {
                      const isSel = selectedRoomId === r.roomId;
                      return (
                        <TableRow
                          key={r.roomId}
                          className={isSel ? "bg-muted/50" : ""}
                          onClick={() => setSelectedRoomId(r.roomId)}
                        >
                          <TableCell>
                            <input
                              type="radio"
                              aria-label={`Select room ${r.roomNo}`}
                              checked={isSel}
                              onChange={() => setSelectedRoomId(r.roomId)}
                            />
                          </TableCell>
                          <TableCell>
                            {r.roomType ?? currentRoomTypeName ?? "—"}
                          </TableCell>
                          <TableCell>{r.roomNo ?? "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-sm text-muted-foreground"
                      >
                        {roomTypeId
                          ? "No rooms found for these dates"
                          : "Select a room type first"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Occupancy / Bed / Currency / Pax */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1 block">Adults</Label>
              <div className="relative">
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={String(adults)}
                  disabled={!roomTypeId}
                  onChange={(e) => {
                    setAdults(Number(e.target.value));
                    setUserEditedRate(false);
                  }}
                >
                  {Array.from({ length: maxAdults }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Children</Label>
              <div className="relative">
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={String(children)}
                  disabled={!roomTypeId}
                  onChange={(e) => {
                    setChildren(Number(e.target.value));
                    setUserEditedRate(false);
                  }}
                >
                  {Array.from({ length: maxChildren + 1 }, (_, i) => i).map(
                    (n) => (
                      <option key={n} value={String(n)}>
                        {n}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Currency</Label>
              <div className="relative">
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setUserEditedRate(false);
                  }}
                >
                  <option value="LKR">LKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Per-room controls (apply to the selected row) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="mb-1 block">Occupancy</Label>
              <div className="relative">
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={occupancy}
                  onChange={(e) => setOccupancy(e.target.value)}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                  <option value="quadruple">Quadruple</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Bed</Label>
              <div className="relative">
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value)}
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="double">Double</option>
                  <option value="twin">Twin</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Rate (avg / night)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={isFOC ? "0" : String(avgRate || 0)}
                  disabled={isFOC || loadingAvailOrRate}
                  onChange={(e) => {
                    setAvgRate(Number(e.target.value || 0));
                    setUserEditedRate(true);
                  }}
                />
                {loadingAvailOrRate && (
                  <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin" />
                )}
              </div>
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <input
                  id="foc"
                  type="checkbox"
                  checked={isFOC}
                  onChange={(e) => {
                    setIsFOC(e.target.checked);
                    if (e.target.checked) {
                      setAvgRate(0);
                      setTotalRate(0);
                      setDaysMap({});
                      setChildDaysMap({});
                      setChildRateAvg(0);
                      setUserEditedRate(false);
                    } else {
                      setUserEditedRate(false);
                      recomputeFromAPI();
                    }
                  }}
                />
                <Label htmlFor="foc">FOC</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedRoomId || !roomTypeId || addRoomState.loading}
            >
              {addRoomState.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                "Add Room"
              )}
            </Button>
          </div>
        </div>
        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />

        <div className="top-4 right-14 absolute">
          <VideoButton
            onClick={() => setShowRawOverlay(true)}
            label="Watch Video"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

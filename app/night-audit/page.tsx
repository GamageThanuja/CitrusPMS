"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllReservations } from "@/controllers/reservationController";
import { getRateDetailsByReservationDetailId } from "@/controllers/rateDetailsController";
import { RateDetailPayload } from "@/types/rateDetails";
import { getPosTable } from "@/controllers/posController";
import { PosTransaction } from "@/types/pos";
import { CheckOutFormDrawer } from "@/components/drawers/check-out-form-drawer";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { addDays, isSameDay, parseISO, startOfDay, subDays } from "date-fns";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { useDispatch, useSelector } from "react-redux";
import { parseSystemDateToLocal } from "@/utils/date";
import { fetchPosTables } from "@/redux/slices/posTableSlice";
import { CheckInFormDrawer } from "@/components/drawers/check-in-form-drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NoShowDrawer } from "@/components/drawers/noShow-drawer";
import { postNightAudit } from "@/redux/slices/nightAuditSlice";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import {
  fetchRateAvailability,
  selectRateAvailability,
  selectRateAvailabilityByDate,
} from "@/redux/slices/availabilitySlice";
import {
  fetchNightAuditRateChecks,
  selectRateChecks,
  selectRateChecksLoading,
  selectRateChecksError,
  selectRateChecksLastParams,
} from "@/redux/slices/nightAuditRateCheckerSlice";
import { fetchReservationById } from "@/redux/slices/reservationByIdSlice";
import { fetchFolioByReservationDetailId } from "@/redux/slices/fetchFolioByDetailIdSlice";
import { fetchRateDetailsById } from "@/redux/slices/rateDetailsSlice";
import { toast } from "sonner";
import { noShowReservation } from "@/redux/slices/noShowSlice";

import {
  fetchHotelTaxConfigs,
  selectHotelTaxConfigs,
} from "@/redux/slices/hotelTaxConfigSlice";
import { fetchHotelTaxByHotelId } from "@/redux/slices/hotelTaxByHotelIDSlice";
import {
  reverseExclusiveFromInclusive_API,
  computeInclusiveFromExclusive_API,
  type ApiTax,
} from "@/utils/tax";
import {
  fetchHotelMealAllocations,
  selectHotelMealAllocations,
} from "@/redux/slices/fetchHotelMealAllocationSlice";

import { fetchMealPlans } from "@/redux/slices/mealPlanSlice";
import {
  createGlTransaction,
  GlTransactionRequest,
} from "@/redux/slices/glTransactionCreateSlice";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";
import { fetchExchangeRate } from "@/redux/slices/currencyExchangeSlice";
import { useRef } from "react";
import {
  updateNightAuditDate,
  selectNightAuditStatus,
} from "@/redux/slices/nightAuditSlice";

type RateCalcEntry = {
  inclusive: number; // from API (netRate or roomRate)
  exclusive: number; // reverse (without tax)
  taxTotal: number; // inclusive - exclusive
  factor: number; // effective multiplier from ladder
  currency: string; // rc.currencyCode
  unresolved: string[]; // any unresolved tokens from API ladder
};

type MealBreakdown = {
  reservationDetailId: number;
  reservationId: number;
  dateISO: string;
  planCode: string;
  planName?: string;
  adult: number;
  child: number;
  currency: string;

  // NEW: account ids per component (+ AI)
  accounts: {
    breakfastAccountId?: number;
    lunchAccountId?: number;
    dinnerAccountId?: number;
    allInclusiveAccountId?: number | null;
  };

  perMeal: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  totals: {
    adultsPortion: number;
    childrenPortion: number;
    grandTotal: number;
  };
};

type ReservationChargeRow = {
  reservationDetailId: number;
  reservationId: number;
  dateISO: string;
  currency: string;
  room: {
    baseExclusive: number;
    tax: number;
    netInclusive: number;
  };
  meals: {
    breakfast: number;
    lunch: number;
    dinner: number;
    total: number;

    // carry plan meta
    planCode?: string;
    planName?: string;
    adult?: number;
    child?: number;

    // ✅ account ids mirrored here
    breakfastAccountId?: number;
    lunchAccountId?: number;
    dinnerAccountId?: number;
    allInclusiveAccountId?: number | null;

    // optional helper if you want to post AI as a single line
    allInclusiveTotal?: number;
  };
  roomOnlyExclusive: number;
  grandTotal: number;

  taxes: {
    onPackage: TaxBreakdown;
    onRoomOnly: TaxBreakdown;
    onMeals: TaxBreakdown;
  };
};

type TaxLine = {
  name: string;
  pct: number;
  accountId: number | null | undefined;
  amount: number; // tax amount for this line
};

type TaxBreakdown = {
  baseExclusive: number; // the base we applied taxes to
  totalTax: number; // sum of lines
  lines: TaxLine[];
};

type CircularProgressProps = {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  trackClassName?: string;
  progressClassName?: string;
  label?: string;
};

type GlLineView = {
  id: string;
  accountID: number;
  memo?: string;
  amount?: number; // debit - credit (you already add this in buildGlForRow)
  status: "creating" | "posted" | "error";
  pct: number; // 0..100 for a tiny per-line progress
};

export default function NightAuditPage() {
  // const [posTables, setPosTables] = useState<PosTransaction[]>([]);

  const itemsPerPage = 4;
  const [page, setPage] = useState({
    checkOuts: 1,
    checkIns: 1,
    outletBills: 1,
    roomRates: 1,
  });
  const [hotelCode, setHotelCode] = useState("");
  const [isCheckOutDrawerOpen, setIsCheckOutDrawerOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [step, setStep] = useState(0);
  const [checkOuts, setCheckOuts] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [test, setTest] = useState<any[]>([]);
  const [roomRates, setRoomRates] = useState<
    Record<number, RateDetailPayload[]>
  >({});
  const [toBeCheckOuts, setToBeCheckOuts] = useState<any[]>([]);
  const [alreadyCheckedOuts, setAlreadyCheckedOuts] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCheckInDrawerOpen, setIsCheckInDrawerOpen] = useState(false);
  const [selectedCheckInReservation, setSelectedCheckInReservation] =
    useState(null);

  const [auditErrors, setAuditErrors] = useState<string[]>([]);

  const [noShowOpen, setNoShowOpen] = useState(false);
  const [bookingDetail, setBookingDetail] = useState<any>(null);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false); // Optional loading state
  const [setTakePaymentsOpen] = useState(false); // If you're using this inside NoShowDrawer

  const dispatch = useDispatch();

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  const {
    loading: auditLoading,
    error: auditError,
    data: auditData,
  } = useSelector(
    (state: RootState) =>
      state.nightAudit || { loading: false, error: null, data: null }
  );

  const rateAvail = useAppSelector(selectRateAvailability); // {data, loading, error}
  const rateAvailByDate = useAppSelector(selectRateAvailabilityByDate);

  const hotelCurrency = useStoredCurrencyCode();
  const fxRateMapRef = useRef<Record<string, number>>({});
  console.log("hotelCurrency : ", hotelCurrency);

  console.log("rateAvailByDate :", JSON.stringify(rateAvail, null, 2));
  const [lineFeed, setLineFeed] = useState<GlLineView[]>([]);
  const [showDoneScreen, setShowDoneScreen] = useState(false);

  const MEAL_ACCOUNT_IDS = {
    breakfast: 21,
    lunch: 23,
    dinner: 22,
    allInclusive: 24, // used when plan is AI
  } as const;

  useEffect(() => {
    if (hotelCode) {
      dispatch(fetchPosTables({ tableNo: "", isFinished: false }));
    }
  }, [hotelCode, dispatch]);

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  function seedFeedFromPayload(p: GlTransactionRequest) {
    const items: GlLineView[] = (p.glAccTransactions ?? []).map((l, idx) => ({
      id: `${p.reservationDetailId ?? p.reservationDetailID}-${idx}`,
      accountID: Number(l.accountID),
      memo: String(l.memo ?? l.comment ?? ""),
      amount: (l as any).amount, // you added it in pushLine()
      status: "creating",
      pct: 0,
    }));
    setLineFeed(items);
  }

  const updateFeed = (id: string, patch: Partial<GlLineView>) =>
    setLineFeed((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );

  const today =
    systemDate?.split("T")[0] ?? new Date().toISOString().split("T")[0];

  const yesterday = subDays(parseISO(today), 1).toISOString().split("T")[0];

  const toDateOnly = (d: string | Date) => {
    // Return YYYY-MM-DD without leaking local TZ into UTC conversion
    // If input already has 'Z', we can safely toISOString(); otherwise keep the raw date.
    const s = typeof d === "string" ? d : new Date(d).toISOString();
    return s.includes("T") ? s.split("T")[0] : s; // handles "2025-09-14" or "2025-09-14T00:00:00Z"
  };

  console.log("System Date:", systemDate);
  console.log("Today: aaa", today);
  console.log("Yesterday:", yesterday);

  useEffect(() => {
    if (!systemDate) return;
    // fetch both yesterday & today so audit can see both
    dispatch(
      fetchRateAvailability({
        startDate: today, // "YYYY-MM-DD"
        endDate: today, // "YYYY-MM-DD"
      })
    );
  }, [dispatch, systemDate, today, yesterday]);

  // Pagination utility
  const paginate = (items: any[], pageNumber: number) => {
    const startIndex = (pageNumber - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const selectedProperty = localStorage.getItem("selectedProperty");
      const parsed = selectedProperty ? JSON.parse(selectedProperty) : {};
      setHotelCode(parsed?.hotelCode || "");
    }
  }, []);

  // useEffect(() => {
  //   const fetchPosData = async () => {
  //     if (hotelCode) {
  //       try {
  //         const tokens = JSON.parse(
  //           localStorage.getItem("hotelmateTokens") || "{}"
  //         );
  //         const accessToken = tokens.accessToken;
  //         const selectedProperty = JSON.parse(
  //           localStorage.getItem("selectedProperty") || "{}"
  //         );

  //         const posData = await getPosTable({
  //           hotelCode: selectedProperty.hotelCode?.toString(),
  //           hotelPosCenterId: selectedProperty.hotelPosCenterId,
  //           isFinished: false,
  //           token: accessToken,
  //         });

  //         setPosTables(posData);
  //       } catch (error) {
  //         console.error("Error fetching POS data:", error);
  //         setPosTables([]);
  //       }
  //     }
  //   };

  //   fetchPosData();
  // }, [hotelCode]);

  const rateChecks = useAppSelector(selectRateChecks);
  const rateChecksLoading = useAppSelector(selectRateChecksLoading);
  const rateChecksError = useAppSelector(selectRateChecksError);
  const rateChecksLastParams = useAppSelector(selectRateChecksLastParams);
  const taxConfigs = useSelector(selectHotelTaxConfigs);

  // kick off load once hotelCode (or selectedProperty) exists

  function normalizePlanCode(c?: string) {
    return (c || "").trim().toUpperCase();
  }

  function includedMealsForPlan(
    planShortCode: string,
    mealPlanStateData: Array<{
      shortCode: string;
      breakFast: boolean;
      lunch: boolean;
      dinner: boolean;
      ai: boolean;
      mealPlan: string;
    }> = []
  ) {
    const code = normalizePlanCode(planShortCode);

    // Try match from API-provided meal plans by shortCode first
    const mp = mealPlanStateData.find(
      (m) => normalizePlanCode(m.shortCode) === code
    );

    if (mp) {
      return {
        planName: mp.mealPlan,
        includeBreakfast: !!mp.breakFast,
        includeLunch: !!mp.lunch,
        includeDinner: !!mp.dinner,
        isAI: !!mp.ai,
      };
    }

    // Fallback mapping for common hotel plan codes
    // RO = none, BB = breakfast, HB = breakfast+dinner, FB = all three, AI = all three (treat as full)
    switch (code) {
      case "RO":
        return {
          planName: "Room Only",
          includeBreakfast: false,
          includeLunch: false,
          includeDinner: false,
          isAI: false,
        };
      case "BB":
        return {
          planName: "Bed & Breakfast",
          includeBreakfast: true,
          includeLunch: false,
          includeDinner: false,
          isAI: false,
        };
      case "HB":
        return {
          planName: "Half Board",
          includeBreakfast: true,
          includeLunch: false,
          includeDinner: true,
          isAI: false,
        };
      case "FB":
        return {
          planName: "Full Board",
          includeBreakfast: true,
          includeLunch: true,
          includeDinner: true,
          isAI: false,
        };
      case "AI":
        return {
          planName: "All Inclusive",
          includeBreakfast: true,
          includeLunch: true,
          includeDinner: true,
          isAI: true,
        };
      default:
        // Unknown: assume nothing included
        return {
          planName: code || "Unknown",
          includeBreakfast: false,
          includeLunch: false,
          includeDinner: false,
          isAI: false,
        };
    }
  }

  const {
    tables: posTables,
    loading: posLoading,
    error: posError,
  } = useAppSelector((state: RootState) => state.posTable);

  useEffect(() => {
    if (!systemDate) return; // wait until system date is loaded

    // Build an ISO datetime for the API (midnight UTC of "today")
    // If your API needs local midnight, adjust accordingly.
    const isoMidnight = `${today}T00:00:00Z`;

    // hotelId is resolved inside the thunk from localStorage.selectedProperty.id
    dispatch(fetchNightAuditRateChecks({ rateDate: isoMidnight }));
  }, [dispatch, systemDate, today]);

  const [hotelId, setHotelId] = useState<number | null>(null);
  useEffect(() => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    setHotelCode(property?.hotelCode || "");
    setHotelId(typeof property?.id === "number" ? property.id : null);
  }, []);

  const hotelRows = useSelector(selectHotelTaxConfigs);

  // --- helpers to simulate pretty progress ---
  const randomBetween = (minMs: number, maxMs: number) =>
    Math.floor(minMs + Math.random() * (maxMs - minMs));

  async function animateVirtualTicks(
    totalMs: number,
    onTick: (i: number) => void
  ) {
    const ticks = 100; // 0 → 100% for the circle
    const perTick = totalMs / ticks; // even, smooth
    for (let i = 1; i <= ticks; i++) {
      await sleep(perTick);
      onTick(i);
    }
  }

  useEffect(() => {
    if (hotelId) dispatch(fetchHotelTaxConfigs());
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (hotelId) dispatch(fetchHotelTaxByHotelId(hotelId));
  }, [dispatch, hotelId]);

  const [rateCalcByDetailId, setRateCalcByDetailId] = useState<
    Record<number, RateCalcEntry>
  >({});

  const mealAllocState = useSelector(selectHotelMealAllocations);
  // -> { data, status, error }

  // Meal plans master list
  const mealPlanState = useSelector((s: RootState) => s.mealPlan);
  const [mealCharges, setMealCharges] = useState<MealBreakdown[]>([]);
  const [reservationCharges, setReservationCharges] = useState<
    ReservationChargeRow[]
  >([]);

  const [progressOpen, setProgressOpen] = useState(false);
  const [overallTotalRooms, setOverallTotalRooms] = useState(0);
  const [overallDoneRooms, setOverallDoneRooms] = useState(0);
  const [currRoomTitle, setCurrRoomTitle] = useState<string>("");
  const [currLinesTotal, setCurrLinesTotal] = useState(0);
  const [currLinesDone, setCurrLinesDone] = useState(0);
  const [progressError, setProgressError] = useState<string | null>(null);

  const overallPct =
    overallTotalRooms > 0
      ? Math.round((overallDoneRooms / overallTotalRooms) * 100)
      : 0;
  const currentPct =
    currLinesTotal > 0 ? Math.round((currLinesDone / currLinesTotal) * 100) : 0;

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const runWithMinDuration = async <T,>(
    runner: () => Promise<T>,
    minMs = 5000
  ) => {
    const start = Date.now();
    const result = await runner();
    const elapsed = Date.now() - start;
    if (elapsed < minMs) await sleep(minMs - elapsed);
    return result;
  };

  function computeTaxBreakdown(
    baseExclusive: number,
    taxes: ApiTax[]
  ): TaxBreakdown {
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

    let running = baseExclusive;
    const lines: TaxLine[] = [];

    for (const t of taxes) {
      const pct = Number(t.percentage) || 0;
      const basedOn = (t.calcBasedOn || "Base").toLowerCase();

      // choose the correct base for this tax line
      const lineBase =
        basedOn === "ladder" || basedOn === "running" ? running : baseExclusive; // "Base" (or anything else) → non-compound

      const amt = (lineBase * pct) / 100;

      lines.push({
        name: t.taxName,
        pct,
        accountId: (t as any).accountId ?? (t as any).ledgerAccountId ?? null,
        amount: round2(amt),
      });

      // only ladder increments the running base
      if (basedOn === "ladder" || basedOn === "running") {
        running += amt;
      }
    }

    const totalTax = lines.reduce((s, l) => s + l.amount, 0);
    return {
      baseExclusive: round2(baseExclusive),
      totalTax: round2(totalTax),
      lines,
    };
  }

  useEffect(() => {
    if (hotelId) {
      dispatch(fetchHotelMealAllocations());
    }
  }, [dispatch, hotelId]);

  // Fetch master meal plans (no hotelId needed)
  useEffect(() => {
    dispatch(fetchMealPlans());
  }, [dispatch]);

  function getUpdatedBy(): string {
    try {
      const raw = localStorage.getItem("hotelmateTokens");
      const parsed = raw ? JSON.parse(raw) : null;
      // adapt if you store user info elsewhere
      return parsed?.user?.username || parsed?.user?.email || "Night Audit";
    } catch {
      return "Night Audit";
    }
  }

  const apiTaxes: ApiTax[] = useMemo(
    () =>
      (hotelRows || []).map((t) => ({
        taxName: t.taxName,
        percentage: Number(t.percentage) || 0,
        calcBasedOn: t.calcBasedOn || "Base",
        accountId: t.accountId ?? t.ledgerAccountId ?? null, // ✅ take from API shape
      })),
    [hotelRows]
  );

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  useEffect(() => {
    // must have rate checks (per reservation/day)
    if (!Array.isArray(rateChecks) || rateChecks.length === 0) {
      setMealCharges([]);
      return;
    }

    // meal allocation — your API returns an array; you showed a single row with fields:
    // breakfast, lunch, dinner, ai, currencyCode
    const allocRow = Array.isArray(mealAllocState?.data)
      ? mealAllocState.data[0]
      : null;

    const allocBreakfast = Number(allocRow?.breakfast ?? 0);
    const allocLunch = Number(allocRow?.lunch ?? 0);
    const allocDinner = Number(allocRow?.dinner ?? 0);
    const allocAI = Number(allocRow?.ai ?? 0); // if you want to use this for AI
    const allocCurrency = String(
      allocRow?.currencyCode ?? rateChecks[0]?.currencyCode ?? "USD"
    );

    // meal plan master list
    const mealPlans = Array.isArray(mealPlanState?.data)
      ? mealPlanState.data
      : [];

    const rows: MealBreakdown[] = rateChecks.map((rc) => {
      const plan = includedMealsForPlan(rc.mealPlan, mealPlans);

      const adults = Number(rc.adult ?? 0);
      const children = Number(rc.child ?? 0);
      const childFactor = 0.5;

      const includeB = !!plan.includeBreakfast;
      const includeL = !!plan.includeLunch;
      const includeD = !!plan.includeDinner;

      const priceB = includeB ? allocBreakfast : 0;
      const priceL = includeL ? allocLunch : 0;
      const priceD = includeD ? allocDinner : 0;

      const adultB = adults * priceB;
      const adultL = adults * priceL;
      const adultD = adults * priceD;

      const childB = children * priceB * childFactor;
      const childL = children * priceL * childFactor;
      const childD = children * priceD * childFactor;

      const perMeal = {
        breakfast: adultB + childB,
        lunch: adultL + childL,
        dinner: adultD + childD,
      };

      const adultsPortion = adultB + adultL + adultD;
      const childrenPortion = childB + childL + childD;
      const grandTotal = perMeal.breakfast + perMeal.lunch + perMeal.dinner;

      return {
        reservationDetailId: Number(rc.reservationDetailId),
        reservationId: Number(rc.reservationId),
        dateISO: new Date(rc.rateDate).toISOString(),
        planCode: String(rc.mealPlan ?? ""),
        planName: plan.planName,
        adult: adults,
        child: children,
        currency: allocCurrency || rc.currencyCode || "USD",

        // ✅ attach account ids here
        accounts: {
          breakfastAccountId: includeB ? MEAL_ACCOUNT_IDS.breakfast : undefined,
          lunchAccountId: includeL ? MEAL_ACCOUNT_IDS.lunch : undefined,
          dinnerAccountId: includeD ? MEAL_ACCOUNT_IDS.dinner : undefined,
          allInclusiveAccountId: plan.isAI
            ? MEAL_ACCOUNT_IDS.allInclusive
            : null,
        },

        perMeal,
        totals: {
          adultsPortion,
          childrenPortion,
          grandTotal,
        },
      };
    });

    setMealCharges(rows);
  }, [rateChecks, mealAllocState?.data, mealPlanState?.data]);

  useEffect(() => {
    if (!Array.isArray(rateChecks) || rateChecks.length === 0) {
      setReservationCharges([]);
      return;
    }

    const mealByDetail = new Map<number, MealBreakdown>();
    for (const m of mealCharges)
      mealByDetail.set(Number(m.reservationDetailId), m);

    const rows: ReservationChargeRow[] = rateChecks.map((rc) => {
      const detailId = Number(rc.reservationDetailId);
      const rate = rateCalcByDetailId[detailId];
      const meal = mealByDetail.get(detailId);

      const currency =
        rate?.currency || meal?.currency || rc.currencyCode || "USD";
      const dateISO = new Date(rc.rateDate).toISOString();

      // ✅ your “rate for room”
      const roomBase = Number(rate?.exclusive ?? 0); // e.g. 162.6
      const roomNet = Number(rate?.inclusive ?? 0); // e.g. 200
      const roomTax = roomNet - roomBase; // e.g. 37.4

      // meal totals (exclusive)
      const mBreakfast = Number(meal?.perMeal.breakfast ?? 0);
      const mLunch = Number(meal?.perMeal.lunch ?? 0);
      const mDinner = Number(meal?.perMeal.dinner ?? 0);
      const mealExclusive = mBreakfast + mLunch + mDinner;

      // ✅ room-only base (no tax re-apply)
      const roomOnlyExclusive = Math.max(0, roomBase - mealExclusive);

      // ✅ detailed tax breakdowns (with account ids)
      const taxesOnPackage = computeTaxBreakdown(roomBase, apiTaxes);
      const taxesOnRoom = computeTaxBreakdown(roomOnlyExclusive, apiTaxes);
      const taxesOnMeals = computeTaxBreakdown(mealExclusive, apiTaxes);

      return {
        reservationDetailId: detailId,
        reservationId: Number(rc.reservationId),
        dateISO,
        currency,
        room: {
          baseExclusive: round2(roomBase),
          tax: round2(roomTax),
          netInclusive: round2(roomNet),
        },
        meals: {
          breakfast: round2(mBreakfast),
          lunch: round2(mLunch),
          dinner: round2(mDinner),
          total: round2(mealExclusive),

          // plan meta...
          planCode: meal?.planCode,
          planName: meal?.planName,
          adult: meal?.adult,
          child: meal?.child,

          // accounts...
          breakfastAccountId: meal?.accounts.breakfastAccountId,
          lunchAccountId: meal?.accounts.lunchAccountId,
          dinnerAccountId: meal?.accounts.dinnerAccountId,
          allInclusiveAccountId: meal?.accounts.allInclusiveAccountId ?? null,

          // NEW: tell GL what currency the meal figures are actually in
          // meal?.currency comes from allocRow.currencyCode or rc.currencyCode
          // (already set above when we created mealCharges)
          mealsCurrency: meal?.currency || currency,
        },
        roomOnlyExclusive: round2(roomOnlyExclusive),
        grandTotal: round2(roomNet),
        taxes: {
          onPackage: taxesOnPackage,
          onRoomOnly: taxesOnRoom,
          onMeals: taxesOnMeals,
        },
      };
    });

    setReservationCharges(rows);
  }, [rateChecks, rateCalcByDetailId, mealCharges, apiTaxes]);

  console.log("night audit rates : ", rateChecks);
  console.log("night audit tax :", hotelRows);
  console.log("night audit rateCalcByDetailId : ", rateCalcByDetailId);
  console.log("night audit reservationCharges : ", reservationCharges);

  console.log("night audit mealAllocState :", mealAllocState);
  console.log("night audit mealPlanState : ", mealPlanState);
  console.log("night audit mealCharges : ", mealCharges);

  useEffect(() => {
    if (!rateChecks || rateChecks.length === 0) {
      setRateCalcByDetailId({});
      return;
    }
    // If no taxes yet, we can still store inclusive as-is and zero out others.
    const hasTaxes = apiTaxes.length > 0;

    const nextMap: Record<number, RateCalcEntry> = {};

    for (const rc of rateChecks) {
      const detailId = Number(rc.reservationDetailId);
      const inclusive = Number(rc.netRate) || Number(rc.roomRate) || 0;
      const currency = rc.currencyCode || "";

      if (!hasTaxes) {
        nextMap[detailId] = {
          inclusive,
          exclusive: inclusive, // no taxes applied yet
          taxTotal: 0,
          factor: 1,
          currency,
          unresolved: [],
        };
        continue;
      }

      const {
        base: exclusive,
        factor,
        unresolved,
      } = reverseExclusiveFromInclusive_API(inclusive, apiTaxes);

      nextMap[detailId] = {
        inclusive,
        exclusive,
        taxTotal: inclusive - exclusive,
        factor,
        currency,
        unresolved,
      };
    }

    setRateCalcByDetailId(nextMap);
  }, [rateChecks, apiTaxes]);

  console.log("rateCalcByDetailId : ", rateCalcByDetailId);

  const { base: excl, factor } = reverseExclusiveFromInclusive_API(
    300,
    apiTaxes
  );

  // Forward (exclusive → inclusive)
  const { inclusiveTotal } = computeInclusiveFromExclusive_API(100, apiTaxes);

  console.log("inclusiveTotal : ", excl, factor);

  useEffect(() => {
    const fetchData = async () => {
      let token = null;
      let selectedProperty = null;

      if (typeof window !== "undefined") {
        token = localStorage.getItem("hotelmateTokens");
        selectedProperty = localStorage.getItem("selectedProperty");
      }

      if (!token || !selectedProperty) return;

      const accessToken = JSON.parse(token).accessToken;
      const hotelId = JSON.parse(selectedProperty)?.id;

      const result = await getAllReservations({
        token: accessToken,
        hotelId: hotelId,
      });
      const reservations = result?.reservations ?? [];

      console.log("Reservations night audit:", reservations);

      // Step 1: Flatten reservations to room-level bookings
      const flattenedReservations = reservations.flatMap((reservation: any) => {
        return (reservation.rooms || []).map((room: any) => {
          return {
            id: `${reservation.reservationID}-${reservation.reservationNo}-${room.roomID}-${room.checkIN}`,
            reservationID: reservation.reservationID,
            reservationNo: reservation.reservationNo,
            bookerFullName: reservation.bookerFullName,
            guestProfileId: reservation.guestProfileId,
            email: reservation.email,
            phone: reservation.phone,
            hotelID: reservation.hotelID,
            hotelName: reservation.hotelName,
            sourceOfBooking: reservation.sourceOfBooking,
            currencyCode: reservation.currencyCode || "USD",
            type: reservation.type,
            statusRaw: reservation.status,
            isCancelled: reservation.isCancelled,
            createdBy: reservation.createdBy || "",
            createdOn: reservation.createdOn || "",
            lastUpdatedBy: reservation.lastUpdatedBy || "",
            lastUpdatedOn: reservation.lastUpdatedOn || "",

            // Room specific
            reservationDetailID: room.reservationDetailID,
            roomId: room.roomID,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            guestName: room.guest1,
            guest2: room.guest2,
            checkIn: room.checkIN,
            checkOut: room.checkOUT,
            status: room.reservationStatusMaster?.reservationStatus ?? "",
            statusColor:
              room.reservationStatusMaster?.reservationStatusColour ?? "",
            statusID: room.reservationStatusMaster?.reservationStatusID ?? null,
            basis: room.basis,
            extraBed: !!room.extraBed,
            guests: room.adults + room.child,
            totalNights: reservation.totalNights,
            totalRooms: reservation.totalRooms,
            refNo: reservation.refNo || "",
            notes: [],
            expenses: [],
            linkTo: null,
          };
        });
      });

      console.log(
        "All Reservations:",
        reservations.map((r) => ({
          id: r.reservationID,
          guest: r.rooms?.[0]?.guest1,
          checkOUT: r.rooms?.[0]?.checkOUT,
          status: r.rooms?.[0]?.reservationStatusMaster?.reservationStatus,
        }))
      );

      const filtered = flattenedReservations.filter((r: any) => {
        if (!r.checkOut) return false;
        const checkOutDate = new Date(r.checkOut.split("T")[0]);
        return (
          r.hotelID === hotelId &&
          (isSameDay(checkOutDate, today) || isSameDay(checkOutDate, yesterday))
        );
      });

      const toBeCheckedOut = filtered.filter((r: any) => {
        const checkOutDate = new Date(r.checkOut.split("T")[0]);
        return isSameDay(checkOutDate, today) && r.status === "Checked-in";
      });

      const alreadyCheckedOut = filtered.filter((r: any) => {
        const checkOutDate = new Date(r.checkOut.split("T")[0]);
        return isSameDay(checkOutDate, today) && r.status === "Checked-out";
      });

      const filteredCheckin = flattenedReservations.filter((r: any) => {
        if (!r.checkIn) return false;
        const checkInDate = new Date(r.checkIn.split("T")[0]);
        return r.hotelID === hotelId && isSameDay(checkInDate, today);
      });

      const toBeCheckedIn = filteredCheckin.filter((r: any) => {
        const checkInDate = new Date(r.checkIn.split("T")[0]);
        return (
          isSameDay(checkInDate, today) && r.status === "Confirmed Reservation"
        );
      });

      console.log("toBeCheckedIn : ", toBeCheckedIn);

      // const checkInsFiltered = flattenedReservations.filter((r: any) => {
      //   const checkInDate = new Date(r.checkIn.split("T")[0]);
      //   return (
      //     r.hotelID === hotelId &&
      //     isSameDay(checkInDate, today) &&
      //     r.status === "Confirmed Reservation"
      //   );
      // });

      setToBeCheckOuts(toBeCheckedOut);
      setAlreadyCheckedOuts(alreadyCheckedOut);
      setCheckIns(toBeCheckedIn);

      // Fetch Rate Details for toBeCheckOut + checkIns
      const allReservations = [...toBeCheckedOut, ...toBeCheckedIn];
      const fetchRates = async (roomBookings: any[]) => {
        const ratesMap: Record<number, RateDetailPayload[]> = {};
        for (const res of roomBookings) {
          const detailId = res.reservationDetailID;
          if (detailId) {
            try {
              const rateDetails = await getRateDetailsByReservationDetailId({
                token: accessToken,
                reservationDetailId: detailId,
              });
              ratesMap[detailId] = rateDetails;
            } catch (error) {
              console.error("Error fetching rate details:", error);
            }
          }
        }
        return ratesMap;
      };

      console.log("Filtered (Y-day & Today):", filtered);
      console.log("To Be Checked Out Today:", toBeCheckedOut);
      console.log("Already Checked Out Today:", alreadyCheckedOut);

      const allRates = await fetchRates(allReservations);
      setRoomRates(allRates);
    };

    fetchData();
  }, [systemDate, refreshTrigger]);

  const toISODate = (d: string | Date) =>
    new Date(d).toISOString().split("T")[0];

  const getAvailRowsForDate = (dateStr: string) => {
    const rows: any[] = [];
    const data = rateAvailByDate?.data ?? [];

    const want = toDateOnly(dateStr);

    for (const item of data) {
      for (const av of item.availability ?? []) {
        if (toDateOnly(av.date) === want) {
          rows.push({
            // present in rateAvailByDate
            roomTypeId: item.roomTypeId,
            roomType: item.roomType,
            rateCodeId: item.rateCodeId,
            rateCode: item.rateCode,
            mealPlanId: item.mealPlanId,
            mealPlan: item.mealPlan,
            title: item.title,
            count: av.count, // available rooms for that date
            averageRate: item.averageRate,
            adultCount: item.adultCount,
            childCount: item.childCount,
            rateDate: want,
          });
        }
      }
    }

    return rows;
  };

  const handleNoShowComplete = async (args?: {
    detailIds?: number[]; // Optional array of reservation detail IDs to mark as No-Show
    reason: string; // Reason for marking as No-Show
    withSurcharges: boolean; // Whether to apply surcharges
    amount?: number; // Amount to charge, optional
    currency?: string; // Currency for the charge
  }) => {
    const targetIds = args?.detailIds?.length
      ? args.detailIds
      : selectedReservation?.reservationDetailID
      ? [selectedReservation.reservationDetailID]
      : [];

    console.log(
      "Selected Reservation Detail ID:",
      selectedReservation?.reservationDetailID
    );

    // If no valid reservation detail ID, alert the user
    if (!targetIds.length) {
      toast.error("No valid reservation detail ID available for No-Show");
      return; // Exit if no valid IDs are found
    }

    // If no valid reservation detail ID is found, log and handle gracefully
    if (!selectedReservation || !selectedReservation.reservationDetailID) {
      console.log("Selected reservation does not have a valid detail ID.");
      toast.error("Selected reservation does not have a valid detail ID.");
      return;
    }

    // Determine check-in date (either from bookingDetail or use current date)
    const checkInISO =
      bookingDetail?.resCheckIn ||
      bookingDetail?.rooms?.[0]?.resCheckIn ||
      new Date().toISOString();

    // Set loading state for No-Show marking
    setIsMarkingNoShow(true);

    try {
      // Dispatch the No-Show action for each reservation detail ID
      const results = await Promise.allSettled(
        targetIds.map((id) =>
          dispatch(
            noShowReservation({
              reservationDetailId: id,
              reason: args?.reason ?? "No specific reason", // Default reason if not provided
              withSurcharges: !!args?.withSurcharges,
              amount: args?.amount, // Optional amount to charge
              currency: args?.currency || hotelCurrency, // Default to hotel's currency if not provided
              createdBy: "System", // Use the user's name or fallback to "System"
              checkInDateISO: checkInISO, // Use the preferred check-in date
            })
          )
        )
      );

      // Handle the results after marking the rooms as No Show
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - successful;

      if (successful) {
        toast.success(
          `Successfully marked ${successful} room${
            successful > 1 ? "s" : ""
          } as No Show`
        );

        // Refresh related reservation data after marking as No Show
        if (selectedReservation?.reservationID) {
          await dispatch(
            fetchReservationById(selectedReservation.reservationID)
          );
        }

        // Optionally, refresh related data such as folio and rate details
        await Promise.allSettled(
          targetIds.flatMap((id) => [
            dispatch(fetchFolioByReservationDetailId(id)),
            dispatch(fetchRateDetailsById(id)),
          ])
        );

        // Close the No-Show drawer after completion
        setNoShowOpen(false);
      }

      if (failed) {
        toast.error("Some rooms failed to mark as No Show");
      }
    } catch (error) {
      console.error("Error during No-Show operation:", error);
      toast.error("An error occurred while marking the reservation as No Show");
    } finally {
      // Reset the loading state once the operation is complete
      setIsMarkingNoShow(false);
    }
  };
  function extractApiErrors(err: any): string[] {
    // RTK: unwrap() throws the value you passed to rejectWithValue OR axios error
    const data = err?.data || err?.response?.data || err?.payload || err || {};

    // 1) ASP.NET ProblemDetails / ModelState
    //    { title, detail, errors: { Field: ["msg1", "msg2"], ... } }
    if (data?.errors && typeof data.errors === "object") {
      const list: string[] = [];
      Object.entries<any>(data.errors).forEach(([field, msgs]) => {
        (Array.isArray(msgs) ? msgs : [msgs]).forEach((m) => {
          list.push(field ? `${field}: ${m}` : String(m));
        });
      });
      if (list.length) return list;
    }

    // 2) { message: "..."} or { messages: ["..."] }
    if (Array.isArray(data?.messages)) return data.messages.map(String);
    if (typeof data?.message === "string") return [data.message];

    // 3) plain string
    if (typeof data === "string") return [data];

    // 4) fallback
    return ["Night audit failed. Please try again."];
  }

  const handleNoShowClose = () => {
    setNoShowOpen(false);
    setBookingDetail(null);
  };

  const steps = [
    {
      title: "Check-Outs",
      description: "View and confirm today's check-outs",
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-semibold text-gray-400 mb-2">
              To Be Checked Out Today
            </h3>
            {paginate(toBeCheckOuts, page.checkOuts).length > 0 ? (
              paginate(toBeCheckOuts, page.checkOuts).map((res, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 dark:bg-black dark:text-white bg-white shadow-md p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Guest</p>
                      <p className="text-lg font-semibold text-gray-400">
                        {res.guestName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white font-medium">Room</p>
                      <p className="text-lg font-semibold text-gray-400">
                        {res.roomNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 font-medium">
                        Check-out Date
                      </p>
                      <p className="text-md text-white">
                        {new Date(res.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedReservation(res);
                        setIsCheckOutDrawerOpen(true);
                      }}
                    >
                      Check-Out
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">
                No check-outs remaining for today.
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Check-Ins",
      description: "Review guest check-in status",
      content: (
        <div className="space-y-2">
          {paginate(checkIns, page.checkIns).map((res, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white shadow-md p-4 space-y-2 dark:bg-black dark:text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-white font-medium">
                    Guest
                  </p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {res.guestName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-medium dark:text-white">
                    Room
                  </p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {res.roomNumber}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1 dark:text-white">
                  Check-in Date
                </p>
                <div className="items-center justify-between flex">
                  <p className="text-md text-gray-700 mb-2 dark:text-white">
                    {new Date(res.checkIn).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedCheckInReservation(res);
                        setIsCheckInDrawerOpen(true);
                      }}
                    >
                      Check-In
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const reservationDetailID =
                          res.rooms?.[0]?.reservationDetailID; // Make sure this is set correctly
                        console.log(
                          "reservationDetailID onclick",
                          reservationDetailID,
                          res.reservationNo
                        );

                        console.log("Selected Reservation:", res);
                        setBookingDetail({
                          reservationNo: res.reservationNo,
                          reservationDetailID: res.reservationDetailID, // Ensure this exists
                        });
                        setNoShowOpen(true); // Open the No Show Drawer
                      }}
                    >
                      No Show
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center gap-4 pt-2 text-sm">
            <button
              onClick={() =>
                setPage((prev) => ({
                  ...prev,
                  checkIns: Math.max(prev.checkIns - 1, 1),
                }))
              }
              className="text-gray-500 disabled:text-gray-300"
              disabled={page.checkIns === 1}
            >
              &lt; Previous
            </button>
            <span className="bg-black text-white px-3 py-1 rounded">
              {page.checkIns} / {Math.ceil(checkIns.length / itemsPerPage)}
            </span>
            <button
              onClick={() =>
                setPage((prev) => ({
                  ...prev,
                  checkIns: prev.checkIns + 1,
                }))
              }
              className="text-black disabled:text-gray-300"
              disabled={page.checkIns * itemsPerPage >= checkIns.length}
            >
              Next &gt;
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "Outlet Bills",
      description: "Verify outlet bills and charges",
      content: (
        <div className="space-y-2">
          {(() => {
            // Show all POS transactions for this hotel
            const bills = posTables?.filter(
              (bill: PosTransaction) => bill.hotelCode === hotelCode?.toString()
            );
            const itemsPerPageBills = 5;
            const startIndex = (page.outletBills - 1) * itemsPerPageBills;
            const endIndex = startIndex + itemsPerPageBills;
            const paginatedBills = bills.slice(startIndex, endIndex);
            const totalPages = Math.ceil(bills.length / itemsPerPageBills);

            return (
              <>
                {paginatedBills.length > 0 ? (
                  paginatedBills.map((bill: PosTransaction, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-200 bg-white shadow-md p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">
                            Table/Room
                          </p>
                          <p className="text-lg font-semibold text-gray-800">
                            {bill.tableNo || bill.roomId || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 font-medium">
                            Amount
                          </p>
                          <p className="text-lg font-semibold text-black-600">
                            ${bill.tranValue || 0} USD
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white shadow-md p-4">
                    <p className="text-sm text-gray-400 text-center">
                      No bills found
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {bills.length > itemsPerPageBills && (
                  <div className="flex items-center justify-center gap-4 pt-4 text-sm">
                    <button
                      onClick={() =>
                        setPage((prev) => ({
                          ...prev,
                          outletBills: Math.max(prev.outletBills - 1, 1),
                        }))
                      }
                      className="text-gray-500 disabled:text-gray-300"
                      disabled={page.outletBills === 1}
                    >
                      &lt; Previous
                    </button>
                    <span className="bg-black text-white px-3 py-1 rounded">
                      {page.outletBills} / {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((prev) => ({
                          ...prev,
                          outletBills: Math.min(
                            prev.outletBills + 1,
                            totalPages
                          ),
                        }))
                      }
                      className="text-black disabled:text-gray-300"
                      disabled={page.outletBills >= totalPages}
                    >
                      Next &gt;
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      ),
    },
    {
      title: "Room Rates",
      description: "Confirm applied room rates (availability) for audit dates",
      content: (
        <div className="space-y-3">
          {rateAvail.loading && (
            <p className="text-sm text-gray-500">Loading rate availability…</p>
          )}
          {rateAvail.error && (
            <p className="text-sm text-red-500">Error: {rateAvail.error}</p>
          )}

          {/* --- Rate Checker (applied rates) — moved OUTSIDE the availability IIFE --- */}
          {/* --- Rate Checker (applied rates) --- */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-zinc-900/60 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b dark:border-gray-800 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-900/40 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-semibold bg-black text-white dark:bg-white dark:text-black">
                    Rate Checker
                  </span>
                  <span className="text-xs text-gray-500">applied rates</span>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  {rateChecksLastParams?.rateDate
                    ? `For ${new Date(
                        rateChecksLastParams.rateDate
                      ).toLocaleString()}`
                    : `For ${new Date(today).toLocaleDateString()}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Tiny totals per currency */}
                {(() => {
                  const totals = rateChecks.reduce<Record<string, number>>(
                    (acc, rc) => {
                      const c = rc.currencyCode ?? "—";
                      acc[c] = (acc[c] ?? 0) + (Number(rc.netRate) || 0);
                      return acc;
                    },
                    {}
                  );
                  const entries = Object.entries(totals);
                  if (entries.length === 0) return null;
                  return (
                    <div className="hidden sm:flex items-center gap-2 mr-1">
                      {entries.map(([ccy, val]) => (
                        <span
                          key={ccy}
                          className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-zinc-900/60"
                          title="Total Net"
                        >
                          <span className="mr-1 opacity-70">Total</span>
                          <strong className="tabular-nums">
                            {val.toLocaleString()}
                          </strong>
                          <span className="ml-1 opacity-70">{ccy}</span>
                        </span>
                      ))}
                    </div>
                  );
                })()}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    dispatch(
                      fetchNightAuditRateChecks({
                        rateDate: `${today}T00:00:00Z`,
                      })
                    )
                  }
                  disabled={rateChecksLoading}
                >
                  {rateChecksLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-4">
              {rateChecksLoading && (
                <p className="text-sm text-gray-500">Loading applied rates…</p>
              )}

              {rateChecksError && (
                <p className="text-sm text-red-500">Error: {rateChecksError}</p>
              )}

              {!rateChecksLoading &&
                !rateChecksError &&
                rateChecks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center">
                    <p className="text-sm text-gray-500">
                      No applied rates found for the selected date.
                    </p>
                  </div>
                )}

              {!rateChecksLoading &&
                !rateChecksError &&
                rateChecks.length > 0 && (
                  <div className="space-y-2.5">
                    {rateChecks.map((rc) => (
                      <div
                        key={`${rc.recordId}-${rc.reservationDetailId}`}
                        className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-zinc-900/50 px-3 sm:px-4 py-3 transition-shadow hover:shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          {/* Left */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {/* <span className="font-semibold truncate">
                                {rc.guestName ?? "—"}
                              </span> */}
                              <span className="text-[11px] text-gray-500 shrink-0 dark:text-white">
                                Res #{rc.reservationId} · Detail #
                                {rc.reservationDetailId}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                              <span className="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-800 px-2 py-0.5">
                                {new Date(rc.rateDate).toLocaleDateString()}
                              </span>
                              {rc.mealPlan && (
                                <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 px-2 py-0.5">
                                  {rc.mealPlan}
                                </span>
                              )}
                              <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 px-2 py-0.5">
                                {rc.adult ?? 0}A · {rc.child ?? 0}C
                              </span>
                              {rc.exBed && (
                                <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 px-2 py-0.5">
                                  Extra Bed × {rc.exBedCount || 1}
                                </span>
                              )}
                              {rc.isFOC && (
                                <span className="inline-flex items-center rounded-md bg-black text-white px-2 py-0.5">
                                  FOC
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right */}
                          <div className="sm:text-right">
                            <div className="text-sm font-semibold dark:text-white">
                              Net:&nbsp;
                              <span className="tabular-nums">
                                {(Number(rc.netRate) || 0).toLocaleString()}
                              </span>{" "}
                              <span className="opacity-70">
                                {rc.currencyCode ?? ""}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] dark:text-white">
                              Base:{" "}
                              <span className="tabular-nums">
                                {(Number(rc.roomRate) || 0).toLocaleString()}
                              </span>
                              {rc.discPercen
                                ? ` · Disc ${rc.discPercen}%`
                                : rc.discount
                                ? ` · Disc ${rc.discount}`
                                : ""}{" "}
                              {rc.suppliment ? ` · Supp ${rc.suppliment}` : ""}{" "}
                              {rc.childRate ? ` · Child ${rc.childRate}` : ""}
                            </div>
                            <div className="mt-1.5 text-[11px]">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 border ${
                                  rc.isNightAudit
                                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                                    : "border-amber-600 text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {rc.isNightAudit ? "Audited" : "Pending"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* tiny footer meta */}
                    <div className="pt-1 text-[11px] text-gray-500 flex items-center justify-between">
                      <span>
                        {rateChecks.length} item
                        {rateChecks.length !== 1 ? "s" : ""}
                      </span>
                      {rateChecksLastParams?.checkedAt && (
                        <span>
                          Last checked:{" "}
                          {new Date(
                            rateChecksLastParams.checkedAt
                          ).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
          {/* --- /Rate Checker --- */}

          {/* --- /Rate Checker --- */}

          {/* Availability UI stays as-is, now rendered AFTER Rate Checker */}
          {(() => {
            const auditDates = [yesterday, today]; // "YYYY-MM-DD"
            const dateWithRows = auditDates.filter(
              (d) => getAvailRowsForDate(d).length > 0
            );

            if (dateWithRows.length === 0 && !rateAvail.loading) {
              return (
                <p className="text-sm text-gray-400">
                  {/* No availability found for the selected dates. */}
                </p>
              );
            }

            const pagedDates = paginate(dateWithRows, page.roomRates);

            return (
              <>
                {pagedDates.map((d) => {
                  const items = getAvailRowsForDate(d);
                  return (
                    <div
                      key={d}
                      className="rounded-lg border border-gray-200 bg-white dark:bg-black dark:text-white shadow-md"
                    >
                      <div className="px-4 py-3 border-b dark:border-gray-800">
                        <div className="flex items-baseline justify-between">
                          <h4 className="text-base font-semibold">
                            Rates for {new Date(d).toLocaleDateString()}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {items.length} plan{items.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 space-y-2">
                        {items.map((it, idx) => (
                          <div
                            key={`${it.roomTypeId}-${it.rateCodeId}-${it.mealPlanId}-${it.rateDate}-${idx}`}
                            className="flex items-center justify-between text-sm px-2 py-2 rounded-md border dark:border-gray-800"
                          >
                            <div className="flex-1">
                              <div className="font-medium">
                                {it.title ||
                                  [it.rateCode, it.mealPlan, it.roomType]
                                    .filter(Boolean)
                                    .join(" • ")}
                              </div>
                              <div className="text-xs text-gray-500">
                                RoomType: {it.roomType ?? "—"} • RateCode:{" "}
                                {it.rateCode ?? "—"} • MealPlan:{" "}
                                {it.mealPlan ?? "—"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">
                                Available: {it.count ?? 0}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                Adults: {it.adultCount ?? "—"} · Children:{" "}
                                {it.childCount ?? "—"}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                Avg Rate: {it.averageRate ?? "N/A"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination (per date) */}
                <div className="flex items-center justify-center gap-4 pt-2 text-sm">
                  <button
                    onClick={() =>
                      setPage((prev) => ({
                        ...prev,
                        roomRates: Math.max(prev.roomRates - 1, 1),
                      }))
                    }
                    className="text-gray-500 disabled:text-gray-300"
                    disabled={page.roomRates === 1}
                  >
                    &lt; Previous
                  </button>
                  <span className="bg-black text-white px-3 py-1 rounded">
                    {page.roomRates} /{" "}
                    {Math.ceil(dateWithRows.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setPage((prev) => ({
                        ...prev,
                        roomRates: prev.roomRates + 1,
                      }))
                    }
                    className="text-black disabled:text-gray-300"
                    disabled={
                      page.roomRates * itemsPerPage >= dateWithRows.length
                    }
                  >
                    Next &gt;
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      ),
    },
    {
      title: "Night Audit Reports",
      description: "Review summary and reports before closing",
      content: <div>Night Audit Reports content goes here</div>,
    },
  ];

  const systemDateObj = systemDate ? new Date(systemDate) : new Date();

  // ✅ Use startOfDay(parseISO(...)) to keep midnight semantics stable
  const baseAuditDate = systemDate
    ? startOfDay(parseISO(systemDate))
    : startOfDay(new Date());

  function toUtcMidnightISO(dateStr: string) {
    // dateStr is "YYYY-MM-DD"
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
  }

  function addDaysUtcISO(dateStr: string, days: number) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days, 0, 0, 0));
    return dt.toISOString();
  }

  const systemYMD = (systemDate ?? new Date().toISOString()).split("T")[0];

  // What you POST now:
  const nextNightAuditDateISO = addDaysUtcISO(systemYMD, 1);

  // (optional) keep current system date at UTC midnight (if you need that form elsewhere)
  const nightAuditDateISO = toUtcMidnightISO(systemYMD);

  console.log("systemDateObj:", systemDateObj.toISOString());
  console.log(
    "nightAuditDateISO (UTC midnight of system day):",
    nightAuditDateISO
  );
  console.log(
    "nextNightAuditDateISO (+1 day at UTC midnight):",
    nextNightAuditDateISO
  );
  // current (kept if needed elsewhere)

  console.log("nextNightAuditDateISO : ", nextNightAuditDateISO);

  // nightAuditDate = system date (ISO)

  // currentTimeStamp = system date + 1 day (ISO)
  const currentTimeStampISO = addDays(systemDateObj, 1).toISOString();
  const router = useRouter();

  // ---- CONFIG ----
  const GUEST_LEDGER_ACC_ID = 2;
  // keep room revenue configurable so you don't hardcode it in code:
  const ROOM_REVENUE_ACC_ID = Number(
    process.env.NEXT_PUBLIC_ROOM_REVENUE_ACC_ID ?? 0
  ); // <-- set in .env

  type BuiltLine = {
    accountID: number;
    debit?: number;
    credit?: number;
    memo?: string;
    tranDate?: string;
    currencyCode?: string;
    reservationDetailID?: number;
    propertyID?: number;
  };

  /**
   * Build a GL payload from the reservationCharges array for *one* audit run.
   * - Debit guest ledger (9) by Net (room.netInclusive)
   * - Credit room revenue by roomOnlyExclusive (requires ROOM_REVENUE_ACC_ID env)
   * - Credit meal revenue (21/23/22/24) by meal components
   * - Credit taxes per line using taxes.onPackage (service/GST/etc.)
   */
  function buildGlForRow(
    row: ReservationChargeRow,
    tranDateISO: string
  ): GlTransactionRequest {
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

    const {
      reservationId,
      reservationDetailId,
      currency,
      room,
      roomOnlyExclusive,
      meals,
      taxes,
    } = row;

    const fromRoomCcy = currency; // room/tax currency
    const fromMealsCcy = meals?.mealsCurrency || currency; // meals currency (new)
    const toCcy = hotelCurrency;

    // room/tax converter
    const needFxRoom = fromRoomCcy && toCcy && fromRoomCcy !== toCcy;
    const fxRoom = needFxRoom ? fxRateMapRef.current[fromRoomCcy] ?? 1 : 1;
    const convertRoom = (n: number) => round2(n * fxRoom);

    // meals converter
    const needFxMeals = fromMealsCcy && toCcy && fromMealsCcy !== toCcy;
    const fxMeals = needFxMeals ? fxRateMapRef.current[fromMealsCcy] ?? 1 : 1;
    const convertMeals = (n: number) => round2(n * fxMeals);

    // All GL lines are posted in hotel currency if either conversion is needed
    const outCurrency = toCcy || currency;

    const fromCcy = currency;

    const needFx = fromCcy && toCcy && fromCcy !== toCcy;
    const fx = needFx ? fxRateMapRef.current[fromCcy] ?? 1 : 1;

    const convert = (n: number) => round2(n * fx);

    const net = convertRoom(Number(room.netInclusive) || 0);
    const roomOnly = convertRoom(Number(roomOnlyExclusive) || 0);

    // meals use meals converter
    let mB = convertMeals(Number(meals.breakfast) || 0);
    let mL = convertMeals(Number(meals.lunch) || 0);
    let mD = convertMeals(Number(meals.dinner) || 0);

    const taxLines = taxes?.onPackage?.lines ?? [];

    type LineIn = {
      accountID: number;
      debit?: number;
      credit?: number;
      memo?: string;
      tranDate?: string;
      currencyCode?: string;
      reservationDetailID?: number;
      finAct?: boolean;
      comment?: string;
    };

    const lines: LineIn[] = [];

    // helper to push a line with "amount" set (debit positive, credit negative)
    const pushLine = (l: LineIn) => {
      const debit = round2(l.debit ?? 0);
      const credit = round2(l.credit ?? 0);
      const amount = round2(debit - credit); // debit +, credit -
      lines.push({
        ...l,
        debit,
        credit,
        // @ts-expect-error – we intentionally add amount though it's allowed by API
        amount,
      } as any);
    };

    // 1) Debit guest ledger (net)
    pushLine({
      accountID: 2,
      debit: net,
      credit: 0,
      memo: `Night Audit – ResDet #${reservationDetailId}`,
      comment: `Night Audit – ResDet #${reservationDetailId}`,
      tranDate: tranDateISO,
      currencyCode: outCurrency,
      reservationDetailID: reservationDetailId,
      finAct: false,
    });

    // 2) Credit room revenue (exclusive room only)
    const ROOM_REVENUE_ACC_ID = 6;
    if (ROOM_REVENUE_ACC_ID > 0 && roomOnly > 0) {
      pushLine({
        accountID: ROOM_REVENUE_ACC_ID,
        debit: 0,
        credit: roomOnly,
        memo: `Room Revenue – ResDet #${reservationDetailId}`,
        comment: `Room Revenue – ResDet #${reservationDetailId}`,
        tranDate: tranDateISO,
        currencyCode: outCurrency,
        reservationDetailID: reservationDetailId,
        finAct: false,
      });
    }

    // 3) Credit meals (component-wise)
    if (mB > 0 && meals.breakfastAccountId) {
      pushLine({
        accountID: meals.breakfastAccountId,
        debit: 0,
        credit: mB,
        memo: `Breakfast – ResDet #${reservationDetailId}`,
        comment: `Breakfast – ResDet #${reservationDetailId}`,
        tranDate: tranDateISO,
        currencyCode: outCurrency,
        reservationDetailID: reservationDetailId,
        finAct: false,
      });
    }
    if (mL > 0 && meals.lunchAccountId) {
      pushLine({
        accountID: meals.lunchAccountId,
        debit: 0,
        credit: mL,
        memo: `Lunch – ResDet #${reservationDetailId}`,
        comment: `Lunch – ResDet #${reservationDetailId}`,
        tranDate: tranDateISO,
        currencyCode: outCurrency,
        reservationDetailID: reservationDetailId,
        finAct: false,
      });
    }
    if (mD > 0 && meals.dinnerAccountId) {
      pushLine({
        accountID: meals.dinnerAccountId,
        debit: 0,
        credit: mD,
        memo: `Dinner – ResDet #${reservationDetailId}`,
        comment: `Dinner – ResDet #${reservationDetailId}`,
        tranDate: tranDateISO,
        currencyCode: outCurrency,
        reservationDetailID: reservationDetailId,
        finAct: false,
      });
    }

    // 4) Credit taxes (from onPackage)
    for (const t of taxLines) {
      const taxAmt = convertRoom(Number(t.amount) || 0);
      const taxAcc = Number(t.accountId) || 0;
      if (taxAmt > 0 && taxAcc > 0) {
        pushLine({
          accountID: taxAcc,
          debit: 0,
          credit: taxAmt,
          memo: `${t.name} – ResDet #${reservationDetailId}`,
          comment: `${t.name} – ResDet #${taxAmt}`,
          tranDate: tranDateISO,
          currencyCode: outCurrency,
          reservationDetailID: reservationDetailId,
          finAct: false,
        });
      }
    }

    return {
      tranTypeId: 2,
      tranDate: tranDateISO,
      hotelCode: String(hotelCode), // inline string coercion
      currencyCode: outCurrency,
      isTaxInclusive: true,
      tranValue: round2(net),
      finAct: false,
      // header-level links (outside glacctran)
      reservationId: Number(reservationId),
      reservationDetailId: Number(reservationDetailId),
      posCenter: "Accommodation Bill",
      // each line now includes "amount" (debit - credit)
      glAccTransactions: lines as any,
    };
  }

  // Handler for Finish
  // Handler for Finish
  // Handler for Finish
  const handleFinishAudit = async () => {
    setAuditErrors([]);
    setProgressError(null);

    // small helper so we reuse the same date-update logic in both paths
    const updateDateOnly = async () => {
      try {
        await dispatch(
          updateNightAuditDate({
            nightAuditDate: nextNightAuditDateISO, // ✅ system date + 1 (UTC midnight)
            updatedBy: getUpdatedBy(),
          })
        ).unwrap();

        toast.success("Night audit date updated.");
        router.push("/dashboard");
      } catch (e: any) {
        const msg =
          e?.message ||
          e?.payload ||
          "Failed to update Night Audit Date on the server.";
        setProgressError(String(msg));
        toast.error(String(msg));
      }
    };

    // ✅ NEW: If nothing to post, still advance the Night Audit date and exit early.
    if (!reservationCharges || reservationCharges.length === 0) {
      await updateDateOnly();
      return;
    }

    // ---- existing GL posting flow (unchanged) ----
    setProgressOpen(true);
    setOverallTotalRooms(reservationCharges.length);
    setOverallDoneRooms(0);
    setCurrLinesTotal(0);
    setCurrLinesDone(0);
    setCurrRoomTitle("");

    try {
      await runWithMinDuration(async () => {
        const tranDateISO = systemDate
          ? new Date(systemDate).toISOString()
          : new Date().toISOString();

        // ---------- FX prep (unchanged) ----------
        const bases = new Set(
          reservationCharges
            .map((r) => r.currency)
            .filter((c) => !!c && c !== hotelCurrency)
        );
        const rateMap: Record<string, number> = {};
        for (const base of bases) {
          try {
            const rate = await dispatch(
              fetchExchangeRate({
                baseCurrency: String(base),
                targetCurrency: hotelCurrency,
              })
            ).unwrap();
            rateMap[String(base)] = Number(rate) || 1;
          } catch (e) {
            console.warn(
              `FX fetch failed for ${String(base)} -> ${hotelCurrency}`,
              e
            );
            rateMap[String(base)] = 1;
          }
        }
        fxRateMapRef.current = rateMap;

        const payloads: GlTransactionRequest[] = reservationCharges.map((row) =>
          buildGlForRow(row, tranDateISO)
        );

        let anyPostFailed = false;

        for (let i = 0; i < payloads.length; i++) {
          const p = payloads[i];
          const detailId =
            p.reservationDetailId ?? (p as any).reservationDetailID ?? "";
          setCurrRoomTitle(`ResDet #${detailId}`);

          seedFeedFromPayload(p);
          const lines = p.glAccTransactions ?? [];
          const linesCount = Math.max(lines.length, 1);
          setCurrLinesTotal(linesCount);
          setCurrLinesDone(0);

          const roomMs = randomBetween(5000, 10000);
          const perLineMs = Math.max(350, Math.floor(roomMs / linesCount));

          let postError: any = null;
          const poster = (async () => {
            try {
              await dispatch(createGlTransaction(p)).unwrap();
              console.log("payload : ", JSON.stringify(p));
            } catch (e) {
              postError = e;
              anyPostFailed = true;
            }
          })();

          for (let li = 0; li < linesCount; li++) {
            const feedId = `${detailId}-${li}`;
            updateFeed(feedId, { status: "creating", pct: 0 });
            await animateVirtualTicks(perLineMs, (tick) => {
              updateFeed(feedId, { pct: tick });
            });
            updateFeed(feedId, {
              status: postError ? "error" : "posted",
              pct: 100,
            });
            setCurrLinesDone((prev) => Math.min(prev + 1, linesCount));
          }

          await poster;
          if (postError) {
            const msgs = extractApiErrors(postError);
            setProgressError(msgs.join(" · "));
          }

          setOverallDoneRooms((prev) => prev + 1);
          await sleep(200);
        }

        // ---------- ONLY NOW: update Night Audit Date ----------
        if (!anyPostFailed) {
          await dispatch(
            updateNightAuditDate({
              nightAuditDate: nextNightAuditDateISO, // ✅ system date + 1
              updatedBy: getUpdatedBy(),
            })
          ).unwrap();

          toast.success("Night audit date updated.");
        } else {
          toast.error(
            "Some GL posts failed. Night audit date was not updated."
          );
          return;
        }

        await sleep(400);
      }, 5000);

      setProgressOpen(false);
      router.push("/dashboard");
    } catch (err: any) {
      const msgs = extractApiErrors(err);
      setAuditErrors(msgs);
      setProgressError(msgs.join(" · "));
      console.error("Finish audit failed:", err);
      await sleep(1200);
      setProgressOpen(false);
    }
  };

  function LinePill({
    pct,
    status,
  }: {
    pct: number;
    status: GlLineView["status"];
  }) {
    return (
      <div className="relative h-1.5 w-20 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 transition-all ${
            status === "error"
              ? "bg-red-500"
              : status === "posted"
              ? "bg-emerald-500"
              : "bg-gray-800 dark:bg-gray-200"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  function CircularProgress({
    value,
    size = 120,
    stroke = 10,
    trackClassName = "text-gray-300 dark:text-zinc-800",
    progressClassName = "text-black dark:text-white",
    label,
  }: CircularProgressProps) {
    const pct = Math.max(0, Math.min(100, isFinite(value) ? value : 0));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (pct / 100) * c;

    return (
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-label={label || "progress"}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className={trackClassName}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={progressClassName + " transition-all duration-300"}
            style={{
              strokeDasharray: `${dash} ${c - dash}`,
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
            }}
          />
        </svg>

        {/* Center % */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl font-semibold tabular-nums dark:text-white">
            {Math.round(pct)}%
          </div>
          {label && (
            <div className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
              {label}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className=" w-full max-w-[900px] space-y-4 pb-10">
        <Card className="bg-white/20 backdrop-blur-sm shadow-lg border border-white/10 text-black   ">
          <CardHeader>
            <CardTitle className="dark:text-white text-black">
              {steps[step].title}
            </CardTitle>
            <CardDescription>{steps[step].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-2">
            {auditErrors.length > 0 && (
              <Alert variant="destructive" className="border-[1px]">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Validation error</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc ml-5 space-y-1">
                    {auditErrors.map((msg, i) => (
                      <li key={i} className="text-sm">
                        {msg}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {steps[step].content}
          </CardContent>

          <CardFooter className="pt-2">
            <div className="flex justify-between w-full">
              <Button
                onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
                disabled={step === 0}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  if (step === 4) {
                    handleFinishAudit();
                  } else {
                    setStep((prev) => Math.min(prev + 1, 4));
                  }
                }}
                disabled={
                  progressOpen ||
                  auditLoading ||
                  (step === 4 && auditLoading) ||
                  (step === 0 && toBeCheckOuts.length > 0) ||
                  (step === 1 && checkIns.length > 0)
                }
              >
                {step === 4
                  ? auditLoading
                    ? "Finishing..."
                    : "Finish"
                  : "Next"}
              </Button>
            </div>
          </CardFooter>
        </Card>
        {/* Progress Bar */}
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {[0, 1, 2, 3, 4].map((stepIndex) => (
              <div
                key={stepIndex}
                className={`h-2 w-8 rounded-full transition-colors duration-200 ${
                  stepIndex === step ? "bg-black" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <CheckOutFormDrawer
        isOpen={isCheckOutDrawerOpen}
        bookingDetail={selectedReservation}
        onClose={(wasSuccessful = false) => {
          setIsCheckOutDrawerOpen(false);
          setSelectedReservation(null);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
      {selectedCheckInReservation && (
        <Sheet
          open={isCheckInDrawerOpen}
          onOpenChange={(open) => {
            setIsCheckInDrawerOpen(open);
            if (!open) {
              setSelectedCheckInReservation(null);
            }
          }}
        >
          <SheetContent
            side="right"
            className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
          >
            <CheckInFormDrawer
              isOpen={isCheckInDrawerOpen}
              onClose={() => {
                setIsCheckInDrawerOpen(false);
                setSelectedCheckInReservation(null);
                setRefreshTrigger((prev) => prev + 1);
              }}
              bookingDetail={selectedCheckInReservation}
              title={selectedCheckInReservation?.guest1Title ?? ""}
              dob={selectedCheckInReservation?.guest1DOB ?? ""}
              nationality={selectedCheckInReservation?.nationality ?? ""}
              country={selectedCheckInReservation?.country ?? ""}
              guestProfileData={{
                guestProfileId: selectedCheckInReservation?.guestProfileId ?? 0,
                guestName: selectedCheckInReservation?.guestName ?? "",
                title: selectedCheckInReservation?.guest1Title ?? "",
                dob: selectedCheckInReservation?.guest1DOB ?? "",
                email: selectedCheckInReservation?.email ?? "",
                phone: selectedCheckInReservation?.phone ?? "",
                checkInDate: selectedCheckInReservation?.checkIn ?? "",
                checkOutDate: selectedCheckInReservation?.checkOut ?? "",
                nationality: selectedCheckInReservation?.nationality ?? "",
                country: selectedCheckInReservation?.country ?? "",
                idNumber: selectedCheckInReservation?.ppNo ?? "",
              }}
            />
          </SheetContent>
        </Sheet>
      )}
      <Sheet open={noShowOpen} onOpenChange={setNoShowOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <NoShowDrawer
            bookingDetail={{
              reservationNo: bookingDetail?.reservationNo,
              reservationDetailID: bookingDetail?.reservationDetailID, // Ensure this is set correctly
            }}
            onClose={handleNoShowClose}
            onConfirm={handleNoShowComplete}
            isLoading={isMarkingNoShow}
            setTakePaymentsOpen={setTakePaymentsOpen}
          />
        </SheetContent>
      </Sheet>
      {progressOpen && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl border border-white/10 bg-white/80 dark:bg-zinc-900/80">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-full border-2 border-black/10 dark:border-white/20 border-t-transparent animate-spin" />
                <div>
                  <h3 className="text-base font-semibold dark:text-white">
                    Finalizing Night Audit
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Posting GL entries and closing day…
                  </p>
                </div>
              </div>

              {/* Overall (rooms) */}
              <div className="mt-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40">
                <div className="px-3 py-2 border-b dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-medium dark:text-white">
                    GL account transactions
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {currLinesDone}/{currLinesTotal}
                  </span>
                </div>

                <div className="max-h-52 overflow-auto divide-y dark:divide-zinc-800">
                  {lineFeed.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500">
                      Preparing lines…
                    </div>
                  ) : (
                    lineFeed.map((l) => (
                      <div
                        key={l.id}
                        className="px-3 py-2 text-xs flex items-center gap-2"
                      >
                        {/* status icon */}
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ${
                            l.status === "posted"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : l.status === "error"
                              ? "bg-red-50 text-red-700 ring-red-200"
                              : "bg-gray-50 text-gray-700 ring-gray-200"
                          }`}
                          title={
                            l.status === "posted"
                              ? "Posted"
                              : l.status === "error"
                              ? "Error"
                              : "Creating"
                          }
                        >
                          {l.status === "posted"
                            ? "✓"
                            : l.status === "error"
                            ? "!"
                            : "•"}
                        </span>

                        {/* meta */}
                        <div className="min-w-0 flex-1">
                          <div className="truncate">
                            <span className="font-medium">
                              Acc&nbsp;#{l.accountID}
                            </span>
                            {l.memo ? (
                              <span className="opacity-70">
                                {" "}
                                &nbsp;· {l.memo}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <LinePill pct={l.pct} status={l.status} />
                            {typeof l.amount === "number" && (
                              <span className="tabular-nums opacity-70">
                                {l.amount.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* status label */}
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 ${
                            l.status === "posted"
                              ? "bg-emerald-600 text-white"
                              : l.status === "error"
                              ? "bg-red-600 text-white"
                              : "bg-gray-900 text-white dark:bg-white dark:text-black"
                          }`}
                        >
                          {l.status === "posted"
                            ? "Posted"
                            : l.status === "error"
                            ? "Error"
                            : "Creating"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Error state */}
              {progressError && (
                <div className="mt-4 rounded-lg border border-red-300/40 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 px-3 py-2 text-xs">
                  {progressError}
                </div>
              )}

              <div className="mt-4 text-[11px] text-gray-600 dark:text-gray-300">
                Please keep this window open while we complete the posting.
              </div>
            </div>
          </div>
        </div>
      )}

      {showDoneScreen && (
        <div className="mt-4 rounded-xl border border-emerald-300/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              ✓
            </div>
            <div>
              <div className="text-sm font-semibold">Night Audit Completed</div>
              <div className="text-[11px] opacity-90">
                All GL entries have been posted successfully.
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

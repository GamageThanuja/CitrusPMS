// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getRateCodes } from "@/controllers/rateCodeController";
import { getHotelRoomNumbersByHotelId } from "@/controllers/hotelRoomNumberController";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Trash2,
  Calendar,
  Youtube,
  Plus,
  Loader2,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  differenceInDays,
  addDays,
  format,
  isSameDay,
  parseISO,
} from "date-fns";

// New Redux imports
import {
  createGuestProfileCheckIn,
  selectCreateCheckInLoading,
  selectCreateCheckInError,
  selectCreateCheckInData,
} from "@/redux/slices/createCheckInSlice";
// Keep existing controller for check-in since no equivalent slice exists
import { checkInReservationDetail } from "@/controllers/reservationController";
import {
  fetchAvailableRoomTypes,
  selectAvailableRoomTypesItems,
  selectAvailableRoomTypesLoading,
} from "@/redux/slices/fetchAvailableRoomTypesSlice";
import {
  fetchCountryMas,
  selectCountryMas,
  selectCountryMasLoading,
} from "@/redux/slices/fetchCountryMasSlice";
import {
  fetchNameMas,
  selectFetchNameMasItems,
  selectFetchNameMasLoading,
} from "@/redux/slices/fetchNameMasSlice";
import {
  fetchGuestMas,
  selectGuestMasItems,
  selectGuestMasLoading,
} from "@/redux/slices/fetchGuestMasSlice";
import {
  fetchRoomTypeMas,
  selectRoomTypeMas,
  selectRoomTypeMasLoading,
} from "@/redux/slices/roomTypeMasSlice";
import {
  fetchBasisMas,
  selectBasisMasItems,
  selectBasisMasLoading,
  selectBasisMasError,
} from "@/redux/slices/fetchBasisMasSlice";
import {
  fetchReservationDetailsById,
  selectReservationDetailsItems,
  selectReservationDetailsLoading,
} from "@/redux/slices/fetchreservtaionByIdSlice";
import {
  createBookingFeed,
  selectCreateBookingFeedLoading,
  selectCreateBookingFeedError,
  selectCreateBookingFeedSuccess,
} from "@/redux/slices/createBookingFeedSlice";
import {
  fetchHotelRatePlans,
  selectHotelRatePlansItems,
  selectHotelRatePlansLoading,
  selectHotelRatePlansError,
  selectHotelRatePlansLastQuery,
  type HotelRatePlanItem,
} from "@/redux/slices/fetchHotelRatePlanSlice";

// import { RateCode } from "@/types/rateCode";
// import { HotelRatePlan } from "@/types/hotelRatePlan";
// import { HotelRoomNumber } from "@/types/hotelRoomNumber";
// import { HotelRoomType } from "@/types/hotelRoomType";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Label } from "../ui/label";
import { createPortal } from "react-dom";
import YoutubeIcon from "../../assets/icons/youtube.png";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import DatePicker from "react-date-picker";
import TimePicker from "react-time-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-time-picker/dist/TimePicker.css";
// import { checkInReservation } from "@/redux/slices/checkInSlice";

import { toast } from "sonner";
// import { fetchHotelRoomTypes } from "@/redux/slices/hotelRoomTypesSlice";
import { log } from "node:console";
import { useAppSelector } from "@/redux/hooks";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { set } from "lodash";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { AddTravelAgentDrawer } from "./add-travel-agent-drawer";
import {
  fetchCalculatedRate,
  selectCalculatedRate,
  selectCalculatedRateLoading,
  selectCalculatedRateError,
} from "@/redux/slices/calculateRateSlice";
import { nanoid } from "nanoid";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
import { AddRateDrawer } from "./add-rate-drawer";
import { useCreateReservationLog } from "@/hooks/useCreateReservationLog";
import { unstable_batchedUpdates } from "react-dom";

type QuickReservationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (createdReservationId?: number) => void;
};

type TravelAgent = { nameID: string; name: string };
interface NameMasterPayload {
  nameID: number;
  name: string;
}

export default function QuickReservationDrawer({
  open,
  onOpenChange,
  onCreated,
  onClose,
  initialRange,
}: QuickReservationDrawerProps) {
  // Initial walk-in form state for reset
  const dispatch = useDispatch();
  const { createLog } = useCreateReservationLog();
  const { fullName } = useUserFromLocalStorage();
  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );
  const systemDateLoading = useAppSelector(
    (state: RootState) => state.systemDate.status === "loading"
  );
  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [selectOccupancy, setSelectOccupancy] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAddRateDrawerOpen, setIsAddRateDrawerOpen] = useState(false);
  console.log("initialRange in QuickReservationDrawer:", initialRange);

  const ymdLocal = (d?: Date | string) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return format(date, "yyyy-MM-dd");
  };

  const initialAppliedRef = useRef(false);

  // robust date coercion
  const toDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    const t = typeof d;
    if (t === "string" || t === "number") {
      const dd = new Date(d);
      return isNaN(dd.getTime()) ? null : dd;
    }
    return null;
  };

  // resolve roomTypeId from any of: initialRange.roomTypeId | roomNumbers(roomId/roomNo) | fetchedroomTypes(roomTypeName)
  const resolveRoomTypeId = (
    ir: any,
    roomNumbers: any[],
    fetchedroomTypes: any[]
  ): string => {
    if (ir?.roomTypeId) return String(ir.roomTypeId);

    // try via roomId
    if (ir?.roomId != null) {
      const rn = roomNumbers.find(
        (r) => String(r.roomId) === String(ir.roomId)
      );
      if (rn?.roomTypeID != null) return String(rn.roomTypeID);
    }

    // try via roomNumber
    if (ir?.roomNumber) {
      const rn = roomNumbers.find(
        (r) => String(r.roomNo) === String(ir.roomNumber)
      );
      if (rn?.roomTypeID != null) return String(rn.roomTypeID);
    }

    // try via roomTypeName
    if (ir?.roomTypeName) {
      const rt = fetchedroomTypes.find(
        (x: any) =>
          (x?.roomType || "").toLowerCase() ===
          String(ir.roomTypeName).toLowerCase()
      );
      if (rt?.hotelRoomTypeID != null) return String(rt.hotelRoomTypeID);
    }

    return "";
  };

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  const createLogSafe = useCallback(
    async (
      resLog: string,
      extra?: Partial<{
        reservationId: number;
        reservationDetailId: number;
        reservationNo: string;
        roomNumber: string | number;
      }>
    ) => {
      // Build the payload exactly as the hook will send it
      const payload = {
        username: fullName || "system",
        reservationId: extra?.reservationId ?? 0,
        reservationDetailId: extra?.reservationDetailId ?? 0,
        reservationNo: extra?.reservationNo?.toString() || "",
        roomNumber: (extra?.roomNumber ?? "").toString(),
        resLog,
        platform: "Web",
      };

      console.log("createLogSafe payload:", payload);

      // 1) Log the outgoing payload
      console.log(
        "[ReservationActivityLog] → POST payload:",
        JSON.stringify(payload, null, 2)
      );

      try {
        // 2) Send via your hook
        const resp = await createLog(payload);

        // 3) Log the response JSON
        console.log(
          "[ReservationActivityLog] ← Response:",
          JSON.stringify(resp, null, 2)
        );

        return resp; // (optional) let callers await/inspect it
      } catch (e: any) {
        // 4) Log errors with as much context as possible
        const status = e?.response?.status;
        const data = e?.response?.data;
        console.warn(
          "[ReservationActivityLog] ✖ Error:",
          status ? `HTTP ${status}` : "",
          data ? JSON.stringify(data, null, 2) : e?.message || e
        );
        // Don’t throw—keep it non-blocking for UX
        return null;
      }
    },
    [createLog, fullName]
  );

  const newRoom = () => ({
    id: nanoid(),
    roomType: "",
    room: "",
    adult: 2,
    child: 0,
    rate: 0,
    is_foc: false,

    ratePlanId: "",
    rateCodeId: "",

    daysMap: {} as Record<string, number>,
    childDaysMap: {} as Record<string, number>,
    childRateAvg: 0,
    childRateTotal: 0,
    occupancy: "",
    bedType: "",
    userEditedRate: false,
    rateMissing: false,
  });

  console.log("System Date in Quick Reservation Drawer:", systemDate);
  const initialWalkInFormData = {
    selectedRooms: [],
    netRate: 0,
    adults: 2,
    children: 0,
    extra: "",
    discount: "",
    discountType: "amount",
    checkInDate: systemDate,
    checkOutDate: addDays(systemDate, 1),
    firstName: "",
    address: "",
    country: "",
    email: "",
    phone: "",
    travelAgent: "",
    arrivalTime: "",
    zipCode: "",
    city: "",
    specialRequests: "",
    bookingReffarance: "",
    currency: "LKR",
    rateType: "",
    supplement: "0",
    isDayRoom: false,
    bookingRevision: "1",
  };

  // State for walk-in form data
  const [walkInFormData, setWalkInFormData] = useState(initialWalkInFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
  const [roomCount, setRoomCount] = useState(1);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(undefined);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(undefined);
  const [nights, setNights] = useState<number>(1);
  const [isDayUse, setIsDayUse] = useState<boolean>(false);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [refNo, setRefNo] = useState("");
  const ymd = (d?: Date | string) =>
    d ? new Date(d).toISOString().slice(0, 10) : "";

  const toLocalYMD = (d?: Date | string) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return format(date, "yyyy-MM-dd");
  };

  const [guestPassport, setGuestPassport] = useState("");
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [showPassportSuggestions, setShowPassportSuggestions] = useState(false);

  // For APIs that want `YYYY-MM-DDT00:00:00`
  const toApiDateTime = (d?: Date | string) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return `${format(date, "yyyy-MM-dd")}T00:00:00`;
  };

  // Controlled state for form fields
  const [reservationType, setReservationType] = useState("confirm");
  const [rateCode, setRateCode] = useState("");
  const [currency, setCurrency] = useState("LKR");
  const [rooms, setRooms] = useState([newRoom()]);
  const [rateLoading, setRateLoading] = useState<Record<number, boolean>>({});

  // put near other state
  type RoomQuote = {
    averageRate: number;
    totalRate: number;
    daysMap: Record<string, number>; // "YYYY-MM-DD" -> rate
  };

  const [roomQuotes, setRoomQuotes] = useState<RoomQuote[]>(
    Array.from({ length: roomCount }, () => ({
      averageRate: 0,
      totalRate: 0,
      daysMap: {},
    }))
  );

  console.log("roomQuotes : ", roomQuotes);

  const [groupName, setGroupName] = useState("");
  const [tourNo, setTourNo] = useState("");

  const [travelAgents, setTravelAgents] = useState<TravelAgent[]>([]);

  const nameMasItems = useSelector(selectFetchNameMasItems);
  const nameMasLoading = useSelector(selectFetchNameMasLoading);

  console.log("nameMasItems : ", nameMasItems);

  useEffect(() => {
    dispatch(fetchNameMas({ nameType: "customer" }));
  }, [dispatch]);

  const travelAgentOptions = useMemo(() => {
    const list = Array.isArray(nameMasItems) ? nameMasItems : [];
    return list
      .filter((n: any) => {
        const t = String(n?.nameType || "").toLowerCase();
        return (t === "customer" || t === "agent") && n?.finAct === false;
      })
      .sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      )
      .map((n: any) => ({
        value: String(n.nameID),
        label: n.name?.trim() || n.code || `#${n.nameID}`,
        taType: n.taType || "",
        nameType: n.nameType || "",
      }));
  }, [nameMasItems]);

  const [selectedRatePlan, setSelectedRatePlan] = useState<number | null>(null);
  // Store selected rate plan details
  const [selectedRatePlanDetails, setSelectedRatePlanDetails] =
    useState<HotelRatePlanItem | null>(null);
  console.log("selectedRatePlanDetails 🏨🏨🏨:", selectedRatePlanDetails);
  useEffect(() => {
    if (systemDate) {
      const systemDateObj = new Date(systemDate);
      setCheckInDate(systemDateObj);
      setCheckOutDate(addDays(systemDateObj, 1));
    }
  }, [systemDate]);

  const [mobile, setMobile] = useState("");

  const [notes, setNotes] = useState("");
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);
  const [selectedTravelAgent, setSelectedTravelAgent] = useState<string>("");

  const MIN_NAME_CHARS = 3;

  type AnyPlan = any; // keep loose since API shape can vary

  const findPlanForRow = (
    plans: any[],
    rateCodeId: number | string,
    roomTypeId: number | string
  ) => {
    if (!rateCodeId || !roomTypeId) return null;
    const rc = Number(rateCodeId);
    const rt = Number(roomTypeId);
    return (
      plans.find(
        (p) =>
          Number(p?.rateCodeID) === rc &&
          Number(p?.hotelRoomType?.hotelRoomTypeID) === rt
      ) || null
    );
  };

  useEffect(() => {
    setOverlayRoot(document.getElementById("overlay-root"));
  }, []);

  // Redux selectors for hotel rate plans
  const hotelRatePlansRedux = useSelector(selectHotelRatePlansItems);
  const hotelRatePlansLoading = useSelector(selectHotelRatePlansLoading);
  const hotelRatePlansError = useSelector(selectHotelRatePlansError);

  // Hotel rate plans state - using Redux state
  const hotelRatePlans = hotelRatePlansRedux;
  // Hotel room types state
  const [roomTypes, setRoomTypes] = useState<HotelRoomType[]>([]);
  const [rateCodes, setRateCodes] = useState<RateCode[]>([]);
  // Hotel room numbers state
  const [roomNumbers, setRoomNumbers] = useState<HotelRoomNumber[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [releaseDate, setReleaseDate] = useState<Date>(
    addDays(new Date(systemDate), 1)
  );
  const [releaseTime, setReleaseTime] = useState<string>("12:00");
  const [checkInTime, setCheckInTime] = useState("12:00");
  const [title, setTitle] = useState<string>("Mr");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const fetchedroomTypes = useSelector(selectRoomTypeMas);
  const roomTypesLoading = useSelector(selectRoomTypeMasLoading);

  const [selectedMealPlan, setSelectedMealPlan] = useState<string>("");
  const [mealPlanName, setMealPlanName] = useState<string>("");

  console.log("hotelRatePlans (Redux) ⚽️⚽️⚽️ :", hotelRatePlans);
  console.log("hotelRatePlans loading:", hotelRatePlansLoading);
  console.log("hotelRatePlans error:", hotelRatePlansError);

  // Debug rate code data from hotel rate plans
  console.log(
    "Rate codes from hotel rate plans:",
    hotelRatePlans.map((plan) => ({
      rateCodeID: plan.rateCodeID,
      rateCode: plan.rateCode?.rateCode,
      description: plan.rateCode?.description,
    }))
  );

  console.log("checked in clicked:", isCheckedIn);

  console.log("checked in clicked:", isCheckedIn);

  useEffect(() => {
    dispatch(fetchRoomTypeMas());
  }, [dispatch]);

  const fallbackCountries = [
    { name: "Sri Lanka", code: "LK", currency: "LKR", phoneCode: "+94" },
    { name: "India", code: "IN", currency: "INR", phoneCode: "+91" },
    { name: "United States", code: "US", currency: "USD", phoneCode: "+1" },
    { name: "United Kingdom", code: "GB", currency: "GBP", phoneCode: "+44" },
    { name: "Australia", code: "AU", currency: "AUD", phoneCode: "+61" },
    { name: "Germany", code: "DE", currency: "EUR", phoneCode: "+49" },
    { name: "France", code: "FR", currency: "EUR", phoneCode: "+33" },
    { name: "Canada", code: "CA", currency: "CAD", phoneCode: "+1" },
    { name: "China", code: "CN", currency: "CNY", phoneCode: "+86" },
    { name: "Japan", code: "JP", currency: "JPY", phoneCode: "+81" },
  ];
  // Fetch hotel rate plans on mount

  const hotelGuestProfile = useSelector(selectGuestMasItems);
  const guestProfilesLoading = useSelector(selectGuestMasLoading);

  const mealPlans = useSelector(selectBasisMasItems);
  const mealPlansLoading = useSelector(selectBasisMasLoading);
  const mealPlansError = useSelector(selectBasisMasError);

  useEffect(() => {
    dispatch(fetchBasisMas());
  }, [dispatch]);

  // Handle meal plans error
  useEffect(() => {
    if (mealPlansError) {
      console.error("Failed to fetch meal plans:", mealPlansError);
      toast.error("Failed to fetch meal plans", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
    }
  }, [mealPlansError]);

  console.log("mealPlans (BasisMas): ", mealPlans);
  console.log("mealPlans loading:", mealPlansLoading);
  console.log("mealPlans error:", mealPlansError);
  console.log("mealPlans length:", mealPlans.length);
  if (mealPlans.length > 0) {
    console.log("mealPlans sample item: ", mealPlans[0]);
  }

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [repeatGuest, setRepeatGuest] = useState(false);
  const [selectedGuestProfileId, setSelectedGuestProfileId] = useState<
    number | null
  >(null);

  useEffect(() => {
    const hotelCode = localStorage.getItem("hotelCode") || "1097";
    dispatch(fetchGuestMas({ hotelCode }));
  }, [dispatch]);

  const filteredNameSuggestions = useMemo(() => {
    const q = (guestName || "").trim().toLowerCase();
    if (q.length < MIN_NAME_CHARS) return [];
    const needle = q.slice(0, MIN_NAME_CHARS); // match using first 3 chars typed
    return hotelGuestProfile
      .filter((g) => (g.guestName || "").toLowerCase().includes(needle))
      .slice(0, 10); // optional cap
  }, [guestName, hotelGuestProfile]);

  const filteredEmailSuggestions = useMemo(() => {
    const q = (guestEmail || "").trim().toLowerCase();
    if (q.length < MIN_NAME_CHARS) return [];
    const needle = q.slice(0, MIN_NAME_CHARS);
    return hotelGuestProfile
      .filter((g) => (g.email || "").toLowerCase().includes(needle))
      .slice(0, 10);
  }, [guestEmail, hotelGuestProfile]);

  const filteredPhoneSuggestions = useMemo(() => {
    const q = (mobile || "").trim();
    if (q.length < MIN_NAME_CHARS) return [];
    const needle = q.slice(0, MIN_NAME_CHARS);
    // compare on a digits-only version so formatting (+, spaces, dashes) doesn't matter
    const onlyDigits = (s: string = "") => s.replace(/\D+/g, "");
    const nd = onlyDigits(needle);
    return hotelGuestProfile
      .filter((g) => onlyDigits(g.phoneNo || "").includes(nd))
      .slice(0, 10);
  }, [mobile, hotelGuestProfile]);

  const handleEmailSelect = (email: string) => {
    setGuestEmail(email);
    const matchedGuest = hotelGuestProfile.find((g) => g.email === email);
    setGuestName(matchedGuest?.guestName || "");
    setMobile(matchedGuest?.phoneNo || "");
    setGuestPassport(matchedGuest?.ppurl || "");
    setSelectedGuestProfileId(matchedGuest?.guestID ?? null); // 👈
    setRepeatGuest(!!matchedGuest); // 👈
  };

  // Fetch hotel rate plans using Redux
  useEffect(() => {
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = selectedProperty?.id;

    if (hotelId) {
      dispatch(fetchHotelRatePlans({ hotelId }));
    }
  }, [dispatch]);

  // Handle hotel rate plans error
  useEffect(() => {
    if (hotelRatePlansError) {
      console.error("Failed to fetch hotel rate plans:", hotelRatePlansError);
      toast.error("Failed to fetch hotel rate plans", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
    }
  }, [hotelRatePlansError]);

  // Refetch hotel rate plans when filters change
  useEffect(() => {
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = selectedProperty?.id;

    if (hotelId) {
      const params: any = { hotelId };

      // Add optional filters if they exist
      if (rateCode && !isNaN(Number(rateCode))) {
        params.rateCodeID = Number(rateCode);
      }
      if (selectedMealPlan && !isNaN(Number(selectedMealPlan))) {
        params.mealPlanID = Number(selectedMealPlan);
      }
      if (currency) {
        params.currencyCode = currency;
      }

      dispatch(fetchHotelRatePlans(params));
    }
  }, [dispatch, rateCode, selectedMealPlan, currency]);

  // Clears stale prices so UI doesn't show previous rate while fetching a new one
  const resetRatesForAllRows = () => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.is_foc || r.userEditedRate) return r; // keep manual/FOC
        return {
          ...r,
          rate: 0,
          rateMissing: true, // show "Type rate" placeholder until fetch finishes
          daysMap: {},
          childDaysMap: {},
          childRateAvg: 0,
          childRateTotal: 0,
        };
      })
    );

    setRoomQuotes((prev) =>
      prev.map(() => ({
        averageRate: 0,
        totalRate: 0,
        daysMap: {},
      }))
    );
  };

  // // Fetch hotel room numbers on mount
  // useEffect(() => {
  //   const fetchRoomNumbers = async () => {
  //     try {
  //       const tokens = JSON.parse(
  //         localStorage.getItem("hotelmateTokens") || "{}"
  //       );
  //       const selectedProperty = JSON.parse(
  //         localStorage.getItem("selectedProperty") || "{}"
  //       );
  //       const response = await getHotelRoomNumbersByHotelId({
  //         token: tokens.accessToken,
  //         hotelId: selectedProperty.id,
  //       });
  //       setRoomNumbers(response);
  //     } catch (err) {
  //       console.error("Failed to fetch room numbers", err);
  //     }
  //   };
  //   fetchRoomNumbers();
  // }, []);

  // Fetch hotel room types on mount
  // useEffect(() => {
  //   const fetchRoomTypes = async () => {
  //     try {
  //       const tokens = JSON.parse(
  //         localStorage.getItem("hotelmateTokens") || "{}"
  //       );
  //       const selectedProperty = JSON.parse(
  //         localStorage.getItem("selectedProperty") || "{}"
  //       );
  //       const types = await getHotelRoomTypes({
  //         token: tokens.accessToken,
  //         hotelId: selectedProperty.id,
  //       });
  //       setRoomTypes(types);
  //     } catch (err) {
  //       console.error("Failed to fetch room types", err);
  //     }
  //   };
  //   fetchRoomTypes();
  // }, []);

  // Rate codes are now fetched from hotel rate plans Redux state
  // No need for separate rate codes API call
  // useEffect(() => {
  //   const fetchRateCodes = async () => {
  //     try {
  //       const tokens = JSON.parse(
  //         localStorage.getItem("hotelmateTokens") || "{}"
  //       );
  //       const codes = await getRateCodes({ token: tokens.accessToken });
  //       setRateCodes(codes);
  //     } catch (err) {
  //       console.error("Failed to fetch rate codes", err);
  //     }
  //   };
  //   fetchRateCodes();
  // }, []);

  console.log("Travel Agent : ", selectedTravelAgent);

  const validateForm = () => {
    // if (!selectedTravelAgent) {
    //   toast.error("Travel Agent is required", {
    //     position: "top-right",
    //     className: "bg-red-500 text-white",
    //   });

    //   return false;
    // }

    const isValidEmail = (v: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

    // very loose phone check: 7–15 digits (allow +, spaces, dashes, parens)
    const isValidPhone = (v: string) =>
      /^[+\d]?(?:[\s-()]*\d){7,15}$/.test(String(v).trim());
    if (!guestName.trim()) {
      toast.error("Guest Name is required", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }
    if (!mobile.trim()) {
      toast.error("Mobile number is required", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }
    if (!guestEmail.trim()) {
      toast.error("Email is required", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }
    if (!checkInDate) {
      toast.error("Check-in date is required", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }
    if (!checkOutDate) {
      toast.error("Check-out date is required", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }
    if (!rateCode) {
      toast.error("Rate plan is required", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }

    if (!isValidPhone(mobile)) {
      toast.error("Please enter a valid mobile number", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }

    if (!isValidEmail(guestEmail)) {
      toast.error("Please enter a valid email address", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }

    if (!selectedCountry || !selectedCountry.trim()) {
      toast.error("Country is required", {
        position: "top-right",
        className: "bg-red-500 text-white",
      });
      return false;
    }

    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      const label = `Room ${i + 1}`;

      if (!r.roomType) {
        toast.error(`${label}: Room Type is required`, {
          position: "top-right",
          className: "bg-red-500 text-white",
        });
        return false;
      }

      if (!r.adult || r.adult <= 0) {
        toast.error(`${label}: At least 1 adult required`, {
          position: "top-right",
          className: "bg-red-500 text-white",
        });
        return false;
      }

      if (!r.is_foc && (!r.rate || r.rate <= 0)) {
        toast.error(`${label}: Rate is required`, {
          position: "top-right",
          className: "bg-red-500 text-white",
        });
        return false;
      }
    }

    return true;
  };

  // Sync rooms state with roomCount
  useEffect(() => {
    setRooms((prev) => {
      if (roomCount > prev.length) {
        return [
          ...prev,
          ...Array(roomCount - prev.length).fill({
            roomType: "",
            room: "",
            adult: 2,
            child: 0,
            rate: 0,
            is_foc: false,
            rateIsManual: false,
            ratePlanId: "",
            rateCodeId: "",
            userEditedRate: false, // 👈 add
            rateMissing: false,
          }),
        ];
      } else if (roomCount < prev.length) {
        return prev.slice(0, roomCount);
      }
      return prev;
    });
  }, [roomCount]);

  const buildFlatDaysMap = (start?: Date, end?: Date, perNight?: number) => {
    const out: Record<string, number> = {};
    if (!start || !end || perNight == null) return out;
    const n = differenceInDays(end, start);
    for (let i = 0; i < Math.max(0, n); i++) {
      const d = addDays(start, i);
      out[ymdLocal(d)] = Number(perNight);
    }
    return out;
  };

  const handleRoomChange = (idx: number, field: string, value: any) => {
    console.log(`handleRoomChange: idx=${idx}, field=${field}, value=${value}`);
    setRooms((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;

        // typing into "rate" → keep their custom value and mark as user-edited
        if (field === "rate") {
          const num = Number(value) || 0;
          const next = {
            ...row,
            rate: row.is_foc ? 0 : num,
            userEditedRate: true,
            // keep per-day map in sync with a flat override if they type
            daysMap: buildFlatDaysMap(
              checkInDate,
              checkOutDate,
              row.is_foc ? 0 : num
            ),
          };
          return next;
        }

        // toggling FOC → zero the rate, clear userEdited flag
        if (field === "is_foc") {
          const checked = !!value;
          return {
            ...row,
            is_foc: checked,
            rate: checked ? 0 : row.rate,
            userEditedRate: false, // force recalc eligibility
            daysMap: checked
              ? buildFlatDaysMap(checkInDate, checkOutDate, 0)
              : row.daysMap,
          };
        }

        // changing any pricing driver → clear the user override so API can refill
        const drivers = new Set(["roomType", "adult", "child"]);
        let next: any = { ...row, [field]: value };
        if (drivers.has(field)) {
          if (field === "roomType") {
            next.room = ""; // clear room selection when room type changes
            next.rate = 0; // reset rate when room type changes
            next.rateMissing = true; // show "Type rate" placeholder
          }
          if (field === "adult") next.adult = Number(value || 1);
          next.userEditedRate = false; // allow new API value to apply
        }

        // keep IDs synced to selected rate plan
        next = recomputeRowFromPlan(next, rateCode, hotelRatePlans);
        return next;
      })
    );
  };

  const handleAddRoom = () => {
    setRoomCount((prev) => {
      const newCount = prev + 1;
      return newCount;
    });
  };

  const handleRemoveRoom = (idx: number) => {
    if (roomCount > 1) {
      setRoomCount((prev) => prev - 1);
      setRooms((prev) => prev.filter((_, i) => i !== idx));
    }
  };
  const [testState, setTestState] = useState([]);

  // Update nights when check-in or check-out dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const daysDifference = differenceInDays(checkOutDate, checkInDate);
      if (daysDifference >= 0 && daysDifference !== nights) {
        setNights(daysDifference);
      }
    }
  }, [checkInDate, checkOutDate]);

  // Update check-out date when nights or check-in date changes
  useEffect(() => {
    if (checkInDate && nights >= 0) {
      const newCheckOutDate = addDays(checkInDate, nights);
      if (
        !checkOutDate ||
        differenceInDays(newCheckOutDate, checkOutDate) !== 0
      ) {
        setCheckOutDate(newCheckOutDate);
      }
    }
  }, [nights, checkInDate]);

  const toLocalIsoDateTime = (d?: Date, hhmm?: string) => {
    if (!d) return "";
    const datePart = format(d, "yyyy-MM-dd");
    const timePart = hhmm && /^\d{2}:\d{2}$/.test(hhmm) ? hhmm : "12:00";
    return `${datePart}T${timePart}:00`;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setAddRoomDialogOpen(false);

    const uiRoomsAtSubmit = rooms.map((r) => ({ ...r }));

    // --- BEGIN booking POST logic ---
    // 1. Retrieve hotelId from localStorage
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = selectedProperty?.id;
    const propertyId = selectedProperty?.propertyID || selectedProperty?.id;

    const guestProfilePayload = {
      profileId: 0,
      hotelId: hotelId || 0,
      title: "",
      guestName: guestName || "",
      dob: new Date(systemDate).toISOString(),
      address: "",
      city: "",
      zipCode: "",
      country: selectedCountry || "",
      nationality: "",
      ppNo: "",
      phone: mobile,
      email: guestEmail,
      createdOn: new Date(systemDate).toISOString(),
      createdBy: fullName || "system",
      updatedOn: new Date(systemDate).toISOString(),
      updatedBy: fullName || "system",
    };

    const parsedGuestData = {
      title: "",
      guestName: guestName,
      email: guestEmail,
      phone: mobile,
      checkInDate: "",
      checkOutDate: "",
    };

    if (typeof setGuestProfileForCheckIn === "function") {
      setGuestProfileForCheckIn(parsedGuestData);
    }

    let guestProfileId: number | null = null;

    // ✅ Only create a guest profile when the user opted to Check-in
    if (isCheckedIn && !repeatGuest && !selectedGuestProfileId) {
      const guestProfilePayload = {
        profileId: 0,
        hotelId: hotelId || 0,
        title: "",
        guestName: guestName || "",
        dob: new Date(systemDate).toISOString(),
        address: "",
        city: "",
        zipCode: "",
        country: selectedCountry || "",
        nationality: "",
        ppNo: "",
        phone: mobile,
        email: guestEmail,
        createdOn: new Date(systemDate).toISOString(),
        createdBy: fullName || "system",
        updatedOn: new Date(systemDate).toISOString(),
        updatedBy: fullName || "system",
      };

      try {
        const guestResult = await dispatch(
          createGuestProfileCheckIn({
            hotelCode: localStorage.getItem("hotelCode") || "1097",
            guestName: guestName || "",
            phoneNo: mobile,
            email: guestEmail,
            country: selectedCountry || "",
            createdBy: fullName || "system",
          })
        );

        if (createGuestProfileCheckIn.fulfilled.match(guestResult)) {
          guestProfileId = guestResult.payload?.guestID ?? null;
        } else {
          console.error("Failed to create guest profile", guestResult.payload);
          return;
        }
      } catch (error) {
        console.error("Failed to create guest profile", error);
        return;
      }
    }

    // Filter out invalid/duplicate room selections and build selectedRooms array
    const selectedRooms = rooms
      .filter((r) => r.room) // Only rooms with a selected room number
      .filter(
        (r, idx, arr) => arr.findIndex((rr) => rr.room === r.room) === idx // Only unique room selections
      )
      .map((r) => ({
        roomNumber: r.room,
        rateCodeId: rateCode,
        rateType:
          selectedRatePlanDetails?.hotelRoomType?.hotelRoomTypeID?.toString() ||
          "",
      }));

    const walkInFormData = {
      selectedRooms,
      netRate: rooms[0]?.rate || 0,
      adults: rooms[0]?.adult || 2,
      children: rooms[0]?.child || 0,
      extra: "",
      discount: "",
      discountType: "amount",
      checkInDate: checkInDate?.toISOString().split("T")[0] || "",
      checkOutDate: checkOutDate?.toISOString().split("T")[0] || "",
      firstName: guestName,
      address: "",
      country: selectedCountry || "",
      email: guestEmail,
      phone: mobile,
      travelAgent: "",
      arrivalTime: "",
      zipCode: "",
      city: "",
      specialRequests: notes,
      bookingReffarance: "",
      currency: currency,
      rateType:
        selectedRatePlanDetails?.hotelRoomType?.hotelRoomTypeID?.toString() ||
        "",
      supplement: "0",
      isDayRoom: isDayUse,
      bookingRevision: "1",
    };

    // Generate IDs once, to ensure consistency
    const revId = "walkin-rev-" + Date.now();
    const bkId = "walkin-bk-" + Date.now();
    const checkinDate = walkInFormData.checkInDate;
    const checkoutDate = walkInFormData.checkOutDate;

    // Compose finalRooms array as per new payload using selectedRooms directly
    const finalRooms = rooms
      .filter((r) => r.room)
      .filter(
        (r, idx, arr) => arr.findIndex((rr) => rr.room === r.room) === idx
      )
      .map((room) => {
        const checkIn = new Date(checkinDate);
        const checkOut = new Date(checkoutDate);
        const nights = differenceInDays(checkOut, checkIn);

        const daysObj: { [key: string]: string } = {};
        let totalCombined = 0; // sum of adult + child for the room

        for (let i = 0; i < nights; i++) {
          const dateStr = ymdLocal(addDays(checkIn, i));

          // per-day combined (adult + child) from UI row state
          const perDayCombined = room.is_foc
            ? 0
            : room.daysMap?.[dateStr] ?? Number(room.rate || 0);

          // child-per-day (already multiplied by child count in your state)
          const perDayChild = Number(room.childDaysMap?.[dateStr] ?? 0);

          // what we want to POST under "days": adult-only
          const perDayAdult = Math.max(0, perDayCombined - perDayChild);

          daysObj[dateStr] = String(perDayAdult.toFixed(2));
          totalCombined += Number(perDayCombined);
        }

        return {
          roomNo: room.room,
          netRate: room.is_foc ? 0 : room.rate,
          adult: room.adult,
          child: room.child,
          extra: walkInFormData.extra,
          discount: walkInFormData.discount,

          // keep the total AMOUNT as adult+child
          amount: String(Number(totalCombined).toFixed(2)),

          rateCodeId: room.rateCodeId,
          rateType: room.rateType,
          days: daysObj, // <-- adult-only per-day map
        };
      });

    const insertedAt = new Date(systemDate).toISOString();
    const discountType = walkInFormData.discountType;

    const personalInfo = {
      guestName: walkInFormData.firstName,
      address: walkInFormData.address,
      country: walkInFormData.country,
      email: walkInFormData.email,
      phone: walkInFormData.phone,
    };

    const effectiveGuestProfileId = isCheckedIn
      ? guestProfileId ?? selectedGuestProfileId ?? 0
      : 0;

    const releaseAt =
      reservationType === "tentative"
        ? toLocalIsoDateTime(releaseDate, releaseTime)
        : undefined;

    const bookingPayload = {
      data: [
        {
          attributes: {
            id: revId,
            meta: {
              ruid: revId,
              is_genius: false,
            },
            status: "new",
            services: [],
            currency: walkInFormData.currency || "USD",
            amount: finalRooms
              .reduce((sum, r) => sum + parseFloat(String(r.amount || "0")), 0)
              .toFixed(2),
            // Use the first room's rate code ID for the top-level attribute
            rate_code_id:
              walkInFormData.selectedRooms.length > 0
                ? parseInt(walkInFormData.selectedRooms[0].rateCodeId)
                : null,

            created_by: fullName,
            remarks_internal: "",
            remarks_guest: walkInFormData.specialRequests,
            guest_profile_id: effectiveGuestProfileId,
            // guest_profile_id: 0,
            agent: selectedTravelAgent || "",
            inserted_at: insertedAt,
            channel_id: "",
            property_id: "",
            hotel_id: hotelId || 0,
            unique_id: bkId,
            system_id: "FIT",
            ota_name: selectedTravelAgent || "",
            booking_id: bkId,
            notes: walkInFormData.specialRequests || "",
            arrival_date: checkinDate,
            arrival_hour: walkInFormData.arrivalTime || "",
            customer: {
              meta: {
                ruid: "",
                is_genius: false,
              },
              name: personalInfo.guestName || "",
              zip: walkInFormData.zipCode || "",
              address: personalInfo.address || "",
              country: selectedCountry || "",
              city: walkInFormData.city || "",
              language: "en",
              mail: personalInfo.email || "",
              phone: personalInfo.phone || "",
              surname: "",
              company: "",
            },
            departure_date: checkoutDate,
            deposits: [],
            ota_commission: "0",
            ota_reservation_code: walkInFormData.bookingReffarance || "",
            payment_collect: "property",
            payment_type: "",
            rooms: finalRooms.map((fr) => {
              // Find the UI row for this final room
              const uiRow =
                rooms.find((r) => String(r.room) === String(fr.roomNo)) ||
                ({} as any);

              // Prefer days precomputed in finalRooms; otherwise rebuild from the UI row
              const daysObj =
                fr.days && Object.keys(fr.days).length > 0
                  ? fr.days
                  : (() => {
                      const out: Record<string, string> = {};
                      try {
                        const checkIn = new Date(checkinDate);
                        const checkOut = new Date(checkoutDate);
                        const totalNights = differenceInDays(checkOut, checkIn);

                        for (let i = 0; i < totalNights; i++) {
                          const dateStr = ymdLocal(addDays(checkIn, i));

                          // combined (adult+child) from UI state
                          const combined = uiRow.is_foc
                            ? 0
                            : uiRow.daysMap?.[dateStr] ??
                              Number(uiRow.rate || 0);

                          // child-only (already multiplied by child count)
                          const childOnly = Number(
                            uiRow.childDaysMap?.[dateStr] ?? 0
                          );

                          // we send adult-only in "days"
                          const adultOnly = Math.max(0, combined - childOnly);

                          out[dateStr] = String(adultOnly.toFixed(2));
                        }
                      } catch (err) {
                        console.error(
                          "❌ Error generating adult-only days object:",
                          err
                        );
                      }
                      return out;
                    })();

              // Prefer amount from finalRooms; otherwise sum days
              const amountNum =
                fr.amount != null
                  ? Number(fr.amount)
                  : Object.values(daysObj).reduce(
                      (s, v) => s + parseFloat(v),
                      0
                    );

              return {
                reservation_status_id:
                  reservationType === "confirm"
                    ? 1
                    : reservationType === "tentative"
                    ? 2
                    : 1,
                is_foc: !!uiRow.is_foc,
                taxes: [],
                services: [],
                amount: amountNum.toFixed(2), // ✅ now posts correctly
                days: daysObj, // ✅ per-day totals (adult + child)

                guest_profile_id: effectiveGuestProfileId,
                ota_commission: "0",
                guests: [],
                occupancy: {
                  children: Number(uiRow.child || 0),
                  adults: Number(uiRow.adult || 1),
                  ages: [],
                  infants: 0,
                },

                // IDs – use what the UI row captured; fall back to finalRooms when useful
                rate_plan_id: String(uiRow.ratePlanId || "1"),
                room_type_id: "0",
                hotel_room_type_id: Number(uiRow.roomType || 0),
                booking_room_id: String(uiRow.room || fr.roomNo || ""),

                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                is_cancelled: false,
                ota_unique_id: "",

                disc_percen:
                  walkInFormData.discountType === "percent"
                    ? parseFloat(walkInFormData.discount || "0")
                    : 0,
                discount:
                  walkInFormData.discountType !== "percent"
                    ? parseFloat(walkInFormData.discount || "0")
                    : 0,

                // 👇 child & net rates taken from UI row computations
                child_rate: (() => {
                  const kids = Number(uiRow.child || 0);
                  const childTotal = Number(uiRow.childRateTotal || 0); // total child charges across stay
                  const nightsCount = Object.keys(
                    uiRow.childDaysMap || {}
                  ).length;

                  if (kids > 0 && nightsCount > 0) {
                    // average per-day, per-child
                    return parseFloat(
                      (childTotal / nightsCount / kids).toFixed(2)
                    );
                  }

                  // Fallback to plan’s configured per-child rate for that date (if available)
                  const plan = findPlanForRow(
                    hotelRatePlans,
                    rateCode,
                    uiRow.roomType
                  );
                  if (
                    plan &&
                    Array.isArray(plan.hotelRates) &&
                    plan.hotelRates.length
                  ) {
                    const firstDate = Object.keys(uiRow.daysMap || {})[0];
                    const rec =
                      plan.hotelRates.find(
                        (r: any) => String(r.rateDate) === firstDate
                      ) || plan.hotelRates[0];
                    return parseFloat(Number(rec?.child ?? 0).toFixed(2));
                  }

                  return 0;
                })(),
                suppliment: parseFloat(walkInFormData.supplement || "0"),
                net_rate: Number(
                  uiRow.is_foc ? 0 : uiRow.rate ?? fr.netRate ?? 0
                ),

                is_day_room: !!walkInFormData.isDayRoom,
                bed_type: String(uiRow.bedType || ""),
                res_occupancy: String(uiRow.occupancy || ""),
                meta: { meal_plan: mealPlanName || "" },
              };
            }),

            occupancy: {
              children: finalRooms.reduce(
                (acc, r) => acc + parseInt(r.child || "0"),
                0
              ),
              adults: finalRooms.reduce(
                (acc, r) => acc + parseInt(r.adult || "1"),
                0
              ),
              ages: [],
              infants: 0,
            },
            guarantee: undefined,
            secondary_ota: "",
            acknowledge_status: "pending",
            raw_message: "{}",
            is_crs_revision: false,
            is_day_room: walkInFormData.isDayRoom || false,
            ref_no: refNo,
            group_name: groupName,
            tour_no: tourNo,
          },
          id: revId,
          type: "booking_revision",
          relationships: {
            data: {
              property: { id: hotelId?.toString() || "0", type: "property" },
              booking: { id: bkId, type: "booking" },
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
      dateTime: new Date(systemDate).toISOString(),
    };
    // Log the matched rate plan and rate code ID
    const selectedRatePlan = hotelRatePlans.find(
      (plan) => plan.hotelRatePlanID.toString() === walkInFormData.rateType
    );

    try {
      const result = await dispatch(createBookingFeed(bookingPayload));

      console.log("Booking creation result:", result);

      if (createBookingFeed.fulfilled.match(result)) {
        const bookingData = result.payload;
        const reservationID = Number(bookingData?.reservationID || 0);

        // Try our best to have a reservation number for the log
        const reservationNoForLog = String(
          bookingData?.reservationNo ||
            bookingData?.bookingNo ||
            refNo || // your user-entered reference
            `RES-${reservationID || Date.now()}`
        );
        console.log("hi1");

        // Log immediately (we might not yet know detailId / roomNo)
        await createLogSafe("Reservation created via Quick Reservation", {
          reservationId: reservationID,
          reservationDetailId: 0,
          reservationNo: reservationNoForLog,
          roomNumber: rooms?.[0]?.room ? String(rooms[0].room) : "",
        });

        console.log("hi2");
        // Reservation created successfully, proceed with cleanup
        onCreated?.();
        
        try {
          // Send notification emails if needed
          const guestTo = getGuestEmail();
          const hotelTo = getHotelEmail();

          if (guestTo || hotelTo) {
            const nightsCount = Math.max(
              1,
              differenceInDays(checkOutDate!, checkInDate!)
            );

            const hotelObj = JSON.parse(getLS("selectedProperty") || "{}");
            const hotelName = hotelObj?.name || "Your Hotel";
            const hotelCurrency = hotelObj?.hotelCurrency || currency || "USD";
            const bkNo = refNo || `RES-${Date.now()}`;

            // Build email rooms data from UI state
            const emailRooms = uiRoomsAtSubmit.map((r) => {
              const rt = roomTypes.find(
                (x) => String(x.hotelRoomTypeID) === String(r.roomType)
              ) || fetchedroomTypes.find(
                (x: any) => String(x.hotelRoomTypeID) === String(r.roomType)
              );

              const nightlyRate = Number(r.rate || 0);
              const total = r.is_foc ? 0 : nightlyRate * nightsCount;
              const avg = nightsCount > 0 ? total / nightsCount : nightlyRate;

              return {
                name: rt?.roomType || "Room",
                meal: mealPlanName || "",
                adults: Number(r.adult || 1),
                children: Number(r.child || 0),
                total,
                avg,
              };
            });

            const totalAll = emailRooms.reduce(
              (s, rr) => s + Number(rr.total || 0),
              0
            );

            const commonEmailArgs = {
              hotelName,
              otaName: selectedTravelAgent || "Direct",
              reservationNo: bkNo,
              payCollect: "Property",
              checkIn: checkInDate!.toISOString().slice(0, 10),
              checkOut: checkOutDate!.toISOString().slice(0, 10),
              nights: nightsCount,
              rooms: emailRooms,
              currency: hotelCurrency as string,
              total: totalAll,
              notes,
            };

            // Send guest email
            if (guestTo) {
              const guestHtml = buildEmailHtml({
                ...commonEmailArgs,
                guest: {
                  name: guestName,
                  email: guestEmail,
                  country: selectedCountry,
                },
              });

              await dispatch(
                sendCustomEmail({
                  toEmail: guestTo,
                  subject: `Your Booking – ${bkNo} (${selectedTravelAgent || "Direct"})`,
                  body: guestHtml,
                  isHtml: true,
                  priority: 0,
                  senderName: "Reservations",
                })
              );
            }

            // Send hotel email
            if (hotelTo) {
              const hotelHtml = buildEmailHtml({
                ...commonEmailArgs,
                guest: {
                  name: guestName,
                  email: guestEmail,
                  country: selectedCountry,
                },
              });

              await dispatch(
                sendCustomEmail({
                  toEmail: hotelTo,
                  subject: `New Booking – ${bkNo} (${selectedTravelAgent || "Direct"})`,
                  body: hotelHtml,
                  isHtml: true,
                  priority: 0,
                  senderName: "Reservations",
                })
              );
            }
          }
        } catch (e) {
          console.error("Email send failed:", e);
        }
        
        // Reset form and close drawer
        setWalkInFormData(initialWalkInFormData);
        setGuestName("");
        setMobile("");
        setGuestEmail("");
        setNotes("");
        setSelectedCountry("");
        setRateCode("");
        setSelectedRatePlan(null);
        setSelectedRatePlanDetails(null);
        setReservationType("confirm");
        setCurrency("LKR");
        setRoomCount(1);
        setRooms([{ roomType: "", room: "", adult: 2, child: 0, rate: 0 }]);
        setCheckInDate(new Date(systemDate));
        setCheckOutDate(addDays(new Date(systemDate), 1));
        setNights(1);
        setIsDayUse(false);
        setTitle("Mr");
        onOpenChange(false);
      } else {
        console.error("❌ Booking creation failed:", result.message);
        alert(`Booking failed: ${result.message}`);
      }
    } catch (error) {
      console.error("❌ Unexpected error during booking or check-in:", error);
    } finally {
      setIsSubmitting(false);
    }
    window.location.reload();
  };

  // ✅ Update check-out date when check-in or nights is changed manually
  useEffect(() => {
    if (checkInDate && nights >= 0) {
      const newCheckOut = addDays(checkInDate, nights);
      if (
        !checkOutDate ||
        newCheckOut.toDateString() !== checkOutDate.toDateString()
      ) {
        setCheckOutDate(newCheckOut);
      }
    }
  }, [nights, checkInDate]);

  const availableRooms = useSelector(selectAvailableRoomTypesItems);
  const availableLoading = useSelector(selectAvailableRoomTypesLoading);

  console.log("Available Rooms.⚽⚽⚽⚽ :", availableRooms);
  console.log(
    "Available Rooms Type:",
    typeof availableRooms,
    Array.isArray(availableRooms)
  );
  console.log("Fetched Room Types:🎾🎾🎾", fetchedroomTypes);
  console.log("Current rooms state:", rooms);
  console.log(
    "Room type values:",
    rooms.map((r) => ({
      idx: rooms.indexOf(r),
      roomType: r.roomType,
      room: r.room,
    }))
  );

  useEffect(() => {
    rooms.forEach((room, idx) => {
      if (room.roomType && checkInDate && checkOutDate) {
        const hotelCode = localStorage.getItem("hotelCode") || "1097";
        dispatch(
          fetchAvailableRoomTypes({
            hotelCode,
            hotelRoomTypeId: parseInt(room.roomType),
            checkInDate: checkInDate.toISOString(),
            checkOutDate: checkOutDate.toISOString(),
          })
        );
      }
    });
  }, [
    rooms.map((r) => r.roomType).join(","),
    checkInDate?.toISOString(),
    checkOutDate?.toISOString(),
  ]);

  const countriesData = useSelector(selectCountryMas);
  const countriesLoading = useSelector(selectCountryMasLoading);

  useEffect(() => {
    dispatch(fetchCountryMas());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(countriesData) && countriesData.length > 0) {
      // Map the API response to the format expected by the component
      const formattedCountries = countriesData.map((country) => ({
        name: country.country,
        code: country.countryCode,
        phoneCode: "", // This data isn't available in CountryMas
        currency: "", // Currency not provided in this API
      }));
      setCountries(formattedCountries);
    } else {
      // Use fallback countries if response is empty
      setCountries(fallbackCountries);
    }
  }, [countriesData]);

  // replace your current recomputeRowFromPlan with this
  const recomputeRowFromPlan = (
    row: any,
    rateCodeId: string | number,
    plans: AnyPlan[]
  ) => {
    const plan = findPlanForRow(plans, rateCodeId, row.roomType);

    const next: any = {
      ...row,
      rateCodeId: String(rateCodeId || ""),
      ratePlanId: plan?.hotelRatePlanID
        ? String(plan.hotelRatePlanID)
        : row.ratePlanId,
      rateMissing: false, // 👈 clear; we’ll re-evaluate after fetch
    };

    if (row.is_foc) next.rate = 0; // keep your FOC rule
    return next;
  };

  console.log("countries data:", countries);

  console.log("walkInFormData:", walkInFormData);

  const updateRoomRateFromAPI = async (idx: number) => {
    const row = rooms[idx];
    const plan = findPlanForRow(hotelRatePlans, rateCode, row.roomType);
    const ratePlanId = plan?.hotelRatePlanID;

    if (
      !ratePlanId ||
      !row.roomType ||
      !checkInDate ||
      !checkOutDate ||
      row.is_foc
    )
      return;

    try {
      setRateLoading((p) => ({ ...p, [idx]: true }));

      console.log(
        "Fetching calculated rate with mealPlanId (from basisMas):",
        Number(selectedMealPlan || 0)
      );

      const res = await (
        dispatch(
          fetchCalculatedRate({
            ratePlanId: Number(ratePlanId),
            currencyCode: String(currency || "LKR"),
            mealPlanId: Number(selectedMealPlan || 0), // This comes from basisMas.basisID
            roomTypeId: Number(row.roomType),
            startDate: toApiDateTime(checkInDate),
            endDate: toApiDateTime(checkOutDate),
            paxCount: Number(row.adult || 1),
            childPaxCount: Number(row.child || 0),
            childAges: [],
          })
        ) as any
      ).unwrap();

      console.log(`Calculated rate for row ${idx}:`, res);

      const requiredDates: string[] = [];
      {
        const n = differenceInDays(checkOutDate, checkInDate);
        for (let i = 0; i < Math.max(0, n); i++) {
          requiredDates.push(ymdLocal(addDays(checkInDate, i)));
        }
      }
      const nights = Math.max(1, requiredDates.length);

      const daily = Array.isArray(res?.dailyRates) ? res.dailyRates : [];

      // --- Adult totals from dailyRates ---
      // Build a quick map of adult rate per required day
      const adultByDate: Record<string, number> = {};
      for (const d of daily) {
        adultByDate[String(d.date)] = Number(d.rate ?? d.adultRate ?? 0);
      }
      let adultTotal = 0;
      for (const dateStr of requiredDates) {
        adultTotal += Number(adultByDate[dateStr] ?? 0);
      }

      const childCount = Math.max(0, Number(row.child || 0));

      // If API childRate is per-child PER NIGHT:
      const perChildRatePerNight = Number(res?.childRate ?? 0);

      // Per-day child charge (already multiplied by selected child count)
      const childPerDayEven = perChildRatePerNight * childCount;

      // Total child charge across the stay
      const childTotalForStay = childPerDayEven;

      // Build maps
      const childDaysMap: Record<string, number> = {};
      const combinedDaysMap: Record<string, number> = {};

      for (const dateStr of requiredDates) {
        const adultForDay = Number(adultByDate[dateStr] ?? 0);
        childDaysMap[dateStr] = childPerDayEven; // 0 if no children
        combinedDaysMap[dateStr] = row.is_foc
          ? 0
          : adultForDay + childPerDayEven;
      }

      // --- Fallback from plan for adult part (unchanged) ----------------------
      const hotelRatesFromPlan: any[] = Array.isArray(plan?.hotelRates)
        ? plan!.hotelRates
        : [];
      const hotelRateByDate = new Map<string, any>(
        hotelRatesFromPlan.map((r: any) => [String(r.rateDate), r])
      );
      const computeAdultFromPlan = (dateStr: string, adults: number) => {
        const rec = hotelRateByDate.get(dateStr);
        if (!rec) return 0;
        const sellMode = String(rec.sellMode || "").toLowerCase();
        if (sellMode === "per person") {
          const capped = Math.min(Math.max(Number(adults) || 1, 1), 18);
          const col = `pax${capped}`;
          return Number(rec[col] ?? rec.defaultRate ?? 0);
        }
        return Number(rec.defaultRate ?? 0);
      };

      for (const dateStr of requiredDates) {
        if (!adultByDate.hasOwnProperty(dateStr)) {
          const fallbackAdult = computeAdultFromPlan(
            dateStr,
            Number(row.adult || 1)
          );
          if (fallbackAdult > 0) {
            combinedDaysMap[dateStr] = row.is_foc
              ? 0
              : fallbackAdult + childPerDayEven;
            adultTotal += fallbackAdult;
          }
        }
      }

      // --- Final totals/averages (adult + children actually selected) ---------
      // Adult part from API (or fallback) + the child total we just computed
      const apiAdultTotal =
        res?.totalRate != null ? Number(res.totalRate) : adultTotal;
      const apiTotalCombined = apiAdultTotal + childTotalForStay;
      const apiAvgCombined = (apiTotalCombined || 0) / nights;

      // determine "no rate" state
      const noApiRate =
        (isNaN(apiAvgCombined) || apiAvgCombined <= 0) &&
        Object.values(combinedDaysMap).every((v) => Number(v) <= 0);

      // update the per-room quotes (optional visual)
      setRoomQuotes((prev) =>
        prev.map((q, i) =>
          i === idx
            ? {
                averageRate: row.is_foc || noApiRate ? 0 : apiAvgCombined,
                totalRate: row.is_foc || noApiRate ? 0 : apiTotalCombined,
                daysMap: noApiRate ? {} : combinedDaysMap,
              }
            : q
        )
      );

      // finally update the row (keep manual if user edited)
      setRooms((prev) =>
        prev.map((r, i) => {
          if (i !== idx) return r;

          if (noApiRate) {
            return {
              ...r,
              rateMissing: true,
              ratePlanId: String(ratePlanId),
              rateCodeId: String(rateCode || r.rateCodeId || ""),
            };
          }

          // store maps and use COMBINED average (adult + childCount * childRate)
          return {
            ...r,
            rateMissing: false,
            rate: r.userEditedRate ? r.rate : r.is_foc ? 0 : apiAvgCombined,
            ratePlanId: String(ratePlanId),
            rateCodeId: String(rateCode || r.rateCodeId || ""),
            daysMap: combinedDaysMap,
            childDaysMap, // already includes childCount via childPerDayEven
            childRateAvg: nights > 0 ? childPerDayEven : 0,
            childRateTotal: childTotalForStay,
          };
        })
      );
    } catch (e) {
      console.error("Calculated rate fetch failed:", e);
    } finally {
      setRateLoading((p) => ({ ...p, [idx]: false }));
    }
  };

  useEffect(() => {
    if (!open) {
      // reset the guard for the next time drawer opens
      initialAppliedRef.current = false;
      return;
    }
    if (initialAppliedRef.current) return;
    if (!initialRange) return;

    // we may need roomNumbers / fetchedroomTypes to resolve roomTypeId
    // wait until they are loaded (or at least attempted)
    const haveRoomsLoaded =
      Array.isArray(roomNumbers) && roomNumbers.length >= 0;
    const haveTypesLoaded =
      Array.isArray(fetchedroomTypes) && fetchedroomTypes.length >= 0;

    if (!haveRoomsLoaded || !haveTypesLoaded) return;

    const ci = toDate(initialRange.checkIn) ?? new Date(systemDate);
    // if no checkout provided, assume +1 night
    const co =
      toDate(initialRange.checkOut) ?? addDays(ci ?? new Date(systemDate), 1);

    // resolve roomTypeId once we have lists
    const resolvedRoomTypeId = resolveRoomTypeId(
      initialRange,
      roomNumbers,
      fetchedroomTypes as any[]
    );

    // Prefer given roomId; else try to map via roomNumber
    const resolvedRoomId =
      initialRange?.roomId ??
      roomNumbers.find(
        (r) => String(r.roomNo) === String(initialRange?.roomNumber)
      )?.roomId ??
      "";

    // one tight batched update to avoid extra renders
    unstable_batchedUpdates?.(() => {
      // dates + nights
      if (ci) setCheckInDate(ci);
      if (co) setCheckOutDate(co);
      if (ci && co) {
        const n = Math.max(1, differenceInDays(co, ci));
        setNights(n);
      }

      // ensure exactly one row prefilled
      setRoomCount(1);
      setRooms([
        {
          ...newRoom(),
          roomType: String(resolvedRoomTypeId || ""),
          room: resolvedRoomId ? String(resolvedRoomId) : "",
          // allow downstream rate calc to run; don't force is_foc
          userEditedRate: false,
          rateMissing: false,
        },
      ]);
    });

    initialAppliedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    initialRange,
    systemDate,
    // when these arrive, we can resolve roomType and apply exactly once
    roomNumbers,
    fetchedroomTypes,
  ]);

  useEffect(() => {
    // immediately clear old numbers so UI doesn't keep previous rate
    resetRatesForAllRows();

    // then re-calc for each eligible row
    rooms.forEach((row, idx) => {
      const ready =
        row.roomType && rateCode && checkInDate && checkOutDate && !row.is_foc;

      if (ready) updateRoomRateFromAPI(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // GLOBAL DRIVERS
    rateCode, // ratePlanId source
    currency, // currencyCode
    selectedMealPlan, // mealPlanId

    // dates
    checkInDate?.toISOString(),
    checkOutDate?.toISOString(),

    // hotelId (from localStorage); include its string so effect runs when user switches hotel
    (typeof window !== "undefined" &&
      JSON.parse(localStorage.getItem("selectedProperty") || "{}")?.id) ||
      "",

    // ROW-LEVEL DRIVERS: roomType (roomTypeId), adult/child (pax), FOC, and manual override
    rooms
      .map(
        (r) =>
          `${r.roomType}:${r.adult}:${r.child}:${r.is_foc}:${
            r.userEditedRate ? 1 : 0
          }`
      )
      .join("|"),
  ]);

  const getLS = (k: string) =>
    (typeof window !== "undefined" && localStorage.getItem(k)) || "";

  // ✨ guest-only
  const getGuestEmail = () => (guestEmail || "").trim();

  // ✨ hotel-only (back office)
  const getHotelEmail = () =>
    (getLS("email") || getLS("rememberedEmail") || "").trim();

  // (kept for backwards compat if something else still calls it)
  const recipientEmail = () => getGuestEmail();

  const fmtDate = (d?: Date | string) =>
    d
      ? format(typeof d === "string" ? new Date(d) : d, "EEEE, MMMM dd yyyy")
      : "";

  const money = (n: number | string, ccy: string) =>
    `${Number(n || 0).toFixed(2)} ${ccy}`;

  const buildEmailHtml = ({
    hotelName,

    otaName,

    reservationNo,

    payCollect,

    checkIn,

    checkOut,

    nights,

    rooms,

    currency,

    total,

    guest,

    notes,
  }: {
    hotelName: string;

    otaName: string;

    reservationNo: string | number;

    payCollect: string;

    checkIn: string;

    checkOut: string;

    nights: number;

    rooms: Array<{
      name: string;

      meal: string;

      adults: number;

      children: number;

      total: number;

      avg: number;
    }>;

    currency: string;

    total: number;

    guest: { name?: string; email?: string; country?: string };

    notes?: string;
  }) => {
    const rows = rooms

      .map(
        (r) => `

      <tr>

        <td style="padding:10px 0;">

          <div style="font-weight:600;">${r.name}</div>

          <div style="color:#666;">${r.meal}</div>

          <div style="color:#666;">Occupancy: Adults ${r.adults}, Children ${
          r.children
        }</div>

        </td>

        <td style="padding:10px 0; text-align:right; white-space:nowrap;">

          <div style="font-weight:600;">${money(r.total, currency)}</div>

          <div style="color:#666;">${money(
            r.avg,

            currency
          )} × ${nights} nights</div>

        </td>

      </tr>`
      )

      .join("");

    return `<!doctype html><html><body style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f7f7f8;margin:0;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;"><tr><td align="center">

  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)">

    <tr><td style="padding:22px;font-size:20px;font-weight:700;text-align:center">You have a new booking for ${hotelName}</td></tr>

    <tr><td style="padding:0 22px 14px">

      <div style="background:#e8f6df;padding:12px 14px;border-radius:8px;font-size:14px">

        <div><b>Source / OTA:</b> ${otaName}</div>

        <div><b>Reservation Number:</b> ${reservationNo}</div>

        <div><b>Payment Collect:</b> ${payCollect}</div>

      </div>

    </td></tr>

    <tr><td style="padding:12px 22px">

      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px">

        <tr>

          <td style="width:33%;padding:12px;border-right:1px solid #eee;vertical-align:top">

            <div style="font-size:12px;color:#666">Check-In</div>

            <div style="font-weight:600">${fmtDate(checkIn)}</div>

          </td>

          <td style="width:33%;padding:12px;border-right:1px solid #eee;vertical-align:top;text-align:center">

            <div style="font-size:12px;color:#666">Nights</div>

            <div style="font-weight:700;font-size:18px">${nights}</div>

          </td>

          <td style="width:33%;padding:12px;vertical-align:top;text-align:right">

            <div style="font-size:12px;color:#666">Check-Out</div>

            <div style="font-weight:600">${fmtDate(checkOut)}</div>

          </td>

        </tr>

      </table>

    </td></tr>

    <tr><td style="padding:0 22px">

      <div style="font-size:14px;color:#666;margin-bottom:6px">Rooms Booked</div>

      <div style="font-weight:600;margin-bottom:8px">${rooms.length}</div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee">${rows}</table>

      <div style="border-top:1px solid #eee;margin-top:8px;padding:12px 0;text-align:right;font-weight:700">

        Total: ${money(total, currency)}

      </div>

    </td></tr>

    <tr><td style="padding:0 22px 16px">

      <div style="font-weight:600;margin:8px 0">Customer</div>

      <div><b>Name:</b> ${guest.name || ""}</div>

      <div><b>E-Mail:</b> ${guest.email || ""}</div>

      <div><b>Country:</b> ${guest.country || ""}</div>

    </td></tr>

    ${
      notes
        ? `<tr><td style="padding:0 22px 22px"><div style="font-weight:600;margin:8px 0">Guest notes</div><div style="white-space:pre-wrap">${notes}</div></td></tr>`
        : ""
    }

  </table></td></tr></table></body></html>`;
  };

  useEffect(() => {
    setRoomQuotes((prev) => {
      if (roomCount > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: roomCount - prev.length }, () => ({
            averageRate: 0,
            totalRate: 0,
            daysMap: {},
          })),
        ];
      } else if (roomCount < prev.length) {
        return prev.slice(0, roomCount);
      }
      return prev;
    });
  }, [roomCount]);

  console.log("travelAgentOptions : ", travelAgentOptions);

  const SuggestionTable = ({
    guests,
    onSelect,
  }: {
    guests: any[];
    onSelect: (guest: any) => void;
  }) => {
    if (!guests || guests.length === 0) return null;
    return (
      <div className="border rounded-md mt-1 bg-white shadow-md max-h-40 overflow-y-auto dark:bg-black ">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 dark:bg-black">
            <tr>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Email</th>
              <th className="px-2 py-1 text-left">Passport</th>
              <th className="px-2 py-1 text-left">Phone</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr
                key={g.guestProfileId}
                className="hover:bg-gray-500 cursor-pointer "
                onClick={() => onSelect(g)}
              >
                <td className="px-2 py-1">{g.guestName}</td>
                <td className="px-2 py-1">{g.email}</td>
                <td className="px-2 py-1">{g.ppNo}</td>
                <td className="px-2 py-1">{g.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const filteredPassportSuggestions = hotelGuestProfile.filter((guest) =>
    guest.ppNo?.toLowerCase().includes(guestPassport.toLowerCase())
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={[
            `w-full sm:max-w-6xl overflow-x-hidden overflow-y-auto rounded-l-2xl  `,
            isFullscreen
              ? "fixed inset-0 md:max-w-[85vw] lg:max-w-[100vw] w-full max-w-none rounded-none"
              : "w-full sm:max-w-[96vw] md:max-w-[90vw] lg:max-w-[65vw] rounded-l-2xl",
          ]}
        >
          <SheetHeader className="flex-shrink-0 space-y-2 pb-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>Reservation</SheetTitle>
              <div className="absolute top-2 right-8 gap-4">
                <div className=" z-50 flex gap-2 ">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setIsFullscreen((v) => !v)}
                    className="rounded-full mr-10"
                    aria-label={
                      isFullscreen ? "Exit full screen" : "Full screen"
                    }
                    title={isFullscreen ? "Exit full screen" : "Full screen"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="relative  w-10 h-10 mr-10">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
                    <Button
                      variant="ghost"
                      onClick={() => setShowRawOverlay(true)}
                      className="p-0 w-10 h-10 relative z-10"
                    >
                      <img
                        src={YoutubeIcon.src}
                        alt="YouTube"
                        className="w-6 h-6 object-contain dark:invert"
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 overflow-y-auto py-4  ">
            <form className="space-y-4 ">
              <div className="bg-muted/50 dark:bg-slate-900 py-2 rounded-md ">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 bg-muted/50 dark:bg-slate-900 py-2 rounded-md px-2">
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Travel Agent
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-2">
                      <div className=" col-span-4">
                        <Select
                          value={selectedTravelAgent}
                          onValueChange={(value) =>
                            setSelectedTravelAgent(value)
                          }
                        >
                          <SelectTrigger id="travelAgent">
                            <SelectValue placeholder="Select Travel Agent" />
                          </SelectTrigger>
                          <SelectContent>
                            {travelAgentOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.label}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className=" col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsAddDrawerOpen(true)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Booking Ref.
                    </label>
                    <Input
                      placeholder="Enter booking reference"
                      value={refNo}
                      onChange={(e) => setRefNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Tour No
                    </label>
                    <Input
                      placeholder="Tour No"
                      value={tourNo}
                      onChange={(e) => setTourNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">
                      Group Name
                    </label>
                    <Input
                      value={groupName}
                      onChange={(e) => {
                        setGroupName(e.target.value);
                      }}
                      placeholder=" Group Name"
                    />
                  </div>
                </div>

                {/* date */}
                <div
                  className={`grid grid-cols-1 gap-4 items-end
    ${
      reservationType === "tentative"
        ? "sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-5"
        : "sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4"
    }`}
                >
                  <div className="px-2">
                    {/* Status */}
                    <div className="grid grid-cols-1">
                      <label className="text-sm font-medium block mb-1">
                        Status
                      </label>
                      <Select
                        value={reservationType}
                        onValueChange={setReservationType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Confirm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirm">Confirm</SelectItem>

                          <SelectItem value="tentative">Tentative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {reservationType === "tentative" && (
                    <>
                      {/* date */}
                      <div className="grid grid-cols-1">
                        <label className="text-sm font-medium block mb-1">
                          Release Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pl-10"
                            value={
                              releaseDate
                                ? format(releaseDate, "yyyy-MM-dd")
                                : ""
                            }
                            onChange={(e) =>
                              setReleaseDate(
                                new Date(`${e.target.value}T00:00:00`)
                              )
                            }
                          />
                        </div>
                      </div>

                      {/* <div className="grid grid-cols-1">
                        <label className="text-sm font-medium block mb-1">
                          Release Time
                        </label>
                        <input
                          type="time"
                          value={releaseTime}
                          onChange={(e) => setReleaseTime(e.target.value)}
                          className="w-full rounded-md border px-3 py-2 bg-white dark:bg-zinc-900 dark:border-zinc-700 text-sm"
                        />
                      </div> */}
                    </>
                  )}
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-1">
                      Check-in
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-10"
                        min={
                          systemDate ||
                          new Date(systemDate)
                        }
                        value={
                          checkInDate
                            ? checkInDate.toISOString().split("T")[0]
                            : systemDate || ""
                        }
                        onChange={(e) => {
                          const selected = new Date(e.target.value);
                          setCheckInDate(selected);
                          setNights(1);
                          setCheckOutDate(addDays(selected, 1));
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium block mb-1">
                      Nights
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={isDayUse ? 0 : 1}
                        value={nights}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= (isDayUse ? 0 : 1)) {
                            setNights(value);
                            if (value === 0 && !isDayUse) {
                              setIsDayUse(true);
                            }
                          }
                        }}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="flex-1 pr-2">
                    <label className="text-sm font-medium block mb-1">
                      Check-out
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-10"
                        min={
                          checkInDate
                            ? checkInDate.toISOString().split("T")[0]
                            : new Date(systemDate)
                        }
                        value={
                          checkOutDate
                            ? checkOutDate.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setCheckOutDate(new Date(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* status */}

              {/* Date selection section - inline layout */}

              {/* rate section */}
              <div className="bg-muted/50 dark:bg-slate-900 py-2 rounded-md  items-center px-2">
                <div className="gap-4  grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 items-center ">
                  {/* Status */}

                  {/* Check-in Date */}

                  {/* Check-in Time */}

                  {/* Conditionally show release date and time if "hold" */}

                  {/* Rate Plan */}
                  {/* Rate Plan */}
                  <div
                    className={`grid grid-cols-1 bg-muted/50 dark:bg-slate-900 py-2 rounded-md ${
                      reservationType === "hold"
                        ? "md:col-span-1 col-span-full"
                        : ""
                    }`}
                  >
                    <label className="text-sm font-medium block mb-1">
                      Rate Plan
                    </label>

                    {/* 4:1 layout (like Travel Agent) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-2">
                      <div className="col-span-4">
                        <Select
                          value={rateCode}
                          onValueChange={(val) => {
                            setRateCode(val);
                            setSelectedRatePlan(Number(val));

                            const selectedPlan = hotelRatePlans.find(
                              (p) => p.rateCodeID === Number(val)
                            );
                            setSelectedRatePlanDetails(selectedPlan || null);

                            // Recompute every row now that the rate plan changed
                            setRooms((prev) =>
                              prev.map((row) =>
                                recomputeRowFromPlan(row, val, hotelRatePlans)
                              )
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                hotelRatePlansLoading
                                  ? "Loading rate plans..."
                                  : hotelRatePlans.length === 0
                                  ? "No rate plans available"
                                  : "Select rate plan"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {hotelRatePlansLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading rate plans...
                              </SelectItem>
                            ) : hotelRatePlans.length === 0 ? (
                              <SelectItem value="empty" disabled>
                                No rate plans found
                              </SelectItem>
                            ) : (
                              [
                                ...new Map(
                                  hotelRatePlans
                                    .filter((plan) => plan.rateCode) // Only plans with rateCode
                                    .map((plan) => [
                                      plan.rateCodeID,
                                      <SelectItem
                                        key={plan.rateCodeID}
                                        value={String(plan.rateCodeID)}
                                      >
                                        {plan.rateCode.rateCode}
                                      </SelectItem>,
                                    ])
                                ).values(),
                              ]
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsAddRateDrawerOpen(true)}
                          aria-label="Add Rate Plan"
                          title="Add Rate Plan"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Currency */}
                  <div
                    className={`grid grid-cols-1 ${
                      reservationType === "hold"
                        ? "md:col-span-1 col-span-full"
                        : ""
                    }`}
                  >
                    <label className="text-sm font-medium block mb-1">
                      Currency
                    </label>
                    <Select
                      value={currency}
                      onValueChange={(val) => {
                        setCurrency(val);
                        resetRatesForAllRows(); // 👈 clear immediately
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="LKR" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LKR">LKR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* meal plan */}
                  <div
                    className={`grid grid-cols-1 py-2 ${
                      reservationType === "hold"
                        ? "md:col-span-1 col-span-full"
                        : ""
                    }`}
                  >
                    <Label className="text-sm font-medium block mb-1">
                      Meal Plan (BasisMas)
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        console.log("Selected meal plan ID (basisID):", value);
                        setSelectedMealPlan(value);
                        const plan = mealPlans.find(
                          (p) => p.basisID.toString() === value
                        );
                        console.log("Selected meal plan details:", plan);
                        setMealPlanName(plan?.basis || "");
                        resetRatesForAllRows(); // 👈 clear immediately
                      }}
                      value={selectedMealPlan}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Meal Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealPlans.map((plan) => (
                          <SelectItem
                            key={plan.basisID}
                            value={plan.basisID.toString()}
                          >
                            {plan.basis}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Room selection table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead colSpan={2}>Room Type</TableHead>
                      <TableHead>Room No</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Bed</TableHead>
                      <TableHead>Adult</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>FOC</TableHead>

                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell colSpan={2}>
                          <Select
                            value={row.roomType || ""}
                            onValueChange={(val) =>
                              handleRoomChange(idx, "roomType", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="-Select-">
                                {row.roomType
                                  ? fetchedroomTypes.find(
                                      (rt) =>
                                        String(rt.roomTypeID) === row.roomType
                                    )?.roomType || "-Select-"
                                  : "-Select-"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {fetchedroomTypes.map((rt) => (
                                <SelectItem
                                  key={rt.roomTypeID}
                                  value={String(rt.roomTypeID)}
                                >
                                  {rt.roomType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={row.room}
                            onValueChange={(val) =>
                              handleRoomChange(idx, "room", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="-Select-">
                                {(availableRooms.filter(Boolean) as any[]).find(
                                  (r) => String(r.roomId) === row.room
                                )?.roomNo || "-Select-"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(availableRooms.filter(Boolean) as any[])
                                .filter((r) => {
                                  const isSameType =
                                    String(r.roomTypeID) === row.roomType;
                                  const isNotAlreadySelected = !rooms.some(
                                    (otherRoom, otherIdx) =>
                                      otherIdx !== idx &&
                                      otherRoom.room === String(r.roomId)
                                  );
                                  return isSameType && isNotAlreadySelected;
                                })
                                .map((room) => (
                                  <SelectItem
                                    key={room.roomId}
                                    value={String(room.roomId)}
                                  >
                                    {room.roomNo}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={row.occupancy || ""}
                            onValueChange={(val) =>
                              handleRoomChange(idx, "occupancy", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Occupancy" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Single</SelectItem>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="triple">Triple</SelectItem>
                              <SelectItem value="quadruple">
                                Quadruple
                              </SelectItem>
                              <SelectItem value="family">Family</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Select
                            value={row.bedType || ""}
                            onValueChange={(val) =>
                              handleRoomChange(idx, "bedType", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Bed Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="double">Double</SelectItem>
                              <SelectItem value="twin">Twin</SelectItem>
                              {/* add more if you need */}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          {(() => {
                            const selectedType = roomTypes.find(
                              (rt) =>
                                String(rt.hotelRoomTypeID) === row.roomType
                            );
                            const maxAdults = selectedType?.adultSpace || 2;
                            return (
                              <Select
                                value={String(row.adult)}
                                onValueChange={(val) =>
                                  handleRoomChange(idx, "adult", parseInt(val))
                                }
                              >
                                <SelectTrigger className="w-16">
                                  <SelectValue placeholder="Adult" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from(
                                    { length: maxAdults },
                                    (_, i) => i + 1
                                  ).map((num) => (
                                    <SelectItem key={num} value={String(num)}>
                                      {num}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const selectedType = roomTypes.find(
                              (rt) =>
                                String(rt.hotelRoomTypeID) === row.roomType
                            );
                            const maxChildren = selectedType?.childSpace ?? 0;
                            return (
                              <Select
                                value={String(row.child)}
                                onValueChange={(val) =>
                                  handleRoomChange(idx, "child", parseInt(val))
                                }
                              >
                                <SelectTrigger className="w-16">
                                  <SelectValue
                                    placeholder="Child"
                                    defaultValue={
                                      row.child !== undefined
                                        ? String(row.child)
                                        : undefined
                                    }
                                  >
                                    {row.child !== undefined
                                      ? String(row.child)
                                      : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from(
                                    { length: maxChildren + 1 },
                                    (_, i) => i
                                  ).map((num) => (
                                    <SelectItem key={num} value={String(num)}>
                                      {num}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="relative w-28">
                            <Input
                              type="number"
                              step="0.01"
                              className={cn(
                                "w-28 pr-10",
                                rateLoading[idx] && "opacity-60",
                                rooms[idx]?.rateMissing &&
                                  "ring-1 ring-amber-400"
                              )}
                              value={
                                rooms[idx]?.is_foc
                                  ? "0"
                                  : String(rooms[idx]?.rate ?? "")
                              }
                              placeholder={
                                rooms[idx]?.rateMissing
                                  ? "Type rate"
                                  : undefined
                              }
                              onChange={(e) =>
                                handleRoomChange(idx, "rate", e.target.value)
                              }
                              disabled={rooms[idx]?.is_foc}
                              aria-busy={!!rateLoading[idx]}
                              aria-live="polite"
                            />
                            {rateLoading[idx] && (
                              <div className="absolute inset-y-0 right-2 flex items-center">
                                <Loader2
                                  className="h-4 w-4 animate-spin"
                                  aria-label="Calculating rate…"
                                />
                              </div>
                            )}
                          </div>
                          {/* {rooms[idx]?.rateMissing && (
                            <div className="mt-1 text-[11px] text-amber-600">
                              No rate found — enter manually
                            </div>
                          )} */}
                        </TableCell>

                        <TableCell>
                          <Checkbox
                            checked={row.is_foc}
                            onCheckedChange={(checked) =>
                              handleRoomChange(idx, "is_foc", !!checked)
                            }
                          />
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRoom(idx)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleAddRoom}
                    disabled={
                      !rooms[rooms.length - 1]?.roomType ||
                      !rooms[rooms.length - 1]?.room
                    }
                  >
                    Add Room
                  </Button>
                </div>
              </div>

              {/* Guest information section */}
              <div className="grid  grid-cols-4 gap-4 bg-muted/50 dark:bg-slate-900 py-2 rounded-md px-2 ">
                <div className="col-span-1 ">
                  <label className="text-sm font-medium block mb-1">
                    Title
                  </label>
                  <Select
                    value={walkInFormData.title}
                    onChange={(e) => setTitle(e.target.value)}
                  >
                    <SelectTrigger
                      className={`h-10 w-full border px-3 py-2 rounded-md shadow-sm `}
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Prof">Prof</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-3">
                  <label className="text-sm font-medium block mb-1">
                    Guest Name
                  </label>
                  <Input
                    type="text"
                    value={guestName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setGuestName(v);
                      setShowNameSuggestions(v.trim().length >= MIN_NAME_CHARS);
                    }}
                    placeholder="Enter guest name"
                    required
                  />

                  {showNameSuggestions &&
                    guestName.trim().length >= MIN_NAME_CHARS &&
                    filteredNameSuggestions.length > 0 && (
                      <SuggestionTable
                        guests={filteredNameSuggestions}
                        onSelect={(guest) => {
                          setGuestName(guest.guestName || "");
                          setGuestEmail(guest.email || "");
                          setMobile(guest.phone || "");
                          setGuestPassport(guest.ppNo || "");
                          setSelectedGuestProfileId(
                            guest.guestProfileId ?? null
                          );
                          setRepeatGuest(true);
                          setShowNameSuggestions(false);
                        }}
                      />
                    )}
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Mobile
                  </label>
                  <Input
                    placeholder="Mobile"
                    value={mobile}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMobile(v);
                      setShowPhoneSuggestions(
                        v.trim().length >= MIN_NAME_CHARS
                      );
                    }}
                  />
                  {showPhoneSuggestions &&
                    mobile.trim().length >= MIN_NAME_CHARS &&
                    filteredPhoneSuggestions.length > 0 && (
                      <ul className="suggestions">
                        {filteredPhoneSuggestions.map((guest) => (
                          <li
                            key={guest.guestProfileId}
                            onClick={() => {
                              setMobile(guest.phone || "");
                              setGuestName(guest.guestName || "");
                              setGuestEmail(guest.email || "");
                              setGuestPassport(guest.ppNo || "");
                              setSelectedGuestProfileId(
                                guest.guestProfileId ?? null
                              );
                              setRepeatGuest(true);
                              setShowPhoneSuggestions(false);
                            }}
                          >
                            {guest.phone}
                            {guest.guestName ? ` — ${guest.guestName}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => {
                      const v = e.target.value;
                      setGuestEmail(v);
                      setShowEmailSuggestions(
                        v.trim().length >= MIN_NAME_CHARS
                      );
                    }}
                    placeholder="Enter guest email"
                  />
                  {showEmailSuggestions &&
                    guestEmail.trim().length >= MIN_NAME_CHARS &&
                    filteredEmailSuggestions.length > 0 && (
                      <ul className="suggestions">
                        {filteredEmailSuggestions.map((guest) => (
                          <li
                            key={guest.guestProfileId}
                            onClick={() => {
                              setGuestEmail(guest.email || "");
                              setGuestName(guest.guestName || "");
                              setMobile(guest.phone || "");
                              setGuestPassport(guest.ppNo || "");
                              setSelectedGuestProfileId(
                                guest.guestProfileId ?? null
                              );
                              setRepeatGuest(true);
                              setShowEmailSuggestions(false);
                            }}
                          >
                            {guest.email}
                          </li>
                        ))}
                      </ul>
                    )}
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">
                    Country
                  </label>
                  <Select
                    value={walkInFormData.nationality}
                    onValueChange={(value) => {
                      setWalkInFormData((prev) => ({
                        ...prev,
                        nationality: value,
                      }));
                      setSelectedCountry(value); // Also update selectedCountry
                    }}
                  >
                    <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {(countries.length > 0
                        ? countries
                        : fallbackCountries
                      ).map((country, idx) => (
                        <SelectItem key={idx} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="px-2">
                <label className="text-sm font-medium block mb-1">
                  Additional Notes
                </label>
                <Textarea
                  placeholder="Add any remarks..."
                  className="min-h-[80px] resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </form>
          </ScrollArea>

          <div className="pt-2 flex justify-between w-full border-t">
            <div className="flex items-center space-x-2">
              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="checkedIn"
                  checked={isCheckedIn}
                  disabled={
                    !isSameDay(
                      checkInDate ?? new Date(systemDate),
                      new Date(systemDate)
                    )
                  }
                  onCheckedChange={(checked) => setIsCheckedIn(!!checked)}
                />
                <Label htmlFor="checkedIn" className="text-sm">
                  Check-in{" "}
                  {!isSameDay(
                    checkInDate ?? new Date(systemDate),
                    new Date(systemDate)
                  ) && (
                    <span className="text-xs text-muted-foreground">
                      (only available for today check-in)
                    </span>
                  )}
                </Label>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleSubmit}
              className="px-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Reserving..." : "Reserve"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {showRawOverlay && (
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center"
          style={{ pointerEvents: "auto" }}
        >
          <div className="relative w-[90%] max-w-4xl bg-white rounded-xl shadow-lg p-4">
            <button
              onClick={() => {
                setShowRawOverlay(false);
                onOpenChange(true);
              }}
              className="absolute top-2 right-2 text-gray-600 hover:text-black text-2xl"
            >
              ✕
            </button>
            <div className="aspect-w-16 aspect-video w-full">
              <iframe
                className="w-full h-full rounded"
                src="https://scribehow.com/embed/How_To_Complete_Guest_Check-In_Process__PWh6uoISToyWmZ_QKri7rA?as=video"
                title="YouTube video"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
      {/* <AddTravelAgentDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onCreated={(agent) => {
          // Select the newly created agent by ID
          setSelectedTravelAgent(String(agent.nameID || ""));

          // Refresh list so it appears in the options (no page reload)
          dispatch(fetchNameMas({ nameType: "customer" }));
        }}
      /> */}
      <AddRateDrawer
        isOpen={isAddRateDrawerOpen}
        onClose={() => setIsAddRateDrawerOpen(false)}
        onCreated={async (newRate) => {
          // Optimistically add to local lists so it appears immediately
          if (newRate?.rateCodeID && newRate?.rateCode) {
            setRateCodes((prev) => {
              const exists = prev.some(
                (r) => r.rateCodeID === newRate.rateCodeID
              );
              return exists ? prev : [...prev, { ...newRate }];
            });
          }

          // Refresh Hotel Rate Plans so mapping (rateCodeID -> hotelRatePlanID) is up-to-date
          const selectedProperty = JSON.parse(
            localStorage.getItem("selectedProperty") || "{}"
          );
          const hotelId = selectedProperty?.id;
          if (hotelId) {
            dispatch(fetchHotelRatePlans({ hotelId }));
          }

          // Auto-select the newly created rate plan if we have the ID
          if (newRate?.rateCodeID) {
            const idStr = String(newRate.rateCodeID);
            setRateCode(idStr);

            // re-align rows to this plan
            setRooms((prev) =>
              prev.map((row) =>
                recomputeRowFromPlan(row, idStr, hotelRatePlans)
              )
            );
          }

          setIsAddRateDrawerOpen(false);
        }}
      />
    </>
  );
}

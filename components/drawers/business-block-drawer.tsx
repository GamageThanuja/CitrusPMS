"use client";

import { useState, useEffect, useMemo } from "react";
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

import {
  checkInReservationDetail,
  createBookingViaFeed,
} from "@/controllers/reservationController";
import { createGuestProfile } from "@/controllers/guestProfileMasterController";
import { getHotelRatePlans } from "@/controllers/hotelRatePlanController";
import { getHotelRoomTypes } from "@/controllers/hotelRoomTypeController";
import { RateCode } from "@/types/rateCode";
import { HotelRatePlan } from "@/types/hotelRatePlan";
import { HotelRoomNumber } from "@/types/hotelRoomNumber";
import { HotelRoomType } from "@/types/hotelRoomType";
import { useDispatch, useSelector } from "react-redux";
import { fetchAvailableRooms } from "@/redux/slices/availableRoomsSlice"; // adjust path
import { AppDispatch, RootState } from "@/redux/store";
import { getAllCountries } from "@/controllers/AllCountriesController";
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
import { checkInReservation } from "@/redux/slices/checkInSlice";
import { fetchReservationById } from "@/redux/slices/reservationSlice";
import { toast } from "sonner";
import { fetchHotelRoomTypes } from "@/redux/slices/hotelRoomTypesSlice";
import { log } from "node:console";
import { useAppSelector } from "@/redux/hooks";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { fetchGuestProfiles } from "@/redux/slices/fetchGuestProfileSlice";
import { set } from "lodash";
import { getNameMasters } from "@/controllers/nameMasterController";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { fetchMealPlans } from "@/redux/slices/mealPlanSlice";
import { fetchNameMasterByHotel } from "@/redux/slices/nameMasterSlice";
// import { AddTravelAgentDrawer } from "./add-travel-agent-drawer";
import {
  fetchCalculatedRate,
  selectCalculatedRate,
  selectCalculatedRateLoading,
  selectCalculatedRateError,
} from "@/redux/slices/calculateRateSlice";
import { nanoid } from "nanoid";
import { sendCustomEmail } from "@/redux/slices/emailSendSlice";
import { createBusinessBlock } from "@/redux/slices/createBusinessBlockSlice";

type BusinessBlockDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (createdReservationId?: number) => void;
};

type TravelAgent = { nameID: string; name: string };
interface NameMasterPayload {
  nameID: number;
  name: string;
}

export default function BusinessBlockDrawer({
  open,
  onOpenChange,
  onCreated,
  onClose,
}: BusinessBlockDrawerProps) {
  // Initial walk-in form state for reset
  const dispatch = useDispatch();
  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );
  const systemDateLoading = useAppSelector(
    (state: RootState) => state.systemDate.status === "loading"
  );
  const [showRawOverlay, setShowRawOverlay] = useState(false);

  const ymdLocal = (d?: Date | string) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return format(date, "yyyy-MM-dd");
  };

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

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

    // rateIsManual: false, // legacy (kept for compatibility)
    // autoRate: true,

    daysMap: {} as Record<string, number>,
    childDaysMap: {} as Record<string, number>,
    childRateAvg: 0,
    childRateTotal: 0,
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
    checkInDate: new Date(systemDate).toISOString().split("T")[0],
    checkOutDate: addDays(new Date(systemDate), 1).toISOString().split("T")[0],
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
  const { fullName } = useUserFromLocalStorage();
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
  const [selectOccupancy, setSelectOccupancy] = useState("");
  const [selectBed, setSelectBed] = useState("");

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

  const [groupName, setGroupName] = useState("");
  const [tourNo, setTourNo] = useState("");

  const [travelAgents, setTravelAgents] = useState<TravelAgent[]>([]);

  const { data } = useSelector((state) => state.nameMaster);

  console.log("data : ", data);

  useEffect(() => {
    dispatch(fetchNameMasterByHotel());
  }, [dispatch]);

  const travelAgentOptions = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
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
  }, [data]);

  const [selectedRatePlan, setSelectedRatePlan] = useState<number | null>(null);
  // Store selected rate plan details
  const [selectedRatePlanDetails, setSelectedRatePlanDetails] =
    useState<HotelRatePlan | null>(null);
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

  // Hotel rate plans state
  const [hotelRatePlans, setHotelRatePlans] = useState<HotelRatePlan[]>([]);
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
  const {
    data: fetchedroomTypes,
    loading,
    error,
  } = useSelector((state: RootState) => state.hotelRoomTypes);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string>("");
  const [mealPlanName, setMealPlanName] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  console.log("hotelRatePlans aaaaa ⚽️⚽️⚽️ :", hotelRatePlans);

  console.log("checked in clicked:", isCheckedIn);

  console.log("checked in clicked:", isCheckedIn);

  useEffect(() => {
    dispatch(fetchHotelRoomTypes());
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

  const { data: hotelGuestProfile } = useSelector(
    (state: RootState) => state.hotelGuestProfile
  );

  useEffect(() => {
    dispatch(fetchMealPlans());
  }, [dispatch]);

  const { data: mealPlans } = useAppSelector((state) => state.mealPlan);

  console.log("mealPlans : ", mealPlans);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [repeatGuest, setRepeatGuest] = useState(false);
  const [selectedGuestProfileId, setSelectedGuestProfileId] = useState<
    number | null
  >(null);

  useEffect(() => {
    dispatch(fetchGuestProfiles());
  }, [dispatch]);

  const filteredNameSuggestions = hotelGuestProfile.filter((guest) =>
    guest.guestName.toLowerCase().includes(guestName.toLowerCase())
  );

  const filteredEmailSuggestions = hotelGuestProfile.filter((guest) =>
    guest.email?.toLowerCase().includes(guestEmail.toLowerCase())
  );

  const handleEmailSelect = (email: string) => {
    setGuestEmail(email);
    const matchedGuest = hotelGuestProfile.find((g) => g.email === email);
    setGuestName(matchedGuest?.guestName || "");
    setMobile(matchedGuest?.phone || "");
    setGuestPassport(matchedGuest?.ppNo || "");
    setSelectedGuestProfileId(matchedGuest?.guestProfileId ?? null); // 👈
    setRepeatGuest(!!matchedGuest); // 👈
  };

  useEffect(() => {
    const fetchRatePlans = async () => {
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
        setHotelRatePlans(plans);
      } catch (err) {
        console.error("Failed to fetch hotel rate plans", err);
      }
    };
    fetchRatePlans();
  }, []);

  // Fetch hotel room numbers on mount
  useEffect(() => {
    const fetchRoomNumbers = async () => {
      try {
        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const selectedProperty = JSON.parse(
          localStorage.getItem("selectedProperty") || "{}"
        );
        const response = await getHotelRoomNumbersByHotelId({
          token: tokens.accessToken,
          hotelId: selectedProperty.id,
        });
        setRoomNumbers(response);
      } catch (err) {
        console.error("Failed to fetch room numbers", err);
      }
    };
    fetchRoomNumbers();
  }, []);

  // Fetch hotel room types on mount
  useEffect(() => {
    const fetchRoomTypes = async () => {
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
        setRoomTypes(types);
      } catch (err) {
        console.error("Failed to fetch room types", err);
      }
    };
    fetchRoomTypes();
  }, []);

  // Fetch rate codes on mount
  useEffect(() => {
    const fetchRateCodes = async () => {
      try {
        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const codes = await getRateCodes({ token: tokens.accessToken });
        setRateCodes(codes);
      } catch (err) {
        console.error("Failed to fetch rate codes", err);
      }
    };
    fetchRateCodes();
  }, []);

  console.log("Travel Agent : ", selectedTravelAgent);

  const validateForm = () => {
    if (!selectedTravelAgent) {
      toast.error("Travel Agent is required", {
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
          if (field === "roomType") next.room = ""; // keep your current behavior
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

  const anySubDrawerOpen = isAddDrawerOpen;

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setAddRoomDialogOpen(false);

    // --- BEGIN booking POST logic ---
    // 1. Retrieve hotelId from localStorage
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = selectedProperty?.id;
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const accessToken = tokens?.accessToken;
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
    if (!repeatGuest && !selectedGuestProfileId) {
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
        const guestData = await createGuestProfile({
          token: accessToken,
          payload: guestProfilePayload,
        });
        console.log("Guest profile created:", guestData);
        guestProfileId = guestData?.profileId;
        if (!guestProfileId) {
          console.error("Guest Profile ID not found in response");
          return;
        }
      } catch (error) {
        console.error("Failed to create guest profile", error);
        return;
      }
    }
    // --- END guest profile POST ---

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
            guest_profile_id: guestProfileId || 0,
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
              name: selectedTravelAgent || "",
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

                guest_profile_id: guestProfileId || 0,
                ota_commission: "0",
                guests: [],
                occupancy: {
                  children: Number(uiRow.child || 0),
                  adults: Number(uiRow.adult || 1),
                  ages: [],
                  infants: 0,
                },

                // IDs – use what the UI row captured; fall back to finalRooms when useful
                rate_plan_id: String(uiRow.ratePlanId || "0"),
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
          type: "BUSINESS_BLOCK",
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

    console.log(
      "Booking Payload 🏀🏀🏀:",
      JSON.stringify(bookingPayload, null, 2)
    );
    console.log("hotelRatePlans aaaaaabbb 🏨🏨🏨🏨🏨🏨🏨🏨🏨:", testState);

    // Log the matched rate plan and rate code ID
    const selectedRatePlan = hotelRatePlans.find(
      (plan) => plan.hotelRatePlanID.toString() === walkInFormData.rateType
    );
    console.log("Selected Rate Plan:", selectedRatePlan);
    console.log("Rate Code ID:", selectedRatePlan?.rateCodeID);

    // Log the payload exactly as it will be sent
    console.log(
      "Booking Payload in the Quick Reservation drawer:",
      bookingPayload
    );

    try {
      // 🔁 POST via slice
      const result = await dispatch(
        createBusinessBlock({ body: bookingPayload, isDebug: false })
      ).unwrap();

      console.log("Booking creation result:", result);

      if (result?.success) {
        const reservationID = result.reservationID;

        // ✅ fetch full reservation
        const reservationResult = await dispatch(
          fetchReservationById(reservationID)
        );

        if (fetchReservationById.fulfilled.match(reservationResult)) {
          const reservationData = reservationResult.payload;
          const rooms = reservationData.rooms || [];
          const guestProfileId = reservationData.guestProfileId;

          // ✅ loop through rooms and check-in if toggled
          for (const room of rooms) {
            const reservationDetailID = room.reservationDetailID;
            const reservationStatusId =
              room.reservationStatusMaster?.reservationStatusID;

            if (!reservationDetailID || !reservationStatusId || !guestProfileId)
              continue;

            if (isCheckedIn) {
              const checkInPayload = {
                reservationDetailId: reservationDetailID,
                reservationStatusId: 4,
                checkINat: new Date(systemDate).toISOString(),
                checkedInBy: "System",
                guestProfileId,
                isRepeatGuest: false,
              };

              const checkInResult = await dispatch(
                checkInReservation({
                  reservationDetailId: reservationDetailID,
                  payload: checkInPayload,
                })
              );

              if (!checkInReservation.fulfilled.match(checkInResult)) {
                console.error(
                  "❌ Check-in failed for Room ID:",
                  reservationDetailID,
                  checkInResult.payload
                );
              }
            }
          }

          // (your email sending and form reset code stays the same)
          onCreated?.(reservationID);
          // ... reset UI state
          onOpenChange(false);
        } else {
          console.error(
            "❌ Failed to fetch reservation by ID:",
            reservationResult.payload
          );
          toast.error("Failed to fetch reservation details.");
        }
      } else {
        console.error("❌ Booking creation failed:", result?.message);
        toast.error(result?.message || "Booking failed");
      }
    } catch (error: any) {
      console.error("❌ Unexpected error during booking or check-in:", error);
      toast.error(
        error?.message || "Something went wrong while creating the booking."
      );
    } finally {
      setIsSubmitting(false);
    }

    //window.location.reload();
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

  const { data: availableRooms, loading: availableLoading } = useSelector(
    (state: RootState) => state.availableRooms
  );

  const getLS = (k: string) =>
    (typeof window !== "undefined" && localStorage.getItem(k)) || "";

  const recipientEmail = () =>
    (getLS("email") || getLS("rememberedEmail") || guestEmail || "").trim();

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

  console.log("Available Rooms.⚽⚽⚽⚽ :", availableRooms);
  console.log("Fetched Room Types:🎾🎾🎾", fetchedroomTypes);

  useEffect(() => {
    rooms.forEach((room, idx) => {
      if (room.roomType && checkInDate && checkOutDate) {
        dispatch(
          fetchAvailableRooms({
            hotelRoomTypeId: parseInt(room.roomType),
            checkInDate: checkInDate.toISOString().split("T")[0],
            checkOutDate: checkOutDate.toISOString().split("T")[0],
          }) as any
        );
      }
    });
  }, [
    rooms.map((r) => r.roomType).join(","),
    checkInDate?.toISOString(),
    checkOutDate?.toISOString(),
  ]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        // Get countries from API
        const data = await getAllCountries();

        // Check if we received valid countries data
        if (Array.isArray(data) && data.length > 0) {
          // Map the API response to the format expected by the component
          const formattedCountries = data.map((country) => ({
            name: country.country,
            code: country.flagCode,
            phoneCode: country.dialCode,
            currency: "", // Currency not provided in this API
          }));
          setCountries(formattedCountries);
        } else {
          // Use fallback countries if response is empty
          setCountries(fallbackCountries);
        }
      } catch (error) {
        console.error("Failed to fetch countries", error);
        // Use fallback countries on error
        setCountries(fallbackCountries);
      }
    };

    fetchCountries();
  }, []);

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
    };

    // Never calculate price here; only enforce FOC
    if (row.is_foc) next.rate = 0;

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

      const res = await (
        dispatch(
          fetchCalculatedRate({
            ratePlanId: Number(ratePlanId),
            currencyCode: String(currency || "LKR"),
            mealPlanId: Number(selectedMealPlan || 0),
            roomTypeId: Number(row.roomType),
            startDate: toApiDateTime(checkInDate),
            endDate: toApiDateTime(checkOutDate),
            paxCount: Number(row.adult || 1),
            childPaxCount: Number(row.child || 0),
            childAges: [],
          })
        ) as any
      ).unwrap();

      const daily = Array.isArray(res?.dailyRates) ? res.dailyRates : [];

      // Build required local date keys (CI..CO-1)
      const requiredDates: string[] = [];
      {
        const n = differenceInDays(checkOutDate, checkInDate);
        for (let i = 0; i < Math.max(0, n); i++) {
          requiredDates.push(ymdLocal(addDays(checkInDate, i)));
        }
      }

      // --- Adult + Child maps we will fill ---
      const childDaysMap: Record<string, number> = {};
      const combinedDaysMap: Record<string, number> = {};

      // 1) Seed from API dailyRates (these are usually adult-only)
      for (const d of daily) {
        const date = String(d.date); // "YYYY-MM-DD"
        const adultRate = Number(d.rate ?? d.adultRate ?? 0);

        // child might be absent in API dailyRates → default to 0 for now
        const perChild = Number(d.childRate ?? d.child_rate ?? d.child ?? 0);
        const childTotalFromAPI = Number(d.childTotal ?? d.child_amount ?? 0);
        const childRateForDay =
          childTotalFromAPI > 0
            ? childTotalFromAPI
            : perChild * Number(row.child || 0);

        childDaysMap[date] = childRateForDay;
        combinedDaysMap[date] =
          (row.is_foc ? 0 : adultRate) + (row.is_foc ? 0 : childRateForDay);
      }

      // 2) Fallback to the *plan's* hotelRates to rebuild adult+child when missing
      //    (this is the key fix)
      const hotelRatesFromPlan: any[] = Array.isArray(plan?.hotelRates)
        ? plan!.hotelRates
        : [];
      const hotelRateByDate = new Map<string, any>(
        hotelRatesFromPlan.map((r: any) => [String(r.rateDate), r])
      );

      const computePerDayFromHotelRates = (
        dateStr: string,
        adults: number,
        children: number
      ) => {
        const rec = hotelRateByDate.get(dateStr);
        if (!rec) return 0;

        // Adult part
        let adultAmount = 0;
        const sellMode = String(rec.sellMode || "").toLowerCase();
        if (sellMode === "per person") {
          const capped = Math.min(Math.max(Number(adults) || 1, 1), 18); // pax1..pax18
          const col = `pax${capped}`;
          adultAmount = Number(rec[col] ?? rec.defaultRate ?? 0);
        } else {
          // Per Room (or unknown)
          adultAmount = Number(rec.defaultRate ?? 0);
        }

        // Child part (per child, per day)
        const perChild = Number(rec.child ?? 0);
        const childTotal = perChild * (Number(children) || 0);

        return adultAmount + childTotal;
      };

      for (const dateStr of requiredDates) {
        const hasCombined = Object.prototype.hasOwnProperty.call(
          combinedDaysMap,
          dateStr
        );
        const currentChild = Number(childDaysMap[dateStr] ?? 0);
        const childrenCount = Number(row.child || 0);

        // If the API didn't give child or the date is missing, rebuild from plan.hotelRates
        if (!hasCombined || (childrenCount > 0 && currentChild === 0)) {
          const rebuiltTotal = computePerDayFromHotelRates(
            dateStr,
            Number(row.adult || 1),
            childrenCount
          );
          if (rebuiltTotal > 0) {
            const rec = hotelRateByDate.get(dateStr);
            const rebuiltChildren = Number(rec?.child ?? 0) * childrenCount;

            childDaysMap[dateStr] = rebuiltChildren;
            combinedDaysMap[dateStr] = row.is_foc ? 0 : rebuiltTotal;
          }
        }
      }

      // Totals/Averages
      const combinedTotal = Object.values(combinedDaysMap).reduce(
        (s, v) => s + Number(v || 0),
        0
      );
      const nights = requiredDates.length || 1;
      const combinedAvg = nights > 0 ? combinedTotal / nights : 0;

      const computedChildTotal = Object.values(childDaysMap).reduce(
        (s, v) => s + Number(v || 0),
        0
      );
      const computedChildAvg = nights > 0 ? computedChildTotal / nights : 0;

      // Update state
      setRoomQuotes((prev) =>
        prev.map((q, i) =>
          i === idx
            ? {
                averageRate: row.is_foc ? 0 : combinedAvg,
                totalRate: row.is_foc ? 0 : combinedTotal,
                daysMap: combinedDaysMap,
              }
            : q
        )
      );

      setRooms((prev) =>
        prev.map((r, i) =>
          i === idx
            ? {
                ...r,
                rate: r.userEditedRate ? r.rate : r.is_foc ? 0 : combinedAvg,
                ratePlanId: String(ratePlanId),
                rateCodeId: String(rateCode || r.rateCodeId || ""),
                daysMap: combinedDaysMap, // adult + child per day
                childDaysMap, // child-only per day
                childRateAvg: computedChildAvg,
                childRateTotal: computedChildTotal,
              }
            : r
        )
      );
    } catch (e) {
      console.error("Calculated rate fetch failed:", e);
    } finally {
      setRateLoading((p) => ({ ...p, [idx]: false }));
    }
  };

  useEffect(() => {
    rooms.forEach((row, idx) => {
      const ready =
        row.roomType && rateCode && checkInDate && checkOutDate && !row.is_foc; // don’t calc for FOC

      if (ready) updateRoomRateFromAPI(idx);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    rateCode,
    currency,
    selectedMealPlan,
    checkInDate,
    checkOutDate,
    // recalc if a driver changes on any row
    rooms
      .map(
        (r) =>
          `${r.roomType}:${r.adult}:${r.child}:${r.is_foc}:${
            r.userEditedRate ? 1 : 0
          }`
      )
      .join("|"),
  ]);

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

  const filteredPhoneSuggestions = hotelGuestProfile.filter((guest) =>
    guest.phone?.toLowerCase().includes(mobile.toLowerCase())
  );

  const filteredPassportSuggestions = hotelGuestProfile.filter((guest) =>
    guest.ppNo?.toLowerCase().includes(guestPassport.toLowerCase())
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={[
            `w-full sm:max-w-4xl overflow-x-hidden overflow-y-auto rounded-l-2xl  ${
              anySubDrawerOpen ? "-translate-x-[100%]" : "translate-x-0"
            }`,
            isFullscreen
              ? "fixed inset-0 md:max-w-[85vw] lg:max-w-[100vw] w-full max-w-none rounded-none"
              : "w-full sm:max-w-[96vw] md:max-w-[90vw] lg:max-w-[50vw] rounded-l-2xl",
          ]}
        >
          <SheetHeader className="flex-shrink-0 space-y-2 pb-4 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>Business Block</SheetTitle>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 bg-muted/50 dark:bg-slate-900 py-2 rounded-md  px-2">
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
                            value={releaseDate}
                            onChange={(e) =>
                              setReleaseDate(new Date(e.target.value))
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
                          new Date(systemDate).toISOString().split("T")[0]
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

                  <div className="flex-1">
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
                            : new Date(systemDate).toISOString().split("T")[0]
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
                {/* Room selection table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead colSpan={2}>Room Type</TableHead>
                      <TableHead>Room No</TableHead>

                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell colSpan={2}>
                          <Select
                            value={row.roomType}
                            onValueChange={(val) =>
                              handleRoomChange(idx, "roomType", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="-Select-" />
                            </SelectTrigger>
                            <SelectContent>
                              {fetchedroomTypes.map((rt) => (
                                <SelectItem
                                  key={rt.hotelRoomTypeID}
                                  value={String(rt.hotelRoomTypeID)}
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
                                {(
                                  availableRooms.flat().filter(Boolean) as any[]
                                ).find((r) => String(r.roomId) === row.room)
                                  ?.roomNo || "-Select-"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(availableRooms.flat().filter(Boolean) as any[])
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

              <div className="">
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

          <div className="pt-2 flex justify-end w-full border-t">
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
          className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center px-2"
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
          dispatch(fetchNameMasterByHotel());
        }}
      /> */}
    </>
  );
}

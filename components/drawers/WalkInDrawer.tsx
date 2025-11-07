"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  MailIcon,
  Phone,
  DollarSign,
  Percent,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Flag,
  Bookmark,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addDays } from "date-fns";
import { useTranslatedText } from "@/lib/translation";
import { differenceInDays } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { fetchMealPlans } from "@/redux/slices/mealPlanSlice";
import { getAllCountries } from "@/controllers/AllCountriesController";
import { getNameMasters } from "@/controllers/nameMasterController";
import { NameMasterPayload } from "@/types/nameMaster";
import { createBookingViaFeed } from "@/controllers/reservationController";
import { useAppDispatch } from "@/redux/hooks";
import { fetchAvailableRooms } from "@/redux/slices/availableRoomsSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type WalkInDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Optionally accept a setter for check-in guest profile data
  setGuestProfileForCheckIn?: (profile: GuestProfileForCheckInType) => void;
};

type GuestProfileForCheckInType = {
  title: string;
  guestName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
};

export default function WalkInDrawer({
  open,
  onOpenChange,
  setGuestProfileForCheckIn,
}: WalkInDrawerProps) {
  // Walk‑in form state

  // Fallback list used if the external countries API is unreachable
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

  type Room = {
    roomType: string;
    roomNumber: string;
    rateAmount: string;
    netRate: string;
    rateType: string;
    rateCodeId: number;
    discount?: string;
    discountType?: string;
    supplement?: string;
    extra?: string;
    adults?: string;
    children?: string;
  };

  const initialWalkInFormData = {
    // Guest Details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idType: "passport",
    idNumber: "",
    address: "",
    country: "",
    sourceOfBooking: "FIT",
    title: "",
    dob: "",
    city: "",
    zipCode: "",
    nationality: "",
    // Booking Information
    checkInDate: format(new Date(), "yyyy-MM-dd"),
    checkOutDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    adults: "1",
    children: "0",
    specialRequests: "",
    travelAgent: "FIT",
    currency: "",
    nights: "",
    bookingReffarance: "",
    mealPlan: "",
    arrivalTime: "",
    departureTime: "",
    // Room Details
    roomType: "",
    roomNumber: "",
    rateType: "",
    rateAmount: "",
    extra: "",
    discount: "",
    discountType: "value",
    netRate: "",
    supplement: "",
    isFOC: false,
    isDayRoom: false,
    selectedRooms: [] as Room[],
  };

  const [walkInStep, setWalkInStep] = useState(1);
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
  const [walkInFormData, setWalkInFormData] = useState(initialWalkInFormData);

  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [roomNumbers, setRoomNumbers] = useState<any[]>([]);
  const [ratePlans, setRatePlans] = useState<any[]>([]);
  // Countries state
  const [countries, setCountries] = useState<any[]>([]);
  // Travel Agents state
  const [travelAgents, setTravelAgents] = useState<any[]>([]);

  console.log("room type", roomTypes);

  console.log("form data :", walkInFormData);

  const dispatch = useAppDispatch();
  const mealPlans = useSelector((state: RootState) => state.mealPlan.data);

  useEffect(() => {
    dispatch(fetchMealPlans());
  }, [dispatch]);

  // Fetch travel agents for the current hotel (match by hotelID or hotelCode)
  useEffect(() => {
    const fetchTravelAgents = async () => {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;
      if (!accessToken) return;

      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelId = selectedProperty?.id;
      const hotelCode = selectedProperty?.hotelCode;
      if (!hotelId && !hotelCode) return;

      try {
        const data = await getNameMasters({ token: accessToken });

        // Filter agents: nameType === 'Customer' and belonging to this property
        const filtered = (Array.isArray(data) ? data : []).filter(
          (ag) =>
            ag.nameType === "Customer" &&
            (String(ag.hotelID) === String(hotelId) ||
              String(ag.hotelCode) === String(hotelCode))
        );

        // Deduplicate by agent name (ignore whitespace & case)
        const unique = new Map<string, NameMasterPayload>();
        for (const ag of filtered) {
          const key = (ag.name ?? "").replace(/\s+/g, "").toLowerCase();
          if (!unique.has(key)) unique.set(key, ag);
        }

        setTravelAgents(Array.from(unique.values()));
      } catch (err) {
        console.error("Failed to fetch travel agents", err);
        // Set a default FIT agent if we failed to fetch
        setTravelAgents([
          {
            nameID: 0,
            hotelID: Number(hotelId) || null,
            code: "FIT",
            name: "FIT",
            nameType: "Customer",
            taType: "FIT",
            finAct: false,
            createdBy: "",
            createdOn: new Date().toISOString(),
            updatedOn: null,
            updatedBy: null,
            hotelCode: Number(hotelCode) || 0,
            tranCode: "FIT",
          },
        ]);
      }
    };

    fetchTravelAgents();
  }, []);

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

  useEffect(() => {
    const fetchRatePlans = async () => {
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelId = selectedProperty?.id;
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;
      if (!hotelId || !accessToken) return;
      try {
        const response = await fetch(
          `${BASE_URL}/api/HotelRatePlans/hotel/${hotelId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const data = await response.json();
        console.log("Rate Plans API Response:", data);
        const result = Array.isArray(data) ? data : data?.data || [];
        setRatePlans(result);
      } catch (error) {
        console.error("Failed to fetch rate plans", error);
      }
    };
    fetchRatePlans();
  }, []);
  useEffect(() => {
    if (walkInFormData.rateType) {
      const selectedPlan = ratePlans.find(
        (plan) => plan.hotelRatePlanID.toString() === walkInFormData.rateType
      );
      if (selectedPlan) {
        setWalkInFormData((prev) => ({
          ...prev,
          rateAmount: selectedPlan.defaultRate?.toString() ?? "",
        }));
      }
    }
  }, [walkInFormData.rateType, ratePlans]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelId = selectedProperty?.id;
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;

      if (!hotelId || !accessToken) return;

      try {
        const response = await fetch(
          `${BASE_URL}/api/HotelRoomType/hotel/${hotelId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        console.log("Room Types API Response:", data);
        const result = Array.isArray(data) ? data : data?.data || [];
        setRoomTypes(result.filter((rt: any) => rt.roomType));
      } catch (error) {
        console.error("Failed to fetch room types", error);
      }
    };

    fetchRoomTypes();
  }, []);

  useEffect(() => {
    const fetchRoomNumbers = async () => {
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelId = selectedProperty?.id;
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;
      if (!hotelId || !accessToken) return;
      try {
        const response = await fetch(
          `${BASE_URL}/api/HotelRoomNumber/hotel-id/${hotelId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const data = await response.json();
        console.log("Room Numbers API Response:", data);
        const result = Array.isArray(data) ? data : data?.data || [];
        setRoomNumbers(result);
      } catch (error) {
        console.error("Failed to fetch room numbers", error);
      }
    };
    fetchRoomNumbers();
  }, []);

  const availableRooms = useSelector(
    (state: RootState) => state.availableRooms.data
  );

  useEffect(() => {
    if (
      walkInFormData.roomType &&
      walkInFormData.checkInDate &&
      walkInFormData.checkOutDate
    ) {
      dispatch(
        fetchAvailableRooms({
          hotelRoomTypeId: parseInt(walkInFormData.roomType),
          checkInDate: walkInFormData.checkInDate,
          checkOutDate: walkInFormData.checkOutDate,
        }) as any
      );
    }
  }, [
    walkInFormData.roomType,
    walkInFormData.checkInDate,
    walkInFormData.checkOutDate,
  ]);

  // Translations
  const guestDetails = useTranslatedText("Guest Details");
  const bookingInformation = useTranslatedText("Guest and Booking Information");
  const roomDetails = useTranslatedText("Room Details");
  const firstNameTrans = useTranslatedText("First Name");
  const lastNameTrans = useTranslatedText("Last Name");
  const emailTrans = useTranslatedText("Email");
  const phoneTrans = useTranslatedText("Phone");
  const nationalityTrans = useTranslatedText("Nationality");
  const bookingReffaraceTrans = useTranslatedText("Booking Reffarace");
  const idTypeTrans = useTranslatedText("ID Type");
  const selectIdTypeTrans = useTranslatedText("Select ID Type");
  const passportTrans = useTranslatedText("Passport");
  const driversLicenseTrans = useTranslatedText("Driver's License");
  const nationalIdTrans = useTranslatedText("National ID");
  const otherTrans = useTranslatedText("Other");
  const idNumberTrans = useTranslatedText("ID Number");
  const checkInDateTrans = useTranslatedText("Check-in");
  const checkOutDateTrans = useTranslatedText("Check-out");
  const adultsTrans = useTranslatedText("Adults");
  const childrenTrans = useTranslatedText("Children");
  const specialRequestsTrans = useTranslatedText("Special Requests");
  const anySpecialRequestsTrans = useTranslatedText(
    "Any special requests or notes"
  );
  const earlyCheckInTrans = useTranslatedText("Early Check-in");
  const lateCheckOutTrans = useTranslatedText("Late Check-out");
  const roomTypeTrans = useTranslatedText("Room Type");
  const selectRoomTypeTrans = useTranslatedText("Select Room Type");
  const roomNumberTrans = useTranslatedText("Room Number");
  const selectRoomNumberTrans = useTranslatedText("Select Room Number");
  const ratePlanTrans = useTranslatedText("Rate Plan");
  const selectRateTypeTrans = useTranslatedText("Select Rate Type");
  const standardTrans = useTranslatedText("Standard");
  const corporateTrans = useTranslatedText("Corporate");
  const promotionalTrans = useTranslatedText("Promotional");
  const packageTrans = useTranslatedText("Package");
  const rateAmountTrans = useTranslatedText("Rate Amount");
  const selectedRoomsTrans = useTranslatedText("Selected Rooms");
  const perNightTrans = useTranslatedText("per night");
  const clearTrans = useTranslatedText("Clear");
  const nextTrans = useTranslatedText("Next");
  const addRoomTrans = useTranslatedText("Add Room");
  const addAnotherRoomTrans = useTranslatedText("Add Another Room?");
  const wouldYouLikeTrans = useTranslatedText(
    "Would you like to add another room to this booking?"
  );
  const noCompleteBookingTrans = useTranslatedText("No, Complete Booking");
  const yesAddAnotherRoomTrans = useTranslatedText("Yes, Add Another Room");
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateStepTwo = () => {
    const newErrors: { [key: string]: boolean } = {};
    if (!walkInFormData.title) newErrors.title = true;
    if (!walkInFormData.firstName) newErrors.firstName = true;
    if (!walkInFormData.phone) newErrors.phone = true;
    if (!walkInFormData.email) newErrors.email = true;
    if (!walkInFormData.bookingReffarance) newErrors.bookingReffarance = true;
    if (!walkInFormData.nationality) newErrors.nationality = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStepOne = () => {
    const newErrors: { [key: string]: boolean } = {};

    if (!walkInFormData.checkInDate) newErrors.checkInDate = true;
    if (!walkInFormData.checkOutDate) {
      newErrors.checkOutDate = true;
    } else {
      const checkIn = new Date(walkInFormData.checkInDate);
      const checkOut = new Date(walkInFormData.checkOutDate);
      const isDayUse = walkInFormData.isDayRoom;
      const diff = checkOut.getTime() - checkIn.getTime();

      if (!isDayUse && diff < 24 * 60 * 60 * 1000) {
        newErrors.checkOutDate = true;
      } else if (isDayUse && diff < 0) {
        newErrors.checkOutDate = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (walkInFormData.roomType && walkInFormData.roomNumber) {
      const selectedType = roomTypes.find(
        (type) => type.hotelRoomTypeID.toString() === walkInFormData.roomType
      );
      if (selectedType) {
        const selectedRoom = selectedType.rooms?.find(
          (room: any) => room.id === walkInFormData.roomNumber
        );
        if (selectedRoom) {
          setWalkInFormData((prev) => ({
            ...prev,
            rateAmount: selectedRoom.rate?.toString() ?? "",
          }));
        }
      }
    }
  }, [walkInFormData.roomType, walkInFormData.roomNumber, roomTypes]);

  // Automatically calculate netRate when rateAmount, discount, discountType, extra, or supplement changes
  useEffect(() => {
    const baseRate = parseFloat(walkInFormData.rateAmount) || 0;
    const extra = parseFloat(walkInFormData.extra) || 0;
    const supplement = parseFloat(walkInFormData.supplement) || 0;
    const discount = parseFloat(walkInFormData.discount) || 0;
    let discountValue = 0;

    if (walkInFormData.discountType === "percent") {
      discountValue = (baseRate * discount) / 100;
    } else {
      discountValue = discount;
    }

    const netRate = baseRate + extra + supplement - discountValue;
    setWalkInFormData((prev) => ({
      ...prev,
      netRate: netRate > 0 ? netRate.toFixed(2) : "0.00",
    }));
  }, [
    walkInFormData.rateAmount,
    walkInFormData.extra,
    walkInFormData.supplement,
    walkInFormData.discount,
    walkInFormData.discountType,
  ]);

  // Calculate nights based on checkInDate and checkOutDate
  useEffect(() => {
    const checkIn = new Date(walkInFormData.checkInDate);
    const checkOut = new Date(walkInFormData.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 0);
    setWalkInFormData((prev) => ({
      ...prev,
      nights: diffDays.toString(),
    }));
  }, [walkInFormData.checkInDate, walkInFormData.checkOutDate]);

  const handleWalkInInputChange = (field: string, value: string | boolean) => {
    setWalkInFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error as soon as the user types
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (value !== "" && newErrors[field]) {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const selectedRatePlan = ratePlans.find(
    (plan) => plan.hotelRatePlanID.toString() === walkInFormData.rateType
  );

  const handleNextStep = () => {
    if (walkInStep === 1) {
      if (!validateStepOne()) return;
      setWalkInStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (walkInStep > 1) {
      setWalkInStep((prev) => prev - 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleFinishBooking = async () => {
    if (!validateStepTwo()) {
      return; // Stop if any required fields are missing
    }
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

    // --- NEW: Post guest details to /api/GuestProfileMaster ---
    const guestProfilePayload = {
      profileId: 0,
      hotelId: hotelId || 0,
      title: walkInFormData.title,
      guestName: walkInFormData.firstName,
      dob: walkInFormData.dob
        ? new Date(walkInFormData.dob).toISOString()
        : new Date().toISOString(),
      address: walkInFormData.address,
      city: walkInFormData.city,
      zipCode: walkInFormData.zipCode,
      country: walkInFormData.country,
      nationality: walkInFormData.nationality,
      ppNo: walkInFormData.idNumber,
      phone: walkInFormData.phone,
      email: walkInFormData.email,
      createdOn: new Date().toISOString(),
      createdBy: "system",
      updatedOn: new Date().toISOString(),
      updatedBy: "system",
    };

    console.log("Guest Profile Payload:", guestProfilePayload);

    // --- BEGIN: Parse guest data for check-in form drawer ---
    const parsedGuestData: GuestProfileForCheckInType = {
      title: walkInFormData.title,
      guestName: walkInFormData.firstName,
      email: walkInFormData.email,
      phone: walkInFormData.phone,
      checkInDate: walkInFormData.checkInDate,
      checkOutDate: walkInFormData.checkOutDate,
    };
    // Optionally set guest profile data for check-in drawer if setter provided
    if (typeof setGuestProfileForCheckIn === "function") {
      setGuestProfileForCheckIn(parsedGuestData);
    }
    // --- END: Parse guest data for check-in form drawer ---

    let guestProfileId: number | null = null;
    try {
      const guestRes = await fetch(`${BASE_URL}/api/GuestProfileMaster`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(guestProfilePayload),
      });

      const guestData = await guestRes.json();
      console.log("Guest profile created:", guestData);
      guestProfileId = guestData?.profileId;
      if (!guestProfileId) {
        console.error("Guest Profile ID not found in response");
        return;
      }
    } catch (error) {
      console.error("Failed to create guest profile", error);
    }

    if (!guestProfileId) {
      console.error("Guest Profile ID not found in response");
      return;
    }
    // --- END guest profile POST ---

    // Generate IDs once, to ensure consistency
    const revId = "walkin-rev-" + Date.now();
    const bkId = "walkin-bk-" + Date.now();

    // Compose finalRooms array as per new payload
    const finalRooms = walkInFormData.selectedRooms.map((room) => ({
      roomNo: room.roomNumber,
      netRate: walkInFormData.netRate,
      adult: walkInFormData.adults,
      child: walkInFormData.children,
      extra: walkInFormData.extra,
      discount: walkInFormData.discount,
    }));

    const insertedAt = new Date().toISOString();
    const discountType = walkInFormData.discountType;
    const checkinDate = walkInFormData.checkInDate;
    const checkoutDate = walkInFormData.checkOutDate;
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
              .reduce((sum, r) => sum + parseFloat(r.netRate || "0"), 0)
              .toFixed(2),
            // Use the first room's rate code ID for the top-level attribute
            rate_code_id:
              walkInFormData.selectedRooms.length > 0
                ? walkInFormData.selectedRooms[0].rateCodeId
                : 0,
            created_by: tokens?.fullName || "system",
            remarks_internal: "",
            remarks_guest: "",
            guest_profile_id: guestProfileId || 0,
            agent: walkInFormData.travelAgent || "",
            inserted_at: insertedAt,
            channel_id: "",
            property_id: "",
            hotel_id: hotelId || 0,
            unique_id: bkId,
            system_id: "FIT",
            ota_name: "FIT",
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
              country: personalInfo.country || "",
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
            rooms: finalRooms.map((room) => {
              // Find the corresponding selected room to get its rateType and rateCodeId
              const matchedRoom = walkInFormData.selectedRooms.find(
                (r) => r.roomNumber === room.roomNo
              );
              const matchedPlan = ratePlans.find(
                (plan) =>
                  plan.hotelRatePlanID.toString() ===
                  (matchedRoom?.rateType || "")
              );
              const mealPlan = matchedPlan?.title?.split(" - ")[1] || "";
              return {
                meta: {
                  mapping_id: "",
                  parent_rate_plan_id: "1",
                  rate_plan_code: matchedRoom?.rateCodeId || 0,
                  room_type_code: matchedPlan?.roomTypeCode || "",
                  days_breakdown: [],
                  cancel_penalties: [],
                  smokingPreferences: "",
                  additionalDetails: [],
                  booking_com_room_index: 0,
                  meal_plan: mealPlan,
                  policies: "",
                  promotion: [],
                  room_remarks: [],
                },
                taxes: [],
                services: [],
                amount: room.netRate || "0",
                days: {
                  [checkinDate]: room.netRate || "0",
                },
                guest_profile_id: guestProfileId || 0,
                ota_commission: "0",
                guests: [],
                occupancy: {
                  children: parseInt(room.child || "0"),
                  adults: parseInt(room.adult || "1"),
                  ages: [],
                  infants: 0,
                },
                rate_plan_id: matchedPlan?.hotelRatePlanID?.toString() || "0",
                room_type_id: "0",
                hotel_room_type_id: parseInt(
                  matchedPlan?.roomTypeID?.toString() || "0"
                ),
                booking_room_id: room.roomNo || "",
                checkin_date: checkinDate,
                checkout_date: checkoutDate,
                is_cancelled: false,
                ota_unique_id: "",
                disc_percen:
                  matchedRoom?.discountType === "percent"
                    ? parseFloat(matchedRoom?.discount || "0")
                    : 0,
                discount:
                  matchedRoom?.discountType !== "percent"
                    ? parseFloat(matchedRoom?.discount || "0")
                    : 0,
                child_rate: 0,
                suppliment: parseFloat(matchedRoom?.supplement || "0"),
                net_rate: parseFloat(room.netRate || "0"),
                is_day_room: walkInFormData.isDayRoom || false,
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
      dateTime: new Date().toISOString(),
    };

    // Log the matched rate plan and rate code ID
    const selectedRatePlan = ratePlans.find(
      (plan) => plan.hotelRatePlanID.toString() === walkInFormData.rateType
    );
    console.log("Selected Rate Plan:", selectedRatePlan);
    console.log("Rate Code ID:", selectedRatePlan?.rateCodeID);

    // Log the payload exactly as it will be sent
    console.log(
      "Booking Payload in the walkin drawer##############:",
      bookingPayload
    );

    try {
      // Use the controller function instead of direct fetch call
      const result = await createBookingViaFeed({
        token: accessToken,
        payload: bookingPayload,
      });

      if (result.success) {
        console.log("Booking creation succeeded:", result);
        const reservationNo = result.reservationNo || "";
        const reservationID = result.reservationID || 0;
        console.log(
          `Walk-in booking posted successfully: reservationNo=${reservationNo}, reservationID=${reservationID}`
        );

        setWalkInFormData(initialWalkInFormData);
        onOpenChange(false);
        setWalkInStep(1);
      } else {
        console.error("Booking creation failed:", result.message);
        alert(`Failed to create booking: ${result.message}`);
      }
    } catch (err: any) {
      console.error("Failed to post booking", err);
    } finally {
      setIsSubmitting(false);
    }

    // --- END booking POST logics ---

    //window.location.reload();
  };

  const handleClearForm = () => {
    if (walkInStep === 1) {
      setWalkInFormData((prev) => ({
        ...prev,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        idType: "passport",
        idNumber: "",
        bookingReffarance: "",
      }));
    } else if (walkInStep === 2) {
      setWalkInFormData((prev) => ({
        ...prev,
        checkInDate: format(new Date(), "yyyy-MM-dd"),
        checkOutDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        adults: "1",
        children: "0",
        specialRequests: "",
      }));
    } else if (walkInStep === 3) {
      setWalkInFormData((prev) => ({
        ...prev,
        roomType: "",
        roomNumber: "",
        rateType: "",
        rateAmount: "",
      }));
    }
  };

  // Currencies state
  const [currencies, setCurrencies] = useState<any[]>([]);

  // --- Guest Suggestions State and Fetch ---
  const [guestSuggestions, setGuestSuggestions] = useState<any[]>([]);
  const [guestData, setGuestData] = useState<any[]>([]);

  useEffect(() => {
    // Fetch guest profiles for suggestions
    const fetchGuestProfiles = async () => {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;
      if (!accessToken) return;
      try {
        const res = await fetch(`${BASE_URL}/api/GuestProfileMaster`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        console.log("Guest Profiles API Response:", data);

        if (Array.isArray(data)) {
          setGuestSuggestions(data);
          setGuestData(data);
        }
      } catch (error) {
        console.error("Failed to fetch guest suggestions", error);
      }
    };
    fetchGuestProfiles();
  }, []);

  // Fetch currencies from API
  useEffect(() => {
    const fetchCurrencies = async () => {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;
      if (!accessToken) return;

      try {
        const response = await fetch(`${BASE_URL}/api/Currency`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json();
        if (Array.isArray(data)) {
          setCurrencies(data);
        }
      } catch (error) {
        console.error("Failed to fetch currencies", error);
      }
    };

    fetchCurrencies();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // Auto-calculate nights when checkIn or checkOut changes
    if (walkInFormData.checkInDate && walkInFormData.checkOutDate) {
      const checkIn = new Date(walkInFormData.checkInDate);
      const checkOut = new Date(walkInFormData.checkOutDate);
      const nights = differenceInDays(checkOut, checkIn);
      if (nights >= 0 && nights !== parseInt(walkInFormData.nights)) {
        handleWalkInInputChange("nights", nights.toString());
      }
    }
  }, [walkInFormData.checkInDate, walkInFormData.checkOutDate]);

  useEffect(() => {
    // Auto-calculate checkOutDate when nights value changes
    if (
      walkInFormData.checkInDate &&
      walkInFormData.nights !== "" &&
      !isNaN(Number(walkInFormData.nights))
    ) {
      const newCheckout = format(
        addDays(
          new Date(walkInFormData.checkInDate),
          Number(walkInFormData.nights)
        ),
        "yyyy-MM-dd"
      );
      if (walkInFormData.checkOutDate !== newCheckout) {
        handleWalkInInputChange("checkOutDate", newCheckout);
      }
    }
  }, [walkInFormData.nights]);

  console.log("selected rooms", walkInFormData);

  const netRateTotal = walkInFormData.selectedRooms.reduce(
    (sum, room) => sum + parseFloat(room.netRate || "0"),
    0
  );

  console.log("walkInFormData.selectedRooms", walkInFormData.selectedRooms);

  const addRoomHandler = () => {
    if (
      walkInFormData.roomType &&
      walkInFormData.roomNumber &&
      walkInFormData.rateType
    ) {
      // Find the selected rate plan to get the rate code ID
      const selectedRatePlan = ratePlans.find(
        (plan) => plan.hotelRatePlanID.toString() === walkInFormData.rateType
      );

      if (!selectedRatePlan || !selectedRatePlan.rateCodeID) {
        alert("Please select a valid rate plan before adding a room.");
        return;
      }

      const newRoom: Room = {
        roomType: walkInFormData.roomType,
        roomNumber: walkInFormData.roomNumber,
        rateType: walkInFormData.rateType,
        rateAmount: walkInFormData.rateAmount,
        netRate: walkInFormData.netRate,
        rateCodeId: selectedRatePlan.rateCodeID,
        discount: walkInFormData.discount,
        discountType: walkInFormData.discountType,
        supplement: walkInFormData.supplement,
        extra: walkInFormData.extra,
        adults: walkInFormData.adults,
        children: walkInFormData.children,
      };
      // Log the new room details before updating the state
      console.log("Adding Room ####################:", newRoom);

      setWalkInFormData((prev) => ({
        ...prev,
        selectedRooms: [...prev.selectedRooms, newRoom],
        // Clear form fields for next room selection
        roomType: "",
        roomNumber: "",
        // rateType: "",
        // rateAmount: "",
        extra: "",
        discount: "",
        discountType: "value",
        netRate: "",
        supplement: "",
        adults: "1",
        children: "0",
      }));
    } else {
      // Show appropriate validation message
      if (!walkInFormData.roomType) {
        alert("Please select a room type.");
      } else if (!walkInFormData.roomNumber) {
        alert("Please select a room number.");
      } else if (!walkInFormData.rateType) {
        alert("Please select a rate plan.");
      }
    }
  };

  useEffect(() => {
    if (walkInFormData.checkInDate && walkInFormData.checkOutDate) {
      const checkIn = new Date(walkInFormData.checkInDate);
      const checkOut = new Date(walkInFormData.checkOutDate);
      const diffInMs = checkOut.getTime() - checkIn.getTime();
      const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays > 0) {
        handleWalkInInputChange("nights", diffInDays.toString());
      }
    }
  }, [walkInFormData.checkOutDate]);

  useEffect(() => {
    if (walkInFormData.roomType && availableRooms.length > 0) {
      const matchedRoom = availableRooms.find(
        (room) => room.roomType === walkInFormData.roomType
      );

      if (matchedRoom) {
        console.log("Matched room:", matchedRoom);
        setWalkInFormData((prev) => ({
          ...prev,
          adults: String(matchedRoom.defaultAdults), // adjust if key is different
          children: String(matchedRoom.defaultChildren), // change this key if needed
        }));
      }
    }
  }, [walkInFormData.roomType, availableRooms]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-x-hidden overflow-y-auto rounded-l-2xl px-4 pb-6"
      >
        <SheetHeader className="flex-shrink-0 space-y-2 pb-4 border-b">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousStep}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <SheetTitle>
              {walkInStep === 1 && roomDetails}
              {walkInStep === 2 && bookingInformation}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto py-4">
          {walkInStep === 1 && (
            <div className="space-y-4 py-2 px-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Check-In Date */}
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="checkInDate">{checkInDateTrans}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="checkInDate"
                      type="date"
                      min={today}
                      className={`pl-10 h-10 border ${
                        errors.checkInDate ? "border-red-500" : "border-input"
                      }`}
                      value={walkInFormData.checkInDate}
                      onChange={(e) => {
                        const newCheckIn = e.target.value;
                        const newCheckOut = new Date(newCheckIn);
                        newCheckOut.setDate(newCheckOut.getDate() + 1);

                        handleWalkInInputChange("checkInDate", newCheckIn);
                        handleWalkInInputChange(
                          "checkOutDate",
                          newCheckOut.toISOString().split("T")[0]
                        );
                        handleWalkInInputChange("nights", "1");
                      }}
                    />
                  </div>
                </div>

                {/* Nights */}
                <div className="space-y-2 col-span-1">
                  <div className="flex items-center  flex-row justify-between align-middle">
                    <Label htmlFor="nights">Nights</Label>
                    <div className="flex items-center space-x-2 pt-2 ">
                      <Checkbox
                        id="isDayRoom"
                        checked={walkInFormData.isDayRoom}
                        onCheckedChange={(checked) =>
                          handleWalkInInputChange("isDayRoom", checked === true)
                        }
                      />
                      <Label htmlFor="isDayRoom">Day Use</Label>
                    </div>
                  </div>

                  <Input
                    id="nights"
                    type="number"
                    min={1}
                    className="h-10"
                    value={walkInFormData.nights || ""}
                    onChange={(e) =>
                      handleWalkInInputChange("nights", e.target.value)
                    }
                  />
                </div>

                {/* Check-Out Date */}
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="checkOutDate">{checkOutDateTrans}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="checkOutDate"
                      type="date"
                      min={walkInFormData.checkInDate || today}
                      className={`pl-10 h-10 border ${
                        errors.checkOutDate ? "border-red-500" : "border-input"
                      }`}
                      value={walkInFormData.checkOutDate}
                      onChange={(e) =>
                        handleWalkInInputChange("checkOutDate", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Meal Plan */}
                <div className="space-y-2">
                  <Label htmlFor="mealPlan">Meal Plan</Label>
                  <Select
                    value={walkInFormData.mealPlan}
                    onValueChange={(value) =>
                      handleWalkInInputChange("mealPlan", value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue placeholder="Select Meal Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {mealPlans.map((plan) => (
                        <SelectItem
                          key={plan.mealPlanID}
                          value={plan.shortCode}
                        >
                          {plan.mealPlan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateType">{ratePlanTrans}</Label>
                  {/*
                  Only show rate plans for selected room type; disable until room type is chosen.
                */}
                  {(() => {
                    const roomTypeSelected = Boolean(walkInFormData.roomType);
                    const ratePlansForType = ratePlans.filter(
                      (plan) =>
                        plan.hotelRoomType.hotelRoomTypeID.toString() ===
                        walkInFormData.roomType
                    );
                    return (
                      <Select
                        value={walkInFormData.rateType}
                        onValueChange={(value) =>
                          handleWalkInInputChange("rateType", value)
                        }
                        disabled={!walkInFormData.roomType}
                      >
                        <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          <SelectValue placeholder={selectRateTypeTrans} />
                        </SelectTrigger>
                        {roomTypeSelected && ratePlansForType.length === 0 && (
                          <p className="text-sm text-muted-foreground px-2">
                            No rate plans available for this room type.
                          </p>
                        )}
                        <SelectContent>
                          {ratePlans
                            .filter(
                              (plan) =>
                                plan.hotelRoomType.hotelRoomTypeID.toString() ===
                                walkInFormData.roomType
                            )
                            .map((plan) => (
                              <SelectItem
                                key={plan.hotelRatePlanID}
                                value={plan.hotelRatePlanID.toString()}
                              >
                                {plan.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomType">{roomTypeTrans}</Label>
                  <Select
                    value={walkInFormData.roomType}
                    onValueChange={(value) =>
                      handleWalkInInputChange("roomType", value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue placeholder={selectRoomTypeTrans} />
                    </SelectTrigger>
                    {/* Fallback message if no room types */}
                    {roomTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground px-2">
                        No room types available.
                      </p>
                    )}
                    <SelectContent>
                      {roomTypes
                        .filter((rt) =>
                          ratePlans.some(
                            (rp) =>
                              rp?.hotelRoomType?.hotelRoomTypeID?.toString() ===
                              rt?.hotelRoomTypeID?.toString()
                          )
                        )
                        .map((rt) => (
                          <SelectItem
                            key={rt.hotelRoomTypeID}
                            value={rt.hotelRoomTypeID.toString()}
                          >
                            {rt.roomType || "Unnamed Room Type"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomNumber">{roomNumberTrans}</Label>
                  <Select
                    value={walkInFormData.roomNumber}
                    onValueChange={(value) =>
                      handleWalkInInputChange("roomNumber", value)
                    }
                    disabled={!walkInFormData.roomType}
                  >
                    <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                      <SelectValue placeholder={selectRoomNumberTrans} />
                    </SelectTrigger>
                    {/* <SelectContent>
                      {availableRooms
                        .filter(
                          (room) =>
                            room?.roomTypeID?.toString() ===
                            walkInFormData.roomType
                        )
                        .map((room) => (
                          <SelectItem
                            key={room.roomId}
                            value={room.roomId.toString()}
                          >
                            {room.roomNo}
                          </SelectItem>
                        ))}
                    </SelectContent> */}
                  </Select>
                </div>

                {/* Adults */}
                <div className="space-y-2">
                  <Label htmlFor="adults">Adults</Label>
                  <Select
                    value={walkInFormData.adults}
                    onValueChange={(value) =>
                      handleWalkInInputChange("adults", value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm">
                      <SelectValue placeholder="Select Adults" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const selectedRoom = roomTypes.find(
                          (rt) =>
                            rt.hotelRoomTypeID.toString() ===
                            walkInFormData.roomType
                        );
                        const adultMin = 1;
                        const adultMax = selectedRoom?.adultSpace ?? 1;
                        return Array.from(
                          { length: adultMax - adultMin + 1 },
                          (_, i) => i + adultMin
                        ).map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                {/* Children */}
                <div className="space-y-2">
                  <Label htmlFor="children">Children</Label>
                  <Select
                    value={walkInFormData.children}
                    onValueChange={(value) =>
                      handleWalkInInputChange("children", value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm">
                      <SelectValue placeholder="Select Children" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const selectedRoom = roomTypes.find(
                          (rt) =>
                            rt.hotelRoomTypeID.toString() ===
                            walkInFormData.roomType
                        );
                        const childMin = 0;
                        const childMax = selectedRoom?.childSpace ?? 0;
                        return Array.from(
                          { length: childMax - childMin + 1 },
                          (_, i) => i + childMin
                        ).map((val) => (
                          <SelectItem key={val} value={val.toString()}>
                            {val}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rateAmount">{rateAmountTrans}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rateAmount"
                        type="number"
                        className="pl-10"
                        value={walkInFormData.rateAmount}
                        placeholder="150.00"
                        onChange={(e) =>
                          handleWalkInInputChange("rateAmount", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div />
                </div>
              </div>

              {/* Extra, Supplement, Discount, Net Rate fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extra">Extra</Label>
                  <Input
                    id="extra"
                    value={walkInFormData.extra}
                    onChange={(e) =>
                      handleWalkInInputChange("extra", e.target.value)
                    }
                    placeholder="Enter Extra"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplement">Supplement</Label>
                  <Input
                    id="supplement"
                    value={walkInFormData.supplement}
                    onChange={(e) =>
                      handleWalkInInputChange("supplement", e.target.value)
                    }
                    placeholder="Enter Supplement"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      id="discount"
                      value={walkInFormData.discount}
                      onChange={(e) =>
                        handleWalkInInputChange("discount", e.target.value)
                      }
                      placeholder="Enter Discount"
                      className="col-span-2"
                    />
                    <Select
                      value={walkInFormData.discountType || "value"}
                      onValueChange={(value) =>
                        handleWalkInInputChange("discountType", value)
                      }
                    >
                      <SelectTrigger className="h-10 w-full border border-input bg-background px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="value">Value</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <Label htmlFor="netRate">Net Rate</Label>
                    <Input
                      id="netRate"
                      value={walkInFormData.netRate}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Net Rate"
                    />
                  </div>
                  <div />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFOC"
                    checked={walkInFormData.isFOC}
                    onCheckedChange={(checked) =>
                      handleWalkInInputChange("isFOC", checked === true)
                    }
                  />
                  <Label htmlFor="isFOC">Free of Charge (FOC)</Label>
                </div>
              </div>

              <Button
                onClick={addRoomHandler}
                disabled={
                  !walkInFormData.roomType || !walkInFormData.roomNumber
                }
              >
                {addRoomTrans}
              </Button>

              <div className="overflow-auto rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Room Type</th>
                      <th className="px-4 py-2">Room Number</th>
                      <th className="px-4 py-2 text-right">Net Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walkInFormData.selectedRooms.map((room, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">
                          {roomTypes.find(
                            (type) =>
                              type.hotelRoomTypeID.toString() === room.roomType
                          )?.roomType || room.roomType}
                        </td>
                        <td className="px-4 py-2">
                          {roomNumbers.find(
                            (r) => r.roomID.toString() === room.roomNumber
                          )?.roomNo || room.roomNumber}
                        </td>

                        <td className="px-4 py-2 text-right">{room.netRate}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td className="px-4 py-2" colSpan={2}>
                        Total
                      </td>
                      <td className="px-4 py-2 text-right">
                        {netRateTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setWalkInStep(2)}>
                  Add Another Room
                </Button>
                <Button onClick={handleFinishBooking} disabled={isSubmitting}>
                  {isSubmitting ? "Finishing..." : "Finish Booking"}
                </Button>
              </div> */}

              {/* {walkInFormData.selectedRooms.length > 0 && (
                <div className="space-y-2 pt-4">
                  <Label>{selectedRoomsTrans}</Label>
                  <div className="border rounded-md divide-y">
                    {walkInFormData.selectedRooms.map((room, index) => {
                      const roomTypeObj = roomTypes.find(
                        (type) => type.roomType === room.roomType
                      );
                      const roomTypeName =
                        roomTypeObj?.roomType || room.roomType;
                      const roomNumberDisplay =
                        roomTypeObj?.rooms?.find(
                          (r: any) => r.id === room.roomNumber
                        )?.number || room.roomNumber;
                      return (
                        <div
                          key={index}
                          className="p-3 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{roomTypeName}</p>
                            <p className="text-sm text-muted-foreground">
                              Room {roomNumberDisplay}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${room.rateAmount}</p>
                            <p className="text-sm text-muted-foreground">
                              {perNightTrans}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )} */}
            </div>
          )}

          {walkInStep === 2 && (
            <>
              <div className="space-y-6 px-[10px] py-2">
                <div className="grid grid-cols-4 gap-2 items-end">
                  {/* Title */}
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="title">Title</Label>
                    <Select
                      value={walkInFormData.title}
                      onValueChange={(value) =>
                        handleWalkInInputChange("title", value)
                      }
                    >
                      <SelectTrigger
                        className={`h-10 w-full border px-3 py-2 rounded-md shadow-sm ${
                          errors.title ? "border-red-500" : "border-input"
                        }`}
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

                  {/* Guest Name */}
                  <div className="space-y-2 col-span-3">
                    <Label htmlFor="guestName">Guest Name</Label>
                    <Input
                      id="guestName"
                      value={walkInFormData.firstName}
                      onChange={(e) =>
                        handleWalkInInputChange("firstName", e.target.value)
                      }
                      placeholder="John Doe"
                      className={`h-10 w-full px-3 py-2 rounded-md border ${
                        errors.firstName ? "border-red-500" : "border-input"
                      }`}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className={`h-10 pl-10 rounded-md border ${
                          errors.email ? "border-red-500" : "border-input"
                        }`}
                        value={walkInFormData.email}
                        onChange={(e) =>
                          handleWalkInInputChange("email", e.target.value)
                        }
                        placeholder="john.doe@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        className={`h-10 pl-10 rounded-md border ${
                          errors.phone ? "border-red-500" : "border-input"
                        }`}
                        value={walkInFormData.phone}
                        onChange={(e) =>
                          handleWalkInInputChange("phone", e.target.value)
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Nationality & Booking Ref */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">{nationalityTrans}</Label>
                    <Select
                      value={walkInFormData.nationality}
                      onValueChange={(value) =>
                        handleWalkInInputChange("nationality", value)
                      }
                    >
                      <SelectTrigger
                        className={`h-10 w-full border px-3 py-2 rounded-md shadow-sm ${
                          errors.nationality ? "border-red-500" : "border-input"
                        }`}
                      >
                        <SelectValue placeholder="Select" />
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

                  <div className="space-y-2">
                    <Label htmlFor="bookingreffarance">
                      Booking Reffarance
                    </Label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="bookingreffarance"
                        className={`h-10 pl-10 rounded-md border ${
                          errors.bookingReffarance
                            ? "border-red-500"
                            : "border-input"
                        }`}
                        value={walkInFormData.bookingReffarance}
                        onChange={(e) =>
                          handleWalkInInputChange(
                            "bookingReffarance",
                            e.target.value
                          )
                        }
                        placeholder="Enter Booking Reffarance"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {walkInStep === 3 && (
            <div className="space-y-4 py-2 px-2">
              <h3 className="text-lg font-semibold">Review Rooms</h3>

              <div className="overflow-auto rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Room Type</th>
                      <th className="px-4 py-2">Room Number</th>
                      <th className="px-4 py-2 text-right">Net Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walkInFormData.selectedRooms.map((room, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">
                          {roomTypes.find(
                            (type) =>
                              type.hotelRoomTypeID.toString() === room.roomType
                          )?.roomType || room.roomType}
                        </td>
                        <td className="px-4 py-2">
                          {roomNumbers.find(
                            (r) => r.roomID.toString() === room.roomNumber
                          )?.roomNo || room.roomNumber}
                        </td>

                        <td className="px-4 py-2 text-right">{room.netRate}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-semibold">
                      <td className="px-4 py-2" colSpan={2}>
                        Total
                      </td>
                      <td className="px-4 py-2 text-right">
                        {netRateTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setWalkInStep(2)}>
                  Add Another Room
                </Button>
                <Button onClick={handleFinishBooking} disabled={isSubmitting}>
                  {isSubmitting ? "Finishing..." : "Finish Booking"}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        {walkInStep === 1 && (
          <div className="pt-4 border-t mt-4 flex justify-between">
            <Button variant="outline" onClick={handleClearForm}>
              {clearTrans}
            </Button>
            <Button onClick={handleNextStep}>{nextTrans}</Button>
          </div>
        )}

        {walkInStep === 2 && (
          <div className="pt-4 border-t mt-4 flex justify-between">
            <Button variant="outline" onClick={handleClearForm}>
              {clearTrans}
            </Button>
            <Button onClick={handleFinishBooking} disabled={isSubmitting}>
              {isSubmitting ? "Finishing..." : "Finish Booking"}
            </Button>
          </div>
        )}

        {/* <Dialog open={addRoomDialogOpen} onOpenChange={setAddRoomDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{addAnotherRoomTrans}</DialogTitle>
              <DialogDescription>{wouldYouLikeTrans}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={handleFinishBooking}>
                {noCompleteBookingTrans}
              </Button>
              <Button onClick={handleAddAnotherRoom}>
                {yesAddAnotherRoomTrans}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </SheetContent>
    </Sheet>
  );
}

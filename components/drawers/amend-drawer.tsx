"use client";
import {
  updateRoomRates,
  getReservationById,
} from "@/controllers/reservationController";
import { updateNameCurrency } from "@/redux/slices/updateNameCurrencySlice";
import { UpdateRoomRate } from "@/types/reservation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Booking } from "@/components/drawers/booking-drawer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  CalendarClock,
  User,
  Info,
  Send,
  CreditCard,
  History,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchRateDetailsById,
  RateDetail,
} from "@/redux/slices/rateDetailsSlice";
import {
  fetchGuestMas,
  selectGuestMasItems,
} from "@/redux/slices/fetchGuestMasSlice";
import {
  clearReservation,
  fetchReservationById,
} from "@/redux/slices/reservationSlice";
import {
  createReservationAttachment,
  getReservationAttachments,
} from "@/controllers/reservationAttachmentController"; // adjust path if different
import FileUploadBox from "../fileUploadBox";
import AttachmentUploader from "../fileUploadBox";
import { fetchTransactions } from "@/redux/slices/transactionSlice";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { useCreateReservationLog } from "@/hooks/useCreateReservationLog";
import { useSelector } from "react-redux";
import {
  fetchNameMas,
  selectFetchNameMasItems,
} from "@/redux/slices/fetchNameMasSlice";
import {
  fetchCurrencyMas,
  selectCurrencyMasItems,
} from "@/redux/slices/fetchCurrencyMasSlice";
import { getGuestRoomMasterProfilesByReservationDetailId } from "@/controllers/guestProfileByRoomMasterController";
import {
  updateGuestMas,
  type GuestMas,
} from "@/redux/slices/updateGuestMasSlice";
import { parseISO, isValid } from "date-fns";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Add interface for attachment
interface Attachment {
  attachmentID?: number;
  id?: number;
  attachmentURL?: string;
  m_ImageURL?: string;
  d_ImageURL?: string;
  description?: string;
  fileName?: string;
  title?: string;
}

export interface AmendDrawerProps {
  bookingDetail: Booking | null;
  onClose: () => void;
  guestProfileId: number;
  reservationStatusID: number;
}

type ImageUploadSectionProps = {
  reservationId: number;
  reservationDetailId: number;
  createdBy: string;
  onUploadComplete?: () => void;
};

export function AmendDrawer({
  onClose,
  guestProfileId,
  reservationStatusID,
  bookingDetail,
}: AmendDrawerProps) {
  console.log("AmendDrawer drawer bookingDetail hihihihih ", bookingDetail);
  console.log("AmendDrawer drawer guestprofileId", guestProfileId);
  console.log("AmendDrawer drawer reservationStatusID", reservationStatusID);
  console.log("AmendDrawer drawer bookingDetail reservationId and reservationDetailId", bookingDetail.reservationId , bookingDetail.reservationDetailId);
  console.log("AmendDrawer drawer bookingDetail reservationID and reservationDetailID", bookingDetail.reservationID , bookingDetail.reservationDetailID);


  // Ensure booking and bookingDetail are loaded before rendering content
  if (!bookingDetail) return null;

  const rateDetails = useAppSelector((state) => state.rateDetails.data);
  const dispatch = useAppDispatch();

  console.log("rateDetails in AmendDrawer", rateDetails);
  

  const [editableRates, setEditableRates] = useState<RateDetail[]>([]);

  useEffect(() => {
    if (rateDetails.length > 0) {
      setEditableRates(JSON.parse(JSON.stringify(rateDetails)));
    }
  }, [rateDetails]);

  const [amendPreviewFile, setAmendPreviewFile] = useState<
    { file: File; url: string; docType: string }[]
  >([]);

  const handleChange = (
    index: number,
    key: keyof RateDetail,
    value: string
  ) => {
    const updated = [...editableRates];
    updated[index][key] = parseFloat(value) || 0;
    setEditableRates(updated);
  };

  const reservationDetailID = bookingDetail.reservationDetailID;
  console.log("reservationDetailID", reservationDetailID);

  const storedToken = localStorage.getItem("hotelmateTokens");

  useEffect(() => {
    if (reservationDetailID) {
      dispatch(fetchRateDetailsById(reservationDetailID));
    }
  }, [dispatch, bookingDetail?.reservationDetailID]);

  console.log("booking ✅", bookingDetail);

  console.log("rateDetails", rateDetails);

  function SafeFormattedDate({ date }: { date: any }) {
    return <>{fmt(date, "yyyy-MM-dd")}</>;
  }

  // Static display fields
  const guestName = bookingDetail.guestName || "";
  const phone = bookingDetail.phone || "";
  const email = bookingDetail.email || "";
  const notesList = bookingDetail.notesList || [];
  const checkInDate = bookingDetail.resCheckIn || "";
  const checkOutDate = bookingDetail.resCheckOut || "";
  const source = bookingDetail.sourceOfBooking || "";

  console.log("source of booking in amend drawer", source);
  

  // Edit mode state for each section
  const [editReservationDetails, setEditReservationDetails] = useState(false);
  const [editCustomerDetails, setEditCustomerDetails] = useState(false);
  const [editNotes, setEditNotes] = useState(false);
  // Split editFinancials into three separate states
  const [editRates, setEditRates] = useState(false);
  const [editFolio, setEditFolio] = useState(false);
  const [editDeposits, setEditDeposits] = useState(false);
  const [editGuests, setEditGuests] = useState(false);
  const [editAttachments, setEditAttachments] = useState(false);

  // Reservation Details edit logic: Check-in/out edit state
  const [editableCheckOut, setEditableCheckOut] = useState(false);
  const [tempCheckInDate, setTempCheckInDate] = useState(
    checkInDate.split("T")[0]
  );
  // Local state for Check-out date
  const [tempCheckOutDate, setTempCheckOutDate] = useState(
    checkOutDate.split("T")[0]
  );

  function toDate(val: unknown): Date | null {
    if (!val) return null;
    if (val instanceof Date) return isValid(val) ? val : null;
    if (typeof val === "number") {
      const d = new Date(val);
      return isValid(d) ? d : null;
    }
    if (typeof val === "string") {
      const s = val.trim();
      // handle ASP.NET ticks: /Date(1695600000000)/
      const m = s.match(/\/Date\((\d+)\)\//);
      if (m) {
        const d = new Date(Number(m[1]));
        return isValid(d) ? d : null;
      }
      const d = parseISO(s); // works for "2025-09-21T00:00:00" etc.
      return isValid(d) ? d : null;
    }
    return null;
  }

  function fmt(val: unknown, pattern: string, fallback = "—") {
    const d = toDate(val);
    return d ? format(d, pattern) : fallback;
  }
  // State for selected travel agent in edit mode
  const [selectedTravelAgent, setSelectedTravelAgent] = useState(source);
  const [roomGuestProfiles, setRoomGuestProfiles] = useState<any[]>([]);

  const { fullName } = useUserFromLocalStorage();

  // Travel agents state
  type TravelAgent = { nameID: string; name: string };
  interface NameMasterPayload {
    nameID: number;
    name: string;
  }

  useEffect(() => {
    if (bookingDetail?.currencyCode) {
      setSelectedCurrency(bookingDetail.currencyCode);
    }
  }, [bookingDetail]);

  // CurrencyMas via Redux
  const currencies = useAppSelector(selectCurrencyMasItems);

  useEffect(() => {
    // no filter params – load all active currencies
    dispatch(fetchCurrencyMas({}));
  }, [dispatch]);

  // Helper function to determine if dates can be edited
  const canEditDates = reservationStatusID === 1 || reservationStatusID === 2;

  // NameMas via Redux (replaces nameMasterByHotel)
  const nameMasItems = useAppSelector(selectFetchNameMasItems);

  useEffect(() => {
    // no filters – fetch all name records; you can pass { nameType: "Agent" } if API supports it
    dispatch(fetchNameMas({}));
  }, [dispatch]);

  const travelAgents = useMemo(() => {
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
        nameID: n.nameID.toString(),
        name: n.name,
        taType: n.taType,
      }));
  }, [nameMasItems]);

  console.log("travel agents", travelAgents);

  // Guest profile state
  // GuestMas via Redux (for main guest profile)
  const guestMasItems = useAppSelector(selectGuestMasItems);

  // fetch guest by ID
  useEffect(() => {
    if (!guestProfileId) return;
    dispatch(fetchGuestMas({ guestId: guestProfileId }));
  }, [dispatch, guestProfileId]);

  // derive the guestProfile from Redux state
  const guestProfile = useMemo(
    () =>
      guestMasItems.find((g) => g.guestID === guestProfileId) ??
      guestMasItems[0] ??
      null,
    [guestMasItems, guestProfileId]
  );

  // Populate customer state variables when guestProfile is available
  useEffect(() => {
    if (guestProfile) {
      setCustomerTitle(guestProfile.title || "");
      setCustomerName(guestProfile.guestName || "");
      setCustomerPhone(guestProfile.phone || guestProfile.phoneNo || "");
      setCustomerEmail(guestProfile.email || "");
      setCustomerPPNo(guestProfile.nic || guestProfile.ppNo || "");
      setCustomerDOB(guestProfile.dob ? guestProfile.dob.split("T")[0] : "");
      setCustomerNationality(
        guestProfile.nationality || bookingDetail.nationality || ""
      );
      setCustomerZip(guestProfile.zipCode || "");
      setCustomerAddress(guestProfile.address || "");
      setCustomerCity(guestProfile.city || "");
      setCustomerCountry(guestProfile.country || bookingDetail.country || "");
    }
  }, [guestProfile]);

  // Customer Details State Hooks
  const [customerName, setCustomerName] = useState(
    bookingDetail.guestName || ""
  );
  const [customerPhone, setCustomerPhone] = useState(bookingDetail.phone || "");
  const [customerEmail, setCustomerEmail] = useState(bookingDetail.email || "");
  const [customerTitle, setCustomerTitle] = useState(bookingDetail.title || "");
  const [customerPPNo, setCustomerPPNo] = useState(bookingDetail.ppNo || "");
  const [customerDOB, setCustomerDOB] = useState(
    bookingDetail.dob ? bookingDetail.dob.split("T")[0] : ""
  );
  const [customerNationality, setCustomerNationality] = useState(
    bookingDetail.nationality || ""
  );
  const [customerZip, setCustomerZip] = useState(bookingDetail.zipCode || "");
  const [customerAddress, setCustomerAddress] = useState(
    bookingDetail.address || ""
  );
  const [customerCity, setCustomerCity] = useState(bookingDetail.city || "");
  const [customerCountry, setCustomerCountry] = useState(
    bookingDetail.country || ""
  );

  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [amendAttachmentUploading, setAmendAttachmentUploading] =
    useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bookingData, setBookingData] = useState<any>(null);

  const reservationDetailId = bookingDetail?.reservationDetailID;

  const reservationId = bookingDetail?.reservationID;

  const fetchReservationDataById = async (reservationId: number) => {
    try {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      const token = storedToken ? JSON.parse(storedToken).accessToken : null;

      if (!token) throw new Error("Token not found");

      const reservation = await getReservationById({ token, reservationId });
      return reservation;
    } catch (error) {
      console.error("Failed to fetch full reservation:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!reservationId) return;

    const loadReservation = async () => {
      const data = await fetchReservationDataById(reservationId);
      if (data) {
        setBookingData(data); // Set complete reservation data
      }
    };

    loadReservation();
  }, [reservationId]);

  useEffect(() => {
    const fetchRoomGuestProfiles = async () => {
      if (!reservationDetailId) return;

      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("hotelmateTokens")
            : null;
        const token = storedToken ? JSON.parse(storedToken).accessToken : null;

        if (!token) throw new Error("No access token");

        // Fetch guest room mappings
        const guestMappings =
          await getGuestRoomMasterProfilesByReservationDetailId(
            reservationDetailId,
            token
          );

        // 🔄 NEW: replace getGuestProfileById with Redux fetchGuestMas
        // Step 1 → extract profile IDs
        const profileIds = (guestMappings || []).map(
          (m: any) => m.guestProfileId
        );

        // Step 2 → fetch all guests via Redux (same as new API usage)
        const allGuests = await dispatch(fetchGuestMas({})).unwrap();

        // Step 3 → filter guests that match the room mappings
        const guestDetails = allGuests.filter((g: any) =>
          profileIds.includes(g.guestID)
        );

        // Step 4 → store results
        setRoomGuestProfiles(guestDetails);
      } catch (err) {
        console.error("Failed to load room guest profiles:", err);
      }
    };

    fetchRoomGuestProfiles();
  }, [dispatch, reservationDetailId]);

  // Country list state for dropdowns
  const [countryList, setCountryList] = useState<string[]>([]);
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch("https://restcountries.com/v2/all?fields=name");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setCountryList(data.map((c: { name: string }) => c.name).sort());
        }
      } catch (e) {
        // fail silently
      }
    }
    fetchCountries();
  }, []);

  const [systemDate, setSystemDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotelDate() {
      const selectedProperty = localStorage.getItem("selectedProperty");
      const tokens = localStorage.getItem("hotelmateTokens");

      if (!selectedProperty || !tokens) {
        alert("Missing credentials for Night Audit.");
        return;
      }

      const { guid } = JSON.parse(selectedProperty);
      const { accessToken } = JSON.parse(tokens);

      try {
        const hotelRes = await fetch(
          `${BASE_URL}/api/Hotel/hotel-guid/${guid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!hotelRes.ok)
          throw new Error(
            `Failed to get hotel details: ${hotelRes.statusText}`
          );

        const hotelData = await hotelRes.json();
        const hotelDate = hotelData[0]?.hotelDate;
        setSystemDate(hotelDate);
      } catch (error) {
        console.error("Failed to fetch hotel date:", error);
      }
    }

    fetchHotelDate();
  }, []);

  const { createLog } = useCreateReservationLog();

  const createLogSafe = useCallback(
    async (resLog: string) => {
      try {
        await createLog({
          username: fullName || "system",
          reservationId: bookingDetail.reservationID,
          reservationDetailId: bookingDetail.reservationDetailID,
          resLog,
          platform: "Web",
          reservationNo: bookingDetail?.reservationNo,
          roomNumber: bookingDetail?.roomNumber,
        });
      } catch (e) {
        // keep silent; saving should not be blocked by log failures
        console.warn("Logging failed (non-blocking):", e);
      }
    },
    [
      createLog,
      fullName,
      bookingDetail?.reservationID,
      bookingDetail?.reservationDetailID,
      bookingDetail?.reservationNo,
      bookingDetail?.roomNumber,
    ]
  );

  const folioItems = bookingDetail.folioItems || [
    { description: "Room Charge", amount: 120, date: new Date() },
    { description: "Breakfast", amount: 20, date: new Date() },
  ];
  const advances = bookingDetail.advances || [
    { amount: 100, date: new Date(), method: "Credit Card" },
  ];

  const [selectedCurrency, setSelectedCurrency] = useState(
    bookingDetail?.currencyCode || ""
  );

  console.log("selectedCurrency", selectedCurrency);
  console.log("booking data : ", bookingData);

  // Save Reservation Details handler
const handleSaveReservationDetails = useCallback(async () => {
  try {
    // Read selectedProperty from localStorage
    const selectedPropertyStr = localStorage.getItem("selectedProperty");
    if (!selectedPropertyStr) return;

    const selectedProperty = JSON.parse(selectedPropertyStr);

    // Extract hotel_id from localStorage object
    const hotelId = selectedProperty?.id; 

    // Find travel agent name from list
    const travelAgentObj = travelAgents.find(
      (a) => a.name === selectedTravelAgent
    );

    // Build payload
    const payload = {
      property_id: null,
      hotel_id: hotelId,                       
      ota_name: travelAgentObj?.name || selectedTravelAgent,
      currency: selectedCurrency,
    };

    console.log("reervation id in handleSaveReservationDetails", bookingDetail.reservationID);

    // Call Redux thunk
    await dispatch(
      updateNameCurrency({
        reservationId: bookingDetail.reservationID, 
        payload,
      })
    ).unwrap();

    // Update UI values instantly
    bookingDetail.sourceOfBooking =
      travelAgentObj?.name || selectedTravelAgent;
    bookingDetail.currencyCode = selectedCurrency;

    setEditReservationDetails(false);

    await createLogSafe(
      `Reservation details updated: agent='${bookingDetail.sourceOfBooking}', currency='${bookingDetail.currencyCode}'`
    );
  } catch (e) {
    console.error("Error saving reservation details:", e);
  }
}, [
  dispatch,
  bookingDetail,
  selectedCurrency,
  selectedTravelAgent,
  travelAgents,
  createLogSafe,
]);

  const handleSaveRates = useCallback(async () => {
    try {
      const token = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      ).accessToken;

      if (!token) {
        console.error("No token found for updating room rates.");
        return;
      }

      const payload: UpdateRoomRate[] = editableRates.map((rate) => ({
        recordId: rate.recordId,
        hotelId: rate.hotelId,
        reservationId: rate.reservationId,
        reservationDetailId: rate.reservationDetailId,
        rateDate: rate.rateDate,
        mealPlan: rate.mealPlan,
        roomRate: rate.roomRate,
        discPercen: rate.discPercen,
        discount: rate.discount,
        childRate: rate.childRate,
        exBedRate: rate.exBedRate,
        suppliment: rate.suppliment,
        isFOC: rate.isFOC,
        netRate: rate.netRate,
        currencyCode: rate.currencyCode,
        exchangeRate: rate.exchangeRate,
        adult: rate.adult,
        child: rate.child,
        isChecked: rate.isChecked,
        checkedBy: rate.checkedBy,
        checkedAt: rate.checkedAt,
        guestName: rate.guestName,
        exBed: rate.exBed,
        exBedCount: rate.exBedCount,
        roomCount: rate.roomCount,
        isLocked: rate.isLocked,
        isNightAudit: rate.isNightAudit,
        updatedOn: new Date().toISOString(),
        updatedBy: "system",
        finAct: rate.finAct,
      }));

      const response = await updateRoomRates({ token, payload });

      console.log("Rate update response:", response.message);
      console.log("Updated rates:", editableRates);
      setEditRates(false);

      // Refetch the latest rate details so BookingDetailsDrawer updates
      if (editableRates[0]?.reservationDetailId) {
        dispatch(fetchRateDetailsById(editableRates[0].reservationDetailId));
      }

      await createLogSafe(
        `Rates updated (${editableRates.length} day(s)) for reservationDetailId=${editableRates[0]?.reservationDetailId}`
      );
    } catch (error) {
      console.error("Error while saving rate:", error);
    }
  }, [editableRates, dispatch]);

  console.log("bookingDetail in AmendDrawerrrrrrrrrrrrrr", bookingDetail);

  // Save Customer Details handler
  const handleSaveCustomerDetails = useCallback(async () => {
    try {
      if (!guestProfile) {
        console.warn("No guestProfile loaded, cannot update GuestsMas.");
        return;
      }

      const payload: GuestMas = {
        ...(guestProfile as any),
        guestID: guestProfile.guestID,
        hotelCode: guestProfile.hotelCode ?? bookingDetail.hotelCode ?? null,

        // overwrite with edited values from UI
        guestName: customerName || "",
        phoneNo: customerPhone || "",
        email: customerEmail || "",
        title: customerTitle || "",
        nic: customerPPNo || "",
        dob: customerDOB
          ? new Date(customerDOB).toISOString()
          : guestProfile.dob,

        nationality:
          customerNationality ||
          guestProfile.nationality ||
          bookingDetail.nationality ||
          null,

        address: customerAddress || "",
        city: customerCity || "",
        country:
          customerCountry ||
          guestProfile.country ||
          bookingDetail.country ||
          null,

        // extra/custom fields safely supported due to index signature
        zipCode: (guestProfile as any).zipCode || customerZip || null,

        createdOn:
          guestProfile.createdOn ||
          bookingDetail.createdOn ||
          new Date().toISOString(),
        createdBy: guestProfile.createdBy || fullName || "system",
        // keep other fields from guestProfile as-is (isVIP, type, etc.)
      };

      // 🔄 call new Redux API
      await dispatch(updateGuestMas(payload)).unwrap();

      // update booking object so UI reflects changes immediately
      bookingDetail.bookerFullName = customerName || bookingDetail.guestName;
      bookingDetail.guestName = customerName;
      bookingDetail.phone = customerPhone;
      bookingDetail.email = customerEmail;

      // refresh reservation
      dispatch(fetchReservationById(bookingDetail.reservationID));
      setEditCustomerDetails(false);

      await createLogSafe(
        `Guest profile (GuestsMas) updated: name='${customerName}', phone='${customerPhone}', email='${customerEmail}'`
      );
    } catch (e) {
      console.error("Failed to update GuestsMas:", e);
    }
  }, [
    guestProfile,
    bookingDetail,
    customerTitle,
    customerName,
    customerDOB,
    customerAddress,
    customerCity,
    customerZip,
    customerCountry,
    customerNationality,
    customerPPNo,
    customerPhone,
    customerEmail,
    fullName,
    dispatch,
    createLogSafe,
  ]);

  // Check for guestProfileId in sessionStorage on mount and set booking.guestProfileId if found
  useEffect(() => {
    const sessionProfileId = sessionStorage.getItem("guestProfileId");
    if (sessionProfileId && bookingDetail) {
      bookingDetail.guestProfileId = parseInt(sessionProfileId, 10);
    }
  }, [bookingDetail]);

  console.log("editableRates", editableRates);

  // Attachments state
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>(
    []
  );

  // Fetch all attachments for the reservation
  useEffect(() => {
    const fetchReservationAttachments = async () => {
      const reservationID = bookingDetail?.reservationID;
      if (!reservationID) return;
      console.log("reservationID in AmendDrawer", reservationID);

      try {
        const storedToken = localStorage.getItem("hotelmateTokens");
        const token = storedToken ? JSON.parse(storedToken).accessToken : null;
        if (!token) throw new Error("Token not found");

        // Fetch all attachments for this reservation
        const responses = await Promise.all([
          fetch(
            `${BASE_URL}/api/ReservationAttachment/reservation/${reservationID}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          ).then((r) => (r.ok ? r.json() : [])),
        ]);
        // Flatten arrays and filter out non-array responses
        const validResponses = responses.filter(Boolean);
        const combinedAttachments = validResponses.flatMap((data) =>
          Array.isArray(data) ? data : [data]
        );

        // Filter to only attachments that match reservationID
        const filteredAttachments = combinedAttachments.filter(
          (att) => att.reservationID === reservationID
        );

        setUploadedAttachments(filteredAttachments);
      } catch (err) {
        console.error("Failed to fetch reservation attachments:", err);
      }
    };
    fetchReservationAttachments();
  }, [bookingDetail?.reservationID]);

  console.log("uploadedAttachments", uploadedAttachments);

  // Add selectedDocType state
  const [selectedDocType, setSelectedDocType] = useState("Booking Voucher");
  const [selectedAmendDocType, setSelectedAmendDocType] =
    useState("Booking Voucher");

  const handleSubmit = useCallback(async () => {
    try {
      // Save Reservation Details
      await handleSaveReservationDetails();

      // Save Rates
      await handleSaveRates();

      // Save Customer Details
      await handleSaveCustomerDetails();
      await createLogSafe("Amendment saved successfully (all sections).");
    } catch (error) {
      console.error("Error during submission:", error);
      // You can handle errors, show messages, etc.
    }
  }, [
    handleSaveReservationDetails,
    handleSaveRates,
    handleSaveCustomerDetails,
    onClose, 
  ]);

  const transactions = useAppSelector((state) => state.transaction.data);
  console.log("transactions in AmendDrawer", transactions);

  useEffect(() => {
    if (bookingDetail?.reservationID && bookingDetail?.reservationDetailID) {
      dispatch(
        fetchTransactions({
          hotelCode: bookingDetail.hotelCode,
          reservationId: bookingDetail.reservationID,
          reservationDetailId: bookingDetail.reservationDetailID,
          tranTypeId: 17, // Assuming 17 = Deposit
        })
      );
    }
  }, [
    dispatch,
    bookingDetail?.reservationID,
    bookingDetail?.reservationDetailID,
  ]);

  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [draftGuest, setDraftGuest] = useState<any | null>(null);

  // start editing a row
  const startEditGuest = (guest: any) => {
    setEditingRowId(guest.profileId || guest.guestProfileId || guest.id); // support various keys
    setDraftGuest({
      ...guest,
      // normalize common fields used in form
      guestName: guest.guestName ?? "",
      ppNo: guest.ppNo ?? "",
      nationality: guest.nationality ?? "",
      phone: guest.phone ?? "",
      email: guest.email ?? "",
      title: guest.title ?? "",
      city: guest.city ?? "",
      zipCode: guest.zipCode ?? "",
      address: guest.address ?? "",
      dob: guest.dob ? guest.dob.split("T")[0] : "",
      country: guest.country ?? guest.nationality ?? "",
    });
  };

  const cancelEditGuest = () => {
    setEditingRowId(null);
    setDraftGuest(null);
  };

  const changeDraftGuest = (key: string, value: any) => {
    setDraftGuest((prev: any) => ({ ...prev, [key]: value }));
  };

  // save one row
  const saveGuestRow = async (guest: any) => {
    try {
      const guestID =
        guest.guestID ||
        guest.profileId ||
        guest.guestProfileId ||
        guest.id ||
        draftGuest?.guestID;

      if (!guestID) {
        throw new Error("No guestID/profileId found for guest row.");
      }

      const payload: GuestMas = {
        ...(guest as any),
        guestID,
        hotelCode: guest.hotelCode ?? bookingDetail.hotelCode ?? null,

        guestName: (draftGuest?.guestName ?? guest.guestName) || "",
        phoneNo: (draftGuest?.phone ?? guest.phoneNo ?? guest.phone) || "",
        email: (draftGuest?.email ?? guest.email) || "",
        nationality: (draftGuest?.nationality ?? guest.nationality) || null,
        nic: (draftGuest?.ppNo ?? guest.nic ?? guest.ppNo) || null,
        address: (draftGuest?.address ?? guest.address) || "",
        city: (draftGuest?.city ?? guest.city) || "",
        country:
          draftGuest?.country ??
          draftGuest?.nationality ??
          guest.country ??
          guest.nationality ??
          null,
        dob: draftGuest?.dob
          ? new Date(draftGuest.dob).toISOString()
          : guest.dob,

        title: (draftGuest?.title ?? guest.title) || "",

        createdOn: guest.createdOn || new Date().toISOString(),
        createdBy: guest.createdBy || fullName || "system",
      };

      // 🔄 call new Redux API
      await dispatch(updateGuestMas(payload)).unwrap();

      // update UI list locally
      setRoomGuestProfiles((prev) =>
        prev.map((g) =>
          (g.guestID || g.profileId || g.guestProfileId || g.id) === guestID
            ? { ...g, ...payload }
            : g
        )
      );

      await createLogSafe(
        `Guest row updated (GuestsMas): guestID=${guestID}, name='${payload.guestName}', phone='${payload.phoneNo}'`
      );

      setEditingRowId(null);
      setDraftGuest(null);
    } catch (e) {
      console.error("Failed to update GuestsMas row:", e);
      alert("Failed to update guest. Please try again.");
    }
  };

  console.log("bookin details : ", bookingDetail);

  return (
    <div className="relative h-full flex flex-col dark:bg-black text-black">
      <div className="sticky top-0 z-50 bg-transparent p-4 border-b">
        <h2 className="text-xl font-semibold dark:text-white">
          Edit Booking Details
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Tabs for Overview, Financials, Guests, Attachments */}
        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid grid-cols-4 w-full ">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          {/* Financials Tab Content */}
          <TabsContent value="financials" className="pt-4">
            {/* Add separator before Rates Section */}
            <Separator className="my-6" />
            {/* Rates Section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold dark:text-white">Rates</h4>
                <div className="flex gap-2 dark:text-white">
                  {!editRates ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditRates(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditableRates(rateDetails.map((r) => ({ ...r })));
                          setEditRates(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleSubmit}>
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-auto border rounded-md">
                <table className="w-full text-xs border border-muted">
                  <thead className="bg-muted text-muted-foreground divide-y divide-muted">
                    <tr>
                      <th className="p-2 text-left border border-muted">
                        Date
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Room Rate
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Discount
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Child Rate
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Ex Bed Rate
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Suppliment
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Net Rate
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Night Audit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted dark:text-white">
                    {editableRates.length > 0 ? (
                      <>
                        {editableRates.map((rate, idx) => {
                          const rateDateStr = fmt(
                            rate.rateDate,
                            "yyyy-MM-dd",
                            ""
                          );
                          const systemStr = fmt(systemDate, "yyyy-MM-dd", "");

                          const isLocked =
                            !!systemStr && !!rateDateStr
                              ? systemStr >= rateDateStr
                              : false;
                          const isDisabled = rate.isNightAudit;

                          return (
                            <tr key={idx}>
                              <td className="p-2 border border-muted">
                                <SafeFormattedDate date={rate.rateDate} />
                              </td>

                              {[
                                "roomRate",
                                "discount",
                                "childRate",
                                "exBedRate",
                                "suppliment",
                                "netRate",
                              ].map((field) => (
                                <td
                                  className="p-2 border border-muted"
                                  key={field}
                                >
                                  {editRates ? (
                                    <Input
                                      type="number"
                                      disabled={
                                        isDisabled || field === "netRate"
                                      }
                                      className="text-black dark:text-white appearance-none
    [&::-webkit-inner-spin-button]:appearance-none
    [&::-webkit-outer-spin-button]:appearance-none
    [moz-appearance:textfield]"
                                      value={
                                        editableRates[idx][
                                          field as keyof RateDetail
                                        ]?.toString() || "0"
                                      }
                                      onChange={(e) => {
                                        if (isDisabled) return;
                                        const updated = [...editableRates];
                                        const value =
                                          parseFloat(e.target.value) || 0;
                                        updated[idx][
                                          field as keyof RateDetail
                                        ] = value;

                                        const {
                                          roomRate,
                                          discount,
                                          childRate,
                                          exBedRate,
                                          suppliment,
                                        } = updated[idx];
                                        const discountAmount =
                                          (roomRate * discount) / 100;
                                        const netRate =
                                          roomRate -
                                          discountAmount +
                                          childRate +
                                          exBedRate +
                                          suppliment;
                                        updated[idx].netRate = parseFloat(
                                          netRate.toFixed(2)
                                        );
                                        setEditableRates(updated);
                                      }}
                                    />
                                  ) : (
                                    rate[field as keyof RateDetail] ?? 0
                                  )}
                                </td>
                              ))}

                              <td className="p-2 border border-muted text-center ">
                                {/* <input
                                  type="checkbox"
                                  className="text-black dark:text-white"
                                  checked={rate.isNightAudit}
                                  disabled={rate.isNightAudit} // or disable based on your logic
                                  onChange={(e) => {
                                    const updated = [...editableRates];
                                    updated[idx].isNightAudit =
                                      e.target.checked;
                                    setEditableRates(updated);
                                  }}
                                /> */}
                                <input
                                  type="checkbox"
                                  className="text-black dark:text-white"
                                  checked={rate.isNightAudit}
                                  readOnly
                                  disabled
                                />
                              </td>
                            </tr>
                          );
                        })}

                        <tr className="font-semibold bg-muted/50">
                          <td className="p-2 border border-muted font-medium text-left">
                            Total
                          </td>
                          {[
                            "roomRate",
                            "discount",
                            "childRate",
                            "exBedRate",
                            "suppliment",
                            "netRate",
                          ].map((field) => (
                            <td
                              className="p-2 border border-muted font-medium"
                              key={field}
                            >
                              {editableRates.reduce(
                                (sum, r) => sum + (r[field] || 0),
                                0
                              )}
                            </td>
                          ))}
                          <td className="p-2 border border-muted font-medium"></td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-3 text-sm text-muted-foreground text-center"
                        >
                          No rate details found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Folio Detail Section */}
            <div className="mb-8 dark:text-white">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold">Folio Detail</h4>
                <div className="flex gap-2">
                  {!editFolio ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditFolio(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditFolio(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditFolio(false)}
                      >
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-auto border rounded-md">
                <table className="w-full text-xs border border-muted">
                  <thead className="bg-muted text-muted-foreground divide-y divide-muted">
                    <tr>
                      <th className="p-2 text-left border border-muted">
                        Date
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Invoice Type
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Doc No
                      </th>
                      <th className="p-2 text-left border border-muted">
                        POS Center
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Pmt. Mtd
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {/* Placeholder row for folio records */}
                    <tr>
                      <td
                        colSpan={6}
                        className="p-3 text-sm text-muted-foreground text-center"
                      >
                        {editFolio ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex gap-2 w-full">
                              <Input placeholder="Date" className="w-full" />
                              <Input
                                placeholder="Invoice Type"
                                className="w-full"
                              />
                              <Input placeholder="Doc No" className="w-full" />
                              <Input
                                placeholder="POS Center"
                                className="w-full"
                              />
                              <Input
                                placeholder="Pmt. Mtd"
                                className="w-full"
                              />
                              <Input placeholder="Amount" className="w-full" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Add folio record...
                            </span>
                          </div>
                        ) : (
                          "No folio records found."
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <Separator className="my-6" />

            {/* Deposits Section */}
            <div>
              <div className="flex justify-between items-center mb-2 dark:text-white">
                <h4 className="text-sm font-semibold ">Deposits</h4>
                <div className="flex gap-2">
                  {!editDeposits ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditDeposits(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditDeposits(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditDeposits(false)}
                      >
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-auto border rounded-md dark:text-white">
                <table className="w-full text-xs border border-muted">
                  <thead className="bg-muted text-muted-foreground divide-y divide-muted">
                    <tr>
                      <th className="p-2 text-left border border-muted">
                        Date
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Created On
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Created By
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Doc No
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Payment Method
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Comments
                      </th>
                      <th className="p-2 text-left border border-muted">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {transactions.length > 0 ? (
                      <>
                        {transactions.map((deposit, index) => {
                          const displayDate =
                            deposit.date ??
                            deposit.tranDate ??
                            deposit.effectiveDate ??
                            deposit.createdOn;

                          return (
                            <tr key={index}>
                              <td className="p-2 border border-muted">
                                {editDeposits ? (
                                  <Input
                                    value={fmt(displayDate, "yyyy-MM-dd", "")}
                                  />
                                ) : (
                                  fmt(displayDate, "yyyy-MM-dd")
                                )}
                              </td>
                              <td className="p-2 border border-muted">
                                {editDeposits ? (
                                  <Input
                                    value={fmt(
                                      deposit.createdOn,
                                      "yyyy-MM-dd hh:mm:ss a",
                                      ""
                                    )}
                                  />
                                ) : (
                                  fmt(
                                    deposit.createdOn,
                                    "yyyy-MM-dd hh:mm:ss a"
                                  )
                                )}
                              </td>
                              <td className="p-2 border border-muted">
                                {editDeposits ? (
                                  <Input value={deposit.createdBy ?? ""} />
                                ) : (
                                  deposit.createdBy ?? "—"
                                )}
                              </td>
                              <td className="p-2 border border-muted">
                                {editDeposits ? (
                                  <Input value={deposit.docNo ?? ""} />
                                ) : (
                                  deposit.docNo ?? "—"
                                )}
                              </td>
                              <td className="p-2 border border-muted">
                                {editDeposits ? (
                                  <Input value={deposit.paymentMethod ?? ""} />
                                ) : (
                                  deposit.paymentMethod ?? "—"
                                )}
                              </td>
                              <td className="p-2 border border-muted">
                                {editDeposits ? (
                                  <Input value={deposit.comments ?? ""} />
                                ) : (
                                  deposit.comments ?? "—"
                                )}
                              </td>
                              <td className="p-2 border border-muted">
                                {editDeposits ? (
                                  <Input
                                    value={(
                                      Number(deposit.amount) || 0
                                    ).toFixed(2)}
                                  />
                                ) : (
                                  (Number(deposit.amount) || 0).toFixed(2)
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        <tr className="font-semibold bg-muted/50">
                          <td
                            colSpan={6}
                            className="p-2 border border-muted font-medium text-left"
                          >
                            Total
                          </td>
                          <td className="p-2 border border-muted font-medium">
                            {transactions
                              .reduce((sum, t) => sum + (t.amount || 0), 0)
                              .toFixed(2)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-3 text-sm text-muted-foreground text-center"
                        >
                          No deposit records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Removed Separator below Deposits */}
          </TabsContent>
          <TabsContent value="guests" className="pt-4">
            <div className="flex justify-end mb-4 gap-2">
              {!editGuests ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditGuests(true)}
                >
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditGuests(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditGuests(false)}
                  >
                    Save
                  </Button>
                </>
              )}
            </div>
            <div className="overflow-auto border rounded-md dark:text-white">
              <table className="w-full text-xs border border-muted">
                <thead className="bg-muted text-muted-foreground divide-y divide-muted">
                  <tr>
                    <th className="p-2 text-left border border-muted">
                      Guest Name
                    </th>
                    <th className="p-2 text-left border border-muted">
                      NIC/PP
                    </th>
                    <th className="p-2 text-left border border-muted">
                      Gender
                    </th>
                    <th className="p-2 text-left border border-muted">
                      Nationality
                    </th>
                    <th className="p-2 text-left border border-muted">
                      Phone No
                    </th>
                    <th className="p-2 text-left border border-muted">
                      Repeat
                    </th>
                    <th className="p-2 text-left border border-muted">
                      Is VIP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {roomGuestProfiles.length > 0 ? (
                    roomGuestProfiles.map((guest, index) => {
                      const rowId =
                        guest.profileId || guest.guestProfileId || guest.id;
                      const isEditing = editingRowId === rowId;

                      // read values from draft when editing, else from original guest object
                      const gv = (k: string) =>
                        isEditing ? draftGuest?.[k] : guest?.[k];

                      return (
                        <tr key={rowId ?? index}>
                          {/* Guest Name */}
                          <td className="p-2 border border-muted">
                            {isEditing ? (
                              <Input
                                value={gv("guestName") || ""}
                                onChange={(e) =>
                                  changeDraftGuest("guestName", e.target.value)
                                }
                              />
                            ) : (
                              guest.guestName || "—"
                            )}
                          </td>

                          {/* NIC/PP */}
                          <td className="p-2 border border-muted">
                            {isEditing ? (
                              <Input
                                value={gv("ppNo") || ""}
                                onChange={(e) =>
                                  changeDraftGuest("ppNo", e.target.value)
                                }
                              />
                            ) : (
                              guest.ppNo || "—"
                            )}
                          </td>

                          {/* Gender (display-only unless your API supports it) */}
                          <td className="p-2 border border-muted">
                            {guest.gender || "—"}
                          </td>

                          {/* Nationality */}
                          <td className="p-2 border border-muted">
                            {isEditing ? (
                              <select
                                className="w-full border rounded p-2 text-sm dark:bg-black dark:text-white bg-white text-black"
                                value={gv("nationality") || ""}
                                onChange={(e) =>
                                  changeDraftGuest(
                                    "nationality",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">Select</option>
                                {countryList.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              guest.nationality || "—"
                            )}
                          </td>

                          {/* Phone */}
                          <td className="p-2 border border-muted">
                            {isEditing ? (
                              <Input
                                value={gv("phone") || ""}
                                onChange={(e) =>
                                  changeDraftGuest("phone", e.target.value)
                                }
                              />
                            ) : (
                              guest.phone || "—"
                            )}
                          </td>

                          {/* Repeat (placeholder) */}
                          <td className="p-2 border border-muted">☐</td>

                          {/* Is VIP (placeholder) */}
                          <td className="p-2 border border-muted">☐</td>

                          {/* Actions */}
                          <td className="p-2 border border-muted text-right">
                            {!isEditing ? (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditGuest(guest)}
                                >
                                  Edit
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => cancelEditGuest()}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => saveGuestRow(guest)}
                                >
                                  Save
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center text-sm p-3 text-muted-foreground"
                      >
                        No guests found for this room.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="attachments" className="pt-4">
            <div className="border border-muted rounded-md p-4 bg-muted/50 space-y-4 dark:text-white">
              {/* Upload Controls in Grid: 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
                {/* Column 1: Document Type */}
                <div className="flex flex-col dark:text-white">
                  <label className="text-sm font-medium mb-1 ">
                    Document type
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-sm"
                    value={selectedAmendDocType}
                    onChange={(e) => setSelectedAmendDocType(e.target.value)}
                  >
                    <option value="Booking Voucher">Booking Voucher</option>
                    <option value="Passport / NIC">Passport / NIC</option>
                    <option value="Payment Slip">Payment Slip</option>
                    <option value="Visa Document">Visa Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Column 2: Choose File */}

                {/* Column 3: Upload Button */}
              </div>
              <AttachmentUploader
                selectedDocType={selectedDocType}
                setSelectedDocType={setSelectedDocType}
                bookingDetail={bookingDetail}
                refreshAttachments={async () => {
                  const storedToken = localStorage.getItem("hotelmateTokens");
                  const token = storedToken
                    ? JSON.parse(storedToken).accessToken
                    : null;
                  if (token) {
                    const updated = await getReservationAttachments({
                      token,
                      reservationId: bookingDetail.reservationID,
                    });
                    setUploadedAttachments(updated || []);
                  }
                }}
              />

              {/* Preview Thumbnails */}
              {/* Preview Thumbnails */}
            </div>

            {/* Attachments Section */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Attachments</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedAttachments && uploadedAttachments.length > 0 ? (
                  uploadedAttachments
                    .filter(
                      (attachment) =>
                        attachment.reservationDetailID ===
                        bookingDetail.reservationDetailID
                    )
                    .map((attachment, idx) => {
                      const rawUrl =
                        attachment.attachmentURL ||
                        attachment.m_ImageURL ||
                        attachment.d_ImageURL ||
                        "";

                      const cleanedImageUrl = rawUrl.split("?")[0];
                      const fileExt =
                        cleanedImageUrl.split(".").pop()?.toLowerCase() || "";

                      const isImage = ["jpg", "jpeg", "png", "gif"].includes(
                        fileExt
                      );
                      const isPdf = fileExt === "pdf";
                      const isDoc = ["doc", "docx"].includes(fileExt);

                      return (
                        <div
                          key={idx}
                          className="border rounded-md p-2 bg-white shadow-sm cursor-default relative group"
                        >
                          {isImage ? (
                            <img
                              src={cleanedImageUrl}
                              alt={
                                attachment.description ||
                                attachment.fileName ||
                                attachment.title ||
                                `Attachment ${idx + 1}`
                              }
                              className="w-full h-40 object-cover rounded-md"
                            />
                          ) : isPdf ? (
                            <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-md">
                              <div className="text-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="48"
                                  height="48"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="mx-auto mb-2 text-red-500"
                                >
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <path d="M9 15v-4"></path>
                                  <path d="M12 15v-2"></path>
                                  <path d="M15 15v-4"></path>
                                </svg>
                                <p className="text-xs">PDF Document</p>
                              </div>
                            </div>
                          ) : isDoc ? (
                            <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-md">
                              <div className="text-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="48"
                                  height="48"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="mx-auto mb-2 text-blue-500"
                                >
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <p className="text-xs">Word Document</p>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-md">
                              <div className="text-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="48"
                                  height="48"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="mx-auto mb-2"
                                >
                                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                                <p className="text-xs">Document</p>
                              </div>
                            </div>
                          )}
                          <div className="mt-1 text-xs text-center truncate">
                            {attachment.description ||
                              attachment.fileName ||
                              attachment.title ||
                              `Attachment ${idx + 1}`}
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this attachment?"
                                )
                              ) {
                                try {
                                  const storedToken =
                                    localStorage.getItem("hotelmateTokens");
                                  const token = storedToken
                                    ? JSON.parse(storedToken).accessToken
                                    : null;

                                  if (!token) {
                                    alert("Authentication token not found");
                                    return;
                                  }

                                  const attachmentId =
                                    attachment.attachmentID || attachment.id;

                                  if (!attachmentId) {
                                    alert("Attachment ID not found");
                                    return;
                                  }

                                  const response = await fetch(
                                    `${BASE_URL}/api/ReservationAttachment/${attachmentId}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        "Content-Type": "application/json",
                                      },
                                    }
                                  );

                                  if (!response.ok) {
                                    const errorText = await response.text();
                                    throw new Error(
                                      `Failed to delete attachment: ${errorText}`
                                    );
                                  }

                                  setUploadedAttachments(
                                    uploadedAttachments.filter(
                                      (item) =>
                                        (item.attachmentID || item.id) !==
                                        attachmentId
                                    )
                                  );

                                  alert("Attachment deleted successfully");
                                } catch (error: any) {
                                  console.error(
                                    "Error deleting attachment:",
                                    error
                                  );
                                  alert(
                                    `Failed to delete attachment: ${error.message}`
                                  );
                                }
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete attachment"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-sm text-muted-foreground col-span-3">
                    No attachments found.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="pt-4">
            <div className="space-y-6">
              <Separator />
              {/* Room Details */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4" />
                  Room Details
                </h3>
                <div className="border rounded-md p-3 flex justify-between items-center dark:text-white">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {bookingDetail.roomType || "—"}
                    </p>
                    <p className="font-medium">
                      Room {bookingDetail?.roomNumber || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {rateDetails && rateDetails.length > 0
                        ? rateDetails
                            .reduce(
                              (sum: number, r: any) => sum + (r.netRate || 0),
                              0
                            )
                            .toLocaleString()
                        : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Reservation Details */}
              <div>
                <div className="flex justify-between items-center mt-6 mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Reservation Details
                  </h3>
                  <div className="flex gap-2 dark:text-white">
                    {!editReservationDetails ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditReservationDetails(true);
                        }}
                      >
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditReservationDetails(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSubmit}
                        >
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="border rounded-md p-3 text-sm">
                  {editReservationDetails ? (
                    <div className="grid grid-cols-2 grid-rows-2 gap-4">
                      {/* Travel Agent - first row, first column */}
                      <div className="flex flex-col row-start-1 col-start-1">
                        <p className="text-muted-foreground">Travel Agent</p>
                        <select
                          className="w-full border rounded p-2 text-sm dark:bg-black dark:text-white bg-white text-black"
                          value={selectedTravelAgent}
                          onChange={(e) =>
                            setSelectedTravelAgent(e.target.value)
                          }
                        >
                          {travelAgents.map((agent, i) => (
                            <option key={i} value={agent.name}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Check-in - second row, first column */}
                      <div className="flex flex-col row-start-2 col-start-1">
                        <p className="text-muted-foreground">Check-in</p>
                        <Input
                          type="date"
                          value={tempCheckInDate}
                          disabled={true}
                        />
                      </div>
                      {/* Check-out - second row, second column */}
                      <div className="flex flex-col row-start-2 col-start-2">
                        <p className="text-muted-foreground">Check-out</p>
                        <Input
                          type="date"
                          value={tempCheckOutDate}
                          disabled={true}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 grid-rows-2 gap-4 dark:text-white">
                      {/* Travel Agent - first row, first column */}
                      <div className="flex flex-col row-start-1 col-start-1">
                        <p className="text-muted-foreground">Travel Agent</p>
                        <p className="font-medium">{source || "—"}</p>
                      </div>
                      {/* Check-in - second row, first column */}
                      <div className="flex flex-col row-start-2 col-start-1">
                        <p className="text-muted-foreground">Check-in</p>
                        <p className="font-medium dark:bg-black dark:text-white bg-white text-black">
                          {fmt(checkInDate, "yyyy-MM-dd")}
                        </p>
                      </div>
                      {/* Check-out - second row, second column */}
                      <div className="flex flex-col row-start-2 col-start-2">
                        <p className="text-muted-foreground">Check-out</p>
                        <p className="font-medium">
                          {fmt(checkOutDate, "yyyy-MM-dd")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />

              {/* Currency Section - moved out of Reservation Details, now standalone */}
              <div>
                <div className="flex justify-between items-center mt-6 mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Currency
                  </h3>
                  <div className="flex gap-2 dark:bg-black dark:text-white bg-white text-black">
                    {!editReservationDetails ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditReservationDetails(true)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditReservationDetails(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSubmit}
                        >
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <select
                      className="w-full border rounded p-2 text-sm dark:bg-black dark:text-white bg-white text-black"
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      disabled={!editReservationDetails}
                    >
                      {currencies.map((currency) => (
                        <option
                          key={currency.currencyID}
                          value={currency.currencyCode}
                          className="dark:bg-black dark:text-white bg-white text-black"
                        >
                          {currency.currencyCode}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Customer Details */}
              <div>
                <div className="flex justify-between items-center mt-6 mb-2 dark:text-white">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Guest Details
                  </h3>
                  <div className="flex gap-2">
                    {!editCustomerDetails ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditCustomerDetails(true)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditCustomerDetails(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSubmit}
                        >
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="border rounded-md p-3 grid grid-cols-2 gap-4 text-sm dark:text-white">
                  {/* <div>
                    <p className="text-muted-foreground">Guest Profile ID</p>
                    <p className="font-medium">{guestProfileId ?? "—"}</p>
                  </div> */}
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    {editCustomerDetails ? (
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{customerName || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    {editCustomerDetails ? (
                      <Input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{customerPhone || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    {editCustomerDetails ? (
                      <Input
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{customerEmail || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Title</p>
                    {editCustomerDetails ? (
                      <select
                        className="w-full border rounded p-2 text-sm dark:bg-black dark:text-white bg-white text-black"
                        value={customerTitle}
                        onChange={(e) => setCustomerTitle(e.target.value)}
                        disabled={!editCustomerDetails}
                      >
                        <option value="">Select</option>
                        <option value="Mr">Mr</option>
                        <option value="Ms">Ms</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Dr">Dr</option>
                        <option value="Prof">Prof</option>
                      </select>
                    ) : (
                      <p className="font-medium dark:bg-black dark:text-white bg-white text-black">
                        {customerTitle || "—"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      Identification Number
                    </p>
                    {editCustomerDetails ? (
                      <Input
                        value={customerPPNo}
                        onChange={(e) => setCustomerPPNo(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{customerPPNo || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    {editCustomerDetails ? (
                      <Input
                        type="date"
                        value={customerDOB}
                        onChange={(e) => setCustomerDOB(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">
                        {fmt(customerDOB, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nationality</p>
                    {editCustomerDetails ? (
                      <select
                        className="w-full border rounded p-2 text-sm dark:bg-black dark:text-white bg-white text-black"
                        value={customerNationality}
                        onChange={(e) => setCustomerNationality(e.target.value)}
                        disabled={!editCustomerDetails}
                      >
                        <option value="">Select</option>
                        {countryList.map((c) => (
                          <option
                            key={c}
                            value={c}
                            className="dark:bg-black dark:text-white bg-white text-black"
                          >
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium dark:bg-black dark:text-white bg-white text-black">
                        {customerNationality || "—"}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Zip Code</p>
                    {editCustomerDetails ? (
                      <Input
                        value={customerZip}
                        onChange={(e) => setCustomerZip(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{customerZip || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    {editCustomerDetails ? (
                      <Input
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{customerAddress || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    {editCustomerDetails ? (
                      <Input
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{customerCity || "—"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    {editCustomerDetails ? (
                      <select
                        className="w-full border rounded p-2 text-sm dark:bg-black dark:text-white bg-white text-black"
                        value={customerCountry}
                        onChange={(e) => setCustomerCountry(e.target.value)}
                        disabled={!editCustomerDetails}
                      >
                        <option value="">Select</option>
                        {countryList.map((c) => (
                          <option
                            key={c}
                            value={c}
                            className="dark:bg-black dark:text-white bg-white text-black"
                          >
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-medium">{customerCountry || "—"}</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />

              {/* Expenses & Revisions */}
              {/* <div className="mt-6">
                <Tabs defaultValue="expenses">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="expenses">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Expenses
                    </TabsTrigger>
                    <TabsTrigger value="revisions">
                      <History className="h-4 w-4 mr-2" />
                      Revisions
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="expenses" className="space-y-4 pt-4">
                    <div className="border rounded-md divide-y">
                      {bookingDetail.expenses &&
                      bookingDetail.expenses.length > 0 ? (
                        <>
                          {bookingDetail.expenses.map(
                            (
                              expense: { description: string; amount: string },
                              index: number
                            ) => (
                              <div
                                key={index}
                                className="p-3 flex justify-between items-center"
                              >
                                <span>{expense.description}</span>
                                <span className="font-medium">
                                  {expense.amount}
                                </span>
                              </div>
                            )
                          )}
                          <div className="p-3 flex justify-between items-center bg-muted/50">
                            <span className="font-medium">Total</span>
                            <span className="font-medium">
                              {bookingDetail.amount}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground">
                          No expenses found.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="revisions" className="space-y-4 pt-4">
                    <div className="border rounded-md divide-y">
                      {bookingDetail.revisions &&
                      bookingDetail.revisions.length > 0 ? (
                        bookingDetail.revisions.map(
                          (
                            revision: { description?: string; date?: string },
                            index: number
                          ) => (
                            <div key={index} className="p-3">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {revision.description ||
                                    `Revision #${index + 1}`}
                                </span>
                              </div>
                              {revision.date && (
                                <span className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(revision.date),
                                    "MMM d, yyyy, hh:mm a"
                                  )}
                                </span>
                              )}
                            </div>
                          )
                        )
                      ) : (
                        <div className="p-3 text-sm text-muted-foreground">
                          No revisions found.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div> */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

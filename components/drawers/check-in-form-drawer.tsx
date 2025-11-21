"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, FileText, Trash2, QrCode } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslatedText } from "@/lib/translation";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import { GuestProfilePayload } from "@/types/guestProfileMaster";
import { useDispatch, useSelector } from "react-redux";
import { 
  createFileUpload, 
  selectFileUploadLoading, 
  selectFileUploadSuccess, 
  selectFileUploadError 
} from "@/redux/slices/createFileUploadSlice";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { useCreateReservationLog } from "@/hooks/useCreateReservationLog";
import { createGuestProfileByRoom } from "@/redux/slices/createGuestProfileByRoomSlice";
import { updateHousekeepingStatus } from "@/redux/slices/housekeepingStatusSlice";
// import QRCode from "qrcode";
import { useQRModal } from "@/components/modals/qr-modal";

import { RootState, AppDispatch } from "@/redux/store";
import { fetchReservationDetail } from "@/redux/slices/fetchReservationDetailSlice";
import { 
  createGuestProfileCheckIn,
  selectCreateCheckInLoading,
  selectCreateCheckInSuccess,
  selectCreateCheckInError,
  clearCreateCheckIn
} from "@/redux/slices/createCheckInSlice";
import { fetchCountryMas } from "@/redux/slices/fetchCountryMasSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Define Booking type locally instead of importing it
interface bookingDetail {
  reservationNo: number;
  reservationDetailID: number;
  reservationStatusId: number;
  checkINat: string;
  checkedInBy: string;
  isRepeatGuest: boolean;
  reservationID?: number; // Added reservationID property
  guest: string;
  title?: string;
  email?: string;
  phone?: string;
  dob?: string;
  country?: string;
  nationality?: string;
  idNumber?: string;
  idType?: string;
  attachments?: any[];
  roomID?: number;
  roomId?: number;
  roomNoId?: number;
}

interface GuestProfileData {
  guestProfileId: number;
  title: string;
  guestName: string;
  email: string;
  phone: string;
  checkInDate: string;
  checkOutDate: string;
  dob?: string;
  country?: string;
  nationality?: string;
  idNumber?: string;
}

interface CheckInFormDrawerProps {
  bookingDetail: bookingDetail | null;
  guestProfileData?: GuestProfileData;
  onClose: () => void;
  title?: string;
  dob?: string;
  country?: string;
  nationality?: string;
  countryListFromWalkIn?: string[];
  groupContext?: GroupContext;
}

type GroupContext = {
  isGroup: boolean;
  detailIds: number[];
  actionLabel?: string;
  selectedRooms?: Array<{
    reservationDetailID: number;
    roomNumber?: string | number;
    roomType?: string;
    guest1?: string;
  }>;
} | null;

export function CheckInFormDrawer({
  bookingDetail,
  guestProfileData,
  onClose,
  title: titleProp,
  dob: dobProp,
  country: countryProp,
  nationality: nationalityProp,
  countryListFromWalkIn,
  groupContext,
}: CheckInFormDrawerProps) {
  if (!bookingDetail) return null;

  console.log("guestProfileData : ", guestProfileData);

  console.log(
    "bookingDetail check in form drawer. wwwwwwwwww-------------------------- :",
    bookingDetail
  );

  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [applyToAllSelected, setApplyToAllSelected] = useState<boolean>(
    !!groupContext?.isGroup
  );

  const selectedIds = groupContext?.isGroup ? groupContext.detailIds : [];
  const selectedCount = selectedIds?.length ?? 0;

  const dispatch = useDispatch<AppDispatch>();

  const { data: resDetail, loading: resLoading } = useSelector(
    (s: RootState) => s.reservationDetail
  );

  console.log("res detail : ", resDetail);

  const { showQR } = useQRModal();
  const openQR = useCallback(async () => {
    if (!bookingDetail?.reservationDetailID) return;
    const gssKey = resDetail?.gssKey;
    const url = `https://gss.hotelmate.app/?key=${encodeURIComponent(gssKey)}`;

    await showQR(url, "Scan this QR code to access the Guest Self-Service");
  }, [bookingDetail?.reservationDetailID, resDetail?.gssKey, showQR]);

  console.log("bookingDetail.reservationDetailID in checkin form: ", bookingDetail.reservationDetailID);
  console.log("booking detail in checkin form: ", bookingDetail);
  useEffect(() => {
    if (!bookingDetail?.reservationDetailID) return;
    // You can pass either reservationDetailId or gssKey (if you already have it)
    dispatch(
      fetchReservationDetail({
        reservationDetailId: bookingDetail.reservationDetailID,
      } as any)
    );
  }, [dispatch, bookingDetail?.reservationDetailID]);

  const [title, setTitle] = useState(
    titleProp || guestProfileData?.title || bookingDetail?.title || ""
  );
  const [dob, setDob] = useState(
    dobProp?.split("T")[0] ||
      guestProfileData?.dob?.split("T")[0] ||
      bookingDetail?.dob?.split("T")[0] ||
      ""
  );
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState(
    countryProp || guestProfileData?.country || bookingDetail?.country || ""
  );
  const [nationality, setNationality] = useState(
    nationalityProp ||
      guestProfileData?.nationality ||
      bookingDetail?.nationality ||
      ""
  );
  const [idNumber, setIdNumber] = useState(
    guestProfileData?.idNumber || bookingDetail?.idNumber || ""
  );
  const [idType, setIdType] = useState(bookingDetail?.idType || "Passport");
  const [email, setEmail] = useState(
    guestProfileData?.email || bookingDetail?.email || ""
  );
  const [phone, setPhone] = useState(
    guestProfileData?.phone || bookingDetail?.phone || ""
  );

  const [guestSuggestions, setGuestSuggestions] = useState<string[]>([]);
  const [guestInput, setGuestInput] = useState(
    guestProfileData?.guestName || bookingDetail?.guest || ""
  );
  const [guestData, setGuestData] = useState<any[]>([]);
  const [countryList, setCountryList] = useState<string[]>([]);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
  const [isRepeatGuest, setIsRepeatGuest] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckedInLocal, setIsCheckedInLocal] = useState(
    bookingDetail?.reservationStatusId === 4
  );

  const months = [
    { name: "January", value: "01" },
    { name: "February", value: "02" },
    { name: "March", value: "03" },
    { name: "April", value: "04" },
    { name: "May", value: "05" },
    { name: "June", value: "06" },
    { name: "July", value: "07" },
    { name: "August", value: "08" },
    { name: "September", value: "09" },
    { name: "October", value: "10" },
    { name: "November", value: "11" },
    { name: "December", value: "12" },
  ];

  // Attachment previews state (multiple files)
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [idNumberAttachmentPreviews, setIdNumberAttachmentPreviews] = useState<
    string[]
  >([]);
  const [enableSecondGuest, setEnableSecondGuest] = useState(false);

  const [secondTitle, setSecondTitle] = useState("");
  const [secondGuestName, setSecondGuestName] = useState("");
  const [secondDob, setSecondDob] = useState(""); // YYYY-MM-DD
  const [secondCountry, setSecondCountry] = useState("");
  const [secondNationality, setSecondNationality] = useState("");
  const [secondIdType, setSecondIdType] = useState("Passport");
  const [secondIdNumber, setSecondIdNumber] = useState("");
  const [secondEmail, setSecondEmail] = useState("");
  const [secondPhone, setSecondPhone] = useState("");
  const [savingSecondGuest, setSavingSecondGuest] = useState(false);
  const norm = (v?: string) =>
    String(v ?? "")
      .trim()
      .toLowerCase();

  // Redux selectors for check-in operations
  const createCheckInLoading = useSelector(selectCreateCheckInLoading);
  const createCheckInSuccess = useSelector(selectCreateCheckInSuccess);
  const createCheckInError = useSelector(selectCreateCheckInError);

  // Redux selectors for file upload operations
  const fileUploadLoading = useSelector(selectFileUploadLoading);
  const fileUploadSuccess = useSelector(selectFileUploadSuccess);
  const fileUploadError = useSelector(selectFileUploadError);

  // Helper: try to find an existing guest by email, phone, id, or name
  const findExistingGuest = ({
    byEmail,
    byPhone,
    byId,
    byName,
  }: {
    byEmail?: string;
    byPhone?: string;
    byId?: string;
    byName?: string;
  }) => {
    if (!Array.isArray(guestData) || guestData.length === 0) return null;

    const e = norm(byEmail);
    const p = norm(byPhone);
    const i = norm(byId);
    const n = norm(byName);

    // Priority: email > phone > id > name (adjust as you like)
    return (
      guestData.find((g) => e && norm(g.email) === e) ||
      guestData.find((g) => p && norm(g.phone) === p) ||
      guestData.find((g) => i && norm(g.ppNo) === i) ||
      guestData.find((g) => n && norm(g.guestName) === n) ||
      null
    );
  };

  // When user types email/phone/ID/name, auto-detect repeat guest
  useEffect(() => {
    const match = findExistingGuest({
      byEmail: email,
      byPhone: phone,
      byId: idNumber,
      byName: guestInput,
    });

    if (match) {
      // Auto-tick repeat guest and softly back-fill known fields (non-destructive)
      setIsRepeatGuest(true);

      // Back-fill only if empty, so we don't clobber user edits
      if (!guestInput) setGuestInput(match.guestName || "");
      if (!title && match.title) setTitle(match.title);
      if (!dob && match.dob) setDob(match.dob.split("T")[0]);
      if (!address && match.address) setAddress(match.address);
      if (!city && match.city) setCity(match.city);
      if (!zipCode && match.zipCode) setZipCode(match.zipCode);
      if (!country && match.country) setCountry(match.country);
      if (!nationality && match.nationality) setNationality(match.nationality);
      if (!idNumber && match.ppNo) setIdNumber(match.ppNo);
      if (!phone && match.phone) setPhone(match.phone);
      if (!email && match.email) setEmail(match.email);
    } else {
      // No match → do not auto-untick (user may want to force it on)
      // If you *do* want to auto-untick, uncomment:
      // setIsRepeatGuest(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, phone, idNumber, guestInput, guestData]);

  const [
    secondIdNumberAttachmentPreviews,
    setSecondIdNumberAttachmentPreviews,
  ] = useState<string[]>([]);
  const [secondIsRepeatGuest, setSecondIsRepeatGuest] = useState(false);

  // Set isClient to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    if (countryListFromWalkIn?.length) {
      setCountryList(countryListFromWalkIn);
    }
  }, [countryListFromWalkIn]);

  useEffect(() => {
    if (!isClient) return; // Only run on client side

    const fetchGuestNames = async () => {
      const token = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      )?.accessToken;
      const hotelId = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      )?.id;
      if (!token || !hotelId) return;

      try {
        const res = await fetch(`${BASE_URL}/api/GuestProfileMaster`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const guests = await res.json();

        const filteredGuests = guests.filter(
          (guest: any) => guest.hotelId === hotelId
        );
        setGuestData(filteredGuests);
        setGuestSuggestions(
          filteredGuests.map((guest: any) => guest.guestName)
        );
      } catch (err) {
        console.error("Error fetching guest suggestions", err);
      }
    };

    fetchGuestNames();
  }, [isClient]);

  useEffect(() => {
    if (!isClient || countryListFromWalkIn?.length) return; // Skip if not client or if we have countries from props

    // Fetch countries using Redux
    dispatch(fetchCountryMas() as any);
  }, [isClient, countryListFromWalkIn, dispatch]);

  // Get countries from Redux store
  const countries = useSelector((state: any) => state.fetchCountryMas?.data || []);

  // Update local country list when Redux data changes
  useEffect(() => {
    if (countries.length > 0 && !countryListFromWalkIn?.length) {
      const countryNames = countries
        .map((c: any) => c.country)
        .filter((name: string) => name !== null);
      setCountryList(countryNames);
    }
  }, [countries, countryListFromWalkIn]);

  // Translations
  const checkInFormText = useTranslatedText("Check-in");
  const bookingDetailsText = useTranslatedText("Booking Details");
  const guestDetailsText = useTranslatedText("Guest Details");
  const roomDetailsText = useTranslatedText("Room Details");
  const paymentDetailsText = useTranslatedText("Payment Details");
  const additionalInfoText = useTranslatedText("Additional Information");
  const firstNameText = useTranslatedText("First Name");
  const lastNameText = useTranslatedText("Last Name");
  const emailText = useTranslatedText("Email");
  const phoneText = useTranslatedText("Phone");
  const idTypeText = useTranslatedText("ID Type");
  const idNumberText = useTranslatedText("ID Number");
  const roomTypeText = useTranslatedText("Room Type");
  const roomNumberText = useTranslatedText("Room Number");
  const checkInText = useTranslatedText("Check-in");
  const checkOutText = useTranslatedText("Check-out");
  const nightsText = useTranslatedText("Nights");
  const paymentMethodText = useTranslatedText("Payment Method");
  const creditCardText = useTranslatedText("Credit Card");
  const debitCardText = useTranslatedText("Debit Card");
  const cashText = useTranslatedText("Cash");
  const cardNumberText = useTranslatedText("Card Number");
  const expiryDateText = useTranslatedText("Expiry Date");
  const cvvText = useTranslatedText("CVV");
  const specialRequestsText = useTranslatedText("Special Requests");
  const completeCheckInText = useTranslatedText("Complete Check-in");
  const cancelText = useTranslatedText("Cancel");

  function firstNonEmpty(...vals: (string | undefined | null)[]) {
    for (const v of vals) {
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
    return undefined;
  }

  // Normalizes a YYYY-MM-DD into ISO (or "" if invalid/incomplete)
  function toISOorEmpty(ymd?: string) {
    if (!ymd) return "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
    const d = new Date(`${ymd}T00:00:00`);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }

  function resolveGuestProfileId(rec: any): number {
    const id =
      rec?.guestProfileId ??
      rec?.profileId ??
      rec?.profileID ??
      rec?.id ??
      rec?.guest_profile_id ??
      rec?.ProfileId ??
      null;

    return typeof id === "string" ? Number(id) : id ?? 0;
  }

  const { fullName } = useUserFromLocalStorage();

  const { createLog } = useCreateReservationLog();

  const createLogSafe = useCallback(
    async (resLog: string) => {
      try {
        await createLog({
          username: fullName || "system",
          reservationId: bookingDetail?.reservationID || 0,
          reservationDetailId: bookingDetail?.reservationDetailID || 0,
          resLog,
          platform: "Web",
        });
      } catch (e) {
        // Don’t block UX because of logging
        console.warn("Logging failed (non-blocking):", e);
      }
    },
    [
      createLog,
      fullName,
      bookingDetail?.reservationID,
      bookingDetail?.reservationDetailID,
    ]
  );

  // No name split needed

  // put this near the top of the file (outside the component)
  function normalizeDateISO(v?: string): string {
    if (!v) return "";
    try {
      // If already an ISO-like string with "T"
      if (v.includes("T")) {
        const d = new Date(v);
        return isNaN(d.getTime()) ? "" : d.toISOString();
      }
      // Accept only fully-formed YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const d = new Date(`${v}T00:00:00`);
        return isNaN(d.getTime()) ? "" : d.toISOString();
      }
      // Anything else (e.g., "1990-05-" or "1990-5-3") is treated as invalid
      return "";
    } catch {
      return "";
    }
  }

  async function handleCheckIn() {
    if (!isClient) return;
    if (!guestInput.trim()) {
      toast.error("Please enter guest name");
      return;
    }

    setIsSubmitting(true);

    const hotelId = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    )?.id;

    const uploadAllAttachmentsForDetail = async (
      reservationDetailIdTarget: number
    ) => {
      // Upload both primary sets again, but tag to the target detail
      for (const preview of [
        ...idNumberAttachmentPreviews,
        ...attachmentPreviews,
      ]) {
        const isIDAttachment = idNumberAttachmentPreviews.includes(preview);
        console.log(
          "fileUploadLoading : ",
          preview,
          isIDAttachment,
          bookingDetail?.reservationNo,
          "citruspms"
        );
        try {
          await dispatch(
            createFileUpload({
              file: preview, // base64 data URL
              fileName: `${
                isIDAttachment ? "ID" : "Attachment"
              }_${Date.now()}.jpg`,
              fileType: isIDAttachment ? "ID Document" : "General Document",
              folioID: bookingDetail?.reservationDetailID,
              resNo: String(bookingDetail?.reservationNo),
              bucketName: "citruspms",
            })
          ).unwrap();
        } catch (err) {
          console.warn("Attachment upload failed (non-blocking):", err);
        }
      }
    };
    console.log("newGuestProfile 1");

    try {
      // Resolve or create main guest profile (once)
      let guestProfileId = 0;

      guestProfileId = resolveGuestProfileId(guestProfileData) || 0;
      console.log("newGuestProfile 2");

      if (!guestProfileId && isRepeatGuest) {
        const match = findExistingGuest({
          byEmail: email,
          byPhone: phone,
          byId: idNumber,
          byName: guestInput,
        });
        if (match) {
          guestProfileId = resolveGuestProfileId(match);
        }
      }
      console.log("newGuestProfile 3");
      // 3) If we STILL don't have one (either guestProfileData had 0 / not repeat / no match) → create now
      if (!guestProfileId) {
        const ymdDob =
          firstNonEmpty(
            guestProfileData?.dob?.split("T")[0],
            dob // <- from your 3-part inputs
          ) || "";

        const resolvedCountry = firstNonEmpty(
          guestProfileData?.country,
          country
        );

        const resolvedNationality = firstNonEmpty(
          guestProfileData?.nationality,
          nationality,
          resolvedCountry // fallback to country
        );

        const newGuestProfile: GuestProfilePayload = {
          profileId: 0,
          hotelId,
          title: firstNonEmpty(guestProfileData?.title, title) || "",
          guestName:
            firstNonEmpty(guestProfileData?.guestName, guestInput) || "",
          dob: toISOorEmpty(ymdDob),

          address:
            firstNonEmpty((guestProfileData as any)?.address, address) || "",
          city: firstNonEmpty((guestProfileData as any)?.city, city) || "",
          zipCode:
            firstNonEmpty((guestProfileData as any)?.zipCode, zipCode) || "",

          country: resolvedCountry || "",
          nationality: resolvedNationality || "",

          ppNo: firstNonEmpty(guestProfileData?.idNumber, idNumber) || "",
          phone: firstNonEmpty(guestProfileData?.phone, phone) || "",
          email: firstNonEmpty(guestProfileData?.email, email) || "",

          createdOn: new Date().toISOString(),
          createdBy: fullName || "",
          updatedOn: new Date().toISOString(),
          updatedBy: fullName || "",
        };

        console.log("newGuestProfile 4", newGuestProfile);

        const res = await dispatch(
          createGuestProfileCheckIn({
            guestName: newGuestProfile.guestName,
            phoneNo: newGuestProfile.phone,
            nationality: newGuestProfile.nationality,
            email: newGuestProfile.email,
            nic: newGuestProfile.ppNo,
            address: newGuestProfile.address,
            city: newGuestProfile.city,
            country: newGuestProfile.country,
            dob: newGuestProfile.dob,
            title: newGuestProfile.title,
            createdBy: newGuestProfile.createdBy,
            hotelCode: localStorage.getItem("hotelCode") || "1097",
            reservationDetailsId: bookingDetail?.reservationDetailID,
          })
        ).unwrap();
        guestProfileId = resolveGuestProfileId(res) || res?.guestID || 0;
        console.log("newGuestProfile 5");
        if (guestProfileId) {
          await createLogSafe(
            `Guest profile created/selected (id=${guestProfileId}) for group/single check-in: '${guestInput}'.`
          );
        }
      }

      // Identify targets: one or many reservationDetailIds
      const targetDetailIds = (
        groupContext?.isGroup && applyToAllSelected
          ? groupContext.detailIds
          : [bookingDetail?.reservationDetailID]
      ).filter(Boolean) as number[];

      // For a smoother UX, upload + link + check-in for each target in sequence (or you can Promise.allSettled if your API is okay with bursts)
      let successCount = 0;

      for (const detailId of targetDetailIds) {
        // Upload attachments for this detail
        if (idNumberAttachmentPreviews.length || attachmentPreviews.length) {
          await uploadAllAttachmentsForDetail(detailId);
        }
        console.log("newGuestProfile 6", guestProfileId);
        // Link guest to this reservation detail (non-blocking errors)
        if (guestProfileId) {
          try {
            await dispatch(
              createGuestProfileByRoom({
                finAct: true,
                guestProfileId,
                reservationDetailId: detailId,
                createdBy: fullName || "system",
              })
            ).unwrap();
            console.log("newGuestProfile 7");
            await createLogSafe(
              `Linked guestProfileId=${guestProfileId} to reservationDetailId=${detailId}.`
            );
          } catch (e) {
            console.warn("Link guest failed (non-blocking):", e);
          }
        }
        console.log("newGuestProfile 8");
        // Check-in payload (no controller call now – handled elsewhere / server logic as needed)
        const checkInPayload = {
          reservationDetailId: detailId,
          reservationStatusId: 4,
          checkINat: new Date().toISOString(),
          checkedInBy: fullName || "System",
          guestProfileId,
          isRepeatGuest: bookingDetail?.isRepeatGuest || isRepeatGuest || false,
        };
        console.log("newGuestProfile 9", checkInPayload);
        console.log("checkInPayload : ", checkInPayload);

        // No checkInReservationDetail controller call here anymore

        await createLogSafe(
          `Checked in reservationDetailId=${detailId} (reservationId=${bookingDetail?.reservationID}) for guest='${guestInput}'.`
        );

        // Set housekeeping to Occupied (best-effort)
        try {
          const resolvedRoomId =
            bookingDetail?.roomID ??
            bookingDetail?.roomId ??
            bookingDetail?.roomNoId ??
            null;

          if (resolvedRoomId) {
            const hk = await dispatch(
              updateHousekeepingStatus({
                id: Number(resolvedRoomId),
                housekeepingStatus: "Occupied",
              })
            ).unwrap();

            if (hk == null) {
              await createLogSafe(
                `Housekeeping set to 'Occupied' for roomId=${resolvedRoomId} (204 No Content).`
              );
            } else {
              await createLogSafe(
                `Housekeeping updated → roomId=${
                  hk.roomID ?? hk.id ?? resolvedRoomId
                }, status='${hk.housekeepingStatus ?? "Occupied"}'`
              );
            }
          } else {
            await createLogSafe(
              "Housekeeping not updated: roomId could not be resolved."
            );
          }
        } catch (e: any) {
          const httpStatus = e?.response?.status;
          const apiMsg = e?.response?.data?.message || e?.message;
          toast.message("Housekeeping status not updated", {
            description: apiMsg || "Please update manually.",
          });
          await createLogSafe(
            `Failed to set housekeeping to 'Occupied' for reservationDetailId=${detailId}. ${
              httpStatus ? "HTTP " + httpStatus + ". " : ""
            }${apiMsg ?? ""}`
          );
        }

        successCount++;
      }

      // Done
      toast.success(
        successCount > 1
          ? `Checked in ${successCount} rooms successfully`
          : "Guest checked in successfully!",
        { duration: 3000 }
      );
      setIsCheckedInLocal(true);

      try {
        if (typeof onClose === "function") await onClose();
      } catch (e) {
        console.warn("onClose failed (non-blocking):", e);
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("Failed to complete check-in. Please try again.", {
        duration: 3000,
      });
      setIsSubmitting(false);
    }
  }

  // Handler for file attachment change (multiple files)
  function handleAttachmentChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 15 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum file size is 15MB.`);
          return;
        }

        const fileType = file.type;
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setAttachmentPreviews((prev) => [
            ...prev,
            result, // Store the full data URL for preview
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
    event.target.value = "";
  }

  // Handler for ID Number attachment change (separate from general attachments)
  function handleIdNumberAttachmentChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 15 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum file size is 15MB.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;

          // For PDF files, we'll show a placeholder SVG but store the actual data
          if (file.type === "application/pdf") {
            const pdfPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120" viewBox="0 0 100 120"><rect width="100%" height="100%" fill="%23f2f2f2"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23333" text-anchor="middle" dominant-baseline="middle">${file.name}</text></svg>`;

            setIdNumberAttachmentPreviews((prev) => [...prev, pdfPlaceholder]);
          } else {
            setIdNumberAttachmentPreviews((prev) => [...prev, result]);
          }
        };

        reader.readAsDataURL(file);
      });
    }
    event.target.value = "";
  }

  function handleSecondIdAttachmentChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 15 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum file size is 15MB.`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          if (file.type === "application/pdf") {
            const pdfPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="120" viewBox="0 0 100 120"><rect width="100%" height="100%" fill="%23f2f2f2"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23333" text-anchor="middle" dominant-baseline="middle">${file.name}</text></svg>`;
            setSecondIdNumberAttachmentPreviews((prev) => [
              ...prev,
              pdfPlaceholder,
            ]);
          } else {
            setSecondIdNumberAttachmentPreviews((prev) => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    event.target.value = "";
  }

  return (
    <>
      <ScrollArea className="h-full">
        <div className="space-y-4 px-[10px]">
          {/* Form Header */}
          <div className="flex flex-row justify-between">
            <h3 className="text-lg font-semibold">{checkInFormText}</h3>
            <Button
              variant="secondary"
              size="sm"
              className="shadow-sm"
              onClick={openQR}
              disabled={!bookingDetail?.reservationDetailID}
              title="Show reservation QR"
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR
            </Button>
          </div>

          {groupContext?.isGroup &&
            (groupContext.selectedRooms?.length ?? 0) > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      Group check-in • {groupContext.selectedRooms!.length} room
                      {groupContext.selectedRooms!.length > 1 ? "s" : ""}
                    </div>
                    <div className="text-xs opacity-80">
                      The details you fill below can be applied to all selected
                      rooms.
                    </div>
                  </div>
                  <label className="text-xs inline-flex items-center gap-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={applyToAllSelected}
                      onChange={(e) => setApplyToAllSelected(e.target.checked)}
                    />
                    Apply to all
                  </label>
                </div>

                {/* 👇 room number + type chips */}
                <div className="max-h-24 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {groupContext.selectedRooms!.map((r) => (
                    <div
                      key={r.reservationDetailID}
                      className="text-xs px-2 py-1 rounded border bg-white dark:bg-zinc-900 flex items-center gap-1"
                      title={`Room ${r.roomNumber ?? "—"} • ${
                        r.roomType ?? "Room"
                      }`}
                    >
                      <span className="font-medium">{r.roomNumber ?? "—"}</span>
                      <span className="opacity-70">
                        • {r.roomType ?? "Room"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Guest Details Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="flex gap-2">
                <div className="w-40">
                  <Label htmlFor="title">Title</Label>
                  <select
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                  >
                    <option value="">Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>
                <div className="flex-1 relative">
                  <Label htmlFor="guestName">
                    {useTranslatedText("Guest Name")}
                  </Label>
                  <Input
                    id="guestName"
                    value={guestInput}
                    onChange={(e) => {
                      setGuestInput(e.target.value);
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowSuggestions(guestInput.length > 0)}
                    onBlur={() =>
                      setTimeout(() => setShowSuggestions(false), 200)
                    }
                    autoComplete="off"
                  />
                  {showSuggestions && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded hover:bg-gray-300 hover:text-white shadow max-h-40 overflow-y-auto">
                      {guestData
                        .filter(
                          (guest) =>
                            guest.guestName
                              .toLowerCase()
                              .includes(guestInput.toLowerCase()) &&
                            guest.guestName.toLowerCase() !==
                              guestInput.toLowerCase()
                        )
                        .map((guest, index) => (
                          <div
                            key={index}
                            className="px-3 py-1 dark:bg-black dark:text-white  cursor-pointer text-sm"
                            onClick={() => {
                              setGuestInput(guest.guestName);
                              setTitle(guest.title || "");
                              setDob(guest.dob ? guest.dob.split("T")[0] : "");
                              setAddress(guest.address || "");
                              setCity(guest.city || "");
                              setZipCode(guest.zipCode || "");
                              setCountry(guest.country || "");
                              setNationality(guest.nationality || "");
                              setIdNumber(guest.ppNo || "");
                              setIsRepeatGuest(true);
                              setShowSuggestions(false);
                            }}
                          >
                            {`${guest.guestName} - ${guest.ppNo || ""} - ${
                              guest.email || ""
                            }`}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Date of Birth Section with Year, Month, Day split */}
            {/* DOB + Country with 3:2 Grid */}
            <div className="col-span-2 grid grid-cols-5 gap-4">
              {/* DOB (3/5 width) */}
              <div className="col-span-3 space-y-2">
                <Label>Date of Birth</Label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Year */}
                  <div className="col-span-1">
                    <Input
                      type="number"
                      placeholder="Year"
                      value={dob.split("-")[0] || ""}
                      onChange={(e) => {
                        const year = e.target.value.slice(0, 4);
                        const [, m = "", d = ""] = (dob || "--").split("-");
                        setDob(`${year}-${m}-${d}`);
                      }}
                    />
                  </div>

                  {/* Month */}
                  <div className="col-span-1">
                    <select
                      className="w-full border rounded-md p-2 text-sm"
                      value={dob.split("-")[1] || ""}
                      onChange={(e) => {
                        const month = e.target.value.padStart(2, "0");
                        const [y = "", , d = ""] = (dob || "--").split("-");
                        setDob(`${y}-${month}-${d}`);
                      }}
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Day */}
                  <div className="col-span-1">
                    <select
                      className="w-full border rounded-md p-2 text-sm"
                      value={dob.split("-")[2] || ""}
                      onChange={(e) => {
                        const day = e.target.value.padStart(2, "0");
                        const [y = "", m = ""] = (dob || "--").split("-");
                        setDob(`${y}-${m}-${day}`);
                      }}
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = String(i + 1).padStart(2, "0");
                        return (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Country (2/5 width) */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                >
                  <option value="">Select Country</option>
                  {(countryListFromWalkIn?.length
                    ? countryListFromWalkIn
                    : countryList
                  ).map((c, idx) => (
                    <option key={idx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-1 space-y-2">
              <Label htmlFor="email">{emailText}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="col-span-1 space-y-2">
              <Label htmlFor="phone">{phoneText}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="col-span-1 space-y-2">
              <Label htmlFor="idType">{idTypeText}</Label>
              <select
                id="idType"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="h-10 w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
              >
                <option value="">Select ID Type</option>
                <option value="National ID">National ID</option>
                <option value="Passport">Passport</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Business ID">Business ID</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-span-1 space-y-2">
              <Label htmlFor="idNumber">{idNumberText}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter ID number"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() =>
                    document.getElementById("idNumberAttachment")?.click()
                  }
                  variant="default"
                  size="sm"
                  className="ml-2 whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" /> Upload ID
                </Button>
                <Input
                  id="idNumberAttachment"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleIdNumberAttachmentChange}
                  className="hidden"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Upload scanned copy of ID document (passport, driver's license,
                etc.)
              </div>
              {/* Render previews for idNumberAttachment uploads only */}
              {idNumberAttachmentPreviews.length > 0 && (
                <div className="flex flex-wrap mt-2">
                  {idNumberAttachmentPreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative w-max group mt-2 inline-block mr-2"
                    >
                      <img
                        src={preview}
                        alt={`ID Attachment ${index + 1}`}
                        className="max-h-48 rounded border"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setIdNumberAttachmentPreviews((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="col-span-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              >
                {showAdditionalDetails
                  ? "Hide Additional Fields"
                  : "Show Additional Fields"}
              </button>
            </div>
            {showAdditionalDetails && (
              <>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2">
                  <Checkbox
                    id="repeatGuest"
                    checked={isRepeatGuest}
                    onCheckedChange={(checked) => setIsRepeatGuest(!!checked)}
                  />
                  <Label htmlFor="repeatGuest" className="text-sm">
                    Repeat Guest
                  </Label>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="attachment">Attachment</Label>
                  <Input
                    id="attachment"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAttachmentChange}
                  />
                  {attachmentPreviews.length > 0 && (
                    <div className="flex flex-wrap mt-2">
                      {attachmentPreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative w-max group mt-2 inline-block mr-2"
                        >
                          <img
                            src={preview}
                            alt={`Attachment ${index + 1}`}
                            className="max-h-48 rounded border"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAttachmentPreviews((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            {!showAdditionalDetails && (
              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="repeatGuest"
                  checked={isRepeatGuest}
                  onCheckedChange={(checked) => setIsRepeatGuest(!!checked)}
                />
                <Label htmlFor="repeatGuest" className="text-sm">
                  Repeat Guest
                </Label>
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">{specialRequestsText}</Label>
            <Textarea
              id="specialRequests"
              className="min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              key="cancel"
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleCheckIn}
              key="complete-check-in"
              disabled={isSubmitting || fileUploadLoading}
            >
              {isSubmitting || fileUploadLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                  {fileUploadLoading
                    ? "Uploading attachments..."
                    : "Checking in..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {groupContext?.isGroup && applyToAllSelected
                    ? `Check-in ${selectedCount} room${
                        selectedCount > 1 ? "s" : ""
                      }`
                    : "Complete Check-in"}
                </>
              )}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
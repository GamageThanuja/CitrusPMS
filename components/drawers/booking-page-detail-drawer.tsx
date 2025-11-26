"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Building,
  CalendarClock,
  CreditCard,
  History,
  Info,
  MessageSquare,
  Send,
  User,
  Users,
  Trash2,
  CheckCircle,
  Baby,
  MoreVertical,
  FileChartColumnIncreasing,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useDispatch, useSelector } from "react-redux";
import { useAppDispatch } from "@/redux/hooks";
import {
  clearReservation,
  fetchReservationById,
  markReservationAsNoShow,
  cancelRoomReservation,
} from "@/redux/slices/reservationSlice";
import { fetchRateDetailsById } from "@/redux/slices/rateDetailsSlice";
import { RootState } from "@/redux/store";
import {
  fetchFolioByDetailId,
  selectFolioByDetailIdData,
  selectFolioByDetailIdLoading,
} from "@/redux/slices/fetchFolioByDetailIdSlice";
import { fetchTransactions } from "@/redux/slices/transactionSlice";
import { getReservationById } from "@/controllers/reservationController";
import { getGuestProfileById } from "@/controllers/guestProfileMasterController";
import { getReservationAttachments } from "@/controllers/reservationAttachmentController";
import {
  cancelReservation,
  cancelReservationRoom,
} from "@/controllers/ReservationRoomController";
import { fetchGuestProfileMasterById } from "@/redux/slices/guestProfileSlice";
import { fetchReservationAttachment } from "@/redux/slices/fetchReservationAttachmentSlice";
import { useCurrency } from "@/hooks/useCurrency";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { RoomListReportDrawer } from "@/components/drawers/roomList-report-drawer";

// Import all drawer components
import { CheckInFormDrawer } from "@/components/drawers/check-in-form-drawer";
import { CheckOutFormDrawer } from "@/components/drawers/check-out-form-drawer";
import { ExtendDrawer } from "@/components/drawers/extend-drawer";
import { ShortenDrawer } from "@/components/drawers/shorten-drawer";
import { PostChargesDrawer } from "@/components/drawers/post-charges-drawer";
import { PostCreditDrawer } from "@/components/drawers/post-credit-drawer";
import { TakePaymentsDrawer } from "@/components/drawers/take-payments-drawer";
import { AmendDrawer } from "@/components/drawers/amend-drawer";
import { CashPayoutDrawer } from "@/components/drawers/cash-payout-drawer";
import { RoomChangeDrawer } from "@/components/drawers/room-change-drawer";
import { CancelBookingDrawer } from "@/components/drawers/cancel-booking-drawer";
import { NoShowDrawer } from "@/components/drawers/noShow-drawer";
import {
  cancelReservationDetail,
  resetCancelState,
} from "@/redux/slices/cancelReservationDetailSlice";
import {
  cancelReservation as cancelReservationByRoomThunk,
  resetCancelReservationState,
} from "@/redux/slices/cancelReservationByRoomSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AddRoomNumberDrawer from "./add-room-number-drawer";
import { fetchHotelRoomTypes } from "@/redux/slices/hotelRoomTypesSlice";
import { useAppSelector } from "@/redux/hooks";
import { uniqBy } from "lodash";
import {
  fetchFetchedReservationActivityLogs,
  selectFetchedReservationActivityLogs,
  selectFetchedReservationActivityLoading,
  selectFetchedReservationActivityError,
  selectFetchedReservationActivityPagination,
  setFetchedReservationActivityPage,
  setFetchedReservationActivityPageSize,
} from "@/redux/slices/fetchedReservationActivityLogSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface BookingPageDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingDetail: any;
  text: {
    bookingDetailsText: string;
    roomDetailsText: string;
    roomText: string;
    totalText: string;
    customerDetailsText: string;
    nameText: string;
    phoneText: string;
    emailText: string;
    idTypeText: string;
    idNumberText: string;
    notesText: string;
    addNoteText: string;
    expensesText: string;
    revisionsText: string;
    messageGuestText: string;
  };
  onCancelBookingClick?: () => void;
  guestProfileData?: any;
  countryListFromWalkIn?: string[];
}

type NoShowConfirmArgs = {
  detailIds?: number[];
  reason: string;
  withSurcharges: boolean;
  amount?: number;
  currency?: string;
};

export default function BookingPageDetailsDrawer({
  open,
  onOpenChange,
  bookingDetail,
  text,
  onCancelBookingClick,
  guestProfileData,
  countryListFromWalkIn,
  isBookingPageView,
}: BookingPageDetailsDrawerProps) {
  // Ensure client-only logic is guarded
  if (!bookingDetail || !bookingDetail.reservationID) {
    return null;
  }
  const appDispatch = useAppDispatch();
  const shouldRender = typeof window !== "undefined";

  const {
    data: hotelRoomTypesData = [],
    loading: hotelRoomTypesLoading,
    error: hotelRoomTypesError,
  } = useAppSelector((s: RootState) => s.hotelRoomTypes || {});

  // fetch once (or when drawer opens)
  useEffect(() => {
    appDispatch(fetchHotelRoomTypes());
  }, [appDispatch]);

  // State for attachment management
  const [booking, setBooking] = useState<any>(bookingDetail);
  const reservationDetailId = bookingDetail?.reservationDetailID;
  const reservationId = bookingDetail?.reservationID;
  const [bookingData, setBookingData] = useState<any>(null);

  // All drawer states
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [shortenOpen, setShortenOpen] = useState(false);
  const [postChargesOpen, setPostChargesOpen] = useState(false);
  const [postCreditOpen, setPostCreditOpen] = useState(false);
  const [takePaymentsOpen, setTakePaymentsOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [cashPayoutOpen, setCashPayoutOpen] = useState(false);
  const [roomChangeOpen, setRoomChangeOpen] = useState(false);
  const [cancelBookingOpen, setCancelBookingOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Modal states
  const [recallModalOpen, setRecallModalOpen] = useState(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Booking states for each action
  const [checkInBooking, setCheckInBooking] = useState(null);
  const [checkOutBooking, setCheckOutBooking] = useState(null);
  const [extendBooking, setExtendBooking] = useState(null);
  const [shortenBooking, setShortenBooking] = useState(null);
  const [postChargesBooking, setPostChargesBooking] = useState(null);
  const [postCreditBooking, setPostCreditBooking] = useState(null);
  const [takePaymentsBooking, setTakePaymentsBooking] = useState(null);
  const [amendBooking, setAmendBooking] = useState(null);
  const [cashPayoutBooking, setCashPayoutBooking] = useState(null);
  const [roomChangeBooking, setRoomChangeBooking] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [noShowBooking, setNoShowBooking] = useState(null);
  const [recallBooking, setRecallBooking] = useState(null);
  const [rollbackBooking, setRollbackBooking] = useState(null);
  const [confirmAction, setConfirmAction] = useState<null | {
    type: "remove" | "revoke";
    reservationDetailId: number;
  }>(null);

  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [tabValue, setTabValue] = useState<"rooming" | "activity">("rooming");
  const [selectedDetailIds, setSelectedDetailIds] = useState<number[]>([]);
  const [openReportDrawer, setOpenReportDrawer] = useState(false);

  const handleReportDrawerClose = () => setOpenReportDrawer(false);

  function openDrawerFromGroup(label: string, rooms: any[]) {
    if (!rooms.length) return;

    const firstPayload = buildPayload(rooms[0], bookingData);

    // For drawers that should remain single-target (example: EDIT, ROOM CHANGE),
    // keep it strict; you can relax this later if your drawer supports multiple.
    const singleOnly = new Set(["EDIT", "ROOM CHANGE"]);

    // set group context so drawers can branch UI
    setGroupContext({
      isGroup: true,
      detailIds: rooms.map((r) => r.reservationDetailID),
      actionLabel: label,
      selectedRooms: rooms.map((r) => ({
        reservationDetailID: r.reservationDetailID,
        roomNumber: r.roomNumber,
        roomType: r.roomType,
        guest1: r.guest1,
      })),
    });

    switch (label) {
      case "CHECK-IN":
        setCheckInBooking(firstPayload);
        setCheckInOpen(true);
        break;
      case "CHECK-OUT":
        setCheckOutBooking(firstPayload);
        setCheckOutOpen(true);
        break;
      case "CANCEL BOOKING":
        setCancelBooking(firstPayload);
        setCancelBookingOpen(true);
        break;
      case "NO SHOW":
        setNoShowBooking(firstPayload);
        setNoShowOpen(true);
        break;
      case "EXTEND":
        setExtendBooking(firstPayload);
        setExtendOpen(true);
        break;
      case "SHORTEN":
        setShortenBooking(firstPayload);
        setShortenOpen(true);
        break;
      case "ROOM CHANGE":
        if (rooms.length > 1) {
          toast.error("Room Change supports one room at a time.");
          return;
        }
        setRoomChangeBooking(firstPayload);
        setRoomChangeOpen(true);
        break;
      case "POST CHARGES":
        setPostChargesBooking(firstPayload);
        setPostChargesOpen(true);
        break;
      case "POST CREDIT/ DISCOUNT":
        setPostCreditBooking(firstPayload);
        setPostCreditOpen(true);
        break;
      case "TAKE PAYMENTS":
        setTakePaymentsBooking(firstPayload);
        setTakePaymentsOpen(true);
        break;
      case "CASH PAYOUT":
        setCashPayoutBooking(firstPayload);
        setCashPayoutOpen(true);
        break;
      case "RECALL":
        setRecallBooking(firstPayload);
        setRecallModalOpen(true);
        break;
      case "ROLLBACK":
        setRollbackBooking(firstPayload);
        setRollbackModalOpen(true);
        break;
      case "EDIT":
        if (rooms.length > 1) {
          toast.error("Edit supports one room at a time.");
          return;
        }
        setAmendBooking(firstPayload);
        setAmendOpen(true);
        break;
    }
  }

  function buildPayload(room: any, bookingData: any) {
    return {
      ...room,
      reservationDetailID: room.reservationDetailID,
      reservationNo: bookingData?.reservationNo,
      reservationID: bookingData?.reservationID,
      roomID: room.roomID,
      guest: room.guest1 || room.guestName,
      roomNumber: room.roomNumber,
      checkOut: room.resCheckOut || room.checkOut,
      mealPlan: room.mealPlan,
      bookerFullName: bookingData?.bookerFullName,
      phone: bookingData?.phone,
      email: bookingData?.email,
      currencyCode: bookingData?.currencyCode,
      sourceOfBooking: bookingData?.sourceOfBooking,
      resCheckIn: bookingData?.resCheckIn,
      resCheckOut: bookingData?.resCheckOut,
      guest1: bookingData?.rooms?.[0]?.guest1,
    };
  }

  function getGroupActionOptions(detailIds: number[]) {
    const rooms: any[] = (bookingData?.rooms ?? []).filter((r: any) =>
      detailIds.includes(r.reservationDetailID)
    );

    if (rooms.length === 0) return [];

    // Start from the first room's actions
    const firstOpts = getActionOptions(rooms[0]).map((o) => o.label);

    // Keep only labels that exist for all other rooms
    const intersection = rooms.slice(1).reduce<string[]>((acc, room) => {
      const labels = new Set(getActionOptions(room).map((o) => o.label));
      return acc.filter((l) => labels.has(l));
    }, firstOpts);

    // Return actions with onClick that fire group-aware drawers
    return intersection.map((label) => {
      return {
        label,
        onClick: () => openDrawerFromGroup(label, rooms),
      };
    });
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

  const [groupContext, setGroupContext] = useState<GroupContext>(null);

  // handy togglers
  const toggleSelectRoom = (detailId: number, checked: boolean) => {
    setSelectedDetailIds((prev) =>
      checked
        ? Array.from(new Set([...prev, detailId]))
        : prev.filter((id) => id !== detailId)
    );
  };

  useEffect(() => {
    if (!open) {
      setSelectedDetailIds([]);
    }
  }, [open]);

  // INITIAL “select all” once rooms are loaded while drawer is open
  useEffect(() => {
    if (!open) return;

    const ids =
      (bookingData?.rooms ?? [])
        .map((r: any) => Number(r?.reservationDetailID))
        .filter((id) => Number.isFinite(id)) || [];

    // only auto-select if nothing picked yet
    if (ids.length && selectedDetailIds.length === 0) {
      setSelectedDetailIds(ids);
    }
  }, [open, bookingData?.rooms, selectedDetailIds.length]);

  const clearSelection = () => setSelectedDetailIds([]);

  const roomTypeOptions = useMemo(() => {
    // 1) From reservation.rooms (if present)
    const fromReservation =
      bookingData?.rooms
        ?.map((r: any) => {
          // Normalize ID field across possible shapes
          const id =
            Number(
              r?.hotelRoomTypeId ??
                r?.hotelRoomTypeID ??
                r?.roomTypeId ??
                r?.roomTypeID
            ) || 0;

          const name = String(
            r?.roomType || r?.hotelRoomType?.roomType || ""
          ).trim();

          return id && name ? { id, name } : null;
        })
        .filter(Boolean) ?? [];

    // 2) From master list (Redux)
    const fromMaster = (
      Array.isArray(hotelRoomTypesData) ? hotelRoomTypesData : []
    )
      .map((t: any) => {
        const id =
          Number(t?.hotelRoomTypeID ?? t?.hotelRoomTypeId ?? t?.id) || 0;
        const name = String(
          t?.roomType || t?.name || t?.description || ""
        ).trim();
        return id && name ? { id, name } : null;
      })
      .filter(Boolean) as { id: number; name: string }[];

    // Union & dedupe by id, then sort by name
    const union = uniqBy([...(fromReservation as any[]), ...fromMaster], "id")
      .filter((x) => x.id && x.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    return union;
  }, [bookingData, hotelRoomTypesData]);

  console.log("roomTypeOptions : ", roomTypeOptions);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    kind?: "remove" | "revoke";
    reservationDetailId?: number;
    roomLabel?: string;
  }>(() => ({ open: false }));

  // Other states
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [extendedCheckOut, setExtendedCheckOut] = useState<string | null>(null);
  const [shortenedCheckOut, setShortenedCheckOut] = useState<string | null>(
    null
  );

  const {
    loading: cancelLoading,
    success: cancelSuccess,
    error: cancelError,
  } = useSelector((s: RootState) => s.cancelReservationByRoom);

  // Check if any sub-drawer is open for sliding effect
  const anySubDrawerOpen =
    checkInOpen ||
    checkOutOpen ||
    extendOpen ||
    shortenOpen ||
    postChargesOpen ||
    postCreditOpen ||
    takePaymentsOpen ||
    amendOpen ||
    cashPayoutOpen ||
    roomChangeOpen ||
    cancelBookingOpen ||
    noShowOpen;

  console.log("Booking Data 🏀🏀🏀 :", bookingData);

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
    if (!reservationId || !open) return;
    (async () => {
      const data = await fetchReservationDataById(reservationId);
      if (data) setBookingData(data);
    })();
  }, [reservationId, open]);

  // Use both dispatches for compatibility
  const dispatch = useDispatch();

  useEffect(() => {
    if (reservationId) {
      dispatch(fetchReservationById(reservationId));
    }
    return () => {
      dispatch(clearReservation());
    };
  }, [dispatch, reservationId]);

  useEffect(() => {
    if (bookingDetail) {
      setBooking(bookingDetail);
    }
  }, [bookingDetail, dispatch]);

  useEffect(() => {
    // Keep bookingData cached; just refresh lightweight fields.
    if (open && bookingDetail) {
      setBooking(bookingDetail);
    }
    if (!open) {
      // optional: clear transient UI bits only, but NOT bookingData
      setBooking(null);
      setGuestProfile(null);
      setGuestProfileId(null);
      setSelectedDetailIds([]);
    }
  }, [open, bookingDetail]);

  const isRoomCancelled = (room: any) => {
    const statusText =
      room?.reservationStatusMaster?.reservationStatus?.toLowerCase?.() || "";
    const statusId = room?.reservationStatusMaster?.reservationStatusID;
    return statusText === "cancelled" || statusId === 5;
  };

  const handleRevokeRoom = async (reservationDetailId: number) => {
    if (!reservationDetailId) return;
    try {
      setRemovingId(reservationDetailId);
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

      const result = await dispatch(
        cancelReservationByRoomThunk({
          reservationDetailId,
          reservationId, // keep same shape
          reservationStatusId: 1, // ✅ revoke to Confirmed
          status: "Confirmed", // ✅ human-readable status
          cancelReason: "Revoked cancellation", // reuse payload field
          cancelledBy: userInfo?.name || "System",
          cancelledOn: new Date().toISOString(),
        })
      );

      if (cancelReservationByRoomThunk.fulfilled.match(result)) {
        toast.success("Room cancellation revoked (status: Confirmed).");
        if (reservationId) {
          await dispatch(fetchReservationById(reservationId));
        }
        await Promise.allSettled([
          dispatch(fetchFolioByDetailId(reservationDetailId)),
          dispatch(fetchRateDetailsById(reservationDetailId)),
        ]);
      } else {
        throw new Error(
          (result.payload as string) || "Failed to revoke cancellation"
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke cancellation");
    } finally {
      setRemovingId(null);
      dispatch(resetCancelReservationState());
    }
  };

  useEffect(() => {
    if (reservationId) {
      dispatch(fetchRateDetailsById(reservationDetailId));
    }
  }, [reservationId, dispatch]);

  const { data: folioItem } = useSelector((state: RootState) => state.folio || {});

  useEffect(() => {
    if (reservationId) {
      dispatch(fetchFolioByDetailId(reservationDetailId));
    }
  }, [reservationId, dispatch]);

  const selectedProperty =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("selectedProperty") || "{}")
      : {};
  const hotelId = selectedProperty?.id;
  const hotelCode = selectedProperty?.hotelCode;

  useEffect(() => {
    if (hotelCode && reservationId && reservationDetailId) {
      dispatch(
        fetchTransactions({
          hotelCode,
          reservationId,
          reservationDetailId,
          tranTypeId: 17,
        })
      );
    }
  }, [dispatch, hotelCode, reservationId, reservationDetailId]);

  const hotelCurrency = useCurrency();
  const { fullName } = useUserFromLocalStorage();

  const rateDetails = useSelector((state: RootState) => state.rateDetails.data);

  useEffect(() => {
    console.log("Updated Redux rateDetails:", rateDetails);
  }, [rateDetails]);

  const [guestProfileId, setGuestProfileId] = useState<number | null>(
    bookingDetail?.guestProfileId ?? null
  );

  const [guestProfile, setGuestProfile] = useState<any | null>(null);

  useEffect(() => {
    if (reservationDetailId) {
      dispatch(fetchReservationAttachment(reservationId));
    }
  }, [reservationDetailId]);

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
      } catch (err) {
        console.error("Failed to load room guest profiles:", err);
      }
    };
    fetchRoomGuestProfiles();
  }, [reservationDetailId]);

  useEffect(() => {
    const fetchReservationDetails = async () => {
      if (!reservationId) return;
      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("hotelmateTokens")
            : null;
        const token = storedToken ? JSON.parse(storedToken).accessToken : null;
        const data = await getReservationById({
          token,
          reservationId: reservationId,
        });
        setGuestProfileId(data?.guestProfileId ?? null);
      } catch (error) {
        console.error("Failed to fetch reservation details:", error);
      }
    };
    fetchReservationDetails();
  }, [reservationId]);

  console.log("guest profile detail : ", bookingData);

  useEffect(() => {
    const fetchGuestProfile = async () => {
      setGuestProfile(null);
      if (!guestProfileId) return;
      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("hotelmateTokens")
            : null;
        const token = storedToken ? JSON.parse(storedToken).accessToken : null;
        const data = await getGuestProfileById({
          token,
          profileId: guestProfileId,
        });
        setGuestProfile(data);
      } catch (error) {
        console.error("Failed to fetch guest profile:", error);
      }
    };
    fetchGuestProfile();
  }, [guestProfileId, reservationDetailId]);

  useEffect(() => {
    const fetchAttachmentById = async () => {
      if (!reservationDetailId || isNaN(Number(reservationDetailId))) {
        return;
      }
      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("hotelmateTokens")
            : null;
        const token = storedToken ? JSON.parse(storedToken).accessToken : null;
        if (!token) throw new Error("Token not found");
        const data = await getReservationAttachments({
          token,
          reservationDetailId,
        });
      } catch (err) {
        console.error("Failed to fetch reservation detail attachments:", err);
      }
    };
    fetchAttachmentById();
  }, [reservationDetailId]);

  // Handler functions for drawer completion
  const handleCheckInComplete = () => {
    if (reservationId) {
      dispatch(fetchReservationById(reservationId));
    }
    setCheckInOpen(false);
  };

  const handleCheckOutComplete = () => {
    if (reservationId) {
      dispatch(fetchReservationById(reservationId));
    }
    setCheckOutOpen(false);
  };

  const handleExtendStay = (newDate: string, rate: string) => {
    if (booking) {
      const updatedBooking = {
        ...booking,
        checkOut: newDate,
      };
      setBooking(updatedBooking);
      setExtendedCheckOut(newDate);
      if (reservationId) {
        dispatch(fetchReservationById(reservationId));
      }
      if (reservationDetailId) {
        dispatch(fetchFolioByDetailId(reservationDetailId));
      }
    }
  };

  const handleShortenStay = (newDate: string) => {
    if (booking) {
      const updatedBooking = {
        ...booking,
        checkOut: newDate,
      };
      setBooking(updatedBooking);
      setShortenedCheckOut(newDate);
      if (reservationId) {
        dispatch(fetchReservationById(reservationId));
      }
      if (reservationDetailId) {
        dispatch(fetchFolioByDetailId(reservationDetailId));
      }
    }
  };

  const handlePostChargesComplete = () => {
    if (reservationDetailId) {
      dispatch(fetchFolioByDetailId(reservationDetailId));
    }
    dispatch(
      fetchTransactions({
        hotelCode: hotelCode,
        reservationId: reservationId,
        reservationDetailId: reservationDetailId,
        tranTypeId: 17,
      })
    );
    setPostChargesOpen(false);
  };

  const handlePostCreditComplete = () => {
    if (reservationDetailId) {
      dispatch(fetchFolioByDetailId(reservationDetailId));
    }
    dispatch(
      fetchTransactions({
        hotelCode: hotelCode,
        reservationId: reservationId,
        reservationDetailId: reservationDetailId,
        tranTypeId: 17,
      })
    );
    setPostCreditOpen(false);
  };

  const handleTakePaymentsComplete = () => {
    if (reservationDetailId) {
      dispatch(fetchFolioByDetailId(reservationDetailId));
    }
    dispatch(
      fetchTransactions({
        hotelCode: hotelCode,
        reservationId: reservationId,
        reservationDetailId: reservationDetailId,
        tranTypeId: 17,
      })
    );
    setTakePaymentsOpen(false);
  };

  const handleCashPayoutComplete = () => {
    if (reservationDetailId) {
      dispatch(fetchFolioByDetailId(reservationDetailId));
    }
    dispatch(
      fetchTransactions({
        hotelCode: hotelCode,
        reservationId: reservationId,
        reservationDetailId: reservationDetailId,
        tranTypeId: 17,
      })
    );
    setCashPayoutOpen(false);
  };

  const handleAmendComplete = () => {
    if (reservationId) {
      dispatch(fetchReservationById(reservationId));
    }
    if (reservationDetailId) {
      dispatch(fetchFolioByDetailId(reservationDetailId));
      dispatch(fetchRateDetailsById(reservationDetailId));
    }
    if (guestProfileId) {
      dispatch(fetchGuestProfileMasterById(guestProfileId));
    }
    setAmendOpen(false);
  };

  const handleRoomChangeComplete = () => {
    if (reservationId) {
      dispatch(fetchReservationById(reservationId));
    }
    if (reservationDetailId) {
      dispatch(fetchFolioByDetailId(reservationDetailId));
      dispatch(fetchRateDetailsById(reservationDetailId));
    }
    setRoomChangeOpen(false);
  };

  // booking-page-detail-drawer.tsx (inside component)

  // booking-page-details-drawer.tsx

  // booking-page-details-drawer.tsx

  const handleNoShowComplete = async (args?: {
    detailIds?: number[];
    reason: string;
    withSurcharges: boolean;
    amount?: number;
    currency?: string;
  }) => {
    const targetIds = args?.detailIds?.length
      ? args.detailIds
      : reservationDetailId
      ? [reservationDetailId]
      : [];

    if (!targetIds.length) {
      toast.error("No reservation detail ID available");
      return;
    }

    // Prefer the real resCheckIn for the transaction
    const checkInISO =
      bookingData?.resCheckIn ||
      bookingData?.rooms?.[0]?.resCheckIn ||
      new Date().toISOString();

    setIsMarkingNoShow(true);
    try {
      const results = await Promise.allSettled(
        targetIds.map((id) =>
          dispatch(
            markReservationAsNoShow({
              reservationDetailId: id,
              reason: args?.reason ?? "",
              withSurcharges: !!args?.withSurcharges,
              amount: args?.amount,
              currency: args?.currency || hotelCurrency, // fallback to property currency
              createdBy: fullName || "System",
              checkInDateISO: checkInISO,
              // Optional: feed account ids if your property config has them:
              // drAccId: selectedProperty?.noShowDrAccId,
              // crAccId: selectedProperty?.noShowCrAccId,
            })
          )
        )
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const bad = results.length - ok;

      if (ok) {
        toast.success(`Marked ${ok} room${ok > 1 ? "s" : ""} as No Show`);
        if (reservationId) await dispatch(fetchReservationById(reservationId));
        await Promise.allSettled(
          targetIds.flatMap((id) => [
            dispatch(fetchFolioByDetailId(id)),
            dispatch(fetchRateDetailsById(id)),
          ])
        );
        setNoShowOpen(false);
      }
      if (bad) toast.error("Some rooms failed to mark as No Show");
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  function Timeline({ logs }: { logs: any[] }) {
    // sort oldest → newest for a natural “growing” line
    const items = [...logs].sort(
      (a, b) =>
        new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()
    );

    // helper: choose color/icon by action text (like your screenshot)
    const getKind = (txt: string) => {
      const t = (txt || "").toLowerCase();
      if (t.includes("created")) return { bg: "bg-blue-600", label: "Created" };
      if (t.includes("email")) return { bg: "bg-sky-600", label: "Email" };
      if (t.includes("web-hook") || t.includes("webhook"))
        return { bg: "bg-indigo-600", label: "Webhook" };
      if (t.includes("revision received") || t.includes("feed"))
        return { bg: "bg-amber-600", label: "Revision" };
      if (t.includes("acknowledged") || t.includes("acknowledge"))
        return { bg: "bg-emerald-600", label: "Ack" };
      if (t.includes("cancel"))
        return { bg: "bg-rose-600", label: "Cancelled" };
      return { bg: "bg-gray-500", label: "Activity" };
    };

    // group by date (YYYY-MM-DD) like Outlook/Booking.com timelines
    const groups = items.reduce<Record<string, any[]>>((acc, it) => {
      const d = it.createdOn
        ? format(new Date(it.createdOn), "yyyy-MM-dd")
        : "Unknown";
      (acc[d] ||= []).push(it);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {Object.entries(groups).map(([day, arr]) => (
          <div key={day}>
            <div className="text-xs font-semibold text-muted-foreground mb-3">
              {day}
            </div>
            <ol className="relative border-s border-muted-foreground/20 ms-3">
              {arr.map((log, i) => {
                const k = getKind(log.resLog || "");
                return (
                  <li key={log.logId ?? i} className="mb-6 ms-4">
                    {/* node */}
                    <span
                      className={[
                        "absolute -start-1.5 mt-1 h-3 w-3 rounded-full ring-2 ring-background",
                        k.bg,
                      ].join(" ")}
                      aria-hidden
                    />
                    {/* header row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-medium">
                        {log.resLog || k.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.createdOn
                          ? format(new Date(log.createdOn), "HH:mm:ss")
                          : "—"}
                      </div>
                    </div>

                    {/* meta line(s) */}
                    <div className="mt-1 text-xs text-muted-foreground">
                      <Meta label="User" value={log.username || "—"} />
                      <Meta
                        label="Reservation"
                        value={log.reservationNo || log.reservationId || "—"}
                      />
                      {log.roomNumber ? (
                        <Meta label="Room" value={log.roomNumber} />
                      ) : null}
                      {log.platform ? (
                        <Meta label="Platform" value={log.platform} />
                      ) : null}
                      {log.ipAddress ? (
                        <Meta label="IP" value={log.ipAddress} />
                      ) : null}
                      {log.url ? (
                        <div className="flex items-start gap-1">
                          <span className="min-w-16">URL:</span>
                          <span className="break-all">{log.url}</span>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    );
  }

  function Meta({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex items-center gap-1">
        <span className="min-w-16">{label}:</span>
        <span className="text-foreground/80">{value}</span>
      </div>
    );
  }

  const handleCancelBookingComplete = async (reason: string) => {
    if (!reservationDetailId || !reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

      const resultAction = await dispatch(
        cancelReservationByRoomThunk({
          reservationDetailId,
          reservationStatusId: 5,
          status: "Cancelled",
          cancelReason: reason,
          cancelledBy: userInfo?.name || "System",
          cancelledOn: new Date().toISOString(),
          reservationId, // optional, but your thunk supports it
        })
      );

      if (cancelReservationByRoomThunk.fulfilled.match(resultAction)) {
        toast.success("Room reservation successfully cancelled");

        // refresh data
        if (reservationId) {
          await dispatch(fetchReservationById(reservationId));
        }
        await Promise.all([
          dispatch(fetchFolioByDetailId(reservationDetailId)),
          dispatch(fetchRateDetailsById(reservationDetailId)),
        ]);

        // close the cancel drawer + clear local state
        setCancelBooking(null);
        setCancelBookingOpen(false);
      } else {
        throw new Error(
          (resultAction.payload as string) ||
            "Failed to cancel room reservation"
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel room reservation");
    } finally {
      // optional: reset slice flags if you want a clean state next time
      dispatch(resetCancelReservationState());
    }
  };

  // Function to get action options for a specific room
  const getActionOptions = (room: any) => {
    const validStatus =
      room?.reservationStatusMaster?.reservationStatus?.toLowerCase?.() || "";

    const actionOptions = [
      {
        label: "EDIT",
        show: ["confirmed reservation", "tentative", "checked-in"],
      },
      { label: "CHECK-IN", show: ["confirmed reservation", "tentative"] },
      { label: "CHECK-OUT", show: ["checked-in"] },
      { label: "CANCEL BOOKING", show: ["confirmed reservation", "tentative"] },
      { label: "NO SHOW", show: ["confirmed reservation", "tentative"] },
      {
        label: "EXTEND",
        show: ["confirmed reservation", "tentative", "checked-in"],
      },
      {
        label: "SHORTEN",
        show: ["confirmed reservation", "tentative", "checked-in"],
      },
      {
        label: "ROOM CHANGE",
        show: ["confirmed reservation", "tentative", "checked-in"],
        condition: () => {
          const today = new Date();
          const checkInDate = new Date(room?.resCheckIn || room?.checkIn);
          return checkInDate <= today;
        },
      },
      {
        label: "POST CHARGES",
        show: ["confirmed reservation", "tentative", "checked-in"],
      },
      {
        label: "POST CREDIT/ DISCOUNT",
        show: ["confirmed reservation", "tentative", "checked-in"],
      },
      {
        label: "TAKE PAYMENTS",
        show: ["confirmed reservation", "tentative", "checked-in"],
      },
      { label: "CASH PAYOUT", show: ["checked-in"] },
      { label: "RECALL", show: ["checked-out", "cancelled"] },
      { label: "ROLLBACK", show: ["checked-in"] },
    ]
      .filter(
        (option) =>
          option.show.includes(validStatus) &&
          (!option.condition || option.condition())
      )
      .map((option) => {
        const payload = {
          ...room,
          reservationDetailID: room.reservationDetailID,
          reservationNo: bookingData?.reservationNo,
          reservationID: bookingData?.reservationID,
          roomID: room.roomID,
          guest: room.guest1 || room.guestName,
          roomNumber: room.roomNumber,
          checkOut: room.resCheckOut || room.checkOut,
          mealPlan: room.mealPlan,
          bookerFullName: bookingData?.bookerFullName,
          phone: bookingData?.phone,
          email: bookingData?.email,
          currencyCode: bookingData?.currencyCode,
          sourceOfBooking: bookingData?.sourceOfBooking,
          resCheckIn: bookingData?.resCheckIn,
          resCheckOut: bookingData?.resCheckOut,
          guest1: bookingData?.rooms[0]?.guest1,
        };

        const onClickActions = {
          "CHECK-IN": () => {
            setCheckInBooking(payload);
            setCheckInOpen(true);
          },
          "CHECK-OUT": () => {
            setCheckOutBooking(payload);
            setCheckOutOpen(true);
          },
          "CANCEL BOOKING": () => {
            setCancelBooking(payload);
            setCancelBookingOpen(true);
          },
          "NO SHOW": () => {
            setNoShowBooking(payload);
            setNoShowOpen(true);
          },
          EXTEND: () => {
            setExtendBooking(payload);
            setExtendOpen(true);
          },
          SHORTEN: () => {
            setShortenBooking(payload);
            setShortenOpen(true);
          },
          "ROOM CHANGE": () => {
            setRoomChangeBooking(payload);
            setRoomChangeOpen(true);
          },
          "POST CHARGES": () => {
            setPostChargesBooking(payload);
            setPostChargesOpen(true);
          },
          "POST CREDIT/ DISCOUNT": () => {
            setPostCreditBooking(payload);
            setPostCreditOpen(true);
          },
          "TAKE PAYMENTS": () => {
            setTakePaymentsBooking(payload);
            setTakePaymentsOpen(true);
          },
          "CASH PAYOUT": () => {
            setCashPayoutBooking(payload);
            setCashPayoutOpen(true);
          },
          RECALL: () => {
            setRecallBooking(payload);
            setRecallModalOpen(true);
          },
          ROLLBACK: () => {
            setRollbackBooking(payload);
            setRollbackModalOpen(true);
          },
          EDIT: () => {
            setAmendBooking(payload);
            setAmendOpen(true);
          },
        };

        return {
          label: option.label,
          onClick: onClickActions[option.label],
        };
      });

    return actionOptions;
  };

  if (!shouldRender) {
    return null;
  }

  const matchedRoom = bookingData?.rooms?.find(
    (room: any) => room.reservationDetailID === reservationDetailId
  );

  const handleRemoveRoom = async (reservationDetailId: number) => {
    if (!reservationDetailId) return;
    try {
      setRemovingId(reservationDetailId);

      const result = await dispatch(
        cancelReservationDetail(reservationDetailId)
      );
      if (cancelReservationDetail.fulfilled.match(result)) {
        // Consider this “Cancelled” (statusId = 5)
        toast.success("Room removed (Cancelled).");

        // Refresh whatever you show in this drawer
        if (reservationId) {
          await dispatch(fetchReservationById(reservationId));
        }
        await Promise.allSettled([
          dispatch(fetchFolioByDetailId(reservationDetailId)),
          dispatch(fetchRateDetailsById(reservationDetailId)),
        ]);
        onOpenChange(false);
      } else {
        throw new Error(
          (result.payload as string) || "Failed to cancel reservation detail"
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel reservation detail");
    } finally {
      setRemovingId(null);
      dispatch(resetCancelState());
    }
  };

  const logs = useAppSelector(selectFetchedReservationActivityLogs);
  const logsLoading = useAppSelector(selectFetchedReservationActivityLoading);
  const logsError = useAppSelector(selectFetchedReservationActivityError);
  const { currentPage, pageSize, totalCount } = useAppSelector(
    selectFetchedReservationActivityPagination
  );

  useEffect(() => {
    if (open && reservationId) {
      dispatch(
        fetchFetchedReservationActivityLogs({
          reservationId,
          page: currentPage,
          pageSize,
        })
      );
    }
  }, [dispatch, open, reservationId, currentPage, pageSize]);

  console.log("Matched Detail for status badge 🎯:", matchedRoom);
  console.log("hotelCurrency:", hotelCurrency);
  console.log("amend booking : ", bookingData);

  // Safely compute total pages (>= 1 even when counts are missing)
  const totalPages = useMemo(() => {
    const tc = Number(totalCount ?? 0);
    const ps = Number(pageSize ?? 0);
    return tc > 0 && ps > 0 ? Math.ceil(tc / ps) : 1;
  }, [totalCount, pageSize]);

  // If the current page is out of range after a refetch, pull it back in
  useEffect(() => {
    if (currentPage > totalPages) {
      dispatch(setFetchedReservationActivityPage(totalPages));
    } else if (currentPage < 1) {
      dispatch(setFetchedReservationActivityPage(1));
    }
  }, [currentPage, totalPages, dispatch]);

  console.log("booking detail 1 : ", bookingDetail);
  console.log("booking detail 2 : ", booking);

  const safeDefaultRateCodeId = useMemo(() => {
    return (
      booking?.rateCodeID ??
      booking?.rateCodeId ??
      bookingData?.rateCodeID ??
      bookingData?.rateCodeId ??
      bookingDetail?.rateCodeID ??
      bookingDetail?.rateCodeId ??
      bookingData?.rooms?.[0]?.rateCodeID ??
      bookingData?.rooms?.[0]?.rateCodeId ??
      null
    );
  }, [booking, bookingData, bookingDetail]);

  const safeDefaultMealPlanId = useMemo(() => {
    return (
      booking?.mealPlanID ??
      booking?.mealPlanId ??
      bookingData?.mealPlanID ??
      bookingData?.mealPlanId ??
      bookingDetail?.mealPlanID ??
      bookingDetail?.mealPlanId ??
      bookingData?.rooms?.[0]?.mealPlanID ??
      bookingData?.rooms?.[0]?.mealPlanId ??
      null
    );
  }, [booking, bookingData, bookingDetail]);

  console.log("booking aaaaaaaaaa : ", booking, bookingData, bookingDetail);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={`z-[70] w-full sm:max-w-2xl h-full overflow-y-auto rounded-l-2xl transition-transform duration-300 ${
            anySubDrawerOpen ? "-translate-x-[100%]" : "translate-x-0"
          }`}
        >
          <div className="p-4 space-y-4">
            <Tabs value={tabValue} onValueChange={(v) => setTabValue(v as any)}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {tabValue === "rooming" ? "Rooming List" : "Activity Log"}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenReportDrawer(true)}
                    className="p-1 rounded hover:bg-muted"
                    title="Reports"
                    aria-label="Open reports"
                  >
                    <FileChartColumnIncreasing size={24} />
                  </button>

                  <TabsList>
                    <TabsTrigger value="rooming">Rooming List</TabsTrigger>

                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                  </TabsList>
                </div>
              </div>
              <TabsContent value="rooming">
                <div className="mt-2 ">
                  <div className="mt-2 flex items-center gap-2 mb-2 justify-between">
                    <Button size="sm" onClick={() => setAddRoomOpen(true)}>
                      Add Room
                    </Button>

                    {/* Native select for Group Action */}
                    <div className="relative inline-block">
                      <select
                        className="h-9 rounded-md border px-3 pr-8 text-sm disabled:opacity-50 bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700"
                        disabled={selectedDetailIds.length === 0}
                        title={
                          selectedDetailIds.length === 0
                            ? "Select rooms using the checkboxes"
                            : `Selected: ${selectedDetailIds.length}`
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;

                          const opts = getGroupActionOptions(selectedDetailIds);
                          const chosen = opts.find((o) => o.label === value);
                          if (chosen?.onClick) chosen.onClick();

                          // reset to placeholder
                          e.currentTarget.selectedIndex = 0;
                        }}
                      >
                        <option value="">
                          {selectedDetailIds.length
                            ? `Group Action (${selectedDetailIds.length})`
                            : "Group Action"}
                        </option>
                        {getGroupActionOptions(selectedDetailIds).length ? (
                          getGroupActionOptions(selectedDetailIds).map((o) => (
                            <option key={o.label} value={o.label}>
                              {o.label}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No common actions
                          </option>
                        )}
                      </select>

                      {/* simple chevron (optional) */}
                      <svg
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 011.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z" />
                      </svg>
                    </div>
                  </div>

                  {bookingData?.rooms?.length > 0 ? (
                    <div className="space-y-4">
                      {bookingData.rooms.map((room) => {
                        const actionOptions = getActionOptions(room);

                        return (
                          <div
                            key={
                              room.reservationDetailID ||
                              room.roomID ||
                              Math.random()
                            }
                            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white dark:bg-gray-900"
                          >
                            {/* Status badge and Options */}
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-blue-600"
                                  checked={selectedDetailIds.includes(
                                    room.reservationDetailID
                                  )}
                                  onChange={(e) =>
                                    toggleSelectRoom(
                                      room.reservationDetailID,
                                      e.target.checked
                                    )
                                  }
                                  aria-label="Select for Group Action"
                                />
                                <span
                                  className="text-xs font-semibold px-2 py-0.5 rounded"
                                  style={{
                                    backgroundColor:
                                      room.reservationStatusMaster
                                        ?.reservationStatusColour,
                                    color: "#000",
                                  }}
                                >
                                  {room.reservationStatusMaster
                                    ?.reservationStatus || "Confirmed"}
                                </span>
                              </div>
                              <div className="flex items-center flex-row gap-8 mr-2 ">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {room.roomType}
                                </span>

                                <Button
                                  size="sm"
                                  className={`px-4 p-0 ${
                                    isRoomCancelled(room)
                                      ? "bg-green-600"
                                      : "bg-red-600"
                                  } text-white disabled:opacity-60`}
                                  onClick={() =>
                                    setConfirmDialog({
                                      open: true,
                                      kind: isRoomCancelled(room)
                                        ? "revoke"
                                        : "remove",
                                      reservationDetailId:
                                        room?.reservationDetailID,
                                      roomLabel: `${room.roomType ?? "Room"} ${
                                        room.roomNumber ?? ""
                                      }`.trim(),
                                    })
                                  }
                                  disabled={
                                    removingId === room?.reservationDetailID
                                  }
                                  title={
                                    isRoomCancelled(room)
                                      ? "Revoke (Status: 1 - Confirmed)"
                                      : "Cancel this room (Status: 5 - Cancelled)"
                                  }
                                >
                                  <div className="px-2">
                                    {removingId === room?.reservationDetailID
                                      ? isRoomCancelled(room)
                                        ? "Revoking..."
                                        : "Removing..."
                                      : isRoomCancelled(room)
                                      ? "Revoke"
                                      : "Remove"}
                                  </div>
                                </Button>
                              </div>
                            </div>

                            {/* Guest */}
                            <p className="font-medium text-[#087fbf] mb-1">
                              {room.guest1 || "—"}
                            </p>

                            {/* Room + Pax */}
                            <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                              <span>
                                <span className="font-semibold">Room:</span>{" "}
                                {room.roomNumber || "—"}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {room.adults}
                                </span>
                                {room.child > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Baby className="h-4 w-4" />
                                    {room.child}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-semibold">Phone:</span>{" "}
                                {bookingData?.phone || "—"}
                              </div>
                              <div>
                                <span className="font-semibold">Basis:</span>{" "}
                                {room.basis || "—"}
                              </div>
                              <div>
                                <span className="font-semibold">Repeat:</span>{" "}
                                No
                              </div>
                              <div>
                                <span className="font-semibold">Is VIP:</span>{" "}
                                No
                              </div>
                            </div>

                            {/* Option Select Button */}
                            <div className="flex justify-end mt-3">
                              <div className="relative inline-block w-48">
                                <select
                                  className="w-full appearance-none bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-100 text-sm font-medium rounded-full px-4 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors duration-200"
                                  onChange={(e) => {
                                    const selected = actionOptions.find(
                                      (a) => a.label === e.target.value
                                    );
                                    if (selected?.onClick instanceof Function) {
                                      selected.onClick();
                                    }
                                    e.target.selectedIndex = 0; // Reset select
                                  }}
                                >
                                  <option value="">Action</option>
                                  {actionOptions.map((action, idx) => (
                                    <option key={idx} value={action.label}>
                                      {action.label}
                                    </option>
                                  ))}
                                </select>

                                {/* Chevron Icon */}
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                  <svg
                                    className="h-4 w-4 text-gray-500 dark:text-gray-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 20 20"
                                    stroke="currentColor"
                                  >
                                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No reservations found.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity">
                {/* == Activity inner tabs == */}
                <Tabs defaultValue="list" className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Activity</h4>
                    <TabsList>
                      <TabsTrigger value="list">List</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>
                  </div>

                  {/* ---------- LIST (existing) ---------- */}
                  <TabsContent value="list" className="space-y-3">
                    {logsLoading && (
                      <div className="text-sm">Loading logs…</div>
                    )}
                    {logsError && (
                      <div className="text-sm text-red-600">
                        Error: {logsError}
                      </div>
                    )}
                    {!logsLoading && !logsError && logs?.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No activity found.
                      </div>
                    )}
                    {!logsLoading && !logsError && logs?.length > 0 && (
                      <div className="space-y-2">
                        {logs.map((log) => (
                          <div
                            key={log.logId}
                            className="border rounded-md p-3 bg-white/70 dark:bg-zinc-900/70"
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                #{log.logId} • {log.username || "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {log.createdOn
                                  ? format(
                                      new Date(log.createdOn),
                                      "yyyy-MM-dd HH:mm"
                                    )
                                  : "—"}
                              </div>
                            </div>
                            <div className="mt-1 text-sm">
                              <span className="font-semibold">Action:</span>{" "}
                              {log.resLog || "—"}
                            </div>
                            <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                Reservation:{" "}
                                {log.reservationNo || log.reservationId || "—"}
                              </div>
                              <div>Room: {log.roomNumber || "—"}</div>
                              <div>Platform: {log.platform || "—"}</div>
                              <div>Hotel ID: {log.hotelId ?? "—"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pagination stays the same */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        Page {currentPage} of {totalPages} • {totalCount}{" "}
                        records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage <= 1 || logsLoading}
                          onClick={() =>
                            dispatch(
                              setFetchedReservationActivityPage(currentPage - 1)
                            )
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentPage >= totalPages || logsLoading}
                          onClick={() =>
                            dispatch(
                              setFetchedReservationActivityPage(currentPage + 1)
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ---------- TIMELINE (tree) ---------- */}
                  <TabsContent value="timeline" className="space-y-4">
                    {logsLoading && (
                      <div className="text-sm">Loading timeline…</div>
                    )}
                    {logsError && (
                      <div className="text-sm text-red-600">
                        Error: {logsError}
                      </div>
                    )}
                    {!logsLoading &&
                      !logsError &&
                      (!logs || logs.length === 0) && (
                        <div className="text-sm text-muted-foreground">
                          No activity found.
                        </div>
                      )}

                    {!logsLoading && !logsError && logs?.length > 0 && (
                      <Timeline logs={logs} />
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((s) => ({ ...s, open }))}
      >
        {/* Using programmatic open; no trigger element needed */}
        <AlertDialogContent className="z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.kind === "revoke"
                ? "Revoke cancellation?"
                : "Remove (cancel) this room?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.kind === "revoke"
                ? `This will set the room status back to Confirmed.`
                : `This will cancel this room and set status to Cancelled.`}
              {confirmDialog.roomLabel ? (
                <>
                  <br />
                  <span className="font-medium text-foreground">
                    Target:
                  </span>{" "}
                  {confirmDialog.roomLabel}
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDialog.reservationDetailId) return;
                try {
                  if (confirmDialog.kind === "revoke") {
                    await handleRevokeRoom(confirmDialog.reservationDetailId);
                  } else {
                    await handleRemoveRoom(confirmDialog.reservationDetailId);
                  }
                } finally {
                  setConfirmDialog({ open: false });
                }
              }}
            >
              {confirmDialog.kind === "revoke" ? "Yes, revoke" : "Yes, remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* All Drawer Components - These will appear on the right when main drawer shifts left */}
      <RoomListReportDrawer
        isOpen={openReportDrawer}
        onClose={handleReportDrawerClose}
        bookingDetail={{
          ...(booking || {}),

          reservationNo: booking?.reservationNo,

          reservationDetailID: booking?.reservationDetailID,

          reservationStatusId: 5,

          reservationID: booking?.reservationID,

          guest: booking?.bookerFullName || "Guest",

          roomType: booking?.roomTypeName || "Room",

          roomNumber: booking?.roomNumber || "",

          status: booking?.status || "",

          checkIn: booking?.checkInDate || "",

          checkOut: booking?.checkOutDate || "",
        }}
        reservationDetailID={booking?.reservationDetailID}
      />

      {/* Take Payments Drawer */}

      <TakePaymentsDrawer
        bookingDetail={takePaymentsBooking}
        open={takePaymentsOpen}
        onClose={() => {
          setTakePaymentsOpen(false);
          setTakePaymentsBooking(null);
        }}
        onComplete={handleTakePaymentsComplete}
        isBookingPageView={isBookingPageView}
        groupContext={groupContext}
      />

      <AddRoomNumberDrawer
        open={addRoomOpen}
        booking={booking}
        onClose={() => setAddRoomOpen(false)}
        reservationId={reservationId}
        defaultCheckInISO={bookingData?.resCheckIn || booking?.checkIn || ""}
        defaultCheckOutISO={bookingData?.resCheckOut || booking?.checkOut || ""}
        roomTypeOptions={roomTypeOptions}
        defaultAdults={2}
        defaultChildren={0}
        defaultRateCodeId={safeDefaultRateCodeId ?? undefined}
        defaultMealPlanId={safeDefaultMealPlanId ?? undefined}
        extraBody={{}}
        onAdded={async () => {
          if (reservationId)
            await dispatch(fetchReservationById(reservationId));
          if (reservationDetailId) {
            await Promise.allSettled([
              dispatch(fetchFolioByDetailId(reservationDetailId)),
              dispatch(fetchRateDetailsById(reservationDetailId)),
            ]);
          }
        }}
      />

      {/* Check-In Drawer */}
      <Sheet open={checkInOpen} onOpenChange={setCheckInOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <CheckInFormDrawer
            bookingDetail={checkInBooking}
            onClose={handleCheckInComplete}
            title={guestProfile?.title ?? ""}
            dob={guestProfile?.dob ?? ""}
            nationality={guestProfile?.nationality ?? ""}
            country={guestProfile?.country ?? ""}
            guestProfileData={guestProfileData}
            guestProfileId={guestProfileId}
            countryListFromWalkIn={countryListFromWalkIn}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Check-Out Drawer */}
      <Sheet open={checkOutOpen} onOpenChange={setCheckOutOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <CheckOutFormDrawer
            bookingDetail={checkOutBooking}
            onClose={handleCheckOutComplete}
            standalone={false}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Extend Drawer */}
      <Sheet open={extendOpen} onOpenChange={setExtendOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <ExtendDrawer
            booking={extendBooking}
            bookingDetail={extendBooking}
            open={extendOpen}
            onClose={() => setExtendOpen(false)}
            onExtend={handleExtendStay}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Shorten Drawer */}
      <Sheet open={shortenOpen} onOpenChange={setShortenOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <ShortenDrawer
            bookingDetail={shortenBooking}
            open={shortenOpen}
            onClose={() => setShortenOpen(false)}
            onShorten={handleShortenStay}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Post Charges Drawer */}
      <Sheet open={postChargesOpen} onOpenChange={setPostChargesOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <PostChargesDrawer
            bookingDetail={postChargesBooking}
            open={postChargesOpen}
            onClose={handlePostChargesComplete}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Post Credit Drawer */}
      <Sheet open={postCreditOpen} onOpenChange={setPostCreditOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <PostCreditDrawer
            bookingDetail={postCreditBooking}
            open={postCreditOpen}
            onClose={handlePostCreditComplete}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Amend Drawer */}
      <Sheet open={amendOpen} onOpenChange={setAmendOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <AmendDrawer
            bookingDetail={amendBooking}
            onClose={handleAmendComplete}
            guestProfileId={guestProfileId}
            reservationStatusID={amendBooking?.reservationStatusID || 0}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Cash Payout Drawer */}
      <Sheet open={cashPayoutOpen} onOpenChange={setCashPayoutOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <CashPayoutDrawer
            open={cashPayoutOpen}
            onClose={handleCashPayoutComplete}
            booking={cashPayoutBooking}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Room Change Drawer */}
      <Sheet open={roomChangeOpen} onOpenChange={setRoomChangeOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <RoomChangeDrawer
            bookingDetail={roomChangeBooking}
            onClose={handleRoomChangeComplete}
            onRoomChange={(newRoomNumber) => {
              console.log("Room changed to:", newRoomNumber);
            }}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* No Show Drawer */}
      <Sheet open={noShowOpen} onOpenChange={setNoShowOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <NoShowDrawer
            bookingDetail={noShowBooking}
            onClose={() => setNoShowOpen(false)}
            onConfirm={handleNoShowComplete}
            isLoading={isMarkingNoShow}
            setTakePaymentsOpen={setTakePaymentsOpen}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Cancel Booking Drawer */}
      <Sheet open={cancelBookingOpen} onOpenChange={setCancelBookingOpen}>
        <SheetContent
          side="right"
          className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <CancelBookingDrawer
            onClose={() => setCancelBookingOpen(false)}
            onConfirm={handleCancelBookingComplete}
            bookingDetail={cancelBooking}
            groupContext={groupContext}
          />
        </SheetContent>
      </Sheet>

      {/* Recall Modal */}
      {recallModalOpen && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-xl p-6 w-full max-w-md shadow-lg border">
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Recall Booking
                </h2>
                <p className="text-sm text-muted-foreground">
                  Reservation No: {recallBooking?.reservationNo || "—"}
                </p>
              </div>
              <p className="text-sm text-foreground font-medium">
                Do you want to recall this booking?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="w-24"
                  onClick={() => setRecallModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="w-24"
                  onClick={() => {
                    console.log("Booking recalled");
                    setRecallModalOpen(false);
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

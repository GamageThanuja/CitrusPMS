"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  FileChartColumnIncreasing,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

import { format, parseISO } from "date-fns";
import { addDays } from "date-fns";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
import { useDispatch, useSelector } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { noShowReservation } from "@/redux/slices/noShowSlice";
import {
  fetchReservationRateDetails,
  selectReservationRateDetails,
  selectReservationRateDetailsLoading,
  selectReservationRateDetailsError,
} from "@/redux/slices/reservationRateDetailSlice";
import { fetchRateDetailsById } from "@/redux/slices/rateDetailsSlice";
import { RootState } from "@/redux/store";
import { fetchFolioByReservationDetailId } from "@/redux/slices/folioSlice";
import { fetchTransactions } from "@/redux/slices/transactionSlice";
import { getFolioByReservationDetailId } from "@/controllers/folioController";
// import { getRateDetailsByReservationDetailId } from "@/controllers/rateDetailsController";
// import { getReservationById } from "@/controllers/reservationController";
import { getGuestProfileById } from "@/controllers/guestProfileMasterController";
import { getGuestRoomMasterProfilesByReservationDetailId } from "@/controllers/guestProfileByRoomMasterController";
import {
  cancelReservation,
  cancelReservationRoom,
} from "@/controllers/ReservationRoomController";
import { NoShowDrawer } from "@/components/drawers/noShow-drawer";
import { set } from "lodash";
import { fetchGuestProfileMasterById } from "@/redux/slices/guestProfileSlice";
import {
  createFileUpload,
  clearCreateFileUpload,
  selectFileUploadData,
  selectFileUploadLoading,
  selectFileUploadError,
  selectFileUploadSuccess,
} from "@/redux/slices/createFileUploadSlice";
import {
  fetchFileUploadsByFolioId,
  clearFileUploads,
  selectFolioUploads,
  selectFolioUploadsLoading,
  selectFolioUploadsError,
} from "@/redux/slices/fetchFileUploadByFolioIdSlice";
import {
  fetchGuestMas,
  selectGuestMasItems,
  selectGuestMasLoading,
  selectGuestMasError,
  clearGuestMas,
} from "@/redux/slices/fetchGuestMasSlice";
import {
  fetchReservationDetailsById,
  selectReservationDetailsItems,
  selectReservationDetailsLoading,
  selectReservationDetailsError,
} from "@/redux/slices/fetchreservtaionByIdSlice";
import { useCurrency } from "@/hooks/useCurrency";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";
import { postReservationRemark } from "@/redux/slices/reservationRemarkSlice";
import AttachmentPreviewDrawer from "./attachmentPreviewDrawer";
import BookingPageDetailsDrawer from "./booking-page-detail-drawer";
import { useTranslatedText } from "@/lib/translation";
import { SecondGuestDrawer } from "./secondGuestDrawer";
import {
  cancelReservation as recallRoom,
  resetCancelReservationState,
} from "@/redux/slices/cancelReservationByRoomSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Copy, Check } from "lucide-react";
import { ReportsDrawer } from "./reports-drawer";
import { ChangeDateDrawer } from "./change-date-drawer";
import { useQRModal } from "../modals/qr-modal";

import { updateReservationStatus } from "@/redux/slices/updateStatusByReservationDetailID";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RecallDrawer from "./recallDrawer";
import RollbackDrawer from "./rollback-drawer";
import { TransferFolioDrawer } from "@/components/drawers/transfer-folio-drawer";
import {
  fetchReservationDetail,
  clearReservationDetail,
  selectReservationDetail,
  selectReservationDetailLoading,
  selectReservationDetailError,
} from "@/redux/slices/fetchReservationDetailSlice";
import {
  editReservationMas,
  selectEditReservationMasLoading,
  selectEditReservationMasError,
  selectEditReservationMasSuccess,
  clearEditReservationMas,
} from "@/redux/slices/editReservationMasSlice";

interface BookingDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingDetail: any; // Replace 'any' with the appropriate type if available
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
interface AmendDrawerProps {
  booking: any;
  guestProfile?: any;
  onClose: () => void;
  bookingDetail?: any;
  guestProfileId?: number;
  reservationStatusID?: number;
}

export default function BookingDetailsDrawer({
  open,
  onOpenChange,
  bookingDetail,
  text,
  onCancelBookingClick,
  guestProfileData,
  countryListFromWalkIn,
  isBookingPageView,
}: BookingDetailsDrawerProps) {
  // Ensure client-only logic is guarded
  const shouldRender = typeof window !== "undefined";
  // State for attachment management

  const [booking, setBooking] = useState<any>(bookingDetail);

  console.log("booking detail drawer bookingDetail 000000: ", bookingDetail);

  const reservationDetailId = bookingDetail?.reservationDetailID;
console.log("reservationDetailId oiiiiiiii: ", reservationDetailId);

  const reservationId = bookingDetail?.reservationID;

  const [bookingData, setBookingData] = useState<any>(null);
  console.log("Booking Data 🏀🏀🏀 :", bookingData);
  const [guestRemark, setGuestRemark] = useState("");
  const [internalRemark, setInternalRemark] = useState("");
  const dispatch = useAppDispatch();

  const editLoading = useSelector((s: RootState) =>
    selectEditReservationMasLoading(s)
  );
  const editError = useSelector((s: RootState) =>
    selectEditReservationMasError(s)
  );
  const editSuccess = useSelector((s: RootState) =>
    selectEditReservationMasSuccess(s)
  );

  const reservationDetailData = useSelector((s: RootState) =>
    selectReservationDetail(s)
  );
  const [reservationDetailDataState, setReservationDetailDataState] =
    useState<any>(reservationDetailData);

  useEffect(() => {
    setReservationDetailDataState(reservationDetailData);
  }, [reservationDetailData]);

  useEffect(() => {
    if (reservationDetailData) {
      setInternalRemark(reservationDetailData.remarks_Internal || "");
      setGuestRemark(reservationDetailData.remarks_Guest || "");
      // Update guestProfileId from API response
      setGuestProfileId(reservationDetailData.guestProfileID ?? null);
    }
  }, [reservationDetailData]);

  console.log("reservationDetailData : ", reservationDetailData);

  const reservationRateDetails = useSelector(selectReservationRateDetails);
  const reservationRateDetailsLoading = useSelector(
    selectReservationRateDetailsLoading
  );
  const reservationRateDetailsError = useSelector(
    selectReservationRateDetailsError
  );

  useEffect(() => {
    if (!reservationDetailId) return;
    dispatch(
      fetchReservationDetail({ reservationDetailId: reservationDetailId })
    );
    dispatch(
      fetchReservationRateDetails({ reservationDetailId: reservationDetailId })
    );

    // optional: clear on unmount
    return () => {
      dispatch(clearReservationDetail());
    };
  }, [dispatch, reservationDetailId]);
  // drawers
  const [secondGuestOpen, setSecondGuestOpen] = useState(false);

  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);

  const [openReportDrawer, setOpenReportDrawer] = useState(false);

  const { data: resDetail, loading: resLoading } = useSelector(
    (s: RootState) => s.reservationDetail
  );

  const [transferFolioOpen, setTransferFolioOpen] = useState(false);
  const [transferFolioBooking, setTransferFolioBooking] = useState<any>(null);

  console.log("res detail : ", resDetail);

  const { showQR } = useQRModal();
  const openQR = useCallback(async () => {
    if (!bookingDetail?.reservationDetailID) return;
    const gssKey = resDetail?.gssKey;
    const url = `https://gss.hotelmate.app/?key=${encodeURIComponent(gssKey)}`;

    await showQR(url, "Scan this QR code to access the Guest Self-Service");
  }, [bookingDetail?.reservationDetailID, resDetail?.gssKey, showQR]);

  const reservationData = useAppSelector(selectReservationDetail);

  const handleSaveRemarks = async () => {
    if (!reservationDetailData?.reservationID) return;

    await dispatch(
      editReservationMas({
        reservationId: Number(reservationDetailData?.reservationID),
        body: {
          remarks_Internal: internalRemark?.trim() || null,
          remarks_Guest: guestRemark?.trim() || null,
        },
      }) as any
    );

    if (!editError) {
      toast.success("Remarks saved");
      setEditNotes(false);
      // refresh detail to reflect changes
      dispatch(
        fetchReservationDetail({
          reservationDetailId: Number(
            reservationDetailData?.reservationDetailID
          ),
        })
      );
    } else {
      toast.error(editError);
    }
  };

  const fetchReservationDataById = async (reservationId: number) => {
    try {
      const reservation = fetchReservationDetailsById({ reservationId });
      return reservation;
    } catch (error) {
      console.error("Failed to fetch full reservation:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!reservationId) return;

    const loadReservation = async () => {
      const data = fetchReservationDetailsById({ reservationId });
      if (data) {
        setBookingData(data);
      }
    };

    loadReservation();
  }, [reservationId]);

  const appDispatch = useAppDispatch();

  const { data, error, cancelLoading, cancelError, cancelSuccess } =
    useSelector((state: RootState) => state.reservation);

  const { data: rateDetail } = useSelector(
    (state: RootState) => state.rateDetails
  );

  // useEffect(() => {
  //   if (reservationDetailId) {
  //     dispatch(
  //       fetchReservationRateDetails({
  //         reservationDetailId: reservationDetailId,
  //       })
  //     );
  //   }

  //   // Cleanup
  //   return () => {
  //     dispatch(clearReservation());
  //   };
  // }, [dispatch, reservationId]);

  useEffect(() => {
    if (bookingDetail) {
      setBooking(bookingDetail);
    }
  }, [bookingDetail, dispatch]);

  useEffect(() => {
    if (!open) {
      setBooking(null);
      setExtendedCheckOut(null);
      setShortenedCheckOut(null);
      setGuestProfile(null);
      setGuestProfileId(null);
    }
  }, [open]);

  // Fetch on mount
  useEffect(() => {
    if (reservationId) {
      dispatch(fetchRateDetailsById(reservationDetailId));
    }
  }, [reservationDetailId, dispatch]);

  const { data: folioItem } = useSelector((state: RootState) => state.folio);

  console.log("folioItem booking detail : ", folioItem);

  useEffect(() => {
    if (reservationId) {
      dispatch(fetchFolioByReservationDetailId(reservationDetailId));
    }
  }, [reservationId, dispatch]);

  console.log("Folio Items 🧾🧾🧾:", folioItem);

  const { data: transactions } = useSelector(
    (state: RootState) => state.transaction
  );

  console.log("Transactions 💰💰💰:", transactions);

  const selectedProperty =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("selectedProperty") || "{}")
      : {};
  const hotelId = selectedProperty?.id ?? null;
  const hotelCode = selectedProperty?.hotelCode ?? null;

  console.log("fetchTransactions : ", {
    hotelCode,
    reservationId,
    reservationDetailId,
  });

  useEffect(() => {
    if (hotelCode && reservationId && reservationDetailId) {
      console.log("fetchTransactions inside : ", {
        hotelCode,
        reservationId,
        reservationDetailId,
      });

      dispatch(
        fetchTransactions({
          hotelCode,
          reservationId,
          reservationDetailId,
          // tranTypeId: 17,
        })
      );
    } else {
      console.log("Skipping fetchTransactions due to missing params", {
        hotelCode,
        reservationId,
        reservationDetailId,
      });
    }
  }, [dispatch, hotelCode, reservationId, reservationDetailId]);

  useEffect(() => {
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelCode = selectedProperty?.hotelCode;
    console.log("hotel code : ", hotelCode);
    if (!hotelCode || !reservationDetailId) return;
    dispatch(
      fetchTransactions({
        hotelCode,
        reservationDetailId: Number(reservationDetailId),
        reservationId: bookingDetail?.reservationID,
      })
    );
  }, [dispatch, reservationDetailId]);

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [roomChangeOpen, setRoomChangeOpen] = useState(false);
  const [cashPayoutOpen, setCashPayoutOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [cancelBookingOpen, setCancelBookingOpen] = useState<boolean>(false);
  const [selectedDocType, setSelectedDocType] = useState("Booking Voucher");

  // Add state for other drawers
  const [extendOpen, setExtendOpen] = useState(false);
  const [shortenOpen, setShortenOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [postChargesOpen, setPostChargesOpen] = useState(false);
  const [postCreditOpen, setPostCreditOpen] = useState(false);
  const [takePaymentsOpen, setTakePaymentsOpen] = useState(false);

  const hotelCurrency = useStoredCurrencyCode();
  const { fullName } = useUserFromLocalStorage();
  const [attachmentDrawerOpen, setAttachmentDrawerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [changeDateBooking, setChangeDateBooking] = useState<any>(null);
  const [changeDateOpen, setChangeDateOpen] = useState<boolean>(false);

  useEffect(() => {
    if (booking) {
      setPayloadPreview(
        JSON.stringify(
          {
            reservationID: booking?.reservationID || 0,
            reservationDetailID: booking?.reservationDetailID || 0,
            description: selectedDocType,
            createdBy: fullName || "Unknown",
            base64File: "[base64 encoded file will appear here]",
            originalFileName: "[filename will appear here]",
          },
          null,
          2
        )
      );
    }
  }, [booking, selectedDocType]);
  // Add state to track extended checkout date
  const [extendedCheckOut, setExtendedCheckOut] = useState<string | null>(null);
  // Add a state for shortened checkout date, similar to extendedCheckOut
  const [shortenedCheckOut, setShortenedCheckOut] = useState<string | null>(
    null
  );

  // Handler for extending stay
  const handleExtendStay = (newDate: string, rate: string) => {
    // Update the booking object with new checkout date
    if (booking) {
      const updatedBooking = {
        ...booking,
        checkOut: newDate,
      };

      setBooking(updatedBooking);
      setExtendedCheckOut(newDate);

      // Refresh reservation data to reflect the changes
      if (reservationDetailId) {
        dispatch(fetchReservationRateDetails({ reservationDetailId }));
      }

      // Also refresh folio data as charges may have been added
      if (reservationDetailId) {
        dispatch(fetchFolioByReservationDetailId(reservationDetailId));
      }
    }
  };

  // Handler for shortening stay
  const handleShortenStay = (newDate: string) => {
    // Update the booking object with new checkout date
    if (booking) {
      const updatedBooking = {
        ...booking,
        checkOut: newDate,
      };

      setBooking(updatedBooking);
      setShortenedCheckOut(newDate);

      // Refresh reservation data to reflect the changes
      if (reservationDetailId) {
        dispatch(fetchReservationRateDetails({ reservationDetailId }));
      }

      // Also refresh folio data as charges may have been updated
      if (reservationDetailId) {
        dispatch(fetchFolioByReservationDetailId(reservationDetailId));
      }
    }
  };

  // Handler for check-in completion
  // in BookingDetailsDrawer
  const handleCheckInComplete = async () => {
    if (reservationDetailId) {
      // refresh Redux-backed reservation rate details
      await dispatch(fetchReservationRateDetails({ reservationDetailId }));

      // refresh folio + rate details for this detail
      if (reservationDetailId) {
        await Promise.all([
          dispatch(fetchFolioByReservationDetailId(reservationDetailId)),
          dispatch(fetchRateDetailsById(reservationDetailId)),
        ]);
      }

      // refresh the "booking" you render status from
      const fresh = await fetchReservationDataById(reservationId);
      if (fresh) setBooking(fresh);
    }

    setCheckInOpen(false);
  };

  // Handler for check-out completion
  const handleCheckOutComplete = () => {
    // Refresh reservation data to reflect the updated status
    if (reservationDetailId) {
      dispatch(fetchReservationRateDetails({ reservationDetailId }));
    }

    setCheckOutOpen(false);
  };

  // Handler for post charges completion
  const handlePostChargesComplete = () => {
    // Refresh folio data to show the new charges
    if (reservationDetailId) {
      dispatch(fetchFolioByReservationDetailId(reservationDetailId));
    }

    // Also refresh transactions
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

  // Handler for post credit completion
  const handlePostCreditComplete = () => {
    // Refresh folio data to show the new credits
    if (reservationDetailId) {
      dispatch(fetchFolioByReservationDetailId(reservationDetailId));
    }

    // Also refresh transactions
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

  // Handler for take payments completion
  const handleTakePaymentsComplete = () => {
    // Refresh folio data to show the new payment
    if (reservationDetailId) {
      dispatch(fetchFolioByReservationDetailId(reservationDetailId));
    }

    // Also refresh transactions
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

  // Handler for cash payout completion
  const handleCashPayoutComplete = () => {
    // Refresh folio data to show the payout
    if (reservationDetailId) {
      dispatch(fetchFolioByReservationDetailId(reservationDetailId));
    }

    // Also refresh transactions
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

  // Handler for amend completion
  const handleAmendComplete = () => {
    // Refresh reservation data to reflect all changes
    if (reservationDetailId) {
      dispatch(fetchReservationRateDetails({ reservationDetailId }));
    }

    // Also refresh folio and rate details
    if (reservationDetailId) {
      dispatch(fetchFolioByReservationDetailId(reservationDetailId));
      dispatch(fetchRateDetailsById(reservationDetailId));
    }

    // Refresh guest profile when guestProfileId is available
    if (guestProfileId) {
      dispatch(fetchGuestProfileMasterById(guestProfileId));
    }

    setAmendOpen(false);
  };

  const handleRoomChangeComplete = () => {
    // Refresh reservation data to reflect all changes
    if (reservationDetailId) {
      dispatch(fetchReservationRateDetails({ reservationDetailId }));
    }

    // Also refresh folio and rate details
    if (reservationDetailId) {
      dispatch(fetchFolioByReservationDetailId(reservationDetailId));
      dispatch(fetchRateDetailsById(reservationDetailId));
    }

    setRoomChangeOpen(false);
  };

  const handleNoShowComplete = async (opts?: {
    detailIds?: number[];
    reason: string;
    isChargable: boolean;
    amount?: number;
    currencyCode?: string;
  }) => {
    if (!reservationDetailId) {
      console.error("No reservation detail ID available");
      toast.error("No reservation detail ID available");
      return;
    }

    setIsMarkingNoShow(true);
    
    try {
      // Map drawer output → NoShowReservationPayload
      const payload = {
        reservationDetailId,
        isChargable: opts?.isChargable ?? false,
        currencyCode:
          opts?.currencyCode || bookingDetail?.currencyCode || "LKR",
        amount: opts?.isChargable ? opts?.amount ?? 0 : 0,
        // TODO: replace 0s below with real transaction config from your system
        tranTypeId: 0,
        drAccId: 0,
        crAccId: 0,
        // use check-in date from booking if you have it, otherwise “now”
        checkInDate:
          (bookingDetail as any)?.resCheckIn ||
          (bookingDetail as any)?.checkInDate ||
          new Date().toISOString(),
      };

      const resultAction = await dispatch(noShowReservation(payload));
      console.log("No show resultAction: ", resultAction);

      if (noShowReservation.fulfilled.match(resultAction)) {
        toast.success("Successfully marked as No Show");

        // Refresh reservation-related data like before
        await dispatch(fetchReservationRateDetails({ reservationDetailId }));

        await Promise.all([
          dispatch(fetchFolioByReservationDetailId(reservationDetailId)),
          dispatch(fetchRateDetailsById(reservationDetailId)),
        ]);

        setNoShowOpen(false);
      } else {
        throw new Error(
          (resultAction.payload as string) || "Failed to mark as No Show"
        );
      }
    } catch (error: any) {
      console.error("Failed to mark as No Show:", error);
      toast.error(error.message || "Failed to mark as No Show");
    } finally {
      setIsMarkingNoShow(false);
    }
  };

  const handleNoShowClose = () => {
    setNoShowOpen(false);
  };

  // Handler for cancel booking completion
  const handleCancelBookingComplete = async (cancelReason: string) => {
    if (!reservationDetailId || !cancelReason.trim()) {
      console.error("Missing required information for cancellation");
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      // Get current user info (replace with actual user context)
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

      // Dispatch the cancelRoomReservation action
      const resultAction = await dispatch(
        cancelRoomReservation({
          reservationDetailId,
          reservationStatusId: 5,
          status: "Cancelled",
          cancelReason,
          cancelledBy: userInfo?.name || "System",
          reservationStatusColour: "#b3b6b6",
        })
      );

      if (cancelRoomReservation.fulfilled.match(resultAction)) {
        // Show success message
        toast.success("Room reservation successfully cancelled");

        // Refresh the reservation data
        if (reservationDetailId) {
          await dispatch(fetchReservationRateDetails({ reservationDetailId }));
        }

        // Refresh folio and rate details
        await Promise.all([
          dispatch(fetchFolioByReservationDetailId(reservationDetailId)),
          dispatch(fetchRateDetailsById(reservationDetailId)),
        ]);

        // Close the Cancel Booking drawer
        setCancelBooking(null);
      } else {
        throw new Error(
          (resultAction.payload as string) ||
            "Failed to cancel room reservation"
        );
      }
    } catch (error: any) {
      console.error("Failed to cancel room reservation:", error);
      toast.error(error.message || "Failed to cancel room reservation");
    }
  };

  const handleCancelBookingClose = () => {
    setCancelBookingOpen(false);
  };

  const handleReportDrawerClose = () => {
    setOpenReportDrawer(false);
  };

  // Compute whether any sub-drawer is open
  const anySubDrawerOpen =
    checkInOpen ||
    checkOutOpen ||
    extendOpen ||
    shortenOpen ||
    postChargesOpen ||
    postCreditOpen ||
    takePaymentsOpen ||
    cashPayoutOpen ||
    amendOpen ||
    roomChangeOpen ||
    noShowOpen ||
    cancelBookingOpen ||
    attachmentDrawerOpen ||
    secondGuestOpen ||
    transferFolioOpen;

  // Preview files state for attachments tab
  const [previewFiles, setPreviewFiles] = useState<
    { file: File; docType: string; url: string }[]
  >([]);
  // Preview drawer state
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);
  const [previewZoomLevel, setPreviewZoomLevel] = useState(1);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  // State for API payload preview
  const [payloadPreview, setPayloadPreview] = useState<string>("");
  // Reason for cancellation state
  const [cancelReason, setCancelReason] = useState("");
  // Reason for no-show state
  const [noShowReason, setNoShowReason] = useState("");
  const [checkInBooking, setCheckInBooking] = useState<any>(null);

  // Folio items state
  const [folioItems, setFolioItems] = useState<any[]>([]);
  // Use Redux selector for reservation rate details from new API

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  console.log("Reservation Rate Details 0000000: ", reservationRateDetails);

  // Log updated Redux rateDetails for debugging
  useEffect(() => {
    console.log("Updated Reservation Rate Details:", reservationRateDetails);
  }, [reservationRateDetails]);
  // Guest Profile ID state - prioritize API data over prop
  const [guestProfileId, setGuestProfileId] = useState<number | null>(
    reservationDetailData?.guestProfileID ??
      bookingDetail?.guestProfileId ??
      null
  );

  // Full guest profile record
  const [guestProfile, setGuestProfile] = useState<any | null>(null);
  // Compute total net rate from reservationRateDetails (new API)
  const totalNetRate = (reservationRateDetails ?? []).reduce(
    (sum, r) => sum + (r.netRate || 0),
    0
  );

  const [checkOutBooking, setCheckOutBooking] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [noShowBooking, setNoShowBooking] = useState(null);
  const [extendBooking, setExtendBooking] = useState(null);
  const [shortenBooking, setShortenBooking] = useState(null);
  const [roomChangeBooking, setRoomChangeBooking] = useState(null);
  const [postChargesBooking, setPostChargesBooking] = useState(null);
  const [postCreditBooking, setPostCreditBooking] = useState(null);
  const [takePaymentsBooking, setTakePaymentsBooking] = useState(null);
  const [cashPayoutBooking, setCashPayoutBooking] = useState(null);
  const [recallBooking, setRecallBooking] = useState(null);
  const [rollbackBooking, setRollbackBooking] = useState(null);
  const [amendBooking, setAmendBooking] = useState(null);
  const [rollbackOpen, setRollbackOpen] = useState(false);

  // Add a new state for tracking upload progress near the other states (around line 100)
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  // uploadedAttachments state removed - now using Redux state (folioUploads)
  const [loading, setLoading] = useState<boolean>(false);
  const [groupOpen, setGroupOpen] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>("");
  const [notesList, setNotesList] = useState<string[]>([]);
  const isDrawerStateChanging = useRef(false);
  const [roomGuestsLoading, setRoomGuestsLoading] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<
    (typeof bookingData)[0] | null
  >(null);

  const initial = (booking?.sourceOfBooking ?? "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    if (booking) {
      setPayloadPreview(
        JSON.stringify(
          {
            reservationID: booking?.reservationID || 0,
            reservationDetailID: booking?.reservationDetailID || 0,
            description: selectedDocType,
            createdBy: fullName || "Unknown",
            base64File: "[base64 encoded file will appear here]",
            originalFileName: "[filename will appear here]",
          },
          null,
          2
        )
      );
    }
  }, [booking, selectedDocType]);

  // Modal states
  const [recallModalOpen, setRecallModalOpen] = useState<boolean>(false);
  const [rollbackModalOpen, setRollbackModalOpen] = useState<boolean>(false);

  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [newRoomNumber, setNewRoomNumber] = useState<string>("");
  const [recallOpen, setRecallOpen] = useState(false);

  const router = useRouter();

  // State for room guest profiles
  const [roomGuestProfiles, setRoomGuestProfiles] = useState<any[]>([]);

  // File upload Redux selectors
  const fileUploadData = useSelector(selectFileUploadData);
  const fileUploadLoading = useSelector(selectFileUploadLoading);
  const fileUploadError = useSelector(selectFileUploadError);
  const fileUploadSuccess = useSelector(selectFileUploadSuccess);

  // Folio uploads Redux selectors
  const folioUploads = useSelector(selectFolioUploads);
  const folioUploadsLoading = useSelector(selectFolioUploadsLoading);
  const folioUploadsError = useSelector(selectFolioUploadsError);

  // Guest data Redux selectors
  const guestMasItems = useSelector(selectGuestMasItems);
  const guestMasLoading = useSelector(selectGuestMasLoading);
  const guestMasError = useSelector(selectGuestMasError);

  // Fetch file uploads when reservationDetailId changes
  useEffect(() => {
    if (reservationDetailId) {
      // Use reservationDetailId as folioId according to the requirement
      dispatch(fetchFileUploadsByFolioId({ folioId: reservationDetailId }));
    }
  }, [reservationDetailId, dispatch]);

  // Fetch guest data using GuestsMas API when guestProfileId changes
  useEffect(() => {
    if (guestProfileId) {
      dispatch(fetchGuestMas({ guestId: guestProfileId }));
    }
  }, [guestProfileId, dispatch]);

  // Fetch guest profiles for this room/reservationDetailId
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

        const guestDetails = await Promise.all(
          (guestMappings || []).map((mapping: any) =>
            getGuestProfileById({
              token,
              profileId: mapping.guestProfileId,
            })
          )
        );

        setRoomGuestProfiles(guestDetails);
      } catch (err) {
        console.error("Failed to load room guest profiles:", err);
      }
    };

    fetchRoomGuestProfiles();
  }, [reservationDetailId]);

  // Reset modal states when drawer is closed
  useEffect(() => {
    // Only reset when closing the drawer, not when opening it
    if (!open) {
      setRoomChangeOpen(false);
      setNewRoomNumber("");
    }
  }, [open]);

  // Load persisted checkout date from localStorage when component mounts
  useEffect(() => {
    if (reservationDetailId) {
      const allDates =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("checkout_dates") || "{}")
          : {};
      const persistedCheckout = allDates[reservationDetailId];
      if (persistedCheckout) {
        if (
          new Date(persistedCheckout) >
          new Date(booking.resCheckOut || booking.checkOut)
        ) {
          setExtendedCheckOut(persistedCheckout);
        } else {
          setShortenedCheckOut(persistedCheckout);
        }
      }
    }
  }, [
    booking?.reservationDetailId,
    booking?.resCheckOut,
    booking?.checkOut,
    open,
  ]);

  const refreshRoomGuestProfiles = useCallback(async () => {
    if (!reservationDetailId) return;

    try {
      setRoomGuestsLoading(true);
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      const token = storedToken ? JSON.parse(storedToken).accessToken : null;
      if (!token) throw new Error("No access token");

      const guestMappings =
        await getGuestRoomMasterProfilesByReservationDetailId(
          reservationDetailId,
          token
        );

      const guestDetails = await Promise.all(
        (guestMappings || []).map((m: any) =>
          getGuestProfileById({ token, profileId: m.guestProfileId })
        )
      );

      // defensively filter out null/undefined
      setRoomGuestProfiles((guestDetails || []).filter(Boolean));
    } catch (err) {
      console.error("Failed to load room guest profiles:", err);
      setRoomGuestProfiles([]);
    } finally {
      setRoomGuestsLoading(false);
    }
  }, [reservationDetailId]);

  useEffect(() => {
    refreshRoomGuestProfiles();
  }, [refreshRoomGuestProfiles]);

  // Function to persist checkout date to localStorage
  const persistCheckoutDate = (
    reservationDetailId: number,
    newDate: string
  ) => {
    if (typeof window !== "undefined") {
      const allDates = JSON.parse(
        localStorage.getItem("checkout_dates") || "{}"
      );
      allDates[reservationDetailId] = newDate;
      localStorage.setItem("checkout_dates", JSON.stringify(allDates));
    }
  };

  useEffect(() => {
    setLoading(true);
    const fetchFolioData = async () => {
      if (!reservationDetailId) {
        setLoading(false);
        return;
      }

      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("hotelmateTokens")
            : null;
        const token = storedToken ? JSON.parse(storedToken).accessToken : null;

        if (!token) throw new Error("No access token found");

        const data = await getFolioByReservationDetailId({
          token,
          reservationDetailId: reservationDetailId,
        });

        setFolioItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch folio data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolioData();
    // No longer fetch rate details directly here; Redux handles it
  }, [reservationDetailId]);

  // Fetch reservation details to get Guest Profile ID
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

  // Fetch Guest Profile details (title, address, etc.)
  useEffect(() => {
    const fetchGuestProfile = async () => {
      setGuestProfile(null); // Reset profile to avoid stale data
      if (!guestProfileId) {
        console.log("No guestProfileId available for fetching guest profile");
        return;
      }

      console.log("Fetching guest profile for guestProfileId:", guestProfileId);

      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("hotelmateTokens")
            : null;
        const token = storedToken ? JSON.parse(storedToken).accessToken : null;

        if (!token) {
          console.error("No access token found for guest profile fetch");
          return;
        }

        const data = await getGuestProfileById({
          token,
          profileId: guestProfileId,
        });

        console.log("Guest profile data received:", data);
        setGuestProfile(data);
      } catch (error) {
        console.error("Failed to fetch guest profile:", error);
      }
    };

    fetchGuestProfile();
  }, [guestProfileId, reservationDetailId]);

  // Handle file upload success
  useEffect(() => {
    if (fileUploadSuccess && fileUploadData) {
      console.log("File upload successful:", fileUploadData);
      // Clear the upload state after a delay
      setTimeout(() => {
        dispatch(clearCreateFileUpload());
      }, 2000);
    }
  }, [fileUploadSuccess, fileUploadData, dispatch]);

  // Handle file upload error
  useEffect(() => {
    if (fileUploadError) {
      console.error("File upload error:", fileUploadError);
      alert("Upload failed: " + fileUploadError);
      setUploadProgress(0); // Reset progress on error
    }
  }, [fileUploadError]);

  if (!booking) return null;
  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className={`z-[60] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 ${
            groupOpen || anySubDrawerOpen ? "-translate-x-[90%]" : ""
          }`}
        >
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const amount = booking.amount || "—";
  const guest = booking.guest || booking.guestName || "—";
  console.log("Parsed guest details:", {
    name: booking.guest || booking.guestName || guestProfile?.guestName,
    phone: booking.phone || guestProfile?.phone,
    email: booking.email || guestProfile?.email,
    nationality: booking.nationality || guestProfile?.nationality,
    city: booking.city || guestProfile?.city,
    address: booking.address || guestProfile?.address,
    guestProfileId: guestProfileId,
  });

  const expenses = Array.isArray(booking.expenses) ? booking.expenses : [];
  const revisions: { description?: string; date?: string }[] = Array.isArray(
    booking.revisions
  )
    ? booking.revisions
    : [];

  const primaryClass = "bg-primary text-secondary hover:bg-primary-800";

  // Filtered action options based on reservation status
  const validStatus = bookingDetail?.status?.toLowerCase?.() || "";

  const actionOptions = [
    {
      label: "EDIT",
      show: ["confirmed reservation", "tentative", "checked-in"],
    },
    { label: "CHECK-IN", show: ["confirmed reservation", "tentative"] },
    { label: "CHECK-OUT", show: ["checked-in"] },
    { label: "CANCEL BOOKING", show: ["confirmed reservation", "tentative"] },
    { label: "DATE CHANGE", show: ["confirmed reservation", "tentative"] },
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
        const checkInDate = new Date(
          bookingDetail?.resCheckIn || bookingDetail?.checkIn
        );
        // Only show if check-in date is on or before today
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
    { label: "RECALL", show: ["cancelled", "checked-out"] },
    { label: "ROLLBACK", show: ["checked-in"] },
    { label: "TRANSFER FOLIO", show: ["checked-in"] },
  ]
    .filter(
      (option) =>
        option.show.includes(validStatus) &&
        (!option.condition || option.condition())
    )
    .map((option) => {
      const payload = {
        ...booking,
        reservationDetailID: reservationDetailId,
        reservationNo: booking.reservationNo,
        reservationID: booking.reservationID,
        roomID: booking.roomID,
        guest: booking.guest || booking.guestName,
        roomNumber: booking.roomNumber,
        checkOut: booking.resCheckOut || booking.checkOut,
        mealPlan: booking.mealPlan,
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
          // Don't close the drawer when opening room change modal
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
          setRecallOpen(true);
        },
        ROLLBACK: () => {
          setRollbackBooking(payload);
          setRollbackOpen(true);
        },
        EDIT: () => {
          setAmendBooking(payload);
          setAmendOpen(true);
        },
        "DATE CHANGE": () => {
          setChangeDateBooking(payload);
          setChangeDateOpen(true);
        },
        "TRANSFER FOLIO": () => {
          setTransferFolioBooking(payload);
          setTransferFolioOpen(true);
        },
      };

      return {
        label: option.label,
        onClick: onClickActions[option.label],
      };
    });

  // At the end of the component, in the return statement, use conditional rendering
  if (!shouldRender) {
    return null;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return format(date, "M/d/yyyy");
  }

  // function formatDateTime(dateString: string) {
  //   const date = new Date(dateString);
  //   return format(date, "yyyy-MM-dd HH:mm");
  // }

  const matchedRoom = bookingData?.rooms?.find(
    (room: any) => room.reservationDetailID === reservationDetailId
  );

  const reservationStatus =
    bookingDetail?.reservationStatus ||
    matchedRoom?.reservationStatusMaster?.reservationStatus ||
    "—";

  const reservationStatusColour =
    bookingDetail?.reservationStatusColour ||
    matchedRoom?.reservationStatusMaster?.reservationStatusColour ||
    "#ccc";

  console.log("Matched Detail for status badge 🎯:", matchedRoom);

  console.log("hotelCurrency:", hotelCurrency);

  function formatDateTime(dateStr: string): string {
    const date = parseISO(dateStr);
    return format(date, "yyyy-MM-dd HH:mm");
  }

  function toValidDate(input: any): Date | null {
    if (!input) return null;
    // Use parseISO for ISO-like strings, else fall back to Date
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) {
      const d = parseISO(input);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = input instanceof Date ? input : new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  function safeFormatDateTime(input: any, fmt = "MMM d, yyyy") {
    const d = toValidDate(input);
    return d ? format(d, fmt) : "--";
  }

  const setBookingDrawerOpenSafe = (open: boolean) => {
    if (!isDrawerStateChanging.current) {
      isDrawerStateChanging.current = true;
      setBookingDrawerOpen(open);
      // Reset flag after state has likely updated
      setTimeout(() => {
        isDrawerStateChanging.current = false;
      }, 100);
    }
  };

  function safeFormatDate(input: any, fmt = "MMM d, yyyy") {
    const d = toValidDate(input);
    return d ? format(d, fmt) : "—";
  }

  // small helper to pick the first non-null/empty value
  const coalesce = (...vals: any[]) =>
    vals.find((v) => v !== null && v !== undefined && v !== "");

  const checkInRaw = coalesce(
    bookingData?.resCheckIn,
    booking?.resCheckIn,
    booking?.checkIn
  );

  const checkOutRaw = coalesce(
    shortenedCheckOut,
    extendedCheckOut,
    bookingData?.resCheckOut,
    booking?.resCheckOut,
    booking?.checkOut
  );

  const checkInDisplay = safeFormatDate(checkInRaw);
  const checkOutDisplay = safeFormatDate(checkOutRaw);
  console.log("booking data in drawer : ", bookingData);

  const handleRecallConfirm = () => {
    // Example: Assume status ID for "recalled" is 4

    // Dispatch the update reservation status action
    dispatch(updateReservationStatus({ reservationDetailId, statusId: 4 }));

    // Close the modal after dispatching the action
    setRecallModalOpen(false);
  };

  const handleCopy = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    navigator.clipboard.writeText(String(value));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 900);
  };

  // Just a plain constant inside your component
  const metaItems = [
    {
      key: "reservationNo",
      label: "Reservation No",
      value: reservationDetailDataState?.reservationNo,
    },
    {
      key: "reservationID",
      label: "Reservation ID",
      value: reservationDetailDataState?.reservationID,
    },
    {
      key: "reservationDetailID",
      label: "Reservation Detail ID",
      value: reservationDetailDataState?.reservationDetailID,
    },
    {
      key: "nameID",
      label: "Name ID",
      value: reservationDetailDataState?.nameID ?? guestProfile?.nameID,
    },
    {
      key: "guestProfileId",
      label: "Guest Profile ID",
      value: guestProfileId || "—",
    },
    {
      key: "reservationStatusID",
      label: "Reservation Status ID",
      value:
        reservationDetailDataState?.reservationStatusID ??
        reservationDetailDataState?.reservationStatusId,
    },
    {
      key: "roomNumber",
      label: "Room Number",
      value:
        reservationDetailDataState?.roomNumber ??
        reservationDetailDataState?.roomNumber,
    },
    {
      key: "currencyCode",
      label: "Currency",
      value: reservationDetailDataState?.currencyCode,
    },
    {
      key: "createdOn",
      label: "Created On",
      value: reservationDetailDataState?.createdOn
        ? safeFormatDateTime(reservationDetailDataState.createdOn)
        : undefined,
    },
    { key: "checkIn", label: "Check-in", value: checkInDisplay },
    { key: "checkOut", label: "Check-out", value: checkOutDisplay },
  ].filter(
    (it) => it.value !== undefined && it.value !== null && it.value !== ""
  );

  const handleRecallComplete = async () => {
    try {
      if (reservationDetailId) {
        await dispatch(fetchReservationRateDetails({ reservationDetailId }));
      }
      if (reservationDetailId) {
        await Promise.all([
          dispatch(fetchFolioByReservationDetailId(reservationDetailId)),
          dispatch(fetchRateDetailsById(reservationDetailId)),
        ]);
      }
      // If you maintain local bookingData:
      const fresh = reservationId
        ? await fetchReservationDataById(reservationId)
        : null;
      if (fresh) setBookingData(fresh);
    } finally {
      setRecallOpen(false);
    }
  };

  console.log("booking booking detail drawer : ", booking);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(newOpen) => {
          // Prevent unnecessary toggle cycles by debouncing
          if (typeof newOpen === "boolean" && newOpen !== open) {
            onOpenChange(newOpen);
          }
        }}
      >
        {/* Cash Payout Drawer */}
        <CashPayoutDrawer
          open={cashPayoutOpen}
          onClose={() => setCashPayoutOpen(false)}
          booking={{
            ...booking,
            reservationDetailID: bookingDetail?.reservationDetailID,
            reservationMasterID: booking.reservationID, // Map reservationID to reservationMasterID
            nameID: booking.nameID || 0, // Include nameID if it exists
            guestName: booking.bookerFullName,
            roomNumber: booking.roomNumber,
            currencyCode: booking.currencyCode,
          }}
        />
        <AttachmentPreviewDrawer
          open={attachmentDrawerOpen}
          onClose={() => setAttachmentDrawerOpen(false)}
          file={selectedAttachment}
        />

        {/* Extend Drawer */}
        <Sheet open={extendOpen} onOpenChange={setExtendOpen}>
          <SheetContent
            side="right"
            className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
          >
            <ExtendDrawer
              booking={booking}
              bookingDetail={bookingDetail}
              open={extendOpen}
              onClose={() => setExtendOpen(false)}
              onExtend={handleExtendStay}
            />
          </SheetContent>
        </Sheet>
        <SheetContent
          side="right"
          className={`z-[60] w-full sm:max-w-2xl h-full overflow-y-auto rounded-l-2xl transition-transform duration-300 ${
            groupOpen || anySubDrawerOpen ? "-translate-x-[100%]" : ""
          }`}
        >
          <div className="relative h-full flex flex-col">
            <div className="sticky top-0 z-50  bg-transparent p-4 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={booking?.agentLogoURL || undefined}
                        alt={booking?.sourceOfBooking || "Agent"}
                      />
                      <AvatarFallback className="text-[16px] bg-orange-500">
                        {initial}
                      </AvatarFallback>
                    </Avatar>

                    <h2 className="text-xl font-semibold">
                      {booking.bookerFullName}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {text.bookingDetailsText} {booking.reservationNo || 0}
                  </p>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full border inline-block mt-1"
                    style={{
                      backgroundColor: reservationStatusColour,
                      color:
                        reservationStatusColour?.toLowerCase() === "#ffff00"
                          ? "#000"
                          : "#fff",
                      borderColor: reservationStatusColour,
                    }}
                  >
                    {reservationStatus}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button variant="outline" onClick={() => setGroupOpen(true)}>
                    Rooming List
                  </Button>
                  <div className="flex flex-row items-center gap-6">
                    <div
                      onClick={openQR}
                      title="Show reservation QR "
                      className="cursor-pointer"
                    >
                      <QrCode size={28} />
                    </div>
                    <div
                      onClick={() => setOpenReportDrawer(true)}
                      className="cursor-pointer"
                    >
                      <FileChartColumnIncreasing size={28} />
                    </div>
                    <select
                      className="border rounded-md p-2 text-sm"
                      onChange={(e) => {
                        const selected = actionOptions.find(
                          (a) => a.label === e.target.value
                        );
                        if (selected && typeof selected.onClick === "function")
                          selected.onClick();
                        e.target.selectedIndex = 0; // Reset select
                      }}
                    >
                      <option>Actions</option>
                      {actionOptions.map((action, idx) => (
                        <option key={idx} value={action.label}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-[10px]">
              {/* Tabs for Overview, Financials, Guests, Attachments */}
              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="guests">Guests</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                </TabsList>
                <br></br>

                <TabsContent value="overview">
                  {/* Room Info */}
                  <div className="space-y-4 ">
                    <div className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {bookingDetail?.roomType}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {text.roomText} {bookingDetail?.roomNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {totalNetRate.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {text.totalText}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <Separator />
                  <div className="space-y-4 mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Reservation Details
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Reservation No
                          </p>
                          <p className="font-medium">
                            {reservationDetailData?.reservationNo || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Booking Ref
                          </p>
                          <p className="font-medium">
                            {reservationDetailData?.refNo || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Source
                          </p>
                          <p className="font-medium">
                            {reservationDetailData?.sourceOfBooking || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Created By
                          </p>
                          <p className="font-medium">
                            {reservationDetailData?.createdBy || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Check-in
                          </p>
                          <p className="font-medium">{checkInDisplay}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Check-out
                          </p>
                          <p className="font-medium">{checkOutDisplay}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="font-medium">Created On</div>
                          <div className="">
                            {safeFormatDateTime(
                              reservationDetailData?.createdOn
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Currency
                          </p>
                          <p className="font-medium">
                            {reservationDetailData?.currencyCode || "—"}
                          </p>
                        </div>
                      </div>
                      {/* <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Reservation Detail ID
                          </p>
                          <p className="font-medium">{reservationId || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Reservation ID
                          </p>
                          <p className="font-medium">
                            {booking.reservationID || "—"}
                          </p>
                        </div>
                      </div> */}
                    </div>
                  </div>
                  <br></br>
                  <Separator />

                  {/* Customer Info */}
                  <div className="space-y-4 mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Booker Details{" "}
                      {reservationDetailDataState?.reservationDetailID}
                    </h3>
                    <div className="space-y-3">
                      {/* Guest Profile ID */}
                      {/* <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Guest Profile ID
                        </p>
                        <p className="font-medium">{guestProfileId ?? "—"}</p>
                      </div> */}

                      {guestProfile ? (
                        <>
                          {/* Title & Name */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {/* <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Title
                              </p>
                              <p className="font-medium">
                                {bookingData.bookerFullName || "—"}
                              </p>
                            </div> */}
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {text.nameText}
                              </p>
                              <p className="font-medium">
                                {reservationDetailDataState?.bookerFullName ||
                                  "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Country
                              </p>
                              <p className="font-medium">
                                {reservationDetailDataState?.country || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Contact */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Phone
                              </p>
                              <p className="font-medium">
                                {reservationDetailData?.phone || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Email
                              </p>
                              <p className="font-medium">
                                {reservationDetailData?.email || "—"}
                              </p>
                            </div>
                          </div>

                          {/* Identification & DOB */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {/* <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Identification&nbsp;Number
                              </p>
                              <p className="font-medium">
                                {guestProfile.ppNo || "—"}
                              </p>
                            </div> */}
                            {/* <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Date&nbsp;of&nbsp;Birth
                              </p>
                              <p className="font-medium">
                                {guestProfile.dob
                                  ? format(
                                      new Date(guestProfile.dob),
                                      "MMM d, yyyy"
                                    )
                                  : "—"}
                              </p>
                            </div> */}
                          </div>

                          {/* Nationality & Zip */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            {/* <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Zip&nbsp;Code
                              </p>
                              <p className="font-medium">
                                {guestProfile.zipCode || "—"}
                              </p>
                            </div> */}
                          </div>

                          {/* Address */}
                          {/* <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Address
                            </p>
                            <p className="font-medium">
                              {[
                                guestProfile.address,
                                guestProfile.city,
                                guestProfile.country,
                              ]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </p>
                          </div> */}
                        </>
                      ) : (
                        <>
                          {/* Fallback to booking fields until profile arrives */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {text.nameText}
                              </p>
                              <p className="font-medium">
                                {reservationDetailDataState?.bookerFullName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {text.phoneText}
                              </p>
                              <p className="font-medium">
                                {reservationDetailData?.phone}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {text.emailText}
                            </p>
                            <p className="font-medium">
                              {reservationDetailData?.email}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <br></br>

                  <Separator />

                  {/* Notes */}
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        {text.notesText}
                      </h3>
                      <div className="flex gap-2">
                        {!editNotes ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditNotes(true)}
                          >
                            Edit
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditNotes(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSaveRemarks}
                            >
                              {editLoading ? "Saving..." : "Save"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {/* Internal Remarks */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Internal Remarks
                        </p>
                        {editNotes ? (
                          <Textarea
                            value={internalRemark}
                            onChange={(e) => setInternalRemark(e.target.value)}
                            placeholder="Type internal remarks..."
                            rows={4}
                          />
                        ) : (
                          <div className="border rounded p-2 text-sm bg-muted/50">
                            {reservationDetailData?.remarks_Internal ||
                              "No internal remarks"}
                          </div>
                        )}
                      </div>

                      {/* Guest Remarks */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Guest Remarks
                        </p>
                        {editNotes ? (
                          <Textarea
                            value={guestRemark}
                            onChange={(e) => setGuestRemark(e.target.value)}
                            placeholder="Type guest remarks..."
                            rows={4}
                          />
                        ) : (
                          <div className="border rounded p-2 text-sm bg-muted/50">
                            {guestRemark ||
                              reservationDetailData?.remarks_Guest ||
                              "No guest remarks"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <br />

                  {/* Hairline + Meta / IDs */}
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Meta / IDs
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {metaItems.map((item) => (
                        <div
                          key={item.key}
                          className="group flex items-center justify-between border rounded-md px-3 py-2 bg-muted/40 hover:bg-muted/60 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="font-mono text-xs truncate text-foreground">
                              {String(item.value)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => handleCopy(item.key, item.value)}
                            aria-label={`Copy ${item.label}`}
                            title="Copy"
                          >
                            {copiedKey === item.key ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                      {/* Static Guest Profile ID display */}
                      <div className="group flex items-center justify-between border rounded-md px-3 py-2 bg-muted/40 hover:bg-muted/60 transition">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            Guest Profile ID
                          </p>
                          <p className="font-mono text-xs truncate text-foreground">
                            {reservationDetailData?.guestProfileId ?? "—"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() =>
                            handleCopy(
                              "guestProfileId",
                              reservationDetailData?.guestProfileId
                            )
                          }
                          aria-label="Copy Guest Profile ID"
                          title="Copy"
                        >
                          {copiedKey === "guestProfileId" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expenses & Revisions */}
                  {/* remove 2025-08-22 12-59 - Priyanga  */}
                  {/* <Tabs defaultValue="expenses">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="expenses">
                        <CreditCard className="h-4 w-4 mr-2" />
                        {text.expensesText}
                      </TabsTrigger>
                      <TabsTrigger value="revisions">
                        <History className="h-4 w-4 mr-2" />
                        {text.revisionsText}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="expenses" className="space-y-4 pt-4">
                      <div className="border rounded-md divide-y">
                        {expenses.length > 0 ? (
                          expenses.map(
                            (
                              expense: { description: string; amount: string },
                              index: number
                            ) => (
                              <div
                                key={index}
                                className="p-3 flex justify-between items-center"
                              >
                                <p>{expense.description}</p>
                                <p className="font-medium">{expense.amount}</p>
                              </div>
                            )
                          )
                        ) : (
                          <div className="p-3 text-sm text-muted-foreground">
                            No expenses found.
                          </div>
                        )}
                        {expenses.length > 0 && (
                          <div className="p-3 flex justify-between items-center bg-muted/50">
                            <p className="font-medium">{text.totalText}</p>
                            <p className="font-medium">{amount}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="revisions" className="space-y-4 pt-4">
                      <div className="border rounded-md divide-y">
                        {revisions.length > 0 ? (
                          revisions.map(
                            (
                              revision: { description?: string; date?: string },
                              index
                            ) => (
                              <div key={index} className="p-3">
                                <div className="flex justify-between items-center">
                                  <p className="font-medium">
                                    {revision.description ||
                                      `Revision #${index + 1}`}
                                  </p>
                                </div>
                                {revision.date && (
                                  <p className="text-sm text-muted-foreground">
                                    {format(
                                      new Date(revision.date),
                                      "MMM d, yyyy, hh:mm a"
                                    )}
                                  </p>
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
                  </Tabs> */}

                  {/* Message Guest
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {text.messageGuestText}
                  </Button>
                </div> */}
                </TabsContent>

                <TabsContent value="financials" className="pt-4">
                  <div className="space-y-6 px-[10px]">
                    {/* Rates Table */}
                    <div className="space-y-6 px-[10px]">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Rates
                          {reservationRateDetailsLoading && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (Loading...)
                            </span>
                          )}
                          {reservationRateDetailsError && (
                            <span className="ml-2 text-xs text-red-500">
                              (Error: {reservationRateDetailsError})
                            </span>
                          )}
                        </h4>
                        <div className="overflow-auto border rounded-md">
                          <table className="w-full text-xs border border-muted">
                            <thead className="bg-muted text-muted-foreground divide-y divide-muted">
                              <tr>
                                <th className="p-2 text-left border">Date</th>
                                <th className="p-2 text-left border">
                                  Room Rate
                                </th>
                                <th className="p-2 text-left border">
                                  Discount
                                </th>
                                <th className="p-2 text-left border">
                                  Child Rate
                                </th>
                                <th className="p-2 text-left border">Ex Bed</th>
                                <th className="p-2 text-left border">
                                  Suppliment
                                </th>
                                <th className="p-2 text-left border">
                                  Net Rate
                                </th>
                                <th className="p-2 text-left border"></th>
                                <th className="p-2 text-left border">
                                  Night Audit
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-muted">
                              {reservationRateDetails &&
                              reservationRateDetails.length > 0 ? (
                                <>
                                  {reservationRateDetails.map(
                                    (rate: any, idx: number) => (
                                      <tr key={idx}>
                                        <td className="p-2 border">
                                          {rate.dt
                                            ? format(
                                                new Date(rate.dt),
                                                "MM/dd/yyyy"
                                              )
                                            : "—"}
                                        </td>
                                        <td className="p-2 border">
                                          {rate.roomRate ?? 0}
                                        </td>
                                        <td className="p-2 border">
                                          {rate.discPercen ?? 0}
                                        </td>
                                        <td className="p-2 border">
                                          {rate.childRate ?? 0}
                                        </td>
                                        <td className="p-2 border">
                                          {rate.exBedRate ?? 0}
                                        </td>
                                        <td className="p-2 border">
                                          {rate.suppliment ?? 0}
                                        </td>
                                        <td className="p-2 border">
                                          {rate.netRate ?? 0}
                                        </td>
                                        <td className="p-2 border">
                                          {rate.currencyCode}
                                        </td>
                                        <td className="p-2 border text-center">
                                          <input
                                            type="checkbox"
                                            checked={rate.isNightAudit}
                                            readOnly
                                          />
                                        </td>
                                      </tr>
                                    )
                                  )}
                                  {/* Totals */}
                                  <tr className="font-semibold bg-muted/50">
                                    <td className="p-2 border text-left">
                                      Total
                                    </td>
                                    <td className="p-2 border">
                                      {reservationRateDetails.reduce(
                                        (sum: number, r: any) =>
                                          sum + (r.roomRate || 0),
                                        0
                                      )}
                                    </td>
                                    <td className="p-2 border">
                                      {reservationRateDetails.reduce(
                                        (sum: number, r: any) =>
                                          sum +
                                          (r.discPercen || r.discount || 0),
                                        0
                                      )}
                                    </td>
                                    <td className="p-2 border">
                                      {reservationRateDetails.reduce(
                                        (sum: number, r: any) =>
                                          sum + (r.childRate || 0),
                                        0
                                      )}
                                    </td>
                                    <td className="p-2 border">
                                      {reservationRateDetails.reduce(
                                        (sum: number, r: any) =>
                                          sum + (r.exBedRate || 0),
                                        0
                                      )}
                                    </td>
                                    <td className="p-2 border">
                                      {reservationRateDetails.reduce(
                                        (sum: number, r: any) =>
                                          sum + (r.suppliment || 0),
                                        0
                                      )}
                                    </td>
                                    <td className="p-2 border">
                                      {reservationRateDetails.reduce(
                                        (sum: number, r: any) =>
                                          sum + (r.netRate || 0),
                                        0
                                      )}
                                    </td>
                                    <td className="p-2 border"></td>
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
                    </div>

                    {/* Folio Detail Table */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Folio Detail
                      </h4>
                      <div className="overflow-auto border rounded-md">
                        <table className="w-full text-xs border border-muted">
                          <thead className="bg-muted text-muted-foreground divide-y divide-muted">
                            <tr>
                              <th className="p-2 text-left border border-muted">
                                Date
                              </th>
                              <th className="p-2 text-left border border-muted">
                                Tran Type
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
                            {folioItem.length > 0 ? (
                              <>
                                {folioItem.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 border border-muted">
                                      {item.tranDate
                                        ? format(
                                            new Date(item.tranDate),
                                            "MMM d, yyyy"
                                          )
                                        : "—"}
                                    </td>
                                    <td className="p-2 border border-muted">
                                      {item.tranType || "—"}
                                    </td>
                                    <td className="p-2 border border-muted">
                                      {item.docNo || "—"}
                                    </td>
                                    <td className="p-2 border border-muted">
                                      {item.accountName || "—"}
                                    </td>
                                    <td className="p-2 border border-muted">
                                      {item.paymentMethod || "—"}
                                    </td>
                                    <td className="p-2 border border-muted">
                                      {item.amount?.toLocaleString() || "—"}
                                    </td>
                                  </tr>
                                ))}
                                <tr className="font-semibold bg-muted/50">
                                  <td
                                    colSpan={5}
                                    className="p-2 border border-muted font-medium text-left"
                                  >
                                    Total
                                  </td>
                                  <td className="p-2 border border-muted font-medium">
                                    {folioItems
                                      .reduce(
                                        (sum, item) => sum + (item.amount || 0),
                                        0
                                      )
                                      .toLocaleString()}
                                  </td>
                                </tr>
                              </>
                            ) : (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="p-3 text-sm text-muted-foreground text-center"
                                >
                                  No folio records found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Advances Table */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Deposits</h4>
                      <div className="overflow-auto border rounded-md">
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
                            {Array.isArray(transactions) &&
                              transactions.map((t, i) => (
                                <tr key={i}>
                                  <td className="p-2 border border-muted">
                                    {formatDate(t.tranDate)}
                                  </td>
                                  <td className="p-2 border border-muted">
                                    {formatDateTime(t.createdOn)}
                                  </td>
                                  <td className="p-2 border border-muted">
                                    {t.createdBy || "—"}
                                  </td>
                                  <td className="p-2 border border-muted">
                                    {t.docNo || "—"}
                                  </td>
                                  <td className="p-2 border border-muted">
                                    {t.paymentMethod || "—"}
                                  </td>
                                  <td className="p-2 border border-muted">
                                    {t.comments || "—"}
                                  </td>
                                  <td className="p-2 border border-muted text-right">
                                    {t.tranValue?.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    }) || "0.00"}
                                  </td>
                                </tr>
                              ))}

                            <tr className="font-semibold bg-muted/50">
                              <td
                                colSpan={6}
                                className="p-2 border border-muted text-left"
                              >
                                Total
                              </td>
                              <td className="p-2 border border-muted text-right">
                                {Array.isArray(transactions)
                                  ? transactions
                                      .reduce(
                                        (sum, t) => sum + (t.tranValue || 0),
                                        0
                                      )
                                      .toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                      })
                                  : "0.00"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="guests" className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      size="sm"
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() => setSecondGuestOpen(true)}
                    >
                      Add Guest
                    </Button>
                  </div>

                  {/* Guest Profile Data */}
                  <div className="overflow-auto border rounded-md">
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
                            Email
                          </th>
                          <th className="p-2 text-left border border-muted">
                            Is VIP
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted">
                        {guestMasItems && guestMasItems.length > 0 ? (
                          guestMasItems.map((guest, index) => (
                            <tr key={`guest-${guest.guestID}-${index}`}>
                              <td className="p-2 border border-muted font-medium">
                                {guest.guestName || "—"}
                              </td>
                              <td className="p-2 border border-muted">
                                {guest.nic || "—"}
                              </td>
                              <td className="p-2 border border-muted">
                                {guest.gender || "—"}
                              </td>
                              <td className="p-2 border border-muted">
                                {guest.nationality || "—"}
                              </td>
                              <td className="p-2 border border-muted">
                                {guest.phoneNo || "—"}
                              </td>
                              <td className="p-2 border border-muted">
                                {guest.email || "—"}
                              </td>
                              <td className="p-2 border border-muted">
                                {guest.isVIP ? "✓" : "—"}
                              </td>
                            </tr>
                          ))
                        ) : guestMasLoading ? (
                          <tr>
                            <td colSpan={7} className="p-3 text-center text-sm">
                              Loading guest information...
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center text-sm p-3 text-muted-foreground"
                            >
                              No guest profile data available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="pt-4">
                  <div className="border rounded-md p-4 bg-muted/20">
                    <div className="flex items-center gap-4 justify-between mb-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium block mb-1">
                          Document type
                        </label>
                        <select
                          className="w-full border rounded-md p-2 text-sm"
                          value={selectedDocType}
                          onChange={(e) => setSelectedDocType(e.target.value)}
                        >
                          <option value="Booking Voucher">
                            Booking Voucher
                          </option>
                          <option value="Passport / NIC">Passport / NIC</option>
                          <option value="Payment Slip">Payment Slip</option>
                          <option value="Visa Document">Visa Document</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex flex-col items-end justify-end h-full pt-6">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            className="text-sm hidden"
                            id="file-upload-input"
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const previews = files.map((file) => ({
                                file,
                                docType: selectedDocType,
                                url: URL.createObjectURL(file),
                              }));
                              setPreviewFiles((prev) => [...prev, ...previews]);
                            }}
                          />
                          <label
                            htmlFor="file-upload-input"
                            className="cursor-pointer text-sm border rounded-md px-3 py-2 bg-muted hover:bg-muted/80"
                          >
                            Choose Files
                          </label>
                          <Button
                            size="sm"
                            disabled={fileUploadLoading}
                            onClick={async () => {
                              try {
                                const fileInput = document.querySelector(
                                  'input[type="file"]'
                                ) as HTMLInputElement;
                                const file = fileInput?.files?.[0];
                                if (!file) return alert("No file selected");

                                // Get file extension
                                const fileExtension =
                                  file.name.split(".").pop()?.toLowerCase() ||
                                  "";
                                const supportedExtensions = [
                                  "jpg",
                                  "jpeg",
                                  "png",
                                  "pdf",
                                  "doc",
                                  "docx",
                                ];

                                if (
                                  !supportedExtensions.includes(fileExtension)
                                ) {
                                  alert(
                                    `Unsupported file type. Please upload one of: ${supportedExtensions.join(
                                      ", "
                                    )}`
                                  );
                                  return;
                                }

                                // Set uploading state (Redux will handle the loading state)
                                setUploadProgress(0);

                                // Use new file upload API
                                const uploadPayload = {
                                  file: file,
                                  folioID: reservationDetailId, // Use reservationDetailId as folioId
                                  fileType: selectedDocType,
                                  resNo: booking?.resNo || "",
                                  bucketName: "citruspms", // Default bucket name or from config
                                };

                                console.log("Uploading file:", {
                                  fileName: file.name,
                                  folioID: reservationDetailId,
                                  fileType: selectedDocType,
                                });

                                // Dispatch the file upload action
                                const result = await dispatch(
                                  createFileUpload(uploadPayload)
                                );

                                setUploadProgress(100);

                                if (createFileUpload.fulfilled.match(result)) {
                                  console.log(
                                    "File uploaded successfully:",
                                    result.payload
                                  );

                                  // Refresh the file list
                                  dispatch(
                                    fetchFileUploadsByFolioId({
                                      folioId: reservationDetailId,
                                    })
                                  );

                                  // Clear the file input and preview files
                                  const uploadFileInput =
                                    document.querySelector(
                                      'input[type="file"]'
                                    ) as HTMLInputElement;
                                  if (uploadFileInput)
                                    uploadFileInput.value = "";
                                  setPreviewFiles([]);

                                  alert("File uploaded successfully!");
                                } else {
                                  throw new Error(
                                    result.payload || "Upload failed"
                                  );
                                }

                                // Reset progress after a short delay
                                setTimeout(() => {
                                  setUploadProgress(0);
                                }, 2000);
                              } catch (err) {
                                console.error("Upload error:", err);
                                alert(
                                  "Upload failed: " +
                                    (err instanceof Error
                                      ? err.message
                                      : "Unknown error")
                                );
                              }
                            }}
                          >
                            {fileUploadLoading ? "Uploading..." : "Upload"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Preview section for selected files */}
                    {previewFiles.length > 0 && (
                      <div className="mt-4 space-y-6">
                        {[
                          "Booking Voucher",
                          "Passport / NIC",
                          "Visa Document",
                          "Payment Slip",
                          "Other",
                        ].map((type) => {
                          const filtered = previewFiles.filter(
                            (p) => p.docType === type
                          );
                          return filtered.length > 0 ? (
                            <div key={type} className="border-t pt-4">
                              <h4 className="text-sm font-semibold mb-3">
                                {type}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filtered.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="border rounded-md p-2 bg-white shadow-sm flex items-center gap-3 group relative cursor-pointer"
                                    onClick={() => {
                                      setPreviewFile({
                                        url: p.url,
                                        name: p.file.name,
                                        type: p.file.type,
                                        size: p.file.size,
                                      });
                                      setPreviewZoomLevel(1); // Reset zoom level
                                      setPreviewDrawerOpen(true);
                                    }}
                                  >
                                    <div className="h-16 w-16 flex-shrink-0">
                                      {p.file.type.startsWith("image/") ? (
                                        <img
                                          src={p.url}
                                          alt={p.file.name}
                                          className="h-full w-full object-cover rounded-md"
                                        />
                                      ) : p.file.type === "application/pdf" ? (
                                        <div className="h-full w-full flex items-center justify-center text-xs bg-muted rounded-md">
                                          <div className="text-center">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="24"
                                              height="24"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="mx-auto text-red-500"
                                            >
                                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                              <polyline points="14 2 14 8 20 8"></polyline>
                                              <path d="M9 15v-4"></path>
                                              <path d="M12 15v-2"></path>
                                              <path d="M15 15v-4"></path>
                                            </svg>
                                            <span>PDF</span>
                                          </div>
                                        </div>
                                      ) : p.file.type ===
                                          "application/msword" ||
                                        p.file.type ===
                                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                                        <div className="h-full w-full flex items-center justify-center text-xs bg-muted rounded-md">
                                          <div className="text-center">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="24"
                                              height="24"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="1.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="mx-auto text-blue-500"
                                            >
                                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                              <polyline points="14 2 14 8 20 8"></polyline>
                                            </svg>
                                            <span>DOC</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center text-xs bg-muted rounded-md">
                                          {p.file.name
                                            .split(".")
                                            .pop()
                                            ?.toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="overflow-hidden">
                                      <div className="text-sm font-medium truncate">
                                        {p.file.name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {(p.file.size / 1024).toFixed(1)} KB
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening the viewer
                                        setPreviewFiles((prev) =>
                                          prev.filter((_, i) => i !== idx)
                                        );
                                        URL.revokeObjectURL(p.url); // Clean up memory
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-white rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                      aria-label="Remove file"
                                    >
                                      <Trash2 className="w-4 h-4 text-gray-700" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Attachments Section */}
                    <Separator className="my-6" />
                    <h3 className="text-sm font-semibold mb-3">Attachments</h3>
                    {folioUploadsLoading && (
                      <p className="text-sm text-muted-foreground">
                        Loading attachments...
                      </p>
                    )}
                    {/* {folioUploadsError && (
                      <p className="text-sm text-red-500">Error loading attachments: {folioUploadsError}</p>
                    )} */}
                    {folioUploads.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {folioUploads.map((attachment, idx) => {
                          // Use the URL for extension detection
                          const rawUrl = attachment.url || "";

                          // Clean URL (remove query parameters)
                          const cleanedImageUrl = rawUrl.split("?")[0];

                          // Get extension
                          const fileExt =
                            cleanedImageUrl.split(".").pop()?.toLowerCase() ||
                            attachment.fileName
                              ?.split(".")
                              .pop()
                              ?.toLowerCase() ||
                            "";

                          // Determine file type
                          const isImage = [
                            "jpg",
                            "jpeg",
                            "png",
                            "gif",
                          ].includes(fileExt);
                          const isPdf = fileExt === "pdf";
                          const isDoc = ["doc", "docx"].includes(fileExt);

                          return (
                            <div
                              key={idx}
                              className="border rounded-md p-2 bg-white shadow-sm cursor-pointer"
                              onClick={() => {
                                setSelectedAttachment({
                                  url: cleanedImageUrl,
                                  type: fileExt,
                                  name:
                                    attachment.fileName ||
                                    `Attachment ${idx + 1}`,
                                });
                                setAttachmentDrawerOpen(true);
                              }}
                            >
                              {isImage ? (
                                <img
                                  src={cleanedImageUrl}
                                  alt={
                                    attachment.fileName ||
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
                                {attachment.fileName || `Attachment ${idx + 1}`}
                              </div>
                              <div className="text-xs text-muted-foreground text-center">
                                {attachment.fileType
                                  ? `${attachment.fileType}`
                                  : ""}
                                {attachment.resNo
                                  ? ` • ${attachment.resNo}`
                                  : ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : !folioUploadsLoading ? (
                      <p className="text-sm text-muted-foreground">
                        No attachments found.
                      </p>
                    ) : null}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Group Reservation Slider */}
      <Sheet open={groupOpen} onOpenChange={setGroupOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl h-full overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <div className="p-4 space-y-4">
            <h3 className="text-lg font-semibold">Group Reservation List</h3>

            {bookingData?.rooms?.length > 0 ? (
              <div className="space-y-4">
                {bookingData.rooms.map((room, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white dark:bg-gray-900"
                  >
                    {/* Status badge */}
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className="text-xs font-semibold  px-2 py-0.5 rounded"
                        style={{
                          backgroundColor:
                            room.reservationStatusMaster
                              ?.reservationStatusColour,
                          color: "#000",
                        }}
                      >
                        {room.reservationStatusMaster?.reservationStatus ||
                          "Confirmed"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {room.roomType}
                      </span>
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
                        {booking.phone || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Basis:</span>{" "}
                        {room.basis || "—"}
                      </div>
                      <div>
                        <span className="font-semibold">Repeat:</span> No
                      </div>
                      <div>
                        <span className="font-semibold">Is VIP:</span> No
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No reservations found.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={secondGuestOpen} onOpenChange={setSecondGuestOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300"
        >
          {/* <SecondGuestDrawer
            reservationId={reservationId!}
            reservationDetailId={reservationDetailId!}
            onClose={() => setSecondGuestOpen(false)}
            countryListFromWalkIn={countryListFromWalkIn}
            onSuccess={async () => {
              // refresh relevant data after linking second guest
              if (reservationDetailId) {
                await dispatch(fetchReservationRateDetails({ reservationDetailId }));
              }
              if (reservationDetailId) {
                await Promise.all([
                  dispatch(
                    fetchFolioByReservationDetailId(reservationDetailId)
                  ),
                  dispatch(fetchRateDetailsById(reservationDetailId)),
                ]);
              }
              setSecondGuestOpen(false);
              toast.success("Second guest added");
            }}
          /> */}
          <SecondGuestDrawer
            open={secondGuestOpen}
            onClose={() => setSecondGuestOpen(false)}
            reservationId={reservationId!}
            reservationDetailId={reservationDetailId!}
            countryListFromWalkIn={countryListFromWalkIn}
            onSuccess={async (created) => {
              // (optional) optimistic add so the row appears instantly
              const id = created?.guestProfileId ?? created?.profileId;
              if (id) {
                setRoomGuestProfiles((prev) => {
                  const list = (prev || []).filter(Boolean);
                  const exists = list.some(
                    (g) => (g.guestProfileId ?? g.profileId) === id
                  );
                  return exists ? list : [created, ...list];
                });
              }

              // strong consistency: refetch from server
              await refreshRoomGuestProfiles();

              setSecondGuestOpen(false);
              toast.success("Second guest added");
            }}
          />
        </SheetContent>
      </Sheet>

      <BookingPageDetailsDrawer
        open={groupOpen}
        onOpenChange={(open) => {
          if (!open) {
            setGroupOpen(false);
            setSelectedBooking(null); // 👈 reset before drawer unmount
          } else {
            setGroupOpen(true);
          }
        }}
        bookingDetail={bookingDetail} // ✅ Pass full object with reservationDetailID
        guestProfileData={
          selectedBooking?.reservationDetailID
            ? guestProfilesByDetailId[selectedBooking.reservationDetailID]
            : null
        }
        onCancelBookingClick={() => {
          setCancelModalOpen(true);
          setBookingDrawerOpenSafe(false);
        }}
      />

      {/* Sub Drawers using Sheet */}
      <Sheet open={checkInOpen} onOpenChange={setCheckInOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <CheckInFormDrawer
            bookingDetail={bookingDetail}
            onClose={handleCheckInComplete}
            title={guestProfile?.title ?? ""}
            dob={guestProfile?.dob ?? ""}
            nationality={guestProfile?.nationality ?? ""}
            country={guestProfile?.country ?? ""}
            guestProfileData={guestProfileData}
            guestProfileId={booking.guestProfileId}
            countryListFromWalkIn={countryListFromWalkIn}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={changeDateOpen} onOpenChange={setChangeDateOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <ChangeDateDrawer
            bookingDetail={booking} // your object with resCheckIn/resCheckOut etc.
            onClose={() => setChangeDateOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={checkOutOpen} onOpenChange={setCheckOutOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <CheckOutFormDrawer
            bookingDetail={bookingDetail}
            onClose={handleCheckOutComplete}
            standalone={false}
            reservationData={bookingData}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={shortenOpen} onOpenChange={setShortenOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <ShortenDrawer
            bookingDetail={bookingDetail}
            open={shortenOpen}
            onClose={() => setShortenOpen(false)}
            onShorten={handleShortenStay}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={postChargesOpen} onOpenChange={setPostChargesOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <PostChargesDrawer
            bookingDetail={bookingDetail}
            open={postChargesOpen}
            onClose={handlePostChargesComplete}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={postCreditOpen} onOpenChange={setPostCreditOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <PostCreditDrawer
            bookingDetail={bookingDetail}
            open={postCreditOpen}
            onClose={handlePostCreditComplete}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={takePaymentsOpen} onOpenChange={setTakePaymentsOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <TakePaymentsDrawer
            bookingDetail={bookingDetail}
            open={takePaymentsOpen}
            onClose={() => setTakePaymentsOpen(false)} // properly close drawer
            onComplete={handleTakePaymentsComplete} // trigger fetch & refresh
            isBookingPageView={isBookingPageView}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={amendOpen} onOpenChange={setAmendOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <AmendDrawer
            bookingDetail={bookingDetail}
            onClose={handleAmendComplete}
            guestProfileId={guestProfileId}
            reservationStatusID={booking?.reservationStatusID || 0}
            reservationData={bookingData}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={roomChangeOpen} onOpenChange={setRoomChangeOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <RoomChangeDrawer
            bookingDetail={bookingDetail}
            onClose={handleRoomChangeComplete}
            onRoomChange={(newRoomNumber) => {
              console.log("Room changed to:", newRoomNumber);
            }}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={noShowOpen} onOpenChange={setNoShowOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <NoShowDrawer
            bookingDetail={{
              reservationNo: bookingDetail?.reservationNo,
              reservationDetailID: bookingDetail?.reservationDetailID,
            }}
            onClose={handleNoShowClose}
            onConfirm={handleNoShowComplete} // now uses new thunk
            isLoading={isMarkingNoShow}
            setTakePaymentsOpen={setTakePaymentsOpen}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={cancelBookingOpen} onOpenChange={setCancelBookingOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <CancelBookingDrawer
            isOpen={cancelBookingOpen}
            onClose={handleCancelBookingClose}
            onConfirm={handleCancelBookingComplete}
            bookingDetail={{
              ...booking,
              reservationNo: booking.reservationNo,
              reservationDetailID: booking.reservationDetailID,
              reservationStatusId: 5,
              reservationID: booking.reservationID,
              guest: booking.bookerFullName || "Guest",
              roomType: booking.roomTypeName || "Room",
              roomNumber: booking.roomNumber || "",
              status: booking.status || "",
              checkIn: booking.checkInDate || "",
              checkOut: booking.checkOutDate || "",
            }}
          />
        </SheetContent>
      </Sheet>
      {/* Removed Sheet wrappers for Cancel Booking, No Show, and Rollback. Actions are now handled by modals below. */}

      <ReportsDrawer
        isOpen={openReportDrawer}
        onClose={() => setOpenReportDrawer(false)}
        bookingDetail={reservationDetailData}
        reservationDetailID={reservationDetailData?.reservationDetailID || 0}
      />

      {recallModalOpen && (
        <div className="fixed inset-0  bg-black/50 flex items-center justify-center ">
          <div className="bg-background rounded-xl p-6 w-full max-w-md shadow-lg border z-50">
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Recall Booking
                </h2>
                <p className="text-sm text-muted-foreground">
                  Reservation No: {booking?.reservationNo || "—"}
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
                <Button className="w-24" onClick={handleRecallConfirm}>
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sheet open={rollbackOpen} onOpenChange={setRollbackOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <RollbackDrawer
            bookingDetail={{
              reservationDetailID: bookingDetail?.reservationDetailID,
              reservationNo: booking?.reservationNo,
              currentStatusId:
                booking?.reservationStatusID ?? booking?.reservationStatusId,
            }}
            onClose={async () => {
              // refresh after close (in case a rollback happened)
              if (reservationDetailId)
                await dispatch(
                  fetchReservationRateDetails({ reservationDetailId })
                );
              if (reservationDetailId) {
                await Promise.all([
                  dispatch(
                    fetchFolioByReservationDetailId(reservationDetailId)
                  ),
                  dispatch(fetchRateDetailsById(reservationDetailId)),
                ]);
              }
              setRollbackOpen(false);
            }}
            onConfirm={async (payload) => {
              // === ROLLBACK ACTION HERE ===
              // If you have a real rollback thunk, call it here.
              // Fallback: move status back to "Confirmed" (⚠️ set the right ID for your system)
              const CONFIRMED_STATUS_ID = 2; // <-- change to your actual "Confirmed" status id

              try {
                await dispatch(
                  updateReservationStatus({
                    reservationDetailId: reservationDetailId!,
                    statusId: CONFIRMED_STATUS_ID,
                  })
                );
                toast.success("Booking rolled back");
                // refresh views
                if (reservationDetailId)
                  await dispatch(
                    fetchReservationRateDetails({ reservationDetailId })
                  );
                if (reservationDetailId) {
                  await Promise.all([
                    dispatch(
                      fetchFolioByReservationDetailId(reservationDetailId)
                    ),
                    dispatch(fetchRateDetailsById(reservationDetailId)),
                  ]);
                }
                setRollbackOpen(false);
              } catch (err) {
                console.error(err);
                toast.error("Failed to rollback booking");
              }
            }}
          />
        </SheetContent>
      </Sheet>

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-xl p-6 w-full max-w-md shadow-lg border">
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Cancel Booking
                </h2>
                <p className="text-sm text-muted-foreground">
                  Reservation No: {booking?.reservationNo || "—"}
                </p>
              </div>

              <p className="text-sm text-foreground font-medium">
                Are you sure you want to cancel this booking?
              </p>

              <div className="space-y-1">
                <Label
                  htmlFor="cancelReason"
                  className="text-sm font-medium text-foreground"
                >
                  Reason for Cancellation
                </Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason"
                  className="resize-none w-full"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="w-24"
                  onClick={() => setCancelModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="w-24"
                  onClick={async () => {
                    if (!booking?.reservationDetailID) return;

                    const storedToken = localStorage.getItem("hotelmateTokens");
                    const token = storedToken
                      ? JSON.parse(storedToken).accessToken
                      : null;

                    if (!token) {
                      console.error("No access token found.");
                      return;
                    }

                    const payload = {
                      reservationDetailId: booking.reservationDetailID,
                      status: "Cancelled",
                      cancelReason: cancelReason,
                      cancelledBy: fullName,
                      cancelledOn: new Date().toISOString(),
                      reservationStatusId:
                        booking.reservationStatusId ||
                        booking.reservationStatusID ||
                        0,
                    };

                    try {
                      try {
                        await cancelReservationRoom({
                          token,
                          reservationDetailId: booking.reservationDetailID,
                          payload,
                        });
                      } catch (error) {
                        console.error(
                          "Room cancellation failed:",
                          (error as Error).message || error
                        );
                        return;
                      }

                      try {
                        await cancelReservation({
                          token,
                          reservationDetailId: booking.reservationDetailID,
                          payload: {
                            ...payload,
                            reservationStatusId: booking.reservationStatusId,
                          },
                        });

                        console.log("Cancellation successful");
                        if (onCancelBookingClick) onCancelBookingClick();
                        setCancelModalOpen(false);
                        onOpenChange(false);
                        setTimeout(() => {
                          alert("Cancellation successful");
                          // location.reload();
                        }, 100);
                      } catch (error) {
                        console.error(
                          "Reservation cancellation failed:",
                          (error as Error).message || error
                        );
                      }
                    } catch (error) {
                      console.error(
                        "Error while cancelling reservation:",
                        error
                      );
                    }
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview File Drawer */}
      <Sheet open={previewDrawerOpen} onOpenChange={setPreviewDrawerOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          {previewFile && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold truncate">
                    {previewFile.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {previewFile.size
                      ? `${(previewFile.size / 1024).toFixed(1)} KB`
                      : ""}{" "}
                    • {selectedDocType}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDrawerOpen(false)}
                >
                  Close
                </Button>
              </div>

              <div className="p-4 flex flex-col gap-4 h-full">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPreviewZoomLevel((prev) => Math.max(0.5, prev - 0.1))
                    }
                  >
                    -
                  </Button>
                  <span className="text-sm font-medium">
                    {Math.round(previewZoomLevel * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPreviewZoomLevel((prev) => Math.min(3, prev + 0.1))
                    }
                  >
                    +
                  </Button>
                </div>

                <div className="flex-1 bg-muted/20 rounded-lg p-4 flex items-center justify-center overflow-auto h-[calc(100vh-200px)]">
                  <div
                    style={{
                      transform: `scale(${previewZoomLevel})`,
                      transition: "transform 0.2s ease",
                      maxHeight: "100%",
                      maxWidth: "100%",
                    }}
                    className="origin-center"
                  >
                    {previewFile && previewFile.type.startsWith("image/") ? (
                      <img
                        src={previewFile.url}
                        alt={previewFile.name}
                        className="max-w-full max-h-full object-contain"
                        style={{ display: "block", margin: "0 auto" }}
                      />
                    ) : previewFile &&
                      previewFile.type === "application/pdf" ? (
                      <iframe
                        src={previewFile.url}
                        title={previewFile.name}
                        className="w-full h-full min-h-[500px] border-0"
                      />
                    ) : (
                      previewFile && (
                        <div className="bg-white p-8 rounded shadow-lg">
                          <p className="text-center">
                            This file type (
                            {previewFile.name.split(".").pop()?.toUpperCase()})
                            cannot be previewed directly.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2"></div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={transferFolioOpen} onOpenChange={setTransferFolioOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          {transferFolioBooking && (
            <TransferFolioDrawer
              open={transferFolioOpen}
              onClose={() => setTransferFolioOpen(false)}
              bookingDetail={{
                reservationID: transferFolioBooking.reservationID,
                reservationDetailID: transferFolioBooking.reservationDetailID,
                reservationNo: transferFolioBooking.reservationNo,
                roomNumber: transferFolioBooking.roomNumber,
                guest:
                  transferFolioBooking.guest ||
                  transferFolioBooking.bookerFullName,
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Upload Progress Indicator */}
      {fileUploadLoading && uploadProgress > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4 border">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-lg font-semibold mb-4">Uploading Document</h3>
              <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {uploadProgress < 100
                  ? `${Math.round(uploadProgress)}% complete`
                  : "Processing..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <Sheet open={recallOpen} onOpenChange={setRecallOpen}>
        <SheetContent
          side="right"
          className="z-[70] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
        >
          <RecallDrawer
            bookingDetail={{
              reservationDetailID: bookingDetail?.reservationDetailID,
              reservationNo: booking?.reservationNo,
            }}
            onClose={handleRecallComplete}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

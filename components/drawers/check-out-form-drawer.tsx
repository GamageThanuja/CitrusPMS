// @ts-nocheck
"use client";
import { createCheckOut } from "@/redux/slices/createCheckOutSlice";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CreditCard,
  Download,
  Printer,
  Send,
  AlertCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useTranslatedText } from "@/lib/translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchFolioByReservationDetailId } from "@/redux/slices/folioSlice";
import { useAppSelector } from "@/redux/hooks";
import { useDispatch } from "react-redux";
import { updateHousekeepingStatus } from "@/redux/slices/housekeepingStatusSlice";
import InvoicePrintDrawer from "@/components/drawers/invoice-print-drawer";
import { useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { fetchTransactions } from "@/redux/slices/transactionSlice"; // <-- your existing file
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";

/** ——— Group context (same shape used in your other drawers) ——— */
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

/** ——— Types ——— */
interface bookingDetail {
  reservationDetailID: number;
  reservationStatusId?: number;
  checkINat?: string;
  checkedInBy?: string;
  isRepeatGuest?: boolean;
  reservationID?: number;
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
  nights?: number;
  status?: string;
  id?: number;
  rooms?: { reservationDetailID?: number }[];
  roomID?: number;
  roomId?: number;
  roomNoId?: number;
}

interface CheckOutFormDrawerProps {
  bookingDetail: bookingDetail | null;
  onClose: () => void;
  isOpen?: boolean;
  standalone?: boolean;
  /** NEW: when invoked via Group Action */
  groupContext?: GroupContext;
}

/** ——— Helpers ——— */
const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function safeFormatDate(d?: string | Date) {
  if (!d) return "—";
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString();
  } catch {
    return "—";
  }
}

export function CheckOutFormDrawer({
  bookingDetail,
  onClose,
  isOpen = true,
  standalone = true,
  groupContext, // 👈 NEW
}: CheckOutFormDrawerProps) {
  if (!bookingDetail) return null;

  const dispatch = useDispatch();

  const { user } = useUserFromLocalStorage();

  const {
    data: txRows = [],
    loading: txLoading,
    error: txError,
  } = useSelector(
    (s: RootState) => s.transaction || { data: [], loading: false, error: null }
  );

  console.log("booking detail in checkout drawer : ", bookingDetail);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "error";
    message: string;
  } | null>(null);

  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);

  // NEW: apply-to-all toggle for groups
  const [applyToAllSelected, setApplyToAllSelected] = useState(true);

  // i18n
  const checkOutFormText = useTranslatedText("Check-out Form");
  const invoiceText = useTranslatedText("Invoice");
  const receiptText = useTranslatedText("Receipt");
  const paymentMethodText = useTranslatedText("Payment Method");
  const paymentDateText = useTranslatedText("Payment Date");
  const descriptionText = useTranslatedText("Description");
  const amountText = useTranslatedText("Amount");
  const totalText = useTranslatedText("Total");
  const printText = useTranslatedText("Print");
  const downloadText = useTranslatedText("Download");
  const emailText = useTranslatedText("Email");
  const completeCheckOutText = useTranslatedText("Complete Check-out");
  const cancelText = useTranslatedText("Cancel");

  /** Choose a *primary* reservationDetailId for fetching/previewing the folio.
   * For group flows we show the first selected room's folio as a preview. */
  const primaryRdIdFromGroup =
    groupContext?.isGroup && groupContext.detailIds?.length
      ? groupContext.detailIds[0]
      : undefined;

  const rdId =
    primaryRdIdFromGroup ??
    bookingDetail?.reservationDetailID ??
    bookingDetail?.rooms?.[0]?.reservationDetailID ??
    bookingDetail?.id;

  // Folio (for the primary RD only — the preview pane)
  const { data: folioItems = [], loading: folioLoading } = useAppSelector(
    (state) => state.folio || { data: [], loading: false }
  );

  useEffect(() => {
    if (rdId) {
      dispatch(fetchFolioByReservationDetailId(rdId));
    }
  }, [dispatch, rdId]);

  // Compute preview totals from folio items
  const totalAmount = useMemo(() => {
    return (folioItems ?? []).reduce((sum: number, it: any) => {
      const n = Number(it?.amount);
      return Number.isFinite(n) ? sum + n : sum;
    }, 0);
  }, [folioItems]);

  // Sample receipt math left intact
  const roomRate = 150;
  const totalNights = Number(bookingDetail?.nights ?? 0);
  const roomTotal = roomRate * totalNights;
  const additionalCharges = 45;
  const taxRate = 0.12;
  const taxAmount = (roomTotal + additionalCharges) * taxRate;
  const grandTotal = roomTotal + additionalCharges + taxAmount;

  const selectedCount = groupContext?.selectedRooms?.length ?? 0;
  const isGroupApplied = !!(groupContext?.isGroup && applyToAllSelected);

  const handleCheckOut = async () => {
    if (!bookingDetail) return;
    
    // ✅ read username from localStorage (fallback to "Sandun")
    const usernameLS =
      (localStorage.getItem("rememberedUsername"));
      
    // ✅ use bookingDetail.* for params
    const reservationDetailId = Number(bookingDetail?.reservationDetailID);
    const roomId = Number(
      bookingDetail?.roomId ?? bookingDetail?.roomID ?? bookingDetail?.roomNoId
    );

    if (!reservationDetailId || !roomId) {
      setFeedbackMessage({
        type: "error",
        message: "Missing reservation or room information.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      // ✅ call Redux thunk for /api/Checkout
      await dispatch(
        createCheckOut({
          username: usernameLS,
          reservationDetailId,
          roomId,
        })
      ).unwrap();

      // Optional: mark housekeeping Dirty (non-blocking)
      // try {
      //   await dispatch(
      //     updateHousekeepingStatus({
      //       id: roomId,
      //       housekeepingStatus: "Dirty",
      //     })
      //   ).unwrap();
      // } catch (e) {
      //   console.warn("Housekeeping update failed (non-blocking):", e);
      // }

      toast.success("Checked out successfully.", { duration: 3000 });
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error("Check-out error:", error);
      setFeedbackMessage({
        type: "error",
        message: "Failed to complete check-out. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  // fetch when rdId (or preview room) changes
  useEffect(() => {
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelCode = selectedProperty?.hotelCode;
    console.log("hotel code : ", hotelCode);
    if (!hotelCode || !rdId) return;
    dispatch(
      fetchTransactions({
        hotelCode,
        reservationDetailId: Number(rdId),
        reservationId: bookingDetail?.reservationID,
      })
    );
  }, [dispatch, rdId]);

  const paymentRows = useMemo(() => {
    const rows = Array.isArray(txRows) ? txRows : [];
    return rows.filter((r: any) => {
      const tt = (r?.tranType ?? "").toString().trim().toLowerCase();
      return tt === "receive payment"; // case-insensitive match
    });
  }, [txRows]);

  // update receiptTotal to sum only filtered rows
  const receiptTotal = useMemo(() => {
    return (paymentRows ?? []).reduce((sum: number, r: any) => {
      const n = Number(r?.tranValue ?? r?.amount);
      return Number.isFinite(n) ? sum + n : sum;
    }, 0);
  }, [paymentRows]);

  const content = (
    <>
      <SheetHeader>
        <SheetTitle>{checkOutFormText}</SheetTitle>
        <div className="border-b border-border my-2" />
      </SheetHeader>

      <ScrollArea className="h-full w-full ">
        <div className="space-y-6 ">
          {/* ——— Group banner ——— */}
          {groupContext?.isGroup && selectedCount > 0 && (
            <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    Group check-out • {selectedCount} room
                    {selectedCount > 1 ? "s" : ""}
                  </div>
                  <div className="text-xs opacity-80">
                    The check-out action will be applied to all selected rooms.
                    The folio shown below is for the first selected room.
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

              {/* Chips: roomNumber • roomType */}
              {!!groupContext.selectedRooms?.length && (
                <div className="max-h-24 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {groupContext.selectedRooms.map((r) => (
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
              )}
            </div>
          )}

          <Tabs defaultValue="invoice">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoice">{invoiceText}</TabsTrigger>
              <TabsTrigger value="receipt">{receiptText}</TabsTrigger>
            </TabsList>

            {/* INVOICE / Folio Preview (Primary RD only) */}
            <TabsContent value="invoice" className="space-y-6 ">
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">{invoiceText}</h4>
                  <p className="text-sm text-muted-foreground">
                    #{rdId ?? "—"}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Folio Detail</h4>

                  <div className="rounded-xl border overflow-hidden">
                    <div className="max-h-[48vh] overflow-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 z-10 bg-muted text-muted-foreground">
                          <tr className="divide-x divide-muted">
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Tran Type</th>
                            <th className="p-2 text-left">Doc No</th>
                            <th className="p-2 text-left">POS Center</th>
                            <th className="p-2 text-left">Pmt. Mtd</th>
                            <th className="p-2 text-left">Credit</th>
                            <th className="p-2 text-left">Debit</th>
                            <th className="p-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted">
                          {folioLoading ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="p-3 text-center text-muted-foreground"
                              >
                                Loading folio…
                              </td>
                            </tr>
                          ) : (folioItems?.length ?? 0) > 0 ? (
                            <>
                              {folioItems.map((item: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className={
                                    idx % 2 === 0
                                      ? "bg-background"
                                      : "bg-muted/20"
                                  }
                                >
                                  <td className="p-2">
                                    {safeFormatDate(item?.tranDate)}
                                  </td>
                                  <td className="p-2">
                                    {item?.tranType || "—"}
                                  </td>
                                  <td className="p-2">{item?.docNo || "—"}</td>
                                  <td className="p-2">
                                    {item?.accountName || "—"}
                                  </td>
                                  <td className="p-2">
                                    {item?.paymentMethod || "—"}
                                  </td>
                                  <td className="p-2 text-center">
                                    {item?.credit ?? "—"}
                                  </td>
                                  <td className="p-2 text-center">
                                    {item?.debit ?? "—"}
                                  </td>
                                  <td className="p-2 text-right">
                                    {Number.isFinite(Number(item?.amount))
                                      ? money.format(Number(item?.amount))
                                      : "—"}
                                  </td>
                                </tr>
                              ))}

                              <tr className="bg-muted/50 font-semibold">
                                <td colSpan={7} className="p-2 text-left">
                                  Total
                                </td>
                                <td className="p-2 text-right">
                                  {money.format(totalAmount)}
                                </td>
                              </tr>
                            </>
                          ) : (
                            <tr>
                              <td
                                colSpan={8}
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
                </div>

                <Separator className="my-4" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => setIsInvoiceDrawerOpen(true)}
                  >
                    <Printer className="h-4 w-4" />
                    {printText}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Download className="h-4 w-4" />
                    {downloadText}
                  </Button>
                  {/* Email button removed */}
                </div>
                {/* Email input removed */}
              </div>
            </TabsContent>

            {/* RECEIPT (sample math kept) */}
            <TabsContent value="receipt" className="space-y-6 px-[10px]">
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold">{receiptText}</h4>
                  <p className="text-sm text-muted-foreground">
                    #{rdId ?? "—"}
                  </p>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-8 gap-0 text-xs font-medium p-2 bg-muted">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Tran Type</div>
                    <div>Doc No</div>
                    <div>POS/Account</div>
                    <div className="text-center">Debit</div>
                    <div className="text-right">Amount</div>
                  </div>

                  <div className="max-h-[42vh] overflow-auto">
                    {txLoading ? (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        Loading transactions…
                      </div>
                    ) : txError ? (
                      <div className="p-3 text-center text-destructive text-sm">
                        {txError}
                      </div>
                    ) : (paymentRows?.length ?? 0) > 0 ? (
                      paymentRows.map((t: any, i: number) => (
                        <div
                          key={t.id ?? `${t.tranDate ?? ""}_${i}`}
                          className={`grid grid-cols-8 gap-0 p-2 text-xs ${
                            i % 2 ? "bg-muted/20" : "bg-background"
                          }`}
                        >
                          <div className="col-span-2">
                            {safeFormatDate(t.tranDate)}
                          </div>
                          <div className="col-span-2">{t.tranType ?? "—"}</div>
                          <div>{t.docNo ?? "—"}</div>
                          <div>{t.accountName ?? "—"}</div>
                          <div className="text-center">
                            {t.tranValue ?? "—"}
                          </div>
                          <div className="text-right">
                            {Number.isFinite(Number(t?.amount))
                              ? money.format(Number(t.amount))
                              : "—"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground text-sm">
                        No transactions found.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-8 gap-0 p-3 text-xs font-semibold bg-muted/50 border-t">
                    <div className="col-span-7 text-left">{totalText}</div>
                    <div className="text-right">
                      {money.format(receiptTotal)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Printer className="h-4 w-4" />
                    {printText}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Download className="h-4 w-4" />
                    {downloadText}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-1">
                    <Send className="h-4 w-4" />
                    {emailText}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {feedbackMessage && (
            <div className="mb-4 p-3 rounded-md flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <span>{feedbackMessage.message}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              onClick={handleCheckOut}
              // Single: block if balance; Group: let backend enforce per-room folio
              disabled={isSubmitting || (!isGroupApplied && totalAmount > 0)}
            >
              {isSubmitting ? "Processing..." : completeCheckOutText}
            </Button>
          </div>
        </div>
      </ScrollArea>
      {/* Overlay invoice print drawer */}
      <InvoicePrintDrawer
        isOpen={isInvoiceDrawerOpen}
        onClose={() => setIsInvoiceDrawerOpen(false)}
        reservationDetailId={rdId}
        reservationId={bookingDetail?.reservationID}
      />
    </>
  );

  if (standalone) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-4xl overflow-y-auto rounded-l-2xl"
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }
  return content;
}

"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DeliveryMethodSelection } from "@/components/pos/delivery-method-selection";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { createPosOrder } from "@/redux/slices/posOrderSlice";
import { clearCart } from "@/redux/slices/cartSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { openPayment, setDelivery } from "@/redux/slices/checkoutFlowSlice";
import { createPosInvoice } from "@/redux/slices/createPosInvoiceSlice";
import { fetchHotelPosCenterTaxConfig } from "@/redux/slices/fetchHotelPosCenterTaxConfigSlice";

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string | null;
  quantity: number;
  // optional GL hints per item
  salesAccountID?: number;
  salesAccountId?: number;
  salesGl?: number;
  salesGL?: number;
  itemId?: number;
  itemID?: number;
  itemCode?: string;
}

interface DeliveryMethodDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onComplete: (data: {
    cart: CartItem[];
    total: number;
    deliveryMethod: string;
    deliveryDetails: Record<string, string | number>;
  }) => void;
  selectedPosCenterId: string;
  selectedPosCenterName: string;
  initialMethod?: string;
  initialDetails?: Record<string, string | number>;
  /** If true, the next attempt to close this drawer will NOT show confirm and will NOT flush cart. */
  skipNextCancelConfirm?: boolean;
}

type PosCenterTaxCfg = {
  taxName: string;
  percentage: number; // 0..100
  calcBasedOn: string; // "base" | "subtotal1" | "subtotal2" ...
  accountId?: number | null;
};

type TaxLine = {
  name: string;
  pct: number;
  basedOn: string;
  accountId?: number;
  amount: number;
};

const round2 = (n: number) => Number((n ?? 0).toFixed(2));

export function DeliveryMethodDrawer({
  open,
  onClose,
  cart,
  total,
  onComplete,
  selectedPosCenterId,
  selectedPosCenterName,
  initialMethod,
  initialDetails,
  skipNextCancelConfirm = false,
}: DeliveryMethodDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { fullName } = useUserFromLocalStorage();

  // Local state so we can intercept close with a confirm dialog.
  const [isDrawerOpen, setIsDrawerOpen] = useState(open);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // One-time bypass ref (consumes skipNextCancelConfirm exactly once)
  const bypassRef = useRef(false);

  useEffect(() => setIsDrawerOpen(open), [open]);
  useEffect(() => {
    if (skipNextCancelConfirm) bypassRef.current = true;
  }, [skipNextCancelConfirm]);

  const posTaxConfig: PosCenterTaxCfg[] =
    useSelector((s: RootState) => s.fetchHotelPosCenterTaxConfig?.data) ?? [];

  // Fetch POS Center tax config whenever center id changes
  useEffect(() => {
    if (selectedPosCenterId) {
      dispatch(fetchHotelPosCenterTaxConfig(Number(selectedPosCenterId)));
    }
  }, [dispatch, selectedPosCenterId]);

  function computeTaxesFromConfig(
    cfgs: PosCenterTaxCfg[] = [],
    cartItems: { price: number; quantity: number }[]
  ) {
    const subTotal = round2(
      (cartItems ?? []).reduce(
        (t, it) => t + Number(it.price || 0) * Number(it.quantity || 0),
        0
      )
    );

    let running = subTotal;
    const lines: TaxLine[] = [];

    for (const c of cfgs ?? []) {
      const name = (c.taxName || "").trim();
      const pct = Number(c.percentage || 0);
      const based = (c.calcBasedOn || "base").toLowerCase();

      const base =
        based === "base"
          ? subTotal
          : based.startsWith("subtotal")
          ? running
          : subTotal;

      const amount = round2(base * (pct / 100));
      lines.push({
        name,
        pct,
        basedOn: based,
        accountId: c.accountId ?? undefined,
        amount,
      });

      if (based.startsWith("subtotal")) running = round2(running + amount);
    }

    const taxTotal = round2(lines.reduce((t, x) => t + x.amount, 0));
    const grand = round2(subTotal + taxTotal);
    return { subTotal, lines, taxTotal, grand };
  }

  /** ROOM SERVICE: posts a POS Order (hold) and then a GL invoice with AR debit + sales/tax credits */
  const handleRoomServiceSubmit = async (
    details: Record<string, string | number>
  ) => {
    try {
      const nowIso = new Date().toISOString();
      const stamp = Date.now(); // keep same stamp across doc numbers

      const property = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelCode = String(property?.hotelCode || "DEFAULT_CODE");
      const propertyID = Number(property?.hotelId || property?.id || 0);
      const hotelPosCenterId = Number(selectedPosCenterId) || 0;

      // Parse room + reservation linkages coming from DeliveryMethodSelection
      const roomNo = Number(details?.roomNo ?? 0) || 0;

      const reservationId =
        Number(details?.reservationId ?? details?.reservationID ?? 0) || 0;

      const reservationDetailId =
        Number(
          details?.reservationDetailId ?? details?.reservationDetailID ?? 0
        ) || 0;

      // 1) POS ORDER (Room Service / roompost hold)
      const orderPayload = {
        accountId: 0,
        isTaxApplied: true,
        ssclTaxAmount: 0,
        ssclTaxId: 0,
        vatTaxAmount: 0,
        vatTaxId: 0,
        serviceChargeAmount: 0,
        serviceChargeId: 0,
        tdlTaxAmount: 0,
        tdlTaxId: 0,
        tranMasId: 0,
        posCenter: selectedPosCenterName || "DefaultPOSCenter",
        accountIdDebit: 0,
        accountIdCredit: 0,
        hotelCode,
        finAct: false,
        tranTypeId: 75, // your "Hold" / RS order code
        tranDate: nowIso,
        effectiveDate: nowIso,
        docNo: `DOC-${stamp}`,
        createdOn: nowIso,
        tranValue: total,
        nameId: 0,
        chequeNo: "",
        paymentMethod: "roompost",
        chequeDate: nowIso,
        exchangeRate: 1,
        debit: 0,
        amount: total,
        comment: "Auto-generated Room Service Order",
        createdBy: fullName || "POS",
        currAmount: total,
        currencyCode: "LKR",
        convRate: "1",
        credit: 0,
        paymentReceiptRef: "N/A",
        remarks: "Posted via Room Service",
        dueDate: nowIso,
        refInvNo: `REF-${stamp}`,
        tableNo: "N/A",
        isFinished: false,
        discPercentage: 0,
        onCost: false,
        startTimeStamp: nowIso,
        endTimeStamp: nowIso,
        roomId: roomNo || 999,
        noOfPax: 1,
        deliveryMethod: "roomService",
        phoneNo: "",
        hotelPosCenterId,

        // NEW: attach reservation (header)
        reservationId, // <-- header reservation

        items: cart.map((item) => ({
          itemId: Number(item.id),
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          cost: 0,
          lineDiscount: 0,
          comment: item.description || "",
          itemDescription: item.name || "Unnamed Item",
          isKOT: true,
          isBOT: true,
          cover: "",
          discPercentage: 0,

          // NEW: attach reservation detail per line
          reservationDetailId, // <-- line reservation detail

          finAct: "false",
        })),
        payments: [
          {
            method: "roompost",
            amount: total,
            currency: "LKR",
            cardType: "",
            lastDigits: "",
            roomNo: String(roomNo || ""),
          },
        ],
      };

      await dispatch(createPosOrder(orderPayload)).unwrap();

      // 2) Build TAXES from POS center config → GL invoice (A/R debit + sales/tax credits)
      const taxCalc = computeTaxesFromConfig(posTaxConfig, cart);
      const { lines: taxLines, grand, taxTotal } = taxCalc;

      const taxes = (taxLines ?? []).map((l) => ({
        taxName: l.name,
        percentage: l.pct,
        basedOn: l.basedOn,
        accountId: l.accountId ?? 0,
        amount: l.amount,
      }));

      // GL helpers
      const mkBase = (overrides: Partial<any> = {}) => ({
        finAct: false,
        docNo: `INV-${stamp}`,
        createdBy: fullName || "POS",
        createdOn: nowIso,
        tranTypeID: 2, // invoice line
        refAccountID: 0,
        siteID: 0,
        tranDate: nowIso,
        dueDate: nowIso,
        chequeDate: nowIso,
        chequePrinted: false,
        paymentVoucherNo: "",
        offSetAccID: 0,
        chequeNo: "",
        tranMasID: 0,
        supplierInvoNo: "",
        taxCode: "",
        costCenterID: 0,
        billRef: "",
        paymentReceiptRef: "",
        reconciled: 0,
        recDate: nowIso,
        propertyID,
        recMasID: 0,
        batchID: 0,
        active: true,
        collectionScheduledOn: nowIso,
        isDue: true,
        isArrears: false,
        isEarlySettlement: false,
        batchNo: 0,
        split: "",
        effectiveDate: nowIso,
        currencyCode: "LKR",
        currCode: "LKR",
        convRate: "1",
        cardType: "",

        // NEW: propagate reservation link on GL lines
        reservationID: reservationId, // some backends support this
        reservationDetailID: reservationDetailId,

        ...overrides,
      });

      const mkDebit = (base: any, valLocal: number) => {
        const amt = round2(valLocal);
        return {
          ...base,
          amount: amt,
          debit: amt,
          credit: 0,
          currAmount: amt,
          currDebit: amt,
          currCredit: 0,
        };
      };

      const mkCredit = (base: any, valLocal: number) => {
        const amt = round2(valLocal);
        return {
          ...base,
          amount: -amt,
          debit: 0,
          credit: amt,
          currAmount: -amt,
          currDebit: 0,
          currCredit: amt,
        };
      };

      // DR A/R for Room Post (customer AR account)
      const arDebit = mkDebit(
        mkBase({
          accountID: 2, // <-- Adjust to your actual A/R account id
          comment: "POS Invoice A/R (Room Service)",
          memo: "A/R open",
        }),
        grand
      );

      // CR Sales per item (fallback to 7 if item doesn’t provide a sales account)
      const salesCredits = cart.map((it) => {
        const lineLocal = round2(
          Number(it.price || 0) * Number(it.quantity || 0)
        );
        const salesAcc =
          Number(
            it.salesAccountID || it.salesAccountId || it.salesGl || it.salesGL
          ) || 7;
        const itemIdNum = Number(it.itemId || it.itemID || it.id || 0);
        const comment = it.itemCode || it.name || String(itemIdNum);
        return mkCredit(
          mkBase({
            accountID: salesAcc,
            itemID: itemIdNum,
            comment,
            memo: "Item sale",
          }),
          lineLocal
        );
      });

      // CR Taxes (only those with a mapped account)
      const taxCredits = (taxLines ?? [])
        .filter((l) => (l.accountId ?? 0) > 0 && l.amount > 0)
        .map((l) =>
          mkCredit(
            mkBase({
              accountID: Number(l.accountId),
              comment: l.name,
              memo: "POS tax",
            }),
            l.amount
          )
        );

      const glAccTransactions = [
        arDebit,
        ...salesCredits,
        ...taxCredits,
      ].filter(
        (x) => Number(x.accountID) > 0 && Math.abs(Number(x.amount)) > 0
      );

      const invDocNo = `INV-${stamp}`;

      const invoicePayload = {
        glAccTransactions,
        tranMasId: 0,
        posCenter: String(selectedPosCenterName || "DefaultPOSCenter"),
        accountIdDebit: 0,
        accountIdCredit: 0,
        hotelCode: String(hotelCode),
        finAct: false,
        tranTypeId: 2, // Invoice
        tranDate: nowIso,
        effectiveDate: nowIso,
        docNo: invDocNo,
        createdOn: nowIso,
        tranValue: grand,
        nameId: 0,
        chequeNo: "",
        paymentMethod: "ROOM SERVICE",
        chequeDate: nowIso,
        exchangeRate: 1,
        debit: 0,
        amount: grand,
        comment: "POS Invoice (Room Service)",
        createdBy: fullName || "POS",
        currAmount: grand,
        currencyCode: "LKR",
        convRate: "1",
        credit: 0,
        paymentReceiptRef: "",
        remarks: "Auto-generated after RS order",
        dueDate: nowIso,
        refInvNo: `REF-${stamp}`,
        tableNo: "N/A",
        isFinished: false,
        discPercentage: 0,
        onCost: true,
        startTimeStamp: nowIso,
        endTimeStamp: nowIso,
        roomId: roomNo || 999,
        noOfPax: 1,
        deliveryMethod: "roomService",
        phoneNo: "",
        isPrintKOT: true,
        isPrintBot: true,
        hotelPosCenterId,

        items: cart.map((item) => ({
          itemId: Number(item.id),
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          cost: 0,
          lineDiscount: 0,
          comment: item.description || "",
          itemDescription: item.name || "Item",
          isKOT: true,
          isBOT: true,
          cover: "",
          discPercentage: 0,

          // NEW: reservation linkage per item
          reservationDetailId, // <-- line reservation detail

          finAct: "false",
        })),

        // tax block (driven from config)
        isTaxApplied: true,
        taxTotalAmount: taxTotal,
        taxes, // [{ taxName, percentage, basedOn, accountId, amount }]

        // legacy single-tax fields (keep 0 if unused)
        serviceChargeId: 0,
        tdlTaxId: 0,
        ssclTaxId: 0,
        vatTaxId: 0,

        // NEW: top-level reservation linkage
        reservationId,
        reservationDetailId,
      };

      const invRes = await dispatch(createPosInvoice(invoicePayload)).unwrap();
      console.log("✅ Room service invoice posted:", invRes);

      // success UX: clear cart & close
      dispatch(clearCart());
      toast.success("Room Service order & invoice posted");
      onClose();
    } catch (error) {
      console.error("❌ Failed to post Room Service:", error);
      toast.error("Failed to post Room Service.");
    }
  };

  const handleDrawerChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (bypassRef.current) {
        // one-time silent close (no confirm, no cart clear)
        bypassRef.current = false;
        setIsDrawerOpen(false);
        setShowConfirmModal(false);
        onClose();
        return;
      }
      setShowConfirmModal(true); // normal path: confirm
    } else {
      setIsDrawerOpen(true);
    }
  };

  const confirmClose = () => {
    setIsDrawerOpen(false);
    setShowConfirmModal(false);
    onClose();
  };

  const cancelClose = () => {
    setShowConfirmModal(false);
    setIsDrawerOpen(true);
  };

  return (
    <>
      <Sheet open={isDrawerOpen} onOpenChange={handleDrawerChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
        >
          <SheetHeader>
            <SheetTitle>Select Delivery Method</SheetTitle>
            <SheetDescription>
              Choose how you want to deliver this order
            </SheetDescription>
          </SheetHeader>

          <DeliveryMethodSelection
            onComplete={(method, details) => {
              console.log("method delivery : ", method);

              if (method === "roomService") {
                // Room Service → post order + AR invoice
                handleRoomServiceSubmit(details);
              } else if (method === "dineIn") {
                // Dine-in → hold to table; no payment here
                onClose();
              } else {
                // takeaway / delivery → go to payment
                onComplete({
                  cart,
                  total,
                  deliveryMethod: method,
                  deliveryDetails: details,
                });
                dispatch(setDelivery({ method, details }));
                dispatch(openPayment());
                onClose();
              }
            }}
            initialMethod={initialMethod}
            initialDetails={initialDetails}
            selectedPosCenterId={selectedPosCenterId}
            selectedPosCenterName={selectedPosCenterName}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto md:max-w-xl lg:max-w-2xl rounded-2xl p-4 sm:p-6 gap-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base sm:text-lg">
              Close drawer?
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              You can come back later to finish checkout.{" "}
              <span className="font-medium">Your cart will be kept.</span>
            </p>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 flex-nowrap min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelClose}
              className="h-9 px-3"
            >
              Stay here
            </Button>

            <Button
              size="sm"
              onClick={confirmClose}
              className="h-9 px-3 bg-[#224FB6] hover:bg-[#1a3f92]"
            >
              Close drawer (keep cart)
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                dispatch(clearCart());
                setIsDrawerOpen(false);
                setShowConfirmModal(false);
                onClose();
              }}
              className="h-9 px-3"
            >
              Cancel order (clear cart)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

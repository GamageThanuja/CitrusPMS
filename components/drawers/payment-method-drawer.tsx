"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PaymentMethodSelection } from "@/components/pos/payment-method-selection";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { clearCart } from "@/redux/slices/cartSlice";
import { closePayment } from "@/redux/slices/checkoutFlowSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { fetchHotelPosCenterTaxConfig } from "@/redux/slices/fetchHotelPosCenterTaxConfigSlice";

type CartItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string | null;
  quantity: number;
};

interface PaymentMethodDrawerProps {
  open: boolean;
  onClose: (backToDelivery?: boolean, opts?: { silent?: boolean }) => void;
  total: number;
  cart: CartItem[];
  deliveryMethod: string;
  deliveryDetails: Record<string, string>;
  posCenter: string;
  posCenterName: string;
  tranMasId?: number;
}

type PosCenterTaxCfg = {
  recordId: number;
  hotelId: number;
  hotelPOSCenterId: number;
  taxName: string; // e.g., "CITY TAX", "SERVICE CHARGE", "GST"
  percentage: number; // 0-100
  calcBasedOn: string; // "base", "subtotal1", "subtotal2", ...
  accountId?: number; // GL to credit (used in child to post GL)
};

type TaxLine = {
  name: string;
  pct: number;
  basedOn: string;
  accountId?: number;
  amount: number; // computed (outlet currency)
};

type TaxTotals = {
  lines: TaxLine[];
  taxTotal: number;
  subTotal: number;
  grand: number;
};

export function PaymentMethodDrawer({
  open,
  total,
  onClose,
  cart,
  deliveryMethod,
  deliveryDetails,
  posCenter,
  posCenterName,
  tranMasId,
}: PaymentMethodDrawerProps) {
  // control the Sheet locally so confirm dialog can intervene
  const [isDrawerOpen, setIsDrawerOpen] = useState(open);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const dispatch = useDispatch();

  const round2 = (n: number) => Number((n ?? 0).toFixed(2));

  const LS_OUTLET_OBJ = "hm_selected_pos_center";
  const [outletCurrency, setOutletCurrency] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(LS_OUTLET_OBJ);
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        setOutletCurrency(obj?.outletCurrency);
      } catch {
        setOutletCurrency("-");
      }
    }
  }, []);

  function computeTaxesFromConfig(
    cfgs: PosCenterTaxCfg[] = [],
    cart: { price: number; quantity: number }[] = []
  ): TaxTotals {
    const subTotal = round2(
      cart.reduce(
        (t, it) => t + Number(it.price || 0) * Number(it.quantity || 0),
        0
      )
    );

    let running = subTotal;
    const lines: TaxLine[] = [];

    for (const c of cfgs) {
      const name = (c.taxName || "").trim();
      const pct = Number(c.percentage || 0);
      const based = (c.calcBasedOn || "base").toLowerCase();

      const base =
        based === "base"
          ? subTotal
          : based.startsWith("subtotal")
          ? running
          : subTotal; // fallback

      const amount = round2(base * (pct / 100));
      lines.push({
        name,
        pct,
        basedOn: based,
        accountId: c.accountId,
        amount,
      });

      if (based.startsWith("subtotal")) {
        running = round2(running + amount);
      }
    }

    const taxTotal = round2(lines.reduce((t, x) => t + x.amount, 0));
    const grand = round2(subTotal + taxTotal);
    return { lines, taxTotal, subTotal, grand };
  }

  const posTaxConfig = useSelector(
    (s: RootState) =>
      (s.fetchHotelPosCenterTaxConfig?.data as PosCenterTaxCfg[]) ?? []
  );
  const posTaxConfigStatus = useSelector(
    (s: RootState) => s.fetchHotelPosCenterTaxConfig?.status
  );

  useEffect(() => {
    const id = Number(posCenter) || 0;
    if (id > 0) {
      dispatch(fetchHotelPosCenterTaxConfig(id) as any);
    }
  }, [dispatch, posCenter]);

  // Compute taxes from API config + current cart
  const taxTotals = computeTaxesFromConfig(posTaxConfig, cart);

  console.log("PaymentMethodDrawer : ", posCenter, posCenterName);
  console.log("total : ", total);

  // keep local open state in sync with prop
  useEffect(() => {
    setIsDrawerOpen(open);
  }, [open]);

  const handleDrawerChange = (nextOpen: boolean) => {
    // If user attempts to close, ask first
    if (!nextOpen) {
      setShowConfirmModal(true);
    } else {
      setIsDrawerOpen(true);
    }
  };

  // Leave payment, KEEP cart, go back to outer screen to add items
  const goBackKeepCart = () => {
    setShowConfirmModal(false);
    setIsDrawerOpen(false);
    onClose(true, { silent: true });
  };

  // Stay in payment
  const stayHere = () => {
    setShowConfirmModal(false);
    setIsDrawerOpen(true);
  };

  const {
    subTotal,
    taxTotal,
    grand: payableTotal,
    lines: taxLines,
  } = taxTotals;

  return (
    <>
      <Sheet open={isDrawerOpen} onOpenChange={handleDrawerChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
        >
          <SheetHeader>
            <div className="flex flex-row items-center gap-2">
              <Button
                variant="ghost"
                className="text-sm underline"
                onClick={goBackKeepCart}
                aria-label="Back"
                title="Back"
              >
                <ChevronLeft />
              </Button>
              <SheetTitle>Select Payment Method</SheetTitle>
            </div>
            <SheetDescription>
              Choose how you want to pay for this order
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-2 border rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>
                {outletCurrency} {subTotal.toFixed(2)}
              </span>
            </div>

            {taxLines.map((l) => (
              <div key={l.name} className="flex justify-between text-sm">
                <span>
                  {l.name} ({l.pct}%
                  {l.basedOn && l.basedOn !== "base" ? ` • ${l.basedOn}` : ""})
                </span>
                <span>
                  {outletCurrency} {l.amount.toFixed(2)}
                </span>
              </div>
            ))}

            <div className="flex justify-between text-sm">
              <span>Tax Total</span>
              <span>
                {outletCurrency} {taxTotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between font-semibold border-t pt-3">
              <span>Grand Total</span>
              <span>
                {outletCurrency} {payableTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <PaymentMethodSelection
            total={payableTotal}
            cart={cart}
            deliveryMethod={deliveryMethod}
            deliveryDetails={deliveryDetails}
            posCenter={posCenter}
            onComplete={() => {
              dispatch(clearCart());
              dispatch(closePayment());
              setIsDrawerOpen(false);
              onClose?.();
            }}
            tranMasId={tranMasId}
          />
        </SheetContent>
      </Sheet>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Payment?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Your cart and selected items will be kept. You can go back, add more
            items, and return to payment anytime.
          </p>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={stayHere}>
              Stay in payment
            </Button>
            <Button onClick={goBackKeepCart}>Go back (keep cart)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

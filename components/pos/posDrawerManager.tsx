"use client";
import { useState } from "react";
import { PaymentMethodDrawer } from "../drawers/payment-method-drawer";
import { DeliveryMethodDrawer } from "../drawers/delivery-method-drawer";

type CartItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string | null;
  quantity: number;
};

export function PosDrawerManager({
  cart,
  total,
  posCenter,
}: {
  cart: CartItem[];
  total: number;
  posCenter: string;
}) {
  const [drawerStep, setDrawerStep] = useState<"delivery" | "payment">(
    "delivery"
  );
  const [deliveryDetails, setDeliveryDetails] = useState<
    Record<string, string>
  >({});
  const [deliveryMethod, setDeliveryMethod] = useState<string>("");

  return (
    <>
      <DeliveryMethodDrawer
        open={drawerStep === "delivery"}
        onClose={() => setDrawerStep("closed")}
        cart={cart}
        total={total}
        posCenter={posCenter}
        onNext={(method, details) => {
          setDeliveryMethod(method);
          setDeliveryDetails(details);
          setDrawerStep("payment");
        }}
      />
      <PaymentMethodDrawer
        open={drawerStep === "payment"}
        onBack={() => setDrawerStep("delivery")}
        onClose={() => setDrawerStep("closed")}
        cart={cart}
        total={total}
        posCenter={posCenter}
        deliveryMethod={deliveryMethod}
        deliveryDetails={deliveryDetails}
      />
    </>
  );
}

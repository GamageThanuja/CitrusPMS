// src/redux/slices/checkoutFlowSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PaymentMethod =
  | "cash"
  | "card"
  | "cityLedger"
  | "giftVoucher"
  | "bankTransfer"
  | "check"
  | "roompost"
  | "includeToMealPlan"
  | "complementary";

export type PaymentEntry = {
  method: PaymentMethod;
  amount: number;
  currency?: string;
  details?: {
    cardType?: string;
    cardNo?: string;
    voucherCode?: string;
    ref?: string;
  };
};

type CheckoutFlowState = {
  isPaymentOpen: boolean;
  deliveryMethod?: string;
  deliveryDetails?: Record<string, string>;
  payments: PaymentEntry[];
  selectedForm: PaymentMethod | null;
};

const initialState: CheckoutFlowState = {
  isPaymentOpen: false,
  payments: [],
  selectedForm: null,
};

const slice = createSlice({
  name: "checkoutFlow",
  initialState,
  reducers: {
    openPayment: (s) => {
      s.isPaymentOpen = true;
    },
    closePayment: (s) => {
      s.isPaymentOpen = false;
    },
    setDelivery: (
      s,
      a: PayloadAction<{ method: string; details: Record<string, string> }>
    ) => {
      s.deliveryMethod = a.payload.method;
      s.deliveryDetails = a.payload.details;
    },
    setSelectedForm: (
      s,
      a: PayloadAction<CheckoutFlowState["selectedForm"]>
    ) => {
      s.selectedForm = a.payload;
    },
    setPayments: (s, a: PayloadAction<PaymentEntry[]>) => {
      s.payments = a.payload;
    },
    resetCheckout: (s) => {
      s.isPaymentOpen = false;
      s.deliveryMethod = undefined;
      s.deliveryDetails = undefined;
      s.payments = [];
      s.selectedForm = null;
    },
  },
});

export const {
  openPayment,
  closePayment,
  setDelivery,
  setSelectedForm,
  setPayments,
  resetCheckout,
} = slice.actions;

export default slice.reducer;

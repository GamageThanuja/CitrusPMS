// redux/slices/createPosOrderSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface PosOrderItem {
  itemId: number;
  quantity: number;
  price: number;
  cost: number;
  lineDiscount: number;
  comment: string;
  itemDescription: string;
  isKOT: boolean;
  isBOT: boolean;
  cover: string;
  discPercentage: number;
  reservationDetailId: number;
  finAct: string;
}

export interface PaymentInfo {
  method: string;
  amount: number;
  currency: string;
  cardType: string;
  lastDigits: string;
  roomNo: string;
}

export interface PosOrderPayload {
  accountId: number;
  isTaxApplied: boolean;
  ssclTaxAmount: number;
  ssclTaxId: number;
  vatTaxAmount: number;
  vatTaxId: number;
  serviceChargeAmount: number;
  serviceChargeId: number;
  tdlTaxAmount: number;
  tdlTaxId: number;
  tranMasId: number;
  posCenter: string;
  accountIdDebit: number;
  accountIdCredit: number;
  hotelCode: string;
  finAct: boolean;
  tranTypeId: number;
  tranDate: string;
  effectiveDate: string;
  docNo: string;
  createdOn: string;
  tranValue: number;
  nameId: number;
  chequeNo: string;
  paymentMethod: string;
  chequeDate: string;
  exchangeRate: number;
  debit: number;
  amount: number;
  comment: string;
  createdBy: string;
  currAmount: number;
  currencyCode: string;
  convRate: string;
  credit: number;
  paymentReceiptRef: string;
  remarks: string;
  dueDate: string;
  refInvNo: string;
  tableNo: string;
  isFinished: boolean;
  discPercentage: number;
  onCost: boolean;
  startTimeStamp: string;
  endTimeStamp: string;
  roomId: number;
  noOfPax: number;
  deliveryMethod: string;
  phoneNo: string;
  isPrintKOT?: boolean;
  isPrintBot?: boolean;
  items: PosOrderItem[];
  hotelPosCenterId: number;
  reservationId: number;
  reservationDetailId?: number;
  payments?: PaymentInfo[];
}

/** If you know the exact response shape, replace `any` with it */
export type PosOrderResponse = any;

/** ---- Thunk args ---- */
export interface CreatePosOrderArgs {
  username: string;          // query param
  payload: PosOrderPayload;  // request body
}

/** ---- State ---- */
interface CreatePosOrderState {
  loading: boolean;
  error: string | null;
  data: PosOrderResponse[]; // store created orders (or last one if you prefer)
}

const initialState: CreatePosOrderState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: POST /CreatePosOrder?username=... ---- */
export const createPosOrder = createAsyncThunk<
  PosOrderResponse,
  CreatePosOrderArgs,
  { rejectValue: string }
>("posOrder/create", async ({ username, payload }, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/CreatePosOrder`,
      payload,
      {
        params: { username },
      }
    );

    return response.data as PosOrderResponse;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create POS order.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createPosOrderSlice = createSlice({
  name: "createPosOrder",
  initialState,
  reducers: {
    resetCreatePosOrderState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPosOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createPosOrder.fulfilled,
        (state, action: PayloadAction<PosOrderResponse>) => {
          state.loading = false;
          state.data.push(action.payload);
        }
      )
      .addCase(createPosOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to create POS order.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreatePosOrderState } = createPosOrderSlice.actions;
export default createPosOrderSlice.reducer;

/** ---- Selectors ---- */
export const selectCreatePosOrderLoading = (state: any) =>
  state.createPosOrder?.loading ?? false;

export const selectCreatePosOrderError = (state: any) =>
  state.createPosOrder?.error ?? null;

export const selectCreatePosOrderData = (state: any) =>
  state.createPosOrder?.data ?? [];
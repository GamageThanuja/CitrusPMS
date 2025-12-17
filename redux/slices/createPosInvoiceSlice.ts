// src/redux/slices/createPosInvoiceSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (request body) ---- */

export interface GLAccTransaction {
  finAct: boolean;
  accountID: number;
  amount: number;
  debit: number;
  credit: number;
  docNo: string;
  comment: string;
  createdBy: string;
  createdOn: string; // ISO date-time
  tranTypeID: number;
  refAccountID: number;
  itemID: number;
  siteID: number;
  memo: string;
  tranDate: string; // ISO date-time
  dueDate: string; // ISO date-time
  chequeDate: string; // ISO date-time
  chequePrinted: boolean;
  paymentVoucherNo: string;
  offSetAccID: number;
  chequeNo: string;
  tranMasID: number;
  supplierInvoNo: string;
  taxCode: string;
  costCenterID: number;
  billRef: string;
  paymentReceiptRef: string;
  reconciled: number;
  recDate: string; // ISO date-time
  currAmount: number;
  currDebit: number;
  currCredit: number;
  propertyID: number;
  recMasID: number;
  batchID: number;
  active: boolean;
  collectionScheduledOn: string; // ISO date-time
  isDue: boolean;
  isArrears: boolean;
  isEarlySettlement: boolean;
  batchNo: number;
  split: string;
  narration: string;
  effectiveDate: string; // ISO date-time
  currencyCode: string;
  amtInCurr: number;
  tranDetailID: number;
  pumpID: number;
  currCode: string;
  convRate: string;
  cardType: string;
  reservationDetailID: number;
}

export interface PosInvoiceItem {
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

export interface CreatePosInvoicePayload {
  glAccTransactions: GLAccTransaction[];

  tranMasId: number;
  posCenter: string;
  accountIdDebit: number;
  accountIdCredit: number;
  hotelCode: string; // API expects lowercase
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
  refInvNo: string; // API expects lowercase
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
  isPrintKOT: boolean;
  isPrintBot: boolean;
  hotelPosCenterId: number;
  items: PosInvoiceItem[];
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
  reservationId: number;
  reservationDetailId: number;
}

/** ---- State ---- */

interface CreatePosInvoiceState {
  loading: boolean;
  success: boolean;
  error: string | null;
  createdInvoice: any | null; // shape depends on API response
}

const initialState: CreatePosInvoiceState = {
  loading: false,
  success: false,
  error: null,
  createdInvoice: null,
};

/** ---- Thunk args ---- */
export interface CreatePosInvoiceArgs {
  username: string;          // query param
  payload: CreatePosInvoicePayload;  // request body
}

/** ---- Thunk: POST /CreatePosInvoice?username=... ---- */
export const createPosInvoice = createAsyncThunk<
  any,
  CreatePosInvoiceArgs,
  { rejectValue: string }
>("posInvoice/create", async ({ username, payload }, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/CreatePosInvoice`,
      payload,
      {
        params: { username },
      }
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create POS Invoice.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */

const createPosInvoiceSlice = createSlice({
  name: "createPosInvoice",
  initialState,
  reducers: {
    resetCreatePosInvoiceState(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.createdInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPosInvoice.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        createPosInvoice.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.createdInvoice = action.payload;
        }
      )
      .addCase(createPosInvoice.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create POS Invoice.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreatePosInvoiceState } = createPosInvoiceSlice.actions;
export default createPosInvoiceSlice.reducer;

/** ---- Selectors ---- */
export const selectCreatePosInvoiceLoading = (s: any) =>
  (s.createPosInvoice?.loading as boolean) ?? false;
export const selectCreatePosInvoiceSuccess = (s: any) =>
  (s.createPosInvoice?.success as boolean) ?? false;
export const selectCreatePosInvoiceError = (s: any) =>
  (s.createPosInvoice?.error as string | null) ?? null;
export const selectCreatedPosInvoice = (s: any) =>
  (s.createPosInvoice?.createdInvoice as any | null) ?? null;
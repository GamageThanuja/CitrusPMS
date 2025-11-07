// redux/slices/createPosInvoiceSlice.ts

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface PosItem {
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

interface CreatePosInvoicePayload {
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
  isPrintKOT: boolean;
  isPrintBot: boolean;
  items: PosItem[];
}

export const createPosInvoice = createAsyncThunk(
  "pos/createInvoice",
  async (payload: CreatePosInvoicePayload, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsed = storedToken ? JSON.parse(storedToken) : null;
      const accessToken = parsed?.accessToken;

      const response = await axios.post(
        `${BASE_URL}/api/Pos/CreatePosInvoice`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const createPosInvoiceSlice = createSlice({
  name: "createPosInvoice",
  initialState: {
    data: null,
    loading: false,
    error: null,
  } as {
    data: any;
    loading: boolean;
    error: any;
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPosInvoice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPosInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(createPosInvoice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default createPosInvoiceSlice.reducer;

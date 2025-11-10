import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Type Definition ---- */
export interface CreateHotelPOSCenterMasPayload {
  posCenterID: number;
  posCenterCode: string;
  posCenterName: string;
  nextBillNo: string;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  finAct: boolean;
  kotPrinterName: string;
  botPrinterName: string;
  billPrinterName: string;
  nextOrderNo: string;
  locationID: number;
  show: boolean;
  isTaxInclusivePrices: boolean;
  isAskRoomNo: boolean;
  isAskTableNo: boolean;
  isAskDeliveryMtd: boolean;
  isAskPOSCenter: boolean;
  isAskNoOfPax: boolean;
  isChargeSeperateSC: boolean;
  vat: number;
  nbt: number;
  sc: number;
  ct: number;
  gotoLogin: boolean;
  isNBTPlusVat: boolean;
  printBillOnLQ: boolean;
  usdBilling: boolean;
  noOfBillCopies: number;
  isPossibleToPostToFOCashier: boolean;
  isTakeAway: boolean;
  outletGroup: string;
  isProfitCenter: boolean;
  roomServiceSC: number;
  takeAwaySC: number;
  deliverySC: number;
  allowDirectBill: boolean;
  printKOTCopyAtBILLPrinter: boolean;
  costPercentage: number;
  isBar: boolean;
  isMergeTableWhenPrintSt: boolean;
  koT_paperwidth: number;
  boT_paperwidth: number;
  bilL_paperwidth: number;
  showOnGSS: boolean;
}

/** ---- State ---- */
interface CreateHotelPOSCenterMasState {
  loading: boolean;
  success: boolean;
  error: string | null;
  response: any;
}

const initialState: CreateHotelPOSCenterMasState = {
  loading: false,
  success: false,
  error: null,
  response: null,
};

/** ---- Async Thunk ---- */
export const createHotelPOSCenterMas = createAsyncThunk<
  any,
  CreateHotelPOSCenterMasPayload,
  { rejectValue: string }
>("hotelPOSCenterMas/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/HotelPOSCenterMas/create-pos-center`,
      payload
    );
    return response.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create Hotel POS Center.";
    return rejectWithValue(message);
  }
});

/** ---- Slice ---- */
const createHotelPOSCenterMasSlice = createSlice({
  name: "createHotelPOSCenterMas",
  initialState,
  reducers: {
    resetCreateHotelPOSCenterMasState(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createHotelPOSCenterMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createHotelPOSCenterMas.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(createHotelPOSCenterMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to create Hotel POS Center.";
        state.success = false;
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateHotelPOSCenterMasState } =
  createHotelPOSCenterMasSlice.actions;
export default createHotelPOSCenterMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateHotelPOSCenterMasLoading = (state: any) =>
  state.createHotelPOSCenterMas?.loading;
export const selectCreateHotelPOSCenterMasError = (state: any) =>
  state.createHotelPOSCenterMas?.error;
export const selectCreateHotelPOSCenterMasSuccess = (state: any) =>
  state.createHotelPOSCenterMas?.success;
export const selectCreateHotelPOSCenterMasResponse = (state: any) =>
  state.createHotelPOSCenterMas?.response;

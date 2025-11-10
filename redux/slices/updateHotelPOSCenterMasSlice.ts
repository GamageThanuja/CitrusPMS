import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Type Definition ---- */
export interface UpdateHotelPOSCenterMasPayload {
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
interface UpdateHotelPOSCenterMasState {
  loading: boolean;
  success: boolean;
  error: string | null;
  response: any;
}

const initialState: UpdateHotelPOSCenterMasState = {
  loading: false,
  success: false,
  error: null,
  response: null,
};

/** ---- Async Thunk ---- */
export const updateHotelPOSCenterMas = createAsyncThunk<
  any,
  { posCenterId: number; data: UpdateHotelPOSCenterMasPayload },
  { rejectValue: string }
>("hotelPOSCenterMas/update", async ({ posCenterId, data }, { rejectWithValue }) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/HotelPOSCenterMas/update-pos-center/${posCenterId}`,
      data
    );
    return response.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update Hotel POS Center.";
    return rejectWithValue(message);
  }
});

/** ---- Slice ---- */
const updateHotelPOSCenterMasSlice = createSlice({
  name: "updateHotelPOSCenterMas",
  initialState,
  reducers: {
    resetUpdateHotelPOSCenterMasState(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.response = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelPOSCenterMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        updateHotelPOSCenterMas.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.success = true;
          state.response = action.payload;
        }
      )
      .addCase(updateHotelPOSCenterMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to update Hotel POS Center.";
        state.success = false;
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateHotelPOSCenterMasState } =
  updateHotelPOSCenterMasSlice.actions;
export default updateHotelPOSCenterMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateHotelPOSCenterMasLoading = (state: any) =>
  state.updateHotelPOSCenterMas?.loading;
export const selectUpdateHotelPOSCenterMasError = (state: any) =>
  state.updateHotelPOSCenterMas?.error;
export const selectUpdateHotelPOSCenterMasSuccess = (state: any) =>
  state.updateHotelPOSCenterMas?.success;
export const selectUpdateHotelPOSCenterMasResponse = (state: any) =>
  state.updateHotelPOSCenterMas?.response;

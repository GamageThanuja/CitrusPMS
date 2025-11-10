import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface HotelPOSCenterMas {
  posCenterID: number;
  posCenterCode: string;
  posCenterName: string;
  nextBillNo: string;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  finAct: boolean;
  kotPrinterName: string | null;
  botPrinterName: string | null;
  billPrinterName: string | null;
  nextOrderNo: string | null;
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
  outletGroup: string | null;
  isProfitCenter: boolean;
  roomServiceSC: number;
  takeAwaySC: number;
  deliverySC: number;
  allowDirectBill: boolean;
  printKOTCopyAtBILLPrinter: boolean;
  costPercentage: number;
  isBar: boolean;
  isMergeTableWhenPrintSt: boolean;
  koT_paperwidth: number | null;
  boT_paperwidth: number | null;
  bilL_paperwidth: number | null;
  showOnGSS: boolean;
}

/** ---- State ---- */
interface FetchHotelPOSCenterMasState {
  loading: boolean;
  error: string | null;
  data: HotelPOSCenterMas[];
}

const initialState: FetchHotelPOSCenterMasState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: GET /api/HotelPOSCenterMas/get-all-pos-centers ---- */
export const fetchHotelPOSCenterMas = createAsyncThunk<
  HotelPOSCenterMas[],
  { hotelCode?: string; posCenterCode?: string; posCenterId?: number } | void,
  { rejectValue: string }
>(
  "hotelPOSCenterMas/fetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/HotelPOSCenterMas/get-all-pos-centers`,
        { params }
      );
      return response.data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch Hotel POS Center data.";
      return rejectWithValue(msg);
    }
  }
);

/** ---- Slice ---- */
const fetchHotelPOSCenterMasSlice = createSlice({
  name: "fetchHotelPOSCenterMas",
  initialState,
  reducers: {
    resetHotelPOSCenterMasState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelPOSCenterMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchHotelPOSCenterMas.fulfilled,
        (state, action: PayloadAction<HotelPOSCenterMas[]>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchHotelPOSCenterMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          "Failed to fetch Hotel POS Center data.";
      });
  },
});

/** ---- Exports ---- */
export const { resetHotelPOSCenterMasState } =
  fetchHotelPOSCenterMasSlice.actions;
export default fetchHotelPOSCenterMasSlice.reducer;

/** ---- Selectors ---- */
export const selectHotelPOSCenterMasLoading = (state: any) =>
  (state.fetchHotelPOSCenterMas?.loading as boolean) ?? false;
export const selectHotelPOSCenterMasError = (state: any) =>
  (state.fetchHotelPOSCenterMas?.error as string | null) ?? null;
export const selectHotelPOSCenterMasData = (state: any) =>
  (state.fetchHotelPOSCenterMas?.data as HotelPOSCenterMas[]) ?? [];

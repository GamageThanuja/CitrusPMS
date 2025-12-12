// redux/slices/fetchPosTableSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */

export interface PosTableOrderItem {
  finAct: string;
  tranMasID: number;
  tranDetailID: number;
  itemID: number;
  qty: number;
  cost: number;
  price: number;
  lineCost: number;
  linePrice: number;
  lineDiscount: string;
  lineTotal: number;
  comment: string;
  regPrice: number;
  itemDescription: string;
  createdBy: string;
  createdOn: string;
  voidBy: string;
  voidOn: string;
  isKOT: boolean;
  isBOT: boolean;
  isDeliveryReady: boolean;
  isDelivered: boolean;
  isKitchenSeen: boolean;
  isBarSeen: boolean;
  isCancelled: boolean;
  isCookingFinished: boolean;
  cover: string;
  nbt: number;
  vat: number;
  tdl: number;
  sc: number;
  lineTotWithTaxes: number;
  isFOC: boolean;
  discPercentage: number;
  reservationDetailID: number;
  itemCode: string;
  [key: string]: any;
}

export interface PosTable {
  tranMasId: number;
  hotelCode: string;
  finAct: boolean;
  tranTypeId: number;
  tranDate: string;
  effectiveDate: string;
  docNo: string;
  posCenter: string;
  createdOn: string;
  createdBy: string;
  tranValue: number;
  nameId: number;
  chequeNo: string;
  paymentMethod: string;
  chequeDate: string;
  exchangeRate: number;
  remarks: string;
  dueDate: string;
  refInvNo: string;
  tableNo: string;
  isFinished: boolean;
  discPercentage: number;
  onCost: boolean;
  startTimeStamp: string;
  endTimeStamp: string;
  isOrderAccepted: boolean;
  isPreparationStarted: boolean;
  isPreparationFinished: boolean;
  isDelivered: boolean;
  roomId: number;
  noOfPax: number;
  deliveryMethod: string;
  phoneNo: string;
  items: PosTableOrderItem[];
  [key: string]: any;
}

export interface FetchPosTableParams {
  tableNo?: string;
  hotelCode?: string;
  hotelPosCenterId?: number;
  isFinished?: boolean;
}

/** ---- State ---- */
interface FetchPosTableState {
  loading: boolean;
  error: string | null;
  tables: PosTable[];
  lastQuery: FetchPosTableParams | null;
}

const initialState: FetchPosTableState = {
  loading: false,
  error: null,
  tables: [],
  lastQuery: null,
};

/** ---- Thunk: GET /table ---- */
export const fetchPosTable = createAsyncThunk<
  PosTable[],
  FetchPosTableParams | undefined,
  { rejectValue: string }
>("posTable/fetch", async (params, { rejectWithValue }) => {
  try {
    const safeParams: Record<string, any> = {};
    if (params?.tableNo) safeParams.tableNo = params.tableNo;
    if (params?.hotelCode) safeParams.hotelCode = params.hotelCode;
    if (params?.hotelPosCenterId != null)
      safeParams.hotelPosCenterId = params.hotelPosCenterId;
    if (typeof params?.isFinished === "boolean")
      safeParams.isFinished = params.isFinished;

    const res = await axios.get(`${API_BASE_URL}/table`, { params: safeParams });
    const data = Array.isArray(res.data) ? (res.data as PosTable[]) : [];
    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to fetch POS tables.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchPosTableSlice = createSlice({
  name: "posTable",
  initialState,
  reducers: {
    clearPosTable(state) {
      state.tables = [];
      state.error = null;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosTable.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery = (action.meta.arg as FetchPosTableParams | undefined) ?? null;
      })
      .addCase(
        fetchPosTable.fulfilled,
        (state, action: PayloadAction<PosTable[]>) => {
          state.loading = false;
          state.tables = action.payload;
        }
      )
      .addCase(fetchPosTable.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? "Failed to fetch POS tables.";
      });
  },
});

/** ---- Exports ---- */
export const { clearPosTable } = fetchPosTableSlice.actions;
export default fetchPosTableSlice.reducer;

/** ---- Selectors ---- */
export const selectPosTables = (s: any) =>
  (s.posTable?.tables as PosTable[]) ?? [];
export const selectPosTableLoading = (s: any) =>
  (s.posTable?.loading as boolean) ?? false;
export const selectPosTableError = (s: any) =>
  (s.posTable?.error as string | null) ?? null;
export const selectPosTableLastQuery = (s: any) =>
  (s.posTable?.lastQuery as FetchPosTableParams | null) ?? null;
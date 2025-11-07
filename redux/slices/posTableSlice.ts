import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface PosTableItem {
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
  items: any[];
}

interface PosTableState {
  tables: PosTableItem[];
  loading: boolean;
  error: string | null;
}

const initialState: PosTableState = {
  tables: [],
  loading: false,
  error: null,
};

export const fetchPosTables = createAsyncThunk<
  PosTableItem[],
  { tableNo?: string; isFinished?: boolean }
>("posTables/fetch", async ({ tableNo, isFinished }) => {
  const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
  const accessToken = tokens.accessToken;
  const selectedProperty = JSON.parse(
    localStorage.getItem("selectedProperty") || "{}"
  );

  const params = {
    tableNo: tableNo || "",
    hotelCode: selectedProperty.hotelCode?.toString(),
    hotelPosCenterId: selectedProperty.hotelPosCenterId,
    isFinished: isFinished,
  };

  const response = await axios.get(`${BASE_URL}/api/Pos/table`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params,
  });

  return response.data;
});

const posTableSlice = createSlice({
  name: "posTables",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosTables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosTables.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload;
      })
      .addCase(fetchPosTables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch POS tables";
      });
  },
});

export default posTableSlice.reducer;

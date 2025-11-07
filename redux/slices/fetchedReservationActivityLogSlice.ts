// src/redux/slices/fetchedReservationActivityLogSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "@/redux/store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ---- Types (kept minimal & aligned with backend shape) ----
export type ReservationActivityLog = {
  logId: number;
  username: string;
  hotelId: number;
  reservationId: number;
  reservationDetailId: number;
  resLog: string;
  createdOn: string;
  platform: string;
  reservationNo: string;
  roomNumber: string;
  // hotel object exists in schema; mark optional to stay resilient
  hotel?: Record<string, any> | null;
};

export type ReservationActivityLogResponse = {
  logs: ReservationActivityLog[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
};

export type FetchParams = {
  hotelId?: number; // defaults from selectedProperty.id
  reservationId?: number;
  username?: string;
  page?: number; // default 1
  pageSize?: number; // default 10
};

// ---- Thunk ----
export const fetchFetchedReservationActivityLogs = createAsyncThunk<
  ReservationActivityLogResponse,
  FetchParams | void,
  { rejectValue: string }
>(
  "fetchedReservationActivityLogs/fetch",
  async (params, { rejectWithValue }) => {
    try {
      const storedToken = localStorage.getItem("hotelmateTokens");
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      const accessToken: string | undefined = parsedToken?.accessToken;
      if (!accessToken) return rejectWithValue("Missing access token.");

      const selectedProperty = localStorage.getItem("selectedProperty");
      const property = selectedProperty ? JSON.parse(selectedProperty) : {};
      const defaultHotelId = property?.id as number | undefined;

      const {
        hotelId = defaultHotelId,
        reservationId,
        username,
        page = 1,
        pageSize = 10,
      } = params || {};

      const query: Record<string, any> = {};
      if (hotelId != null) query.hotelId = hotelId;
      if (reservationId != null) query.reservationId = reservationId;
      if (username) query.username = username;
      query.page = page;
      query.pageSize = pageSize;

      const resp = await axios.get<ReservationActivityLogResponse>(
        `${BASE_URL}/api/ReservationActivityLog`,
        {
          params: query,
          headers: {
            Accept: "text/plain",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = resp.data as ReservationActivityLogResponse;
      return {
        logs: data?.logs ?? [],
        totalCount: data?.totalCount ?? 0,
        pageSize: data?.pageSize ?? pageSize,
        currentPage: data?.currentPage ?? page,
      };
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message ||
        "Failed to fetch reservation activity logs.";
      return rejectWithValue(msg);
    }
  }
);

// ---- Slice ----
type State = {
  logs: ReservationActivityLog[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  loading: boolean;
  error: string | null;
};

const initialState: State = {
  logs: [],
  totalCount: 0,
  pageSize: 10,
  currentPage: 1,
  loading: false,
  error: null,
};

const fetchedReservationActivityLogSlice = createSlice({
  name: "fetchedReservationActivityLogs",
  initialState,
  reducers: {
    clearFetchedReservationActivityLogs: (state) => {
      state.logs = [];
      state.totalCount = 0;
      state.pageSize = 10;
      state.currentPage = 1;
      state.loading = false;
      state.error = null;
    },
    setFetchedReservationActivityPage: (
      state,
      action: PayloadAction<number>
    ) => {
      state.currentPage = action.payload;
    },
    setFetchedReservationActivityPageSize: (
      state,
      action: PayloadAction<number>
    ) => {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFetchedReservationActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFetchedReservationActivityLogs.fulfilled,
        (state, action: PayloadAction<ReservationActivityLogResponse>) => {
          state.loading = false;
          state.logs = action.payload.logs;
          state.totalCount = action.payload.totalCount;
          state.pageSize = action.payload.pageSize;
          state.currentPage = action.payload.currentPage;
        }
      )
      .addCase(
        fetchFetchedReservationActivityLogs.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || "Failed to fetch reservation logs.";
        }
      );
  },
});

export const {
  clearFetchedReservationActivityLogs,
  setFetchedReservationActivityPage,
  setFetchedReservationActivityPageSize,
} = fetchedReservationActivityLogSlice.actions;

export default fetchedReservationActivityLogSlice.reducer;

// ---- Selectors ----
export const selectFetchedReservationActivityLogs = (state: RootState) =>
  state.fetchedReservationActivityLogs.logs;

export const selectFetchedReservationActivityLoading = (state: RootState) =>
  state.fetchedReservationActivityLogs.loading;

export const selectFetchedReservationActivityError = (state: RootState) =>
  state.fetchedReservationActivityLogs.error;

export const selectFetchedReservationActivityPagination = (
  state: RootState
) => ({
  totalCount: state.fetchedReservationActivityLogs.totalCount,
  pageSize: state.fetchedReservationActivityLogs.pageSize,
  currentPage: state.fetchedReservationActivityLogs.currentPage,
});

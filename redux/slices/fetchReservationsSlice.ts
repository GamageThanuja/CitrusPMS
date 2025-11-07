// src/redux/slices/fetchReservationsSlice.ts
// RTK slice for GET /api/Reservation
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type ReservationStatusMaster = {
  reservationStatusID: number;
  reservationStatus: string;
  reservationStatusColour: string;
};

type ReservationRoom = {
  reservationDetailID: number;
  roomID: number;
  roomNumber: string;
  roomType: string;
  checkIN: string;
  checkOUT: string;
  status: number;
  reservationStatusMaster?: ReservationStatusMaster;
  adults: number;
  child: number;
  extraBed: number;
  guest1?: string;
  guest2?: string;
  basis?: string;
};

type ReservationApi = {
  reservationID: number;
  reservationNo: string;
  status: string | null;
  type: string | null;
  bookerFullName: string | null;
  email: string | null;
  phone: string | null;
  refNo: string | null;
  hotelID: number;
  hotelName: string | null;
  resCheckIn: string;
  resCheckOut: string;
  totalNights: number;
  totalRooms: number;
  totalAmount: number;
  currencyCode: string | null;
  sourceOfBooking: string | null;
  createdOn: string;
  createdBy: string | null;
  lastUpdatedOn: string;
  lastUpdatedBy: string | null;
  isCancelled: boolean;
  rooms?: ReservationRoom[];
  guestProfileId?: number;
  remarksGuest?: string | null;
  remarksInternal?: string | null;
  nameId?: number;
};

export type BookingRow = {
  reservationID: number;
  reservationNo: string;
  status: string;
  statusColor: string;
  type: string | null;
  bookerFullName: string | null;
  email: string | null;
  phone: string | null;
  refNo: string | null;
  hotelID: number;
  hotelName: string | null;
  resCheckIn: string;
  resCheckOut: string;
  totalNights: number;
  totalRooms: number;
  totalAmount: number;
  currencyCode: string | null;
  sourceOfBooking: string | null;
  createdOn: string;
  createdBy: string | null;
  lastUpdatedOn: string;
  lastUpdatedBy: string | null;
  isCancelled: boolean;
  guestProfileId?: number;
  rooms?: ReservationRoom[];
  reservationStatus?: string;
  reservationStatusID?: number;
  reservationDetailIDs?: number[];
  nameId?: number;
};

type Filters = {
  hotelId?: number;
  status?: string;
  reservationStatusId?: number;
  fromDate?: string; // ISO date-time
  toDate?: string; // ISO date-time
  searchTerm?: string;
  page?: number;
  pageSize?: number;
  checkInDate?: string; // ISO date-time
  checkOutDate?: string; // ISO date-time
  sourceOfBooking?: string; // optional—backend may ignore if unsupported
};

type FetchResponse = {
  reservations: ReservationApi[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
};

type State = {
  items: BookingRow[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  loading: boolean;
  error?: string;
  filters: Filters;
};

const initialState: State = {
  items: [],
  totalCount: 0,
  pageSize: 10,
  currentPage: 1,
  loading: false,
  error: undefined,
  filters: {
    page: 1,
    pageSize: 10,
  },
};

function buildQuery(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.hotelId) params.set("hotelId", String(filters.hotelId));
  if (filters.status) params.set("status", filters.status);
  if (filters.reservationStatusId != null) {
    params.set("reservationStatusId", String(filters.reservationStatusId));
  }
  if (filters.fromDate) params.set("fromDate", filters.fromDate);
  if (filters.toDate) params.set("toDate", filters.toDate);
  if (filters.searchTerm) params.set("searchTerm", filters.searchTerm);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.checkInDate) params.set("checkInDate", filters.checkInDate);
  if (filters.checkOutDate) params.set("checkOutDate", filters.checkOutDate);
  // Optional (if API supports it):
  if (filters.sourceOfBooking)
    params.set("sourceOfBooking", filters.sourceOfBooking);
  return params.toString();
}

function transform(reservations: ReservationApi[]): BookingRow[] {
  return (reservations ?? []).map((r) => {
    const firstStatus = r.rooms?.[0]?.reservationStatusMaster;
    return {
      reservationID: r.reservationID,
      reservationNo: r.reservationNo,
      status: (r.status ?? "Unknown").trim().toLowerCase(),
      statusColor: firstStatus?.reservationStatusColour ?? "#ccc",
      type: r.type ?? null,
      bookerFullName: r.bookerFullName ?? null,
      email: r.email ?? null,
      phone: r.phone ?? null,
      refNo: r.refNo ?? null,
      hotelID: r.hotelID,
      hotelName: r.hotelName ?? null,
      resCheckIn: r.resCheckIn,
      resCheckOut: r.resCheckOut,
      totalNights: r.totalNights,
      totalRooms: r.totalRooms,
      totalAmount: r.totalAmount,
      currencyCode: r.currencyCode ?? null,
      sourceOfBooking: r.sourceOfBooking ?? null,
      createdOn: r.createdOn,
      createdBy: r.createdBy ?? null,
      lastUpdatedOn: r.lastUpdatedOn,
      lastUpdatedBy: r.lastUpdatedBy ?? null,
      isCancelled: r.isCancelled,
      guestProfileId: r.guestProfileId,
      rooms: r.rooms,
      reservationStatus: firstStatus?.reservationStatus,
      reservationStatusID: firstStatus?.reservationStatusID,
      reservationDetailIDs: r.rooms?.map((x) => x.reservationDetailID) ?? [],
      nameId: r.nameId,
    };
  });
}

export const fetchReservations = createAsyncThunk<
  {
    items: BookingRow[];
    totalCount: number;
    pageSize: number;
    currentPage: number;
  },
  Partial<Filters> | void,
  { state: RootState }
>(
  "fetchReservations/list",
  async (overrides, { getState, rejectWithValue }) => {
    try {
      // Use stored hotelId if not provided
      let hotelId: number | undefined;
      const storedProp = localStorage.getItem("selectedProperty");
      if (storedProp) {
        const parsed = JSON.parse(storedProp);
        if (parsed?.id) hotelId = Number(parsed.id);
      }

      const state = getState().fetchReservations as State;
      const merged: Filters = { ...state.filters, ...(overrides || {}) };
      if (!merged.hotelId && hotelId) merged.hotelId = hotelId;

      const tokens = localStorage.getItem("hotelmateTokens");
      const accessToken = tokens ? JSON.parse(tokens).accessToken : null;

      const qs = buildQuery(merged);
      const res = await fetch(`${API_BASE}/api/Reservation?${qs}`, {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!res.ok) {
        // Try to extract problem+detail
        let errMsg = `HTTP ${res.status}`;
        try {
          const prob = await res.json();
          if (prob?.detail) errMsg = prob.detail;
          else if (prob?.title) errMsg = prob.title;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      const data = (await res.json()) as FetchResponse;
      return {
        items: transform(data.reservations ?? []),
        totalCount: data.totalCount ?? 0,
        pageSize: data.pageSize ?? merged.pageSize ?? 10,
        currentPage: data.currentPage ?? merged.page ?? 1,
      };
    } catch (e: any) {
      return rejectWithValue(e?.message || "Failed to fetch reservations");
    }
  }
);

const slice = createSlice({
  name: "fetchReservations",
  initialState,
  reducers: {
    // Filter setters (chain these then dispatch fetchReservations())
    setStatus(state, action: PayloadAction<string | undefined>) {
      state.filters.status = action.payload;
      state.filters.page = 1; // reset pagination on filter change
    },
    setSearchTerm(state, action: PayloadAction<string | undefined>) {
      state.filters.searchTerm = action.payload;
      state.filters.page = 1;
    },
    setDateRange(
      state,
      action: PayloadAction<{ fromDate?: string; toDate?: string }>
    ) {
      state.filters.fromDate = action.payload.fromDate;
      state.filters.toDate = action.payload.toDate;
      state.filters.page = 1;
    },
    setCheckInOut(
      state,
      action: PayloadAction<{ checkInDate?: string; checkOutDate?: string }>
    ) {
      state.filters.checkInDate = action.payload.checkInDate;
      state.filters.checkOutDate = action.payload.checkOutDate;
      state.filters.page = 1;
    },
    setReservationStatusId(state, action: PayloadAction<number | undefined>) {
      state.filters.reservationStatusId = action.payload;
      state.filters.page = 1;
    },
    setSourceOfBooking(state, action: PayloadAction<string | undefined>) {
      state.filters.sourceOfBooking = action.payload;
      state.filters.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.filters.pageSize = action.payload;
      state.filters.page = 1;
    },
    setHotelId(state, action: PayloadAction<number | undefined>) {
      state.filters.hotelId = action.payload;
      state.filters.page = 1;
    },
    resetFilters(state) {
      state.filters = { page: 1, pageSize: state.pageSize || 10 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalCount = action.payload.totalCount;
        state.pageSize = action.payload.pageSize;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Unknown error";
      });
  },
});

export const {
  setStatus,
  setSearchTerm,
  setDateRange,
  setCheckInOut,
  setReservationStatusId,
  setSourceOfBooking,
  setPage,
  setPageSize,
  setHotelId,
  resetFilters,
} = slice.actions;

export const fetchReservationsReducer = slice.reducer;

// Selectors
export const selectReservations = (s: RootState) =>
  (s.fetchReservations as State).items;
export const selectReservationsLoading = (s: RootState) =>
  (s.fetchReservations as State).loading;
export const selectReservationsError = (s: RootState) =>
  (s.fetchReservations as State).error;
export const selectReservationsTotal = (s: RootState) =>
  (s.fetchReservations as State).totalCount;
export const selectReservationsPage = (s: RootState) => ({
  page: (s.fetchReservations as State).currentPage,
  pageSize: (s.fetchReservations as State).pageSize,
});
export const selectReservationsFilters = (s: RootState) =>
  (s.fetchReservations as State).filters;

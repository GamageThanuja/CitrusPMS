

// src/redux/slices/fetchHotelMasByHotelCode.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- API Response Type ---- */
export interface HotelMasDTO {
  hotelID: number;
  finAct: boolean;
  hotelCode: string;
  hotelName: string;
  legalName: string;
  address: string;
  phone: string;
  email: string;
  web: string;
  lastLoginOn: string | null; // ISO
  lastLoginBy: number | null;
  createdOn: string | null; // ISO
  createdBy: string | null;
  lastUpdatedBy: string | null;
  lastUpdatedOn: string | null; // ISO
  homeCurrencyCode: string | null;
  cM_Username: string | null;
  cM_Password: string | null;
  cM_PropertyID: string | null;
  toDay: string | null; // ISO
  isChannelManagerActive: boolean | null;
  occ: number | null;
  logoURL: string | null;
  vatNo: string | null;
  cmName: string | null;
  allowManualDisc: boolean | null;
  text1: string | null;
  text2: string | null;
  text3: string | null;
  text4: string | null;
  text5: string | null;
  text6: string | null;
  text7: string | null;
  text8: string | null;
  footer: string | null;
  notes: string | null;
  paymentTerms: string | null;
  cancellationPolicy: string | null;
  childPolicy: string | null;
  taxation: string | null;
  promotions: string | null;
  airportPickupDropd: string | null;
  attractions: string | null;
  coopAddress: string | null;
  companyRegNo: string | null;
  isTranLevelApprovalActive: boolean | null;
  roomRevenueByRoomWise: boolean | null;
  checkInTime: string | null; // ISO
  checkOutTime: string | null; // ISO
  saPassword: string | null;
  groupName: string | null;
  mainImageURL: string | null;
  ibE_LogoURL: string | null;
  latitude: string | null;
  longitude: string | null;
  embedMap: string | null;
  googleMapURL: string | null;
  whatsAppNo: string | null;
  starCat: number | null;
  hotelScore: number | null;
  hotelScoreDesc: string | null;
  lastBackupOn: string | null; // ISO
  e_SenderEmail: string | null;
  e_SMTP_Password: string | null;
  e_SMTP_SERVER: string | null;
  e_SMTP_Port: string | null;
  ibE_Webhook: string | null;
  grnLeadTime: number | null;
  recordCostForComplementRooms: boolean | null;
  ibE_AllowPayAtProperty: boolean | null;
  ibE_isIPGActive: boolean | null;
  ibeHeaderColour: string | null;
  isCancelUnpaidRes_IBE: boolean | null;
  periodEndDate: string | null; // ISO
  ibeurl: string | null;
  ibE_CheckInTime: string | null;
  ibE_CheckOutTime: string | null;
  ibE_CancellationPolicy: string | null;
  ibE_ChildPolicy: string | null;
  ibE_Taxes: string | null;
  ibE_Payments: string | null;
  ibE_Important: string | null;
  ibE_Footer: string | null;
  ibE_TenRes_ReleaseTimeInMin: number | null;
  ibE_Header: string | null;
  googleAnalyticsID: string | null;
  hotelNetworkID: string | null;
  exoticAuthKey: string | null;
  guid: string | null;
  childFriendly: boolean | null;
  ibE_Pay50: boolean | null;
  ibE_LogoWidth: number | null;
  ibE_LogoHeight: number | null;
  // Allow unknown properties
  [k: string]: any;
}

export interface FetchHotelMasArgs {
  hotelCode: string;
}

export interface FetchHotelMasState {
  loading: boolean;
  error: string | null;
  data: HotelMasDTO | null; // We normalize the API array to a single object
  lastQuery: FetchHotelMasArgs | null;
  success: boolean;
}

const initialState: FetchHotelMasState = {
  loading: false,
  error: null,
  data: null,
  lastQuery: null,
  success: false,
};

function normalizeResponse(res: any): HotelMasDTO | null {
  if (!res) return null;
  if (Array.isArray(res)) return res.length ? (res[0] as HotelMasDTO) : null;
  return res as HotelMasDTO;
}

/**
 * Thunk: GET /api/HotelMas?hotelCode=...
 */
export const fetchHotelMasByHotelCode = createAsyncThunk<
  HotelMasDTO | null,
  FetchHotelMasArgs,
  { rejectValue: string }
>("hotelMas/fetchByHotelCode", async (args, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/HotelMas`;
    const res = await axios.get(url, { params: { hotelCode: args.hotelCode } });
    return normalizeResponse(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch HotelMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchHotelMasByHotelCodeSlice = createSlice({
  name: "fetchHotelMasByHotelCode",
  initialState,
  reducers: {
    clearFetchHotelMas(state) {
      state.data = null;
      state.error = null;
      state.lastQuery = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelMasByHotelCode.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.lastQuery = action.meta.arg ?? null;
      })
      .addCase(
        fetchHotelMasByHotelCode.fulfilled,
        (state, action: PayloadAction<HotelMasDTO | null>) => {
          state.loading = false;
          state.data = action.payload;
          state.success = true;
        }
      )
      .addCase(fetchHotelMasByHotelCode.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch HotelMas.";
      });
  },
});

export const { clearFetchHotelMas } = fetchHotelMasByHotelCodeSlice.actions;
export default fetchHotelMasByHotelCodeSlice.reducer;

/** ---- Selectors ---- */
export const selectHotelMas = (s: any) =>
  (s.fetchHotelMasByHotelCode?.data as HotelMasDTO | null) ?? null;
export const selectHotelMasLoading = (s: any) =>
  (s.fetchHotelMasByHotelCode?.loading as boolean) ?? false;
export const selectHotelMasError = (s: any) =>
  (s.fetchHotelMasByHotelCode?.error as string | null) ?? null;
export const selectHotelMasSuccess = (s: any) =>
  (s.fetchHotelMasByHotelCode?.success as boolean) ?? false;
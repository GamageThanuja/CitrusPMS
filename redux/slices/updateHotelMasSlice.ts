import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface HotelMas {
  hotelID: number;
  finAct: boolean;
  hotelCode: string;
  hotelName: string;
  legalName: string;
  address: string;
  phone: string;
  email: string;
  web: string;
  lastLoginOn: string;
  lastLoginBy: number;
  createdOn: string;
  createdBy: string;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
  homeCurrencyCode: string;
  cM_Username: string;
  cM_Password: string;
  cM_PropertyID: string;
  toDay: string;
  isChannelManagerActive: boolean;
  occ: number;
  logoURL: string;
  vatNo: string;
  cmName: string;
  allowManualDisc: boolean;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  text6: string;
  text7: string;
  text8: string;
  footer: string;
  notes: string;
  paymentTerms: string;
  cancellationPolicy: string;
  childPolicy: string;
  taxation: string;
  promotions: string;
  airportPickupDropd: string;
  attractions: string;
  coopAddress: string;
  companyRegNo: string;
  isTranLevelApprovalActive: boolean;
  roomRevenueByRoomWise: boolean;
  checkInTime: string;
  checkOutTime: string;
  saPassword: string;
  groupName: string;
  mainImageURL: string;
  ibE_LogoURL: string;
  latitude: string;
  longitude: string;
  embedMap: string;
  googleMapURL: string;
  whatsAppNo: string;
  starCat: number;
  hotelScore: number;
  hotelScoreDesc: string;
  lastBackupOn: string;
  e_SenderEmail: string;
  e_SMTP_Password: string;
  e_SMTP_SERVER: string;
  e_SMTP_Port: string;
  ibE_Webhook: string;
  grnLeadTime: number;
  recordCostForComplementRooms: boolean;
  ibE_AllowPayAtProperty: boolean;
  ibE_isIPGActive: boolean;
  ibeHeaderColour: string;
  isCancelUnpaidRes_IBE: boolean;
  periodEndDate: string;
  ibeurl: string;
  ibE_CheckInTime: string;
  ibE_CheckOutTime: string;
  ibE_CancellationPolicy: string;
  ibE_ChildPolicy: string;
  ibE_Taxes: string;
  ibE_Payments: string;
  ibE_Important: string;
  ibE_Footer: string;
  ibE_TenRes_ReleaseTimeInMin: number;
  ibE_Header: string;
  googleAnalyticsID: string;
  hotelNetworkID: string;
  exoticAuthKey: string;
  guid: string;
  childFriendly: boolean;
  ibE_Pay50: boolean;
  ibE_LogoWidth: number;
  ibE_LogoHeight: number;
}

/** ---- Thunk ---- */
export const updateHotelMas = createAsyncThunk<
  HotelMas,
  HotelMas | null,
  { rejectValue: string }
>("hotelMas/update", async (payload, { rejectWithValue }) => {
  try {
    if (!payload || !payload.hotelCode) {
      console.warn("updateHotelMas called with null or missing hotelCode");
      return {} as HotelMas;
    }

    const url = `${API_BASE_URL}/api/HotelMas/code/${encodeURIComponent(
      payload.hotelCode
    )}`;

    const response = await axios.put(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data as HotelMas;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to update hotel.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice State ---- */
interface UpdateHotelMasState {
  loading: boolean;
  data: HotelMas | null;
  error: string | null;
}

/** ---- Initial State ---- */
const initialState: UpdateHotelMasState = {
  loading: false,
  data: null,
  error: null,
};

/** ---- Slice ---- */
const updateHotelMasSlice = createSlice({
  name: "updateHotelMas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateHotelMas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateHotelMas.fulfilled,
        (state, action: PayloadAction<HotelMas>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(updateHotelMas.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? "Failed to update hotel data.";
      });
  },
});

/** ---- Selectors ---- */
export const selectUpdateHotelMasData = (state: RootState) =>
  state.updateHotelMas?.data ?? null;

export const selectUpdateHotelMasLoading = (state: RootState) =>
  state.updateHotelMas?.loading ?? false;

export const selectUpdateHotelMasError = (state: RootState) =>
  state.updateHotelMas?.error ?? null;

export default updateHotelMasSlice.reducer;

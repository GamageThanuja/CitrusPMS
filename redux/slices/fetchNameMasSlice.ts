import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types (align with API) ---- */
export interface NameMasItem {
  finAct: boolean;
  nameID: number;
  nameType: string;
  code: string;
  name: string;
  companyName: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fax: string;
  customerType: string;
  priceGroupID: number;
  discount: number;
  vatNo: string;
  creditLimit: number;
  createdOn: string;
  createdBy: string;
  lastModOn: string;
  lastModBy: string;
  nic: string;
  warehouseID: number;
  cpForDelivery: string;
  cpForDeliveryPhone: string;
  cpForPayments: string;
  cpForPaymentPhone: string;
  creditPeriod: number;
  buid: number;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  countryID: number;
  customerMasterType: string;
  repID: number;
  purPriceGroupID: number;
  epfNo: string;
  initials: string;
  gender: string;
  dob: string;
  nationality: string;
  maritalStatus: string;
  passportNo: string;
  jobCategoryID: number;
  designationID: number;
  agencyID: number;
  quotaID: number;
  insurance: number;
  wpCategoryID: number;
  wpNo: number;
  siteCategoryID: number;
  basicSalary: number;
  allowance1: number;
  allowance2: number;
  allowance3: number;
  dateOfJoined: string;
  dateOfPermanent: string;
  dateOfResigned: string;
  empPicturePath: string;
  pin: number;
  perDaySalary: boolean;
  priceGroupApproved: boolean;
  currencyID: number;
  distance: number;
  mobileNo: string;
  shortCode: string;
  notes: string;
  bankAccNo: string;
  bankName: string;
  nAmeOnCheque: string;
  phoneRes: string;
  opBal: number;
  opBalAsAt: string;
  routeID: number;
  joinedDate: string;
  isAllowCredit: boolean;
  cmTaxRate: number;
  cmChannelID: string;
  isFullPaymentNeededForCheckIn: boolean;
  isResigned: boolean;
  departmentID: number;
  empCategoryID: number;
  serviceChargePercentage: number;
  hotelID: number;
  hotelCode: number;
  tranCode: string;
  [k: string]: any;
}

/** ---- Query Parameters ---- */
export interface FetchNameMasParams {
  nameId?: number;
  nameType?: string;
}

/** ---- State ---- */
export interface FetchNameMasState {
  loading: boolean;
  error: string | null;
  items: NameMasItem[];
  success: boolean;
  lastFetchedAt: string | null;
}

const initialState: FetchNameMasState = {
  loading: false,
  error: null,
  items: [],
  success: false,
  lastFetchedAt: null,
};

/** ---- Thunk: GET /api/NameMas ---- */
export const fetchNameMas = createAsyncThunk<
  NameMasItem[],
  FetchNameMasParams,
  { rejectValue: string }
>("nameMas/fetch", async (params, { rejectWithValue }) => {
  try {
    const url = new URL(`${API_BASE_URL}/api/NameMas`);
    if (params.nameId) url.searchParams.append("nameId", params.nameId.toString());
    if (params.nameType) url.searchParams.append("nameType", params.nameType);
    const res = await axios.get(url.toString());
    if (Array.isArray(res.data)) {
      return res.data as NameMasItem[];
    }
    return [];
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch NameMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchNameMasSlice = createSlice({
  name: "fetchNameMas",
  initialState,
  reducers: {
    clearFetchNameMas(state) {
      state.loading = false;
      state.error = null;
      state.items = [];
      state.success = false;
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNameMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        fetchNameMas.fulfilled,
        (state, action: PayloadAction<NameMasItem[]>) => {
          state.loading = false;
          state.items = action.payload;
          state.success = true;
          state.lastFetchedAt = new Date().toISOString();
        }
      )
      .addCase(fetchNameMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to fetch NameMas.";
      });
  },
});

export const { clearFetchNameMas } = fetchNameMasSlice.actions;
export default fetchNameMasSlice.reducer;

/** ---- Selectors ---- */
export const selectFetchNameMasItems = (s: any) =>
  (s.fetchNameMas?.items as NameMasItem[]) ?? [];
export const selectFetchNameMasLoading = (s: any) =>
  (s.fetchNameMas?.loading as boolean) ?? false;
export const selectFetchNameMasError = (s: any) =>
  (s.fetchNameMas?.error as string | null) ?? null;
export const selectFetchNameMasSuccess = (s: any) =>
  (s.fetchNameMas?.success as boolean) ?? false;
export const selectFetchNameMasLastFetchedAt = (s: any) =>
  (s.fetchNameMas?.lastFetchedAt as string | null) ?? null;
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
  hotelID?: number;
  hotelCode?: number;
  tranCode: string;
  [k: string]: any;
}

/** ---- Request payload ---- */
export type CreateNameMasPayload = Omit<NameMasItem, "nameID">;

/** ---- State ---- */
export interface CreateNameMasState {
  loading: boolean;
  error: string | null;
  item: NameMasItem | null;
  success: boolean;
  lastCreatedAt: string | null;
}

const initialState: CreateNameMasState = {
  loading: false,
  error: null,
  item: null,
  success: false,
  lastCreatedAt: null,
};

function normalizeObject(res: any): NameMasItem | null {
  if (!res) return null;
  if (Array.isArray(res)) return (res[0] as NameMasItem) ?? null;
  if (typeof res === "object") return res as NameMasItem;
  return null;
}

/** ---- Thunk: POST /api/NameMas ---- */
export const createNameMas = createAsyncThunk<
  NameMasItem | null,
  CreateNameMasPayload,
  { rejectValue: string }
>("nameMas/create", async (payload, { rejectWithValue }) => {
  try {
    const url = `${API_BASE_URL}/api/NameMas`;
    const res = await axios.post(url, payload);
    return normalizeObject(res.data);
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to create NameMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createNameMasSlice = createSlice({
  name: "createNameMas",
  initialState,
  reducers: {
    clearCreateNameMas(state) {
      state.loading = false;
      state.error = null;
      state.item = null;
      state.success = false;
      state.lastCreatedAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNameMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(
        createNameMas.fulfilled,
        (state, action: PayloadAction<NameMasItem | null>) => {
          state.loading = false;
          state.item = action.payload ?? null;
          state.success = true;
          state.lastCreatedAt = new Date().toISOString();
        }
      )
      .addCase(createNameMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to create NameMas.";
      });
  },
});

export const { clearCreateNameMas } = createNameMasSlice.actions;
export default createNameMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateNameMasItem = (s: any) =>
  (s.createNameMas?.item as NameMasItem | null) ?? null;
export const selectCreateNameMasLoading = (s: any) =>
  (s.createNameMas?.loading as boolean) ?? false;
export const selectCreateNameMasError = (s: any) =>
  (s.createNameMas?.error as string | null) ?? null;
export const selectCreateNameMasSuccess = (s: any) =>
  (s.createNameMas?.success as boolean) ?? false;
export const selectCreateNameMasLastCreatedAt = (s: any) =>
  (s.createNameMas?.lastCreatedAt as string | null) ?? null;
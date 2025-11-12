import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface NameMasPayload {
  nameID: number;
  finAct: boolean;
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
  dob: string | null;
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
  dateOfJoined: string | null;
  dateOfPermanent: string | null;
  dateOfResigned: string | null;
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
  opBalAsAt: string | null;
  routeID: number;
  joinedDate: string | null;
  isAllowCredit: boolean;
  cmTaxRate: number;
  cmChannelID: string;
  isFullPaymentNeededForCheckIn: boolean;
  isResigned: boolean;
  departmentID: number;
  empCategoryID: number;
  serviceChargePercentage: number;
  tranCode: string; // Added TranCode field
}

interface UpdateNameMasArgs {
  nameID: number;
  payload: {
    nameMas: NameMasPayload;
  };
}

// 🔹 Async Thunk
export const updateNameMas = createAsyncThunk(
  "nameMas/updateNameMas",
  async ({ nameID, payload }: UpdateNameMasArgs, { rejectWithValue }) => {
    try {
      const url = `${API_BASE_URL}/api/NameMas/${nameID}`;
      const response = await axios.put(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data || { message: err.message || "Unknown error" }
      );
    }
  }
);

// 🔹 Slice
const updateNameMasSlice = createSlice({
  name: "updateNameMas",
  initialState: {
    loading: false,
    success: false,
    error: null as string | null,
    updatedData: null as any,
  },
  reducers: {
    resetUpdateState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.updatedData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateNameMas.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateNameMas.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.updatedData = action.payload;
      })
      .addCase(updateNameMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as any)?.message || "Failed to update NameMas";
      });
  },
});

export const { resetUpdateState } = updateNameMasSlice.actions;

export default updateNameMasSlice.reducer;
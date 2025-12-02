// redux/slices/createTransactionSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface GLAccTransaction {
  finAct: boolean;
  accountID: number;
  amount: number;
  debit: number;
  credit: number;
  comment: string;
  createdOn: string;
  createdBy: string;
  tranTypeID: number;
  refAccountID: number;
  itemID: number;
  siteID: number;
  memo: string;
  tranDate: string;
  dueDate: string;
  chequeDate: string;
  chequePrinted: boolean;
  paymentVoucherNo: string;
  offSetAccID: number;
  chequeNo: string;
  supplierInvoNo: string;
  taxCode: string;
  costCenterID: number;
  billRef: string;
  paymentReceiptRef: string;
  reconciled: number;
  recDate: string;
  currAmount: number;
  currDebit: number;
  currCredit: number;
  propertyID: number;
  recMasID: number;
  batchID: number;
  active: boolean;
  collectionScheduledOn: string;
  isDue: boolean;
  isArrears: boolean;
  isEarlySettlement: boolean;
  batchNo: number;
  split: string;
  narration: string;
  effectiveDate: string;
  currencyCode: string;
  amtInCurr: number;
  tranDetailID: number;
  pumpID: number;
  currCode: string;
  convRate: string;
  cardType: string;
  reservationDetailID: number;
}

export interface Transaction {
  glAccTransactions: GLAccTransaction[];
  finAct: boolean;
  hotelCode: string;
  tranTypeId: number;
  tranDate: string;
  createdOn: string;
  createdBy: string;
  posted: boolean;
  postedOn: string;
  postedBy: number;
  nameID: number;
  noOfPax: number;
  tranValue: number;
  vatValue: number;
  headerDisountTotal: number;
  lineDiscountTotal: number;
  cancelledResonId: number;
  cancelledDate: string;
  status: string;
  remarks: string;
  phoneNo: string;
  dueDate: string;
  chequeNo: string;
  bankID: number;
  chequeDate: string;
  chequePrinted: boolean;
  paymentMethod: string;
  repID: number;
  refNo: string;
  invoStartTime: string;
  invoEndTime: string;
  currencyCode: string;
  discount: number;
  exchangeRate: number;
  costCenterId: number;
  approvedOn: string;
  approvedBy: string;
  currTranValue: number;
  currConvRate: number;
  isTaxInclusive: boolean;
  serviceCharge: number;
  posCenter: string;
  isFinished: boolean;
  tableNo: string;
  discPercentage: number;
  sc: number;
  paidByCash: number;
  paidByCC: number;
  onAccount: number;
  balanceRtn: number;
  finActBy: string;
  finActOn: string;
  reqBy: string;
  posCenterCode: string;
  onCost: boolean;
  startTimeStamp: string;
  endTimeStamp: string;
  isOrderAccepted: boolean;
  isPreparationStarted: boolean;
  isPreparationFinished: boolean;
  isDelivered: boolean;
  isPrintKOT: boolean;
  isPrintBOT: boolean;
  deliveryMethod: string;
  invoiceType: string;
  paidInCheque: number;
  complementory: number;
  isOnHotelAcc: boolean;
  departmentCharge: number;
  isComplement: boolean;
  isIncluded: boolean;
  isBillOnCost: boolean;
  isTaxExempted: boolean;
  isSCExempted: boolean;
  isDepartmentCharge: boolean;
  staffTipp: number;
  billEndAt: string;
  refInvNo: string;
  isVoidApproved: boolean;
  voidApprovedBy: string;
  voidApprovedAt: string;
  isGuestLedger: boolean;
  effectiveDate: string;
  grossTotal: number;
  headerDiscount: number;
  isOnHold: boolean;
  voidBy: string;
  reservationDetailId: number;
  vat: number;
  tdl: number;
  sscl: number;
  isUSDBilling: boolean;
  isPosted: boolean;
  isNightAudited: boolean;
  fraction: number;
  rateCodeId: string;
  discountCode: string;
  scRate: number;
  vatRate: number;
  ssclRate: number;
  tdlRate: number;
  reservationId: number;
  voidOn: string;
  voidTimeStamp: string;
  paidByVISA: number;
  paidbyAMEX: number;
  paidByBankTransfer: number;
  isCookingFinished: boolean;
  isProcessed: boolean;
  isRecordLocked: boolean;
  customerName: string;
  cityLedgerTransfered: boolean;
  originalBillTot: number;
  supportingDocURL: string;
  roomId: number;
  hotelPosCenterId: number;
}


interface CreateTransactionState {
  loading: boolean;
  error: string | null;
  data: Transaction[];
}

const initialState: CreateTransactionState = {
  loading: false,
  error: null,
  data: [],
};

/** ---- Thunk: POST /api/Transaction?userId=... ---- */
export const createTransaction = createAsyncThunk<
  Transaction,
  { userId: number; transaction: Transaction },
  { rejectValue: string }
>("transaction/create", async ({ userId, transaction }, { rejectWithValue }) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/Transaction`,
      transaction,
      {
        params: { userId },
      }
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create transaction.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createTransactionSlice = createSlice({
  name: "createTransaction",
  initialState,
  reducers: {
    // ✅ same idea as resetGlTransactionState
    resetCreateTransactionState(state) {
      state.loading = false;
      state.error = null;
      state.data = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createTransaction.fulfilled,
        (state, action: PayloadAction<Transaction>) => {
          state.loading = false;
          // Add the created transaction to the array
          state.data.push(action.payload);
        }
      )
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create transaction.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateTransactionState } = createTransactionSlice.actions;
export default createTransactionSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateTransactionLoading = (state: any) =>
  state.createTransaction?.loading ?? false;

export const selectCreateTransactionError = (state: any) =>
  state.createTransaction?.error ?? null;

export const selectCreateTransactionData = (state: any) =>
  state.createTransaction?.data ?? [];
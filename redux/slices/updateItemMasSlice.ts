import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ItemMas {
  finAct: boolean;
  itemID: number;
  itemNumber: string;
  description: string;
  extDescription: string;
  uomid: number;
  itemTypeID: number;
  categoryID: number;
  salesTaxID: number;
  price: number;
  cost: number;
  binLocation: string;
  notes: string;
  reorderPoint: number;
  restockLevel: number;
  picturePath: string;
  notDiscountable: boolean;
  cannotPurchase: boolean;
  cannotInvoDecimal: boolean;
  waighMustEnter: boolean;
  itemMessage: string;
  createdBy: number;
  createdOn: string;
  lastModBy: number;
  lastModOn: string;
  cogsAccountID: number;
  salesAccountID: number;
  inventoryAssetsAccID: number;
  lowestSellingPrice: number;
  packagingSize: string;
  messageClient: string;
  cannotInvoInsufQty: boolean;
  subCompanyID: number;
  serialNo: string;
  costCenterID: number;
  custodianID: number;
  supplierID: number;
  acqDate: string;
  lifeTimeYears: number;
  lifeTimeMonths: number;
  serviceProvider: string;
  warranty: string;
  nextServiceDate: string;
  serviceContractNo: string;
  commercialDepreMethodID: number;
  fiscalDepreMethodID: number;
  profitMargin: number;
  vat: boolean;
  nbt: boolean;
  sinhalaDes: string;
  brandID: number;
  kitItem: boolean;
  buid: number;
  serialNumbered: boolean;
  preferedSupplierID: number;
  backColour: string;
  limitWholesaleQtyAtCHK: boolean;
  limitWholesaleQtyAt: number;
  maxWholesaleQtyCHK: boolean;
  maxWholesaleQty: number;
  discountRTNarration: string;
  discountWSNarration: string;
  limitRetailQtyAtCHK: boolean;
  limitRetailQtyAt: number;
  maxRetialQtyCHK: boolean;
  maxRetailQty: number;
  isPick: boolean;
  rtPrice: number;
  wsPrice: number;
  itemMessage_Client: string;
  showOnPOS: boolean;
  isKOT: boolean;
  isBOT: boolean;
  posCenter: string;
  rackNo: string;
  isTrading: boolean;
  isTaxIncluded: boolean;
  isSCIncluded: boolean;
  baseItemCatID: number;
  oldItemCode: string;
  small: boolean;
  regular: boolean;
  large: boolean;
  guestPrice: number;
  childPrice: number;
  guidePrice: number;
  driverPrice: number;
  isRecipe: boolean;
  isAIEntitled: boolean;
  sku: string;
  useBatchPriceOnSale: boolean;
  discountPercentage: number;
  discountID: number;
  isFastCheckOut: boolean;
  changePriceOnGRN: boolean;
  partNo: string;
  oldPrice: number;
  oldPriceAsAt: string;
  lastPriceUpdateBy: string;
  colour: string;
  askQtyOnSale: boolean;
  isAskSKU: boolean;
  skuid: number;
  isShotItem: boolean;
  shotItemID: number;
  shotItemCode: string;
  subItemOf: string;
  imageURL: string;
  lastDepreciatedDate: string;
  depreciationExpenseAccountID: number;
  bookValue: number;
  bookValueAsAt: string;
  guardian: string;
  barCode: string;
  nameOnBill: string;
}

/** ---- State ---- */
interface UpdateItemMasState {
  loading: boolean;
  error: string | null;
  success: boolean;
  data: ItemMas | null;
}

const initialState: UpdateItemMasState = {
  loading: false,
  error: null,
  success: false,
  data: null,
};

/** ---- Thunk: PUT /api/ItemMas/{itemNumber} ---- */
export const updateItemMas = createAsyncThunk<
  ItemMas,
  ItemMas,
  { rejectValue: string }
>("itemMas/update", async (payload, { rejectWithValue }) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/api/ItemMas/${payload.itemNumber}`,
      payload
    );
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to update ItemMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const updateItemMasSlice = createSlice({
  name: "updateItemMas",
  initialState,
  reducers: {
    resetUpdateItemMasState(state) {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateItemMas.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateItemMas.fulfilled, (state, action: PayloadAction<ItemMas>) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(updateItemMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = (action.payload as string) || "Failed to update ItemMas.";
      });
  },
});

/** ---- Exports ---- */
export const { resetUpdateItemMasState } = updateItemMasSlice.actions;
export default updateItemMasSlice.reducer;

/** ---- Selectors ---- */
export const selectUpdateItemMasLoading = (state: any) =>
  (state.updateItemMas?.loading as boolean) ?? false;
export const selectUpdateItemMasError = (state: any) =>
  (state.updateItemMas?.error as string | null) ?? null;
export const selectUpdateItemMasSuccess = (state: any) =>
  (state.updateItemMas?.success as boolean) ?? false;
export const selectUpdateItemMasData = (state: any) =>
  (state.updateItemMas?.data as ItemMas | null) ?? null;

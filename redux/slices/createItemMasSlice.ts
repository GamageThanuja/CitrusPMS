import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** ---- Types ---- */
export interface ItemMasData {
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
  acqDate: string | null;
  lifeTimeYears: number;
  lifeTimeMonths: number;
  serviceProvider: string;
  warranty: string;
  nextServiceDate: string | null;
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
  oldPriceAsAt: string | null;
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
  lastDepreciatedDate: string | null;
  depreciationExpenseAccountID: number;
  bookValue: number;
  bookValueAsAt: string | null;
  guardian: string;
  barCode: string;
  nameOnBill: string;
}

/** ---- State ---- */
interface CreateItemMasState {
  loading: boolean;
  success: boolean;
  error: string | null;
  createdItem: ItemMasData | null;
}

const initialState: CreateItemMasState = {
  loading: false,
  success: false,
  error: null,
  createdItem: null,
};

/** ---- Thunk: POST /api/ItemMas ---- */
export const createItemMas = createAsyncThunk<
  ItemMasData,
  ItemMasData,
  { rejectValue: string }
>("itemMas/create", async (itemData, { rejectWithValue }) => {
  try {
    // Format dates properly for the API
    const formattedItemData = {
      ...itemData,
      // Ensure date fields are properly formatted as ISO strings or null
      oldPriceAsAt: itemData.oldPriceAsAt 
        ? new Date(itemData.oldPriceAsAt).toISOString()
        : null,
      createdOn: itemData.createdOn 
        ? new Date(itemData.createdOn).toISOString()
        : new Date().toISOString(),
      lastModOn: itemData.lastModOn 
        ? new Date(itemData.lastModOn).toISOString()
        : new Date().toISOString(),
      acqDate: itemData.acqDate 
        ? new Date(itemData.acqDate).toISOString()
        : null,
      nextServiceDate: itemData.nextServiceDate 
        ? new Date(itemData.nextServiceDate).toISOString()
        : null,
      lastDepreciatedDate: itemData.lastDepreciatedDate 
        ? new Date(itemData.lastDepreciatedDate).toISOString()
        : null,
      bookValueAsAt: itemData.bookValueAsAt 
        ? new Date(itemData.bookValueAsAt).toISOString()
        : null,
    };

    const response = await axios.post(`${API_BASE_URL}/api/ItemMas`, formattedItemData);
    return response.data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to create ItemMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const createItemMasSlice = createSlice({
  name: "createItemMas",
  initialState,
  reducers: {
    resetCreateItemMasState(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.createdItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createItemMas.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        createItemMas.fulfilled,
        (state, action: PayloadAction<ItemMasData>) => {
          state.loading = false;
          state.success = true;
          state.createdItem = action.payload;
        }
      )
      .addCase(createItemMas.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || "Failed to create ItemMas.";
      });
  },
});

/** ---- Exports ---- */
export const { resetCreateItemMasState } = createItemMasSlice.actions;
export default createItemMasSlice.reducer;

/** ---- Selectors ---- */
export const selectCreateItemMasLoading = (s: any) =>
  (s.createItemMas?.loading as boolean) ?? false;
export const selectCreateItemMasSuccess = (s: any) =>
  (s.createItemMas?.success as boolean) ?? false;
export const selectCreateItemMasError = (s: any) =>
  (s.createItemMas?.error as string | null) ?? null;
export const selectCreatedItemMas = (s: any) =>
  (s.createItemMas?.createdItem as ItemMasData | null) ?? null;

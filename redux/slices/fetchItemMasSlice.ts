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
  [key: string]: any;
}

export interface FetchItemMasParams {
  itemId?: number;
  itemNumber?: string;
  categoryId?: number;
}

/** ---- State ---- */
interface FetchItemMasState {
  loading: boolean;
  error: string | null;
  items: ItemMas[];
  lastQuery: FetchItemMasParams | null;
}

const initialState: FetchItemMasState = {
  loading: false,
  error: null,
  items: [],
  lastQuery: null,
};

/** ---- Thunk: GET /api/ItemMas ---- */
export const fetchItemMas = createAsyncThunk<
  ItemMas[],
  FetchItemMasParams | undefined,
  { rejectValue: string }
>("itemMas/fetch", async (params, { rejectWithValue }) => {
  try {
    const safeParams: Record<string, any> = {};
    if (params?.itemId != null) safeParams.itemId = params.itemId;
    if (params?.itemNumber) safeParams.itemNumber = params.itemNumber;
    if (params?.categoryId != null) safeParams.categoryId = params.categoryId;

    const qs = new URLSearchParams(safeParams as any).toString();
    const url = `${API_BASE_URL}/api/ItemMas${qs ? `?${qs}` : ""}`;

    const res = await axios.get(url);
    const data = Array.isArray(res.data) ? (res.data as ItemMas[]) : [];
    return data;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message || err?.message || "Failed to fetch ItemMas.";
    return rejectWithValue(msg);
  }
});

/** ---- Slice ---- */
const fetchItemMasSlice = createSlice({
  name: "itemMas",
  initialState,
  reducers: {
    clearItemMas(state) {
      state.items = [];
      state.error = null;
      state.lastQuery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemMas.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.lastQuery = (action.meta.arg as FetchItemMasParams | undefined) ?? null;
      })
      .addCase(fetchItemMas.fulfilled, (state, action: PayloadAction<ItemMas[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItemMas.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Failed to fetch ItemMas.";
      });
  },
});

/** ---- Exports ---- */
export const { clearItemMas } = fetchItemMasSlice.actions;
export default fetchItemMasSlice.reducer;

/** ---- Selectors ---- */
export const selectItemMasItems = (s: any) =>
  (s.fetchItemMas?.items as ItemMas[]) ?? [];
export const selectItemMasLoading = (s: any) =>
  (s.fetchItemMas?.loading as boolean) ?? false;
export const selectItemMasError = (s: any) =>
  (s.fetchItemMas?.error as string | null) ?? null;
export const selectItemMasLastQuery = (s: any) =>
  (s.fetchItemMas?.lastQuery as FetchItemMasParams | null) ?? null;

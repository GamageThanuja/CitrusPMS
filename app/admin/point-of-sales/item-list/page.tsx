"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { AppDispatch, RootState } from "@/redux/store";

import {
  fetchItemMas,
  selectItemMasItems,
  selectItemMasLoading,
  selectItemMasError,
  type ItemMas,
} from "@/redux/slices/fetchItemMasSlice";

import {
  createItemMas,
  selectCreateItemMasLoading,
  selectCreateItemMasSuccess,
  selectCreateItemMasError,
  resetCreateItemMasState,
  type ItemMasData,
} from "@/redux/slices/createItemMasSlice";

import {
  updateItemMas,
  selectUpdateItemMasLoading,
  selectUpdateItemMasSuccess,
  selectUpdateItemMasError,
  resetUpdateItemMasState,
} from "@/redux/slices/updateItemMasSlice";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import PosAddItemListDrawer from "@/components/drawers/pos-addItemList-drawer";
import PosEditItemListDrawer from "@/components/drawers/pos-editItemList-drawer"; // ⬅️ import edit drawer

type BoolFilter = "all" | "checked" | "unchecked";

export default function ItemListPage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector((s: RootState) => selectItemMasItems(s));
  const loading = useSelector((s: RootState) => selectItemMasLoading(s));
  const error = useSelector((s: RootState) => selectItemMasError(s));

  // Create item state
  const createLoading = useSelector((s: RootState) => selectCreateItemMasLoading(s));
  const createSuccess = useSelector((s: RootState) => selectCreateItemMasSuccess(s));
  const createError = useSelector((s: RootState) => selectCreateItemMasError(s));

  // Update item state
  const updateLoading = useSelector((s: RootState) => selectUpdateItemMasLoading(s));
  const updateSuccess = useSelector((s: RootState) => selectUpdateItemMasSuccess(s));
  const updateError = useSelector((s: RootState) => selectUpdateItemMasError(s));

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  // Drawer state
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemMas | null>(null);

  // Text filters
  const [fItemType, setFItemType] = useState("");
  const [fBaseCat, setFBaseCat] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fCode, setFCode] = useState("");
  const [fName, setFName] = useState("");

  // Boolean filters
  const [fOnPOS, setFOnPOS] = useState<BoolFilter>("all");
  const [fKOT, setFKOT] = useState<BoolFilter>("all");
  const [fBOT, setFBOT] = useState<BoolFilter>("all");
  const [fAIEnt, setFAIEnt] = useState<BoolFilter>("all");
  const [fTrading, setFTrading] = useState<BoolFilter>("all");
  const [fAskQty, setFAskQty] = useState<BoolFilter>("all");

  // Fetch ALL items on mount (no params)
  useEffect(() => {
    dispatch(fetchItemMas(undefined));
  }, [dispatch]);

  // Handle successful item creation
  useEffect(() => {
    if (createSuccess) {
      setAddDrawerOpen(false);
      dispatch(resetCreateItemMasState());
      // Refresh the items list
      dispatch(fetchItemMas(undefined));
    }
  }, [createSuccess, dispatch]);

  // Handle successful item update
  useEffect(() => {
    if (updateSuccess) {
      setEditDrawerOpen(false);
      setSelectedItem(null);
      dispatch(resetUpdateItemMasState());
      // Refresh the items list
      dispatch(fetchItemMas(undefined));
    }
  }, [updateSuccess, dispatch]);

  const filtered = useMemo(() => {
    const matchesBool = (val: boolean, f: BoolFilter) => {
      if (f === "all") return true;
      if (f === "checked") return !!val;
      if (f === "unchecked") return !val;
      return true;
    };

    return (items || []).filter((item) => {
      if (
        fItemType &&
        !String(item.itemTypeID).toLowerCase().includes(fItemType.toLowerCase())
      )
        return false;

      if (
        fBaseCat &&
        !String(item.baseItemCatID)
          .toLowerCase()
          .includes(fBaseCat.toLowerCase())
      )
        return false;

      if (
        fCategory &&
        !String(item.categoryID).toLowerCase().includes(fCategory.toLowerCase())
      )
        return false;

      if (
        fCode &&
        !String(item.itemNumber).toLowerCase().includes(fCode.toLowerCase())
      )
        return false;

      if (
        fName &&
        !String(item.description).toLowerCase().includes(fName.toLowerCase())
      )
        return false;

      if (!matchesBool(item.showOnPOS, fOnPOS)) return false;
      if (!matchesBool(item.isKOT, fKOT)) return false;
      if (!matchesBool(item.isBOT, fBOT)) return false;
      if (!matchesBool(item.isAIEntitled, fAIEnt)) return false;
      if (!matchesBool(item.isTrading, fTrading)) return false;
      if (!matchesBool(item.askQtyOnSale, fAskQty)) return false;

      return true;
    });
  }, [
    items,
    fItemType,
    fBaseCat,
    fCategory,
    fCode,
    fName,
    fOnPOS,
    fKOT,
    fBOT,
    fAIEnt,
    fTrading,
    fAskQty,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading && !updateLoading;
  const canNext = !loading && !updateLoading && pageIndex < totalPages;

  const handlePrev = () => canPrev && setPageIndex((p) => p - 1);
  const handleNext = () => canNext && setPageIndex((p) => p + 1);
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value) || 10);
    setPageIndex(1);
  };

  const paginated = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(1);
  }, [
    fItemType,
    fBaseCat,
    fCategory,
    fCode,
    fName,
    fOnPOS,
    fKOT,
    fBOT,
    fAIEnt,
    fTrading,
    fAskQty,
    pageSize,
  ]);

  // Open drawer in "add" mode
  const handleAddItem = () => {
    setSelectedItem(null);
    setAddDrawerOpen(true);
  };

  // Open drawer in "edit" mode
  const handleEdit = (item: ItemMas) => {
    setSelectedItem(item);
    setEditDrawerOpen(true); // ⬅️ open edit drawer
  };

  const handleSaveNew = (values: Partial<ItemMas>) => {
    console.log("Save NEW item from drawer:", values);
    
    // Convert the partial ItemMas to ItemMasData format
    const itemData: ItemMasData = {
      finAct: values.finAct ?? false,
      itemID: 0, // Will be assigned by the API
      itemNumber: values.itemNumber ?? "",
      description: values.description ?? "",
      extDescription: values.extDescription ?? "",
      uomid: values.uomid ?? 0,
      itemTypeID: values.itemTypeID ?? 0,
      categoryID: values.categoryID ?? 0,
      salesTaxID: values.salesTaxID ?? 0,
      price: values.price ?? 0,
      cost: values.cost ?? 0,
      binLocation: values.binLocation ?? "",
      notes: values.notes ?? "",
      reorderPoint: values.reorderPoint ?? 0,
      restockLevel: values.restockLevel ?? 0,
      picturePath: values.picturePath ?? "",
      notDiscountable: values.notDiscountable ?? false,
      cannotPurchase: values.cannotPurchase ?? false,
      cannotInvoDecimal: values.cannotInvoDecimal ?? false,
      waighMustEnter: values.waighMustEnter ?? false,
      itemMessage: values.itemMessage ?? "",
      createdBy: values.createdBy ?? 0,
      createdOn: new Date().toISOString(),
      lastModBy: values.lastModBy ?? 0,
      lastModOn: new Date().toISOString(),
      cogsAccountID: values.cogsAccountID ?? 0,
      salesAccountID: values.salesAccountID ?? 0,
      inventoryAssetsAccID: values.inventoryAssetsAccID ?? 0,
      lowestSellingPrice: values.lowestSellingPrice ?? 0,
      packagingSize: values.packagingSize ?? "",
      messageClient: values.messageClient ?? "",
      cannotInvoInsufQty: values.cannotInvoInsufQty ?? false,
      subCompanyID: values.subCompanyID ?? 0,
      serialNo: values.serialNo ?? "",
      costCenterID: values.costCenterID ?? 0,
      custodianID: values.custodianID ?? 0,
      supplierID: values.supplierID ?? 0,
      acqDate: values.acqDate ?? null,
      lifeTimeYears: values.lifeTimeYears ?? 0,
      lifeTimeMonths: values.lifeTimeMonths ?? 0,
      serviceProvider: values.serviceProvider ?? "",
      warranty: values.warranty ?? "",
      nextServiceDate: values.nextServiceDate ?? null,
      serviceContractNo: values.serviceContractNo ?? "",
      commercialDepreMethodID: values.commercialDepreMethodID ?? 0,
      fiscalDepreMethodID: values.fiscalDepreMethodID ?? 0,
      profitMargin: values.profitMargin ?? 0,
      vat: values.vat ?? false,
      nbt: values.nbt ?? false,
      sinhalaDes: values.sinhalaDes ?? "",
      brandID: values.brandID ?? 0,
      kitItem: values.kitItem ?? false,
      buid: values.buid ?? 0,
      serialNumbered: values.serialNumbered ?? false,
      preferedSupplierID: values.preferedSupplierID ?? 0,
      backColour: values.backColour ?? "",
      limitWholesaleQtyAtCHK: values.limitWholesaleQtyAtCHK ?? false,
      limitWholesaleQtyAt: values.limitWholesaleQtyAt ?? 0,
      maxWholesaleQtyCHK: values.maxWholesaleQtyCHK ?? false,
      maxWholesaleQty: values.maxWholesaleQty ?? 0,
      discountRTNarration: values.discountRTNarration ?? "",
      discountWSNarration: values.discountWSNarration ?? "",
      limitRetailQtyAtCHK: values.limitRetailQtyAtCHK ?? false,
      limitRetailQtyAt: values.limitRetailQtyAt ?? 0,
      maxRetialQtyCHK: values.maxRetialQtyCHK ?? false,
      maxRetailQty: values.maxRetailQty ?? 0,
      isPick: values.isPick ?? false,
      rtPrice: values.rtPrice ?? 0,
      wsPrice: values.wsPrice ?? 0,
      itemMessage_Client: values.itemMessage_Client ?? "",
      showOnPOS: values.showOnPOS ?? false,
      isKOT: values.isKOT ?? false,
      isBOT: values.isBOT ?? false,
      posCenter: values.posCenter ?? "",
      rackNo: values.rackNo ?? "",
      isTrading: values.isTrading ?? false,
      isTaxIncluded: values.isTaxIncluded ?? false,
      isSCIncluded: values.isSCIncluded ?? false,
      baseItemCatID: values.baseItemCatID ?? 0,
      oldItemCode: values.oldItemCode ?? "",
      small: values.small ?? false,
      regular: values.regular ?? false,
      large: values.large ?? false,
      guestPrice: values.guestPrice ?? 0,
      childPrice: values.childPrice ?? 0,
      guidePrice: values.guidePrice ?? 0,
      driverPrice: values.driverPrice ?? 0,
      isRecipe: values.isRecipe ?? false,
      isAIEntitled: values.isAIEntitled ?? false,
      sku: values.sku ?? "",
      useBatchPriceOnSale: values.useBatchPriceOnSale ?? false,
      discountPercentage: values.discountPercentage ?? 0,
      discountID: values.discountID ?? 0,
      isFastCheckOut: values.isFastCheckOut ?? false,
      changePriceOnGRN: values.changePriceOnGRN ?? false,
      partNo: values.partNo ?? "",
      oldPrice: values.oldPrice ?? 0,
      oldPriceAsAt: values.oldPriceAsAt ?? null,
      lastPriceUpdateBy: values.lastPriceUpdateBy ?? "",
      colour: values.colour ?? "",
      askQtyOnSale: values.askQtyOnSale ?? false,
      isAskSKU: values.isAskSKU ?? false,
      skuid: values.skuid ?? 0,
      isShotItem: values.isShotItem ?? false,
      shotItemID: values.shotItemID ?? 0,
      shotItemCode: values.shotItemCode ?? "",
      subItemOf: values.subItemOf ?? "",
      imageURL: values.imageURL ?? "",
      lastDepreciatedDate: values.lastDepreciatedDate ?? null,
      depreciationExpenseAccountID: values.depreciationExpenseAccountID ?? 0,
      bookValue: values.bookValue ?? 0,
      bookValueAsAt: values.bookValueAsAt ?? null,
      guardian: values.guardian ?? "",
      barCode: values.barCode ?? "",
      nameOnBill: values.nameOnBill ?? "",
    };

    dispatch(createItemMas(itemData));
  };

  const handleSaveEdit = (updated: ItemMas) => {
    console.log("Save EDITED item from drawer:", updated);
    dispatch(updateItemMas(updated));
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-black-700">Item List</h1>
            <p className="text-sm text-gray-500 -mt-1">
              View / Edit / Filter POS Items
            </p>
          </div>
          <Button onClick={handleAddItem} disabled={createLoading || updateLoading}>
            {createLoading ? "Adding..." : "Add Items"}
          </Button>
        </div>

        {/* Error */}
        {(error || createError || updateError) && (
          <div className="text-red-600 border border-red-300 rounded p-3 bg-red-50">
            {error || createError || updateError}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Items</h2>

          <Table className="min-w-full text-sm">
            <TableHeader>
              {/* Header labels row */}
              <TableRow>
                <TableHead className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Item Type
                </TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Base Category
                </TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Code
                </TableHead>
                <TableHead className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Item Name
                </TableHead>
                <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  OnPOS
                </TableHead>
                <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  KOT
                </TableHead>
                <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  BOT
                </TableHead>
                <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  AI Ent.
                </TableHead>
                <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Trading
                </TableHead>
                <TableHead className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  AskQty
                </TableHead>
                <TableHead className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </TableHead>
              </TableRow>

              {/* Filter row */}
              <TableRow className="border-t border-gray-200">
                <TableHead className="px-3 py-2">
                  <input
                    value={fItemType}
                    onChange={(e) => setFItemType(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>
                <TableHead className="px-3 py-2">
                  <input
                    value={fBaseCat}
                    onChange={(e) => setFBaseCat(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>
                <TableHead className="px-3 py-2">
                  <input
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>
                <TableHead className="px-3 py-2">
                  <input
                    value={fCode}
                    onChange={(e) => setFCode(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>
                <TableHead className="px-3 py-2">
                  <input
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>

                {/* Bool filters */}
                <TableHead className="px-3 py-2 text-center">
                  <select
                    value={fOnPOS}
                    onChange={(e) => setFOnPOS(e.target.value as BoolFilter)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="checked">Checked</option>
                    <option value="unchecked">Unchecked</option>
                  </select>
                </TableHead>
                <TableHead className="px-3 py-2 text-center">
                  <select
                    value={fKOT}
                    onChange={(e) => setFKOT(e.target.value as BoolFilter)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="checked">Checked</option>
                    <option value="unchecked">Unchecked</option>
                  </select>
                </TableHead>
                <TableHead className="px-3 py-2 text-center">
                  <select
                    value={fBOT}
                    onChange={(e) => setFBOT(e.target.value as BoolFilter)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="checked">Checked</option>
                    <option value="unchecked">Unchecked</option>
                  </select>
                </TableHead>
                <TableHead className="px-3 py-2 text-center">
                  <select
                    value={fAIEnt}
                    onChange={(e) => setFAIEnt(e.target.value as BoolFilter)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="checked">Checked</option>
                    <option value="unchecked">Unchecked</option>
                  </select>
                </TableHead>
                <TableHead className="px-3 py-2 text-center">
                  <select
                    value={fTrading}
                    onChange={(e) =>
                      setFTrading(e.target.value as BoolFilter)
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="checked">Checked</option>
                    <option value="unchecked">Unchecked</option>
                  </select>
                </TableHead>
                <TableHead className="px-3 py-2 text-center">
                  <select
                    value={fAskQty}
                    onChange={(e) => setFAskQty(e.target.value as BoolFilter)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="checked">Checked</option>
                    <option value="unchecked">Unchecked</option>
                  </select>
                </TableHead>

                <TableHead className="px-3 py-2" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {(loading || createLoading || updateLoading) ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-6 text-center">
                    Loading items…
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-6 text-center">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((item) => (
                  <TableRow key={item.itemID} className="hover:bg-gray-50">
                    <TableCell className="px-3 py-2">
                      {item.itemTypeID}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {item.baseItemCatID}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {item.categoryID}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {item.itemNumber}
                    </TableCell>
                    <TableCell className="px-3 py-2">
                      {item.description}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      {item.showOnPOS ? "Yes" : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      {item.isKOT ? "Yes" : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      {item.isBOT ? "Yes" : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      {item.isAIEntitled ? "Yes" : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      {item.isTrading ? "Yes" : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      {item.askQtyOnSale ? "Yes" : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(item)} // ⬅️ opens edit drawer
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {filtered.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
            <div className="hidden sm:block" />
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="px-3 py-1 rounded bg-black text-white text-sm">
                  {pageIndex} / {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!canNext}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-600">
                  Rows per page:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="px-2 py-1 text-sm border rounded bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* POS Add Drawer */}
        <PosAddItemListDrawer
          isOpen={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          selectedItem={null}
          onSave={handleSaveNew}
        />

        {/* POS Edit Drawer */}
        <PosEditItemListDrawer
          isOpen={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          selectedItem={selectedItem}
          onSave={handleSaveEdit}
        />
      </div>
    </DashboardLayout>
  );
}
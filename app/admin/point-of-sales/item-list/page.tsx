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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

import PosAddItemListDrawer from "@/components/drawers/pos-addItemList-drawer";

type BoolFilter = "all" | "checked" | "unchecked";

export default function ItemListPage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector((s: RootState) => selectItemMasItems(s));
  const loading = useSelector((s: RootState) => selectItemMasLoading(s));
  const error = useSelector((s: RootState) => selectItemMasError(s));

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

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
    setDrawerOpen(true);
  };

  // Open drawer in "edit" mode
  const handleEdit = (item: ItemMas) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleSaveFromDrawer = (values: Partial<ItemMas>) => {
    console.log("Save from drawer:", values);
    // TODO: create/update APIs + refresh
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
          <Button onClick={handleAddItem}>Add Items</Button>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 border border-red-300 rounded p-3 bg-red-50">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Items</h2>

          <Table className="min-w-full text-sm">
            <TableHeader>
              {/* Header labels row (like GuestProfiles) */}
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

              {/* Filter inputs row (matching GuestProfiles style) */}
              <TableRow className="border-t border-gray-200">
                {/* Item Type */}
                <TableHead className="px-3 py-2">
                  <input
                    value={fItemType}
                    onChange={(e) => setFItemType(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>

                {/* Base Category */}
                <TableHead className="px-3 py-2">
                  <input
                    value={fBaseCat}
                    onChange={(e) => setFBaseCat(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>

                {/* Category */}
                <TableHead className="px-3 py-2">
                  <input
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>

                {/* Code */}
                <TableHead className="px-3 py-2">
                  <input
                    value={fCode}
                    onChange={(e) => setFCode(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>

                {/* Item Name */}
                <TableHead className="px-3 py-2">
                  <input
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                </TableHead>

                {/* OnPOS filter dropdown */}
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

                {/* KOT */}
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

                {/* BOT */}
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

                {/* AI Ent. */}
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

                {/* Trading */}
                <TableHead className="px-3 py-2 text-center">
                  <select
                    value={fTrading}
                    onChange={(e) => setFTrading(e.target.value as BoolFilter)}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="checked">Checked</option>
                    <option value="unchecked">Unchecked</option>
                  </select>
                </TableHead>

                {/* AskQty */}
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

                {/* Action (no filter) */}
                <TableHead className="px-3 py-2" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
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
                        onClick={() => handleEdit(item)}
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

        {/* POS Add / Edit Drawer */}
        <PosAddItemListDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          selectedItem={selectedItem}
          onSave={handleSaveFromDrawer}
        />
      </div>
    </DashboardLayout>
  );
}

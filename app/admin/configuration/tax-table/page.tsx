"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";

import {
  fetchTaxTable,
  selectTaxTableLoading,
  selectTaxTableError,
  selectTaxTableData,
  type TaxTable,
} from "@/redux/slices/fetchTaxTableSlice";

// create
import {
  createTaxTable,
  selectCreateTaxTableLoading,
  selectCreateTaxTableError,
} from "@/redux/slices/createTaxTableSlice";

// update
import {
  updateTaxTable,
  selectUpdateTaxTableLoading,
  selectUpdateTaxTableError,
} from "@/redux/slices/updateTaxTableSlice";

import { AddTaxTableDrawer } from "../../../../components/drawers/add-tax-table-drawer";
import { UpdateTaxTableDrawer } from "../../../../components/drawers/update-tax-table-drawer";

export default function TaxTablePage() {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectTaxTableLoading);
  const error = useSelector(selectTaxTableError);
  const data = useSelector(selectTaxTableData);

  // create state
  const creating = useSelector(selectCreateTaxTableLoading);
  const createError = useSelector(selectCreateTaxTableError);

  // update state
  const updating = useSelector(selectUpdateTaxTableLoading);
  const updateError = useSelector(selectUpdateTaxTableError);

  // drawer states
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [currentTax, setCurrentTax] = useState<TaxTable | null>(null);

  // search + pagination
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const hotelCode = localStorage.getItem("hotelCode");
    if (hotelCode) dispatch(fetchTaxTable(hotelCode));
  }, [dispatch]);

  const filtered: TaxTable[] = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row: TaxTable) => {
      const idMatch = String(row.recordID).toLowerCase().includes(q);
      const hotelMatch = (row.hotelCode ?? "").toLowerCase().includes(q);
      const fromMatch = (row.dateFrom ?? "").toLowerCase().includes(q);
      const toMatch = (row.dateTo ?? "").toLowerCase().includes(q);
      return idMatch || hotelMatch || fromMatch || toMatch;
    });
  }, [data, query]);

  useEffect(() => {
    setPageIndex(1);
  }, [query, pageSize]);

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

  // Drawer handlers
  const openAddDrawer = () => {
    setAddDrawerOpen(true);
  };

  const openUpdateDrawer = (tax: TaxTable) => {
    setCurrentTax(tax);
    setUpdateDrawerOpen(true);
  };

  const handleAddDrawerClose = () => {
    setAddDrawerOpen(false);
  };

  const handleUpdateDrawerClose = () => {
    setUpdateDrawerOpen(false);
    setCurrentTax(null);
  };

  const handleTaxTableCreated = () => {
    setAddDrawerOpen(false);
    const hotelCode = localStorage.getItem("hotelCode");
    if (hotelCode) dispatch(fetchTaxTable(hotelCode));
  };

  const handleTaxTableUpdated = () => {
    setUpdateDrawerOpen(false);
    setCurrentTax(null);
    const hotelCode = localStorage.getItem("hotelCode");
    if (hotelCode) dispatch(fetchTaxTable(hotelCode));
  };

  const fmtPct = (n?: number) => (typeof n === "number" ? `${n}%` : "—");
  const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString() : "—");
  const fmtDT = (s?: string) => (s ? new Date(s).toLocaleString() : "—");
  const start = (pageIndex - 1) * pageSize;

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Tax Table</h1>
            <p className="text-sm text-gray-500 -mt-1">Manage your Taxes & Calculation</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search by ID, hotel, or dates..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button onClick={openAddDrawer}>Add Tax Entry</Button>
          </div>
        </div>

        {/* Error / Empty */}
        {(error || createError || updateError) && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error || createError || updateError}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground border rounded-md p-4">
            No tax rows found.
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">#</TableHead>
                <TableHead className="whitespace-nowrap">Service Charge</TableHead>
                <TableHead className="whitespace-nowrap">TDL</TableHead>
                <TableHead className="whitespace-nowrap">VAT</TableHead>
                <TableHead className="whitespace-nowrap">Date From</TableHead>
                <TableHead className="whitespace-nowrap">Date To</TableHead>
                <TableHead className="whitespace-nowrap">Created On</TableHead>
                <TableHead className="whitespace-nowrap">Created By</TableHead>
                <TableHead className="w-[90px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-6 text-center">
                    Loading tax data…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, i) => (
                  <TableRow key={row.recordID} className="hover:bg-muted/50">
                    <TableCell className="text-center font-medium">
                      {start + i + 1}
                    </TableCell>
                    <TableCell>{fmtPct(row.sc)}</TableCell>
                    <TableCell>{fmtPct(row.cityTax)}</TableCell>
                    <TableCell>{fmtPct(row.vat)}</TableCell>
                    <TableCell>{fmtDate(row.dateFrom)}</TableCell>
                    <TableCell>{fmtDate(row.dateTo)}</TableCell>
                    <TableCell>{fmtDT(row.createdOn)}</TableCell>
                    <TableCell>{row.createdBy || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpdateDrawer(row)}
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

        {/* Pagination */}
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

        {/* Add Tax Table Drawer */}
        <AddTaxTableDrawer
          isOpen={addDrawerOpen}
          onClose={handleAddDrawerClose}
          onTaxTableCreated={handleTaxTableCreated}
        />

        {/* Update Tax Table Drawer */}
        <UpdateTaxTableDrawer
          isOpen={updateDrawerOpen}
          onClose={handleUpdateDrawerClose}
          tax={currentTax}
          onTaxTableUpdated={handleTaxTableUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
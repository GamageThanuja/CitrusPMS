"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function TaxTablePage() {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectTaxTableLoading);
  const error = useSelector(selectTaxTableError);
  const data = useSelector(selectTaxTableData);

  // create form
  const creating = useSelector(selectCreateTaxTableLoading);
  const createError = useSelector(selectCreateTaxTableError);
  const [form, setForm] = useState({
    sc: "",
    tdl: "",
    vat: "",
    dateFrom: "",
    dateTo: "",
  });
  const onFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };
  const canSave =
    form.sc.trim() &&
    form.tdl.trim() &&
    form.vat.trim() &&
    form.dateFrom.trim() &&
    form.dateTo.trim() &&
    !creating;

  const handleSave = async () => {
    const hotelCode = localStorage.getItem("hotelCode") ?? "";
    if (!hotelCode) return console.error("Missing hotelCode in localStorage");

    const now = new Date().toISOString();
    const payload: TaxTable = {
      recordID: 0,
      vat: Number(form.vat) || 0,
      nbt: 0,
      sc: Number(form.sc) || 0,
      cityTax: Number(form.tdl) || 0,
      hotelCode,
      poS_SC: 0,
      poS_VAT: 0,
      poS_NBT: 0,
      poS_CityTax: 0,
      isNBTInclude: false,
      greenTax: 0,
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      calcMethod: 0,
      createdOn: now,
      createdBy: "System",
    };

    try {
      await dispatch(createTaxTable(payload)).unwrap();
      await dispatch(fetchTaxTable(hotelCode));
      setForm({ sc: "", tdl: "", vat: "", dateFrom: "", dateTo: "" });
    } catch (e) {
      console.error("Failed to create tax row:", e);
    }
  };

  // ------- UPDATE (dialog) -------
  const updating = useSelector(selectUpdateTaxTableLoading);
  const updateError = useSelector(selectUpdateTaxTableError);
  const editRef = useRef<HTMLDialogElement | null>(null);

  const [editing, setEditing] = useState<TaxTable | null>(null);
  const [editValues, setEditValues] = useState<{
    sc: string;
    tdl: string;
    vat: string;
    dateFrom: string;
    dateTo: string;
  }>({ sc: "", tdl: "", vat: "", dateFrom: "", dateTo: "" });

  const openEdit = (row: TaxTable) => {
    setEditing(row);
    setEditValues({
      sc: String(row.sc ?? ""),
      tdl: String(row.cityTax ?? ""),
      vat: String(row.vat ?? ""),
      dateFrom: row.dateFrom?.slice(0, 10) ?? "",
      dateTo: row.dateTo?.slice(0, 10) ?? "",
    });
    editRef.current?.showModal();
  };
  const closeEdit = () => {
    editRef.current?.close();
    setEditing(null);
  };
  const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((p) => ({ ...p, [name]: value }));
  };
  const canUpdate =
    !!editing &&
    editValues.sc.trim() &&
    editValues.tdl.trim() &&
    editValues.vat.trim() &&
    editValues.dateFrom.trim() &&
    editValues.dateTo.trim() &&
    !updating;

  const handleUpdate = async () => {
    if (!editing) return;
    const hotelCode = editing.hotelCode || localStorage.getItem("hotelCode") || "";
    if (!hotelCode) return console.error("Missing hotelCode for update");

    const payload: TaxTable = {
      ...editing,
      sc: Number(editValues.sc) || 0,
      cityTax: Number(editValues.tdl) || 0,
      vat: Number(editValues.vat) || 0,
      dateFrom: editValues.dateFrom,
      dateTo: editValues.dateTo,
      // keep these as existing values
      createdOn: editing.createdOn,
      createdBy: editing.createdBy,
    };

    try {
      await dispatch(updateTaxTable(payload)).unwrap();
      await dispatch(fetchTaxTable(hotelCode));
      closeEdit();
    } catch (e) {
      console.error("Failed to update tax row:", e);
    }
  };

  // ------- search + pagination -------
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

  const fmtPct = (n?: number) => (typeof n === "number" ? `${n}%` : "—");
  const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString() : "—");
  const fmtDT = (s?: string) => (s ? new Date(s).toLocaleString() : "—");
  const start = (pageIndex - 1) * pageSize;

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header (Search) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Tax Table</h1>
            <p className="text-sm text-gray-500 -mt-1">Manage your Taxes & Calculation</p>
          </div>
        </div>

        {/* Create Form */}
        <div className="rounded-xl border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Service Charge</label>
              <Input name="sc" inputMode="decimal" value={form.sc} onChange={onFormChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">TDL</label>
              <Input name="tdl" inputMode="decimal" value={form.tdl} onChange={onFormChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">VAT</label>
              <Input name="vat" inputMode="decimal" value={form.vat} onChange={onFormChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Date from</label>
              <Input type="date" name="dateFrom" value={form.dateFrom} onChange={onFormChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Date to</label>
              <Input type="date" name="dateTo" value={form.dateTo} onChange={onFormChange} />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={!canSave}>
              {creating ? "Saving…" : "Save"}
            </Button>
          </div>
          {createError && <div className="mt-2 text-xs text-red-600">{createError}</div>}
        </div>

        {/* Error / Empty */}
        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
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
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, i) => (
                  <TableRow key={row.recordID}>
                    <TableCell className="text-center">{start + i + 1}</TableCell>
                    <TableCell>{fmtPct(row.sc)}</TableCell>
                    <TableCell>{fmtPct(row.cityTax)}</TableCell>
                    <TableCell>{fmtPct(row.vat)}</TableCell>
                    <TableCell>{fmtDate(row.dateFrom)}</TableCell>
                    <TableCell>{fmtDate(row.dateTo)}</TableCell>
                    <TableCell>{fmtDT(row.createdOn)}</TableCell>
                    <TableCell>{row.createdBy || "—"}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit dialog (centered) */}
        <dialog
          ref={editRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Edit Tax Row</h2>
              {updateError && <p className="mt-1 text-xs text-red-600">{updateError}</p>}
            </div>

            <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Service Charge</label>
                <input
                  name="sc"
                  inputMode="decimal"
                  value={editValues.sc}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">TDL</label>
                <input
                  name="tdl"
                  inputMode="decimal"
                  value={editValues.tdl}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">VAT</label>
                <input
                  name="vat"
                  inputMode="decimal"
                  value={editValues.vat}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Date From</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={editValues.dateFrom}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Date To</label>
                <input
                  type="date"
                  name="dateTo"
                  value={editValues.dateTo}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                onClick={closeEdit}
                className="px-3 py-1.5 text-sm border rounded"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-60"
                disabled={!canUpdate}
              >
                {updating ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </dialog>

        {/* Pagination */}
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
      </div>
    </DashboardLayout>
  );
}
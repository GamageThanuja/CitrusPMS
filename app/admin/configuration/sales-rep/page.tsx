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
  fetchSalesExecutiveMas,
  selectSalesExecutiveLoading,
  selectSalesExecutiveError,
  selectSalesExecutiveData,
  type SalesExecutive,
} from "@/redux/slices/fetchSalesExecutiveMasSlice";

import {
  createSalesExecutiveMas,
  selectCreateSalesExecutiveLoading,
  selectCreateSalesExecutiveError,
} from "@/redux/slices/createSalesExecutiveMasSlice";

// ⬇️ NEW: update imports
import {
  updateSalesExecutiveMas,
  selectUpdateSalesExecutiveLoading,
  selectUpdateSalesExecutiveError,
} from "@/redux/slices/updateSalesExecutiveMasSlice";

export default function SalesRepPage() {
  const dispatch = useDispatch<AppDispatch>();

  // fetch list state
  const loading = useSelector(selectSalesExecutiveLoading);
  const error = useSelector(selectSalesExecutiveError);
  const data = useSelector(selectSalesExecutiveData);

  // create state
  const creating = useSelector(selectCreateSalesExecutiveLoading);
  const createError = useSelector(selectCreateSalesExecutiveError);

  // ⬇️ NEW: update state (for dialog save spinner / error)
  const updating = useSelector(selectUpdateSalesExecutiveLoading);
  const updateError = useSelector(selectUpdateSalesExecutiveError);

  // creation form (like the image)
  const [form, setForm] = useState({
    executiveCode: "",
    name: "",
    joinedDate: "",
    phone: "",
    email: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const canSave =
    form.executiveCode.trim() &&
    form.name.trim() &&
    form.joinedDate.trim() &&
    !creating;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await dispatch(
        createSalesExecutiveMas({
          executiveCode: form.executiveCode.trim(),
          name: form.name.trim(),
          joinedDate: form.joinedDate, // YYYY-MM-DD
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          finAct: true,
        })
      ).unwrap();

      // refresh and clear form
      await dispatch(fetchSalesExecutiveMas(undefined));
      setForm({ executiveCode: "", name: "", joinedDate: "", phone: "", email: "" });
    } catch (e) {
      console.error("Create rep failed:", e);
    }
  };

  // client search + pagination
  const [q, setQ] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(fetchSalesExecutiveMas(undefined));
  }, [dispatch]);

  const filtered: SalesExecutive[] = useMemo(() => {
    if (!q.trim()) return data;
    const s = q.toLowerCase();
    return data.filter((r: SalesExecutive) =>
      [r.executiveCode, r.name, r.phone, r.email, String(r.exceutiveID)]
        .filter(Boolean)
        .some((v) => v!.toString().toLowerCase().includes(s))
    );
  }, [data, q]);

  useEffect(() => setPageIndex(1), [q, pageSize, data.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;
  const start = (pageIndex - 1) * pageSize;
  const page = useMemo(() => filtered.slice(start, start + pageSize), [filtered, start, pageSize]);

  const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString() : "—");

  // ⬇️ NEW: Edit dialog state
  const editDialogRef = useRef<HTMLDialogElement | null>(null);
  const [editing, setEditing] = useState<SalesExecutive | null>(null);
  const [editValues, setEditValues] = useState<{
    executiveCode: string;
    name: string;
    joinedDate: string;
    phone: string;
    email: string;
  }>({ executiveCode: "", name: "", joinedDate: "", phone: "", email: "" });

  const openEdit = (row: SalesExecutive) => {
    setEditing(row);
    setEditValues({
      executiveCode: row.executiveCode,
      name: row.name ?? "",
      joinedDate: (row.joinedDate ?? "").split("T")[0] || "",
      phone: row.phone ?? "",
      email: row.email ?? "",
    });
    editDialogRef.current?.showModal();
  };

  const closeEdit = () => {
    editDialogRef.current?.close();
    setEditing(null);
  };

  const onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((p) => ({ ...p, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const execCode = editing.executiveCode;
    const payload: Partial<SalesExecutive> = {
      // Only send fields you allow to change
      name: editValues.name.trim(),
      joinedDate: editValues.joinedDate, // YYYY-MM-DD
      phone: editValues.phone.trim() || undefined,
      email: editValues.email.trim() || undefined,
      // keep code immutable via path param
    };
    try {
      await dispatch(updateSalesExecutiveMas({ executiveCode: execCode, payload })).unwrap();
      await dispatch(fetchSalesExecutiveMas(undefined)); // refresh table
      closeEdit();
    } catch (e) {
      // keep dialog open for corrections
      console.error("Update failed:", e);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Title + subtitle */}
        <div>
          <h1 className="text-xl font-semibold text-black">Sales Reps</h1>
          <p className="text-sm text-gray-500 -mt-1">Create &amp; Manage Sales Representatives</p>
        </div>

        {/* Create form card */}
        <div className="rounded-xl border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Rep Code</label>
              <Input name="executiveCode" value={form.executiveCode} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Rep Name</label>
              <Input name="name" value={form.name} onChange={onChange} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Date of Joined</label>
              <Input type="date" name="joinedDate" value={form.joinedDate} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Phone</label>
              <Input name="phone" inputMode="tel" value={form.phone} onChange={onChange} />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-sm text-gray-600">Email</label>
              <Input name="email" type="email" value={form.email} onChange={onChange} />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleSave} disabled={!canSave} className="w-48 bg-black hover:bg-gray-800">
              {creating ? "Saving…" : "Save"}
            </Button>
          </div>

          {createError && <div className="mt-2 text-xs text-red-600">{createError}</div>}
        </div>

        {/* Quick search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search name / code / phone / email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-96"
          />
        </div>

        {/* Errors */}
        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Executive Code</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                page.map((r, i) => (
                  <TableRow key={r.exceutiveID}>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline mr-3"
                        onClick={() => openEdit(r)}
                        aria-label={`Edit ${r.executiveCode}`}
                      >
                        Edit
                      </button>
                    </TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="font-mono">{r.executiveCode}</TableCell>
                    <TableCell>{fmtDate(r.joinedDate)}</TableCell>
                    <TableCell>{r.phone || "—"}</TableCell>
                    <TableCell>{r.email || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ⬇️ NEW: Edit dialog (centered) */}
        <dialog
          ref={editDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Edit Sales Rep</h2>
              <p className="text-xs text-gray-500">Code: {editing?.executiveCode}</p>
            </div>

            <div className="px-4 py-4 grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600" htmlFor="edit_name">Name</label>
                <input
                  id="edit_name"
                  name="name"
                  value={editValues.name}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600" htmlFor="edit_joinedDate">Joined Date</label>
                <input
                  id="edit_joinedDate"
                  name="joinedDate"
                  type="date"
                  value={editValues.joinedDate}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600" htmlFor="edit_phone">Phone</label>
                <input
                  id="edit_phone"
                  name="phone"
                  value={editValues.phone}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-600" htmlFor="edit_email">Email</label>
                <input
                  id="edit_email"
                  name="email"
                  type="email"
                  value={editValues.email}
                  onChange={onEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>

              {updateError && <div className="text-xs text-red-600">{updateError}</div>}
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
                disabled={updating || !editValues.name.trim() || !editValues.joinedDate.trim()}
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
                onClick={() => canPrev && setPageIndex((p) => p - 1)}
                disabled={!canPrev}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={() => canNext && setPageIndex((p) => p + 1)}
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
                onChange={(e) => {
                  setPageSize(Number(e.target.value) || 10);
                  setPageIndex(1);
                }}
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
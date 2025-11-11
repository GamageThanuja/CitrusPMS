"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, EllipsisVertical } from "lucide-react"; // << NEW

import {
  fetchReservationSource,
  selectReservationSourceLoading,
  selectReservationSourceError,
  selectReservationSourceData,
  type ReservationSource,
} from "@/redux/slices/fetchReservationSourceSlice";

import {
  createReservationSource,
  selectCreateReservationSourceLoading,
  selectCreateReservationSourceError,
  resetCreateReservationSourceState,
} from "@/redux/slices/createReservationSourceSlice";

// << NEW imports
import {
  updateReservationSource,
  selectUpdateReservationSourceLoading,
  selectUpdateReservationSourceError,
  resetUpdateReservationSourceState,
} from "@/redux/slices/updateReservationSourceSlice";

export default function ReservationSourcePage() {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectReservationSourceLoading);
  const error = useSelector(selectReservationSourceError);
  const data = useSelector(selectReservationSourceData);

  // create dialog state
  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const creating = useSelector(selectCreateReservationSourceLoading);
  const createError = useSelector(selectCreateReservationSourceError);

  const [createValues, setCreateValues] = useState<{ reservationSource: string }>({ reservationSource: "" });

  const openCreate = () => {
    dispatch(resetCreateReservationSourceState());
    setCreateValues({ reservationSource: "" });
    createDialogRef.current?.showModal();
  };

  const closeCreate = () => {
    createDialogRef.current?.close();
    dispatch(resetCreateReservationSourceState());
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateValues((p) => ({ ...p, [name]: value }));
  };

  const handleSaveCreate = async () => {
    const value = createValues.reservationSource.trim();
    if (!value) return;
    try {
      await dispatch(createReservationSource({ reservationSource: value })).unwrap();
      await dispatch(fetchReservationSource()); // refresh list
      closeCreate();
    } catch (e) {
      console.error("Create reservation source failed:", e);
    }
  };

  // << NEW: edit dialog state
  const editDialogRef = useRef<HTMLDialogElement | null>(null);
  const updating = useSelector(selectUpdateReservationSourceLoading);
  const updateError = useSelector(selectUpdateReservationSourceError);

  const [editValues, setEditValues] = useState<{ id: number; reservationSource: string }>({
    id: 0,
    reservationSource: "",
  });

  const openEdit = (row: ReservationSource) => {
    dispatch(resetUpdateReservationSourceState());
    setEditValues({ id: row.reservationSourceID, reservationSource: row.reservationSource ?? "" });
    editDialogRef.current?.showModal();
  };

  const closeEdit = () => {
    editDialogRef.current?.close();
    dispatch(resetUpdateReservationSourceState());
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((p) => ({ ...p, [name]: name === "id" ? Number(value) : value }));
  };

  const handleSaveEdit = async () => {
    const value = editValues.reservationSource.trim();
    if (!value) return;
    try {
      await dispatch(updateReservationSource({ id: editValues.id, reservationSource: value })).unwrap();
      await dispatch(fetchReservationSource()); // refresh list
      closeEdit();
    } catch (e) {
      console.error("Update reservation source failed:", e);
    }
  };

  // search + pagination state
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(fetchReservationSource());
  }, [dispatch]);

  const filtered: ReservationSource[] = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (r: ReservationSource) =>
        String(r.reservationSourceID).toLowerCase().includes(q) ||
        r.reservationSource?.toLowerCase().includes(q)
    );
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

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Reservation Sources</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by ID or Source…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button type="button" onClick={openCreate}>Add Source</Button>
          </div>
        </div>

        {/* Error / Empty */}
        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground border rounded-md p-4">
            No reservation sources found.
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Source ID</TableHead>
                <TableHead>Reservation Source</TableHead>
                <TableHead className="w-[80px] text-right">Action</TableHead> {/* << NEW */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center">Loading…</TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => (
                  <TableRow key={row.reservationSourceID}>
                    <TableCell className="font-medium">{row.reservationSourceID}</TableCell>
                    <TableCell>{row.reservationSource}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center justify-center rounded p-2 hover:bg-gray-100 focus:outline-none focus:ring"
                        aria-label={`Edit reservation source ${row.reservationSourceID}`}
                        title="More actions"
                      >
                        <EllipsisVertical className="h-5 w-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create Reservation Source dialog */}
        <dialog
          ref={createDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Add Reservation Source</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <label htmlFor="reservationSource" className="text-sm text-gray-600">Source Name</label>
                <input
                  id="reservationSource"
                  name="reservationSource"
                  value={createValues.reservationSource}
                  onChange={handleCreateChange}
                  placeholder="e.g., Website, Walk-in, OTA"
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                  autoFocus
                />
              </div>
              {createError && <div className="text-xs text-red-600">{createError}</div>}
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button type="button" onClick={closeCreate} className="px-3 py-1.5 text-sm border rounded" disabled={creating}>Cancel</button>
              <button
                type="button"
                onClick={handleSaveCreate}
                className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-60"
                disabled={creating || !createValues.reservationSource.trim()}
              >
                {creating ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </dialog>

        {/* Edit Reservation Source dialog */}
        <dialog
          ref={editDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Edit Reservation Source</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="edit-id" className="text-sm text-gray-600">Source ID</label>
                  <input
                    id="edit-id"
                    name="id"
                    type="number"
                    value={editValues.id}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded text-sm bg-gray-100"
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-reservationSource" className="text-sm text-gray-600">Source Name</label>
                <input
                  id="edit-reservationSource"
                  name="reservationSource"
                  value={editValues.reservationSource}
                  onChange={handleEditChange}
                  placeholder="e.g., Website, Walk-in, OTA"
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                  autoFocus
                />
              </div>

              {updateError && <div className="text-xs text-red-600">{updateError}</div>}
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button type="button" onClick={closeEdit} className="px-3 py-1.5 text-sm border rounded" disabled={updating}>Cancel</button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-60"
                disabled={updating || !editValues.reservationSource.trim()}
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
              <button onClick={handlePrev} disabled={!canPrev} className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {pageIndex} / {totalPages}
              </span>
              <button onClick={handleNext} disabled={!canNext} className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-600">Rows per page:</label>
              <select id="pageSize" value={pageSize} onChange={handlePageSizeChange} className="px-2 py-1 text-sm border rounded bg-white">
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
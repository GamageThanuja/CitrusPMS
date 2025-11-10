"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EllipsisVertical } from "lucide-react";
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
  fetchVenueMas,
  selectVenueMasLoading,
  selectVenueMasError,
  selectVenueMasData,
  type VenueMas,
} from "@/redux/slices/fetchVenueMasSlice";

// ✅ NEW: import create thunk + selectors
import {
  createVenueMas,
  selectCreateVenueMasLoading,
  selectCreateVenueMasError,
} from "@/redux/slices/createVenueMasSlice";
import {
  updateVenueMas,
  selectUpdateVenueMasLoading,
  selectUpdateVenueMasError,
} from "@/redux/slices/updateVenueMasSlice";

export default function VenuesPage() {
  const dispatch = useDispatch<AppDispatch>();

  const loading = useSelector(selectVenueMasLoading);
  const error = useSelector(selectVenueMasError);
  const data = useSelector(selectVenueMasData);

  const creating = useSelector(selectCreateVenueMasLoading);
  const createError = useSelector(selectCreateVenueMasError);
  const updating = useSelector(selectUpdateVenueMasLoading);
  const updateError = useSelector(selectUpdateVenueMasError);

  // edit dialog state
  const editDialogRef = useRef<HTMLDialogElement | null>(null);
  const [editing, setEditing] = useState<VenueMas | null>(null);
  const [editValues, setEditValues] = useState<{
    venueID: number;
    venue: string;
    hotelCode: string;
  }>({
    venueID: 0,
    venue: "",
    hotelCode: "",
  });

  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const [createValues, setCreateValues] = useState<{ venue: string }>({
    venue: "",
  });

  const openCreate = () => {
    setCreateValues({ venue: "" });
    createDialogRef.current?.showModal();
  };

  const closeCreate = () => {
    createDialogRef.current?.close();
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateValues((p) => ({ ...p, [name]: value }));
  };

  const handleSaveCreate = async () => {
    const hotelCode = localStorage.getItem("hotelCode") ?? "";
    if (!hotelCode) {
      console.error("Missing hotelCode in localStorage");
      return;
    }
    const payload: VenueMas = {
      venueID: 0, // backend will assign
      venue: createValues.venue.trim(),
      hotelCode,
    };
    if (!payload.venue) return;

    try {
      await dispatch(createVenueMas(payload)).unwrap();
      await dispatch(fetchVenueMas(hotelCode)); // refresh list
      closeCreate();
    } catch (e) {
      // keep dialog open so user can fix input
      console.error("Create venue failed:", e);
    }
  };

  // ✅ fetch by hotelCode from localStorage
  useEffect(() => {
    const hotelCode = localStorage.getItem("hotelCode");
    if (hotelCode) {
      dispatch(fetchVenueMas(hotelCode));
    } else {
      console.error("Missing hotelCode in localStorage");
    }
  }, [dispatch]);

  const openEdit = (row: VenueMas) => {
    setEditing(row);
    setEditValues({
      venueID: row.venueID,
      venue: row.venue ?? "",
      hotelCode: row.hotelCode ?? "",
    });
    editDialogRef.current?.showModal();
  };

  const closeEdit = () => {
    editDialogRef.current?.close();
    setEditing(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((p) => ({ ...p, [name]: value }));
  };

  const handleSaveEdit = async () => {
    const hotelCode =
      editValues.hotelCode || localStorage.getItem("hotelCode") || "";
    if (!hotelCode) {
      console.error("Missing hotelCode for update");
      return;
    }
    try {
      await dispatch(
        updateVenueMas({
          hotelCode,
          venueData: {
            venueID: editValues.venueID,
            venue: editValues.venue.trim(),
            hotelCode, // keep consistent
          },
        })
      ).unwrap();

      await dispatch(fetchVenueMas(hotelCode)); // refresh list
      closeEdit();
    } catch (e) {
      // keep dialog open for correction
      console.error("Update venue failed:", e);
    }
  };

  // 🔍 filter logic
  const filtered: VenueMas[] = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (v: VenueMas) =>
        String(v.venueID).toLowerCase().includes(q) ||
        v.venue?.toLowerCase().includes(q) ||
        v.hotelCode?.toLowerCase().includes(q)
    );
  }, [data, query]);

  // pagination
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
          <h1 className="text-xl font-semibold">Venues</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, ID, or hotel code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            {/* <Button
              type="button"
              onClick={() => {
                const hotelCode = localStorage.getItem("hotelCode");
                if (hotelCode) dispatch(fetchVenueMas(hotelCode));
              }}
              disabled={loading}
            >
              {loading ? "Loading…" : "Reload"}
            </Button> */}

            {/* ✅ NEW: Add Venue */}
            <Button type="button" onClick={openCreate}>
              Add Venue
            </Button>
          </div>
        </div>

        {/* Error / Empty / Table */}
        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground border rounded-md p-4">
            No venues found.
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Venue ID</TableHead>
                <TableHead>Venue Name</TableHead>
                <TableHead className="w-[80px] text-right">
                  Action
                </TableHead>{" "}
                {/* NEW */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center">
                    Loading venues…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((v) => (
                  <TableRow key={v.venueID}>
                    <TableCell className="font-medium">{v.venueID}</TableCell>
                    <TableCell>{v.venue}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(v)}
                        className="inline-flex items-center justify-center rounded hover:bg-gray-100 focus:outline-none focus:ring"
                        aria-label={`Edit venue ${v.venueID}`}
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

        {/* ✅ NEW: Create Venue dialog */}
        <dialog
          ref={createDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Add Venue</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <label htmlFor="venue" className="text-sm text-gray-600">
                  Venue Name
                </label>
                <input
                  id="venue"
                  name="venue"
                  value={createValues.venue}
                  onChange={handleCreateChange}
                  placeholder="e.g., Ballroom A"
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                  autoFocus
                />
              </div>
              {createError && (
                <div className="text-xs text-red-600">{createError}</div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                onClick={closeCreate}
                className="px-3 py-1.5 text-sm border rounded"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCreate}
                className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-60"
                disabled={creating || !createValues.venue.trim()}
              >
                {creating ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </dialog>

        {/* Edit Venue dialog */}
        <dialog
          ref={editDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Edit Venue</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              </div>
                <label htmlFor="edit-venue" className="text-sm text-gray-600">
                  Venue Name
                </label>
                <input
                  id="edit-venue"
                  name="venue"
                  value={editValues.venue}
                  onChange={handleEditChange}
                  placeholder="e.g., Ballroom A"
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                  autoFocus
                />
              </div>

              {updateError && (
                <div className="text-xs text-red-600">{updateError}</div>
              )}
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
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-60"
                disabled={updating || !editValues.venue.trim()}
              >
                {updating ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </dialog>

        {/* Pagination Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="hidden sm:block" />
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrev}
                disabled={!canPrev}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={!canNext}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
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

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
import { ChevronLeft, ChevronRight, EllipsisVertical } from "lucide-react";

import {
  fetchEventTypeMas,
  selectEventTypeMasLoading,
  selectEventTypeMasError,
  selectEventTypeMasData,
  type EventTypeMas,
} from "@/redux/slices/fetchEventTypeMasSlice";
import {
  updateEventTypeMas,
  selectUpdateEventTypeMasLoading,
  selectUpdateEventTypeMasError,
  selectUpdateEventTypeMasSuccess,
  resetUpdateEventTypeMasState,
} from "@/redux/slices/updateEventTypeMasSlice";
import {
  createEventTypeMas,
  selectCreateEventTypeMasLoading,
  selectCreateEventTypeMasError,
  resetCreateEventTypeMasState,
} from "@/redux/slices/createEventTypeMasSlice";

export default function EventTypes() {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectEventTypeMasLoading);
  const error = useSelector(selectEventTypeMasError);
  const data = useSelector(selectEventTypeMasData);

  const updating = useSelector(selectUpdateEventTypeMasLoading);
  const updateError = useSelector(selectUpdateEventTypeMasError);
  const updateSuccess = useSelector(selectUpdateEventTypeMasSuccess);

  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const creating = useSelector(selectCreateEventTypeMasLoading);
  const createError = useSelector(selectCreateEventTypeMasError);

  const [query, setQuery] = useState("");
  const [createValues, setCreateValues] = useState<{ eventType: string }>({
    eventType: "",
  });

  // edit dialog state
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [editing, setEditing] = useState<EventTypeMas | null>(null);
  const [editValues, setEditValues] = useState<{
    eventTypeID: number;
    eventType: string;
  }>({
    eventTypeID: 0,
    eventType: "",
  });

  const openEdit = (row: EventTypeMas) => {
    setEditing(row);
    setEditValues({
      eventTypeID: row.eventTypeID,
      eventType: row.eventType ?? "",
    });
    dialogRef.current?.showModal();
  };

  const closeEdit = () => {
    dialogRef.current?.close();
    setEditing(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditValues((p) => ({
      ...p,
      [name]: name === "eventTypeID" ? Number(value) : value,
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await dispatch(
        updateEventTypeMas({
          eventTypeID: editValues.eventTypeID,
          eventType: editValues.eventType?.trim() || "",
        })
      ).unwrap();

      // refresh table data
      await dispatch(fetchEventTypeMas());

      closeEdit();
      // optional: reset the update slice after a brief moment or immediately
      dispatch(resetUpdateEventTypeMasState());
    } catch (e) {
      // keep dialog open so user can correct; you can also surface the error below
      console.error("Update failed:", e);
    }
  };

  const openCreate = () => {
    dispatch(resetCreateEventTypeMasState());
    setCreateValues({ eventType: "" });
    createDialogRef.current?.showModal();
  };

  const closeCreate = () => {
    createDialogRef.current?.close();
    dispatch(resetCreateEventTypeMasState());
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCreateValues((p) => ({ ...p, [name]: value }));
  };

  const handleSaveCreate = async () => {
    try {
      await dispatch(
        createEventTypeMas({
          eventType: createValues.eventType.trim(),
        })
      ).unwrap();

      await dispatch(fetchEventTypeMas());
      closeCreate();
    } catch (e) {
      // keep dialog open so user can fix the value
      console.error("Create failed:", e);
    }
  };

  // pagination state
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    dispatch(fetchEventTypeMas());
  }, [dispatch]);

  const filtered: EventTypeMas[] = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (d) =>
        String(d.eventTypeID).toLowerCase().includes(q) ||
        d.eventType?.toLowerCase().includes(q)
    );
  }, [data, query]);

  // reset to first page when search or page size changes
  useEffect(() => {
    setPageIndex(1);
  }, [query, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const handlePrev = () => {
    if (canPrev) setPageIndex((p) => Math.max(1, p - 1));
  };
  const handleNext = () => {
    if (canNext) setPageIndex((p) => Math.min(totalPages, p + 1));
  };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value) || 10;
    setPageSize(newSize);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Event Types</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by ID or Type…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            {/* <Button
              type="button"
              onClick={() => dispatch(fetchEventTypeMas())}
              disabled={loading}
            >
              {loading ? "Loading…" : "Reload"}
            </Button> */}
            <Button
              type="button"
              variant="default"
              onClick={openCreate}
              disabled={loading}
            >
              Add Event Type
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
            No event types found.
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Event Type ID</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead className="w-[80px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => (
                  <TableRow key={row.eventTypeID}>
                    <TableCell className="font-medium">
                      {row.eventTypeID}
                    </TableCell>
                    <TableCell>{row.eventType}</TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center justify-center rounded p-2 hover:bg-gray-100 focus:outline-none focus:ring"
                        aria-label={`Edit event type ${row.eventTypeID}`}
                        title="More actions"
                      >
                        <EllipsisVertical className="h-5 w-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && paginated.length === 0 && filtered.length > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center">
                    No rows on this page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit dialog (native & accessible) */}
        <dialog
          ref={dialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Edit Event Type</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <label htmlFor="eventTypeID" className="text-sm text-gray-600">
                  Event Type ID
                </label>
                <input
                  id="eventTypeID"
                  name="eventTypeID"
                  type="number"
                  value={editValues.eventTypeID}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="eventType" className="text-sm text-gray-600">
                  Event Type
                </label>
                <input
                  id="eventType"
                  name="eventType"
                  value={editValues.eventType}
                  onChange={handleEditChange}
                  placeholder="e.g., Conference"
                  className="w-full px-3 py-2 border rounded text-sm bg-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
              {updateError && (
                <span className="mr-auto text-xs text-red-600">
                  {updateError}
                </span>
              )}
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
                disabled={updating || !editValues.eventType.trim()}
              >
                {updating ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </dialog>

        {/* Create dialog (native & accessible) */}
        <dialog
          ref={createDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2 open:m-0"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Add Event Type</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="create-eventType"
                  className="text-sm text-gray-600"
                >
                  Event Type
                </label>
                <input
                  id="create-eventType"
                  name="eventType"
                  value={createValues.eventType}
                  onChange={handleCreateChange}
                  placeholder="e.g., Conference"
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
                disabled={creating || !createValues.eventType.trim()}
              >
                {creating ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </dialog>

        {/* Pagination controls */}
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

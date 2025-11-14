"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";

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

import {
  updateReservationSource,
  selectUpdateReservationSourceLoading,
  selectUpdateReservationSourceError,
  resetUpdateReservationSourceState,
} from "@/redux/slices/updateReservationSourceSlice";

import { AddReservationSourceDrawer } from "../../../../components/drawers/add-reservation-source-drawer";
import { UpdateReservationSourceDrawer } from "../../../../components/drawers/update-reservation-source-drawer";

export default function ReservationSourcePage() {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectReservationSourceLoading);
  const error = useSelector(selectReservationSourceError);
  const data = useSelector(selectReservationSourceData);

  // create state
  const creating = useSelector(selectCreateReservationSourceLoading);
  const createError = useSelector(selectCreateReservationSourceError);

  // update state
  const updating = useSelector(selectUpdateReservationSourceLoading);
  const updateError = useSelector(selectUpdateReservationSourceError);

  // drawer states
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState<ReservationSource | null>(null);

  // search + pagination state
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
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

  // Drawer handlers
  const openAddDrawer = () => {
    dispatch(resetCreateReservationSourceState());
    setAddDrawerOpen(true);
  };

  const openUpdateDrawer = (source: ReservationSource) => {
    dispatch(resetUpdateReservationSourceState());
    setCurrentSource(source);
    setUpdateDrawerOpen(true);
  };

  const handleAddDrawerClose = () => {
    setAddDrawerOpen(false);
    dispatch(resetCreateReservationSourceState());
  };

  const handleUpdateDrawerClose = () => {
    setUpdateDrawerOpen(false);
    setCurrentSource(null);
    dispatch(resetUpdateReservationSourceState());
  };

  const handleReservationSourceCreated = () => {
    setAddDrawerOpen(false);
    dispatch(fetchReservationSource());
  };

  const handleReservationSourceUpdated = () => {
    setUpdateDrawerOpen(false);
    setCurrentSource(null);
    dispatch(fetchReservationSource());
  };

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
            <Button onClick={openAddDrawer}>Add Source</Button>
          </div>
        </div>

        {/* Error Display */}
        {(error || createError || updateError) && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error || createError || updateError}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground border rounded-md p-4 text-center">
            No reservation sources found.
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead className="w-[160px]">Source ID</TableHead>
                <TableHead>Reservation Source</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center">
                    Loading reservation sources…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, idx) => (
                  <TableRow key={row.reservationSourceID} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {(pageIndex - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{row.reservationSourceID}</TableCell>
                    <TableCell>{row.reservationSource}</TableCell>
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

        {/* Add Reservation Source Drawer */}
        <AddReservationSourceDrawer
          isOpen={addDrawerOpen}
          onClose={handleAddDrawerClose}
          onReservationSourceCreated={handleReservationSourceCreated}
        />

        {/* Update Reservation Source Drawer */}
        <UpdateReservationSourceDrawer
          isOpen={updateDrawerOpen}
          onClose={handleUpdateDrawerClose}
          source={currentSource}
          onReservationSourceUpdated={handleReservationSourceUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
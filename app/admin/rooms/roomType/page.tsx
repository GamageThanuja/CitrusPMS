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
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  fetchRoomTypeMas,
  selectRoomTypeMas,
  selectRoomTypeMasLoading,
  selectRoomTypeMasError,
  type RoomTypeMasItem,
} from "@/redux/slices/roomTypeMasSlice";

export default function RoomTypePage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector(selectRoomTypeMas);
  const loading = useSelector(selectRoomTypeMasLoading);
  const error = useSelector(selectRoomTypeMasError);

  // search + pagination
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  // fetch on mount
  useEffect(() => {
    dispatch(fetchRoomTypeMas());
  }, [dispatch]);

  // filter
  const filtered: RoomTypeMasItem[] = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((r) => {
      return (
        String(r.roomTypeID).toLowerCase().includes(q) ||
        (r.roomType ?? "").toLowerCase().includes(q) ||
        (r.shortCode ?? "").toLowerCase().includes(q) ||
        (r.bedType ?? "").toLowerCase().includes(q) ||
        (r.hotelCode ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query]);

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

  const fmtDateTime = (s?: string | null) =>
    s ? new Date(s).toLocaleString() : "—";

  const start = (pageIndex - 1) * pageSize;

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Room Types</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by ID, name, bed type, hotel code…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-80"
            />
            {/* <Button
              type="button"
              onClick={() => dispatch(fetchRoomTypeMas())}
              disabled={loading}
            >
              {loading ? "Loading…" : "Reload"}
            </Button> */}
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
            No room types found.
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Room Type ID</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead className="whitespace-nowrap">Short Code</TableHead>
                <TableHead className="whitespace-nowrap">Std Occ.</TableHead>
                <TableHead className="whitespace-nowrap">Max Occ.</TableHead>
                <TableHead className="whitespace-nowrap">Max Adult</TableHead>
                <TableHead className="whitespace-nowrap">Max Child</TableHead>
                <TableHead>Bed Type</TableHead>
                <TableHead className="whitespace-nowrap">Virtual?</TableHead>
                <TableHead className="whitespace-nowrap">No. of Rooms</TableHead>
                <TableHead className="whitespace-nowrap">Created On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-6 text-center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((r, i) => (
                  <TableRow key={r.roomTypeID}>
                    <TableCell>{r.roomTypeID}</TableCell>
                    <TableCell>{r.roomType}</TableCell>
                    <TableCell>{r.shortCode ?? "—"}</TableCell>
                    <TableCell>{r.stOccupancy ?? "—"}</TableCell>
                    <TableCell>{r.maxOccupancy ?? "—"}</TableCell>
                    <TableCell>{r.maxAdult ?? "—"}</TableCell>
                    <TableCell>{r.maxChild ?? "—"}</TableCell>
                    <TableCell>{r.bedType ?? "—"}</TableCell>
                    <TableCell>{r.isVirtualRoom ? "Yes" : "No"}</TableCell>
                    <TableCell>{r.noOfRooms ?? "—"}</TableCell>
                    <TableCell>{fmtDateTime(r.createdOn)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
                onChange={(e) => setPageSize(Number(e.target.value) || 10)}
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
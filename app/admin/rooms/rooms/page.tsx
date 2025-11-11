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
  fetchRoomMas,
  selectRoomMas,
  selectRoomMasLoading,
  selectRoomMasError,
  type RoomMasItem,
} from "@/redux/slices/roomMasSlice";

export default function RoomsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector(selectRoomMas);
  const loading = useSelector(selectRoomMasLoading);
  const error = useSelector(selectRoomMasError);

  // server-side filters (go to API as query params)
  const [roomNumberFilter, setRoomNumberFilter] = useState("");
  const [roomTypeIdFilter, setRoomTypeIdFilter] = useState<string>("");
  const [roomIdFilter, setRoomIdFilter] = useState<string>("");

  // client-side fuzzy search
  const [q, setQ] = useState("");

  // pagination (client-side)
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  // fetch on mount
  useEffect(() => {
    dispatch(fetchRoomMas());
  }, [dispatch]);

  const runServerSearch = () => {
    const payload: {
      roomTypeId?: number;
      roomId?: number;
      roomNumber?: string;
    } = {};
    if (roomNumberFilter.trim()) payload.roomNumber = roomNumberFilter.trim();
    if (roomTypeIdFilter.trim()) payload.roomTypeId = Number(roomTypeIdFilter) || undefined;
    if (roomIdFilter.trim()) payload.roomId = Number(roomIdFilter) || undefined;

    dispatch(fetchRoomMas(Object.keys(payload).length ? payload : undefined));
  };

  // client-side search
  const filtered: RoomMasItem[] = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((r) => {
      return (
        String(r.roomID).toLowerCase().includes(s) ||
        (r.roomNumber ?? "").toLowerCase().includes(s) ||
        String(r.roomTypeID ?? "").toLowerCase().includes(s) ||
        (r.bedType ?? "").toLowerCase().includes(s) ||
        (r.hotelCode ?? "").toLowerCase().includes(s) ||
        (r.statusColour ?? "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  // pagination mechanics
  useEffect(() => {
    setPageIndex(1);
  }, [q, pageSize, items.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const handlePrev = () => canPrev && setPageIndex((p) => p - 1);
  const handleNext = () => canNext && setPageIndex((p) => p + 1);
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value) || 10);
    setPageIndex(1);
  };

  const start = (pageIndex - 1) * pageSize;
  const paginated = useMemo(() => {
    const from = (pageIndex - 1) * pageSize;
    return filtered.slice(from, from + pageSize);
  }, [filtered, pageIndex, pageSize]);

  const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Rooms</h1>
            <p className="text-sm text-gray-500 -mt-1">
              Search and browse rooms
            </p>
          </div>
                <div className="flex items-center gap-2">
          <Input
            placeholder="Quick search (ID / number / type / bed / hotel)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-96"
          />
          {/* <Button onClick={() => dispatch(fetchRoomMas())} disabled={loading}>
            {loading ? "Loading…" : "Reload"}
          </Button> */}
        </div>
        </div>

        {/*quick search */}
  

        {/* Error / Empty */}
        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground border rounded-md p-4">
            No rooms found.
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">#</TableHead>
                <TableHead className="whitespace-nowrap">Room ID</TableHead>
                <TableHead className="whitespace-nowrap">Room Number</TableHead>
                <TableHead className="whitespace-nowrap">Room Type ID</TableHead>
                <TableHead className="whitespace-nowrap">Room Status ID</TableHead>
                <TableHead className="whitespace-nowrap">HK Status ID</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Bed Type</TableHead>
                <TableHead className="whitespace-nowrap">Created On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-6 text-center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((r, i) => (
                  <TableRow key={r.roomID}>
                    <TableCell className="text-center">{start + i + 1}</TableCell>
                    <TableCell>{r.roomID}</TableCell>
                    <TableCell>{r.roomNumber}</TableCell>
                    <TableCell>{r.roomTypeID}</TableCell>
                    <TableCell>{r.roomStatusID}</TableCell>
                    <TableCell>{r.houseKeepingStatusID}</TableCell>
                    <TableCell>{r.blockID ?? "—"}</TableCell>
                    <TableCell>{r.floorID ?? "—"}</TableCell>
                    <TableCell>{r.bedType ?? "—"}</TableCell>
                    <TableCell>{fmtDT(r.createdOn)}</TableCell>
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
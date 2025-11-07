"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  fetchAuditMasByHotelCode,
  selectAuditMasByHotelCodeItems,
  selectAuditMasByHotelCodeLoading,
  selectAuditMasByHotelCodeError,
  AuditMasItem,
} from "@/redux/slices/fetchAuditMasByHotelCodeSlice";
import { useSelector } from "react-redux";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AuditPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const items = useSelector((s: RootState) => selectAuditMasByHotelCodeItems(s));
  const loading = useSelector((s: RootState) => selectAuditMasByHotelCodeLoading(s));
  const error = useSelector((s: RootState) => selectAuditMasByHotelCodeError(s));

  // Calculate total pages based on items length and pageSize
  const totalPages = useMemo(() => {
    // If we have fewer items than pageSize, we're likely on the last page
    if (items.length < pageSize && pageIndex > 1) {
      return pageIndex;
    }
    // If we have exactly pageSize items, there might be more pages
    return items.length === pageSize ? pageIndex + 1 : pageIndex;
  }, [items.length, pageSize, pageIndex]);

  useEffect(() => {
    const hotelCode = localStorage.getItem("hotelCode") || "";
    if (hotelCode) {
      dispatch(fetchAuditMasByHotelCode({ 
        hotelCode, 
        pageNumber: pageIndex, 
        pageSize 
      }));
    }
  }, [dispatch, pageIndex, pageSize]);

  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && items.length === pageSize; // if fewer than pageSize, assume last page
  
  const handlePrev = () => {
    if (canPrev) {
      const newPage = Math.max(1, pageIndex - 1);
      setPageIndex(newPage);
    }
  };
  
  const handleNext = () => {
    if (canNext) {
      const newPage = pageIndex + 1;
      setPageIndex(newPage);
    }
  };
  
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value) || 50;
    setPageSize(newSize);
    setPageIndex(1); // reset to first page on size change
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-2">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Audit ID</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Module</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Audit</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Done By</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Ref No</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Hotel Code</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Reservation ID</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Tran Date</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 ">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && !loading ? (
                  <tr>
                    <td
                      className="px-3 py-3 text-gray-500"
                      colSpan={9}
                    >
                      No results for this page.
                    </td>
                  </tr>
                ) : (
                  items.map((row: AuditMasItem, idx: number) => (
                    <tr
                      key={`${row.auditID}-${idx}`}
                      className={idx % 2 ? "bg-white" : "bg-gray-50/50"}
                    >
                      <td className="px-3 py-2">{row.auditID}</td>
                      <td className="px-3 py-2">{row.module || "—"}</td>
                      <td className="px-3 py-2">{row.audit || "—"}</td>
                      <td className="px-3 py-2">{row.doneBy || "—"}</td>
                      <td className="px-3 py-2">{row.refNo || "—"}</td>
                      <td className="px-3 py-2">{row.hotelCode || "—"}</td>
                      <td className="px-3 py-2">{row.reservationID ?? "—"}</td>
                      <td className="px-3 py-2">{row.tranDate || "—"}</td>
                      <td className="px-3 py-2">{row.timeStamp || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination centered, Rows per page right */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          {/* Left spacer on desktop (keeps center truly centered) */}
          <div className="hidden sm:block" />

          {/* Center: Pagination */}
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

          {/* Right: Rows per page */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-600">Rows per page:</label>
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
"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
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
  fetchCategoryMas,
  selectCategoryMasItems,
  selectCategoryMasLoading,
  selectCategoryMasError,
  type CategoryMasItem,
} from "@/redux/slices/fetchCategoryMasSlice";

export default function ItemCategoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectCategoryMasLoading);
  const error = useSelector(selectCategoryMasError);
  const items = useSelector(selectCategoryMasItems);

  // search + pagination
  const [q, setQ] = useState("");
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    dispatch(fetchCategoryMas());
  }, [dispatch]);

  const filtered: CategoryMasItem[] = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter((r) =>
      [r.categoryID?.toString(), r.categoryCode, r.categoryName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(s))
    );
  }, [items, q]);

  useEffect(() => setPageIndex(1), [q, pageSize, items.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const start = (pageIndex - 1) * pageSize;
  const page = useMemo(
    () => filtered.slice(start, start + pageSize),
    [filtered, start, pageSize]
  );

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Item Categories</h1>
        </div>

        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">#</TableHead>
                <TableHead className="w-[160px]">Category ID</TableHead>
                <TableHead className="w-[340px]">Category Code</TableHead>
                <TableHead>Category Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : page.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                page.map((r, i) => (
                  <TableRow key={`${r.categoryID}-${r.categoryCode}`}>
                    <TableCell className="text-blue-600">
                      <button
                        type="button"
                        className="hover:underline"
                        onClick={() => console.log("Edit", r.categoryID)}
                      >
                        Edit
                      </button>
                    </TableCell>
                    <TableCell className="font-mono">{r.categoryID}</TableCell>
                    <TableCell className="font-mono">{r.categoryCode}</TableCell>
                    <TableCell>{r.categoryName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="hidden sm:block" />
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => canPrev && setPageIndex((p) => p - 1)}
                disabled={!canPrev}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={() => canNext && setPageIndex((p) => p + 1)}
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
                onChange={(e) => {
                  const v = Number(e.target.value) || 15;
                  setPageSize(v);
                  setPageIndex(1);
                }}
                className="px-2 py-1 text-sm border rounded bg-white"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
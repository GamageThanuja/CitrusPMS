"use client";

import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  fetchCategoryMas,
  selectCategoryMasItems,
  selectCategoryMasLoading,
  selectCategoryMasError,
} from "@/redux/slices/fetchCategoryMasSlice";
import { ChevronLeft, ChevronRight, CirclePlus } from "lucide-react";
import AddCategoryMasdrawer from "@/components/drawers/add-categoryMas-drawer";


export default function CategoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((s: RootState) => selectCategoryMasItems(s));
  const loading = useSelector((s: RootState) => selectCategoryMasLoading(s));
  const error = useSelector((s: RootState) => selectCategoryMasError(s));

  // pagination state (client-side)
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [drawerOpen, setDrawerOpen] = useState(false);

  // search & filters
  const [searchName, setSearchName] = useState("");
  const [filterID, setFilterID] = useState("");
  const [filterCode, setFilterCode] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  useEffect(() => {
    dispatch(fetchCategoryMas());
  }, [dispatch]);

  // reset to first page when filters/search change
  useEffect(() => {
    setPageIndex(1);
  }, [searchName, filterID, filterCode, filterDepartment, pageSize]);

  // derived
  const filtered = useMemo(() => {
    const name = searchName.trim().toLowerCase();
    const id = filterID.trim();
    const code = filterCode.trim().toLowerCase();
    const dept = filterDepartment.trim();

    return items.filter((c) => {
      // Name search (case-insensitive contains)
      if (name && !(c.categoryName || "").toLowerCase().includes(name)) return false;
      // ID filter (substring match on stringified ID)
      if (id && !String(c.categoryID ?? "").includes(id)) return false;
      // Code filter (case-insensitive contains)
      if (code && !String(c.categoryCode ?? "").toLowerCase().includes(code)) return false;
      // Department filter (substring match on stringified departmentID)
      if (dept && !String(c.departmentID ?? "").includes(dept)) return false;
      return true;
    });
  }, [items, searchName, filterID, filterCode, filterDepartment]);

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
    setPageIndex(1); // reset to first page on size change
  };

  const paginated = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, pageIndex, pageSize]);

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Categories</h1>
          <div
            onClick={() => setDrawerOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setDrawerOpen(true);
            }}
            className="rounded-full p-3 group hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
            aria-label="Add Basis"
          >
            <CirclePlus
              size={25}
              className="group-hover:text-black transition-colors duration-150"
            />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Search by Name</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="e.g., BREAKFAST"
              className="px-3 py-2 border rounded text-sm bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Filter by ID</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterID}
              onChange={(e) => setFilterID(e.target.value)}
              placeholder="e.g., 12"
              className="px-3 py-2 border rounded text-sm bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Filter by Code</label>
            <input
              type="text"
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              placeholder="e.g., BRK"
              className="px-3 py-2 border rounded text-sm bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Filter by Department</label>
            <input
              type="text"
              inputMode="numeric"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              placeholder="e.g., 1"
              className="px-3 py-2 border rounded text-sm bg-white"
            />
          </div>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading categories…</div>}

        {error && (
          <div className="text-sm text-red-600">Failed to load: {error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-normal text-gray-700">ID</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-700">Code</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-700">Department</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-700">Active</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-700">Colour</th>
                    <th className="px-3 py-2 text-left font-normal text-gray-700">Created On</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-gray-500" colSpan={7}>
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((c) => (
                      <tr key={c.categoryID} className="border-b last:border-0">
                        <td className="px-3 py-2">{c.categoryID}</td>
                        <td className="px-3 py-2 font-mono break-all">{c.categoryCode}</td>
                        <td className="px-3 py-2">{c.categoryName}</td>
                        <td className="px-3 py-2">{c.departmentID ?? "—"}</td>
                        <td className="px-3 py-2">
                          {c.finAct === true ? "Yes" : c.finAct === false ? "No" : "—"}
                        </td>
                        <td className="px-3 py-2">{c.colourCode ?? "—"}</td>
                        <td className="px-3 py-2">
                          {c.createdOn ? new Date(c.createdOn).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pager centered, rows-per-page right */}
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
          </>
        )}
      </div>

      <AddCategoryMasdrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {
          // Refresh the category list after successful creation
          dispatch(fetchCategoryMas());
        }}
      />
    </DashboardLayout>
  );
}
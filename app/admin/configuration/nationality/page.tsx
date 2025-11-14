"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useAppSelector } from "@/redux/hooks";

import {
  fetchNationalityMas,
  selectNationalityMasItems,
  selectNationalityMasLoading,
  selectNationalityMasError,
} from "@/redux/slices/fetchNationalityMasSlice";

import {
  createNationalityMas,
  selectCreateNationalityMasLoading,
  selectCreateNationalityMasError,
} from "@/redux/slices/createNationalityMasSlice";

import {
  updateNationalityMas,
  selectUpdateNationalityMasLoading,
  selectUpdateNationalityMasError,
} from "@/redux/slices/updateNationalityMasSlice";

import { AddNationalityDrawer } from "../../../../components/drawers/add-nationality-drawer";
import { UpdateNationalityDrawer } from "../../../../components/drawers/update-nationality-drawer";

interface NationalityUI {
  nationalityID: number;
  nationality: string;
  countryCode: string;
  country: string;
}

export default function NationalityPage() {
  const dispatch = useDispatch<any>();

  const items = useAppSelector(selectNationalityMasItems);
  const loading = useAppSelector(selectNationalityMasLoading);
  const error = useAppSelector(selectNationalityMasError);

  const creating = useAppSelector(selectCreateNationalityMasLoading);
  const createError = useAppSelector(selectCreateNationalityMasError);

  const updating = useAppSelector(selectUpdateNationalityMasLoading);
  const updateError = useAppSelector(selectUpdateNationalityMasError);

  const [filtered, setFiltered] = useState<NationalityUI[]>([]);
  const [query, setQuery] = useState("");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [currentNationality, setCurrentNationality] = useState<NationalityUI | null>(null);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchNationalityMas());
  }, [dispatch]);

  // Filter list
  useEffect(() => {
    const q = query.toLowerCase().trim();
    const filteredItems = items.filter(
      (n) =>
        (n.nationality ?? "").toLowerCase().includes(q) ||
        (n.country ?? "").toLowerCase().includes(q) ||
        (n.countryCode ?? "").toLowerCase().includes(q)
    );
    setFiltered(filteredItems);
  }, [items, query]);

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(1);
  }, [query, pageSize]);

  // Pagination logic
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

  const openAddDrawer = () => {
    setAddDrawerOpen(true);
  };

  const openUpdateDrawer = (nat: NationalityUI) => {
    setCurrentNationality(nat);
    setUpdateDrawerOpen(true);
  };

  const handleAddDrawerClose = () => {
    setAddDrawerOpen(false);
  };

  const handleUpdateDrawerClose = () => {
    setUpdateDrawerOpen(false);
    setCurrentNationality(null);
  };

  const handleNationalityCreated = () => {
    setAddDrawerOpen(false);
    dispatch(fetchNationalityMas());
    toast.success("Nationality created successfully");
  };

  const handleNationalityUpdated = () => {
    setUpdateDrawerOpen(false);
    setCurrentNationality(null);
    dispatch(fetchNationalityMas());
    toast.success("Nationality updated successfully");
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Nationalities</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by nationality, country, or code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button
              variant="outline"
              onClick={() => dispatch(fetchNationalityMas())}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={openAddDrawer}>Add Nationality</Button>
          </div>
        </div>

        {/* Errors */}
        {(error || createError || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || createError || updateError}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="w-[120px]">Country Code</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    Loading nationalities…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((nat, idx) => (
                  <TableRow key={nat.nationalityID} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {(pageIndex - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>{nat.nationality}</TableCell>
                    <TableCell>{nat.country}</TableCell>
                    <TableCell>{nat.countryCode}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openUpdateDrawer(nat)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No nationalities found.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filtered.length > 0 && (
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
        )}

        {/* Add Nationality Drawer */}
        <AddNationalityDrawer
          isOpen={addDrawerOpen}
          onClose={handleAddDrawerClose}
          onNationalityCreated={handleNationalityCreated}
        />

        {/* Update Nationality Drawer */}
        <UpdateNationalityDrawer
          isOpen={updateDrawerOpen}
          onClose={handleUpdateDrawerClose}
          nationality={currentNationality}
          onNationalityUpdated={handleNationalityUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
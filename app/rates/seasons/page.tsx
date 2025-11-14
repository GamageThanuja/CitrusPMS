"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import {
  fetchSeasonMas,
  selectSeasonMasData,
  selectSeasonMasLoading,
  selectSeasonMasError,
} from "@/redux/slices/fetchSeasonMasSlice";
import {
  createSeasonMas,
  selectCreateSeasonMasLoading,
  selectCreateSeasonMasError,
} from "@/redux/slices/createSeasonMasSlice";
import {
  updateSeasonMas,
  selectUpdateSeasonMasLoading,
  selectUpdateSeasonMasError,
} from "@/redux/slices/updateSeasonMasSlice";

import { useAppSelector } from "@/redux/hooks";
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
import { AddSeasonDrawer } from "../../../components/drawers/add-season-drawer";
import { UpdateSeasonDrawer } from "../../../components/drawers/update-season-drawer";

// ---- Type ----
interface SeasonUI {
  id: number;
  name: string;
}

export default function SeasonPage() {
  const dispatch = useDispatch<any>();

  const seasons = useAppSelector(selectSeasonMasData);
  const loading = useAppSelector(selectSeasonMasLoading);
  const error = useAppSelector(selectSeasonMasError);

  const creating = useAppSelector(selectCreateSeasonMasLoading);
  const createError = useAppSelector(selectCreateSeasonMasError);

  const updating = useAppSelector(selectUpdateSeasonMasLoading);
  const updateError = useAppSelector(selectUpdateSeasonMasError);

  const [filtered, setFiltered] = useState<SeasonUI[]>([]);
  const [query, setQuery] = useState("");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [updateDrawerOpen, setUpdateDrawerOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<SeasonUI | null>(null);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch seasons on mount
  useEffect(() => {
    dispatch(fetchSeasonMas());
  }, [dispatch]);

  // Filter & map seasons
  useEffect(() => {
    const mapped: SeasonUI[] = seasons.map((s) => ({ id: s.seasonID, name: s.season }));
    const q = query.trim().toLowerCase();
    setFiltered(mapped.filter((s) => s.name.toLowerCase().includes(q)));
  }, [seasons, query]);

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

  const openUpdateDrawer = (season: SeasonUI) => {
    setCurrentSeason(season);
    setUpdateDrawerOpen(true);
  };

  const handleAddDrawerClose = () => {
    setAddDrawerOpen(false);
  };

  const handleUpdateDrawerClose = () => {
    setUpdateDrawerOpen(false);
    setCurrentSeason(null);
  };

  const handleSeasonCreated = () => {
    setAddDrawerOpen(false);
    dispatch(fetchSeasonMas());
    toast.success("Season created successfully");
  };

  const handleSeasonUpdated = () => {
    setUpdateDrawerOpen(false);
    setCurrentSeason(null);
    dispatch(fetchSeasonMas());
    toast.success("Season updated successfully");
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Seasons</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by season name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button
              variant="outline"
              onClick={() => dispatch(fetchSeasonMas())}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={openAddDrawer}>Add Season</Button>
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
                <TableHead>Season Name</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center">
                    Loading seasons…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((season, idx) => (
                  <TableRow key={season.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {(pageIndex - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>{season.name}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openUpdateDrawer(season)}
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
              No seasons found.
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

        {/* Add Season Drawer */}
        <AddSeasonDrawer
          isOpen={addDrawerOpen}
          onClose={handleAddDrawerClose}
          onSeasonCreated={handleSeasonCreated}
        />

        {/* Update Season Drawer */}
        <UpdateSeasonDrawer
          isOpen={updateDrawerOpen}
          onClose={handleUpdateDrawerClose}
          season={currentSeason}
          onSeasonUpdated={handleSeasonUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
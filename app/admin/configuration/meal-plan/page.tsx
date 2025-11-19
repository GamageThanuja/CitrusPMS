"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import AddMealPlanDrawer from "@/components/drawers/add-mealPlan-drawer";
import EditMealPlanDrawer from "@/components/drawers/edit-mealPlan-drawer";

// BasisMas listing
import {
  fetchBasisMas,
  selectBasisMasItems,
  selectBasisMasLoading,
  selectBasisMasError,
  type BasisMasItem,
} from "@/redux/slices/fetchBasisMasSlice";

// Create BasisMas selectors
import {
  selectCreateBasisMasLoading,
  selectCreateBasisMasError,
} from "@/redux/slices/createBasisMasSlice";

// ✅ use updateBasisMas slice instead of updateMealPlanByFolioByDate
import {
  updateBasisMas,
  selectUpdateBasisMasLoading,
  selectUpdateBasisMasSuccess,
  selectUpdateBasisMasError,
} from "@/redux/slices/updateBasisMasSlice";

export default function MealPlanPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BasisMasItem | null>(null);

  // BasisMas selectors
  const loading = useSelector(selectBasisMasLoading);
  const error = useSelector(selectBasisMasError);
  const data = useSelector(selectBasisMasItems);

  // Create BasisMas selectors
  const creating = useSelector(selectCreateBasisMasLoading);
  const createError = useSelector(selectCreateBasisMasError);

  // Update BasisMas selectors
  const updating = useSelector(selectUpdateBasisMasLoading);
  const updateSuccess = useSelector(selectUpdateBasisMasSuccess);
  const updateError = useSelector(selectUpdateBasisMasError);

  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /** ---- INITIAL LOAD (BasisMas) ---- */
  useEffect(() => {
    dispatch(fetchBasisMas(undefined));
  }, [dispatch]);

  /** ---- UPDATE / ERROR HANDLERS ---- */
  useEffect(() => {
    if (updateSuccess) {
      toast.success("Meal plan (basis) updated successfully");
      refreshData();
    }
  }, [updateSuccess]);

  useEffect(() => {
    if (updateError) {
      toast.error(`Update failed: ${updateError}`);
    }
  }, [updateError]);

  useEffect(() => {
    if (createError) {
      toast.error(`Create failed: ${createError}`);
    }
  }, [createError]);

  /** ---- REFRESH (BasisMas) ---- */
  const refreshData = () => {
    dispatch(fetchBasisMas(undefined));
  };

  /** ---- SEARCH + FILTER (BasisMas fields) ---- */
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();

    return data.filter((m) => {
      const basisID = String(m.basisID ?? "").toLowerCase();
      const basis = (m.basis ?? "").toLowerCase();
      const cmRateID = (m.cmRateID ?? "").toLowerCase();
      const descOnIBE = (m.descOnIBE ?? "").toLowerCase();

      return (
        basisID.includes(q) ||
        basis.includes(q) ||
        cmRateID.includes(q) ||
        descOnIBE.includes(q)
      );
    });
  }, [data, query]);

  /** ---- PAGINATION ---- */
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

  /** ---- CREATE (Drawer trigger only) ---- */
  const openCreate = () => setAddDrawerOpen(true);

  const handleCreated = () => {
    refreshData();
  };

  /** ---- EDIT ---- */
  const openEdit = (row: BasisMasItem) => {
    setSelectedRow(row);
    setEditDrawerOpen(true);
  };

  // (optional helper if you want to update from page instead of inside drawer)
  const handleSaveEdit = async (updatedValues: BasisMasItem) => {
    try {
      await dispatch(updateBasisMas(updatedValues)).unwrap();
      setEditDrawerOpen(false);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Meal Plans</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by Basis ID, Basis, CM Rate ID, or Description…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" onClick={refreshData} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={openCreate}>Add Meal Plan</Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 border border-red-300 rounded p-3 bg-red-50">
            {error}
          </div>
        )}

        {/* Table (BasisMas) */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Basis ID</TableHead>
                <TableHead>Basis</TableHead>
                <TableHead className="w-[150px]">CM Rate ID</TableHead>
                <TableHead className="w-[120px]">Show on IBE</TableHead>
                <TableHead>Description (IBE)</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">
                    Loading meal plans…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((m) => (
                  <TableRow key={m.basisID} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{m.basisID}</TableCell>
                    <TableCell>{m.basis}</TableCell>
                    <TableCell>{m.cmRateID}</TableCell>
                    <TableCell>{m.showOnIBE ? "Yes" : "No"}</TableCell>
                    <TableCell>{m.descOnIBE}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(m)}
                        className="h-8 w-8 p-0"
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
              No meal plans found.
            </div>
          )}
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

        {/* Drawers */}
        <AddMealPlanDrawer
          isOpen={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          onCreated={handleCreated}
        />

        <EditMealPlanDrawer
          isOpen={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          row={selectedRow}
          onUpdated={() => {
            refreshData();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
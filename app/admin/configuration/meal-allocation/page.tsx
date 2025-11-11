"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import {
  fetchMealAllocation,
  selectMealAllocationItems,
  selectMealAllocationLoading,
  selectMealAllocationError,
} from "@/redux/slices/fetchMealAllocationSlice";

import {
  createMealAllocation,
  selectCreateMealAllocationLoading,
  selectCreateMealAllocationError,
} from "@/redux/slices/createMealAllocationSlice";

import {
  updateMealAllocation,
  selectUpdateMealAllocationLoading,
  selectUpdateMealAllocationError,
} from "@/redux/slices/updateMealAllocationSlice";

import { useAppSelector } from "@/redux/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface MealUI {
  id: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  currency: string;
  ai: number;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
}

export default function MealAllocationPage() {
  const dispatch = useDispatch<any>();

  const items = useAppSelector(selectMealAllocationItems);
  const loading = useAppSelector(selectMealAllocationLoading);
  const error = useAppSelector(selectMealAllocationError);

  const creating = useAppSelector(selectCreateMealAllocationLoading);
  const createError = useAppSelector(selectCreateMealAllocationError);

  const updating = useAppSelector(selectUpdateMealAllocationLoading);
  const updateError = useAppSelector(selectUpdateMealAllocationError);

  const [filtered, setFiltered] = useState<MealUI[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mealData, setMealData] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
    currency: "",
    ai: "",
    hotelCode: "",
    createdBy: "",
    lastUpdatedBy: "",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [username, setUsername] = useState<string>("");

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /** Load remembered username */
  useEffect(() => {
    const stored = localStorage.getItem("rememberedUsername");
    if (stored) setUsername(stored);
  }, []);

  /** Fetch data */
  useEffect(() => {
    dispatch(fetchMealAllocation());
  }, [dispatch]);

  /** Filter */
  useEffect(() => {
    const q = query.trim().toLowerCase();
    const mapped: MealUI[] = items.map((m) => ({
      id: m.id,
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner,
      currency: m.currency,
      ai: m.ai,
      hotelCode: m.hotelCode,
      createdBy: m.createdBy,
      createdOn: m.createdOn,
      lastUpdatedBy: m.lastUpdatedBy,
      lastUpdatedOn: m.lastUpdatedOn,
    }));
    setFiltered(
      mapped.filter(
        (m) =>
          m.hotelCode.toLowerCase().includes(q) ||
          m.currency.toLowerCase().includes(q) ||
          m.createdBy.toLowerCase().includes(q)
      )
    );
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

  /** Open create dialog */
  const openCreateDialog = () => {
    setMealData({
      breakfast: "",
      lunch: "",
      dinner: "",
      currency: "",
      ai: "",
      hotelCode: "",
      createdBy: username || "",
      lastUpdatedBy: username || "",
    });
    setEditId(null);
    setDialogOpen(true);
  };

  /** Open edit dialog */
  const openEditDialog = (meal: MealUI) => {
    setMealData({
      breakfast: meal.breakfast.toString(),
      lunch: meal.lunch.toString(),
      dinner: meal.dinner.toString(),
      currency: meal.currency,
      ai: meal.ai.toString(),
      hotelCode: meal.hotelCode,
      createdBy: meal.createdBy,
      lastUpdatedBy: username || meal.lastUpdatedBy,
    });
    setEditId(meal.id);
    setDialogOpen(true);
  };

  /** Save handler */
  const handleSave = async () => {
    if (!mealData.hotelCode.trim()) {
      toast.error("Hotel Code is required");
      return;
    }

    const now = new Date().toISOString();

    const payload = {
      id: editId || 0,
      breakfast: Number(mealData.breakfast) || 0,
      lunch: Number(mealData.lunch) || 0,
      dinner: Number(mealData.dinner) || 0,
      currency: mealData.currency,
      ai: Number(mealData.ai) || 0,
      hotelCode: mealData.hotelCode,
      createdBy: mealData.createdBy || username || "system",
      createdOn: now,
      lastUpdatedBy: username || "system",
      lastUpdatedOn: now,
    };

    try {
      if (editId !== null) {
        const action = await dispatch(updateMealAllocation(payload));
        if (updateMealAllocation.rejected.match(action)) {
          toast.error(action.payload || "Failed to update meal allocation");
          return;
        }
        toast.success("Meal allocation updated successfully");
      } else {
        const action = await dispatch(createMealAllocation(payload));
        if (createMealAllocation.rejected.match(action)) {
          toast.error(action.payload || "Failed to create meal allocation");
          return;
        }
        toast.success("Meal allocation created successfully");
      }

      setDialogOpen(false);
      dispatch(fetchMealAllocation());
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleInputChange = (field: keyof typeof mealData, value: string) => {
    setMealData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Meal Allocations</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by hotel, currency, or created by..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button
              variant="outline"
              onClick={() => dispatch(fetchMealAllocation())}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={openCreateDialog}>Add Allocation</Button>
          </div>
        </div>

        {/* Error display */}
        {(error || createError || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || createError || updateError}
          </div>
        )}

        {/* Table - Updated to use common component */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[100px]">Hotel Code</TableHead>
                <TableHead className="w-[90px]">Breakfast</TableHead>
                <TableHead className="w-[80px]">Lunch</TableHead>
                <TableHead className="w-[80px]">Dinner</TableHead>
                <TableHead className="w-[70px]">AI</TableHead>
                <TableHead className="w-[90px]">Currency</TableHead>
                <TableHead className="w-[100px]">Created By</TableHead>
                <TableHead className="w-[140px]">Created On</TableHead>
                <TableHead className="w-[120px]">Last Updated By</TableHead>
                <TableHead className="w-[140px]">Last Updated On</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-6 text-center">
                    Loading meal allocations…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((meal, idx) => (
                  <TableRow key={meal.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {(pageIndex - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>{meal.hotelCode}</TableCell>
                    <TableCell>{meal.breakfast}</TableCell>
                    <TableCell>{meal.lunch}</TableCell>
                    <TableCell>{meal.dinner}</TableCell>
                    <TableCell>{meal.ai}</TableCell>
                    <TableCell>{meal.currency}</TableCell>
                    <TableCell>{meal.createdBy}</TableCell>
                    <TableCell>
                      {meal.createdOn
                        ? new Date(meal.createdOn).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{meal.lastUpdatedBy}</TableCell>
                    <TableCell>
                      {meal.lastUpdatedOn
                        ? new Date(meal.lastUpdatedOn).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(meal)}
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
              No meal allocations found.
            </div>
          )}
        </div>

        {/* Pagination Controls - Consistent with venues */}
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

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editId ? "Edit Meal Allocation" : "Create Meal Allocation"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {["breakfast", "lunch", "dinner", "ai", "currency", "hotelCode"].map(
                (f) => (
                  <div key={f} className="space-y-2">
                    <Label htmlFor={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Label>
                    <Input
                      id={f}
                      type={
                        ["breakfast", "lunch", "dinner", "ai"].includes(f)
                          ? "number"
                          : "text"
                      }
                      placeholder={`Enter ${f}`}
                      value={(mealData as any)[f]}
                      onChange={(e) =>
                        handleInputChange(
                          f as keyof typeof mealData,
                          e.target.value
                        )
                      }
                    />
                  </div>
                )
              )}

              {/* Auto-filled fields */}
              <div className="space-y-2">
                <Label>Created By</Label>
                <Input value={mealData.createdBy} disabled />
              </div>
              <div className="space-y-2">
                <Label>Last Updated By</Label>
                <Input value={mealData.lastUpdatedBy} disabled />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={creating || updating}>
                  {creating || updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editId ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
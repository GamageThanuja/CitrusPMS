"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
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

import {
  fetchMealPlanByFolioByDate,
  selectMealPlanByFolioByDateData,
  selectMealPlanByFolioByDateLoading,
  selectMealPlanByFolioByDateError,
  type MealPlanByFolioByDate,
} from "@/redux/slices/fetchMealPlanByFolioByDateSlice";

import {
  createMealPlanByFolioByDate,
  selectCreateMealPlanByFolioByDateLoading,
  selectCreateMealPlanByFolioByDateError,
} from "@/redux/slices/createMealPlanByFolioByDateSlice";

import {
  updateMealPlanByFolioByDate,
  selectUpdateMealPlanByFolioByDateLoading,
  selectUpdateMealPlanByFolioByDateSuccess,
  selectUpdateMealPlanByFolioByDateError,
} from "@/redux/slices/updateMealPlanByFolioByDateSlice";

export default function MealPlanPage() {
  const dispatch = useDispatch<AppDispatch>();

  const loading = useSelector(selectMealPlanByFolioByDateLoading);
  const error = useSelector(selectMealPlanByFolioByDateError);
  const data = useSelector(selectMealPlanByFolioByDateData);

  const creating = useSelector(selectCreateMealPlanByFolioByDateLoading);
  const createError = useSelector(selectCreateMealPlanByFolioByDateError);
  
  const updating = useSelector(selectUpdateMealPlanByFolioByDateLoading);
  const updateSuccess = useSelector(selectUpdateMealPlanByFolioByDateSuccess);
  const updateError = useSelector(selectUpdateMealPlanByFolioByDateError);

  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const createDialogRef = useRef<HTMLDialogElement | null>(null);
  const editDialogRef = useRef<HTMLDialogElement | null>(null);

  const [createValues, setCreateValues] = useState({
    folioID: 0,
    dt: new Date().toISOString().slice(0, 10),
    mealPlan: "",
    ai: false,
  });

  const [editValues, setEditValues] = useState<MealPlanByFolioByDate | null>(
    null
  );

  // Fetch all meal plans on mount
  useEffect(() => {
    dispatch(fetchMealPlanByFolioByDate({}));
  }, [dispatch]);

  // Handle update success
  useEffect(() => {
    if (updateSuccess) {
      toast.success("Meal plan updated successfully");
      // Refresh data after successful update
      refreshData();
    }
  }, [updateSuccess]);

  // Handle update error
  useEffect(() => {
    if (updateError) {
      toast.error(`Update failed: ${updateError}`);
    }
  }, [updateError]);

  // Handle create error
  useEffect(() => {
    if (createError) {
      toast.error(`Create failed: ${createError}`);
    }
  }, [createError]);

  // Refresh data function
  const refreshData = () => {
    dispatch(fetchMealPlanByFolioByDate({}));
  };

  // Search + filter
  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (m) =>
        String(m.recordID).includes(q) ||
        m.mealPlan.toLowerCase().includes(q) ||
        String(m.folioID).includes(q) ||
        m.dt.toLowerCase().includes(q)
    );
  }, [data, query]);

  // Pagination
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

  /** ---- CREATE ---- */
  const openCreate = () => {
    setCreateValues({
      folioID: 0,
      dt: new Date().toISOString().slice(0, 10),
      mealPlan: "",
      ai: false,
    });
    createDialogRef.current?.showModal();
  };

  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCreateValues((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveCreate = async () => {
    try {
      const payload = {
        recordID: 0,
        folioID: createValues.folioID,
        dt: createValues.dt,
        mealPlan: createValues.mealPlan,
        ai: createValues.ai,
      };
      
      const result = await dispatch(createMealPlanByFolioByDate(payload)).unwrap();
      
      if (result) {
        toast.success("Meal plan created successfully");
        createDialogRef.current?.close();
        refreshData();
      }
    } catch (err) {
      console.error("Create failed:", err);
      // Error is handled by the useEffect above
    }
  };

  /** ---- EDIT ---- */
  const openEdit = (row: MealPlanByFolioByDate) => {
    setEditValues({ ...row });
    editDialogRef.current?.showModal();
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditValues((p) => p && { ...p, [name]: type === "checkbox" ? checked : value });
  };

  const handleSaveEdit = async () => {
    if (!editValues) return;
    
    try {
      // Ensure we're sending the complete object with recordID
      const updatePayload: MealPlanByFolioByDate = {
        recordID: editValues.recordID,
        folioID: editValues.folioID,
        dt: editValues.dt,
        mealPlan: editValues.mealPlan,
        ai: editValues.ai,
      };
      
      await dispatch(updateMealPlanByFolioByDate(updatePayload)).unwrap();
      // The useEffect will handle the success message and data refresh
      editDialogRef.current?.close();
    } catch (err) {
      console.error("Update failed:", err);
      // Error is handled by the useEffect above
    }
  };

  const closeEditDialog = () => {
    editDialogRef.current?.close();
    setEditValues(null);
  };

  const closeCreateDialog = () => {
    createDialogRef.current?.close();
    setCreateValues({
      folioID: 0,
      dt: new Date().toISOString().slice(0, 10),
      mealPlan: "",
      ai: false,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Meal Plans</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search by ID, meal plan, folio, or date…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={openCreate}>Add Meal Plan</Button>
          </div>
        </div>

        {/* Error or Empty */}
        {error && (
          <div className="text-red-600 border border-red-300 rounded p-3 bg-red-50">
            {error}
          </div>
        )}

        {/* Table - Updated to use common component */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Record ID</TableHead>
                <TableHead className="w-[100px]">Folio ID</TableHead>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Meal Plan</TableHead>
                <TableHead className="w-[80px]">AI</TableHead>
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
                  <TableRow key={m.recordID} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{m.recordID}</TableCell>
                    <TableCell>{m.folioID}</TableCell>
                    <TableCell>{m.dt.split("T")[0]}</TableCell>
                    <TableCell>{m.mealPlan}</TableCell>
                    <TableCell>{m.ai ? "Yes" : "No"}</TableCell>
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

        {/* Pagination Controls - Consistent with other pages */}
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

        {/* Create Dialog */}
        <dialog
          ref={createDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Add Meal Plan</h2>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Folio ID *</label>
                <Input
                  name="folioID"
                  type="number"
                  value={createValues.folioID}
                  onChange={handleCreateChange}
                  placeholder="Enter Folio ID"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Date *</label>
                <Input
                  name="dt"
                  type="date"
                  value={createValues.dt}
                  onChange={handleCreateChange}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Meal Plan *</label>
                <Input
                  name="mealPlan"
                  value={createValues.mealPlan}
                  onChange={handleCreateChange}
                  placeholder="e.g., HB, AI, BB"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ai"
                  checked={createValues.ai}
                  onChange={handleCreateChange}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-600">AI (All Inclusive)</span>
              </div>
              {createError && (
                <div className="text-xs text-red-600">{createError}</div>
              )}
            </div>
            <div className="border-t flex justify-end gap-2 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateDialog}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveCreate}
                disabled={creating || !createValues.mealPlan.trim() || !createValues.folioID || !createValues.dt}
              >
                {creating ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </dialog>

        {/* Edit Dialog */}
        <dialog
          ref={editDialogRef}
          className="rounded-lg p-0 backdrop:bg-black/30"
        >
          <form method="dialog" className="w-[92vw] max-w-lg">
            <div className="border-b px-4 py-3">
              <h2 className="text-base font-semibold">Edit Meal Plan</h2>
            </div>
            {editValues && (
              <div className="px-4 py-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Record ID</label>
                  <Input
                    value={editValues.recordID}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Folio ID</label>
                  <Input
                    value={editValues.folioID}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Date</label>
                  <Input
                    value={editValues.dt.split("T")[0]}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Meal Plan *</label>
                  <Input
                    name="mealPlan"
                    value={editValues.mealPlan}
                    onChange={handleEditChange}
                    placeholder="e.g., HB, AI, BB"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="ai"
                    checked={editValues.ai}
                    onChange={handleEditChange}
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-600">AI (All Inclusive)</span>
                </div>
                {updateError && (
                  <div className="text-xs text-red-600">{updateError}</div>
                )}
              </div>
            )}
            <div className="border-t flex justify-end gap-2 px-4 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={updating || !editValues?.mealPlan.trim()}
              >
                {updating ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </dialog>
      </div>
    </DashboardLayout>
  );
}
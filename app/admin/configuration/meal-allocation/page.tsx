"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2 } from "lucide-react";

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
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
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
            <span className="ml-2">Refresh</span>
          </Button>

          <div className="flex gap-2 md:ml-auto">
            <Input
              placeholder="Search by hotel, currency, or created by..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-64"
            />
            <Button onClick={openCreateDialog}>Add Allocation</Button>
          </div>
        </div>

        {/* Error display */}
        {(error || createError || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || createError || updateError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                {[
                  "#",
                  "Hotel Code",
                  "Breakfast",
                  "Lunch",
                  "Dinner",
                  "AI",
                  "Currency",
                  "Created By",
                  "Created On",
                  "Last Updated By",
                  "Last Updated On",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 border-b">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td
                        colSpan={12}
                        className="px-4 py-2 animate-pulse bg-gray-100 dark:bg-zinc-900 h-10"
                      />
                    </tr>
                  ))
                : filtered.map((meal, idx) => (
                    <tr
                      key={meal.id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                      <td className="px-4 py-2 border-b">{idx + 1}</td>
                      <td className="px-4 py-2 border-b">{meal.hotelCode}</td>
                      <td className="px-4 py-2 border-b">{meal.breakfast}</td>
                      <td className="px-4 py-2 border-b">{meal.lunch}</td>
                      <td className="px-4 py-2 border-b">{meal.dinner}</td>
                      <td className="px-4 py-2 border-b">{meal.ai}</td>
                      <td className="px-4 py-2 border-b">{meal.currency}</td>
                      <td className="px-4 py-2 border-b">{meal.createdBy}</td>
                      <td className="px-4 py-2 border-b">
                        {meal.createdOn
                          ? new Date(meal.createdOn).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2 border-b">{meal.lastUpdatedBy}</td>
                      <td className="px-4 py-2 border-b">
                        {meal.lastUpdatedOn
                          ? new Date(meal.lastUpdatedOn).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2 border-b text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(meal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No meal allocations found.
            </div>
          )}
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
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

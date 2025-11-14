// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { AppDispatch } from "@/redux/store";
import type { MealPlanByFolioByDate } from "@/redux/slices/fetchMealPlanByFolioByDateSlice";
import { updateMealPlanByFolioByDate } from "@/redux/slices/updateMealPlanByFolioByDateSlice";

type EditMealPlanDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  row?: MealPlanByFolioByDate | null; // row to edit
  onUpdated?: (updated: MealPlanByFolioByDate) => void; // optional callback to parent
};

export default function EditMealPlanDrawer({
  isOpen,
  onClose,
  row,
  onUpdated,
}: EditMealPlanDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [values, setValues] = useState<MealPlanByFolioByDate | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When drawer opens or row changes, hydrate local state
  useEffect(() => {
    if (isOpen && row) {
      setValues({ ...row });
      setErrorMsg(null);
    }
    if (isOpen && !row) {
      setValues(null);
      setErrorMsg(null);
    }
  }, [isOpen, row]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!values) return;
    const { name, value, type, checked } = e.target;
    setValues((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "checkbox" ? checked : value,
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!values) return;
    if (!values.mealPlan.trim()) {
      setErrorMsg("Meal Plan is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload: MealPlanByFolioByDate = {
        recordID: values.recordID,
        folioID: Number(values.folioID),
        dt: values.dt, // keep original string (e.g. "2025-11-14T00:00:00")
        mealPlan: values.mealPlan,
        ai: values.ai,
      };

      const result = await dispatch(
        updateMealPlanByFolioByDate(payload)
      ).unwrap();

      onUpdated?.(result as MealPlanByFolioByDate);
      onClose();
    } catch (err: any) {
      console.error("Failed to update meal plan:", err);
      setErrorMsg(
        err?.message || "Failed to update meal plan. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const title = "Edit Meal Plan";
  const displayDate =
    values?.dt && values.dt.includes("T")
      ? values.dt.split("T")[0]
      : values?.dt ?? "";

  const isSaveDisabled = saving || !values || !values.mealPlan.trim();

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => (!open ? handleClose() : null)}
      modal={false}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-l-2xl p-0 z-[100]"
      >
        <SheetHeader className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
          </div>
          <Separator className="mt-3" />
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-4rem)] px-5 pb-5 pt-3">
          {!values ? (
            <div className="text-sm text-gray-500">
              No meal plan selected to edit.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Record ID */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Record ID</label>
                <Input
                  value={values.recordID}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Folio ID */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Folio ID</label>
                <Input
                  value={values.folioID}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Date</label>
                <Input
                  value={displayDate}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Meal Plan */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">
                  Meal Plan 
                </label>
                <Input
                  name="mealPlan"
                  value={values.mealPlan}
                  onChange={handleChange}
                  placeholder="e.g., HB, AI, BB"
                />
              </div>

              {/* AI flag */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ai"
                  checked={values.ai}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-600">
                  AI (All Inclusive)
                </span>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-600">{errorMsg}</div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaveDisabled}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
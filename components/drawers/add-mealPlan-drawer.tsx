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

import {
  createMealPlanByFolioByDate,
} from "@/redux/slices/createMealPlanByFolioByDateSlice";
import type { AppDispatch } from "@/redux/store";
import type { MealPlanByFolioByDate } from "@/redux/slices/fetchMealPlanByFolioByDateSlice";

type AddMealPlanDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  initialFolioID?: number;
  onCreated?: (created: MealPlanByFolioByDate) => void; // optional callback to parent
};

export default function AddMealPlanDrawer({
  isOpen,
  onClose,
  initialFolioID,
  onCreated,
}: AddMealPlanDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [values, setValues] = useState({
    folioID: initialFolioID ?? 0,
    dt: new Date().toISOString().slice(0, 10),
    mealPlan: "",
    ai: false,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when opening / initialFolioID changes
  useEffect(() => {
    if (isOpen) {
      setValues({
        folioID: initialFolioID ?? 0,
        dt: new Date().toISOString().slice(0, 10),
        mealPlan: "",
        ai: false,
      });
      setErrorMsg(null);
    }
  }, [isOpen, initialFolioID]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setErrorMsg(null);

    try {
      setSaving(true);

      const payload = {
        recordID: 0,
        folioID: Number(values.folioID),
        dt: values.dt,              // same format you used in page
        mealPlan: values.mealPlan,
        ai: values.ai,
      };

      const created = await dispatch(
        createMealPlanByFolioByDate(payload)
      ).unwrap();

      onCreated?.(created as MealPlanByFolioByDate);
      onClose();
    } catch (err: any) {
      console.error("Failed to create meal plan:", err);
      setErrorMsg(
        err?.message || "Failed to create meal plan. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const title = "Add Meal Plan";

  const isSaveDisabled =
    saving ||
    !values.mealPlan.trim() ||
    !values.dt ||
    !values.folioID;

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
          <div className="space-y-4">
            {/* Folio ID */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">
                Folio ID <span className="text-red-500">*</span>
              </label>
              <Input
                name="folioID"
                type="number"
                value={values.folioID}
                onChange={handleChange}
                placeholder="Enter Folio ID"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">
                Date <span className="text-red-500">*</span>
              </label>
              <Input
                name="dt"
                type="date"
                value={values.dt}
                onChange={handleChange}
              />
            </div>

            {/* Meal Plan */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">
                Meal Plan <span className="text-red-500">*</span>
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
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
import type { BasisMasItem } from "@/redux/slices/fetchBasisMasSlice";
import { updateBasisMas } from "@/redux/slices/updateBasisMasSlice";

type EditMealPlanDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  row?: BasisMasItem | null; // row to edit
  onUpdated?: (updated: BasisMasItem) => void; // optional callback to parent
};

export default function EditMealPlanDrawer({
  isOpen,
  onClose,
  row,
  onUpdated,
}: EditMealPlanDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [values, setValues] = useState<BasisMasItem | null>(null);
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
    if (!values.basis?.trim()) {
      setErrorMsg("Basis (meal plan code) is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const payload: BasisMasItem = {
        ...values,
        basisID: Number(values.basisID ?? 0),
        showOnIBE: Boolean(values.showOnIBE),
      };

      const result = await dispatch(updateBasisMas(payload)).unwrap();

      onUpdated?.(result as BasisMasItem);
      onClose();
    } catch (err: any) {
      console.error("Failed to update basis:", err);
      setErrorMsg(
        err?.message || "Failed to update basis. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const title = "Edit Meal Plan (Basis)";
  const isSaveDisabled = saving || !values || !values.basis?.trim();

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
              {/* Basis ID */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Basis ID</label>
                <Input
                  value={values.basisID}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Basis / Meal Plan Code */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">
                  Meal Plan Code (Basis) <span className="text-red-500">*</span>
                </label>
                <Input
                  name="basis"
                  value={values.basis}
                  onChange={handleChange}
                  placeholder="e.g., BB, HB, FB, AI"
                />
              </div>

              {/* CM Rate ID */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">CM Rate ID</label>
                <Input
                  name="cmRateID"
                  value={values.cmRateID}
                  onChange={handleChange}
                  placeholder="Channel manager rate ID (optional)"
                />
              </div>

              {/* Show on IBE */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="showOnIBE"
                  checked={values.showOnIBE}
                  onChange={handleChange}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-600">
                  Show on IBE (booking engine)
                </span>
              </div>

              {/* Description on IBE */}
              <div className="space-y-1">
                <label className="text-sm text-gray-600">
                  Description (IBE)
                </label>
                <Input
                  name="descOnIBE"
                  value={values.descOnIBE}
                  onChange={handleChange}
                  placeholder="Short description shown on booking engine"
                />
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
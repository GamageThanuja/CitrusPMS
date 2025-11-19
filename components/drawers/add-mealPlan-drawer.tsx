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
  createBasisMas,
} from "@/redux/slices/createBasisMasSlice";
import type { AppDispatch } from "@/redux/store";
import type { BasisMasItem } from "@/redux/slices/fetchBasisMasSlice";

type AddMealPlanDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  // kept here in case you still pass it from somewhere, but not used now
  initialFolioID?: number;
  onCreated?: (created: BasisMasItem | null) => void; // optional callback to parent
};

export default function AddMealPlanDrawer({
  isOpen,
  onClose,
  initialFolioID,
  onCreated,
}: AddMealPlanDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [values, setValues] = useState({
    basisID: 0,
    basis: "",
    cmRateID: "",
    showOnIBE: false,
    descOnIBE: "",
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setValues({
        basisID: 0,
        basis: "",
        cmRateID: "",
        showOnIBE: false,
        descOnIBE: "",
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
        basisID: Number(values.basisID) || 0, // server can ignore on create
        basis: values.basis.trim(),
        cmRateID: values.cmRateID.trim(),
        showOnIBE: values.showOnIBE,
        descOnIBE: values.descOnIBE.trim(),
      };

      const created = await dispatch(
        createBasisMas(payload)
      ).unwrap();

      onCreated?.(created as BasisMasItem | null);
      onClose();
    } catch (err: any) {
      console.error("Failed to create BasisMas:", err);
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
    !values.basis.trim(); // basis is required

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
          <div className="space-y-4 px-2">
            {/* Basis ID (optional / mostly for reference) */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Basis ID</label>
              <Input
                name="basisID"
                type="number"
                value={values.basisID}
                onChange={handleChange}
                placeholder="0 (auto)"
              />
            </div>

            {/* Basis Code */}
            <div className="space-y-1">
              <label className="text-sm text-gray-600">
                Basis / Meal Plan Code <span className="text-red-500">*</span>
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
                Show on IBE
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
                placeholder="Short description to show on booking engine"
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}


"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { 
  createCategoryMas,
  selectCreateCategoryLoading,
  selectCreateCategoryError,
  selectCreateCategorySuccess,
  clearCreateCategoryMas,
  type CreateCategoryMasPayload
} from "@/redux/slices/createCategoryMasSlice";

export interface AddCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  // Optional callback for additional actions after successful creation
  onSuccess?: () => void;
}

export default function AddCategoryMasdrawer({ open, onClose, onSuccess }: AddCategoryDrawerProps) {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const loading = useAppSelector(selectCreateCategoryLoading);
  const error = useAppSelector(selectCreateCategoryError);
  const success = useAppSelector(selectCreateCategorySuccess);
  
  // form state aligned with API fields (subset commonly used for creation)
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryTypeID, setCategoryTypeID] = useState<number | "">("");
  const [departmentID, setDepartmentID] = useState<number | "">("");
  const [finAct, setFinAct] = useState<boolean | null>(true);
  const [colourCode, setColourCode] = useState("");

  // Clear form and reset Redux state when drawer opens
  useEffect(() => {
    if (open) {
      // Clear Redux state
      dispatch(clearCreateCategoryMas());
      // Clear form fields
      setCategoryCode("");
      setCategoryName("");
      setCategoryTypeID("");
      setDepartmentID("");
      setFinAct(true);
      setColourCode("");
    }
  }, [open, dispatch]);

  // Handle successful creation
  useEffect(() => {
    if (success) {
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      // Clear state after successful creation
      dispatch(clearCreateCategoryMas());
    }
  }, [success, onClose, onSuccess, dispatch]);

  const isValid = useMemo(() => {
    return categoryName.trim().length > 0; // minimal validation
  }, [categoryName]);

  const handleSubmit = async () => {
    if (!isValid) {
      alert("Category Name is required");
      return;
    }

    const payload: CreateCategoryMasPayload = {
      categoryCode: categoryCode.trim() || null,
      categoryName: categoryName.trim(),
      categoryTypeID: typeof categoryTypeID === "number" ? categoryTypeID : null,
      departmentID: typeof departmentID === "number" ? departmentID : null,
      finAct: finAct,
      colourCode: colourCode.trim() || null,
    };

    try {
      await dispatch(createCategoryMas(payload)).unwrap();
      // Success is handled in useEffect above
    } catch (error: any) {
      console.error("Create category failed:", error);
      const errorMessage = typeof error === "string" ? error : "Failed to create category";
      alert(errorMessage);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>Add Category</SheetTitle>
          <SheetDescription>
            Fill in the details below and save to create a new category record.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          {/* Category Name */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Category Name *</Label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., BREAKFAST"
            />
          </div>

          {/* Category Code */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Category Code</Label>
            <Input
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              placeholder="e.g., BREAKFAST, COFFEE&"
            />
          </div>

          {/* Department ID */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Department ID</Label>
            <Input
              type="number"
              value={departmentID === "" ? "" : departmentID}
              onChange={(e) => setDepartmentID(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g., 1"
              min={0}
            />
          </div>

          {/* Financially Active */}
          <div className="flex items-center justify-between border rounded px-3 py-2">
            <div>
              <Label className="text-sm">Financially Active</Label>
              <p className="text-xs text-muted-foreground">Toggle whether this category is active in finance.</p>
            </div>
            <Switch checked={!!finAct} onCheckedChange={(v) => setFinAct(v)} />
          </div>

          {/* Colour Code */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Colour Code</Label>
            <Input
              value={colourCode}
              onChange={(e) => setColourCode(e.target.value)}
              placeholder="Optional HEX/RGB name"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded border">
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !isValid}>
            {loading ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
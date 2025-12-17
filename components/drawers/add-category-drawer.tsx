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
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { fetchCategoryMas } from "@/redux/slices/fetchCategoryMasSlice";
import { createCategoryMas } from "@/redux/slices/createCategoryMasSlice";

interface CreateCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCategoryDrawer({
  open,
  onClose,
}: CreateCategoryDrawerProps) {
  const dispatch = useAppDispatch();

  // form state
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);

  // (optional) if you want to refresh categories whenever drawer opens
  useEffect(() => {
    if (!open) return;
    // e.g. dispatch(fetchCategories(hotelID)) if needed
  }, [open]);

  const handleSubmit = async () => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelID: number | undefined = property?.id;

    setSaving(true);
    try {
      // Create via /api/CategoryMas with just the name + company
      await dispatch(
        createCategoryMas({
          categoryName: categoryName.trim(),
          finAct: false,
          companyID: hotelID ?? null,
          
        })
      ).unwrap();

      // refresh normal category list
      dispatch(fetchCategoryMas());

      // reset form & close
      setCategoryName("");
      onClose();
    } catch (e: any) {
      console.error("Create category failed:", e);
      alert(typeof e === "string" ? e : "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Create New Category</SheetTitle>
          <SheetDescription>
            Provide a category name for this hotel.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          {/* Category Name */}
          <Input
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
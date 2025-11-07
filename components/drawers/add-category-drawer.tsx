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
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCategories } from "@/redux/slices/categorySlice"; // (list fetcher you already have)
import {
  fetchBaseCategories,
  selectBaseCategories,
  selectBaseCategoryLoading,
  selectBaseCategoryError,
  type BaseCategory,
} from "@/redux/slices/baseCategoryMasterSlice";
import { createCategory as createCategoryThunk } from "@/redux/slices/createCategorySlice";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

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
  const [baseCategoryId, setBaseCategoryId] = useState<number | undefined>();
  const [salesAccId, setSalesAccId] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);

  // base categories from store
  const baseCats = useAppSelector(selectBaseCategories);
  const baseCatsLoading = useAppSelector(selectBaseCategoryLoading);
  const baseCatsError = useAppSelector(selectBaseCategoryError);

  console.log("baseCats : ", baseCats);

  // Load base categories when the drawer opens
  useEffect(() => {
    if (open) {
      dispatch(fetchBaseCategories());
    }
  }, [open, dispatch]);

  // list of unique sales accounts (if you want a separate selector)
  const salesAccOptions = useMemo(() => {
    const set = new Set<number>();
    baseCats.forEach((b) => {
      if (typeof b.salesAccId === "number") set.add(b.salesAccId);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [baseCats]);

  // When baseCategory changes, auto-pick its salesAccId (can be overridden)
  useEffect(() => {
    if (!baseCategoryId) return;
    const found = baseCats.find((b) => b.baseCategoryId === baseCategoryId);
    if (found && typeof found.salesAccId === "number") {
      setSalesAccId(found.salesAccId);
    }
  }, [baseCategoryId, baseCats]);

  const handleSubmit = async () => {
    // tokens + hotel details
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken: string | undefined = tokens?.accessToken;
    const hotelID: number | undefined = property?.id;

    if (!hotelID || !accessToken) {
      alert("Missing authentication or hotel info");
      return;
    }
    if (!categoryName?.trim()) {
      alert("Category name is required");
      return;
    }
    if (!baseCategoryId) {
      alert("Please select a Base Category");
      return;
    }

    setSaving(true);
    try {
      // NOTE: API schema doesn't include salesAccId for category creation,
      // but we keep it in UI state for your workflow.
      await dispatch(
        createCategoryThunk({
          categoryName: categoryName.trim(),
          finAct: false, // or true if you want finance-active by default
          baseCategoryId,
          createdBy: "system", // or current user
        })
      ).unwrap();
      console.log("payload ctegory : ", baseCategoryId);

      // Refresh your categories list in UI
      dispatch(fetchCategories(hotelID));

      // reset UI
      setCategoryName("");
      setBaseCategoryId(undefined);
      setSalesAccId(undefined);
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
            Provide a category name and choose a base category (and sales
            account) for this hotel.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          {/* Category Name */}
          <Input
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />

          {/* Base Category */}
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted-foreground">
                Base Category
              </label>
              <Select
                disabled={baseCatsLoading}
                value={baseCategoryId ? String(baseCategoryId) : undefined}
                onValueChange={(v) => setBaseCategoryId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      baseCatsLoading ? "Loading..." : "Select base category"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {baseCats.map((b: BaseCategory) => (
                    <SelectItem
                      key={b.baseCategoryId}
                      value={String(b.baseCategoryId)}
                    >
                      {b.baseCategory} (#{b.baseCategoryId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!!baseCatsError && (
                <p className="text-sm text-red-500">
                  Failed to load base categories: {baseCatsError}
                </p>
              )}
            </div>

            {/* Sales Account (optional override / selection) */}
          </div>

          <Button onClick={handleSubmit} disabled={saving || baseCatsLoading}>
            {saving ? "Saving..." : "Save Category"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

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

import type { ItemMas } from "@/redux/slices/fetchItemMasSlice";
import { updateItemMas } from "@/redux/slices/updateItemMasSlice";
import type { AppDispatch } from "@/redux/store";

type PosEditItemListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: ItemMas | null; // item to edit
  onSave?: (values: ItemMas) => void; // optional callback back to parent
};

export default function PosEditItemListDrawer({
  isOpen,
  onClose,
  selectedItem,
  onSave,
}: PosEditItemListDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [values, setValues] = useState<Partial<ItemMas>>({
    itemTypeID: 0,
    baseItemCatID: 0,
    categoryID: 0,
    itemNumber: "",
    description: "",
    showOnPOS: false,
    isKOT: false,
    isBOT: false,
    isAIEntitled: false,
    isTrading: false,
    askQtyOnSale: false,
  });

  const [saving, setSaving] = useState(false);

  // Prefill when an item is selected
  useEffect(() => {
    if (selectedItem) {
      setValues({
        itemTypeID: selectedItem.itemTypeID,
        baseItemCatID: selectedItem.baseItemCatID,
        categoryID: selectedItem.categoryID,
        itemNumber: selectedItem.itemNumber,
        description: selectedItem.description,
        showOnPOS: selectedItem.showOnPOS,
        isKOT: selectedItem.isKOT,
        isBOT: selectedItem.isBOT,
        isAIEntitled: selectedItem.isAIEntitled,
        isTrading: selectedItem.isTrading,
        askQtyOnSale: selectedItem.askQtyOnSale,
      });
    } else {
      setValues({
        itemTypeID: 0,
        baseItemCatID: 0,
        categoryID: 0,
        itemNumber: "",
        description: "",
        showOnPOS: false,
        isKOT: false,
        isBOT: false,
        isAIEntitled: false,
        isTrading: false,
        askQtyOnSale: false,
      });
    }
  }, [selectedItem, isOpen]);

  const handleChange =
    (field: keyof ItemMas) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { type, value, checked } = e.target;
      setValues((prev) => ({
        ...prev,
        [field]:
          type === "checkbox"
            ? checked
            : field.toLowerCase().includes("id")
            ? Number(value)
            : value,
      }));
    };

  const handleSave = async () => {
    if (!selectedItem) {
      onClose();
      return;
    }

    try {
      setSaving(true);

      // merge original + edited fields
      const updated: ItemMas = {
        ...selectedItem,
        ...values,
      } as ItemMas;

      // call API
      await dispatch(updateItemMas(updated)).unwrap();

      // optional callback so parent can refresh if it wants
      onSave?.(updated);
      onClose();
    } catch (err) {
      console.error("Failed to update ItemMas:", err);
      // here you can show a toast if you use any toast library
    } finally {
      setSaving(false);
    }
  };

  const title = "Edit POS Item";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => (!open ? onClose() : null)}
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
            {/* Top fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Item Type</label>
                <Input
                  type="number"
                  value={values.itemTypeID ?? ""}
                  onChange={handleChange("itemTypeID")}
                  placeholder="Item Type ID"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Base Category</label>
                <Input
                  type="number"
                  value={values.baseItemCatID ?? ""}
                  onChange={handleChange("baseItemCatID")}
                  placeholder="Base Category ID"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Category</label>
                <Input
                  type="number"
                  value={values.categoryID ?? ""}
                  onChange={handleChange("categoryID")}
                  placeholder="Category ID"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Code</label>
                <Input
                  value={values.itemNumber ?? ""}
                  onChange={handleChange("itemNumber")}
                  placeholder="Item code"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Item Name</label>
                <Input
                  value={values.description ?? ""}
                  onChange={handleChange("description")}
                  placeholder="Item name / description"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                POS Flags &amp; Options
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values.showOnPOS}
                    onChange={handleChange("showOnPOS")}
                    className="h-4 w-4"
                  />
                  <span>OnPOS</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values.isKOT}
                    onChange={handleChange("isKOT")}
                    className="h-4 w-4"
                  />
                  <span>KOT</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values.isBOT}
                    onChange={handleChange("isBOT")}
                    className="h-4 w-4"
                  />
                  <span>BOT</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values.isAIEntitled}
                    onChange={handleChange("isAIEntitled")}
                    className="h-4 w-4"
                  />
                  <span>AI Ent.</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values.isTrading}
                    onChange={handleChange("isTrading")}
                    className="h-4 w-4"
                  />
                  <span>Trading</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!values.askQtyOnSale}
                    onChange={handleChange("askQtyOnSale")}
                    className="h-4 w-4"
                  />
                  <span>Ask Qty</span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !selectedItem}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
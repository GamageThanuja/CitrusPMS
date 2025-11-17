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
import {
  createItemMas,
  type CreateItemMasPayload,
} from "@/redux/slices/createItemMasSlice";
import { AppDispatch } from "@/redux/store";

type PosAddItemListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: ItemMas | null;
  onSave?: (values: Partial<ItemMas>) => void; // still optional
};

export default function PosAddItemListDrawer({
  isOpen,
  onClose,
  selectedItem,
  onSave,
}: PosAddItemListDrawerProps) {
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

  // Build full payload for API from the small form
  const buildCreatePayload = (v: Partial<ItemMas>): CreateItemMasPayload => {
    const now = new Date().toISOString();

    return {
      finAct: false,
      itemID: 0,
      itemNumber: v.itemNumber ?? "",
      description: v.description ?? "",
      extDescription: "",
      uomid: 0,
      itemTypeID: v.itemTypeID ?? 0,
      categoryID: v.categoryID ?? 0,
      salesTaxID: 0,
      price: 0,
      cost: 0,
      binLocation: "",
      notes: "",
      reorderPoint: 0,
      restockLevel: 0,
      picturePath: "",
      notDiscountable: false,
      cannotPurchase: false,
      cannotInvoDecimal: false,
      waighMustEnter: false,
      itemMessage: "",
      createdBy: 0,
      createdOn: now,
      lastModBy: 0,
      lastModOn: now,
      cogsAccountID: 0,
      salesAccountID: 0,
      inventoryAssetsAccID: 0,
      lowestSellingPrice: 0,
      packagingSize: "",
      messageClient: "",
      cannotInvoInsufQty: false,
      subCompanyID: 0,
      serialNo: "",
      costCenterID: 0,
      custodianID: 0,
      supplierID: 0,
      acqDate: now,
      lifeTimeYears: 0,
      lifeTimeMonths: 0,
      serviceProvider: "",
      warranty: "",
      nextServiceDate: now,
      serviceContractNo: "",
      commercialDepreMethodID: 0,
      fiscalDepreMethodID: 0,
      profitMargin: 0,
      vat: false,
      nbt: false,
      sinhalaDes: "",
      brandID: 0,
      kitItem: false,
      buid: 0,
      serialNumbered: false,
      preferedSupplierID: 0,
      backColour: "",
      limitWholesaleQtyAtCHK: false,
      limitWholesaleQtyAt: 0,
      maxWholesaleQtyCHK: false,
      maxWholesaleQty: 0,
      discountRTNarration: "",
      discountWSNarration: "",
      limitRetailQtyAtCHK: false,
      limitRetailQtyAt: 0,
      maxRetialQtyCHK: false,
      maxRetailQty: 0,
      isPick: false,
      rtPrice: 0,
      wsPrice: 0,
      itemMessage_Client: "",
      showOnPOS: v.showOnPOS ?? false,
      isKOT: v.isKOT ?? false,
      isBOT: v.isBOT ?? false,
      posCenter: "",
      rackNo: "",
      isTrading: v.isTrading ?? false,
      isTaxIncluded: false,
      isSCIncluded: false,
      baseItemCatID: v.baseItemCatID ?? 0,
      oldItemCode: "",
      small: false,
      regular: false,
      large: false,
      guestPrice: 0,
      childPrice: 0,
      guidePrice: 0,
      driverPrice: 0,
      isRecipe: false,
      isAIEntitled: v.isAIEntitled ?? false,
      sku: "",
      useBatchPriceOnSale: false,
      discountPercentage: 0,
      discountID: 0,
      isFastCheckOut: false,
      changePriceOnGRN: false,
      partNo: "",
      oldPrice: 0,
      oldPriceAsAt: "",
      lastPriceUpdateBy: "",
      colour: "",
      askQtyOnSale: v.askQtyOnSale ?? false,
      isAskSKU: false,
      skuid: 0,
      isShotItem: false,
      shotItemID: 0,
      shotItemCode: "",
      subItemOf: "",
      imageURL: "",
      lastDepreciatedDate: "",
      depreciationExpenseAccountID: 0,
      bookValue: 0,
      bookValueAsAt: "",
      guardian: "",
      barCode: "",
      nameOnBill: "",
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = buildCreatePayload(values);

      // call API
      await dispatch(createItemMas(payload)).unwrap();

      console.log("POS Item created successfully");
      onSave?.(values); // optional callback to parent
      onClose();
    } catch (err) {
      console.error("Failed to create POS item:", err);
      // here you can show a toast if you use sonner / toast
    } finally {
      setSaving(false);
    }
  };

  const title = selectedItem ? "Edit POS Item" : "Add POS Item";

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
          <div className="space-y-4 px-2">
            {/* Top fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
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
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
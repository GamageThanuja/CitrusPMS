"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// Redux
import {
  updateTaxTable,
  selectUpdateTaxTableLoading,
  selectUpdateTaxTableError,
} from "@/redux/slices/updateTaxTableSlice";
import type { TaxTable } from "@/redux/slices/fetchTaxTableSlice";

interface UpdateTaxTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tax: TaxTable | null;
  onTaxTableUpdated: () => void;
}

export function UpdateTaxTableDrawer({
  isOpen,
  onClose,
  tax,
  onTaxTableUpdated,
}: UpdateTaxTableDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateTaxTableLoading);
  const updateError = useSelector(selectUpdateTaxTableError);

  const [taxData, setTaxData] = useState({
    sc: "",
    tdl: "",
    vat: "",
    dateFrom: "",
    dateTo: "",
  });
  const [localError, setLocalError] = useState("");

  // Reset form when tax changes or drawer opens
  useEffect(() => {
    if (tax && isOpen) {
      setTaxData({
        sc: String(tax.sc ?? ""),
        tdl: String(tax.cityTax ?? ""),
        vat: String(tax.vat ?? ""),
        dateFrom: tax.dateFrom?.slice(0, 10) ?? "",
        dateTo: tax.dateTo?.slice(0, 10) ?? "",
      });
      setLocalError("");
    }
  }, [tax, isOpen]);

  const handleInputChange = (field: keyof typeof taxData, value: string) => {
    setTaxData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!tax) {
      setLocalError("No tax entry selected for update");
      return;
    }

    // Validation
    if (!taxData.sc.trim() || !taxData.tdl.trim() || !taxData.vat.trim()) {
      setLocalError("All tax percentages are required");
      return;
    }

    if (!taxData.dateFrom.trim() || !taxData.dateTo.trim()) {
      setLocalError("Both date from and date to are required");
      return;
    }

    const hasChanges = 
      Number(taxData.sc) !== tax.sc ||
      Number(taxData.tdl) !== tax.cityTax ||
      Number(taxData.vat) !== tax.vat ||
      taxData.dateFrom !== (tax.dateFrom?.slice(0, 10) ?? "") ||
      taxData.dateTo !== (tax.dateTo?.slice(0, 10) ?? "");

    if (!hasChanges) {
      setLocalError("No changes detected");
      return;
    }

    const hotelCode = tax.hotelCode || localStorage.getItem("hotelCode") || "";
    if (!hotelCode) {
      setLocalError("Hotel code not found");
      return;
    }

    const payload: TaxTable = {
      ...tax,
      sc: Number(taxData.sc) || 0,
      cityTax: Number(taxData.tdl) || 0,
      vat: Number(taxData.vat) || 0,
      dateFrom: taxData.dateFrom,
      dateTo: taxData.dateTo,
      // keep existing values
      createdOn: tax.createdOn,
      createdBy: tax.createdBy,
    };

    try {
      const action = await dispatch(updateTaxTable(payload));
      
      if (updateTaxTable.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to update tax entry";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onTaxTableUpdated();
      onClose();
      toast.success("Tax entry updated successfully");
    } catch (error) {
      const errorMessage = "Failed to update tax entry";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Update tax entry failed:", error);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const errorMessage = localError || updateError;
  const hasChanges = tax && (
    Number(taxData.sc) !== tax.sc ||
    Number(taxData.tdl) !== tax.cityTax ||
    Number(taxData.vat) !== tax.vat ||
    taxData.dateFrom !== (tax.dateFrom?.slice(0, 10) ?? "") ||
    taxData.dateTo !== (tax.dateTo?.slice(0, 10) ?? "")
  );

  const canSubmit = 
    taxData.sc.trim() && 
    taxData.tdl.trim() && 
    taxData.vat.trim() && 
    taxData.dateFrom.trim() && 
    taxData.dateTo.trim();

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      {/* <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto"> */}
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Tax Entry</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Current Tax Info */}
          {tax && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Updating Tax Entry:</p>
              <p className="text-sm text-muted-foreground">
                Record ID: {tax.recordID} | Hotel: {tax.hotelCode}
              </p>
            </div>
          )}

          {/* Tax Percentage Fields */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Tax Percentages</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sc" className="required">Service Charge (%)</Label>
                <Input
                  id="sc"
                  name="sc"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={taxData.sc}
                  onChange={(e) => handleInputChange("sc", e.target.value)}
                  disabled={updating || !tax}
                  min="0"
                  step="0.01"
                  className="w-full"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tdl" className="required">TDL (%)</Label>
                <Input
                  id="tdl"
                  name="tdl"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={taxData.tdl}
                  onChange={(e) => handleInputChange("tdl", e.target.value)}
                  disabled={updating || !tax}
                  min="0"
                  step="0.01"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat" className="required">VAT (%)</Label>
                <Input
                  id="vat"
                  name="vat"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={taxData.vat}
                  onChange={(e) => handleInputChange("vat", e.target.value)}
                  disabled={updating || !tax}
                  min="0"
                  step="0.01"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Date Range Fields */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Date Range</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="required">Date From</Label>
                <Input
                  id="dateFrom"
                  name="dateFrom"
                  type="date"
                  value={taxData.dateFrom}
                  onChange={(e) => handleInputChange("dateFrom", e.target.value)}
                  disabled={updating || !tax}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo" className="required">Date To</Label>
                <Input
                  id="dateTo"
                  name="dateTo"
                  type="date"
                  value={taxData.dateTo}
                  onChange={(e) => handleInputChange("dateTo", e.target.value)}
                  disabled={updating || !tax}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* System Information */}
          {tax && (
            <div className="space-y-3 p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">System Information</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Originally Created By:</span>
                  <span className="ml-2 font-medium">{tax.createdBy || "System"}</span>
                </div>
                {tax.createdOn && (
                  <div>
                    <span className="text-muted-foreground">Created On:</span>
                    <span className="ml-2 font-medium">
                      {new Date(tax.createdOn).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {errorMessage && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {errorMessage}
            </div>
          )}

          {/* No Changes Warning */}
          {tax && !hasChanges && canSubmit && (
            <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
              No changes made to the tax entry data.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updating || !tax || !canSubmit || !hasChanges}
              className="min-w-20"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
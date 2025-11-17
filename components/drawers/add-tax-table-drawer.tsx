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
  createTaxTable,
  selectCreateTaxTableLoading,
  selectCreateTaxTableError,
} from "@/redux/slices/createTaxTableSlice";
import type { TaxTable } from "@/redux/slices/fetchTaxTableSlice";

interface AddTaxTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTaxTableCreated: () => void;
}

export function AddTaxTableDrawer({
  isOpen,
  onClose,
  onTaxTableCreated,
}: AddTaxTableDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectCreateTaxTableLoading);
  const createError = useSelector(selectCreateTaxTableError);

  const [taxData, setTaxData] = useState({
    sc: "",
    tdl: "",
    vat: "",
    dateFrom: "",
    dateTo: "",
  });
  const [localError, setLocalError] = useState("");

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTaxData({
        sc: "",
        tdl: "",
        vat: "",
        dateFrom: "",
        dateTo: "",
      });
      setLocalError("");
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof typeof taxData, value: string) => {
    setTaxData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    // Validation
    if (!taxData.sc.trim() || !taxData.tdl.trim() || !taxData.vat.trim()) {
      setLocalError("All tax percentages are required");
      return;
    }

    if (!taxData.dateFrom.trim() || !taxData.dateTo.trim()) {
      setLocalError("Both date from and date to are required");
      return;
    }

    const hotelCode = localStorage.getItem("hotelCode") ?? "";
    if (!hotelCode) {
      setLocalError("Hotel code not found");
      return;
    }

    const now = new Date().toISOString();
    const payload: TaxTable = {
      recordID: 0,
      vat: Number(taxData.vat) || 0,
      nbt: 0,
      sc: Number(taxData.sc) || 0,
      cityTax: Number(taxData.tdl) || 0,
      hotelCode,
      poS_SC: 0,
      poS_VAT: 0,
      poS_NBT: 0,
      poS_CityTax: 0,
      isNBTInclude: false,
      greenTax: 0,
      dateFrom: taxData.dateFrom,
      dateTo: taxData.dateTo,
      calcMethod: 0,
      createdOn: now,
      createdBy: "System",
    };

    try {
      const action = await dispatch(createTaxTable(payload));
      
      if (createTaxTable.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to create tax entry";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onTaxTableCreated();
      onClose();
      toast.success("Tax entry created successfully");
    } catch (error) {
      const errorMessage = "Failed to create tax entry";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Create tax entry failed:", error);
    }
  };

  const handleClose = () => {
    if (!creating) {
      onClose();
    }
  };

  const errorMessage = localError || createError;
  const canSubmit = 
    taxData.sc.trim() && 
    taxData.tdl.trim() && 
    taxData.vat.trim() && 
    taxData.dateFrom.trim() && 
    taxData.dateTo.trim();

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      {/* <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">   */}
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Tax Entry</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
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
                  disabled={creating}
                  min="0"
                  step="0.01"
                  className="w-full"
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
                  disabled={creating}
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
                  disabled={creating}
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
                  disabled={creating}
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
                  disabled={creating}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Auto-filled Info */}
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">System Information</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Hotel Code:</span>
                <span className="ml-2 font-medium">
                  {localStorage.getItem("hotelCode") || "Not set"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Created By:</span>
                <span className="ml-2 font-medium">System</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={creating || !canSubmit}
              className="min-w-20"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
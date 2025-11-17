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
  createMealAllocation,
  selectCreateMealAllocationLoading,
  selectCreateMealAllocationError,
} from "@/redux/slices/createMealAllocationSlice";

interface AddMealAllocationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onMealAllocationCreated: () => void;
}

export function AddMealAllocationDrawer({
  isOpen,
  onClose,
  username,
  onMealAllocationCreated,
}: AddMealAllocationDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectCreateMealAllocationLoading);
  const createError = useSelector(selectCreateMealAllocationError);

  const [mealData, setMealData] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
    currency: "",
    ai: "",
    hotelCode: "",
  });
  const [localError, setLocalError] = useState("");

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setMealData({
        breakfast: "",
        lunch: "",
        dinner: "",
        currency: "",
        ai: "",
        hotelCode: "",
      });
      setLocalError("");
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof typeof mealData, value: string) => {
    setMealData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!mealData.hotelCode.trim()) {
      setLocalError("Hotel Code is required");
      return;
    }

    const now = new Date().toISOString();

    const payload = {
      id: 0,
      breakfast: Number(mealData.breakfast) || 0,
      lunch: Number(mealData.lunch) || 0,
      dinner: Number(mealData.dinner) || 0,
      currency: mealData.currency,
      ai: Number(mealData.ai) || 0,
      hotelCode: mealData.hotelCode.trim(),
      createdBy: username || "system",
      createdOn: now,
      lastUpdatedBy: username || "system",
      lastUpdatedOn: now,
    };

    try {
      const action = await dispatch(createMealAllocation(payload));
      
      if (createMealAllocation.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to create meal allocation";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onMealAllocationCreated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to create meal allocation";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Create meal allocation failed:", error);
    }
  };

  const handleClose = () => {
    if (!creating) {
      onClose();
    }
  };

  const errorMessage = localError || createError;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      {/* <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto"> */}
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Meal Allocation</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hotelCode" className="required">Hotel Code *</Label>
              <Input
                id="hotelCode"
                placeholder="Enter hotel code"
                value={mealData.hotelCode}
                onChange={(e) => handleInputChange("hotelCode", e.target.value)}
                disabled={creating}
                className="w-full"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                placeholder="Enter currency (e.g., USD, EUR)"
                value={mealData.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                disabled={creating}
                className="w-full"
              />
            </div>
          </div>

          {/* Meal Amounts */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Meal Amounts</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="breakfast">Breakfast</Label>
                <Input
                  id="breakfast"
                  type="number"
                  placeholder="0"
                  value={mealData.breakfast}
                  onChange={(e) => handleInputChange("breakfast", e.target.value)}
                  disabled={creating}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lunch">Lunch</Label>
                <Input
                  id="lunch"
                  type="number"
                  placeholder="0"
                  value={mealData.lunch}
                  onChange={(e) => handleInputChange("lunch", e.target.value)}
                  disabled={creating}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dinner">Dinner</Label>
                <Input
                  id="dinner"
                  type="number"
                  placeholder="0"
                  value={mealData.dinner}
                  onChange={(e) => handleInputChange("dinner", e.target.value)}
                  disabled={creating}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai">All Inclusive (AI)</Label>
                <Input
                  id="ai"
                  type="number"
                  placeholder="0"
                  value={mealData.ai}
                  onChange={(e) => handleInputChange("ai", e.target.value)}
                  disabled={creating}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Auto-filled User Info */}
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">User Information</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created By:</span>
                <span className="ml-2 font-medium">{username || "system"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated By:</span>
                <span className="ml-2 font-medium">{username || "system"}</span>
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
              disabled={creating || !mealData.hotelCode.trim()}
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
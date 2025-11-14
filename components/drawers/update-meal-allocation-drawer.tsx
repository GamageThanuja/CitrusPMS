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
  updateMealAllocation,
  selectUpdateMealAllocationLoading,
  selectUpdateMealAllocationError,
} from "@/redux/slices/updateMealAllocationSlice";

interface MealUI {
  id: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  currency: string;
  ai: number;
  hotelCode: string;
  createdBy: string;
  createdOn: string;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
}

interface UpdateMealAllocationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meal: MealUI | null;
  username: string;
  onMealAllocationUpdated: () => void;
}

export function UpdateMealAllocationDrawer({
  isOpen,
  onClose,
  meal,
  username,
  onMealAllocationUpdated,
}: UpdateMealAllocationDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateMealAllocationLoading);
  const updateError = useSelector(selectUpdateMealAllocationError);

  const [mealData, setMealData] = useState({
    breakfast: "",
    lunch: "",
    dinner: "",
    currency: "",
    ai: "",
    hotelCode: "",
  });
  const [localError, setLocalError] = useState("");

  // Reset form when meal changes or drawer opens
  useEffect(() => {
    if (meal && isOpen) {
      setMealData({
        breakfast: meal.breakfast.toString(),
        lunch: meal.lunch.toString(),
        dinner: meal.dinner.toString(),
        currency: meal.currency,
        ai: meal.ai.toString(),
        hotelCode: meal.hotelCode,
      });
      setLocalError("");
    }
  }, [meal, isOpen]);

  const handleInputChange = (field: keyof typeof mealData, value: string) => {
    setMealData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!meal) {
      setLocalError("No meal allocation selected for update");
      return;
    }

    if (!mealData.hotelCode.trim()) {
      setLocalError("Hotel Code is required");
      return;
    }

    const hasChanges = 
      Number(mealData.breakfast) !== meal.breakfast ||
      Number(mealData.lunch) !== meal.lunch ||
      Number(mealData.dinner) !== meal.dinner ||
      Number(mealData.ai) !== meal.ai ||
      mealData.currency !== meal.currency ||
      mealData.hotelCode.trim() !== meal.hotelCode;

    if (!hasChanges) {
      setLocalError("No changes detected");
      return;
    }

    const now = new Date().toISOString();

    const payload = {
      id: meal.id,
      breakfast: Number(mealData.breakfast) || 0,
      lunch: Number(mealData.lunch) || 0,
      dinner: Number(mealData.dinner) || 0,
      currency: mealData.currency,
      ai: Number(mealData.ai) || 0,
      hotelCode: mealData.hotelCode.trim(),
      createdBy: meal.createdBy,
      createdOn: meal.createdOn,
      lastUpdatedBy: username || "system",
      lastUpdatedOn: now,
    };

    try {
      const action = await dispatch(updateMealAllocation(payload));
      
      if (updateMealAllocation.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to update meal allocation";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onMealAllocationUpdated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to update meal allocation";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Update meal allocation failed:", error);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const errorMessage = localError || updateError;
  const hasChanges = meal && (
    Number(mealData.breakfast) !== meal.breakfast ||
    Number(mealData.lunch) !== meal.lunch ||
    Number(mealData.dinner) !== meal.dinner ||
    Number(mealData.ai) !== meal.ai ||
    mealData.currency !== meal.currency ||
    mealData.hotelCode.trim() !== meal.hotelCode
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Meal Allocation</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-6">
          {/* Current Meal Info */}
          {meal && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Updating Meal Allocation:</p>
              <p className="text-sm text-muted-foreground">
                ID: {meal.id} | Hotel: {meal.hotelCode}
              </p>
            </div>
          )}

          {/* Required Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hotelCode" className="required">Hotel Code *</Label>
              <Input
                id="hotelCode"
                placeholder="Enter hotel code"
                value={mealData.hotelCode}
                onChange={(e) => handleInputChange("hotelCode", e.target.value)}
                disabled={updating || !meal}
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
                disabled={updating || !meal}
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
                  disabled={updating || !meal}
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
                  disabled={updating || !meal}
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
                  disabled={updating || !meal}
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
                  disabled={updating || !meal}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-3 p-3 bg-muted rounded-lg">
            <h4 className="font-medium text-sm">User Information</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Originally Created By:</span>
                <span className="ml-2 font-medium">{meal?.createdBy || "system"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated By:</span>
                <span className="ml-2 font-medium">{username || "system"}</span>
              </div>
              {meal?.createdOn && (
                <div>
                  <span className="text-muted-foreground">Created On:</span>
                  <span className="ml-2 font-medium">
                    {new Date(meal.createdOn).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {errorMessage}
            </div>
          )}

          {/* No Changes Warning */}
          {meal && !hasChanges && mealData.hotelCode.trim() && (
            <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
              No changes made to the meal allocation data.
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
              disabled={updating || !meal || !mealData.hotelCode.trim() || !hasChanges}
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
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// Redux
import {
  createMarketMas,
  selectCreateMarketMasLoading,
  selectCreateMarketMasError,
} from "@/redux/slices/createMarketMasSlice";

interface AddMarketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onMarketCreated: () => void;
}

export function AddMarketDrawer({
  isOpen,
  onClose,
  onMarketCreated,
}: AddMarketDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectCreateMarketMasLoading);
  const createError = useSelector(selectCreateMarketMasError);

  const [marketData, setMarketData] = useState({
    marketName: "",
    finAct: false,
    hotelCode: "",
    showOnFO: false,
  });
  const [localError, setLocalError] = useState("");

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setMarketData({
        marketName: "",
        finAct: false,
        hotelCode: "",
        showOnFO: false,
      });
      setLocalError("");
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof typeof marketData, value: string | boolean) => {
    setMarketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!marketData.marketName.trim()) {
      setLocalError("Market name cannot be empty");
      return;
    }

    try {
      const action = await dispatch(
        createMarketMas({
          marketName: marketData.marketName.trim(),
          finAct: marketData.finAct ?? null,
          hotelCode: marketData.hotelCode.trim() || null,
          showOnFO: marketData.showOnFO,
        })
      );
      
      if (createMarketMas.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to create market";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onMarketCreated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to create market";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Create market failed:", error);
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
          <SheetTitle>Create New Market</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Market Name Input */}
          <div className="space-y-2">
            <Label htmlFor="marketName">Market Name *</Label>
            <Input
              id="marketName"
              placeholder="Enter market name"
              value={marketData.marketName}
              onChange={(e) => handleInputChange("marketName", e.target.value)}
              disabled={creating}
              className="w-full"
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Enter a descriptive name for the market segment
            </p>
          </div>

          {/* Hotel Code Input */}
          <div className="space-y-2">
            <Label htmlFor="hotelCode">Hotel Code</Label>
            <Input
              id="hotelCode"
              placeholder="Enter hotel code"
              value={marketData.hotelCode}
              onChange={(e) => handleInputChange("hotelCode", e.target.value)}
              disabled={creating}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Optional hotel code reference
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="finAct"
                checked={marketData.finAct}
                onCheckedChange={(checked) => handleInputChange("finAct", checked as boolean)}
                disabled={creating}
              />
              <Label htmlFor="finAct" className="cursor-pointer">
                Financial Activity
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showOnFO"
                checked={marketData.showOnFO}
                onCheckedChange={(checked) => handleInputChange("showOnFO", checked as boolean)}
                disabled={creating}
              />
              <Label htmlFor="showOnFO" className="cursor-pointer">
                Show on Front Office
              </Label>
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
              disabled={creating || !marketData.marketName.trim()}
              className="min-w-20"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Market"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
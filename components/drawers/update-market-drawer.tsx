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
  updateMarketMas,
  selectUpdateMarketMasLoading,
  selectUpdateMarketMasError,
} from "@/redux/slices/updateMarketMasSlice";

interface MarketUI {
  marketID: number;
  marketName: string;
  finAct: boolean;
  hotelCode: string;
  showOnFO: boolean;
}

interface UpdateMarketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  market: MarketUI | null;
  onMarketUpdated: () => void;
}

export function UpdateMarketDrawer({
  isOpen,
  onClose,
  market,
  onMarketUpdated,
}: UpdateMarketDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateMarketMasLoading);
  const updateError = useSelector(selectUpdateMarketMasError);

  const [marketData, setMarketData] = useState({
    marketName: "",
    finAct: false,
    hotelCode: "",
    showOnFO: false,
  });
  const [localError, setLocalError] = useState("");

  // Reset form when market changes or drawer opens
  useEffect(() => {
    if (market && isOpen) {
      setMarketData({
        marketName: market.marketName,
        finAct: market.finAct ?? false,
        hotelCode: market.hotelCode || "",
        showOnFO: market.showOnFO ?? false,
      });
      setLocalError("");
    }
  }, [market, isOpen]);

  const handleInputChange = (field: keyof typeof marketData, value: string | boolean) => {
    setMarketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!market) {
      setLocalError("No market selected for update");
      return;
    }

    if (!marketData.marketName.trim()) {
      setLocalError("Market name cannot be empty");
      return;
    }

    const hasChanges = 
      marketData.marketName.trim() !== market.marketName ||
      marketData.finAct !== market.finAct ||
      marketData.hotelCode !== market.hotelCode ||
      marketData.showOnFO !== market.showOnFO;

    if (!hasChanges) {
      setLocalError("No changes detected");
      return;
    }

    try {
      const action = await dispatch(
        updateMarketMas({
          marketID: market.marketID,
          marketName: marketData.marketName.trim(),
          finAct: marketData.finAct ?? null,
          hotelCode: marketData.hotelCode.trim() || null,
          showOnFO: marketData.showOnFO,
        })
      );
      
      if (updateMarketMas.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to update market";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onMarketUpdated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to update market";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Update market failed:", error);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const errorMessage = localError || updateError;
  const hasChanges = market && (
    marketData.marketName.trim() !== market.marketName ||
    marketData.finAct !== market.finAct ||
    marketData.hotelCode !== market.hotelCode ||
    marketData.showOnFO !== market.showOnFO
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Market</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Current Market Info */}
          {market && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Updating Market:</p>
              <p className="text-sm text-muted-foreground">
                ID: {market.marketID}
              </p>
            </div>
          )}

          {/* Market Name Input */}
          <div className="space-y-2">
            <Label htmlFor="marketName">Market Name *</Label>
            <Input
              id="marketName"
              placeholder="Enter market name"
              value={marketData.marketName}
              onChange={(e) => handleInputChange("marketName", e.target.value)}
              disabled={updating || !market}
              className="w-full"
              autoFocus
            />
          </div>

          {/* Hotel Code Input */}
          <div className="space-y-2">
            <Label htmlFor="hotelCode">Hotel Code</Label>
            <Input
              id="hotelCode"
              placeholder="Enter hotel code"
              value={marketData.hotelCode}
              onChange={(e) => handleInputChange("hotelCode", e.target.value)}
              disabled={updating || !market}
              className="w-full"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="finAct"
                checked={marketData.finAct}
                onCheckedChange={(checked) => handleInputChange("finAct", checked as boolean)}
                disabled={updating || !market}
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
                disabled={updating || !market}
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

          {/* No Changes Warning */}
          {market && !hasChanges && marketData.marketName.trim() && (
            <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
              No changes made to the market data.
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
              disabled={updating || !market || !marketData.marketName.trim() || !hasChanges}
              className="min-w-20"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Market"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
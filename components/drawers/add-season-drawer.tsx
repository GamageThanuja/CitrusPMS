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
  createSeasonMas,
  selectCreateSeasonMasLoading,
  selectCreateSeasonMasError,
} from "@/redux/slices/createSeasonMasSlice";

interface AddSeasonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSeasonCreated: () => void;
}

export function AddSeasonDrawer({
  isOpen,
  onClose,
  onSeasonCreated,
}: AddSeasonDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectCreateSeasonMasLoading);
  const createError = useSelector(selectCreateSeasonMasError);

  const [seasonName, setSeasonName] = useState("");
  const [localError, setLocalError] = useState("");

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      setSeasonName("");
      setLocalError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!seasonName.trim()) {
      setLocalError("Season name cannot be empty");
      return;
    }

    try {
      const action = await dispatch(createSeasonMas({ 
        seasonID: 0, 
        season: seasonName.trim() 
      }));
      
      if (createSeasonMas.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to create season";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onSeasonCreated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to create season";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Create season failed:", error);
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
          <SheetTitle>Create New Season</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Season Name Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seasonName">Season Name *</Label>
              <Input
                id="seasonName"
                name="seasonName"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="Enter season name"
                disabled={creating}
                className="w-full"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Enter a descriptive name for the season (e.g., "Summer 2024", "Winter Peak")
              </p>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
                {errorMessage}
              </div>
            )}
          </div>

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
              disabled={creating || !seasonName.trim()}
              className="min-w-20"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Season"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
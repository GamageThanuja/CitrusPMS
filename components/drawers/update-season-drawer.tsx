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
  updateSeasonMas,
  selectUpdateSeasonMasLoading,
  selectUpdateSeasonMasError,
} from "@/redux/slices/updateSeasonMasSlice";

interface Season {
  id: number;
  name: string;
}

interface UpdateSeasonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  season: Season | null;
  onSeasonUpdated: () => void;
}

export function UpdateSeasonDrawer({
  isOpen,
  onClose,
  season,
  onSeasonUpdated,
}: UpdateSeasonDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateSeasonMasLoading);
  const updateError = useSelector(selectUpdateSeasonMasError);

  const [seasonName, setSeasonName] = useState("");
  const [localError, setLocalError] = useState("");

  // Reset form when season changes or drawer opens
  useEffect(() => {
    if (season && isOpen) {
      setSeasonName(season.name);
      setLocalError("");
    }
  }, [season, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!season) {
      setLocalError("No season selected for update");
      return;
    }

    if (!seasonName.trim()) {
      setLocalError("Season name cannot be empty");
      return;
    }

    if (seasonName.trim() === season.name) {
      setLocalError("No changes detected");
      return;
    }

    try {
      const action = await dispatch(updateSeasonMas({ 
        seasonID: season.id, 
        season: seasonName.trim() 
      }));
      
      if (updateSeasonMas.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to update season";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onSeasonUpdated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to update season";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Update season failed:", error);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const errorMessage = localError || updateError;
  const hasChanges = seasonName.trim() !== season?.name;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Season</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Current Season Info */}
          {season && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Updating Season:</p>
              <p className="text-sm text-muted-foreground">
                ID: {season.id} | Current Name: "{season.name}"
              </p>
            </div>
          )}

          {/* Season Name Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seasonName">Season Name *</Label>
              <Input
                id="seasonName"
                name="seasonName"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="Enter new season name"
                disabled={updating || !season}
                className="w-full"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Update the season name to reflect the new time period or pricing strategy
              </p>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
                {errorMessage}
              </div>
            )}

            {/* No Changes Warning */}
            {season && !hasChanges && seasonName.trim() && (
              <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
                No changes made to the season name.
              </div>
            )}
          </div>

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
              disabled={updating || !season || !seasonName.trim() || !hasChanges}
              className="min-w-20"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Season"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
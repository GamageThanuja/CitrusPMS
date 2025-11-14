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
  updateReservationSource,
  selectUpdateReservationSourceLoading,
  selectUpdateReservationSourceError,
} from "@/redux/slices/updateReservationSourceSlice";
import type { ReservationSource } from "@/redux/slices/fetchReservationSourceSlice";

interface UpdateReservationSourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  source: ReservationSource | null;
  onReservationSourceUpdated: () => void;
}

export function UpdateReservationSourceDrawer({
  isOpen,
  onClose,
  source,
  onReservationSourceUpdated,
}: UpdateReservationSourceDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateReservationSourceLoading);
  const updateError = useSelector(selectUpdateReservationSourceError);

  const [sourceName, setSourceName] = useState("");
  const [localError, setLocalError] = useState("");

  // Reset form when source changes or drawer opens
  useEffect(() => {
    if (source && isOpen) {
      setSourceName(source.reservationSource ?? "");
      setLocalError("");
    }
  }, [source, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!source) {
      setLocalError("No reservation source selected for update");
      return;
    }

    if (!sourceName.trim()) {
      setLocalError("Reservation source name is required");
      return;
    }

    const hasChanges = sourceName.trim() !== source.reservationSource;

    if (!hasChanges) {
      setLocalError("No changes detected");
      return;
    }

    try {
      const action = await dispatch(updateReservationSource({ 
        id: source.reservationSourceID, 
        reservationSource: sourceName.trim() 
      }));
      
      if (updateReservationSource.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to update reservation source";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onReservationSourceUpdated();
      onClose();
      toast.success(`Reservation source updated to "${sourceName}"`);
    } catch (error) {
      const errorMessage = "Failed to update reservation source";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Update reservation source failed:", error);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const errorMessage = localError || updateError;
  const hasChanges = source && sourceName.trim() !== source.reservationSource;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Reservation Source</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Current Source Info */}
          {source && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Updating Reservation Source:</p>
              <p className="text-sm text-muted-foreground">
                Source ID: {source.reservationSourceID}
              </p>
              <p className="text-sm text-muted-foreground">
                Current Name: "{source.reservationSource}"
              </p>
            </div>
          )}

          {/* Source Name Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceName" className="required">
                Reservation Source Name
              </Label>
              <Input
                id="sourceName"
                name="sourceName"
                placeholder="e.g., Website, Walk-in, OTA, Phone, Email"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                disabled={updating || !source}
                className="w-full"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Update the reservation source name
              </p>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
                {errorMessage}
              </div>
            )}

            {/* No Changes Warning */}
            {source && !hasChanges && sourceName.trim() && (
              <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
                No changes made to the reservation source name.
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
              disabled={updating || !source || !sourceName.trim() || !hasChanges}
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
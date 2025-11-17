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
  createReservationSource,
  selectCreateReservationSourceLoading,
  selectCreateReservationSourceError,
} from "@/redux/slices/createReservationSourceSlice";

interface AddReservationSourceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onReservationSourceCreated: () => void;
}

export function AddReservationSourceDrawer({
  isOpen,
  onClose,
  onReservationSourceCreated,
}: AddReservationSourceDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectCreateReservationSourceLoading);
  const createError = useSelector(selectCreateReservationSourceError);

  const [sourceName, setSourceName] = useState("");
  const [localError, setLocalError] = useState("");

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setSourceName("");
      setLocalError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!sourceName.trim()) {
      setLocalError("Reservation source name is required");
      return;
    }

    try {
      const action = await dispatch(createReservationSource({ 
        reservationSource: sourceName.trim() 
      }));
      
      if (createReservationSource.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to create reservation source";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onReservationSourceCreated();
      onClose();
      toast.success(`Reservation source "${sourceName}" created successfully`);
    } catch (error) {
      const errorMessage = "Failed to create reservation source";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Create reservation source failed:", error);
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
          <SheetTitle>Create Reservation Source</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
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
                disabled={creating}
                className="w-full"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Enter a descriptive name for the reservation source (e.g., "Website", "Walk-in", "OTA")
              </p>
            </div>

            {/* Examples */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Common Examples:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Website / Online Booking</li>
                <li>• Walk-in / Front Desk</li>
                <li>• OTA (Online Travel Agency)</li>
                <li>• Phone Reservation</li>
                <li>• Email Reservation</li>
                <li>• Travel Agent</li>
                <li>• Corporate Booking</li>
              </ul>
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
              disabled={creating || !sourceName.trim()}
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
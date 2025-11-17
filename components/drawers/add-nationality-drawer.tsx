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
  createNationalityMas,
  selectCreateNationalityMasLoading,
  selectCreateNationalityMasError,
} from "@/redux/slices/createNationalityMasSlice";

interface AddNationalityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNationalityCreated: () => void;
}

export function AddNationalityDrawer({
  isOpen,
  onClose,
  onNationalityCreated,
}: AddNationalityDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectCreateNationalityMasLoading);
  const createError = useSelector(selectCreateNationalityMasError);

  const [nationalityData, setNationalityData] = useState({
    nationality: "",
    countryCode: "",
    country: "",
  });
  const [localError, setLocalError] = useState("");

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setNationalityData({
        nationality: "",
        countryCode: "",
        country: "",
      });
      setLocalError("");
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof typeof nationalityData, value: string) => {
    setNationalityData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!nationalityData.nationality.trim()) {
      setLocalError("Nationality is required");
      return;
    }

    if (!nationalityData.country.trim()) {
      setLocalError("Country is required");
      return;
    }

    const username = localStorage.getItem("rememberedUsername") || "unknown";

    try {
      const action = await dispatch(
        createNationalityMas({
          nationality: nationalityData.nationality.trim(),
          country: nationalityData.country.trim(),
          countryCode: nationalityData.countryCode.trim(),
        })
      );
      
      if (createNationalityMas.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to create nationality";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onNationalityCreated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to create nationality";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Create nationality failed:", error);
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
          <SheetTitle>Create Nationality</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Nationality Field */}
          <div className="space-y-2">
            <Label htmlFor="nationality" className="required">Nationality *</Label>
            <Input
              id="nationality"
              placeholder="Enter nationality (e.g., American, British)"
              value={nationalityData.nationality}
              onChange={(e) => handleInputChange("nationality", e.target.value)}
              disabled={creating}
              className="w-full"
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              The nationality name (e.g., "American", "British", "Japanese")
            </p>
          </div>

          {/* Country Field */}
          <div className="space-y-2">
            <Label htmlFor="country" className="required">Country *</Label>
            <Input
              id="country"
              placeholder="Enter country name (e.g., United States, United Kingdom)"
              value={nationalityData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              disabled={creating}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              The full country name that corresponds to the nationality
            </p>
          </div>

          {/* Country Code Field */}
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country Code</Label>
            <Input
              id="countryCode"
              placeholder="Enter country code (e.g., US, UK, JP)"
              value={nationalityData.countryCode}
              onChange={(e) => handleInputChange("countryCode", e.target.value)}
              disabled={creating}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Optional 2-3 letter country code (ISO standard)
            </p>
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
              disabled={creating || !nationalityData.nationality.trim() || !nationalityData.country.trim()}
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
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
  updateNationalityMas,
  selectUpdateNationalityMasLoading,
  selectUpdateNationalityMasError,
} from "@/redux/slices/updateNationalityMasSlice";

interface NationalityUI {
  nationalityID: number;
  nationality: string;
  countryCode: string;
  country: string;
}

interface UpdateNationalityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nationality: NationalityUI | null;
  onNationalityUpdated: () => void;
}

export function UpdateNationalityDrawer({
  isOpen,
  onClose,
  nationality,
  onNationalityUpdated,
}: UpdateNationalityDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateNationalityMasLoading);
  const updateError = useSelector(selectUpdateNationalityMasError);

  const [nationalityData, setNationalityData] = useState({
    nationality: "",
    countryCode: "",
    country: "",
  });
  const [localError, setLocalError] = useState("");

  // Reset form when nationality changes or drawer opens
  useEffect(() => {
    if (nationality && isOpen) {
      setNationalityData({
        nationality: nationality.nationality,
        countryCode: nationality.countryCode,
        country: nationality.country,
      });
      setLocalError("");
    }
  }, [nationality, isOpen]);

  const handleInputChange = (field: keyof typeof nationalityData, value: string) => {
    // Prevent changing nationality field
    if (field === 'nationality') {
      return; // Do nothing when trying to change nationality
    }
    setNationalityData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!nationality) {
      setLocalError("No nationality selected for update");
      return;
    }

    if (!nationalityData.country.trim()) {
      setLocalError("Country is required");
      return;
    }

    const hasChanges = 
      nationalityData.country.trim() !== nationality.country ||
      nationalityData.countryCode.trim() !== nationality.countryCode;

    if (!hasChanges) {
      setLocalError("No changes detected");
      return;
    }

    const username = localStorage.getItem("rememberedUsername") || "unknown";

    try {
      const action = await dispatch(
        updateNationalityMas({
          nationality: nationalityData.nationality.trim(), // Keep original nationality
          country: nationalityData.country.trim(),
          countryCode: nationalityData.countryCode.trim(),
        })
      );
      
      if (updateNationalityMas.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to update nationality";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      onNationalityUpdated();
      onClose();
    } catch (error) {
      const errorMessage = "Failed to update nationality";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error("Update nationality failed:", error);
    }
  };

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const errorMessage = localError || updateError;
  const hasChanges = nationality && (
    nationalityData.country.trim() !== nationality.country ||
    nationalityData.countryCode.trim() !== nationality.countryCode
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Nationality</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Current Nationality Info */}
          {nationality && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Updating Nationality:</p>
              <p className="text-sm text-muted-foreground">
                ID: {nationality.nationalityID}
              </p>
            </div>
          )}

          {/* Nationality Field - DISABLED */}
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={nationalityData.nationality}
              disabled={true} // Always disabled for update
              className="w-full bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Nationality cannot be changed once created
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
              disabled={updating || !nationality}
              className="w-full"
              autoFocus
            />
          </div>

          {/* Country Code Field */}
          <div className="space-y-2">
            <Label htmlFor="countryCode">Country Code</Label>
            <Input
              id="countryCode"
              placeholder="Enter country code (e.g., US, UK, JP)"
              value={nationalityData.countryCode}
              onChange={(e) => handleInputChange("countryCode", e.target.value)}
              disabled={updating || !nationality}
              className="w-full"
            />
          </div>

          {/* Error Display */}
          {errorMessage && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {errorMessage}
            </div>
          )}

          {/* No Changes Warning */}
          {nationality && !hasChanges && nationalityData.country.trim() && (
            <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
              No changes made to the nationality data.
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
              disabled={updating || !nationality || !nationalityData.country.trim() || !hasChanges}
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
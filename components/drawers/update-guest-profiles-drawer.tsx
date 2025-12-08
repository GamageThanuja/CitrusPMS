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
  updateGuestMas,
  selectUpdateGuestMasLoading,
  selectUpdateGuestMasError,
  type GuestMas,
} from "@/redux/slices/updateGuestMasSlice";
import { fetchGuestMas } from "@/redux/slices/fetchGuestMasSlice";

interface GuestProfile {
  guestID: number;
  guestName?: string | null;
  phone?: string | null;
  country?: string | null;
  email?: string | null;
  nic?: string | null;
  dob?: string | null;
  [key: string]: any; // For other fields
}

interface UpdateGuestProfilesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  guest: GuestProfile | null;
  onGuestUpdated: () => void;
}

export function UpdateGuestProfilesDrawer({
  isOpen,
  onClose,
  guest,
  onGuestUpdated,
}: UpdateGuestProfilesDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateGuestMasLoading);
  const updateError = useSelector(selectUpdateGuestMasError);

  // Form state
  const [formData, setFormData] = useState({
    guestName: "",
    phone: "",
    nationality: "",
    email: "",
    nicpp: "",
    dob: "",
  });

  const [localError, setLocalError] = useState("");

  // Reset form when guest changes or drawer opens
  useEffect(() => {
    if (guest && isOpen) {
      const guestName = guest.guestName ?? "";
      const phone = guest.phone ?? "";
      const nationality = guest.country ?? "";
      const email = guest.email ?? "";
      const nicpp = guest.nic ?? guest.ppNo ?? "";
      const dob = guest.dob ? formatDateForInput(guest.dob) : "";
      
      setFormData({
        guestName,
        phone,
        nationality,
        email,
        nicpp,
        dob,
      });
      setLocalError("");
    }
  }, [guest, isOpen]);

  const formatDateForInput = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const hasChanges = () => {
    if (!guest) return false;
    
    return (
      formData.guestName !== (guest.guestName ?? "") ||
      formData.phone !== (guest.phone ?? "") ||
      formData.nationality !== (guest.country ?? "") ||
      formData.email !== (guest.email ?? "") ||
      formData.nicpp !== (guest.nic ?? guest.ppNo ?? "") ||
      formData.dob !== (guest.dob ? formatDateForInput(guest.dob) : "")
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLocalError("");

  if (!guest) {
    setLocalError("No guest selected for update");
    return;
  }

  // Basic validation
  if (!formData.guestName.trim()) {
    setLocalError("Guest name cannot be empty");
    return;
  }

  if (!hasChanges()) {
    setLocalError("No changes detected");
    return;
  }

  try {
    // Map form data to API payload - ONLY include updated fields
    const payload: GuestMas = {
      guestID: guest.guestID,
      guestName: formData.guestName.trim() || null,
      phoneNo: formData.phone.trim() || null,
      nationality: formData.nationality.trim() || null,
      email: formData.email.trim() || null,
      nic: formData.nicpp.trim() || null,
      dob: formData.dob ? new Date(formData.dob).toISOString() : null,
      
      // Only include other required fields that the API expects
      // DO NOT spread the entire guest object
      finAct: guest.finAct ?? true,
      hotelCode: guest.hotelCode ?? null,
      guestCode: guest.guestCode ?? null,
      gender: guest.gender ?? null,
      address: guest.address ?? null,
      city: guest.city ?? null,
      country: formData.nationality.trim() || guest.country || null,
      createdOn: guest.createdOn ?? null,
      isVIP: guest.isVIP ?? null,
      isVeg: guest.isVeg ?? null,
      comment: guest.comment ?? null,
      isDisabled: guest.isDisabled ?? null,
      isAdult: guest.isAdult ?? null,
      isChild: guest.isChild ?? null,
      isInfant: guest.isInfant ?? null,
      ppurl: guest.ppurl ?? null,
      title: guest.title ?? null,
      isWorkPermit: guest.isWorkPermit ?? null,
      bC_Name: guest.bC_Name ?? null,
      bC_Phone: guest.bC_Phone ?? null,
      bC_Email: guest.bC_Email ?? null,
      aC_Name: guest.aC_Name ?? null,
      aC_Phone: guest.aC_Phone ?? null,
      aC_Email: guest.aC_Email ?? null,
      createdBy: guest.createdBy ?? null,
      type: guest.type ?? null,
      countryOfRes: guest.countryOfRes ?? null,
    };

    const action = await dispatch(updateGuestMas(payload));
    
    if (updateGuestMas.rejected.match(action)) {
      const errorMessage = action.payload || "Failed to update guest";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    // Refresh the guest list
    await dispatch(fetchGuestMas());
    onGuestUpdated();
    onClose();
    toast.success("Guest updated successfully");
  } catch (error) {
    const errorMessage = "Failed to update guest";
    setLocalError(errorMessage);
    toast.error(errorMessage);
    console.error("Update guest failed:", error);
  }
};

  const handleClose = () => {
    if (!updating) {
      onClose();
    }
  };

  const errorMessage = localError || updateError;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Guest</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          {/* Current Guest Info */}
          {guest && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Guest ID: {guest.guestID}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Guest ID (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="guestID">Guest ID</Label>
              <Input
                id="guestID"
                name="guestID"
                value={guest?.guestID || ""}
                disabled
                readOnly
                className="w-full bg-gray-50"
              />
            </div>

            {/* Booker Name */}
            <div className="space-y-2">
              <Label htmlFor="guestName">Booker Name *</Label>
              <Input
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                placeholder="Enter guest name"
                disabled={updating || !guest}
                className="w-full"
                autoFocus
              />
            </div>

            {/* Phone No */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone No</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                disabled={updating}
                className="w-full"
              />
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                placeholder="Enter nationality"
                disabled={updating}
                className="w-full"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                disabled={updating}
                className="w-full"
              />
            </div>

            {/* NIC/PP */}
            <div className="space-y-2">
              <Label htmlFor="nicpp">NIC/PP</Label>
              <Input
                id="nicpp"
                name="nicpp"
                value={formData.nicpp}
                onChange={handleInputChange}
                placeholder="Enter NIC or Passport number"
                disabled={updating}
                className="w-full"
              />
            </div>

            {/* DOB */}
            <div className="space-y-2">
              <Label htmlFor="dob">DOB</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                disabled={updating}
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
            {guest && !hasChanges() && (
              <div className="text-sm text-amber-600 border border-amber-200 bg-amber-50 rounded-md p-3">
                No changes made to the guest information.
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
              disabled={updating || !guest || !formData.guestName.trim() || !hasChanges()}
              className="min-w-20 bg-black hover:bg-gray-800"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
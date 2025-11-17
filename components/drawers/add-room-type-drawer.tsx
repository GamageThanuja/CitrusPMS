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

// Redux imports
import {
  createRoomTypeMas,
  selectAddRoomTypeMasLoading,
  selectAddRoomTypeMasError,
} from "@/redux/slices/addRoomTypeMasSlice";

// Props
interface AddRoomTypeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddRoomTypeDrawer({
  isOpen,
  onClose,
  onCreated,
}: AddRoomTypeDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const creating = useSelector(selectAddRoomTypeMasLoading);
  const createError = useSelector(selectAddRoomTypeMasError);

  const [localError, setLocalError] = useState("");

  const [formData, setFormData] = useState({
    roomType: "",
    description: "",
    stOccupancy: "",
    maxOccupancy: "",
    maxAdult: "",
    maxChild: "",
    noOfRooms: "",
    bedType: "",
    roomSize: "",
    shortCode: "",
    glAccountID: "",
    glAccountCode: "",
    mainImageURL: "",
    isVirtualRoom: false,
    seq: "",
  });

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        roomType: "",
        description: "",
        stOccupancy: "",
        maxOccupancy: "",
        maxAdult: "",
        maxChild: "",
        noOfRooms: "",
        bedType: "",
        roomSize: "",
        shortCode: "",
        glAccountID: "",
        glAccountCode: "",
        mainImageURL: "",
        isVirtualRoom: false,
        seq: "",
      });
      setLocalError("");
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    if (!formData.roomType.trim()) return "Room type is required";
    if (!formData.stOccupancy) return "Standard occupancy is required";
    if (!formData.maxOccupancy) return "Max occupancy is required";
    if (!formData.noOfRooms) return "Number of rooms is required";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    const v = validate();
    if (v) {
      setLocalError(v);
      toast.error(v);
      return;
    }

    const username = localStorage.getItem("rememberedUsername") || "unknown";

    const payload = {
      roomType: formData.roomType.trim(),
      description: formData.description.trim(),
      stOccupancy: Number(formData.stOccupancy),
      maxOccupancy: Number(formData.maxOccupancy),
      maxAdult: Number(formData.maxAdult || 0),
      maxChild: Number(formData.maxChild || 0),
      noOfRooms: Number(formData.noOfRooms),
      bedType: formData.bedType.trim(),
      roomSize: formData.roomSize.trim(),
      shortCode: formData.shortCode.trim(),
      glAccountID: Number(formData.glAccountID || 0),
      glAccountCode: formData.glAccountCode.trim(),
      mainImageURL: formData.mainImageURL.trim(),
      isVirtualRoom: formData.isVirtualRoom,
      seq: Number(formData.seq || 0),
      hotelCode: "", // auto-filled by thunk using selectedProperty
      createdBy: username,
      createdOn: new Date().toISOString(),
      cmid: "",
      finAct: true,
    };

    try {
      const action = await dispatch(createRoomTypeMas(payload));

      if (createRoomTypeMas.rejected.match(action)) {
        const msg = (action.payload as string) || "Failed to create room type";
        setLocalError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Room type created successfully!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error("Unexpected error creating room type");
      console.error(err);
    }
  };

  const errorMessage = localError || createError;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Room Type</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">

          {/* Room Type */}
          <div className="space-y-2">
            <Label className="required">Room Type *</Label>
            <Input
              value={formData.roomType}
              onChange={(e) => handleInputChange("roomType", e.target.value)}
              disabled={creating}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={creating}
            />
          </div>

          {/* Numeric Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="required">Std Occupancy *</Label>
              <Input
                type="number"
                value={formData.stOccupancy}
                onChange={(e) => handleInputChange("stOccupancy", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label className="required">Max Occupancy *</Label>
              <Input
                type="number"
                value={formData.maxOccupancy}
                onChange={(e) => handleInputChange("maxOccupancy", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label className="required">No. of Rooms *</Label>
              <Input
                type="number"
                value={formData.noOfRooms}
                onChange={(e) => handleInputChange("noOfRooms", e.target.value)}
                disabled={creating}
              />
            </div>
          </div>

          {/* More fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Adult</Label>
              <Input
                type="number"
                value={formData.maxAdult}
                onChange={(e) => handleInputChange("maxAdult", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Child</Label>
              <Input
                type="number"
                value={formData.maxChild}
                onChange={(e) => handleInputChange("maxChild", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Bed Type</Label>
              <Input
                value={formData.bedType}
                onChange={(e) => handleInputChange("bedType", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Room Size</Label>
              <Input
                value={formData.roomSize}
                onChange={(e) => handleInputChange("roomSize", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Short Code</Label>
              <Input
                value={formData.shortCode}
                onChange={(e) => handleInputChange("shortCode", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label>Main Image URL</Label>
              <Input
                value={formData.mainImageURL}
                onChange={(e) => handleInputChange("mainImageURL", e.target.value)}
                disabled={creating}
              />
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {errorMessage}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
              Cancel
            </Button>

            <Button type="submit" disabled={creating} className="min-w-24">
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

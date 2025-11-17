"use client";

import React, { useState, useEffect } from "react";
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
  updateRoomTypeMas,
  selectUpdateRoomTypeMasLoading,
  selectUpdateRoomTypeMasError,
} from "@/redux/slices/updateRoomTypeMasSlice";

export interface RoomTypeUI {
  roomTypeID: number;
  roomType: string;
  description: string;
  stOccupancy: number;
  maxOccupancy: number;
  hotelCode: string;
  isVirtualRoom: boolean;
  noOfRooms: number;
  shortCode: string;
  maxAdult: number;
  maxChild: number;
  bedType: string;
  roomSize: string;
  createdBy: string;
  createdOn: string;
}

interface UpdateRoomTypeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: RoomTypeUI | null;
  username: string;
  onRoomTypeUpdated: () => void;
}

export function UpdateRoomTypeDrawer({
  isOpen,
  onClose,
  roomType,
  username,
  onRoomTypeUpdated,
}: UpdateRoomTypeDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const updating = useSelector(selectUpdateRoomTypeMasLoading);
  const updateError = useSelector(selectUpdateRoomTypeMasError);

  const [roomData, setRoomData] = useState({
    roomType: "",
    description: "",
    stOccupancy: "",
    maxOccupancy: "",
    hotelCode: "",
    isVirtualRoom: false,
    noOfRooms: "",
    shortCode: "",
    maxAdult: "",
    maxChild: "",
    bedType: "",
    roomSize: "",
  });

  const [localError, setLocalError] = useState("");

  // Reset form when roomType changes or drawer opens
  useEffect(() => {
    if (roomType && isOpen) {
      setRoomData({
        roomType: roomType.roomType,
        description: roomType.description,
        stOccupancy: roomType.stOccupancy.toString(),
        maxOccupancy: roomType.maxOccupancy.toString(),
        hotelCode: roomType.hotelCode,
        isVirtualRoom: roomType.isVirtualRoom,
        noOfRooms: roomType.noOfRooms.toString(),
        shortCode: roomType.shortCode,
        maxAdult: roomType.maxAdult.toString(),
        maxChild: roomType.maxChild.toString(),
        bedType: roomType.bedType,
        roomSize: roomType.roomSize,
      });
      setLocalError("");
    }
  }, [roomType, isOpen]);

  const handleInputChange = (
    field: keyof typeof roomData,
    value: string | boolean
  ) => {
    setRoomData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!roomType) {
      setLocalError("No room type selected for update");
      return;
    }

    if (!roomData.hotelCode.trim()) {
      setLocalError("Hotel Code is required");
      return;
    }

    const hasChanges =
      roomData.roomType !== roomType.roomType ||
      roomData.description !== roomType.description ||
      Number(roomData.stOccupancy) !== roomType.stOccupancy ||
      Number(roomData.maxOccupancy) !== roomType.maxOccupancy ||
      roomData.hotelCode.trim() !== roomType.hotelCode ||
      roomData.isVirtualRoom !== roomType.isVirtualRoom ||
      Number(roomData.noOfRooms) !== roomType.noOfRooms ||
      roomData.shortCode !== roomType.shortCode ||
      Number(roomData.maxAdult) !== roomType.maxAdult ||
      Number(roomData.maxChild) !== roomType.maxChild ||
      roomData.bedType !== roomType.bedType ||
      roomData.roomSize !== roomType.roomSize;

    if (!hasChanges) {
      setLocalError("No changes detected");
      return;
    }

    const now = new Date().toISOString();

    const payload = {
      ...roomType,
      roomType: roomData.roomType,
      description: roomData.description,
      stOccupancy: Number(roomData.stOccupancy),
      maxOccupancy: Number(roomData.maxOccupancy),
      hotelCode: roomData.hotelCode.trim(),
      isVirtualRoom: roomData.isVirtualRoom,
      noOfRooms: Number(roomData.noOfRooms),
      shortCode: roomData.shortCode,
      maxAdult: Number(roomData.maxAdult),
      maxChild: Number(roomData.maxChild),
      bedType: roomData.bedType,
      roomSize: roomData.roomSize,
      createdBy: roomType.createdBy,
      createdOn: roomType.createdOn,
      lastUpdatedBy: username || "system",
      lastUpdatedOn: now,
    };

    try {
      const action = await dispatch(updateRoomTypeMas(payload));
      if (updateRoomTypeMas.rejected.match(action)) {
        const errorMessage = action.payload || "Failed to update room type";
        setLocalError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      onRoomTypeUpdated();
      onClose();
      toast.success("Room type updated successfully");
    } catch (error) {
      const errorMessage = "Failed to update room type";
      setLocalError(errorMessage);
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleClose = () => {
    if (!updating) onClose();
  };

  const errorMessage = localError || updateError;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Room Type</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-6">
          {roomType && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Updating Room Type:</p>
              <p className="text-sm text-muted-foreground">
                ID: {roomType.roomTypeID} | Hotel: {roomType.hotelCode}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomType" className="required">
                Room Type *
              </Label>
              <Input
                id="roomType"
                value={roomData.roomType}
                onChange={(e) => handleInputChange("roomType", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={roomData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stOccupancy">Standard Occupancy</Label>
              <Input
                id="stOccupancy"
                type="number"
                value={roomData.stOccupancy}
                onChange={(e) => handleInputChange("stOccupancy", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxOccupancy">Max Occupancy</Label>
              <Input
                id="maxOccupancy"
                type="number"
                value={roomData.maxOccupancy}
                onChange={(e) => handleInputChange("maxOccupancy", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hotelCode" className="required">
                Hotel Code *
              </Label>
              <Input
                id="hotelCode"
                value={roomData.hotelCode}
                onChange={(e) => handleInputChange("hotelCode", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noOfRooms">Number of Rooms</Label>
              <Input
                id="noOfRooms"
                type="number"
                value={roomData.noOfRooms}
                onChange={(e) => handleInputChange("noOfRooms", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAdult">Max Adult</Label>
              <Input
                id="maxAdult"
                type="number"
                value={roomData.maxAdult}
                onChange={(e) => handleInputChange("maxAdult", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxChild">Max Child</Label>
              <Input
                id="maxChild"
                type="number"
                value={roomData.maxChild}
                onChange={(e) => handleInputChange("maxChild", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedType">Bed Type</Label>
              <Input
                id="bedType"
                value={roomData.bedType}
                onChange={(e) => handleInputChange("bedType", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomSize">Room Size</Label>
              <Input
                id="roomSize"
                value={roomData.roomSize}
                onChange={(e) => handleInputChange("roomSize", e.target.value)}
                disabled={updating || !roomType}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
              {errorMessage}
            </div>
          )}

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
              disabled={updating || !roomType || !roomData.roomType.trim()}
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

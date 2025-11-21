"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import {
  fetchReasonsByCategory,
  selectReasonsItems,
  selectReasonsLoading,
  selectReasonsError,
} from "@/redux/slices/reasonsByCategorySlice";
import {
  fetchRoomMas,
  selectRoomMas,
  selectRoomMasLoading,
  selectRoomMasError,
} from "@/redux/slices/roomMasSlice";
import { changeRoom } from "@/redux/slices/roomChangeSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface RoomChangeDrawerProps {
  bookingDetail: {
    reservationNo?: string;
    reservationDetailID?: number;
    checkIn?: string;
    status?: string;
  };
  onClose: () => void;
  isOpen?: boolean;
  onRoomChange: (newRoomNumber: string) => void;
}

export function RoomChangeDrawer({
  bookingDetail,
  onClose,
  onRoomChange,
}: RoomChangeDrawerProps) {
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useAppDispatch();

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  // 🔹 reasons slice
  const allReasons = useAppSelector(selectReasonsItems);
  const reasonsLoading = useAppSelector(selectReasonsLoading);
  const reasonsError = useAppSelector(selectReasonsError);

  // 🔹 roomMas slice
  const roomMasItems = useAppSelector(selectRoomMas);
  const roomMasLoading = useAppSelector(selectRoomMasLoading);
  const roomMasError = useAppSelector(selectRoomMasError);

  // Derived dropdown options from roomMas
  const roomOptions = useMemo(
    () =>
      roomMasItems.map((room) => ({
        roomNo: room.roomNumber,
        roomId: room.roomID,
      })),
    [roomMasItems]
  );

  // Filter only "Room-Change" reasons
  const roomChangeReasons = allReasons.filter(
    (r) => r.category === "Room-Change"
  );

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  console.log("Booking Detail in the room change drawer:", bookingDetail);

  // 🔹 fetch reasons via Redux
  useEffect(() => {
    dispatch(fetchReasonsByCategory({ category: "Room-Change" }));
  }, [dispatch]);

  useEffect(() => {
    if (reasonsError) {
      console.error("Failed to fetch room change reasons:", reasonsError);
    }
  }, [reasonsError]);

  // 🔹 fetch room numbers via roomMas Redux slice
  useEffect(() => {
    dispatch(fetchRoomMas());
  }, [dispatch]);

  useEffect(() => {
    if (roomMasError) {
      console.error("Failed to fetch room list:", roomMasError);
    }
  }, [roomMasError]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newRoomNumber.trim() || !bookingDetail.reservationDetailID) return;

  setIsSubmitting(true);

  try {
    const selectedRoom = roomOptions.find(
      (room) => room.roomNo === newRoomNumber
    );
    if (!selectedRoom) {
      console.error("Selected room not found");
      return;
    }

    const newRoomId = selectedRoom.roomId;

    const payload = {
      reservationDetailId: bookingDetail.reservationDetailID,
      newRoomId,
      browserTime: systemDate,
      // reasonId: selectedReason ? Number(selectedReason) : undefined
    };

    console.log("[RoomChange Redux] Payload:", payload);

    // 🔥 USE REDUX changeRoom API — replaces inline fetch
    const response = await dispatch(changeRoom(payload)).unwrap();

    console.log("🔥 Room change success via Redux:", response);

    // Update UI in parent
    onRoomChange(newRoomNumber);

    // Close drawer
    onClose();
  } catch (err: any) {
    console.error("❌ Room change failed:", err);
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="bg-white dark:bg-black dark:text-white text-black py-8 px-6 min-h-full">
      <div className="max-w-lg mx-auto">
        <div className="px-0">
          <div>
            <h2 className="text-lg font-semibold">Room Change</h2>
            <hr className="mt-2 border-x-gray-300" />
          </div>
        </div>
        <div className="mt-4 rounded-md border border-gray-400 bg-gray-50 px-6 py-4 dark:bg-black dark:text-white">
          <div className="mb-4 dark:bg-black dark:text-white">
            <p className="text-xs text-muted-foreground mb-1">
              Reservation No:{" "}
              <span className="font-medium">
                {bookingDetail?.reservationNo || "—"}
              </span>
            </p>
            <p className="text-sm text-foreground">
              Do you want to change the room for this guest?
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-6 dark:bg-black dark:text-white">
              <Label
                htmlFor="newRoom"
                className="block text-sm font-medium mb-1"
              >
                New Room Number
              </Label>
              <select
                id="newRoom"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 dark:bg-black dark:text-white"
              >
                <option value="">
                  {roomMasLoading ? "Loading rooms..." : "Select a room number"}
                </option>
                {roomOptions.map((room) => (
                  <option key={room.roomId} value={room.roomNo}>
                    {room.roomNo}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <Label
                htmlFor="reason"
                className="block text-sm font-medium mb-1"
              >
                Reason for Room Change
              </Label>
              <select
                id="reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-gray-100 border border-gray-300 rounded-md p-2 dark:bg-black dark:text-white"
              >
                <option value="">
                  {reasonsLoading ? "Loading reasons..." : "Select a reason"}
                </option>
                {roomChangeReasons.map((reason) => (
                  <option key={reason.id} value={reason.id.toString()}>
                    {reason.reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 mt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !newRoomNumber.trim() ||
                  isSubmitting ||
                  reasonsLoading ||
                  roomMasLoading
                }
              >
                {isSubmitting ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </form>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Change the room for this booking. This will update the booking and
          notify the guest.
        </p>
      </div>
    </div>
  );
}
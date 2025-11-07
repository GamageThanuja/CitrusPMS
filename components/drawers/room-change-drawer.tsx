"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getReasons } from "@/controllers/reasonsMasterController";
import { getHotelRoomNumbersByHotelId } from "@/controllers/hotelRoomNumberController";
import { ReasonMasterPayload } from "@/types/reasonsMaster";
import { changeRoomForReservation } from "@/controllers/reservationController"; // Import the API call
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface RoomChangeDrawerProps {
  bookingDetail: {
    reservationNo?: string;
    reservationDetailID?: number;
    checkIn?: string; // Assuming checkIn is a date string in ISO format
    status?: string; // Add status property for checked-in validation
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
  const [roomChangeReasons, setRoomChangeReasons] = useState<
    ReasonMasterPayload[]
  >([]);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomOptions, setRoomOptions] = useState<
    { roomNo: string; roomId: number }[]
  >([]);

  const dispatch = useDispatch();
  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );
  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  console.log("Booking Detail in the room chnage draewr:", bookingDetail);

  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const accessToken = tokens?.accessToken;
        if (!accessToken) {
          console.warn("No access token found");
          return;
        }

        const reasons = await getReasons({ token: accessToken });
        const filtered = reasons.filter((r) => r.category === "Room Change");
        setRoomChangeReasons(filtered);
      } catch (err) {
        console.error("Failed to fetch room change reasons", err);
      }
    };

    fetchReasons();
  }, []);

  useEffect(() => {
    const fetchRoomNumbers = async () => {
      try {
        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const accessToken = tokens?.accessToken;
        const selectedProperty = localStorage.getItem("selectedProperty");
        const property = selectedProperty ? JSON.parse(selectedProperty) : {};
        const hotelId = property.id;

        if (!accessToken || !hotelId) {
          console.warn("Missing token or hotelId");
          return;
        }

        const rooms = await getHotelRoomNumbersByHotelId({
          token: accessToken,
          hotelId,
        });
        setRoomOptions(
          rooms.map((room) => ({
            roomNo: room.roomNo,
            roomId: room.roomID,
          }))
        );

        console.log("aaa", rooms);
      } catch (err) {
        console.error("Failed to fetch hotel room numbers", err);
      }
    };

    fetchRoomNumbers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("submit 1");

    if (newRoomNumber.trim() && bookingDetail.reservationDetailID) {
      setIsSubmitting(true);
      console.log("submit 2");

      try {
        console.log("submit 3");
        const selectedRoom = roomOptions.find(
          (room) => room.roomNo === newRoomNumber
        );
        if (!selectedRoom) {
          console.error("Selected room not found");
          return;
        }

        const newRoomId = selectedRoom.roomId;

        const token = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        )?.accessToken;

        if (token && newRoomId && bookingDetail.reservationDetailID) {
          const payload = {
            reservationDetailId: bookingDetail.reservationDetailID,
            newRoomId: newRoomId,
            browserTime: systemDate,
          };

          console.log("submit 4");
          const response = await fetch(
            `${BASE_URL}/api/Reservation/change-room`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            }
          );

          const result = await response.text(); // Use .json() if the response is JSON

          if (response.ok) {
            console.log("✅ Room change successful:", result);
            onRoomChange({
              reservationDetailId: bookingDetail.reservationDetailID!,
              newRoomId,
              newRoomNo: selectedRoom.roomNo,
              reasonId: selectedReason ? Number(selectedReason) : undefined,
            });
            console.log("submit 6");
          } else {
            console.error("❌ Room change failed:", response.status, result);
          }
        }

        onRoomChange(newRoomNumber);
        onClose();
      } catch (err) {
        console.error("🚨 Error changing room:", err);
      } finally {
        setIsSubmitting(false);
      }
      console.log("submit 5");
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
                <option value="">Select a room number</option>
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
                <option value="">Select a reason</option>
                {roomChangeReasons.map((reason) => (
                  <option
                    key={reason.reasonId}
                    value={reason.reasonId.toString()}
                  >
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
                disabled={!newRoomNumber.trim() || isSubmitting}
              >
                Confirm
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

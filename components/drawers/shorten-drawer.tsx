"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { shortenReservation } from "@/redux/slices/shortenReservationSlice";
import { useAppDispatch } from "@/redux/hooks";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function ShortenDrawer({ bookingDetail, open, onClose, onShorten }) {
  const [newDate, setNewDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [groupRooms, setGroupRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [singleRoomMeta, setSingleRoomMeta] = useState(null);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (open) {
      setNewDate("");
      setFeedbackMessage(null);
      const fetchGroupRooms = async () => {
        try {
          const token = JSON.parse(localStorage.getItem("hotelmateTokens"));
          const res = await fetch(
            `${BASE_URL}/api/Reservation/${bookingDetail.reservationID}`,
            {
              headers: {
                Authorization: `Bearer ${token?.accessToken}`,
              },
            }
          );
          const data = await res.json();
          const rooms = data.rooms || [];

          if (rooms.length > 1) {
            setGroupRooms(rooms);
            setSelectedRoomIds(rooms.map((r) => r.reservationDetailID));
            setIsGroup(true);
          } else {
            setSingleRoomMeta(rooms[0] || null);
            setIsGroup(false);
          }
        } catch (err) {
          console.error("Error loading group rooms:", err);
        }
      };

      fetchGroupRooms();
    }
  }, [open, bookingDetail]);

  const bookingData = bookingDetail;

  const minDate = bookingData?.checkIn
    ? (() => {
        const min = new Date(bookingData.checkIn);
        min.setDate(min.getDate() + 1); // Ensure 1 night minimum
        return min.toISOString().split("T")[0];
      })()
    : "";

  const maxDate = bookingData?.checkOut
    ? (() => {
        const max = new Date(bookingData.checkOut);
        max.setDate(max.getDate() - 1); // Can't select current checkout
        return max.toISOString().split("T")[0];
      })()
    : "";

  const resolveRoomId = (room, a, b) =>
    room?.roomID ??
    room?.roomId ??
    a?.roomID ??
    a?.roomId ??
    b?.roomID ??
    b?.roomId ??
    null;

  const resolveDetailId = (room, a, b) =>
    room?.reservationDetailID ??
    a?.reservationDetailID ??
    b?.reservationDetailID ??
    null;

  const resolveMealPlan = (room, b) => room?.basis ?? b?.mealPlan ?? "BB";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newDate || !bookingData) {
      setFeedbackMessage({
        type: "error",
        message: "Please select a new checkout date",
      });
      return;
    }

    const newCheckOutDate = new Date(newDate);
    const checkInDate = new Date(bookingData.checkIn);
    const checkOutDate = new Date(bookingData.checkOut);

    if (newCheckOutDate <= checkInDate) {
      setFeedbackMessage({
        type: "error",
        message: "New checkout date must be after the check-in date",
      });
      return;
    }

    if (newCheckOutDate >= checkOutDate) {
      setFeedbackMessage({
        type: "error",
        message: "New checkout date must be before the current checkout date",
      });
      return;
    }

    if (newCheckOutDate - checkInDate < ONE_DAY_MS) {
      toast.error("Reservation must be at least 1 night.");
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const accessToken = tokens.accessToken;
      const hotelCode = selectedProperty.hotelCode;

      const roomsToShorten = isGroup
        ? groupRooms.filter((r) =>
            selectedRoomIds.includes(r.reservationDetailID)
          )
        : [bookingData];

      await Promise.all(
        roomsToShorten.map((room) => {
          const payload = {
            reservationDetailId:
              resolveDetailId(room, bookingData, singleRoomMeta) || 0,
            reservationMasterId: bookingData.reservationID || 0,
            roomId: resolveRoomId(room, bookingData, singleRoomMeta) || 0,
            newCheckOutDate: new Date(newDate).toISOString(),
            oldCheckOutDate: new Date(
              room.checkOUT || bookingData.checkOut
            ).toISOString(),
            hotelCode: hotelCode.toString(),
            mealPlan: resolveMealPlan(room, bookingData),
          };
          console.log(
            "[shortenReservation] Payload:",
            JSON.stringify(payload, null, 2)
          );
          return dispatch(shortenReservation(payload)).unwrap();
        })
      );

      const formattedDate = new Date(newDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      toast("Stay shortened successfully!", {
        description: formattedDate,
        className: "bg-background border border-border text-center",
        duration: 3000,
      });

      onShorten(newDate);
      onClose();
    } catch (error) {
      console.error("❌ Error in shorten stay:", error);
      setFeedbackMessage({ type: "error", message: "Error shortening stay." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="
          z-[120]
          w-full sm:max-w-2xl h-full overflow-hidden rounded-l-2xl
          bg-white text-gray-900
          dark:bg-neutral-900 dark:text-white
        "
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Shorten Stay</SheetTitle>
        </SheetHeader>
        <ScrollArea className="p-4 space-y-4">
          {feedbackMessage && (
            <div className="p-3 rounded-md flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <span>{feedbackMessage.message}</span>
            </div>
          )}

          {isGroup && groupRooms.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Group Reservation Rooms
              </h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Select rooms to shorten:</span>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoomIds.length === groupRooms.length}
                    onChange={(e) => {
                      setSelectedRoomIds(
                        e.target.checked
                          ? groupRooms.map((r) => r.reservationDetailID)
                          : []
                      );
                    }}
                  />
                  <span className="ml-2">Select All</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupRooms.map((room) => (
                  <div
                    key={room.reservationDetailID}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedRoomIds.includes(room.reservationDetailID)
                        ? "bg-white border-white dark:bg-black dark:text-white"
                        : "bg-white dark:bg-black dark:text-white"
                    }`}
                  >
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedRoomIds.includes(
                          room.reservationDetailID
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoomIds((prev) => [
                              ...prev,
                              room.reservationDetailID,
                            ]);
                          } else {
                            setSelectedRoomIds((prev) =>
                              prev.filter(
                                (id) => id !== room.reservationDetailID
                              )
                            );
                          }
                        }}
                      />
                      <div className="text-sm">
                        <p className="font-semibold">
                          Room {room.roomNumber} – {room.roomType}
                        </p>
                        <p className="text-gray-500">
                          Guest: {room.guest1 || "N/A"}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="shortenTill">
                Shorten Till (Date) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shortenTill"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={minDate}
                max={maxDate}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Must be between check-in and current check-out date
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "PROCESSING..." : "SHORTEN STAY"}
            </Button>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

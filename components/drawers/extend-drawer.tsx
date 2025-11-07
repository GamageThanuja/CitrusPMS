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
import { getAllCurrencies } from "@/controllers/AllCurrenciesController";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  extendReservation,
  resetExtendReservationState,
} from "@/redux/slices/extendReservationSlice";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function ExtendDrawer({ bookingDetail, open, onClose, onExtend }) {
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector(
    (state) => state.extendReservation
  );

  const [extendTill, setExtendTill] = useState("");
  const [rate, setRate] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [groupRooms, setGroupRooms] = useState([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [singleRoomMeta, setSingleRoomMeta] = useState(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const data = await getAllCurrencies();
        setCurrencies(data);
        setSelectedCurrency(data?.[0]?.currencyCode || "");
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
      }
    };

    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (open && bookingDetail) {
      dispatch(resetExtendReservationState());
      setRate(
        bookingDetail.amount
          ? parseFloat(bookingDetail.amount.replace(/[^0-9.]/g, "")).toString()
          : ""
      );
      setExtendTill("");
      setFeedbackMessage(null);

      // Fetch group rooms if any
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
  }, [open, bookingDetail, dispatch]);

  useEffect(() => {
    if (success) {
      toast("Stay extended successfully!", {
        description: new Date(extendTill).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        className: "bg-background border border-border text-center",
        duration: 3000,
      });

      onExtend(extendTill, rate);
      onClose();
    }
  }, [success]);

  // put this inside the component (above handleSubmit)
  const resolveRoomId = (room, fallbackA, fallbackB) =>
    room?.roomID ??
    room?.roomId ??
    fallbackA?.roomID ??
    fallbackA?.roomId ??
    fallbackB?.roomID ??
    fallbackB?.roomId ??
    null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!extendTill || !rate) {
      setFeedbackMessage({
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    const currentCheckout = new Date(bookingDetail.checkOut);
    const newCheckout = new Date(extendTill);
    if (newCheckout <= currentCheckout) {
      setFeedbackMessage({
        type: "error",
        message: "Extension date must be after the current checkout date",
      });
      return;
    }

    const rateValue = parseFloat(rate);
    if (isNaN(rateValue)) {
      setFeedbackMessage({
        type: "error",
        message: "Please enter a valid rate amount",
      });
      return;
    }

    setFeedbackMessage(null);

    const hotelCode = JSON.parse(
      localStorage.getItem("selectedProperty")
    )?.hotelCode;

    try {
      const roomsToExtend = isGroup
        ? groupRooms.filter((r) =>
            selectedRoomIds.includes(r.reservationDetailID)
          )
        : [bookingDetail];

      // Run each room extension, log payload & response, and toast success/error
      const results = await Promise.allSettled(
        roomsToExtend.map(async (room) => {
          // for single reservations, room === bookingDetail; fall back to singleRoomMeta
          const roomId = resolveRoomId(room, singleRoomMeta, bookingDetail);

          if (!roomId) {
            const msg = `Missing roomId for reservationDetailID ${
              room?.reservationDetailID ?? "unknown"
            }`;
            console.error("[ExtendReservation] " + msg, {
              room,
              singleRoomMeta,
              bookingDetail,
            });
            throw new Error(msg);
          }

          const payload = {
            reservationDetailId: Number(
              room.reservationDetailID ?? bookingDetail.reservationDetailID
            ),
            reservationMasterId: Number(bookingDetail.reservationID),
            roomId: Number(roomId), // ✅ now present for single + group
            newCheckOutDate: new Date(extendTill).toISOString(),
            oldCheckOutDate: new Date(
              room.checkOUT || bookingDetail.checkOut
            ).toISOString(),
            hotelCode: Number(
              JSON.parse(localStorage.getItem("selectedProperty"))?.hotelCode
            ),
            rate: Number(rate),
            currencyCode: selectedCurrency,
            mealPlan: room.basis || bookingDetail.mealPlan || "BB",
          };

          console.log(
            "[ExtendReservation] Payload:",
            JSON.stringify(payload, null, 2)
          );
          const response = await dispatch(extendReservation(payload)).unwrap();
          console.log(
            "[ExtendReservation] Backend response:",
            typeof response === "object"
              ? JSON.stringify(response, null, 2)
              : response
          );

          toast.success(`Extended room ${room.roomNumber || roomId}`, {
            description:
              (response &&
                (response.message || response.status || "Success")) ||
              "Success",
            className: "bg-background border border-border text-center",
            duration: 2500,
          });

          return { ok: true, room, response };
        })
      );

      const failures = results.filter((r) => r.status === "rejected");
      const partialErrors = results
        .filter((r) => r.status === "rejected")
        .map((r) => r.reason);

      // ❌ Toast errors (per failure) + log details
      failures.forEach((f, idx) => {
        console.error("[ExtendReservation] Failed:", partialErrors[idx]);
        toast.error("Failed to extend a room", {
          description:
            typeof partialErrors[idx] === "string"
              ? partialErrors[idx]
              : partialErrors[idx]?.message || "Unknown error",
          className: "bg-background border border-border text-center",
          duration: 3500,
        });
      });

      // If all succeeded, keep your original success UX
      if (failures.length === 0) {
        toast("Stay extended successfully!", {
          description: new Date(extendTill).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          className: "bg-background border border-border text-center",
          duration: 3000,
        });

        onExtend({
          // if group, send all detail IDs you extended
          reservationDetailIDs: roomsToExtend.map((r) =>
            Number(r.reservationDetailID ?? bookingDetail.reservationDetailID)
          ),
          newCheckOutISO: new Date(extendTill).toISOString(),
          rate: rateValue,
          currencyCode: selectedCurrency,
        });
        onClose();
      } else {
        // Show a banner message too (keeps your existing UI pattern)
        setFeedbackMessage({
          type: "error",
          message: `Extended ${results.length - failures.length} room(s). ${
            failures.length
          } failed. Check console for details.`,
        });
      }
    } catch (err) {
      // This catch is for unexpected top-level errors
      console.error("❌ Unexpected error while extending:", err);
      setFeedbackMessage({
        type: "error",
        message:
          typeof err === "string"
            ? err
            : err?.message || "Failed to extend stay.",
      });
      toast.error("Failed to extend stay.", {
        description:
          typeof err === "string" ? err : err?.message || "Unknown error",
        className: "bg-background border border-border text-center",
        duration: 3500,
      });
    }
  };

  const minExtendDate = bookingDetail?.checkOut
    ? new Date(new Date(bookingDetail.checkOut).getTime() + 86400000)
        .toISOString()
        .split("T")[0]
    : new Date().toISOString().split("T")[0];

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
          <SheetTitle>Extend Stay</SheetTitle>
        </SheetHeader>
        <ScrollArea className="p-4 space-y-4 h-[calc(100vh-64px)]">
          {(feedbackMessage || error) && (
            <div className="p-3 rounded-md flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <span>{feedbackMessage?.message || error}</span>
            </div>
          )}

          {isGroup && groupRooms.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Group Reservation Rooms
              </h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Select rooms to extend:</span>
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
                        ? "bg-blue-50 border-blue-400 dark:bg-black dark:text-white"
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
              <Label htmlFor="extendTill">
                Extend Till (Date) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="extendTill"
                type="date"
                value={extendTill}
                onChange={(e) => setExtendTill(e.target.value)}
                min={minExtendDate}
                disabled={loading}
                required
              />
            </div>

            <div>
              <Label htmlFor="roomCharge">
                Room Charge (Per Day – Including Taxes){" "}
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="w-3/4">
                  <Input
                    id="roomCharge"
                    type="text"
                    placeholder="Amount"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="w-1/4">
                  <select
                    className="w-full border rounded-md h-10 px-2"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    disabled={loading}
                  >
                    {currencies.map((currency) => (
                      <option
                        key={currency.currencyId}
                        value={currency.currencyCode}
                      >
                        {currency.currencyCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "PROCESSING..." : "EXTEND STAY"}
            </Button>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

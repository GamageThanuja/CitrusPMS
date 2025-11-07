"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDispatch, useSelector } from "react-redux";
import { fetchReservations } from "@/redux/slices/fetchReservationSlice";

type RoomEntry = {
  reservationDetailID: number;
  roomNumber: string;
  guest1: string;
};

interface RoomSelectorProps {
  onSelect: (room: RoomEntry) => void;
}

const RoomSelector: React.FC<RoomSelectorProps> = ({ onSelect }) => {
  const reservations = useSelector(
    (state: any) => state.reservations.reservations
  );

  const dispatch = useDispatch();

  console.log("reservations room selector :", reservations);

  useEffect(() => {
    const selectedProperty = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = selectedProperty?.id;

    if (hotelId) {
      dispatch(
        fetchReservations({
          hotelId,
          reservationStatusId: 4,
          page: 1,
          pageSize: 10,
        })
      );
    }
  }, [dispatch]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRooms, setFilteredRooms] = useState<RoomEntry[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const allRooms: RoomEntry[] = reservations.flatMap((res: any) =>
      res.rooms.map((room: any) => ({
        reservationDetailID: room.reservationDetailID,
        roomNumber: room.roomNumber,
        guest1: room.guest1,
      }))
    );

    const filtered = allRooms.filter(
      (room) =>
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.guest1.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredRooms(filtered);
  }, [searchTerm, reservations]);

  return (
    <div className="relative w-full">
      <Input
        placeholder="Search Room No / Guest Name"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && (
        <div className="absolute z-50 border rounded shadow w-full max-h-64 overflow-y-auto mt-1 bg-white dark:bg-zinc-900">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-gray-100 dark:bg-zinc-800">
              <tr className="text-gray-900 dark:text-gray-100">
                <th className="border px-2 py-1">Room No</th>
                <th className="border px-2 py-1">Guest Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.length > 0 ? (
                filteredRooms.map((room) => (
                  <tr
                    key={room.reservationDetailID}
                    className="hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-pointer text-gray-800 dark:text-gray-100"
                    onClick={() => {
                      onSelect(room);
                      setSearchTerm(room.roomNumber);
                      setShowDropdown(false);
                    }}
                  >
                    <td className="border px-2 py-1">{room.roomNumber}</td>
                    <td className="border px-2 py-1">{room.guest1}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="text-center py-2 text-gray-600 dark:text-gray-300"
                  >
                    No rooms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RoomSelector;

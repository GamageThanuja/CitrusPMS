"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Filter, LogOut, Search, Download } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslatedText } from "@/lib/translation";
import BookingDetailsDrawer from "@/components/drawers/booking-details-drawer";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";
// import { CancelBookingModal } from "@/components/modals/cancel-booking-modal"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DeparturesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [departures, setDepartures] = useState<any[]>([]);
  const [createdOnDate, setCreatedOnDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [travelAgentFilter, setTravelAgentFilter] = useState("");
  const [fromDate, setFromDate] = useState("2025-06-01");
  const [toDate, setToDate] = useState("2025-06-30");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  useEffect(() => {
    const fetchDepartures = async () => {
      try {
        const stored = localStorage.getItem("selectedProperty");
        const tokens = localStorage.getItem("hotelmateTokens");
        if (!stored || !tokens) return;

        const { id: hotelId } = JSON.parse(stored);
        const { accessToken } = JSON.parse(tokens);

        const res = await fetch(
          `${BASE_URL}/api/Reservation?hotelId=${hotelId}&page=1&pageSize=100`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await res.json();
        const reservations = data.reservations || [];

        const filtered = reservations.flatMap((res: any) =>
          res.rooms
            .filter((room: any) => {
              const statusID =
                room.reservationStatusMaster?.reservationStatusID;
              const status = room.reservationStatusMaster?.reservationStatus;
              const checkOutDate = new Date(room.checkOUT);
              const today = new Date();
              const isCheckOutToday =
                checkOutDate.getUTCFullYear() === today.getUTCFullYear() &&
                checkOutDate.getUTCMonth() === today.getUTCMonth() &&
                checkOutDate.getUTCDate() === today.getUTCDate();
              console.log("DEBUG:", {
                guest: room.guest1,
                checkOutDate: room.checkOUT,
                isCheckOutToday,
                statusID,
                status,
              });
              // Only include guests who are already "Checked-out" or have "Exp.Departure" status and checkout is today
              return isCheckOutToday && statusID === 3;
            })
            .map((room: any) => ({
              id: `${res.reservationID}-${room.reservationDetailID}`,
              guest: room.guest1,
              checkIn: room.checkIN,
              checkOut: room.checkOUT,
              status:
                room.reservationStatusMaster?.reservationStatus ||
                res.status ||
                "Unknown",
              statusColor:
                room.reservationStatusMaster?.reservationStatusColour || "#ccc",
              amount: `${res.totalAmount} ${res.currencyCode}`,
              guests: room.adults + room.child,
              roomId: room.roomID.toString(),
              roomNumber: room.roomNumber,
              roomType: room.roomType,
              phone: res.phone,
              email: res.email,
              idType: "",
              idNumber: "",
              expenses: [],
              revisions: [],
              notes: [],
              reservationID: res.reservationID,
              reservationDetailID: room.reservationDetailID,
              reservationNo: res.reservationNo,
              statusRaw: res.status,
              reservationType: res.type,
              bookerFullName: res.bookerFullName,
              refNo: res.refNo,
              hotelID: res.hotelID,
              hotelName: res.hotelName,
              resCheckIn: res.resCheckIn,
              resCheckOut: res.resCheckOut,
              totalNights: res.totalNights,
              totalRooms: res.totalRooms,
              totalAmount: res.totalAmount,
              currencyCode: res.currencyCode,
              sourceOfBooking: res.sourceOfBooking,
              createdOn: res.createdOn,
              createdBy: res.createdBy,
              lastUpdatedOn: res.lastUpdatedOn,
              lastUpdatedBy: res.lastUpdatedBy,
              isCancelled: res.isCancelled,
              basis: room.basis,
              extraBed: room.extraBed,
              guest2: room.guest2,
              reservationStatus:
                room.reservationStatusMaster?.reservationStatus,
              reservationStatusID:
                room.reservationStatusMaster?.reservationStatusID,
              reservationStatusColour:
                room.reservationStatusMaster?.reservationStatusColour,
            }))
        );

        setDepartures(filtered);
      } catch (err) {
        console.error("Failed to fetch departures:", err);
      }
    };

    fetchDepartures();
  }, []);

  const handleRowClick = (booking: any) => {
    setIsDetailsOpen(false);
    setTimeout(() => {
      setSelectedBooking({ ...booking });
      setIsDetailsOpen(true);
    }, 0);
  };

  const handleCheckOutClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    booking: any
  ) => {
    e.stopPropagation();
    setSelectedBooking({
      ...booking,
      reservationDetailID: booking.reservationDetailID,
      reservationNo: booking.reservationNo,
    });
    setIsDetailsOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Departures</h1>
          <div className="pr-4">
            <VideoButton
              onClick={() => setShowRawOverlay(true)}
              label="Watch Video"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-end">
          <div className="relative">
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 pr-2 py-1 border rounded w-[360px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Status Filter
            </label>
            <Input
              type="text"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Type status to filter"
              className="border px-2 py-1 rounded w-[180px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Travel Agent
            </label>
            <Input
              type="text"
              value={travelAgentFilter}
              onChange={(e) => setTravelAgentFilter(e.target.value)}
              placeholder="Type agent name"
              className="border px-2 py-1 rounded w-[180px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stay From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border px-2 py-1 rounded w-[160px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stay To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border px-2 py-1 rounded w-[160px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Created Date
            </label>
            <Input
              type="date"
              value={createdOnDate}
              onChange={(e) => setCreatedOnDate(e.target.value)}
              className="border px-2 py-1 rounded w-[180px]"
            />
          </div>

          <Button
            variant="default"
            className="bg-black text-white hover:bg-neutral-800 flex items-center gap-2"
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                [
                  "Booking ID,Guest,Room Type,Check In,Check Out,Status,Travel Agent",
                  ...departures.map(
                    (b) =>
                      `"${b.reservationNo}","${b.guest}","${b.roomType}","${b.checkIn}","${b.checkOut}","${b.status}","${b.sourceOfBooking}"`
                  ),
                ].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "departures.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Departures</CardTitle>
          </CardHeader>
          <CardContent>
            {departures.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Stay</TableHead>
                    <TableHead>Travel Agent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departures
                    .filter((b) =>
                      b.guest?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-muted/50 h-9"
                        onClick={() => handleRowClick(booking)}
                      >
                        <TableCell className="font-medium py-1">
                          {booking.reservationNo || booking.refNo || booking.id}
                        </TableCell>
                        <TableCell className="py-1">{booking.guest}</TableCell>
                        <TableCell className="py-1">
                          {booking.roomType}
                        </TableCell>
                        <TableCell className="py-1">{`${format(
                          new Date(booking.checkIn),
                          "MMM dd"
                        )} → ${format(
                          new Date(booking.checkOut),
                          "MMM dd"
                        )}`}</TableCell>
                        <TableCell className="py-1">
                          {booking.sourceOfBooking}
                        </TableCell>
                        <TableCell className="py-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              booking.status === "arrival"
                                ? "bg-indigo-300"
                                : booking.status === "departure"
                                ? "bg-pink-400"
                                : booking.status === "in-house"
                                ? "bg-emerald-400"
                                : ""
                            }`}
                            style={{
                              backgroundColor: [
                                "arrival",
                                "departure",
                                "in-house",
                              ].includes(booking.status)
                                ? undefined
                                : booking.statusColor,
                              color: "#fff",
                            }}
                          >
                            {booking.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No departures scheduled.
              </div>
            )}
          </CardContent>
        </Card>

        <BookingDetailsDrawer
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          bookingDetail={selectedBooking}
          text={{
            bookingDetailsText: "Booking",
            roomDetailsText: "Room Details",
            roomText: "Room",
            totalText: "Total",
            customerDetailsText: "Customer Details",
            nameText: "Name",
            phoneText: "Phone",
            emailText: "Email",
            idTypeText: "ID Type",
            idNumberText: "ID Number",
            notesText: "Notes",
            addNoteText: "Add a note...",
            messageGuestText: "Message Guest",
            expensesText: "Expenses",
            revisionsText: "Revisions",
          }}
          onCancelBookingClick={() => {
            setCancelModalOpen(true);
            setIsDetailsOpen(false);
          }}
        />
        {/* 
        <CancelBookingModal
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          booking={selectedBooking}
          onConfirm={(reason) => {
            console.log("Cancelled booking with reason:", reason);
            // TODO: Add cancellation API call here
          }}
        /> */}
      </div>
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </DashboardLayout>
  );
}

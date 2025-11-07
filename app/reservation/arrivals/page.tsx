// arrivals.tsx
"use client";

import { useState, useEffect } from "react";
import { Filter, LogIn, Search, Download } from "lucide-react";
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
import { format, addDays, startOfToday, parseISO } from "date-fns";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";
import { Checkbox } from "@/components/ui/checkbox";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";
// import { CancelBookingModal } from "@/components/modals/cancel-booking-modal"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ArrivalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [arrivals, setArrivals] = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [travelAgentFilter, setTravelAgentFilter] = useState("");

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [createdOnDate, setCreatedOnDate] = useState("");
  const [expectedOnly, setExpectedOnly] = useState(false);

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

  const dispatch = useDispatch();
  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  console.log("System Date from Redux:", systemDate);

  // useEffect(() => {
  //   if (systemDate) {
  //     const sysDate = new Date(systemDate);
  //     const formattedDate = format(sysDate, "yyyy-MM-dd");
  //     setFromDate(formattedDate);
  //     setToDate(formattedDate);
  //   }
  // }, [systemDate]);

  useEffect(() => {
    if (systemDate) {
      const sysDate = new Date(systemDate);
      const formattedFrom = format(sysDate, "yyyy-MM-dd");
      const formattedTo = format(addDays(sysDate, 1), "yyyy-MM-dd");

      setFromDate(formattedFrom);
      setToDate(formattedTo);

      // IMPORTANT: don't default createdOnDate (leave it blank unless user picks it)
      // setCreatedOnDate(formattedFrom);  ❌ remove this
    }
  }, [systemDate]);
  useEffect(() => {
    const statusMap: Record<number, string> = {
      1: "Confirmed Reservation",
      2: "Tentative",
      3: "Checked-out",
      4: "Checked-in",
      5: "Cancelled",
      6: "No Show",
      7: "No-Show without charge",
      8: "Block",
      9: "OUT OF ORDER",
    };

    // Load selectedProperty and token from localStorage
    if (typeof window !== "undefined") {
      const storedProperty = localStorage.getItem("selectedProperty");
      const storedToken = localStorage.getItem("hotelmateTokens");

      if (storedProperty) {
        setSelectedProperty(JSON.parse(storedProperty));
      }
      if (storedToken) {
        const parsed = JSON.parse(storedToken);
        setToken(parsed.accessToken);
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedProperty || !token) return;

    const fetchArrivals = async () => {
      try {
        const hotelId = selectedProperty.id;
        const res = await fetch(
          `${BASE_URL}/api/Reservation?hotelId=${hotelId}&page=1&pageSize=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        const reservations = data.reservations || [];

        // normalize "today" using yyyy-MM-dd to avoid TZ issues
        const targetDay = systemDate
          ? format(new Date(systemDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd");

        const arrivalsOnly = reservations.flatMap((resv: any) =>
          (resv.rooms || [])
            .filter((room: any) => {
              const statusID =
                room.reservationStatusMaster?.reservationStatusID;
              // Accept Confirmed(1) and already Checked-in(4) arriving today
              if (!statusID || ![1, 4].includes(statusID)) return false;

              // Compare date parts only
              const checkInISO = room.checkIN; // e.g. "2025-09-24T14:00:00Z" or "2025-09-24T00:00:00"
              const checkInDay =
                typeof checkInISO === "string"
                  ? checkInISO.slice(0, 10)
                  : format(new Date(checkInISO), "yyyy-MM-dd");

              return checkInDay === targetDay;
            })
            .map((room: any) => ({
              id: `${resv.reservationID}-${room.reservationDetailID}`,
              guestName: room.guest1,
              checkIn: room.checkIN,
              checkOut: room.checkOUT,
              status:
                room.reservationStatusMaster?.reservationStatus ||
                resv.status ||
                "Unknown",
              statusColor:
                room.reservationStatusMaster?.reservationStatusColour || "#ccc",
              amount: `${resv.totalAmount} ${resv.currencyCode}`,
              guests: room.adults + room.child,
              roomId: room.roomID?.toString(),
              roomNumber: room.roomNumber,
              roomType: room.roomType,
              phone: resv.phone,
              email: resv.email,
              idType: "",
              idNumber: "",
              expenses: [],
              revisions: [],
              notes: [],
              reservationID: resv.reservationID,
              reservationDetailID: room.reservationDetailID,
              reservationNo: resv.reservationNo,
              statusRaw: resv.status,
              reservationType: resv.type,
              bookerFullName: resv.bookerFullName,
              refNo: resv.refNo,
              hotelID: resv.hotelID,
              hotelName: resv.hotelName,
              resCheckIn: resv.resCheckIn,
              resCheckOut: resv.resCheckOut,
              totalNights: resv.totalNights,
              totalRooms: resv.totalRooms,
              totalAmount: resv.totalAmount,
              currencyCode: resv.currencyCode,
              sourceOfBooking: resv.sourceOfBooking,
              createdOn: resv.createdOn,
              createdBy: resv.createdBy,
              lastUpdatedOn: resv.lastUpdatedOn,
              lastUpdatedBy: resv.lastUpdatedBy,
              isCancelled: resv.isCancelled,
              basis: room.basis,
              extraBed: room.extraBed,
              guest2: room.guest2,
              reservationStatus:
                room.reservationStatusMaster?.reservationStatus,
              reservationStatusID:
                room.reservationStatusMaster?.reservationStatusID,
              reservationStatusColour:
                room.reservationStatusMaster?.reservationStatusColour,
              adults: Number(room.adults) || 0,
              child: Number(room.child) || 0,
            }))
        );

        setArrivals(arrivalsOnly);
      } catch (err) {
        console.error("Failed to fetch arrivals:", err);
      }
    };

    fetchArrivals();
  }, [selectedProperty, token, systemDate]);

  const filteredArrivals = arrivals.filter((b) => {
    const guestMatch = b.guestName
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const statusMatch = statusFilter
      ? (b.status || "").toLowerCase().includes(statusFilter.toLowerCase())
      : true;
    const agentMatch = travelAgentFilter
      ? (b.sourceOfBooking || "")
          .toLowerCase()
          .includes(travelAgentFilter.toLowerCase())
      : true;

    const checkInDay =
      typeof b.checkIn === "string"
        ? b.checkIn.slice(0, 10)
        : format(new Date(b.checkIn), "yyyy-MM-dd");

    const inStayRange =
      (!fromDate || checkInDay >= fromDate) && (!toDate || checkInDay < toDate);

    const createdMatch = createdOnDate
      ? (b.createdOn || "").startsWith(createdOnDate)
      : true;

    // NEW: only statusID 1 (Confirmed Reservation) when expectedOnly is checked
    const expectedMatch = expectedOnly ? b.reservationStatusID === 1 : true;

    return (
      guestMatch &&
      statusMatch &&
      agentMatch &&
      inStayRange &&
      createdMatch &&
      expectedMatch
    );
  });

  const totalAdults = filteredArrivals.reduce(
    (sum, b) => sum + (b.adults || 0),
    0
  );
  const totalChildren = filteredArrivals.reduce(
    (sum, b) => sum + (b.child || 0),
    0
  );

  const handleRowClick = (booking: any) => {
    console.log("handleRowClick triggered with booking:", booking);
    setIsDetailsOpen(false);
    setTimeout(() => {
      setSelectedBooking({ ...booking });
      setIsDetailsOpen(true);
    }, 0);
  };

  interface Booking {
    id: string;
    guest: string;
    roomType: string;
    checkIn: string;
    checkOut: string;
    status: string;
    statusColor: string;
    phone: string;
    email: string;
    idType: string;
    idNumber: string;
    expenses: any[];
    revisions: any[];
    notes: any[];
    reservationDetailID?: string | number;
    reservationNo?: string | number;
  }

  const handleCheckInClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    booking: Booking
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
          <h1 className="text-2xl font-bold">Arrivals</h1>
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
                  ...filteredArrivals.map(
                    (b) =>
                      `"${b.reservationNo}","${b.guestName}","${b.roomType}","${b.checkIn}","${b.checkOut}","${b.status}","${b.sourceOfBooking}"`
                  ),
                ].join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "arrivals.csv");
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
          <CardHeader className="flex  justify-between flex-row">
            <CardTitle>Today's Arrivals</CardTitle>
            <div className="flex items-center gap-2 mt-6">
              <Checkbox
                id="expectedOnly"
                checked={expectedOnly}
                onCheckedChange={(v) => setExpectedOnly(Boolean(v))}
              />
              <label htmlFor="expectedOnly" className="text-sm">
                Show only Expected arrivals
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {filteredArrivals.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Room No</TableHead>
                      <TableHead>Stay</TableHead>
                      <TableHead>Adult</TableHead>
                      <TableHead>Child</TableHead>
                      <TableHead>Travel Agent</TableHead>
                      <TableHead>Created On</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArrivals.map((booking) => (
                      <TableRow
                        key={booking.id}
                        className="cursor-pointer hover:bg-muted/50 h-9"
                        onClick={() => handleRowClick(booking)}
                      >
                        <TableCell className="py-1 font-medium">
                          {booking.reservationNo || booking.refNo || booking.id}
                        </TableCell>
                        <TableCell className="py-1">
                          {booking.guestName}
                        </TableCell>
                        <TableCell className="py-1">
                          {booking.roomType}
                        </TableCell>
                        <TableCell className="py-1">
                          {booking.roomNumber || "-"}
                        </TableCell>
                        <TableCell className="py-1">
                          {`${format(
                            new Date(booking.checkIn),
                            "MMM dd"
                          )} → ${format(new Date(booking.checkOut), "MMM dd")}`}
                        </TableCell>
                        <TableCell className="py-1 text-center">
                          {booking.adults}
                        </TableCell>{" "}
                        <TableCell className="py-1 text-center">
                          {booking.child}
                        </TableCell>{" "}
                        <TableCell className="py-1">
                          {booking.sourceOfBooking}
                        </TableCell>
                        <TableCell className="py-1">
                          {booking.createdOn
                            ? format(
                                new Date(booking.createdOn),
                                "yyyy-MM-dd HH:mm"
                              )
                            : "-"}
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
                <div className="mt-3 flex items-center gap-6 text-sm pl-4">
                  <div className="font-medium">
                    Total Adults:{" "}
                    <span className="tabular-nums">{totalAdults}</span>
                  </div>
                  <div className="font-medium">
                    Total Children:{" "}
                    <span className="tabular-nums">{totalChildren}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No arrivals scheduled.
              </div>
            )}
          </CardContent>
        </Card>

        <BookingDetailsDrawer
          key={selectedBooking?.id}
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

        {/* <CancelBookingModal
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          booking={selectedBooking}
          onConfirm={(reason) => {
            console.log("Cancelled booking with reason:", reason);
            // Optionally add API call
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

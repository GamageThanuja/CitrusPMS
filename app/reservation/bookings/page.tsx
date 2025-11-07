"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import ReservationDrawer from "@/components/drawers/ReservationDrawer";
import WalkInDrawer from "@/components/drawers/WalkInDrawer";
import QuickReservationDrawer from "@/components/drawers/QuickReservationDrawer";
import BookingPageDetailsDrawer from "@/components/drawers/booking-page-detail-drawer";
import { TakePaymentsDrawer } from "@/components/drawers/take-payments-drawer";

import { useTranslatedText } from "@/lib/translation";
import { getGuestProfileById } from "@/controllers/guestProfileMasterController";
import { fetchFolioByReservationDetailId } from "@/redux/slices/folioSlice";
import { fetchTransactions } from "@/redux/slices/transactionSlice";
import { useDispatch } from "react-redux";
import {
  fetchReservations, // thunk
  selectReservations,
  selectReservationsLoading,
  selectReservationsTotal,
  // alias actions so they don't collide with local state setters
  setDateRange as setResDateRange,
  setStatus as setResStatus,
  setSourceOfBooking as setResSourceOfBooking,
  setPage as setResPage,
  setPageSize as setResPageSize,
} from "@/redux/slices/fetchReservationsSlice";
import { useAppSelector } from "@/redux/hooks";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";

// Types

type ReservationStatus =
  | ""
  | "Confirmed"
  | "Cancelled"
  | "No Show"
  | "Checked In"
  | "Checked Out";

type BookingRow = {
  reservationID: number;
  reservationNo: string;
  status: string;
  statusColor: string;
  type?: string;
  bookerFullName?: string;
  email?: string;
  phone?: string;
  refNo?: string;
  hotelID?: number;
  hotelName?: string;
  resCheckIn?: string;
  resCheckOut?: string;
  totalNights?: number;
  totalRooms?: number;
  totalAmount?: number;
  currencyCode?: string;
  sourceOfBooking?: string;
  createdOn?: string;
  createdBy?: string;
  lastUpdatedOn?: string;
  lastUpdatedBy?: string;
  isCancelled?: boolean;
  guestProfileId?: number;
  rooms?: any[];
  reservationStatus?: string;
  reservationStatusID?: number;
  reservationDetailIDs?: number[];
};

type BusinessBlockRow = {
  blockId: number;
  blockCode: string;
  accountName?: string; // travel agent / company
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdOn?: string;
  arrivalDate?: string;
  departureDate?: string;
  totalRooms?: number;
  status?: string; // e.g., Tentative / Definite / Cancelled
  notes?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function BookingsPageWithTabs() {
  const dispatch = useDispatch<any>();

  // --- Tabs ---
  const [activeTab, setActiveTab] = useState<
    "reservations" | "business-blocks"
  >("reservations");

  // --- Shared filters/state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<ReservationStatus>("");
  const [travelAgent, setTravelAgent] = useState("");
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [fromDate, setFromDate] = useState(
    format(firstDayOfMonth, "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState(format(lastDayOfMonth, "yyyy-MM-dd"));
  const [createdOnDate, setCreatedOnDate] = useState("");

  const items = useAppSelector(selectReservations);
  const loading = useAppSelector(selectReservationsLoading);
  const total = useAppSelector(selectReservationsTotal);

  console.log("items : ", items);

  // --- Paging ---
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / pageSize)),
    [total, pageSize]
  );

  // --- Data ---
  const [bookingData, setBookingData] = useState<BookingRow[]>([]);
  const [blockData, setBlockData] = useState<BusinessBlockRow[]>([]);
  const [guestProfilesByDetailId, setGuestProfilesByDetailId] = useState<
    Record<number, any>
  >({});

  const [filterResNo, setFilterResNo] = useState("");
  const [filterRefNo, setFilterRefNo] = useState("");
  const [filterReservationDate, setFilterReservationDate] = useState("");
  const [filterCheckIn, setFilterCheckIn] = useState("");
  const [filterCheckOut, setFilterCheckOut] = useState("");
  const [filterRooms, setFilterRooms] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterBookerName, setFilterBookerName] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [visibleFilter, setVisibleFilter] = useState<string | null>(null);

  const [takePaymentsBooking, setTakePaymentsBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState<ReservationStatus>("");

  // keep your local paging if you want (we’ll sync it to the slice)
  const [pageIndex, setPageIndex] = useState(1);

  // --- Drawers ---
  const [reservationDrawerOpen, setReservationDrawerOpen] = useState(false);
  const [walkInDrawerOpen, setWalkInDrawerOpen] = useState(false);
  const [quickReservationDrawerOpen, setQuickReservationDrawerOpen] =
    useState(false);
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [takePaymentsOpen, setTakePaymentsOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(
    null
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const isDrawerStateChanging = useRef(false);
  const setBookingDrawerOpenSafe = (open: boolean) => {
    if (!isDrawerStateChanging.current) {
      isDrawerStateChanging.current = true;
      setBookingDrawerOpen(open);
      setTimeout(() => (isDrawerStateChanging.current = false), 100);
    }
  };

  useEffect(() => {
    // seed slice filters from your UI controls
    dispatch(setResDateRange({ fromDate, toDate }));
    dispatch(setResStatus(statusFilter));
    dispatch(setResSourceOfBooking(travelAgent));
    dispatch(setResPage(pageIndex));
    dispatch(setResPageSize(pageSize));
    // fetch
    dispatch(fetchReservations());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // whenever UI filters change
  useEffect(() => {
    if (activeTab !== "reservations") return;

    dispatch(setResDateRange({ fromDate, toDate }));
    dispatch(setResStatus(statusFilter));
    dispatch(setResSourceOfBooking(travelAgent));
    dispatch(setResPage(pageIndex));
    dispatch(setResPageSize(pageSize));
    dispatch(fetchReservations());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    fromDate,
    toDate,
    statusFilter,
    travelAgent,
    pageIndex,
    pageSize,
    searchQuery,
  ]);

  // If you want server-side searchTerm too, add it into the thunk call:
  useEffect(() => {
    if (activeTab !== "reservations") return;
    // pass overrides without mutating stored filters
    dispatch(fetchReservations({ searchTerm: searchQuery, page: 1 }));
    setPageIndex(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // i18n labels
  const bookingsText = useTranslatedText("Bookings");
  const blocksText = useTranslatedText("Business Blocks");
  const newBookingText = useTranslatedText("New Booking");
  const newBlockText = useTranslatedText("New Business Block");
  const searchText = useTranslatedText("Search");
  const noBookingsText = useTranslatedText("No bookings found");
  const noBlocksText = useTranslatedText("No business blocks found");
  const createNewBookingText = useTranslatedText(
    "Create a new booking to get started"
  );

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "bookings",
    "checkInGroupReservation"
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  // --- Helpers ---
  const fetchAndStoreGuestProfile = async (
    detailID: number,
    profileID?: number
  ) => {
    if (!profileID || guestProfilesByDetailId[detailID]) return;
    try {
      const tokens = localStorage.getItem("hotelmateTokens");
      const token = tokens ? JSON.parse(tokens).accessToken : null;
      const data = await getGuestProfileById({ token, profileId: profileID });
      if (data) {
        setGuestProfilesByDetailId((prev) => ({ ...prev, [detailID]: data }));
      }
    } catch (err) {
      console.error("Failed to fetch guest profile:", err);
    }
  };

  // --- Fetchers ---

  const fetchBusinessBlocks = async () => {
    const stored = localStorage.getItem("selectedProperty");
    if (!stored) return;
    const { id: hotelId } = JSON.parse(stored);
    const tokens = localStorage.getItem("hotelmateTokens");
    const accessToken = tokens ? JSON.parse(tokens).accessToken : null;

    // NOTE: adjust the endpoint/query to your API
    const res = await fetch(
      `${BASE_URL}/api/BusinessBlock?hotelId=${hotelId}&fromDate=${fromDate}&toDate=${toDate}&searchTerm=${encodeURIComponent(
        searchQuery
      )}&status=${encodeURIComponent(status)}&agent=${encodeURIComponent(
        travelAgent
      )}&page=${page}&pageSize=${pageSize}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    const blocks = data.blocks || data.businessBlocks || [];

    const transformed: BusinessBlockRow[] = blocks.map((b: any) => ({
      blockId: b.blockId ?? b.businessBlockId ?? b.id,
      blockCode: b.blockCode ?? b.code ?? b.refNo ?? "-",
      accountName: b.accountName ?? b.companyName ?? b.travelAgentName,
      contactName: b.contactName,
      contactPhone: b.contactPhone,
      contactEmail: b.contactEmail,
      createdOn: b.createdOn,
      arrivalDate: b.arrivalDate ?? b.checkIn,
      departureDate: b.departureDate ?? b.checkOut,
      totalRooms: b.totalRooms ?? b.roomsCount,
      status: b.status,
      notes: b.notes,
    }));

    setBlockData(transformed);
    setTotalCount(data.totalCount || 0);
  };

  useEffect(() => {
    if (activeTab === "reservations") {
      dispatch(fetchReservations());
    } else {
      fetchBusinessBlocks();
    }
    // also keep filters in the other effect you already have
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleBookingClick = (booking: BookingRow) => {
    const isSameBooking =
      selectedBooking?.reservationID === booking.reservationID;

    if (isSameBooking) return; // avoid redundant reopen

    setSelectedBooking(booking);
    setBookingDrawerOpen(true);
  };

  // --- Row click ---
  const handleReservationRowClick = (row: BookingRow) => {
    setSelectedBooking(row);
    setBookingDrawerOpen(true);
  };

  // business block → add to reservation
  const handleAddBlockToReservation = (block: BusinessBlockRow) => {
    // Open Reservation drawer; pass prefill via localStorage or a global store as needed
    // Example: localStorage.setItem('prefillBusinessBlock', JSON.stringify(block))
    setReservationDrawerOpen(true);
  };

  const handleExport = async () => {
    const xlsx = await import("xlsx");
    if (activeTab === "reservations") {
      const filtered = bookingData.map((b) => ({
        "Reservation No": b.reservationNo,
        "Booking Ref": b.refNo,
        "Created On": b.createdOn
          ? format(new Date(b.createdOn), "yyyy-MM-dd")
          : "-",
        "Check In": b.resCheckIn
          ? format(new Date(b.resCheckIn), "yyyy-MM-dd")
          : "-",
        "Check Out": b.resCheckOut
          ? format(new Date(b.resCheckOut), "yyyy-MM-dd")
          : "-",
        Rooms: b.totalRooms,
        "Travel Agent": b.sourceOfBooking,
        Status: b.status,
        "Booker Name": b.bookerFullName,
        Phone: b.phone,
        Email: b.email,
      }));
      const ws = xlsx.utils.json_to_sheet(filtered);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Reservations");
      const buf = xlsx.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Reservations_${page}.xlsx`;
      link.click();
    } else {
      const filtered = blockData.map((b) => ({
        "Block Code": b.blockCode,
        Account: b.accountName ?? "-",
        "Created On": b.createdOn
          ? format(new Date(b.createdOn), "yyyy-MM-dd")
          : "-",
        Arrival: b.arrivalDate
          ? format(new Date(b.arrivalDate), "yyyy-MM-dd")
          : "-",
        Departure: b.departureDate
          ? format(new Date(b.departureDate), "yyyy-MM-dd")
          : "-",
        Rooms: b.totalRooms ?? "-",
        Status: b.status ?? "-",
        Contact: b.contactName ?? "-",
        Phone: b.contactPhone ?? "-",
        Email: b.contactEmail ?? "-",
      }));
      const ws = xlsx.utils.json_to_sheet(filtered);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "BusinessBlocks");
      const buf = xlsx.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `BusinessBlocks_${page}.xlsx`;
      link.click();
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 p-[0.6rem]">
        {/* Header + actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {activeTab === "reservations" ? bookingsText : blocksText}
          </h1>
          <div className="flex gap-2">
            {activeTab === "reservations" ? (
              <>
                <div className="pr-4">
                  <VideoButton
                    onClick={() => setShowRawOverlay(true)}
                    label="Watch Video"
                  />
                </div>
                <Button onClick={() => setQuickReservationDrawerOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Reservation
                </Button>
                <Button onClick={() => setReservationDrawerOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> {newBookingText}
                </Button>
              </>
            ) : (
              <>
                {/* Replace with your BusinessBlock drawer if available */}
                <Button
                  onClick={() => alert("TODO: Open BusinessBlock drawer")}
                >
                  <Plus className="mr-2 h-4 w-4" /> {newBlockText}
                </Button>
              </>
            )}
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as any);
            setPageIndex(1);
          }}
        >
          <div className="flex items-end justify-between gap-4">
            <TabsList>
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="business-blocks">Business Blocks</TabsTrigger>
            </TabsList>

            {/* Filters (shared) */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`${searchText}...`}
                    className="pl-10 pr-2 py-1 border rounded w-[280px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Input
                  type="text"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ReservationStatus)
                  }
                  placeholder="Type status"
                  className="border px-2 py-1 rounded w-40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Travel Agent
                </label>
                <Input
                  type="text"
                  value={travelAgent}
                  onChange={(e) => setTravelAgent(e.target.value)}
                  placeholder="Type agent"
                  className="border px-2 py-1 rounded w-44"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Stay From
                </label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border px-2 py-1 rounded w-44"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Stay To
                </label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border px-2 py-1 rounded w-44"
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
                  className="border px-2 py-1 rounded w-44"
                />
              </div>
            </div>
          </div>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{bookingsText}</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {[
                          {
                            key: "resNo",
                            label: "Res No",
                            value: filterResNo,
                            setter: setFilterResNo,
                          },
                          {
                            key: "refNo",
                            label: "Booking Ref",
                            value: filterRefNo,
                            setter: setFilterRefNo,
                          },
                          {
                            key: "reservationDate",
                            label: "Reservation Date",
                            value: filterReservationDate,
                            setter: setFilterReservationDate,
                            type: "date",
                          },
                          {
                            key: "checkIn",
                            label: "Check-In",
                            value: filterCheckIn,
                            setter: setFilterCheckIn,
                            type: "date",
                          },
                          {
                            key: "checkOut",
                            label: "Check-Out",
                            value: filterCheckOut,
                            setter: setFilterCheckOut,
                            type: "date",
                          },
                          {
                            key: "rooms",
                            label: "No. of Rooms",
                            value: filterRooms,
                            setter: setFilterRooms,
                          },
                          {
                            key: "agent",
                            label: "Travel Agent",
                            value: filterAgent,
                            setter: setFilterAgent,
                          },
                          { key: "status", label: "Status" }, // no filter
                          {
                            key: "booker",
                            label: "Booker Name",
                            value: filterBookerName,
                            setter: setFilterBookerName,
                          },
                          {
                            key: "phone",
                            label: "Phone",
                            value: filterPhone,
                            setter: setFilterPhone,
                          },
                          {
                            key: "email",
                            label: "Email",
                            value: filterEmail,
                            setter: setFilterEmail,
                          },
                          {
                            key: "country",
                            label: "Country",
                            value: filterCountry,
                            setter: setFilterCountry,
                          },
                        ].map((col) => (
                          <TableHead
                            key={col.key}
                            className="relative px-2 py-2"
                          >
                            <div
                              className="cursor-pointer font-medium text-sm hover:text-primary"
                              onClick={() =>
                                setVisibleFilter((prev) =>
                                  prev === col.key ? null : col.key
                                )
                              }
                            >
                              {col.label}
                            </div>
                            {col.setter && visibleFilter === col.key && (
                              <Input
                                type={col.type || "text"}
                                value={col.value}
                                onChange={(e) => col.setter!(e.target.value)}
                                placeholder="Filter"
                                className="mt-1 h-7 text-xs px-2 py-1 border rounded"
                                autoFocus
                              />
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {items
                        .filter((booking) => {
                          return (
                            (!createdOnDate ||
                              booking.createdOn?.startsWith(createdOnDate)) &&
                            (!status ||
                              booking.status
                                ?.toLowerCase()
                                .includes(status.toLowerCase())) &&
                            (!travelAgent ||
                              booking.sourceOfBooking
                                ?.toLowerCase()
                                .includes(travelAgent.toLowerCase())) &&
                            (!filterResNo ||
                              booking.reservationNo
                                ?.toLowerCase()
                                .includes(filterResNo.toLowerCase())) &&
                            (!filterRefNo ||
                              booking.refNo
                                ?.toLowerCase()
                                .includes(filterRefNo.toLowerCase())) &&
                            (!filterReservationDate ||
                              booking.createdOn?.startsWith(
                                filterReservationDate
                              )) &&
                            (!filterCheckIn ||
                              booking.resCheckIn?.startsWith(filterCheckIn)) &&
                            (!filterCheckOut ||
                              booking.resCheckOut?.startsWith(
                                filterCheckOut
                              )) &&
                            (!filterRooms ||
                              String(booking.totalRooms || "")
                                .toLowerCase()
                                .includes(filterRooms.toLowerCase())) &&
                            (!filterAgent ||
                              booking.sourceOfBooking
                                ?.toLowerCase()
                                .includes(filterAgent.toLowerCase())) &&
                            (!filterBookerName ||
                              booking.bookerFullName
                                ?.toLowerCase()
                                .includes(filterBookerName.toLowerCase())) &&
                            (!filterPhone ||
                              booking.phone
                                ?.toLowerCase()
                                .includes(filterPhone.toLowerCase())) &&
                            (!filterEmail ||
                              booking.email
                                ?.toLowerCase()
                                .includes(filterEmail.toLowerCase())) &&
                            (!filterCountry ||
                              guestProfilesByDetailId[
                                booking.reservationDetailIDs?.[0]
                              ]?.country
                                ?.toLowerCase()
                                .includes(filterCountry.toLowerCase())) &&
                            (!searchQuery ||
                              Object.values(booking).some((value) =>
                                String(value || "")
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                              ))
                          );
                        })
                        .map((booking) => (
                          <TableRow
                            key={booking.reservationID}
                            className="cursor-pointer hover:bg-muted/50 h-9"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <TableCell className="py-1">
                              {booking.reservationNo}
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.refNo || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.createdOn
                                ? format(
                                    new Date(booking.createdOn),
                                    "yyyy-MM-dd"
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.resCheckIn
                                ? format(
                                    new Date(booking.resCheckIn),
                                    "yyyy-MM-dd"
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.resCheckOut
                                ? format(
                                    new Date(booking.resCheckOut),
                                    "yyyy-MM-dd"
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="pl-6">
                                {booking.totalRooms || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.sourceOfBooking || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: booking.statusColor,
                                  color: "#fff",
                                }}
                              >
                                {booking.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.bookerFullName || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.phone || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {booking.email || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {guestProfilesByDetailId[
                                booking.reservationDetailIDs?.[0]
                              ]?.country || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 text-lg font-medium">{noBookingsText}</p>
                    <p className="text-sm text-muted-foreground">
                      {createNewBookingText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Blocks Tab */}
          <TabsContent value="business-blocks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{blocksText}</CardTitle>
              </CardHeader>
              <CardContent>
                {blockData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Block Code</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Created On</TableHead>
                        <TableHead>Arrival</TableHead>
                        <TableHead>Departure</TableHead>
                        <TableHead className="pl-6">No. of Rooms</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockData
                        .filter(
                          (b) =>
                            (!createdOnDate ||
                              b.createdOn?.startsWith(createdOnDate)) &&
                            (!status ||
                              (b.status || "")
                                .toLowerCase()
                                .includes(status.toLowerCase())) &&
                            (!travelAgent ||
                              (b.accountName || "")
                                .toLowerCase()
                                .includes(travelAgent.toLowerCase())) &&
                            (!searchQuery ||
                              Object.values(b).some((v) =>
                                String(v || "")
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                              ))
                        )
                        .map((b) => (
                          <TableRow key={b.blockId} className="h-9">
                            <TableCell className="py-1">
                              {b.blockCode}
                            </TableCell>
                            <TableCell className="py-1">
                              {b.accountName || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {b.createdOn
                                ? format(new Date(b.createdOn), "yyyy-MM-dd")
                                : "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {b.arrivalDate
                                ? format(new Date(b.arrivalDate), "yyyy-MM-dd")
                                : "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {b.departureDate
                                ? format(
                                    new Date(b.departureDate),
                                    "yyyy-MM-dd"
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="pl-6">{b.totalRooms ?? "-"}</div>
                            </TableCell>
                            <TableCell className="py-1">
                              {b.status || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {b.contactName || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {b.contactPhone || "-"}
                            </TableCell>
                            <TableCell className="py-1">
                              {b.contactEmail || "-"}
                            </TableCell>
                            <TableCell className="py-1 text-right">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleAddBlockToReservation(b)}
                              >
                                Add to Reservation
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 text-lg font-medium">{noBlocksText}</p>
                    <p className="text-sm text-muted-foreground">
                      {useTranslatedText(
                        "Create a new business block to get started"
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => {
              const p = Math.max(pageIndex - 1, 1);
              setPageIndex(p);
              if (activeTab === "reservations") {
                dispatch(setResPage(p));
                dispatch(fetchReservations());
              }
            }}
            disabled={pageIndex === 1}
            className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          <span className="px-3 py-1 rounded bg-black text-white text-sm">
            {pageIndex} / {totalPages}
          </span>

          <button
            onClick={() => {
              const p = pageIndex + 1;
              setPageIndex(p);
              if (activeTab === "reservations") {
                dispatch(setResPage(p));
                dispatch(fetchReservations());
              }
            }}
            disabled={
              activeTab === "reservations"
                ? pageIndex >= totalPages
                : blockData.length < pageSize
            }
            className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Drawers */}
        <BookingPageDetailsDrawer
          open={bookingDrawerOpen}
          onOpenChange={(open) => {
            if (!open) {
              setBookingDrawerOpen(false);
              setSelectedBooking(null);
            } else {
              setBookingDrawerOpen(true);
            }
          }}
          bookingDetail={selectedBooking}
          guestProfileData={
            selectedBooking?.reservationDetailIDs?.[0]
              ? guestProfilesByDetailId[selectedBooking.reservationDetailIDs[0]]
              : null
          }
          text={{
            bookingDetailsText: useTranslatedText("Booking"),
            roomDetailsText: useTranslatedText("Room Details"),
            roomText: useTranslatedText("Room"),
            totalText: useTranslatedText("Total"),
            customerDetailsText: useTranslatedText("Customer Details"),
            nameText: useTranslatedText("Name"),
            phoneText: useTranslatedText("Phone"),
            emailText: useTranslatedText("Email"),
            idTypeText: useTranslatedText("ID Type"),
            idNumberText: useTranslatedText("ID Number"),
            notesText: useTranslatedText("Notes"),
            addNoteText: useTranslatedText("Add a note..."),
            messageGuestText: useTranslatedText("Message Guest"),
            expensesText: useTranslatedText("Expenses"),
            revisionsText: useTranslatedText("Revisions"),
          }}
          onCancelBookingClick={() => {
            setCancelModalOpen(true);
            setBookingDrawerOpenSafe(false);
          }}
          isBookingPageView={true}
        />

        <ReservationDrawer
          open={reservationDrawerOpen}
          onOpenChange={setReservationDrawerOpen}
        />
        <WalkInDrawer
          open={walkInDrawerOpen}
          onOpenChange={setWalkInDrawerOpen}
          setGuestProfileForCheckIn={() => {}}
        />
        <QuickReservationDrawer
          open={quickReservationDrawerOpen}
          onOpenChange={setQuickReservationDrawerOpen}
          onCreated={async () => {
            setQuickReservationDrawerOpen(false);
            if (activeTab === "reservations") {
              dispatch(fetchReservations());
            } else {
              await fetchBusinessBlocks();
            }
          }}
        />

        <Sheet open={takePaymentsOpen} onOpenChange={setTakePaymentsOpen}>
          <SheetContent
            side="right"
            className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl transition-transform duration-300 translate-x-0"
          >
            <TakePaymentsDrawer
              bookingDetail={selectedBooking as any}
              open={takePaymentsOpen}
              onClose={() => setTakePaymentsOpen(false)}
              onComplete={() => {
                if (selectedBooking?.reservationDetailIDs?.[0]) {
                  dispatch(
                    fetchFolioByReservationDetailId(
                      selectedBooking.reservationDetailIDs[0]
                    )
                  );
                }
                if (selectedBooking) {
                  dispatch(
                    fetchTransactions({
                      hotelCode: selectedBooking.hotelID,
                      reservationId: selectedBooking.reservationID,
                      reservationDetailId:
                        selectedBooking.reservationDetailIDs?.[0],
                      tranTypeId: 17,
                    })
                  );
                }
                setTakePaymentsOpen(false);
              }}
              isBookingPageView={true}
            />
          </SheetContent>
        </Sheet>
      </div>
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </DashboardLayout>
  );
}

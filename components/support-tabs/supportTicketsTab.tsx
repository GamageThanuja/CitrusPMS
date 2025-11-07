"use client";

import AddTicketDrawer from "@/components/drawers/add-ticket-drawer";
import { SupportTicketsDrawer } from "@/components/drawers/support-tickets-drawer";
import React, { useState, useRef, useEffect } from "react";

import {
  ChevronUp,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  Filter,
  MessageSquare,
  FileText,
  HelpCircle,
  Ticket,
  Download,
  Ellipsis,
} from "lucide-react";
// Redux selectors and thunks
import { useSelector } from "react-redux";
import { fetchSupportTicketsByHotel } from "@/redux/slices/supportTicketSlice";
import type { RootState } from "@/redux/store";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/support-ticket-card";

interface Ticket {
  id: string;
  department: string;
  subject: string;
  priority: "Low" | "Medium" | "High";
  status: "Closed" | "Open" | "Pending" | "Answered" | "Customer-Reply";
  lastUpdated: string;
  attachmentUrl?: string;
}

export default function SupportTicketsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const entriesPerPage = 10;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [supportPin, setSupportPin] = useState("570780");
  // Filter state for each filter
  const [priorityFilter, setPriorityFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTicketOpen, setDrawerTicketOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const {
    tickets: reduxTickets,
    listLoading,
    listError,
  } = useSelector((s: RootState) => s.supportTicket);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Kick off Redux fetch (hotel id is inferred from localStorage selectedProperty)
  useEffect(() => {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (hotelId) {
      dispatch(fetchSupportTicketsByHotel(hotelId));
    }
  }, [dispatch]);

  // Adapt Redux tickets to this component's local table shape
  useEffect(() => {
    const data = Array.isArray(reduxTickets) ? reduxTickets : [];

    // Group by ticketID and keep the latest createdOn
    const byTicketId: Record<string, any> = {};
    for (const t of data) {
      const rawId = t.ticketID;
      if (rawId == null) continue;
      const key = String(rawId);

      const current = byTicketId[key];
      const currentCreatedOn = current?.createdOn ?? current?.lastUpdated ?? "";
      const currentTs = currentCreatedOn
        ? Date.parse(currentCreatedOn)
        : -Infinity;
      const thisCreatedOn = t.createdOn ?? t.lastUpdated ?? "";
      const thisTs = thisCreatedOn ? Date.parse(thisCreatedOn) : -Infinity;

      // Prefer record with the newest timestamp; also prefer one with an attachment if timestamps tie
      const currentHasAttachment = current?.details?.[0]?.attachmentURL;
      const thisHasAttachment = t.details?.[0]?.attachmentURL;
      const chooseThis =
        !current ||
        thisTs > currentTs ||
        (thisTs === currentTs && thisHasAttachment && !currentHasAttachment);

      if (chooseThis) {
        byTicketId[key] = t;
      }
    }

    const transformed = Object.entries(byTicketId).map(
      ([key, ticket]: [string, any]) => {
        const createdOn = ticket.createdOn ? new Date(ticket.createdOn) : null;
        return {
          id: `#${key}`,
          department:
            ticket.ticketType === "Technical"
              ? "Technical"
              : ticket.ticketType === "Billing"
              ? "Billing"
              : ticket.ticketType === "ChannelManager"
              ? "ChannelManager"
              : "Customer",
          subject: ticket.subject || "(No Subject)",
          priority: ticket.priority || "Low",
          status: ticket.isClosed ? "Closed" : ticket.status || "Open",
          lastUpdated: createdOn
            ? createdOn.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }) +
              ` (${createdOn.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })})`
            : "",
          attachmentUrl: ticket.details?.[0]?.attachmentURL || null,
        } as Ticket;
      }
    );

    setTickets(transformed);
  }, [reduxTickets]);

  const handleTicketUpdate = () => {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (hotelId) {
      dispatch(fetchSupportTicketsByHotel(hotelId));
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [entriesPerPage, searchTerm, tickets]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const generateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setSupportPin(newPin);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const getStatusCounts = () => {
    const counts = {
      Open: 0,
      Answered: 0,
      "Customer-Reply": 0,
      Closed: 0,
    };

    tickets.forEach((ticket) => {
      if (counts.hasOwnProperty(ticket.status)) {
        counts[ticket.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.subject
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter
      ? ticket.priority.toLowerCase() === priorityFilter
      : true;
    const matchesDepartment = departmentFilter
      ? ticket.department.toLowerCase().includes(departmentFilter)
      : true;
    // lastUpdated might be in "MM/DD/YYYY (hh:mm AM/PM)" format, so match only the date part
    const matchesCreatedDate = createdDateFilter
      ? ticket.lastUpdated.startsWith(
          new Date(createdDateFilter).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        )
      : true;

    return (
      matchesSearch &&
      matchesPriority &&
      matchesDepartment &&
      matchesCreatedDate
    );
  });

  const totalPages = Math.ceil(filteredTickets.length / entriesPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ChevronUp className="w-4 h-4 text-primary" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    );
  };

  // Pagination logic removed; show all filtered tickets

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Support Tickets</h1>
        <button
          onClick={() => {
            console.log("New Ticket button clicked");
            setDrawerOpen(true);
          }}
          className="flex items-center space-x-2 bg-primary text-background px-4 py-2 rounded-lg shadow hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">New Ticket</span>
        </button>
      </div>

      {/* Filters Row with Search */}
      <div className="flex flex-wrap justify-between items-end">
        {/* Search Input */}
        <div className="flex flex-col justify-end">
          <label className="text-xs font-medium text-muted-foreground mb-1">
            Search
          </label>
          <div className="relative w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by subject..."
              className="pl-10 pr-2 py-1 border rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-black px-3 py-1.5"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* Priority Filter */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-muted-foreground mb-1">
            Priority
          </label>
          <select
            className="border rounded px-3 py-1.5 text-sm w-[250px]"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value.toLowerCase())}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Department Filter */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-muted-foreground mb-1">
            Department
          </label>
          <input
            type="text"
            placeholder="Type department name"
            className="border rounded px-3 py-1.5 text-sm w-[250px]"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value.toLowerCase())}
          />
        </div>

        {/* Created Date Filter */}
        <div className="flex flex-col">
          <label className="text-xs font-medium text-muted-foreground mb-1">
            Created Date
          </label>
          <input
            type="date"
            className="border rounded px-3 py-1.5 text-sm w-[250px]"
            value={createdDateFilter}
            onChange={(e) => setCreatedDateFilter(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-muted-foreground mb-1 invisible">
            Export
          </label>
          <button
            className="px-3 py-1.5 bg-black text-white text-base rounded shadow hover:bg-gray-800"
            onClick={() => {
              console.log("Exporting filtered tickets:", filteredTickets);

              if (!filteredTickets || filteredTickets.length === 0) {
                alert("No data to export.");
                return;
              }

              const csvRows = [
                "ID,Department,Subject,Priority,Status,Last Updated",
                ...filteredTickets.map((t) =>
                  [
                    t.id ?? "",
                    t.department ?? "",
                    t.subject ?? "",
                    t.priority ?? "",
                    t.status ?? "",
                    t.lastUpdated ?? "",
                  ]
                    .map((field) => `"${String(field).replace(/"/g, '""')}"`)
                    .join(",")
                ),
              ];

              const csvContent =
                "data:text/csv;charset=utf-8," + csvRows.join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "support_tickets.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <span className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </span>
          </button>
        </div>
      </div>
      {listLoading && (
        <div className="text-sm text-muted-foreground">Loading tickets…</div>
      )}
      {listError && <div className="text-sm text-red-600">{listError}</div>}
      <Card className="rounded-lg shadow-sm">
        <CardHeader></CardHeader>
        <CardContent className="p-2">
          <table className="w-full table-auto text-sm text-left">
            <thead className="text-gray-600 uppercase tracking-wider border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Created Date</th>
                <th className="px-4 py-3 font-medium">Attachment</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length > 0 ? (
                paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">
                      {ticket.department}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <div className="text-gray-800">{ticket.subject}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          ticket.priority === "High"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : ticket.priority === "Medium"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-green-100 text-green-800 border-green-300"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {ticket.lastUpdated}
                    </td>
                    <td className="px-4 py-3 text-gray-800 space-x-2">
                      {ticket.attachmentUrl ? (
                        <>
                          <button
                            onClick={() =>
                              setModalImageUrl(ticket.attachmentUrl!)
                            }
                            className="text-blue-600 hover:underline"
                          >
                            <FileText className="w-4 h-4 inline-block" />
                          </button>
                          <a
                            href={ticket.attachmentUrl}
                            download
                            className="text-blue-600 hover:underline"
                          >
                            <Download className="w-4 h-4 inline-block" />
                          </a>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800 text-right">
                      <button
                        type="button"
                        aria-label="Ticket actions"
                        className="inline-flex items-center justify-center rounded hover:bg-gray-100 h-8 w-8"
                        onClick={() => {
                          // Extract ticket ID from the ticket.id format (#123)
                          const ticketIdMatch = ticket.id.match(/#(\d+)/);
                          const ticketId = ticketIdMatch
                            ? ticketIdMatch[1]
                            : null;
                          if (ticketId) {
                            setSelectedTicketId(ticketId);
                            setDrawerTicketOpen(true);
                          } else {
                            console.error(
                              "Could not extract ticket ID from:",
                              ticket.id
                            );
                          }
                        }}
                      >
                        <Ellipsis className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bottom Controls */}
      <div className="flex justify-center items-center py-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 text-sm text-gray-600 hover:underline disabled:opacity-50"
        >
          &lt; Previous
        </button>
        <div className="px-3 py-1 text-sm font-medium text-white bg-black rounded">
          {currentPage} / {totalPages}
        </div>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-2 text-sm text-gray-600 hover:underline disabled:opacity-50"
        >
          Next &gt;
        </button>
      </div>

      <AddTicketDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onTicketCreated={handleTicketUpdate}
      />

      <SupportTicketsDrawer
        open={drawerTicketOpen}
        onClose={() => setDrawerTicketOpen(false)}
        ticketId={selectedTicketId}
        onTicketUpdate={handleTicketUpdate}
      />

      {modalImageUrl && (
        <ImageModal
          imageUrl={modalImageUrl}
          onClose={() => setModalImageUrl(null)}
        />
      )}
    </div>
  );
}
// ImageModal component with loader, background click to close, and close button
function ImageModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  // Prevent scrolling when modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
    >
      <div
        className="p-0 rounded relative max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button, clearly separated at top right */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black border border-gray-300 rounded-full p-1 bg-white z-20"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center justify-center min-h-[300px] min-w-[300px] relative">
          <img
            src={imageUrl}
            alt="Attachment"
            className="max-h-[80vh] max-w-full transition-opacity duration-300"
            style={{ opacity: loading ? 0 : 1 }}
            onLoad={() => setLoading(false)}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
              <svg
                className="animate-spin h-6 w-6 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

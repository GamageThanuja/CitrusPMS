"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  fetchTicketDetails,
  updateSupportTicket,
  closeSupportTicket,
  fetchSupportTickets,
  clearCurrentTicket,
  clearError,
  TicketDetails,
  TicketMessage,
} from "../../redux/slices/supportTicketSlice";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Paperclip,
  User,
  MessageSquare,
} from "lucide-react";

interface SupportTicketsDrawerProps {
  open: boolean;
  onClose: () => void;
  ticketId: string | null;
  onTicketUpdate?: () => void; // Optional callback when ticket is updated or closed
}

export const SupportTicketsDrawer: React.FC<SupportTicketsDrawerProps> = ({
  open,
  onClose,
  ticketId,
  onTicketUpdate,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentTicket, loading, updating, error } = useSelector(
    (state: RootState) => state.supportTicket
  );
  const [updateText, setUpdateText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Fetch ticket details when drawer opens
  useEffect(() => {
    if (open && ticketId) {
      // existing ticket details fetch
      dispatch(fetchTicketDetails(ticketId));
      setUpdateText("");
      setAttachmentFile(null);
    }

    return () => {
      if (!open) {
        dispatch(clearCurrentTicket());
      }
    };
  }, [open, ticketId, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Update support ticket handler
  const handleUpdateTicket = async () => {
    if (!currentTicket || !updateText.trim()) {
      toast({
        title: "Error",
        description: "Please enter an update message",
        variant: "destructive",
      });
      return;
    }

    // ✅ Safe: now TypeScript knows it's not null
    const ticket = currentTicket;

    const assignedToName = (ticket.assignedTo || "").trim() || undefined;

    // Get full name from localStorage instead of email
    const storedFullName =
      typeof window !== "undefined" ? localStorage.getItem("fullName") : null;
    const fullName = storedFullName || "Unknown";

    try {
      console.log("Posting support ticket update:", {
        ticketId: ticket.ticketID,
        updateText,
        attachmentFile,
        createdBy: fullName,
        hotelId: ticket.hotelId,
        assignedTo: assignedToName,
      });

      await dispatch(
        updateSupportTicket({
          ticketId: ticket.ticketID,
          updateText,
          attachmentFile: attachmentFile || undefined,
          createdBy: fullName,
          hotelId: ticket.hotelId,
          assignedTo: assignedToName,
        })
      ).unwrap();

      // toast + reset unchanged...

      toast({
        title: "Success",
        description: `Support ticket updated successfully${
          attachmentFile ? " (attachment uploaded)" : ""
        }.`,
      });

      // Reset form
      setUpdateText("");
      setAttachmentFile(null);

      // Redux already handles optimistic updates, no need to refetch
    } catch (error) {
      console.error("Error updating support ticket:", error);
      toast({
        title: "Error",
        description: "Failed to update support ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Close support ticket handler
  const handleCloseTicket = async () => {
    if (!currentTicket) return;

    try {
      await dispatch(closeSupportTicket(currentTicket.ticketID)).unwrap();
      toast({
        title: "Closed",
        description: "Ticket has been marked as closed.",
      });

      // Redux already handles the state updates optimistically
    } catch (error) {
      console.error("Error closing support ticket:", error);
      toast({
        title: "Error",
        description: "Failed to close ticket.",
        variant: "destructive",
      });
    }
  };

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-300";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Low":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Closed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Answered":
        return "bg-green-100 text-green-800 border-green-300";
      case "Customer-Reply":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <AlertCircle className="w-4 h-4" />;
      case "Closed":
        return <XCircle className="w-4 h-4" />;
      case "Answered":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setAttachmentFile(null);
      return;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }
    setAttachmentFile(file);
  };

  // Helper to get display messages
  const buildDisplayMessages = (t?: TicketDetails | null) => {
    if (!t) return [];
    return t.messages ?? [];
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-[50vw] sm:max-w-5xl lg:max-w-6xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Support Ticket Details</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !currentTicket ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No ticket details available</p>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Left Column - Ticket Information */}
            <div className="w-80 p-4 pr-3 border-r border-gray-200">
              {/* Ticket Header */}
              <div className="mb-4 p-3 border rounded-lg bg-white">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold">
                    {currentTicket.subject}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ticket {currentTicket.ticketID}
                  </p>
                </div>
              </div>

              {/* Ticket Information */}

              <div className="mb-4 p-3 border rounded-lg bg-white">
                <h3 className="font-semibold mb-3 text-sm">Department</h3>
                <p className="text-sm text-muted-foreground">
                  {currentTicket.department}
                </p>
              </div>

              <div className="mb-4 p-3 border rounded-lg bg-white">
                <h3 className="font-semibold mb-3 text-sm">Submitted</h3>
                <p className="text-sm text-muted-foreground">
                  {currentTicket.createdDate}
                </p>
              </div>

              <div className="mb-4 p-3 border rounded-lg bg-white">
                <h3 className="font-semibold mb-3 text-sm">Last Updated</h3>
                <p className="text-sm text-muted-foreground">
                  {currentTicket.lastUpdated}
                </p>
              </div>

              <div className="mb-4 p-3 border rounded-lg bg-white">
                <h3 className="font-semibold mb-3 text-sm">Priority</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <Badge variant="outline" className="text-xs">
                      {currentTicket.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Conversation */}
            <div className="flex-1 flex flex-col">
              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Initial Message (created by) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-sm">
                      {currentTicket.createdBy ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {currentTicket.createdDate}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {currentTicket.description}
                  </div>

                  {currentTicket.attachmentUrl && (
                    <div className="mt-3 p-2 bg-white border rounded">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Download className="w-4 h-4" />
                        <a
                          href={currentTicket.attachmentUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Download Attachment
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {buildDisplayMessages(currentTicket).map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      "border rounded-lg p-4 " +
                      (msg.isStaff
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200")
                    }
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <User
                        className={
                          "w-5 h-5 " +
                          (msg.isStaff ? "text-green-600" : "text-gray-600")
                        }
                      />
                      <span className="font-medium text-sm">
                        {msg.sender || (msg.isStaff ? "Staff" : "User")}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.message}
                    </div>
                    {msg.attachmentUrl && (
                      <div className="mt-3 p-2 bg-white border rounded">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Download className="w-4 h-4" />
                          <a
                            href={msg.attachmentUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Download Attachment
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <div className="border-t p-4 ">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Reply</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full min-h-[80px] bg-white"
                    disabled={updating}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Hidden native file input */}
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(e.target.files?.[0] || null)
                        }
                      />

                      {/* Custom styled button */}
                      <label
                        htmlFor="file-upload"
                        className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-300 rounded-md bg-white text-sm shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <span>Upload File</span>
                      </label>
                      {attachmentFile && (
                        <span className="ml-2 text-sm text-gray-600 truncate max-w-xs">
                          {attachmentFile.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleUpdateTicket}
                        disabled={updating || !updateText.trim()}
                        size="sm"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Replying...
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3 mr-1" />
                            Reply
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleCloseTicket}
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Closed
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { createSupportTicket } from "@/redux/slices/supportTicketSlice";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { toast } from "@/hooks/use-toast";

type AddTicketDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketCreated?: () => void; // Optional callback when ticket is created
};

const AddTicketDrawer = ({
  open,
  onOpenChange,
  onTicketCreated,
}: AddTicketDrawerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector(
    (state: RootState) => state.supportTicket
  );
  const [subject, setSubject] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [ticketUpdateText, setTicketUpdateText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { fullName } = useUserFromLocalStorage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !subject.trim() ||
      !ticketType ||
      !priority ||
      !ticketUpdateText.trim()
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Get hotel ID from selected property
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    const hotelId = property.id;

    if (!hotelId) {
      toast({
        title: "Error",
        description: "No hotel selected. Please select a property first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await dispatch(
        createSupportTicket({
          hotelId,
          subject: subject.trim(),
          createdBy: fullName || "Unknown",
          ticketType,
          priority,
          assignedTo: assignedTo || "Support Team",
          description: ticketUpdateText.trim(),
          attachmentFile: attachmentFile || undefined,
        })
      ).unwrap();

      toast({
        title: "Success",
        description: "Support ticket created successfully!",
      });

      // Reset form
      setSubject("");
      setTicketType("");
      setPriority("");
      setAssignedTo("");
      setTicketUpdateText("");
      setAttachmentFile(null);

      // Call callback to refresh tickets list
      if (onTicketCreated) {
        onTicketCreated();
      }

      // Close drawer
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-x-hidden overflow-y-auto rounded-l-2xl p-0"
      >
        <SheetHeader className="flex-shrink-0 space-y-2 pb-4 px-6 pt-6 border-b">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="mr-2 h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <SheetTitle>New Ticket</SheetTitle>
          </div>
        </SheetHeader>
        <ScrollArea className="h-full">
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <div>
                <Input
                  className="w-full"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter ticket subject"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ticket Type
              </label>
              <div>
                <Select
                  value={ticketType}
                  onValueChange={(value) => setTicketType(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="billing">billing</SelectItem>
                    <SelectItem value="customer">customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <div>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Ticket Update Text
              </label>
              <div>
                <textarea
                  className="w-full min-h-[100px] border border-input px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-y"
                  value={ticketUpdateText}
                  onChange={(e) => setTicketUpdateText(e.target.value)}
                  placeholder="Describe your issue or request..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Attachment
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border px-4 py-2"
                >
                  Choose File
                </Button>
                {attachmentFile && (
                  <span className="text-sm text-muted-foreground">
                    {attachmentFile.name}
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="*/*"
                  onChange={(e) =>
                    handleFileSelect(e.target.files?.[0] || null)
                  }
                  className="hidden"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-6">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default AddTicketDrawer;

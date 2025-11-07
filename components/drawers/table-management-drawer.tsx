"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TableManagement } from "@/components/pos/table-management";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useEffect, useState } from "react";
import { useTutorial } from "@/hooks/useTutorial";

// (optional) mirror the Table shape if you like
type Table = {
  id: string;
  number: string;
  status: "available" | "occupied" | "reserved";
  seats: number;
  order?: { id: string; items: number; startTime: string; total: number };
  items?: { item: string; qty: number; price: number }[];
};

interface TableManagementDrawerProps {
  open: boolean;
  onClose: () => void;
  // ✅ add both callbacks
  onTableSelected?: (table: Table) => void; // Start/continue order (hold)
  onCollectPayment?: (table: Table) => void; // Open Payment drawer
}

export function TableManagementDrawer({
  open,
  onClose,
  onTableSelected,
  onCollectPayment,
}: TableManagementDrawerProps) {
  console.log("onTableSelected : ", onTableSelected);
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

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Orders Management</SheetTitle>
          <SheetDescription>Manage tables and current orders</SheetDescription>
        </SheetHeader>

        {/* ✅ forward BOTH actions */}
        <TableManagement
          onStartOrder={(table) => {
            onTableSelected?.(table);
            onClose();
          }}
          onCollectPayment={(table) => {
            onCollectPayment?.(table);
            onClose();
          }}
        />
        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />

        <div className="top-10 right-10 absolute">
          <VideoButton
            onClick={() => setShowRawOverlay(true)}
            label="Watch Video"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

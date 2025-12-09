"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ItemManagement } from "@/components/pos/item-management";
import { useDispatch } from "react-redux";
// ✅ ADD this:
import {
  fetchItemMas,
  selectItemMasItems,
  selectItemMasLoading,
  selectItemMasError,
} from "@/redux/slices/fetchItemMasSlice";

import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useEffect, useState } from "react";
import { useTutorial } from "@/hooks/useTutorial";

interface ItemManagementDrawerProps {
  open: boolean;
  categories: { id: string; name: string }[];
  onClose: () => void; // comes from parent
}

export function ItemManagementDrawer({
  open,
  categories,
  onClose,
}: ItemManagementDrawerProps) {
  const dispatch = useDispatch();

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  const handleClose = () => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelID = property?.id;
      // ✅ new: same idea, but via ItemMas API
      dispatch(fetchItemMas());
    

    onClose(); // call parent's close logic
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Manage Items</SheetTitle>
          <SheetDescription>Add, edit or remove menu items</SheetDescription>
        </SheetHeader>

        <ItemManagement categories={categories} onClose={handleClose} />

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
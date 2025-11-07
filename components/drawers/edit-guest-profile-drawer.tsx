/**
 * EditGuestProfileDrawer.tsx
 * Drawer component to edit guest profile.
 */
"use client";

import { useEffect, useState } from "react";
import { updateGuestProfile } from "@/controllers/guestProfileMasterController";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

interface EditGuestProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profileData: any;
}

export default function EditGuestProfileDrawer({
  isOpen,
  onClose,
  profileData,
}: EditGuestProfileDrawerProps) {
  const [formData, setFormData] = useState({
    profileId: 0,
    hotelId: 0,
    guestName: "",
    phone: "",
    email: "",
    country: "",
    ppNo: "",
    title: "",
    dob: "",
    address: "",
    city: "",
    zipCode: "",
    nationality: "",
    createdBy: "",
    createdOn: "",
    updatedBy: "",
    updatedOn: "",
  });

  const [saving, setSaving] = useState(false);

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
    if (profileData) {
      const now = new Date().toISOString();
      setFormData({
        profileId: profileData.profileId ?? 0,
        hotelId: profileData.hotelId ?? 0,
        guestName: profileData.guestName ?? "",
        phone: profileData.phone ?? "",
        email: profileData.email ?? "",
        country: profileData.country ?? "",
        ppNo: profileData.ppNo ?? "",
        title: profileData.title ?? "",
        dob: profileData.dob ?? "",
        address: profileData.address ?? "",
        city: profileData.city ?? "",
        zipCode: profileData.zipCode ?? "",
        nationality: profileData.nationality ?? "",
        createdBy: profileData.createdBy ?? "Web",
        createdOn: profileData.createdOn ?? now,
        updatedBy: "Web",
        updatedOn: now,
      });
    }
  }, [profileData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const tokenData = localStorage.getItem("hotelmateTokens");
    const selectedProperty = localStorage.getItem("selectedProperty");

    if (!tokenData || !selectedProperty) {
      console.error("Missing token or hotel info");
      setSaving(false);
      return;
    }

    const accessToken = JSON.parse(tokenData).accessToken;
    const hotel = JSON.parse(selectedProperty);
    const now = new Date().toISOString();

    const payload = {
      profileId: formData.profileId,
      hotelId: formData.hotelId,
      guestName: formData.guestName,
      phone: formData.phone,
      email: formData.email,
      country: formData.country,
      ppNo: formData.ppNo,
      title: formData.title || "",
      dob: formData.dob || "",
      address: formData.address || "",
      city: formData.city || "",
      zipCode: formData.zipCode || "",
      nationality: formData.nationality || "",
      createdBy: formData.createdBy,
      createdOn: formData.createdOn,
      updatedBy: formData.updatedBy,
      updatedOn: formData.updatedOn,
    };

    console.log("Payload to be sent:", payload);
    try {
      await updateGuestProfile({
        token: accessToken,
        profileId: formData.profileId,
        payload,
      });
      console.log("Guest profile updated:", payload);
      onClose();
      window.location.reload();
      setSaving(false);
    } catch (error) {
      setSaving(false);
      console.error("Failed to update guest profile:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <div className="flex flex-row justify-between">
            <SheetTitle>Edit Guest Profile</SheetTitle>
            <div className="pr-8">
              <VideoButton
                onClick={() => setShowRawOverlay(true)}
                label="Watch Video"
              />
            </div>
          </div>

          <div className="border-b border-border my-2" />
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="guestName">Guest Name</Label>
            <Input
              id="guestName"
              name="guestName"
              value={formData.guestName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ppNo">Passport Number</Label>
            <Input
              id="ppNo"
              name="ppNo"
              value={formData.ppNo}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

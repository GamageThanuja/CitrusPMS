"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslatedText } from "@/lib/translation";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

// ✅ import new Redux slice
import {
  createNameMas,
  selectCreateNameMasLoading,
  selectCreateNameMasError,
  selectCreateNameMasSuccess,
} from "@/redux/slices/createNameMasSlice";

import { fetchNameMas } from "@/redux/slices/fetchNameMasSlice";

interface AddTravelAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onCreated?: (agent: { nameID: number; name: string }) => void;
}

export function AddTravelAgentDrawer({
  isOpen,
  onClose,
  onSubmit,
  onCreated,
}: AddTravelAgentDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { fullName } = useUserFromLocalStorage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    commission: "",
    status: "Active",
    address: "",
    vatNo: "",
    code: "",
    taType: "",
  });

  const addAgent = useTranslatedText("Add Travel Agent");
  const nameLabel = useTranslatedText("Name");
  const emailLabel = useTranslatedText("Email");
  const phoneLabel = useTranslatedText("Phone");
  const commissionLabel = useTranslatedText("Commission");
  const statusLabel = useTranslatedText("Status");
  const saveLabel = useTranslatedText("Save");
  const cancelLabel = useTranslatedText("Cancel");

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial } = useTutorial("onBoarding", "taxes");

  // 🔹 Redux slice state
  const creating = useSelector(selectCreateNameMasLoading);
  const createError = useSelector(selectCreateNameMasError);
  const createSuccess = useSelector(selectCreateNameMasSuccess);

  useEffect(() => {
    if (tutorial?.videoURL) setVideoUrl(tutorial.videoURL);
  }, [tutorial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProperty = localStorage.getItem("selectedProperty");
    if (!selectedProperty) {
      console.error("Missing hotel info");
      return;
    }

    const hotel = JSON.parse(selectedProperty);
    const now = new Date().toISOString();

    // ✅ Build payload for /api/NameMas
    const payload = {
      finAct: formData.status !== "Active",
      nameID: 0,
      nameType: "Agent",
      code: formData.code,
      name: formData.name,
      companyName: "",
      title: "",
      firstName: "",
      lastName: "",
      email: formData.email,
      phone: formData.phone,
      fax: "",
      customerType: "",
      priceGroupID: 0,
      discount: 0,
      vatNo: formData.vatNo,
      creditLimit: 0,
      createdOn: now,
      createdBy: fullName,
      lastModOn: now,
      lastModBy: fullName,
      nic: "",
      warehouseID: 0,
      cpForDelivery: "",
      cpForDeliveryPhone: "",
      cpForPayments: "",
      cpForPaymentPhone: "",
      creditPeriod: 0,
      buid: hotel.id,
      address1: formData.address,
      address2: "",
      address3: "",
      city: "",
      countryID: 0,
      customerMasterType: "",
      repID: 0,
      purPriceGroupID: 0,
      epfNo: "",
      initials: "",
      gender: "",
      dob: now,
      nationality: "",
      maritalStatus: "",
      passportNo: "",
      jobCategoryID: 0,
      designationID: 0,
      agencyID: 0,
      quotaID: 0,
      insurance: 0,
      wpCategoryID: 0,
      wpNo: 0,
      siteCategoryID: 0,
      basicSalary: 0,
      allowance1: 0,
      allowance2: 0,
      allowance3: 0,
      dateOfJoined: now,
      dateOfPermanent: now,
      dateOfResigned: now,
      empPicturePath: "",
      pin: 0,
      perDaySalary: false,
      priceGroupApproved: false,
      currencyID: 0,
      distance: 0,
      mobileNo: formData.phone,
      shortCode: "",
      notes: "",
      bankAccNo: "",
      bankName: "",
      nAmeOnCheque: "",
      phoneRes: "",
      opBal: 0,
      opBalAsAt: now,
      routeID: 0,
      joinedDate: now,
      isAllowCredit: true,
      cmTaxRate: 0,
      cmChannelID: "",
      isFullPaymentNeededForCheckIn: false,
      isResigned: false,
      departmentID: 0,
      empCategoryID: 0,
      serviceChargePercentage: 0,
      hotelID: hotel.id,
      hotelCode: hotel.hotelCode,
      tranCode: "44",
    };

    try {
      const resultAction = await dispatch(createNameMas(payload)).unwrap();

      const createdAgent = {
        nameID: Number(resultAction?.nameID ?? 0),
        name: formData.name,
      };

      onCreated?.(createdAgent);

      setFormData({
        name: "",
        email: "",
        phone: "",
        commission: "",
        status: "Active",
        address: "",
        vatNo: "",
        code: "",
        taType: "",
      });

      onClose();

      // Optional: refresh list
      dispatch(fetchNameMas({ nameType: "Agent" }));
    } catch (err) {
      console.error("Error creating agent:", err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <div className="flex justify-between">
            <SheetTitle>{addAgent}</SheetTitle>
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
            <Label htmlFor="name">{nameLabel}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Global Travels"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taType">Agent Type</Label>
            <Select
              value={formData.taType}
              onValueChange={(value) => handleSelectChange("taType", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select TA Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Local Travel Agent">Local Travel Agent</SelectItem>
                <SelectItem value="International Travel Agent">
                  International Travel Agent
                </SelectItem>
                <SelectItem value="Online Travel Agent">
                  Online Travel Agent
                </SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
                <SelectItem value="FIT">FIT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{emailLabel}</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{phoneLabel}</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission">{commissionLabel}</Label>
            <Input id="commission" name="commission" value={formData.commission} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatNo">VAT No</Label>
            <Input id="vatNo" name="vatNo" value={formData.vatNo} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{statusLabel}</Label>
            <Select value={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {creating && <p>Saving agent...</p>}
          {createError && <p className="text-red-500">Error: {createError}</p>}
          {createSuccess && <p className="text-green-600">Agent added successfully!</p>}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={creating}>
              {saveLabel}
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
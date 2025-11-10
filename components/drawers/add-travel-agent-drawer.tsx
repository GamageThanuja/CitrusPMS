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
import { Checkbox } from "@/components/ui/checkbox"; // ✅ for Allow Cr. & Full Payment
import { Switch } from "@/components/ui/switch";     // ✅ for “This Agent is Active”

import { useTranslatedText } from "@/lib/translation";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

// Redux
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
    // top toggle
    isActive: true,

    // left column
    taType: "",
    name: "",
    phone: "",
    addressNo: "",
    city: "",
    contactPerson: "",

    // right column
    code: "",
    companyName: "",
    creditLimit: "",
    allowCredit: true,
    fullPaymentNeeded: true,
    addressStreet: "",
    email: "",
    vatTinNo: "",

    // extra kept from your version
    commission: "",

    // Channel Manager
    channelId: "",
    cmTotalTax: "",
  });

  const addAgent = useTranslatedText("Add Travel Agent");
  const nameLabel = useTranslatedText("Name");
  const emailLabel = useTranslatedText("Email");
  const phoneLabel = useTranslatedText("Phone");
  const saveLabel = useTranslatedText("Save");
  const cancelLabel = useTranslatedText("Cancel");

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial } = useTutorial("onBoarding", "taxes");

  const creating = useSelector(selectCreateNameMasLoading);
  const createError = useSelector(selectCreateNameMasError);
  const createSuccess = useSelector(selectCreateNameMasSuccess);

  useEffect(() => {
    if (tutorial?.videoURL) setVideoUrl(tutorial.videoURL);
  }, [tutorial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleCheck = (name: keyof typeof formData, value: boolean) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleUpdateCM = () => {
    // If you have a dedicated endpoint for CM settings, call it here.
    // For now we just log so UX matches screenshot.
    console.info("Update CM Settings:", {
      channelId: formData.channelId,
      cmTotalTax: formData.cmTotalTax,
    });
  };

  const hotelCode = localStorage.getItem("hotelCode");
  console.log("hotelCode from localStorage:", hotelCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

 
  const now = new Date().toISOString();

    const payload = {
      // active flag (finAct usually means “finalized/inactive” in many schemas)
      finAct: !formData.isActive,

      nameID: 0,
      nameType: "Agent",

      code: formData.code,
      name: formData.name,
      companyName: formData.companyName,

      title: "",
      firstName: "",
      lastName: "",

      email: formData.email,
      phone: formData.phone,
      fax: "",

      customerType: "",
      priceGroupID: 0,
      discount: 0,

      vatNo: formData.vatTinNo,
      creditLimit: Number(formData.creditLimit || 0),

      createdOn: now,
      createdBy: fullName,
      lastModOn: now,
      lastModBy: fullName,

      nic: "",
      warehouseID: 0,

      cpForDelivery: "",
      cpForDeliveryPhone: "",
      cpForPayments: formData.contactPerson,
      cpForPaymentPhone: "",

      creditPeriod: 0,
      buid:0,

      // Address split per screenshot
      address1: formData.addressNo,     // Address (No)
      address2: formData.addressStreet, // Address (Street)
      address3: "",
      city: formData.city,
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

      // Bank / misc
      bankAccNo: "",
      bankName: "",
      nAmeOnCheque: "",
      phoneRes: "",
      opBal: 0,
      opBalAsAt: now,
      routeID: 0,
      joinedDate: now,

      // Checkboxes from screenshot
      isAllowCredit: formData.allowCredit,
      isFullPaymentNeededForCheckIn: formData.fullPaymentNeeded,

      // Channel Manager block
      cmTaxRate: Number(formData.cmTotalTax || 0),
      cmChannelID: formData.channelId,

      isResigned: false,
      departmentID: 0,
      empCategoryID: 0,
      serviceChargePercentage: 0,

      hotelID: hotelCode,
      hotelCode: hotelCode,
      tranCode: "0",
    };

    try {
      const resultAction = await dispatch(createNameMas(payload)).unwrap();

      const createdAgent = {
        nameID: Number(resultAction?.nameID ?? 0),
        name: formData.name,
      };
      onCreated?.(createdAgent);

      // reset
      setFormData({
        isActive: true,
        taType: "",
        name: "",
        phone: "",
        addressNo: "",
        city: "",
        contactPerson: "",
        code: "",
        companyName: "",
        creditLimit: "",
        allowCredit: true,
        fullPaymentNeeded: true,
        addressStreet: "",
        email: "",
        vatTinNo: "",
        commission: "",
        channelId: "",
        cmTotalTax: "",
      });

      onClose();
      dispatch(fetchNameMas({ nameType: "Agent" }));
    } catch (err) {
      console.error("Error creating agent:", err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-5xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{addAgent}</SheetTitle>
            <div className="flex items-center gap-3 pr-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(v) => handleCheck("isActive", v)}
                  id="isActive"
                />
                <Label htmlFor="isActive">This Agent is Active</Label>
              </div>
              <VideoButton onClick={() => setShowRawOverlay(true)} label="Watch Video" />
            </div>
          </div>
          <div className="border-b border-border my-2" />
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Two-column grid like the screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taType">Agent Type</Label>
                <Select
                  value={formData.taType}
                  onValueChange={(v) => handleSelectChange("taType", v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select TA Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Local Travel Agent">Local Travel Agent</SelectItem>
                    <SelectItem value="International Travel Agent">International Travel Agent</SelectItem>
                    <SelectItem value="Online Travel Agent">Online Travel Agent</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="FIT">FIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{nameLabel}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Agent Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{phoneLabel}</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone No" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressNo">Address (No)</Label>
                <Input id="addressNo" name="addressNo" value={formData.addressNo} onChange={handleChange} placeholder="No" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Contact Person" />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Agent Code</Label>
                <Input id="code" name="code" value={formData.code} onChange={handleChange} placeholder="Agent Code" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company Name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    id="creditLimit"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                    placeholder="Credit Limit"
                    className="md:col-span-1"
                  />
                  <div className="flex items-center gap-2 md:col-span-1">
                    <Checkbox
                      id="allowCredit"
                      checked={formData.allowCredit}
                      onCheckedChange={(v) => handleCheck("allowCredit", Boolean(v))}
                    />
                    <Label htmlFor="allowCredit">Allow Cr.</Label>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-1">
                    <Checkbox
                      id="fullPaymentNeeded"
                      checked={formData.fullPaymentNeeded}
                      onCheckedChange={(v) => handleCheck("fullPaymentNeeded", Boolean(v))}
                    />
                    <Label htmlFor="fullPaymentNeeded">Full Payment Needed for Check-in</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressStreet">Address (Street)</Label>
                <Input id="addressStreet" name="addressStreet" value={formData.addressStreet} onChange={handleChange} placeholder="Street" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{emailLabel}</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatTinNo">VAT/TIN No</Label>
                <Input id="vatTinNo" name="vatTinNo" value={formData.vatTinNo} onChange={handleChange} placeholder="VAT/TIN No" />
              </div>
            </div>
          </div>

          {/* Channel Manager section */}
          <div className="mt-2 rounded-xl border p-4 space-y-4">
            <h3 className="font-medium">Channel Manager</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="channelId">Channel ID</Label>
                </div>
                <Input
                  id="channelId"
                  name="channelId"
                  value={formData.channelId}
                  onChange={handleChange}
                  placeholder="Channel ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cmTotalTax">Total Tax Amount on Channel</Label>
                <Input
                  id="cmTotalTax"
                  name="cmTotalTax"
                  value={formData.cmTotalTax}
                  onChange={handleChange}
                  placeholder="Total Tax Amount on Channel"
                />
              </div>
            </div>

            <div>
              <Button type="button" onClick={handleUpdateCM} className="w-full md:w-auto">
                Update CM Settings
              </Button>
            </div>
          </div>

          {/* Save / Cancel */}
          {creating && <p>Saving agent...</p>}
          {createError && <p className="text-red-500">Error: {createError}</p>}
          {createSuccess && <p className="text-green-600">Agent added successfully!</p>}

          <div className="flex justify-end gap-2 pt-2">
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
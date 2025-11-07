"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import { updateNameMas } from "@/redux/slices/updateNameMasSlice";

interface EditTravelAgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  agentData: any;
}

export function EditTravelAgentDrawer({
  isOpen,
  onClose,
  onSubmit,
  agentData,
}: EditTravelAgentDrawerProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNo: "",
    commission: "",
    address: "",
    vatNo: "",
    code: "",
    status: "Active",
    nameID: 0,
    hotelID: 0,
    hotelCode: 0,
    tranCode: "",
    createdOn: "",
  });

  const editAgent = useTranslatedText("Edit Travel Agent");
  const nameLabel = useTranslatedText("Name");
  const emailLabel = useTranslatedText("Email");
  const phoneLabel = useTranslatedText("Phone");
  const commissionLabel = useTranslatedText("Commission");
  const statusLabel = useTranslatedText("Status");
  const saveLabel = useTranslatedText("Save");

  useEffect(() => {
    if (agentData) {
      setFormData({
        name: agentData.name ?? "",
        email: agentData.email ?? "",
        phoneNo: agentData.phoneNo ?? "",
        commission: agentData.commission ?? "",
        address: agentData.address ?? "",
        vatNo: agentData.vatNo ?? "",
        code: agentData.code ?? "",
        status: agentData.finAct === false ? "Active" : "Inactive",
        nameID: agentData.nameID ?? 0,
        hotelID: agentData.hotelID ?? 0,
        hotelCode: agentData.hotelCode ?? 0,
        tranCode: agentData.tranCode ?? "",
        createdOn: agentData.createdOn ?? "",
      });
    }
  }, [agentData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const tokenData = localStorage.getItem("hotelmateTokens");
    // const selectedProperty = localStorage.getItem("selectedProperty");

    // if (!tokenData || !selectedProperty) {
    //   console.error("Missing token or hotel info");
    //   return;
    // }

    // const accessToken = JSON.parse(tokenData).accessToken;
    const now = new Date().toISOString();

    // ✅ Fully expanded payload matching NameMasPayload type
    const payload = {
      finAct: formData.status === "Active" ? false : true,
      nameID: formData.nameID,
      nameType: "Customer",
      code: formData.code || "",
      name: formData.name || "",
      companyName: formData.name || "",
      title: "",
      firstName: "",
      lastName: "",
      email: formData.email || "",
      phone: formData.phoneNo || "",
      fax: "",
      customerType: "",
      priceGroupID: 0,
      discount: 0,
      vatNo: formData.vatNo || "",
      creditLimit: 0,
      createdOn: agentData.createdOn || now,
      createdBy: "Web",
      lastModOn: now,
      lastModBy: "Web",
      nic: "",
      warehouseID: 0,
      cpForDelivery: "",
      cpForDeliveryPhone: "",
      cpForPayments: "",
      cpForPaymentPhone: "",
      creditPeriod: 0,
      buid: 0,
      address1: formData.address || "",
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
      dob: "", //  string instead of null
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
      dateOfJoined: "", //  string
      dateOfPermanent: "", //  string
      dateOfResigned: "", //  string
      empPicturePath: "",
      pin: 0,
      perDaySalary: false,
      priceGroupApproved: false,
      currencyID: 0,
      distance: 0,
      mobileNo: "",
      shortCode: "",
      notes: "",
      bankAccNo: "",
      bankName: "",
      nAmeOnCheque: "",
      phoneRes: "",
      opBal: 0,
      opBalAsAt: "", //  string
      routeID: 0,
      joinedDate: "", //  string
      isAllowCredit: false,
      cmTaxRate: 0,
      cmChannelID: "",
      isFullPaymentNeededForCheckIn: false,
      isResigned: false,
      departmentID: 0,
      empCategoryID: 0,
      serviceChargePercentage: 0,
      tranCode: formData.tranCode || "",

      // Additional local or required
      hotelID: formData.hotelID,
      hotelCode: formData.hotelCode,
      taType: "Online Travel Agent",
      status: formData.status,
      customField1: "",
      customField2: "",
      customField3: "",
      customField4: "",
      customField5: "",
    };

    console.log(" Payload being sent:", payload);

    try {
      await updateNameMas({
        token: 'test',
        nameID: formData.nameID,
        payload,
      });
      onSubmit(payload);
      onClose();
      window.location.reload();
    } catch (err) {
      console.error("API error:", err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>{editAgent}</SheetTitle>
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
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{emailLabel}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNo">{phoneLabel}</Label>
            <Input
              id="phoneNo"
              name="phoneNo"
              value={formData.phoneNo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission">{commissionLabel}</Label>
            <Input
              id="commission"
              name="commission"
              value={formData.commission}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatNo">VAT No</Label>
            <Input
              id="vatNo"
              name="vatNo"
              value={formData.vatNo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{statusLabel}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="submit">{saveLabel}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

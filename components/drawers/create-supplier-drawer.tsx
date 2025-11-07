"use client";

import type React from "react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
// ⬇️ swap controller for thunk
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";

import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { createNameMaster } from "@/redux/slices/createNameMasterSlice";

interface AddSupplierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void; // made optional since redux handles submit
}

export function AddSupplierDrawer({
  isOpen,
  onClose,
  onSubmit,
}: AddSupplierDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector(
    (s: RootState) => s.nameMaster || { loading: false, error: null }
  );

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    category: "",
    address: "",
    status: "Active",
    vatNo: "",
    commissionPercentage: "", // keep as string for input, cast later
  });

  const addSupplier = useTranslatedText("Add Supplier");
  const nameLabel = useTranslatedText("Name");
  const contactLabel = useTranslatedText("Contact");
  const emailLabel = useTranslatedText("Email");
  const phoneLabel = useTranslatedText("Phone");
  const categoryLabel = useTranslatedText("Category");
  const statusLabel = useTranslatedText("Status");
  const saveLabel = useTranslatedText("Save");
  const cancelLabel = useTranslatedText("Cancel");
  const enterSupplierDetails = useTranslatedText(
    "Enter the details for the new supplier"
  );
  const { fullName } = useUserFromLocalStorage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // simple code generator if you don’t collect a supplier "code" explicitly
  const genCodeFromName = (n: string) =>
    n?.trim()
      ? n
          .toUpperCase()
          .replace(/\s+/g, "_")
          .replace(/[^A-Z0-9_]/g, "")
          .slice(0, 20)
      : "SUPPLIER";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // optional passthrough for callers that still use onSubmit
    onSubmit?.(formData);

    // Build payload for the thunk. The thunk will add hotelID/createdOn/updatedOn.
    const payload = {
      nameID: 0,
      code: genCodeFromName(formData.name),
      name: formData.name,
      nameType: "Supplier",
      taType: "Supplier",
      finAct: false,
      createdBy: fullName || "System",
      updatedBy: fullName || "System",
      hotelCode: 0, // thunk will use selectedProperty; this can be ignored by API
      tranCode: "45",
      phoneNo: formData.phone || "",
      email: formData.email || "",
      address: formData.address || "",
      vatNo: formData.vatNo || "",
      commissionPercentage: formData.commissionPercentage
        ? Number(formData.commissionPercentage)
        : 0,
    };

    try {
      const res = await dispatch(createNameMaster(payload)).unwrap();
      console.log("Supplier added successfully", res);

      // reset & close
      setFormData({
        name: "",
        contact: "",
        email: "",
        phone: "",
        category: "",
        address: "",
        status: "Active",
        vatNo: "",
        commissionPercentage: "",
      });
      onClose();
    } catch (err) {
      console.error("Error submitting supplier:", err);
      // you can show a toast here if you use one
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>{addSupplier}</SheetTitle>
          <SheetDescription>{enterSupplierDetails}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{nameLabel}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ABC Food Supplies"
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
              placeholder="john@abcfoods.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{phoneLabel}</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+94 7X XXX XXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
            />
          </div>

          {/* Optional extras to satisfy your slice shape */}
          <div className="space-y-2">
            <Label htmlFor="vatNo">VAT No</Label>
            <Input
              id="vatNo"
              name="vatNo"
              value={formData.vatNo}
              onChange={handleChange}
              placeholder="(optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commissionPercentage">Commission %</Label>
            <Input
              id="commissionPercentage"
              name="commissionPercentage"
              type="number"
              step="0.01"
              min="0"
              value={formData.commissionPercentage}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{categoryLabel}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                <SelectItem value="Furniture">Furniture</SelectItem>
                <SelectItem value="Cleaning Supplies">
                  Cleaning Supplies
                </SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Linens">Linens</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
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

          {error ? (
            <p className="text-sm text-red-600">{String(error)}</p>
          ) : null}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : saveLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

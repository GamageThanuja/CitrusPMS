// components/drawers/add-supplier-drawer.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
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
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { createNameMaster } from "@/controllers/nameMasterController";

// ✅ NEW: import redux hooks + thunk + selector
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  updateNameMaster,
  selectUpdateNameMaster,
  resetUpdateNameMaster,
} from "@/redux/slices/updateNameMasterSlice";

type Mode = "create" | "edit";

type NewProps = {
  isOpen: boolean;
  onClose: () => void;
  mode?: Mode;
  initial?: any | null;
  onSubmitLocal?: (data: any) => void; // used only on create (optional)
  onSubmit?: (data: any) => void; // legacy
};

type FormState = {
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  address: string;
  status: "Active" | "Inactive" | string;
};

const emptyForm: FormState = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  category: "",
  address: "",
  status: "Active",
};

export function AddSupplierDrawer(props: NewProps) {
  const {
    isOpen,
    onClose,
    mode: _mode,
    initial,
    onSubmitLocal,
    onSubmit,
  } = props;
  const mode: Mode = _mode ?? (initial?.nameID ? "edit" : "create");

  const dispatch = useDispatch<AppDispatch>();
  const { status: updStatus, error: updError } = useSelector(
    selectUpdateNameMaster
  );

  const [formData, setFormData] = useState<FormState>(emptyForm);

  const addSupplier = useTranslatedText(
    mode === "edit" ? "Edit Supplier" : "Add Supplier"
  );
  const nameLabel = useTranslatedText("Name");
  const contactLabel = useTranslatedText("Contact");
  const emailLabel = useTranslatedText("Email");
  const phoneLabel = useTranslatedText("Phone");
  const categoryLabel = useTranslatedText("Category");
  const statusLabel = useTranslatedText("Status");
  const saveLabel = useTranslatedText("Save");
  const cancelLabel = useTranslatedText("Cancel");
  const enterSupplierDetails = useTranslatedText(
    mode === "edit"
      ? "Update the supplier details"
      : "Enter the details for the new supplier"
  );
  const { fullName } = useUserFromLocalStorage();

  // Prefill for edit
  useEffect(() => {
    if (mode === "edit" && initial) {
      setFormData({
        name: initial.name ?? "",
        contact: initial.contact ?? "",
        email: initial.email ?? "",
        phone: initial.phoneNo ?? initial.phone ?? "",
        category: initial.category ?? "",
        address: initial.address ?? "",
        status:
          initial.status ??
          (initial.isActive === false ? "Inactive" : "Active"),
      });
    } else {
      setFormData(emptyForm);
    }
    // reset slice state when opening fresh
    if (isOpen) dispatch(resetUpdateNameMaster());
  }, [mode, initial, isOpen, dispatch]);

  const tokens = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    } catch {
      return {};
    }
  }, [isOpen]);

  const selectedProperty = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedProperty") || "{}");
    } catch {
      return {};
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (name: keyof FormState, value: string) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hotelID = selectedProperty?.id || 0;
    const hotelCode = selectedProperty?.hotelCode || 0;
    const nowIso = new Date().toISOString();

    const basePayload = {
      hotelID,
      code: "",
      name: formData.name,
      nameType: "Supplier",
      taType: "Supplier",
      finAct: false,
      email: formData.email,
      address: formData.address,
      phoneNo: formData.phone,
      createdBy: fullName || tokens?.fullName || "",
      createdOn: nowIso,
      updatedOn: nowIso,
      updatedBy: tokens?.fullName || "System",
      hotelCode,
      tranCode: "45",
      isActive: formData.status !== "Inactive",
    };

    try {
      if (mode === "edit" && initial?.nameID) {
        // ✅ Use Redux thunk for UPDATE
        await dispatch(
          updateNameMaster({
            id: initial.nameID,
            payload: { ...basePayload, nameID: initial.nameID },
          })
        ).unwrap();

        onSubmit?.({ ...formData, nameID: initial.nameID }); // legacy callback if used
      } else {
        // CREATE path unchanged (controller)
        await createNameMaster({
          token: tokens?.accessToken || "",
          payload: { ...basePayload, nameID: 0 },
        });
        onSubmitLocal?.({
          ...formData,
          id: crypto.randomUUID(),
          status: formData.status || "Active",
        });
        onSubmit?.(formData); // legacy
      }
      setFormData(emptyForm);
      onClose();
    } catch (err) {
      console.error("Supplier submit failed:", err);
      // optional: toast error using updError
    }
  };

  const isSaving = updStatus === "loading";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <SheetContent
        side="right"
        className="z-[80] w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>{addSupplier}</SheetTitle>
          <SheetDescription>{enterSupplierDetails}</SheetDescription>
        </SheetHeader>

        {/* Optional inline error display for edit path */}
        {updStatus === "failed" && updError && (
          <div className="mb-2 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {updError}
          </div>
        )}

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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{phoneLabel}</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{categoryLabel}</Label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-input bg-background px-3 py-2 text-sm shadow-sm rounded-md"
            >
              <option value="" disabled>
                Select a category
              </option>
              <option value="Food & Beverage">Food &amp; Beverage</option>
              <option value="Furniture">Furniture</option>
              <option value="Cleaning Supplies">Cleaning Supplies</option>
              <option value="Electronics">Electronics</option>
              <option value="Linens">Linens</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{statusLabel}</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full border border-input bg-background px-3 py-2 text-sm shadow-sm rounded-md"
            >
              <option value="" disabled>
                Select status
              </option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : saveLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

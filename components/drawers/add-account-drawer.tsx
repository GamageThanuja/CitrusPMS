"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { createGlAccount } from "@/redux/slices/glAccountSlice";
import { fetchGlAccountTypes } from "@/redux/slices/glAccountTypeSlice";
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

interface AddAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAccountDrawer({ isOpen, onClose }: AddAccountDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.glAccount);
  const accountTypes = useSelector(
    (state: RootState) => state.glAccountType.data
  );

  const [formData, setFormData] = useState({
    accountTypeID: "",
    accountCode: "",
    accountName: "",
    description: "",
    accDetailTypeID: "",
    finAct: false,
    hotelID: "",
  });

  useEffect(() => {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : null;
    if (property?.id) {
      setFormData((prev) => ({ ...prev, hotelID: property.id }));
    }
    dispatch(fetchGlAccountTypes());
  }, [dispatch]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleAccountTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedID = e.target.value;
    const selected = accountTypes.find(
      (type) => type.accountTypeID.toString() === selectedID
    );

    const paddedID = selectedID.length === 1 ? `0${selectedID}` : selectedID;
    const accountCode = selected ? `${paddedID}${selected.nextCode}` : "";

    setFormData((prev) => ({
      ...prev,
      accountTypeID: selectedID,
      accountCode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      accountTypeID: parseInt(formData.accountTypeID),
      accDetailTypeID: 1,
      hotelID: String(formData.hotelID),
    };

    await dispatch(createGlAccount(payload));
    setFormData({
      accountTypeID: "",
      accountCode: "",
      accountName: "",
      description: "",
      accDetailTypeID: "",
      finAct: false,
      hotelID: formData.hotelID,
    });
    onClose();
  };

  console.log("accountCode:", formData.accountCode);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="z-[60] w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Add Account</SheetTitle>
          <SheetDescription>
            Enter the details to create a new account
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accountTypeID">Account Type</Label>
            <select
              id="accountTypeID"
              name="accountTypeID"
              className="w-full border rounded-md p-2 text-sm"
              value={formData.accountTypeID}
              onChange={handleAccountTypeChange}
              required
            >
              <option value="">Select account type</option>
              {accountTypes.map((type) => (
                <option
                  key={type.accountTypeID}
                  value={type.accountTypeID.toString()}
                >
                  {type.accountType}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="finAct"
              name="finAct"
              type="checkbox"
              checked={formData.finAct}
              onChange={handleChange}
            />
            <Label htmlFor="finAct">Is Financial Account?</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>

          {error && <p className="text-red-500 text-sm">Error: {error}</p>}
        </form>
      </SheetContent>
    </Sheet>
  );
}

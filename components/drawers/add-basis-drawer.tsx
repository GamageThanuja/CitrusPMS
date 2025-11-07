"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { createBasisMas } from "@/redux/slices/createBasisMasSlice";
import { fetchBasisMas } from "@/redux/slices/fetchBasisMasSlice";

interface AddBasisDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AddBasisDrawer({ open, onClose }: AddBasisDrawerProps) {
  const dispatch = useDispatch<any>();

  // form state
  const [basisID, setBasisID] = useState<string>("");
  const [basis, setBasis] = useState<string>("");
  const [cmRateID, setCmRateID] = useState<string>("");
  const [showOnIBE, setShowOnIBE] = useState<boolean>(true);
  const [descOnIBE, setDescOnIBE] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  // create slice state
  const createLoading = useSelector((s: RootState) => s.createBasisMas.loading);
  const createError = useSelector((s: RootState) => s.createBasisMas.error);

  // clear form when opened/closed
  useEffect(() => {
    if (!open) return;
    setBasisID("");
    setBasis("");
    setCmRateID("");
    setShowOnIBE(true);
    setDescOnIBE("");
  }, [open]);

  const handleSubmit = async () => {
    if (!basis.trim()) {
      alert("Basis is required");
      return;
    }

    setSaving(true);
    try {
      await dispatch(
        createBasisMas({
          basisID: Number(basisID) || 0,
          basis: basis.trim(),
          cmRateID: cmRateID.trim(),
          showOnIBE,
          descOnIBE: descOnIBE.trim(),
        })
      ).unwrap();

      // refresh list
      dispatch(fetchBasisMas());

      // reset + close
      setBasisID("");
      setBasis("");
      setCmRateID("");
      setShowOnIBE(true);
      setDescOnIBE("");
      onClose();
    } catch (e: any) {
      console.error("Create basis failed:", e);
      alert(typeof e === "string" ? e : "Failed to create basis");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>Add Room Basis</SheetTitle>
          <SheetDescription>
            Define the basis details below and save to create a new basis record.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          {/* Basis */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Basis *</Label>
            <Input
              value={basis}
              onChange={(e) => setBasis(e.target.value)}
              placeholder="e.g., EP, BB, HB, FB, AI"
            />
          </div>

          {/* CM Rate ID */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">CM Rate ID</Label>
            <Input
              value={cmRateID}
              onChange={(e) => setCmRateID(e.target.value)}
              placeholder="Rate code / mapping"
            />
          </div>

          {/* Show on IBE */}
          <div className="flex items-center justify-between border rounded px-3 py-2">
            <div>
              <Label className="text-sm">Show on IBE</Label>
              <p className="text-xs text-muted-foreground">Toggle to display this basis in the booking engine.</p>
            </div>
            <Switch checked={showOnIBE} onCheckedChange={setShowOnIBE} />
          </div>

          {/* Description on IBE */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Description</Label>
            <Textarea
              value={descOnIBE}
              onChange={(e) => setDescOnIBE(e.target.value)}
              placeholder="Short description shown on IBE"
              rows={3}
            />
          </div>

          {createError && (
            <p className="text-sm text-red-500">Failed to create: {createError}</p>
          )}

          <Button onClick={handleSubmit} disabled={saving || createLoading}>
            {saving || createLoading ? "Saving..." : "Save Basis"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
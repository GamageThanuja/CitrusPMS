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
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { fetchBasisMas } from "@/redux/slices/fetchBasisMasSlice";
import { editBasisMasByBasisKey } from "@/redux/slices/editBasisMasByBasisKeySlice";

export interface BasisMasItem {
  basisID: number;
  basis: string;
  cmRateID: string;
  showOnIBE: boolean;
  descOnIBE: string;
}

interface EditBasisDrawerProps {
  open: boolean;
  onClose: () => void;
  record: BasisMasItem | null; // record to edit
}

export default function EditBasisDrawer({ open, onClose, record }: EditBasisDrawerProps) {
  const dispatch = useDispatch<any>();

  const loading = useSelector((s: RootState) => s.editBasisMasByBasisKey?.loading as boolean);
  const error = useSelector((s: RootState) => s.editBasisMasByBasisKey?.error as string | null);

  // keep the original key for path param
  const basisKey = useMemo(() => record?.basis ?? "", [record?.basis]);

  // local form state
  const [basisID, setBasisID] = useState<string>("");
  const [basis, setBasis] = useState<string>("");
  const [cmRateID, setCmRateID] = useState<string>("");
  const [showOnIBE, setShowOnIBE] = useState<boolean>(true);
  const [descOnIBE, setDescOnIBE] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  // hydrate form when opening or record changes
  useEffect(() => {
    if (!open) return;
    setBasisID(record?.basisID != null ? String(record.basisID) : "");
    setBasis(record?.basis ?? "");
    setCmRateID(record?.cmRateID ?? "");
    setShowOnIBE(Boolean(record?.showOnIBE));
    setDescOnIBE(record?.descOnIBE ?? "");
  }, [open, record]);

  const handleSave = async () => {
    if (!basisKey) {
      alert("Missing basis key to update.");
      return;
    }
    if (!basis.trim()) {
      alert("Basis is required");
      return;
    }
    setSaving(true);
    try {
      await dispatch(
        editBasisMasByBasisKey({
          basisKey,
          data: {
            basisID: Number(basisID) || 0,
            basis: basis.trim(),
            cmRateID: cmRateID.trim(),
            showOnIBE,
            descOnIBE: descOnIBE.trim(),
          },
        })
      ).unwrap();

      // refresh list
      dispatch(fetchBasisMas());

      onClose();
    } catch (e: any) {
      console.error("Update basis failed:", e);
      alert(typeof e === "string" ? e : "Failed to update basis");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>Edit Room Basis</SheetTitle>
          <SheetDescription>
            Update the details for this basis. Path key: <span className="font-mono">{basisKey || "(unknown)"}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-6">
          {/* Basis ID */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Basis ID</Label>
            <Input
              type="text"
              value={basisID}
              onChange={(e) => setBasisID(e.target.value.replace(/^0+(?=\d)/, ""))}
              placeholder="ID"
            />
          </div>

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

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm text-muted-foreground">Description</Label>
            <Textarea
              value={descOnIBE}
              onChange={(e) => setDescOnIBE(e.target.value)}
              placeholder="Short description shown on IBE"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-500">Failed to update: {error}</p>}

          <Button onClick={handleSave} disabled={saving || loading}>
            {saving || loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

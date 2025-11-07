"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
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
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info, Save } from "lucide-react";

import {
  updateHotelPosCenter,
  resetUpdateHotelPosCenterState,
  type HotelPosCenterResponse,
} from "@/redux/slices/updateHotelPosCenterSlice";
import { updatePosCenterTaxConfig } from "@/redux/slices/updatePosCenterTaxConfigSlice";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface PosCenterTaxRow {
  recordId: number;
  hotelId: number;
  hotelPOSCenterId: number;
  taxName: string;
  percentage: number;
  calcBasedOn: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

interface EditOutletDrawerProps {
  open: boolean;
  onClose: () => void;
  outlet: HotelPosCenterResponse | null;
}

export default function EditOutletDrawer({
  open,
  onClose,
  outlet,
}: EditOutletDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [posCenter, setPosCenter] = useState("");
  const [serviceCharge, setServiceCharge] = useState<string>("0");
  const [taxes, setTaxes] = useState<string>("0");
  const [kotPrinter, setKotPrinter] = useState("");
  const [billPrinter, setBillPrinter] = useState("");
  const [botPrinter, setBotPrinter] = useState("");
  const [billCopies, setBillCopies] = useState<string>("0");
  const [isShowOnGSS, setIsShowOnGSS] = useState<boolean>(true);

  const [taxRows, setTaxRows] = useState<PosCenterTaxRow[]>([]);
  const [loadingTaxes, setLoadingTaxes] = useState(false);
  const [savingAllTaxes, setSavingAllTaxes] = useState(false);
  const [saveAllError, setSaveAllError] = useState<string | null>(null);
  const [saveAllOk, setSaveAllOk] = useState(false);

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

  const updOutletState = useSelector(
    (s: RootState) => (s as any).updateHotelPosCenter
  ) as { loading: boolean; success: boolean; error: string | null };

  const updTaxState = useSelector(
    (s: RootState) => (s as any).updatePosCenterTaxConfig
  ) as { loading: boolean; success: boolean; error: string | null };

  useEffect(() => {
    if (!outlet) return;
    setPosCenter(outlet.posCenter ?? "");
    setServiceCharge(String(outlet.serviceCharge ?? 0));
    setTaxes(String(outlet.taxes ?? 0));
    setKotPrinter(outlet.kotPrinter ?? "");
    setBillPrinter(outlet.billPrinter ?? "");
    setBotPrinter(outlet.botPrinter ?? "");
    setBillCopies(String(outlet.billCopies ?? 0));
    setIsShowOnGSS(Boolean(outlet.isShowOnGSS ?? true));
  }, [outlet, open]);

  useEffect(() => {
    if (!open || !outlet?.hotelPosCenterId) return;
    fetchTaxRows(outlet.hotelPosCenterId);
  }, [open, outlet?.hotelPosCenterId]);

  const fetchTaxRows = async (hotelPosCenterId: number) => {
    setLoadingTaxes(true);
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const accessToken = tokens?.accessToken;
      const url = `${BASE_URL}/api/HotelPOSCenterTaxConfig/pos-center/${hotelPosCenterId}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PosCenterTaxRow[] = await res.json();
      setTaxRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load POS-center tax configs:", e);
      setTaxRows([]);
    } finally {
      setLoadingTaxes(false);
    }
  };

  const handleSaveOutlet = async () => {
    if (!outlet?.hotelPosCenterId) return;
    const payload = {
      hotelPosCenterId: Number(outlet.hotelPosCenterId),
      posCenter: posCenter.trim(),
      serviceCharge: Number(serviceCharge) || 0,
      taxes: Number(taxes) || 0,
      kotPrinter: kotPrinter || null,
      billPrinter: billPrinter || null,
      botPrinter: botPrinter || null,
      billCopies: Number(billCopies) || 0,
      isShowOnGSS,
    };
    await dispatch(updateHotelPosCenter(payload)).unwrap().catch(console.error);
  };

  const handleTaxRowChange = (idx: number, patch: Partial<PosCenterTaxRow>) => {
    setTaxRows((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  };

  const handleSaveAllTaxes = async () => {
    if (!outlet?.hotelPosCenterId) return;
    setSavingAllTaxes(true);
    setSaveAllError(null);
    setSaveAllOk(false);
    try {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const updatedBy = tokens?.fullName || tokens?.email || "System";
      const ops = taxRows.map((row) =>
        dispatch(
          updatePosCenterTaxConfig({
            recordId: row.recordId,
            hotelPOSCenterId: row.hotelPOSCenterId,
            taxName: row.taxName,
            percentage: Number(row.percentage) || 0,
            calcBasedOn: row.calcBasedOn,
            updatedBy,
          })
        ).unwrap()
      );
      const results = await Promise.allSettled(ops);
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length)
        setSaveAllError(`${failed.length} row(s) failed to update`);
      else setSaveAllOk(true);
    } catch (e: any) {
      setSaveAllError(e?.message ?? "Save failed");
    } finally {
      setSavingAllTaxes(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Edit POS Outlet</SheetTitle>
          <SheetDescription>
            Modify outlet details and update all tax percentages together.
          </SheetDescription>
        </SheetHeader>

        {!outlet ? (
          <div className="mt-6 text-sm text-muted-foreground">
            No outlet selected.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* DETAILS */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Outlet Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>POS Center Name</Label>
                  <Input
                    value={posCenter}
                    onChange={(e) => setPosCenter(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Outlet Currency</Label>
                  <Input
                    value={outlet?.outletCurrency ?? ""}
                    disabled
                    className="opacity-90"
                  />
                </div>
                <div>
                  <Label>Service Charge (%)</Label>
                  <Input
                    inputMode="decimal"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Other Taxes (sum %)</Label>
                  <Input
                    inputMode="decimal"
                    value={taxes}
                    onChange={(e) => setTaxes(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="isShowOnGSS"
                    type="checkbox"
                    className="h-4 w-4 accent-black"
                    checked={isShowOnGSS}
                    onChange={(e) => setIsShowOnGSS(e.target.checked)}
                  />
                  <Label htmlFor="isShowOnGSS">Show on GSS</Label>
                </div>
                <div>
                  <Label>KOT Printer</Label>
                  <Input
                    value={kotPrinter}
                    onChange={(e) => setKotPrinter(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bill Printer</Label>
                  <Input
                    value={billPrinter}
                    onChange={(e) => setBillPrinter(e.target.value)}
                  />
                </div>
                <div>
                  <Label>BOT Printer</Label>
                  <Input
                    value={botPrinter}
                    onChange={(e) => setBotPrinter(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bill Copies</Label>
                  <Input
                    inputMode="numeric"
                    value={billCopies}
                    onChange={(e) => setBillCopies(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveOutlet}
                  disabled={updOutletState.loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updOutletState.loading ? "Saving…" : "Save Outlet"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!outlet) return;
                    setPosCenter(outlet.posCenter ?? "");
                    setServiceCharge(String(outlet.serviceCharge ?? 0));
                    setTaxes(String(outlet.taxes ?? 0));
                    setKotPrinter(outlet.kotPrinter ?? "");
                    setBillPrinter(outlet.billPrinter ?? "");
                    setBotPrinter(outlet.botPrinter ?? "");
                    setBillCopies(String(outlet.billCopies ?? 0));
                    setIsShowOnGSS(Boolean(outlet.isShowOnGSS ?? true));
                    dispatch(resetUpdateHotelPosCenterState());
                  }}
                  className="w-40"
                >
                  Reset
                </Button>
              </div>
              {updOutletState.error && (
                <p className="text-xs text-red-600">{updOutletState.error}</p>
              )}
            </section>

            <Separator />

            {/* TAX ROWS — 2-column grid, label = tax name, input with % suffix */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <h3 className="font-semibold">Outlet Taxes</h3>
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Edit percentages; Save All to persist.
                </span>
              </div>

              {loadingTaxes ? (
                <div className="text-sm text-muted-foreground">
                  Loading tax rows…
                </div>
              ) : taxRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No tax rows found for this outlet.
                </div>
              ) : (
                <>
                  {/* 2-column grid of inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {taxRows.map((row, idx) => (
                      <Card key={row.recordId} className="p-4">
                        <Label className="text-xs text-slate-500">
                          {row.taxName}
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            inputMode="decimal"
                            value={String(row.percentage)}
                            onChange={(e) =>
                              handleTaxRowChange(idx, {
                                percentage: Number(e.target.value) || 0,
                              })
                            }
                            placeholder="0"
                            className="pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            %
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="pt-3">
                    <Button
                      onClick={handleSaveAllTaxes}
                      disabled={savingAllTaxes}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {savingAllTaxes ? "Saving All…" : "Save All Taxes"}
                    </Button>
                    {saveAllError && (
                      <p className="mt-2 text-xs text-red-600">
                        {saveAllError}
                      </p>
                    )}
                    {saveAllOk && !saveAllError && (
                      <p className="mt-2 text-xs text-emerald-600">
                        Taxes updated successfully.
                      </p>
                    )}
                    {updTaxState.error && (
                      <p className="mt-1 text-xs text-red-600">
                        {String(updTaxState.error)}
                      </p>
                    )}
                  </div>
                </>
              )}
            </section>

            <div className="pt-4">
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
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

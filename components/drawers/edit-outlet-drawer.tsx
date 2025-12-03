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
  updateHotelPOSCenterMas,
  resetUpdateHotelPOSCenterMasState,
  type UpdateHotelPOSCenterMasPayload,
} from "@/redux/slices/updateHotelPOSCenterMasSlice";
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
  outlet: any | null;
  onUpdated?: () => void; // 👈 new
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
    (s: RootState) => (s as any).updateHotelPOSCenterMas
  ) as { loading: boolean; success: boolean; error: string | null };

  useEffect(() => {
    if (!outlet) return;

    const o = outlet as any;

    // Name
    setPosCenter(o.posCenter ?? o.posCenterName ?? "");

    // Service charge
    setServiceCharge(String(o.serviceCharge ?? o.sc ?? 0));

    // Other taxes – you can adjust this if you want some other logic
    const taxSum =
      o.taxes ?? (o.vat ?? 0) + (o.nbt ?? 0) + (o.sc ?? 0) + (o.ct ?? 0);

    setTaxes(String(taxSum || 0));

    // Printers
    setKotPrinter(o.kotPrinter ?? o.kotPrinterName ?? "");
    setBillPrinter(o.billPrinter ?? o.billPrinterName ?? "");
    setBotPrinter(o.botPrinter ?? o.botPrinterName ?? "");

    // Bill copies
    setBillCopies(String(o.billCopies ?? o.noOfBillCopies ?? 0));

    // Show on GSS / show flag
    setIsShowOnGSS(Boolean(o.isShowOnGSS ?? o.showOnGSS ?? o.show ?? true));
  }, [outlet, open]);

  const handleSaveOutlet = async () => {
    if (!outlet) return;
    // ID for URL segment
    const posCenterId = Number(
      (outlet as any).posCenterID ?? (outlet as any).hotelPosCenterId
    );
    if (!posCenterId) return;

    // Build full payload based on existing outlet, overriding edited fields
    const data: UpdateHotelPOSCenterMasPayload = {
      posCenterID: posCenterId,
      posCenterCode: (outlet as any).posCenterCode ?? "",
      posCenterName: posCenter.trim(),
      nextBillNo: (outlet as any).nextBillNo ?? "",
      hotelCode: (outlet as any).hotelCode ?? "",
      createdBy: (outlet as any).createdBy ?? "system",
      createdOn: (outlet as any).createdOn ?? new Date().toISOString(),
      finAct: (outlet as any).finAct ?? true,

      // 👇 use edited printer names / bill copies
      kotPrinterName: kotPrinter || (outlet as any).kotPrinterName || "",
      botPrinterName: botPrinter || (outlet as any).botPrinterName || "",
      billPrinterName: billPrinter || (outlet as any).billPrinterName || "",
      nextOrderNo: (outlet as any).nextOrderNo ?? "",
      locationID: (outlet as any).locationID ?? 0,
      show: (outlet as any).show ?? true,

      isTaxInclusivePrices: (outlet as any).isTaxInclusivePrices ?? false,
      isAskRoomNo: (outlet as any).isAskRoomNo ?? false,
      isAskTableNo: (outlet as any).isAskTableNo ?? false,
      isAskDeliveryMtd: (outlet as any).isAskDeliveryMtd ?? false,
      isAskPOSCenter: (outlet as any).isAskPOSCenter ?? false,
      isAskNoOfPax: (outlet as any).isAskNoOfPax ?? false,
      isChargeSeperateSC: (outlet as any).isChargeSeperateSC ?? false,

      // 👇 keep existing tax breakdown, but update SC from the edited field
      vat: (outlet as any).vat ?? 0,
      nbt: (outlet as any).nbt ?? 0,
      sc: Number(serviceCharge) || (outlet as any).sc || 0,
      ct: (outlet as any).ct ?? 0,

      gotoLogin: (outlet as any).gotoLogin ?? false,
      isNBTPlusVat: (outlet as any).isNBTPlusVat ?? false,
      printBillOnLQ: (outlet as any).printBillOnLQ ?? false,
      usdBilling: (outlet as any).usdBilling ?? false,
      noOfBillCopies: Number(billCopies) || (outlet as any).noOfBillCopies || 0,
      isPossibleToPostToFOCashier:
        (outlet as any).isPossibleToPostToFOCashier ?? false,
      isTakeAway: (outlet as any).isTakeAway ?? false,
      outletGroup: (outlet as any).outletGroup ?? "",
      isProfitCenter: (outlet as any).isProfitCenter ?? false,
      roomServiceSC: (outlet as any).roomServiceSC ?? 0,
      takeAwaySC: (outlet as any).takeAwaySC ?? 0,
      deliverySC: (outlet as any).deliverySC ?? 0,
      allowDirectBill: (outlet as any).allowDirectBill ?? false,
      printKOTCopyAtBILLPrinter:
        (outlet as any).printKOTCopyAtBILLPrinter ?? false,
      costPercentage: (outlet as any).costPercentage ?? 0,
      isBar: (outlet as any).isBar ?? false,
      isMergeTableWhenPrintSt: (outlet as any).isMergeTableWhenPrintSt ?? false,
      koT_paperwidth: (outlet as any).koT_paperwidth ?? 80,
      boT_paperwidth: (outlet as any).boT_paperwidth ?? 80,
      bilL_paperwidth: (outlet as any).bilL_paperwidth ?? 80,

      // 👇 edited bool from UI
      showOnGSS: isShowOnGSS,
    };

    try {
      await dispatch(updateHotelPOSCenterMas({ posCenterId, data })).unwrap();
    } catch (err) {
      console.error(err);
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
                    const o = outlet as any;

                    setPosCenter(o.posCenter ?? o.posCenterName ?? "");
                    setServiceCharge(String(o.serviceCharge ?? o.sc ?? 0));

                    const taxSum =
                      o.taxes ??
                      (o.vat ?? 0) + (o.nbt ?? 0) + (o.sc ?? 0) + (o.ct ?? 0);

                    setTaxes(String(taxSum || 0));
                    setKotPrinter(o.kotPrinter ?? o.kotPrinterName ?? "");
                    setBillPrinter(o.billPrinter ?? o.billPrinterName ?? "");
                    setBotPrinter(o.botPrinter ?? o.botPrinterName ?? "");
                    setBillCopies(
                      String(o.billCopies ?? o.noOfBillCopies ?? 0)
                    );
                    setIsShowOnGSS(
                      Boolean(o.isShowOnGSS ?? o.showOnGSS ?? o.show ?? true)
                    );

                    dispatch(resetUpdateHotelPOSCenterMasState());
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

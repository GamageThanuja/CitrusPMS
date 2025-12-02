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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import {
  createHotelPOSCenterMas,
  selectCreateHotelPOSCenterMasLoading,
  selectCreateHotelPOSCenterMasError,
} from "@/redux/slices/createHotelPOSCenterMasSlice";

// ✅ use HotelPOSCenterMas fetch slice instead of hotelPosCenterSlice
import {
  fetchHotelPOSCenterMas,
} from "@/redux/slices/fetchHotelPOSCenterMasSlice";

// ✅ use CurrencyMas slice
import {
  fetchCurrencyMas,
  selectCurrencyMasItems,
  selectCurrencyMasLoading,
  selectCurrencyMasError,
  selectCurrencyMasSuccess,
} from "@/redux/slices/fetchCurrencyMasSlice";

import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

/* ---------------- Types ---------------- */
interface OutletCenterDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (created: PosCenter) => void;
  onTaxesSaved?: () => void; // kept for backwards compatibility
}

type PosCenter = {
  hotelPosCenterId: number;
  hotelId: number;
  posCenter: string;
  serviceCharge: number;
  taxes: number;
  createdBy: string;
  createdOn: string;
  kotPrinter?: string;
  billPrinter?: string;
  botPrinter?: string;
  billCopies?: number;
  isShowOnGSS: boolean;
};

/* ---------------- Helpers ---------------- */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ---------------- Component ---------------- */
export function OutletCenterDrawer({
  open,
  onClose,
  onCreated,
}: OutletCenterDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { fullName } = useUserFromLocalStorage();

  /* -------- currencies (via CurrencyMas) -------- */
  const currencies = useSelector(selectCurrencyMasItems);
  const currenciesLoading = useSelector(selectCurrencyMasLoading);
  const currenciesError = useSelector(selectCurrencyMasError);
  const currenciesLoadedOnce = useSelector(selectCurrencyMasSuccess);

  useEffect(() => {
    if (open && !currenciesLoadedOnce && !currenciesLoading) {
      dispatch(fetchCurrencyMas(undefined) as any);
    }
  }, [open, currenciesLoadedOnce, currenciesLoading, dispatch]);

  /* -------- outlet creation -------- */
  const createLoading = useSelector(selectCreateHotelPOSCenterMasLoading);
  const createError = useSelector(selectCreateHotelPOSCenterMasError);

  // Details tab state
  const [posCenter, setPosCenter] = useState("");
  const [kotPrinter, setKotPrinter] = useState("");
  const [billPrinter, setBillPrinter] = useState("");
  const [botPrinter, setBotPrinter] = useState("");
  const [billCopies, setBillCopies] = useState("");
  const [creatingOutlet, setCreatingOutlet] = useState(false);
  const [posCenterId, setPosCenterId] = useState<number | null>(null);
  const [outletCurrency, setOutletCurrency] = useState<string>("");

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial } = useTutorial("onBoarding", "taxes");

  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  // Wizard tabs
  const [activeTab, setActiveTab] = useState<"details" | "taxes">("details");
  useEffect(() => {
    if (open) setActiveTab("details");
  }, [open]);

  /* -------- Taxes (user-entered, used in single MAS API call) -------- */
  const [serviceChargeStr, setServiceChargeStr] = useState("0");
  const [vatStr, setVatStr] = useState("0");
  const [nbtStr, setNbtStr] = useState("0");
  const [ctStr, setCtStr] = useState("0");

  const serviceChargePct = useMemo(
    () => (parseFloat(serviceChargeStr || "0") || 0),
    [serviceChargeStr]
  );
  const vatPct = useMemo(() => (parseFloat(vatStr || "0") || 0), [vatStr]);
  const nbtPct = useMemo(() => (parseFloat(nbtStr || "0") || 0), [nbtStr]);
  const ctPct = useMemo(() => (parseFloat(ctStr || "0") || 0), [ctStr]);

  const taxInputsValid = useMemo(() => {
    const vals = [serviceChargeStr, vatStr, nbtStr, ctStr];
    return vals.every((v) => {
      if (v === "") return false;
      const num = Number(v);
      return !Number.isNaN(num) && num >= 0 && num <= 100;
    });
  }, [serviceChargeStr, vatStr, nbtStr, ctStr]);

  const handleCreateOutlet = async () => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = property?.id;

    const creator = (fullName && String(fullName).trim()) || "System";

    if (!hotelId) return alert("Missing hotelId (select a property).");
    if (!posCenter.trim()) return alert("Please enter a POS Center name.");
    if (!outletCurrency) {
      return alert("Please select an outlet currency.");
    }
    if (!taxInputsValid) {
      return alert("Please enter valid tax percentages (0–100).");
    }
    if (!creator) return alert("Missing createdBy.");

    try {
      setCreatingOutlet(true);

      const nowIso = new Date().toISOString();

      const payload = {
        posCenterID: 0,
        posCenterCode: posCenter
          .trim()
          .toUpperCase()
          .replace(/\s+/g, "_")
          .slice(0, 20),
        posCenterName: posCenter.trim(),
        nextBillNo: "1",
        hotelCode: property?.hotelCode || property?.hotelCode?.toString() || "",
        createdBy: creator,
        createdOn: nowIso,
        finAct: true,
        kotPrinterName: kotPrinter || "",
        botPrinterName: botPrinter || "",
        billPrinterName: billPrinter || "",
        nextOrderNo: "1",
        locationID: property?.locationID || 0,
        show: true,
        isTaxInclusivePrices: false,
        isAskRoomNo: false,
        isAskTableNo: false,
        isAskDeliveryMtd: false,
        isAskPOSCenter: false,
        isAskNoOfPax: false,
        isChargeSeperateSC: true,

        // TAXES from Tax tab
        vat: Number(round2(vatPct)),
        nbt: Number(round2(nbtPct)),
        sc: Number(round2(serviceChargePct)),
        ct: Number(round2(ctPct)),

        gotoLogin: false,
        isNBTPlusVat: false,
        printBillOnLQ: false,
        usdBilling: false,
        noOfBillCopies: billCopies ? Number(billCopies) : 1,
        isPossibleToPostToFOCashier: true,
        isTakeAway: false,
        outletGroup: "",
        isProfitCenter: true,
        roomServiceSC: Number(round2(serviceChargePct)),
        takeAwaySC: Number(round2(serviceChargePct)),
        deliverySC: Number(round2(serviceChargePct)),
        allowDirectBill: true,
        printKOTCopyAtBILLPrinter: false,
        costPercentage: 0,
        isBar: false,
        isMergeTableWhenPrintSt: false,
        koT_paperwidth: 80,
        boT_paperwidth: 80,
        bilL_paperwidth: 80,
        showOnGSS: true,
      };

      const result = await dispatch(
        createHotelPOSCenterMas(payload as any)
      ).unwrap();

      const newId = Number(result?.posCenterID ?? result?.hotelPosCenterId);
      if (!Number.isFinite(newId) || newId <= 0) {
        console.warn("Create response (no id):", result);
        throw new Error("API did not return a recognizable outlet id.");
      }

      setPosCenterId(newId);
      localStorage.setItem("lastCreatedPosCenterId", String(newId));

      // ✅ refresh POS centers using HotelPOSCenterMas thunk
      try {
        await dispatch(fetchHotelPOSCenterMas() as any);
        console.log("✅ Redux store refreshed after outlet creation (HotelPOSCenterMas)");
      } catch (refreshError) {
        console.error("Failed to refresh outlet list:", refreshError);
      }

      onCreated?.(result as PosCenter);

      alert("Outlet created successfully.");
      handleClose();
    } catch (e: any) {
      console.error("Create POS Center (MAS) failed:", e);
      const msg =
        typeof e === "string"
          ? e
          : e?.message || createError || "Failed to create Hotel POS Center.";
      alert("Failed: " + msg);
    } finally {
      setCreatingOutlet(false);
    }
  };

  const handleClose = () => {
    onClose();
    resetAll();
  };

  // -------- RESET EVERYTHING --------
  const resetAll = () => {
    setPosCenter("");
    setKotPrinter("");
    setBillPrinter("");
    setBotPrinter("");
    setBillCopies("");
    setOutletCurrency("");
    setPosCenterId(null);
    localStorage.removeItem("lastCreatedPosCenterId");
    setActiveTab("details");
    setServiceChargeStr("0");
    setVatStr("0");
    setNbtStr("0");
    setCtStr("0");
  };

  // helper for numeric percentage input
  const handlePctChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === "") {
        setter("");
        return;
      }
      if (/^\d{0,3}(\.\d{0,2})?$/.test(val)) {
        const num = parseFloat(val);
        if (num <= 100) setter(val);
      }
    };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Create POS Outlet</SheetTitle>
          <SheetDescription>
            Enter new outlet center information and configure taxes.
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "details" | "taxes")}
          className="mt-6"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="taxes">Taxes</TabsTrigger>
          </TabsList>

          {/* -------- Details Tab -------- */}
          <TabsContent value="details" className="mt-4">
            <div className="flex flex-col gap-4">
              <Input
                placeholder="POS Center Name"
                value={posCenter}
                onChange={(e) => setPosCenter(e.target.value)}
              />

              <div>
                <Label className="text-xs text-slate-500">
                  Outlet Currency
                </Label>
                <Select
                  value={outletCurrency}
                  onValueChange={setOutletCurrency}
                  disabled={currenciesLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue
                      placeholder={
                        currenciesLoading ? "Loading..." : "Select currency"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-black dark:text-white max-h-64">
                    {currencies.map((c) => (
                      <SelectItem key={c.currencyID} value={c.currencyCode}>
                        {c.currencyCode} — {c.currencyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!!currenciesError && (
                  <p className="text-xs text-amber-600 mt-1">
                    {currenciesError}
                  </p>
                )}
              </div>
              <div className="text-xs text-slate-500">
                {posCenterId ? (
                  <>
                    Last created outlet ID:{" "}
                    <span className="font-medium">{posCenterId}</span>
                  </>
                ) : (
                  "No outlet created yet."
                )}
              </div>

              <p className="text-xs text-slate-500">
                After filling these details, go to the{" "}
                <span className="font-semibold">Taxes</span> tab to enter tax
                percentages and create the outlet.
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={resetAll}
                  className="w-1/2"
                >
                  Reset
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setActiveTab("taxes")}
                  className="w-1/2"
                  disabled={!posCenter.trim() || !outletCurrency}
                >
                  Go to Taxes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* -------- Taxes Tab (explicit fields; single Create Outlet) -------- */}
          <TabsContent value="taxes" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border p-4 bg-white dark:bg-black">
                  <Label className="text-xs text-slate-500">
                    Service Charge (SC) %
                  </Label>
                  <div className="relative mt-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="pr-8"
                      value={serviceChargeStr}
                      onChange={handlePctChange(setServiceChargeStr)}
                      placeholder="e.g. 10"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border p-4 bg-white dark:bg-black">
                  <Label className="text-xs text-slate-500">VAT %</Label>
                  <div className="relative mt-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="pr-8"
                      value={vatStr}
                      onChange={handlePctChange(setVatStr)}
                      placeholder="e.g. 18"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border p-4 bg-white dark:bg-black">
                  <Label className="text-xs text-slate-500">NBT %</Label>
                  <div className="relative mt-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="pr-8"
                      value={nbtStr}
                      onChange={handlePctChange(setNbtStr)}
                      placeholder="e.g. 2"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border p-4 bg-white dark:bg-black">
                  <Label className="text-xs text-slate-500">CT %</Label>
                  <div className="relative mt-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="pr-8"
                      value={ctStr}
                      onChange={handlePctChange(setCtStr)}
                      placeholder="e.g. 0"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreateOutlet}
                  disabled={
                    creatingOutlet ||
                    createLoading ||
                    !posCenter.trim() ||
                    !outletCurrency ||
                    !taxInputsValid
                  }
                  className="w-1/2"
                >
                  {creatingOutlet || createLoading
                    ? "Creating…"
                    : "Create Outlet"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setServiceChargeStr("0");
                    setVatStr("0");
                    setNbtStr("0");
                    setCtStr("0");
                  }}
                  className="w-1/2"
                >
                  Clear Taxes
                </Button>
              </div>

              {!posCenter.trim() || !outletCurrency ? (
                <p className="text-xs text-amber-600">
                  Fill the outlet details (name & currency) first in the
                  Details tab.
                </p>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
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
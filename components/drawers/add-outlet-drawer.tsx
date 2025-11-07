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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { AxiosError } from "axios";

import { createHotelPosCenterTaxConfig } from "@/redux/slices/createHotelPosCenterTaxConfigSlice";
import { fetchHotelPosCenters } from "@/redux/slices/hotelPosCenterSlice";
import {
  createPosCenter,
  selectCreatePosCenterStatus,
  selectCreatePosCenterError,
} from "@/redux/slices/createPosCenterSlice";
import {
  fetchCurrencies,
  selectCurrencies,
  selectCurrencyLoading,
  selectCurrencyError,
} from "@/redux/slices/currencySlice";

import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { useHotelDetails } from "@/hooks/useHotelDetails";

/* === Country/Hotel tax sources === */
import {
  fetchTaxConfigByCountry,
  makeSelectCountryTaxByCode,
  selectCountryTaxLoading,
  selectCountryTaxError,
} from "@/redux/slices/taxConfigByCountrySlice";
import {
  fetchHotelTaxConfigs,
  selectHotelTaxConfigs,
  selectHotelTaxConfigsLoading,
  selectHotelTaxConfigsError,
} from "@/redux/slices/hotelTaxConfigSlice";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

/* ---------------- Types ---------------- */
interface OutletCenterDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (created: PosCenter) => void;
  onTaxesSaved?: () => void;
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

type CalcBase = "Base" | `Subtotal${number}`;

type DynamicTaxRow = {
  taxName: string; // display + POST
  pctStr: string; // controlled input (0–100, string)
  calcBasedOn: CalcBase; // POST exactly as source (default "Base")
  accountId?: number | null;
};

/* ---------------- Helpers ---------------- */
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const trim = (s: any) => (typeof s === "string" ? s.trim() : s ?? "");
const canon = (s: string) =>
  trim(s)
    .toLowerCase()
    .replace(/[\s_]+/g, "");

const normBase = (v?: string | null): CalcBase => {
  const raw = trim(v).toUpperCase().replace(/\s+/g, "");
  if (!raw || raw.startsWith("BASE")) return "Base";
  const m = raw.match(/SUBTOTAL(\d+)/);
  if (m?.[1]) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 1) return `Subtotal${n}`;
  }
  return "Base";
};

/* ---------------- Component ---------------- */
export function OutletCenterDrawer({
  open,
  onClose,
  onCreated,
  onTaxesSaved,
}: OutletCenterDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { fullName } = useUserFromLocalStorage();
  const { hotelCountry } = useHotelDetails();
  const country = (hotelCountry || "LK").toUpperCase();

  /* -------- currencies -------- */
  const currencies = useSelector(selectCurrencies);
  const currenciesLoading = useSelector(selectCurrencyLoading);
  const currenciesError = useSelector(selectCurrencyError);
  const currenciesLoadedOnce = useSelector((s: any) =>
    Boolean(s.currency?.loadedOnce)
  );

  useEffect(() => {
    if (open && !currenciesLoadedOnce && !currenciesLoading) {
      dispatch(fetchCurrencies() as any);
    }
  }, [open, currenciesLoadedOnce, currenciesLoading, dispatch]);

  /* -------- country/hotel tax sources -------- */
  useEffect(() => {
    if (open) {
      dispatch(fetchTaxConfigByCountry());
      dispatch(fetchHotelTaxConfigs());
    }
  }, [open, dispatch]);

  const selectByCountry = useMemo(
    () => makeSelectCountryTaxByCode(country),
    [country]
  );
  const countryRows = useSelector((s: RootState) => selectByCountry(s));
  const countryLoading = useSelector(selectCountryTaxLoading);
  const countryError = useSelector(selectCountryTaxError);

  const hotelRows = useSelector(selectHotelTaxConfigs);
  const hotelLoading = useSelector(selectHotelTaxConfigsLoading);
  const hotelError = useSelector(selectHotelTaxConfigsError);

  /* -------- outlet creation -------- */
  const createStatus = useSelector(selectCreatePosCenterStatus);
  const createErrSel = useSelector(selectCreatePosCenterError);

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
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
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

  // Persist taxes toggle
  const [persistTaxes, setPersistTaxes] = useState(true);

  /* -------- Taxes: dynamic (no hard-code) -------- */
  const [taxRows, setTaxRows] = useState<DynamicTaxRow[]>([]);
  const seededOnce = useRef(false);

  // Build normalized lists from sources
  // const normHotel = useMemo<DynamicTaxRow[]>(() => {
  //   return (hotelRows || [])
  //     .filter((r: any) => trim(r.taxName))
  //     .map((r: any) => ({
  //       taxName: trim(r.taxName),
  //       pctStr:
  //         r.percentage == null || Number.isNaN(Number(r.percentage))
  //           ? "0"
  //           : String(r.percentage),
  //       calcBasedOn: normBase(r.calcBasedOn),
  //     }));
  // }, [hotelRows]);

  const normCountry = useMemo<DynamicTaxRow[]>(() => {
    return (countryRows || [])
      .filter((r: any) => {
        const name = trim(r.taxCompenent);
        return name && !name.toUpperCase().startsWith("SUB TOTAL");
      })
      .map((r: any) => ({
        taxName: trim(r.taxCompenent),
        pctStr:
          r.taxPercentage == null || Number.isNaN(Number(r.taxPercentage))
            ? "0"
            : String(r.taxPercentage),
        calcBasedOn: normBase(r.calcBasedOn),
        accountId: r.accountId ?? null,
      }));
  }, [countryRows]);

  const countryAccountIdByCanon = useMemo(() => {
    const m = new Map<string, number | null>();
    (countryRows || []).forEach((r: any) => {
      const name = trim(r.taxCompenent);
      if (!name) return;
      m.set(canon(name), r.accountId ?? null);
    });
    return m;
  }, [countryRows]);

  // Seed from hotel, else country, when data ready

  // service charge + other sum (for outlet create payload)
  const serviceChargePct = useMemo(() => {
    const sc = taxRows.find((r) => canon(r.taxName) === "servicecharge");
    return sc ? parseFloat(sc.pctStr || "0") || 0 : 0;
  }, [taxRows]);

  const otherTaxesSumPct = useMemo(() => {
    return taxRows.reduce((sum, r) => {
      if (canon(r.taxName) === "servicecharge") return sum;
      const v = parseFloat(r.pctStr || "0") || 0;
      return sum + v;
    }, 0);
  }, [taxRows]);

  // ----- helpers -----
  function axiosErrMsg(e: unknown) {
    const ax = e as AxiosError<any>;
    return (
      ax?.response?.data?.detail ||
      ax?.response?.data?.message ||
      (typeof ax?.response?.data === "string" ? ax.response.data : null) ||
      (ax?.response?.status
        ? `${ax.response.status} ${ax.response.statusText}`
        : null) ||
      ax?.message ||
      "Unknown error"
    );
  }

  const handleCreateOutlet = async () => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken = tokens?.accessToken;
    const hotelId = property?.id;

    const creator =
      (fullName && String(fullName).trim()) ||
      tokens?.fullName ||
      tokens?.email ||
      "System";

    if (!hotelId) return alert("Missing hotelId (select a property).");
    if (!accessToken) return alert("Missing access token (please sign in).");
    if (!posCenter.trim()) return alert("Please enter a POS Center name.");
    if (!creator) return alert("Missing createdBy.");

    try {
      setCreatingOutlet(true);
      const result = await dispatch(
        createPosCenter({
          posCenter: posCenter.trim(),
          serviceCharge: Number(round2(serviceChargePct)),
          taxes: Number(round2(otherTaxesSumPct)),
          createdBy: creator,
          kotPrinter: kotPrinter || "",
          billPrinter: billPrinter || "",
          botPrinter: botPrinter || "",
          billCopies: billCopies ? Number(billCopies) : 1,
          isShowOnGSS: true,
          outletCurrency: outletCurrency,
        })
      ).unwrap();

      const newId = Number(result?.hotelPosCenterId);
      if (!Number.isFinite(newId) || newId <= 0) {
        console.warn("Create response (no id):", result);
        throw new Error("API did not return a recognizable outlet id.");
      }

      setPosCenterId(newId);
      localStorage.setItem("lastCreatedPosCenterId", String(newId));
      setActiveTab("taxes");
      await dispatch(fetchHotelPosCenters());
      onCreated?.(result as PosCenter);
    } catch (e: any) {
      console.error("Create POS Center failed:", e);
      const msg =
        typeof e === "string"
          ? e
          : e?.message || createErrSel || "Failed to create POS center";
      alert("Failed: " + msg);
    } finally {
      setCreatingOutlet(false);
    }
  };

  // -------- TAXES SAVE (create-only for POS) --------
  const [savingTaxes, setSavingTaxes] = useState(false);

  const handleSaveTaxes = async () => {
    if (!posCenterId)
      return alert("Create the outlet first. No outlet id found.");
    if (!persistTaxes) return alert("Enable 'Persist taxes' to save taxes.");

    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken = tokens?.accessToken;
    const hotelId = property?.id;

    if (!hotelId) return alert("Missing hotelId.");
    if (!accessToken) return alert("Missing access token.");

    const creator =
      (fullName && String(fullName).trim()) ||
      tokens?.fullName ||
      tokens?.email ||
      "System";

    setSavingTaxes(true);
    try {
      // Post rows exactly as displayed (no hard-coded list)
      const tasks: Promise<any>[] = [];

      taxRows.forEach((r) => {
        const pct = parseFloat(r.pctStr || "0") || 0;
        tasks.push(
          dispatch(
            createHotelPosCenterTaxConfig({
              hotelPOSCenterId: Number(posCenterId),
              taxName: r.taxName,
              percentage: Number(round2(pct)),
              calcBasedOn:
                r.calcBasedOn === "Base"
                  ? "base"
                  : `sub${r.calcBasedOn.match(/\d+/)?.[0] || "1"}`,
              createdBy: creator,
              accountId: r.accountId ?? null,
            })
          ).unwrap()
        );
      });

      const results = await Promise.allSettled(tasks);
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length) {
        console.error("Some POS-Center Tax rows failed:", failures);
        alert(
          `Saved with ${failures.length} error(s). See console for details.`
        );
      } else {
        onTaxesSaved?.();
      }
    } catch (e) {
      console.error("Save taxes failed:", e);
      alert("Failed: " + axiosErrMsg(e));
    } finally {
      setSavingTaxes(false);
      onClose();
    }
  };

  // -------- RESET EVERYTHING --------
  const resetAll = () => {
    setPosCenter("");
    setKotPrinter("");
    setBillPrinter("");
    setBotPrinter("");
    setBillCopies("");
    setOutletCurrency("");
    setTaxRows([]);
    setPosCenterId(null);
    localStorage.removeItem("lastCreatedPosCenterId");
    setActiveTab("details");
    seededOnce.current = false;
  };

  const normHotel = useMemo<DynamicTaxRow[]>(() => {
    return (hotelRows || [])
      .filter((r: any) => trim(r.taxName))
      .map((r: any) => {
        const k = canon(r.taxName);
        const accountId = r.accountId ?? countryAccountIdByCanon.get(k) ?? null; // 👈
        return {
          taxName: trim(r.taxName),
          pctStr:
            r.percentage == null || Number.isNaN(Number(r.percentage))
              ? "0"
              : String(r.percentage),
          calcBasedOn: normBase(r.calcBasedOn),
          accountId, // 👈
        };
      });
  }, [hotelRows, countryAccountIdByCanon]);

  useEffect(() => {
    if (!open) return;
    if (countryLoading || hotelLoading) return;

    const hasHotel = (normHotel?.length ?? 0) > 0;
    const src = hasHotel ? normHotel : normCountry;

    setTaxRows(src.map((r) => ({ ...r })));
    seededOnce.current = true;
  }, [open, countryLoading, hotelLoading, normHotel, normCountry]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Create POS Outlet</SheetTitle>
          <SheetDescription>
            Enter new outlet center information
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
                      <SelectItem key={c.currencyId} value={c.currencyCode}>
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

              <Input
                placeholder="KOT Printer"
                value={kotPrinter}
                onChange={(e) => setKotPrinter(e.target.value)}
              />
              <Input
                placeholder="Bill Printer"
                value={billPrinter}
                onChange={(e) => setBillPrinter(e.target.value)}
              />
              <Input
                placeholder="BOT Printer"
                value={botPrinter}
                onChange={(e) => setBotPrinter(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Bill Copies"
                value={billCopies}
                onChange={(e) => setBillCopies(e.target.value)}
              />

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="persistTaxes"
                  checked={persistTaxes}
                  onCheckedChange={(v) => setPersistTaxes(Boolean(v))}
                />
                <Label htmlFor="persistTaxes" className="text-sm">
                  Persist taxes to this outlet (enables the Save Taxes button)
                </Label>
              </div>

              <div className="text-xs text-slate-500">
                {posCenterId ? (
                  <>
                    Outlet created with ID:{" "}
                    <span className="font-medium">{posCenterId}</span>
                  </>
                ) : (
                  "No outlet created yet."
                )}
              </div>

              {(countryError || hotelError) && (
                <div className="text-xs text-amber-600">
                  {hotelError || countryError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreateOutlet}
                  disabled={
                    creatingOutlet ||
                    createStatus === "loading" ||
                    countryLoading ||
                    hotelLoading
                  }
                  className="w-1/2"
                >
                  {creatingOutlet || createStatus === "loading"
                    ? "Creating…"
                    : "Create Outlet"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetAll}
                  className="w-1/2"
                >
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* -------- Taxes Tab (dynamic; 2-column grid) -------- */}
          <TabsContent value="taxes" className="mt-4">
            <div className="space-y-4">
              {taxRows.length === 0 && (
                <div className="rounded-xl border p-4 text-sm text-slate-500">
                  No tax data found for this hotel/country.
                </div>
              )}

              {/* 2-column grid of tax inputs */}
              {taxRows.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taxRows.map((row, idx) => (
                    <div
                      key={`${row.taxName}-${idx}`}
                      className="rounded-xl border p-4 bg-white dark:bg-black"
                    >
                      <Label className="text-xs text-slate-500">
                        {row.taxName}
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="pr-8"
                          value={row.pctStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTaxRows((prev) => {
                              const next = [...prev];
                              if (val === "") {
                                next[idx] = { ...next[idx], pctStr: "" };
                                return next;
                              }
                              if (/^\d{0,3}(\.\d{0,2})?$/.test(val)) {
                                const num = parseFloat(val);
                                if (num <= 100)
                                  next[idx] = { ...next[idx], pctStr: val };
                              }
                              return next;
                            });
                          }}
                          placeholder="e.g. 10"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveTaxes}
                  disabled={
                    !posCenterId ||
                    savingTaxes ||
                    !persistTaxes ||
                    taxRows.length === 0
                  }
                  className="w-1/2"
                >
                  {savingTaxes ? "Saving Taxes…" : "Save Taxes to Outlet"}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() =>
                    setTaxRows((prev) =>
                      prev.map((r) => ({ ...r, pctStr: "0" }))
                    )
                  }
                  className="w-1/2"
                >
                  Clear
                </Button>
              </div>

              {!posCenterId && (
                <p className="text-xs text-amber-600">
                  Create the outlet first to enable tax saving.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button
            onClick={() => {
              onClose();
              resetAll();
            }}
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

"use client";

import { JSX, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";

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

import {
  postHotelTaxConfig,
  selectPostTaxCreating,
  selectPostTaxError,
} from "@/redux/slices/postHotelTaxConfigSlice";

import { useHotelDetails } from "@/hooks/useHotelDetails";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Check, Percent } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTutorial } from "@/hooks/useTutorial";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";

/* ---------- helpers ---------- */
type CalcBase = "Base" | `Subtotal${number}`;

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

function getHotelId(): number | null {
  try {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    return typeof property?.id === "number" ? property.id : null;
  } catch {
    return null;
  }
}

/* ---------- component ---------- */
export default function TaxesStepFlowWizard() {
  const dispatch = useDispatch<AppDispatch>();
  const hotelId = getHotelId();
  const { hotelCountry } = useHotelDetails();
  const country = (hotelCountry || "").toUpperCase();
  const router = useRouter();
  const [showRawOverlay, setShowRawOverlay] = useState(false);

  // fetch source data
  useEffect(() => {
    dispatch(fetchTaxConfigByCountry());
    if (hotelId) dispatch(fetchHotelTaxConfigs());
  }, [dispatch, hotelId]);

  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  // selectors
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

  const creating = useSelector(selectPostTaxCreating);
  const createError = useSelector(selectPostTaxError);

  /* ---------- normalize rows ---------- */
  type AnyRow = {
    key: string; // canonical key from tax name
    taxName: string;
    percentage?: number | null;
    calcBasedOn: CalcBase;
    accountId?: number | null;
    _src: "hotel" | "country";
    _idx: number; // original index for stable sort
  };

  const countryNorm: AnyRow[] = useMemo(() => {
    return (countryRows || [])
      .map((r: any, i: number) => {
        const name = trim(r.taxCompenent);
        if (!name || name.toUpperCase().startsWith("SUB TOTAL")) {
          return null;
        }
        return {
          key: canon(name),
          taxName: name,
          percentage:
            r.taxPercentage == null || Number.isNaN(Number(r.taxPercentage))
              ? null
              : Number(r.taxPercentage),
          calcBasedOn: normBase(r.calcBasedOn),
          accountId: r.accountId ?? null,
          _src: "country" as const,
          _idx: i,
        };
      })
      .filter(Boolean) as AnyRow[];
  }, [countryRows]);

  const hotelNorm: AnyRow[] = useMemo(() => {
    return (hotelRows || []).map((r: any, i: number) => ({
      key: canon(r.taxName),
      taxName: trim(r.taxName),
      percentage:
        r.percentage == null || Number.isNaN(Number(r.percentage))
          ? null
          : Number(r.percentage),
      calcBasedOn: normBase(r.calcBasedOn),
      accountId: r.accountId ?? null,
      _src: "hotel" as const,
      _idx: i,
    }));
  }, [hotelRows]);

  // union keys from hotel first (preserve edits), then fill with country defaults
  const merged: AnyRow[] = useMemo(() => {
    const map = new Map<string, AnyRow>();
    // prefer hotel values if present
    for (const h of hotelNorm) map.set(h.key, h);
    for (const c of countryNorm) {
      if (!map.has(c.key)) map.set(c.key, c);
      else {
        // enrich missing fields from country (e.g., accountId)
        const base = map.get(c.key)!;
        map.set(c.key, {
          ...base,
          accountId: base.accountId ?? c.accountId ?? null,
          // if hotel has no % yet, fallback to country
          percentage:
            base.percentage == null ? c.percentage ?? null : base.percentage,
          // choose more specific calc base if hotel left default
          calcBasedOn: base.calcBasedOn ?? c.calcBasedOn,
        });
      }
    }

    // sort by calc base (Base=0, SubtotalN=N) then by original name
    const orderOfBase = (b: CalcBase) =>
      b === "Base" ? 0 : Number((b as any).replace("Subtotal", "")) || 0;

    return Array.from(map.values()).sort((a, b) => {
      const ob = orderOfBase(a.calcBasedOn) - orderOfBase(b.calcBasedOn);
      if (ob !== 0) return ob;
      // stable by name then by source then index
      const ncmp = a.taxName.localeCompare(b.taxName);
      if (ncmp !== 0) return ncmp;
      if (a._src !== b._src) return a._src === "hotel" ? -1 : 1;
      return a._idx - b._idx;
    });
  }, [hotelNorm, countryNorm]);

  /* ---------- wizard/edit state ---------- */
  // one step per tax + review
  const [step, setStep] = useState(0);
  const totalSteps = (merged?.length || 0) + 1; // +1 review
  const progress =
    totalSteps > 0 ? Math.round(((step + 1) / totalSteps) * 100) : 0;

  // editable values keyed by canonical key
  const [edit, setEdit] = useState<Record<string, string>>({});
  const lastSeedSig = useRef<string>("");

  useEffect(() => {
    const sig = (merged || [])
      .map(
        (r) => `${r.key}:${r.taxName}:${r.percentage ?? ""}:${r.calcBasedOn}`
      )
      .join("|");
    if (sig !== lastSeedSig.current) {
      const next = { ...edit };
      merged.forEach((r) => {
        if (next[r.key] == null) {
          next[r.key] =
            r.percentage == null || Number.isNaN(r.percentage)
              ? ""
              : String(r.percentage);
        }
      });
      setEdit(next);
      lastSeedSig.current = sig;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merged]);

  const onChangePct = (key: string, v: string) => {
    if (v === "" || /^\d{0,3}(\.\d{0,2})?$/.test(v)) {
      setEdit((p) => ({ ...p, [key]: v }));
    }
  };
  const pctInvalid = (s: string) => {
    if (s === "") return false; // empty allowed; treated as 0 on save
    const n = parseFloat(s);
    return Number.isNaN(n) || n < 0 || n > 100;
  };
  const clamp0to100 = (n: number) => Math.max(0, Math.min(100, n));
  const numOr0 = (s?: string) => {
    const n = parseFloat(s ?? "");
    return Number.isFinite(n) ? n : 0;
  };

  // saving
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const saveAll = async () => {
    setSaving(true);
    setSaveError(null);
    setSavedOk(false);

    try {
      // post in calc base order (already sorted)
      for (const r of merged) {
        const pctNum = clamp0to100(numOr0(edit[r.key]));
        const body = {
          taxName: r.taxName,
          percentage: pctNum,
          calcBasedOn: r.calcBasedOn,
          accountId: r.accountId ?? null,
        };

        try {
          await dispatch(postHotelTaxConfig(body)).unwrap();
          router.replace("/create-room-type");
        } catch (e: any) {
          // If backend rejects duplicates or unchanged values,
          // you can ignore known codes (e?.status === 409, etc.)
          // For now, bubble the first real error:
          throw e;
        }
      }

      await dispatch(fetchHotelTaxConfigs());
      setSavedOk(true);
      // router.replace("/create-room-type"); // <- only if you want to redirect after all
    } catch (e: any) {
      setSaveError(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
      // stay on review
      setStep(totalSteps - 1);
    }
  };

  const busy = countryLoading || hotelLoading || creating || saving;

  /* ---------- dynamic step views ---------- */
  const stepViews: {
    title: string;
    description: string;
    icon: JSX.Element;
    render: JSX.Element;
    canNext: boolean;
  }[] = (merged || []).map((row) => {
    const val = edit[row.key] ?? "";
    return {
      title: `${row.taxName} (%)`,
      description: `Configure ${row.taxName} rate.`,
      icon: <Percent className="w-6 h-6" />,
      render: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border rounded-xl">
            <div className="sm:col-span-1">
              <Label className="text-xs text-slate-600">Tax Name</Label>
              <Input
                value={row.taxName}
                disabled
                className="bg-white text-black"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">% Rate</Label>
              <Input
                inputMode="decimal"
                value={val}
                onChange={(e) => onChangePct(row.key, e.target.value)}
                placeholder="0 – 100"
                className="bg-white text-black"
              />
              {pctInvalid(val) && (
                <div className="text-xs text-red-600 mt-1">Enter 0–100</div>
              )}
            </div>
            <div>
              <Label className="text-xs text-slate-600">Calc Base</Label>
              <Input
                value={row.calcBasedOn}
                disabled
                className="bg-white text-black"
              />
            </div>
          </div>
        </div>
      ),
      canNext: !pctInvalid(val),
    };
  });

  // append review step
  stepViews.push({
    title: "Review & Save",
    description: "Confirm your tax configuration.",
    icon: <Check className="w-6 h-6" />,
    render: (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {merged.map((r) => (
            <div key={r.key}>
              <span className="font-medium text-gray-700">{r.taxName}:</span>
              <p className="text-gray-900">
                {(edit[r.key] ?? "") === "" ? "0" : edit[r.key]}%{" "}
                <span className="text-gray-500">({r.calcBasedOn})</span>
              </p>
            </div>
          ))}
        </div>
        {createError && (
          <div className="text-sm text-red-600">{createError}</div>
        )}
        {saveError && <div className="text-sm text-red-600">{saveError}</div>}
        {savedOk && !saveError && (
          <div className="text-sm text-emerald-600">
            Taxes saved successfully.
          </div>
        )}
      </div>
    ),
    canNext: true,
  });

  const goPrev = () => setStep((s) => Math.max(0, s - 1));
  const goNext = () => setStep((s) => Math.min(totalSteps - 1, s + 1));

  const current = stepViews[Math.min(step, stepViews.length - 1)];

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 flex items-center justify-center">
      <div className="top-10 right-10 absolute">
        <VideoButton
          onClick={() => setShowRawOverlay(true)}
          label="Watch Video"
        />
      </div>
      <div className="w-full max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {Math.min(step + 1, totalSteps)} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-sky-400 to-sky-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-xl bg-white">
          <h1 className="text-black text-center font-bold text-2xl pt-6">
            Setup Taxes ({country})
          </h1>

          <CardContent className="p-6 sm:p-8">
            {(countryError || hotelError) && (
              <div className="mb-4 text-sm text-red-600">
                {hotelError || countryError}
              </div>
            )}

            {/* Step header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-sky-400 to-sky-600 flex items-center justify-center text-white">
                {current.icon}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {current.title}
                </h1>
                <p className="text-sm text-gray-600">{current.description}</p>
              </div>
            </div>

            {/* Step body */}
            <div className="mb-8">{current.render}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                disabled={step === 0 || busy}
                className="flex items-center gap-2 bg-transparent text-black"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {step < totalSteps - 1 ? (
                <Button
                  onClick={goNext}
                  disabled={!current.canNext || busy}
                  className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-600 hover:to-blue-600 flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={saveAll}
                  disabled={busy}
                  className="bg-gradient-to-r from-sky-400 to-sky-600 hover:from-sky-600 hover:to-blue-600 flex items-center gap-2"
                >
                  {saving ? "Saving…" : "Save Taxes"}
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </div>
  );
}

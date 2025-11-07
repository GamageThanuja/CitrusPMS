// components/tabs/TaxesTab.tsx
// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";

/* Country templates */
import {
  fetchTaxConfigByCountry,
  makeSelectCountryTaxByCode,
  selectCountryTaxLoading,
  selectCountryTaxError,
} from "@/redux/slices/taxConfigByCountrySlice";

/* Hotel config (existing taxes) */
import {
  fetchHotelTaxConfigs,
  selectHotelTaxConfigs,
  selectHotelTaxConfigsLoading,
  selectHotelTaxConfigsError,
} from "@/redux/slices/hotelTaxConfigSlice";

/* Create / Update */
import {
  postHotelTaxConfig,
  selectPostTaxCreating,
  selectPostTaxError,
} from "@/redux/slices/postHotelTaxConfigSlice";
import {
  updateHotelTaxConfig,
  resetUpdateHotelTaxConfigState,
} from "@/redux/slices/updateHotelTaxConfig";

/* Delete slice kept to surface errors, (no delete UI here) */
import {
  resetDeleteHotelTaxConfigState,
  selectDeleteHotelTaxConfig,
} from "@/redux/slices/deleteHotelTaxConfigSlice";

/* UI */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHotelDetails } from "@/hooks/useHotelDetails";

/* ---------------- helpers ---------------- */
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

const baseLevel = (b: CalcBase) =>
  b === "Base" ? 0 : Number(String(b).replace("Subtotal", "")) || 0;

function getHotelId(): number | null {
  try {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    return typeof property?.id === "number" ? property.id : null;
  } catch {
    return null;
  }
}

/* ---------------- component ---------------- */
export default function TaxesTab() {
  const dispatch = useDispatch<AppDispatch>();
  const hotelId = getHotelId();
  const { hotelCountry } = useHotelDetails();
  const country = (hotelCountry || "LK").toUpperCase();

  useEffect(() => {
    dispatch(fetchTaxConfigByCountry());
    if (hotelId) dispatch(fetchHotelTaxConfigs());
    return () => {
      dispatch(resetUpdateHotelTaxConfigState());
      dispatch(resetDeleteHotelTaxConfigState());
    };
  }, [dispatch, hotelId]);

  /* selectors */
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
  const deleteState = useSelector(selectDeleteHotelTaxConfig); // {status, error}

  const hasHotelData = (hotelRows?.length ?? 0) > 0;

  /* ---------- Normalize from API (NO hard-coding) ---------- */
  type TaxRow = {
    key: string; // canonical key from name
    recordId?: number; // hotel record id if exists
    taxName: string;
    percentage?: number | null;
    calcBasedOn: CalcBase;
    accountId?: number | null;
    _src: "hotel" | "country";
    _idx: number; // for stable sort
  };

  const countryNorm: TaxRow[] = useMemo(() => {
    return (countryRows || [])
      .map((r: any, i: number) => {
        const name = trim(r.taxCompenent);
        if (!name || name.toUpperCase().startsWith("SUB TOTAL")) return null; // ignore subtotal display rows from template
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
      .filter(Boolean) as TaxRow[];
  }, [countryRows]);

  const hotelNorm: TaxRow[] = useMemo(() => {
    return (hotelRows || []).map((r: any, i: number) => ({
      key: canon(r.taxName),
      recordId: r.recordId,
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

  /* ---------- Merge: prefer hotel values; backfill from country ---------- */
  const rows: TaxRow[] = useMemo(() => {
    const map = new Map<string, TaxRow>();
    for (const h of hotelNorm) map.set(h.key, h);
    for (const c of countryNorm) {
      if (!map.has(c.key)) {
        map.set(c.key, c);
      } else {
        const base = map.get(c.key)!;
        map.set(c.key, {
          ...base,
          accountId: base.accountId ?? c.accountId ?? null,
          percentage:
            base.percentage == null ? c.percentage ?? null : base.percentage,
          calcBasedOn: base.calcBasedOn ?? c.calcBasedOn,
        });
      }
    }
    // sort by base level → name → source → original index
    return Array.from(map.values()).sort((a, b) => {
      const lv = baseLevel(a.calcBasedOn) - baseLevel(b.calcBasedOn);
      if (lv !== 0) return lv;
      const ncmp = a.taxName.localeCompare(b.taxName);
      if (ncmp !== 0) return ncmp;
      if (a._src !== b._src) return a._src === "hotel" ? -1 : 1;
      return a._idx - b._idx;
    });
  }, [hotelNorm, countryNorm]);

  /* ---------- Edit state (percentages) ---------- */
  const [edit, setEdit] = useState<Record<string, string>>({});
  const lastSeedSig = useRef<string>("");
  const lastSourceRef = useRef<"H" | "C" | null>(null);

  useEffect(() => {
    const source: "H" | "C" = hasHotelData ? "H" : "C";
    const sig =
      source +
      "|" +
      rows
        .map(
          (r) =>
            `${r.key}:${r.recordId ?? 0}:${r.percentage ?? ""}:${r.calcBasedOn}`
        )
        .join("|");

    const switchingFromCountryToHotel =
      lastSourceRef.current === "C" && source === "H";

    if (switchingFromCountryToHotel) {
      // reset from hotel values
      const next: Record<string, string> = {};
      rows.forEach((r) => {
        next[r.key] =
          r.percentage == null || Number.isNaN(r.percentage)
            ? ""
            : String(r.percentage);
      });
      setEdit(next);
      lastSeedSig.current = sig;
      lastSourceRef.current = source;
      return;
    }

    if (sig !== lastSeedSig.current) {
      const next = { ...edit };
      rows.forEach((r) => {
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

    lastSourceRef.current = source;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, hasHotelData]);

  const onChangePct = (key: string, v: string) => {
    if (v === "" || /^\d{0,3}(\.\d{0,2})?$/.test(v)) {
      setEdit((p) => ({ ...p, [key]: v }));
    }
  };

  const anyPctInvalid = rows.some((r) => {
    const v = edit[r.key];
    if (v === "") return false; // empty → 0 on save
    const n = parseFloat(v);
    return Number.isNaN(n) || n < 0 || n > 100;
  });

  /* ---------- Live calculator (generic) ---------- */
  const [baseAmount, setBaseAmount] = useState<string>("100");

  type CalcLine = {
    label: string;
    pct: number;
    amount: number;
    level: number;
  };
  type CalcResult = {
    base: number;
    lines: CalcLine[];
    subtotals: Record<number, number>; // level -> subtotal after that level
    grand: number;
  };

  const calc = useMemo<CalcResult>(() => {
    const base = parseFloat(baseAmount) || 0;
    const pctOf = (pct: number, on: number) => (on * (pct || 0)) / 100;

    // group rows by level
    const byLevel = new Map<number, TaxRow[]>();
    rows.forEach((r) => {
      const lvl = baseLevel(r.calcBasedOn);
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(r);
    });

    // determine max level present
    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
    const maxLevel = levels.length ? levels[levels.length - 1] : 0;

    const lines: CalcLine[] = [];
    const subtotals: Record<number, number> = {};

    // start with level 0 base
    let currentBase = base;

    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      const taxesAtLevel = (byLevel.get(lvl) || []).sort((a, b) =>
        a.taxName.localeCompare(b.taxName)
      );
      let levelSum = 0;

      for (const r of taxesAtLevel) {
        const pct = parseFloat(edit[r.key] ?? "");
        const pctNum = Number.isFinite(pct)
          ? Math.max(0, Math.min(100, pct))
          : 0;
        const amt = pctOf(pctNum, currentBase);
        levelSum += amt;
        lines.push({
          label: `${r.taxName}`,
          pct: pctNum,
          amount: Math.round((amt + Number.EPSILON) * 100) / 100,
          level: lvl,
        });
      }

      // compute subtotal AFTER this level (base + level taxes)
      const subtotalAfterLevel =
        Math.round((currentBase + levelSum + Number.EPSILON) * 100) / 100;
      subtotals[lvl] = subtotalAfterLevel;

      // next level base becomes this subtotal
      currentBase = subtotalAfterLevel;
    }

    const grand = currentBase; // after last level
    return { base, lines, subtotals, grand };
  }, [baseAmount, edit, rows]);

  /* ---------- Save All (create or update) ---------- */
  const [savingAll, setSavingAll] = useState(false);

  const onSaveAll = async () => {
    if (!rows.length) return;
    setSavingAll(true);
    try {
      for (const r of rows) {
        const raw = edit[r.key];
        const n = parseFloat(raw ?? "");
        const pct = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
        const resolvedAccountId = r.accountId ?? undefined;

        if (hasHotelData && r.recordId) {
          await dispatch(
            updateHotelTaxConfig({
              recordId: r.recordId,
              taxName: r.taxName,
              percentage: pct,
              calcBasedOn: r.calcBasedOn,
              updatedBy: "system",
              accountId: resolvedAccountId,
            })
          ).unwrap();
        } else if (!hasHotelData) {
          await dispatch(
            postHotelTaxConfig({
              taxName: r.taxName,
              percentage: pct,
              calcBasedOn: r.calcBasedOn,
              accountId: resolvedAccountId,
            })
          ).unwrap();
        }
      }

      if (hotelId) {
        await dispatch(fetchHotelTaxConfigs());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAll(false);
    }
  };

  /* ---------- UI busy state ---------- */
  const busy =
    countryLoading ||
    hotelLoading ||
    creating ||
    deleteState.status === "loading" ||
    savingAll;

  /* ---------- Render ---------- */
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: Editor */}
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Taxes — {country}{" "}
            {hasHotelData ? "(Hotel Config)" : "(Country Template)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(countryError || hotelError) && (
            <div className="text-sm text-red-600">
              {hotelError || countryError}
            </div>
          )}

          {rows.map((r) => {
            const pct = edit[r.key] ?? "";
            return (
              <div
                key={r.key}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-xl"
              >
                <div className="md:col-span-2">
                  <Label className="text-xs dark:text-white">
                    Tax ({r.taxName})
                  </Label>
                  <Input
                    value={r.taxName}
                    disabled
                    className="dark:bg-black dark:text-white"
                  />
                </div>

                <div>
                  <Label className="text-xs dark:text-white">% Rate</Label>
                  <Input
                    inputMode="decimal"
                    value={pct}
                    onChange={(e) => onChangePct(r.key, e.target.value)}
                    placeholder="e.g. 10 (0..100)"
                    className="dark:bg-black dark:text-white"
                  />
                </div>
              </div>
            );
          })}

          {/* Global errors */}
          {createError && (
            <div className="text-sm text-red-600">{createError}</div>
          )}
          {deleteState.status === "failed" && deleteState.error && (
            <div className="text-sm text-red-600">{deleteState.error}</div>
          )}

          {/* Save All */}
          <div className="pt-2">
            <Button
              onClick={onSaveAll}
              disabled={busy || anyPctInvalid}
              className="w-full md:w-auto"
            >
              {hasHotelData ? "Update" : "Create"}
            </Button>
            {anyPctInvalid && (
              <div className="mt-1 text-xs text-red-600">
                One or more percentages are invalid (must be 0–100).
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right: Live Calculator (generic) */}
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tax Calculation (Live)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-slate-500">Base Amount</Label>
            <Input
              inputMode="decimal"
              value={baseAmount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d{0,9}(\.\d{0,2})?$/.test(v)) {
                  setBaseAmount(v);
                }
              }}
              placeholder="100"
            />
          </div>

          {/* Base */}
          <ul className="text-sm space-y-2">
            <li className="flex justify-between">
              <span>Base</span>
              <span>{(calc.base ?? 0).toFixed(2)}</span>
            </li>

            {/* levels */}
            {(() => {
              // cluster lines by level
              const byLvl: Record<number, CalcLine[]> = {};
              calc.lines.forEach((ln) => {
                if (!byLvl[ln.level]) byLvl[ln.level] = [];
                byLvl[ln.level].push(ln);
              });

              const lvls = Object.keys(byLvl)
                .map((n) => Number(n))
                .sort((a, b) => a - b);

              const blocks: JSX.Element[] = [];
              lvls.forEach((lvl) => {
                byLvl[lvl].forEach((ln) => {
                  blocks.push(
                    <li
                      key={`ln-${lvl}-${ln.label}`}
                      className="flex justify-between"
                    >
                      <span>
                        {ln.label} ({ln.pct}%)
                      </span>
                      <span>{ln.amount.toFixed(2)}</span>
                    </li>
                  );
                });

                // subtotal after this level
                const st = calc.subtotals[lvl] ?? 0;
                blocks.push(
                  <li
                    key={`st-${lvl}`}
                    className="flex justify-between font-medium"
                  >
                    <span>
                      {lvl === 0 ? "SUB TOTAL 1" : `SUB TOTAL ${lvl + 1}`}
                    </span>
                    <span>{st.toFixed(2)}</span>
                  </li>
                );
              });

              return blocks;
            })()}

            {/* grand */}
            <li className="flex justify-between text-base font-semibold">
              <span>Grand Total</span>
              <span>{(calc.grand ?? 0).toFixed(2)}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

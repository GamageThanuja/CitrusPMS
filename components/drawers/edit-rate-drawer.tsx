"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { getAllRateCodes } from "@/controllers/allRateCodesController";
import { getHotelRoomTypes } from "@/controllers/hotelRoomTypeController";
import { getMealPlans } from "@/controllers/mealPlansController";
import { getAllCurrencies } from "@/controllers/AllCurrenciesController";
import { getHotelRatePlans } from "@/controllers/hotelRatePlanController";
import { format } from "date-fns";

/** ----------------------------------------------------------------
 * EditRateDrawer
 * Preloads using initialData + live plan lookup:
 * - Finds the *exact* hotelRatePlan definition using:
 *   roomTypeID + planLabel (meal short code) + rateCodeID
 * - Hydrates form for Per Room / Per Person (Manual/Auto)
 * ----------------------------------------------------------------*/
interface EditRateDrawerProps {
  isOpen: boolean;
  initialData: any | null; // see required/optional fields in the answer
  onClose: () => void;
  onSubmit: (data: any) => Promise<void> | void; // parent does the API call
}

export function EditRateDrawer({
  isOpen,
  initialData,
  onClose,
  onSubmit,
}: EditRateDrawerProps) {
  /* ----------------------------- Helpers ----------------------------- */
  const formatDate = (d?: string) =>
    d ? new Date(d).toISOString().split("T")[0] : "";

  const toStr = (v: any) =>
    v === null || v === undefined ? "" : String(v ?? "");

  const pick = <T extends object, K extends keyof T>(obj: T, key: K) =>
    (obj?.[key] as any) ?? undefined;

  const toYMD = (d?: string | null) => {
    if (!d) return "";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0]; // yyyy-MM-dd
  };
  const ymdToStartISO = (ymd?: string) =>
    ymd ? new Date(`${ymd}T00:00:00.000Z`).toISOString() : undefined;
  const ymdToEndISO = (ymd?: string) =>
    ymd ? new Date(`${ymd}T23:59:59.999Z`).toISOString() : undefined;

  function todayYMD(): string {
    return new Date().toISOString().split("T")[0];
  }

  function addDaysYMD(ymd: string, days: number): string {
    if (!ymd) return "";
    const d = new Date(`${ymd}T00:00:00.000Z`);
    if (isNaN(d.getTime())) return "";
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split("T")[0];
  }

  function isValidYMD(s?: string): boolean {
    if (!s) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(`${s}T00:00:00.000Z`);
    return !isNaN(d.getTime());
  }

  function rangeFromHotelRates(hotelRates?: any[]): {
    from?: string;
    to?: string;
  } {
    if (!Array.isArray(hotelRates) || hotelRates.length === 0) return {};
    const ys = hotelRates
      .map((r) => String(r?.rateDate ?? "").slice(0, 10))
      .filter(isValidYMD)
      .sort();
    if (ys.length === 0) return {};
    return { from: ys[0], to: ys[ys.length - 1] };
  }

  /** Convert an existing plan/hotelRates into the drawer form shape */
  const convertPlanToForm = (plan: any, rateForDate?: string) => {
    // choose a single hotelRates row to show:
    // - if rateForDate given, pick that date
    // - else pick first available
    let chosen = Array.isArray(plan?.hotelRates) ? plan.hotelRates[0] : null;

    const hrRange = rangeFromHotelRates(plan?.hotelRates);
    const clicked = isValidYMD(initialData?.rateDate)
      ? initialData.rateDate
      : undefined;

    const dfPlan =
      toYMD(plan?.dateFrom ?? initialData?.dateFrom) ||
      clicked ||
      hrRange.from ||
      todayYMD();

    const dtPlan =
      toYMD(plan?.dateTo ?? initialData?.dateTo) ||
      (clicked ? addDaysYMD(clicked, 6) : undefined) ||
      hrRange.to ||
      addDaysYMD(dfPlan, 6);

    if (rateForDate && Array.isArray(plan?.hotelRates)) {
      const hit = plan.hotelRates.find((r: any) => r.rateDate === rateForDate);
      if (hit) chosen = hit;
    }

    const currency =
      plan?.currencyCode ??
      plan?.hotelMaster?.currencyCode ??
      initialData?.currencyCode ??
      "";

    const sellMode = plan?.sellMode ?? "";
    const rateMode = plan?.rateMode ?? "";
    const primaryOcc = plan?.primaryOccupancy ?? plan?.defaultOccupancy ?? 1;

    // Gather pax1..pax18 from chosen (or empty)
    const paxMap: Record<string, string> = {};
    if (chosen) {
      for (let i = 1; i <= 18; i++) {
        const k = `pax${i}`;
        if (Object.prototype.hasOwnProperty.call(chosen, k)) {
          paxMap[`rateFor${i}`] = toStr(chosen[k]);
        }
      }
    }

    return {
      // identities
      rateCodeID: toStr(
        plan?.rateCodeID ??
          plan?.rateCode?.rateCodeID ??
          initialData?.rateCodeID
      ),
      rateCode: toStr(plan?.rateCode?.rateCode ?? initialData?.rateCode ?? ""),
      roomTypeID: toStr(
        plan?.roomTypeID ??
          plan?.hotelRoomType?.hotelRoomTypeID ??
          initialData?.roomTypeID ??
          initialData?.roomTypeId ??
          initialData?.hotelRoomTypeID
      ),
      mealPlanID: toStr(
        plan?.mealPlanID ??
          plan?.mealPlanMaster?.mealPlanID ??
          initialData?.mealPlanID ??
          ""
      ),
      currencyCode: currency,
      dateFrom: dfPlan,
      dateTo: dtPlan,

      // commercial
      sellMode,
      rateMode,
      primaryOccupancy: toStr(primaryOcc),

      // "Per Room" numbers (or base for Auto)
      defaultRate: toStr(
        chosen?.defaultRate ??
          plan?.defaultRate ??
          (sellMode === "Per Room" ? 0 : "")
      ),
      increaseBy: toStr(chosen?.increaseBy ?? plan?.increaseBy ?? ""),
      decreaseBy: toStr(chosen?.decreaseBy ?? plan?.decreaseBy ?? ""),
      childrenFee: toStr(chosen?.child ?? plan?.childRate ?? ""),

      // paxN when Manual Per Person
      ...paxMap,

      // UI flags
      lockUI: !!plan?.lockUI,
      mealType: "",
      manualPersonCount: "",
    };
  };

  /** Try to find the exact plan using your grid matching rules */
  const findMatchedPlan = (defsForRoom: any[], label: string, rcId: any) => {
    const wantedLabel = (label ?? "").toString().toLowerCase();
    const wantedRc = rcId == null ? null : String(rcId);

    return defsForRoom.find((def: any) => {
      const defLabel = (
        def?.mealPlanMaster?.shortCode ||
        def?.title ||
        def?.rateCode?.rateCode ||
        ""
      )
        .toString()
        .toLowerCase();
      const defRcId = def?.rateCodeID ?? def?.rateCode?.rateCodeID ?? null;
      const rcOk = wantedRc === null || wantedRc === String(defRcId ?? "");
      return defLabel === wantedLabel && rcOk;
    });
  };

  const convertInitial = (data: any | null) => {
    if (!data) return {};

    const hrRangeInit = rangeFromHotelRates(data?.hotelRates);
    const clickedInit = isValidYMD(data?.rateDate) ? data.rateDate : undefined;

    const dfInit =
      toYMD(data?.dateFrom) || clickedInit || hrRangeInit.from || todayYMD();

    const dtInit =
      toYMD(data?.dateTo) ||
      (clickedInit ? addDaysYMD(clickedInit, 6) : undefined) ||
      hrRangeInit.to ||
      addDaysYMD(dfInit, 6);
    return {
      rateCodeID: toStr(data.rateCodeID),
      rateCode: toStr(data.rateCode),
      roomTypeID: toStr(
        data.roomTypeID ?? data.roomTypeId ?? data.hotelRoomTypeID
      ),
      mealPlanID: toStr(data.mealPlanID),
      currencyCode: toStr(data.currencyCode),
      sellMode: toStr(data.sellMode),
      rateMode: toStr(data.rateMode),
      primaryOccupancy: toStr(data.primaryOccupancy),
      defaultRate: toStr(data.defaultRate),
      increaseBy: toStr(data.increaseBy),
      decreaseBy: toStr(data.decreaseBy),
      rateFor1: toStr(data.pax1),
      rateFor2: toStr(data.pax2),
      childrenFee: toStr(data.childRate),
      lockUI: !!data.lockUI,
      mealType: "",
      manualPersonCount: "",
      dateFrom: dfInit,
      dateTo: dtInit,
    };
  };

  const defaultForm = {
    rateCodeID: "",
    rateCode: "",
    roomTypeID: "",
    mealPlanID: "",
    currencyCode: "",
    sellMode: "",
    rateMode: "",
    primaryOccupancy: "",
    defaultRate: "",
    increaseBy: "",
    decreaseBy: "",
    rateFor1: "",
    rateFor2: "",
    childrenFee: "",
    lockUI: false,
    mealType: "",
    manualPersonCount: "",
    dateFrom: "",
    dateTo: "",
  };

  /* ------------------------------ State ------------------------------ */
  const [formData, setFormData] = useState<any>({
    ...defaultForm,
    ...convertInitial(initialData),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Record<string, string | undefined>
  >({});

  // Reference lists
  const [rateCodes, setRateCodes] = useState<
    { rateCodeID: number; rateCode: string }[]
  >([]);
  const [roomTypes, setRoomTypes] = useState<
    { hotelRoomTypeID: number; roomType: string; adultSpace: number | null }[]
  >([]);
  const [mealPlans, setMealPlans] = useState<
    { mealPlanID: number; mealPlan: string }[]
  >([]);
  const [currencies, setCurrencies] = useState<
    { currencyCode: string; currencyName: string }[]
  >([]);

  /* ----------------------- Fetch reference data ---------------------- */
  useEffect(() => {
    const fn = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) return;
        const { accessToken } = JSON.parse(tokenData);
        const data = await getAllRateCodes({ token: accessToken });
        setRateCodes((data || []).filter((rc: any) => rc.rateCode));
      } catch (e) {
        console.error("Failed to fetch rate codes", e);
      }
    };
    fn();
  }, []);

  useEffect(() => {
    const fn = async () => {
      try {
        const propData = localStorage.getItem("selectedProperty");
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!propData || !tokenData) return;
        const { id: hotelId } = JSON.parse(propData);
        const { accessToken } = JSON.parse(tokenData);
        const data = await getHotelRoomTypes({ token: accessToken, hotelId });
        setRoomTypes((data || []).filter((rt: any) => rt.roomType));
      } catch (e) {
        console.error("Failed to fetch room types", e);
      }
    };
    fn();
  }, []);

  useEffect(() => {
    const fn = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) return;
        const { accessToken } = JSON.parse(tokenData);
        const data = await getMealPlans({ token: accessToken });
        setMealPlans((data || []).filter((mp: any) => mp.mealPlan));
      } catch (e) {
        console.error("Failed to fetch meal plans", e);
      }
    };
    fn();
  }, []);

  useEffect(() => {
    const fn = async () => {
      try {
        const data = await getAllCurrencies();
        setCurrencies(
          (data || []).filter((c: any) => c.currencyCode && c.currencyName)
        );
      } catch (e) {
        console.error("Failed to fetch currencies", e);
      }
    };
    fn();
  }, []);

  /* ------------------ LIVE hydrate from matched plan ----------------- */
  useEffect(() => {
    setFormErrors({});
    setFormData({ ...defaultForm, ...convertInitial(initialData) });

    (async () => {
      try {
        if (!initialData) return;

        const tokenData = localStorage.getItem("hotelmateTokens");
        const propData = localStorage.getItem("selectedProperty");
        if (!tokenData || !propData) return;

        const { accessToken } = JSON.parse(tokenData);
        const { id: hotelId } = JSON.parse(propData);

        // pull ALL plan defs (same as grid)
        const planDefs = await getHotelRatePlans({
          token: accessToken,
          hotelId,
          isCmActive: false,
        });

        // resolve identity bits from initialData
        const roomTypeId =
          initialData.roomTypeID ??
          initialData.roomTypeId ??
          initialData.hotelRoomTypeID;

        const selectedLabel =
          initialData.planLabel ??
          initialData.label ??
          initialData.mealPlanShort ??
          initialData.mealPlan ??
          ""; // "RO" / "BB" / "HB"

        const selectedRcId = initialData.rateCodeID ?? initialData.rcId ?? null;

        if (!roomTypeId || !selectedLabel) {
          // nothing else to hydrate
          return;
        }

        // narrow to this room
        const defsForRoom = (planDefs || []).filter(
          (def: any) =>
            (def.roomTypeID ?? def.hotelRoomType?.hotelRoomTypeID) == roomTypeId
        );

        const matched = findMatchedPlan(
          defsForRoom,
          selectedLabel,
          selectedRcId
        );
        if (!matched) return; // keep whatever was passed in

        // Use clicked date if provided to pick that day's hotelRates
        const rateDate: string | undefined = initialData.rateDate; // "yyyy-MM-dd"
        const hydrated = convertPlanToForm(matched, rateDate);

        setFormData((prev: any) => ({
          ...prev,
          ...hydrated,
        }));
      } catch (e) {
        console.error("Failed to hydrate edit form from matched plan", e);
      }
    })();
  }, [initialData]);

  /* ------------------------------ UI utils --------------------------- */
  const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;

  const CurrencySuffix = ({ currency }: { currency: string }) => (
    <span className="text-sm text-muted-foreground ml-2">{currency || ""}</span>
  );

  const validateForm = (): boolean => {
    const errors: Record<string, string | undefined> = {};
    if (!formData.rateCodeID) errors.rateCodeID = "Rate Code is required.";
    if (!formData.roomTypeID) errors.roomTypeID = "Room Type is required.";
    if (!formData.mealPlanID) errors.mealPlanID = "Meal Plan is required.";
    if (!formData.currencyCode) errors.currencyCode = "Currency is required.";
    if (!formData.sellMode) errors.sellMode = "Sell Mode is required.";
    setFormErrors(errors);
    return Object.values(errors).every((e) => e === undefined);
  };

  /* ----------------------------- Handlers ---------------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(formData));
      onClose();
    } catch (err) {
      console.error("Edit rate submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoom = useMemo(
    () =>
      roomTypes.find(
        (rt) => rt.hotelRoomTypeID.toString() === formData.roomTypeID
      ),
    [roomTypes, formData.roomTypeID]
  );
  const maxOccupancy = selectedRoom?.adultSpace || 1;

  /* ------------------------------- Render ---------------------------- */
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Edit Rate</SheetTitle>
          <SheetDescription>
            Update the details for this rate plan
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Rate Code (locked – identity of plan) */}
          <div className="space-y-1">
            <Label>Rate Code</Label>
            <Select
              disabled
              value={formData.rateCodeID}
              onValueChange={(v) => {
                const selected = rateCodes.find(
                  (rc) => rc.rateCodeID.toString() === v
                );
                if (selected) {
                  setFormData((prev: any) => ({
                    ...prev,
                    rateCodeID: selected.rateCodeID.toString(),
                    rateCode: selected.rateCode,
                  }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Rate Code" />
              </SelectTrigger>
              <SelectContent>
                {rateCodes.map((rc) => (
                  <SelectItem
                    key={rc.rateCodeID}
                    value={rc.rateCodeID.toString()}
                  >
                    {rc.rateCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.rateCodeID} />
          </div>

          {/* Room Type (locked) */}
          <div className="space-y-1">
            <Label>Room Type</Label>
            <Select
              disabled
              value={formData.roomTypeID}
              onValueChange={(v) => {
                const room = roomTypes.find(
                  (rt) => rt.hotelRoomTypeID.toString() === v
                );
                setFormData((prev: any) => ({
                  ...prev,
                  roomTypeID: v,
                  primaryOccupancy:
                    room?.adultSpace !== null && room?.adultSpace !== undefined
                      ? String(room.adultSpace)
                      : "",
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Room Type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem
                    key={rt.hotelRoomTypeID}
                    value={rt.hotelRoomTypeID.toString()}
                  >
                    {rt.roomType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.roomTypeID} />
          </div>

          {/* Meal Plan (locked) */}
          <div className="space-y-1">
            <Label>Meal Plan</Label>
            <Select
              disabled
              value={formData.mealPlanID}
              onValueChange={(v) =>
                setFormData((prev: any) => ({ ...prev, mealPlanID: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Meal Plan" />
              </SelectTrigger>
              <SelectContent>
                {mealPlans.map((mp) => (
                  <SelectItem
                    key={mp.mealPlanID}
                    value={mp.mealPlanID.toString()}
                  >
                    {mp.mealPlan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.mealPlanID} />
          </div>

          {/* Currency (locked) */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              disabled
              value={formData.currencyCode}
              onValueChange={(v) =>
                setFormData((prev: any) => ({ ...prev, currencyCode: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.currencyCode} value={c.currencyCode}>
                    {c.currencyName} ({c.currencyCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.currencyCode} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="dateFrom">Valid From</Label>
              <Input
                id="dateFrom"
                type="date"
                name="dateFrom"
                value={formData.dateFrom}
                onChange={handleChange}
              />
              <FieldError message={formErrors.dateFrom} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dateTo">Valid To</Label>
              <Input
                id="dateTo"
                type="date"
                name="dateTo"
                value={formData.dateTo}
                onChange={handleChange}
              />
              <FieldError message={formErrors.dateTo} />
            </div>
          </div>

          {/* Sell Mode (locked) */}
          <div className="space-y-2">
            <Label>Sell Mode</Label>
            <div className="flex gap-4">
              {["Per Room", "Per Person"].map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  disabled
                  variant={formData.sellMode === mode ? "default" : "outline"}
                  onClick={() => handleSelectChange("sellMode", mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>
            <FieldError message={formErrors.sellMode} />
          </div>

          {/* Rate Mode for Per Person (locked) */}
          {formData.sellMode === "Per Person" && (
            <div className="space-y-2">
              <Label>Rate Mode</Label>
              <div className="flex gap-4">
                {["Manual", "Auto"].map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    disabled
                    variant={formData.rateMode === mode ? "default" : "outline"}
                    onClick={() => handleSelectChange("rateMode", mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
              <FieldError message={formErrors.rateMode} />
            </div>
          )}

          {/* Pricing */}
          {formData.sellMode === "Per Room" && (
            <div className="space-y-1">
              <Label htmlFor="defaultRate">Default Rate</Label>
              <Input
                id="defaultRate"
                name="defaultRate"
                value={formData.defaultRate}
                onChange={handleChange}
              />
              <CurrencySuffix currency={formData.currencyCode} />
              <FieldError message={formErrors.defaultRate} />
            </div>
          )}

          {formData.sellMode === "Per Person" &&
            formData.rateMode === "Manual" && (
              <>
                {[...Array(Number(formData.primaryOccupancy) || 0)].map(
                  (_, i) => {
                    const pax = i + 1;
                    const key = `rateFor${pax}`;
                    return (
                      <div className="space-y-1" key={key}>
                        <Label>{`Rate for ${pax} ${
                          pax === 1 ? "Person" : "Persons"
                        }`}</Label>
                        <Input
                          name={key}
                          value={formData[key] || ""}
                          onChange={handleChange}
                        />
                        <CurrencySuffix currency={formData.currencyCode} />
                        <FieldError message={formErrors[key]} />
                      </div>
                    );
                  }
                )}
                <div className="space-y-1">
                  <Label>Children Fee</Label>
                  <Input
                    name="childrenFee"
                    value={formData.childrenFee}
                    onChange={handleChange}
                  />
                  <CurrencySuffix currency={formData.currencyCode} />
                  <FieldError message={formErrors.childrenFee} />
                </div>
              </>
            )}

          {formData.sellMode === "Per Person" &&
            formData.rateMode === "Auto" && (
              <>
                <div className="space-y-1">
                  <Label>Default Occupancy</Label>
                  <Select
                    disabled
                    value={formData.primaryOccupancy}
                    onValueChange={(v) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        primaryOccupancy: v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(maxOccupancy)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {["defaultRate", "increaseBy", "decreaseBy", "childrenFee"].map(
                  (fld) => (
                    <div className="space-y-1" key={fld}>
                      <Label className="capitalize">{fld}</Label>
                      <Input
                        name={fld}
                        value={formData[fld] || ""}
                        onChange={handleChange}
                      />
                      <CurrencySuffix currency={formData.currencyCode} />
                      <FieldError message={formErrors[fld]} />
                    </div>
                  )
                )}
              </>
            )}

          {/* Lock UI */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="lockUI"
              checked={formData.lockUI}
              onCheckedChange={(v) =>
                setFormData((prev: any) => ({ ...prev, lockUI: !!v }))
              }
            />
            <Label htmlFor="lockUI">Lock editing at UI</Label>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

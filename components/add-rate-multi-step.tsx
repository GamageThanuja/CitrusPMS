"use client";

import React from "react";

import { useMemo, useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  DollarSign,
  Settings,
  CreditCard,
} from "lucide-react";
import { getAllRateCodes } from "@/controllers/allRateCodesController";
import { getHotelRoomTypes } from "@/controllers/hotelRoomTypeController";
import { getMealPlans } from "@/controllers/mealPlansController";
import { getAllCurrencies } from "@/controllers/AllCurrenciesController";
import { createHotelRatePlan } from "@/controllers/hotelRatePlanController";
import {
  fetchRateAvailability,
  selectRateAvailability,
} from "@/redux/slices/availabilitySlice";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import VideoButton from "./videoButton";
import VideoOverlay from "./videoOverlay";
import { useTutorial } from "@/hooks/useTutorial";

interface AddRateMultiStepProps {
  onComplete?: (data: any) => void;
}

type MoneyInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  currency?: string;
};

export const MoneyInput = React.memo(function MoneyInput({
  currency,
  className,
  ...props
}: MoneyInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        // ensure value is always string
        value={
          typeof props.value === "number"
            ? String(props.value)
            : props.value ?? ""
        }
        className={["pr-20 text-black bg-white", className]
          .filter(Boolean)
          .join(" ")}
      />
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
          {currency || "—"}
        </span>
      </span>
    </div>
  );
});

export function AddRateMultiStep({ onComplete }: AddRateMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
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
    dateFrom: "",
    dateTo: "",
    lockUI: false,
    mealType: "",
    manualPersonCount: "",
  });

  const [formErrors, setFormErrors] = useState<
    Record<string, string | undefined>
  >({});

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

  const dispatch = useDispatch();
  const rateAvail = useAppSelector(selectRateAvailability);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "onBoarding",
    "rate plans"
  );
  const [showRawOverlay, setShowRawOverlay] = useState(false);

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  console.log("rateAvail : ", rateAvail);

  useEffect(() => {
    dispatch(
      fetchRateAvailability({
        startDate: formData.dateFrom,
        endDate: formData.dateTo,
      })
    );
  }, [dispatch, formData.dateTo, formData.dateFrom]);

  useEffect(() => {
    const fetchRateCodes = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) return;
        const { accessToken } = JSON.parse(tokenData);
        const data = await getAllRateCodes({ token: accessToken });
        const validRateCodes = data.filter((rc: any) => rc.rateCode);
        setRateCodes(validRateCodes);
      } catch (error) {
        console.error("Failed to fetch rate codes:", error);
      }
    };
    fetchRateCodes();
  }, []);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const propData = localStorage.getItem("selectedProperty");
        if (!propData) return;
        const { id: hotelId } = JSON.parse(propData);
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) return;
        const { accessToken } = JSON.parse(tokenData);
        const data = await getHotelRoomTypes({ token: accessToken, hotelId });
        const validRoomTypes = data.filter((rt: any) => rt.roomType);
        setRoomTypes(validRoomTypes);
      } catch (error) {
        console.error("Error fetching room types:", error);
      }
    };
    fetchRoomTypes();
  }, []);

  const resetForm = () => {
    setCurrentStep(0);
    setIsSubmitting(false);
    setFormErrors({});
    setFormData({
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
      dateFrom: "",
      dateTo: "",
      lockUI: false,
      mealType: "",
      manualPersonCount: "",
    });
  };

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) return;
        const { accessToken } = JSON.parse(tokenData);
        const data = await getMealPlans({ token: accessToken });
        const validMealPlans = data.filter((mp: any) => mp.mealPlan);
        setMealPlans(validMealPlans);
      } catch (error) {
        console.error("Error fetching meal plans:", error);
      }
    };
    fetchMealPlans();
  }, []);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) return;
        const { accessToken } = JSON.parse(tokenData);
        const data = await getAllCurrencies();
        const validCurrencies = data.filter(
          (c: any) => c.currencyCode && c.currencyName
        );
        setCurrencies(validCurrencies);
      } catch (error) {
        console.error("Error fetching currencies:", error);
      }
    };
    fetchCurrencies();
  }, []);

  const parseOptionalInt = (
    value: string | null | undefined
  ): number | null => {
    if (value === null || value === undefined || value.trim() === "")
      return null;
    const num = Number.parseInt(value, 10);
    return isNaN(num) ? null : num;
  };

  const parseOptionalFloat = (
    value: string | null | undefined
  ): number | null => {
    if (value === null || value === undefined || value.trim() === "")
      return null;
    const num = Number.parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const CurrencySuffix = ({ currency }: { currency: string }) => (
    <span className="text-sm text-muted-foreground ml-2">{currency || ""}</span>
  );

  const submitRatePlan = async (formData: any) => {
    try {
      const tokenData = localStorage.getItem("hotelmateTokens");
      if (!tokenData) throw new Error("Access token not found in localStorage");
      const { accessToken } = JSON.parse(tokenData);
      const propertyData = localStorage.getItem("selectedProperty");
      const { id: hotelId } = propertyData
        ? JSON.parse(propertyData)
        : { id: null };

      const selectedMealPlanName =
        mealPlans.find((mp) => mp.mealPlanID.toString() === formData.mealPlanID)
          ?.mealPlan || "";
      const finalTitle = `${formData.rateCode || "N/A"}-${
        selectedMealPlanName || "N/A"
      }`;

      const hotelRatePlanDtoData: any = {
        recordID: 0,
        hotelRatePlanID: 0,
        rateDate: new Date().toISOString().split("T")[0],
        dateFrom: formData.dateFrom
          ? new Date(formData.dateFrom).toISOString()
          : null,
        dateTo: formData.dateTo
          ? new Date(formData.dateTo).toISOString()
          : null,
        sellMode: formData.sellMode,
        roomTypeID: parseOptionalInt(formData.roomTypeID),
        hotelID: hotelId,
        rateCodeID: parseOptionalInt(formData.rateCodeID),
        title: finalTitle,
        mealPlanID: parseOptionalInt(formData.mealPlanID),
        currencyCode: formData.currencyCode || null,
        childRate: parseOptionalFloat(formData.childrenFee) ?? 0,
        createdOn: new Date().toISOString(),
        createdBy: "string",
        child: parseOptionalFloat(formData.childrenFee) ?? 0,
      };

      hotelRatePlanDtoData.primaryOccupancy =
        parseOptionalInt(formData.primaryOccupancy) ?? 1;
      hotelRatePlanDtoData.defaultRate = parseOptionalFloat(
        formData.defaultRate
      );

      if (
        formData.sellMode === "Per Person" &&
        formData.rateMode === "Manual"
      ) {
        const maxOccupancy = parseOptionalInt(formData.primaryOccupancy) ?? 1;
        const maxRateKey = `rateFor${maxOccupancy}`;
        const maxRate = parseOptionalFloat(formData[maxRateKey]);
        if (maxRate !== null) {
          hotelRatePlanDtoData.defaultRate = maxRate;
        }
      }

      if (formData.sellMode === "Per Person") {
        hotelRatePlanDtoData.rateMode = formData.rateMode;
      }

      if (
        formData.sellMode === "Per Person" &&
        formData.rateMode === "Manual"
      ) {
        const maxOccupancy = parseOptionalInt(formData.primaryOccupancy) ?? 1;
        for (let i = 1; i <= maxOccupancy; i++) {
          const key = `rateFor${i}`;
          const paxKey = `pax${i}`;
          hotelRatePlanDtoData[paxKey] = parseOptionalFloat(formData[key]) ?? 0;
        }
      }

      if (formData.sellMode === "Per Person" && formData.rateMode === "Auto") {
        hotelRatePlanDtoData.increaseBy =
          parseOptionalFloat(formData.increaseBy) ?? 0;
        hotelRatePlanDtoData.decreaseBy =
          parseOptionalFloat(formData.decreaseBy) ?? 0;
      }

      await createHotelRatePlan({
        token: accessToken,
        payload: hotelRatePlanDtoData,
      });

      // router.replace(`/dashboard`);
      return { ok: true };
    } catch (error) {
      console.error("Error creating rate plan:", error);
      throw error;
    }
  };

  const selectedRoom = roomTypes.find(
    (rt) => rt.hotelRoomTypeID.toString() === formData.roomTypeID
  );
  const maxOccupancy = selectedRoom?.adultSpace || 1;

  const datesOverlap = (aStart: Date, aEnd: Date, b: Date) =>
    aStart <= b && b <= aEnd;
  const toDate = (v?: string | null) => (v ? new Date(v) : null);

  const selectedIds = {
    rateCodeId: formData.rateCodeID ? Number(formData.rateCodeID) : null,
    roomTypeId: formData.roomTypeID ? Number(formData.roomTypeID) : null,
    mealPlanId: formData.mealPlanID ? Number(formData.mealPlanID) : null,
  };

  const selStart = toDate(formData.dateFrom);
  const selEnd = toDate(formData.dateTo);

  const { isDuplicate, conflictingDates } = useMemo(() => {
    if (
      !selectedIds.rateCodeId ||
      !selectedIds.roomTypeId ||
      !selectedIds.mealPlanId ||
      !selStart ||
      !selEnd
    ) {
      return { isDuplicate: false, conflictingDates: [] as string[] };
    }

    const conflicts: string[] = [];
    const rows = (rateAvail?.data ?? []).filter((row: any) => {
      const currencyMatches =
        !row?.currencyCode || row.currencyCode === formData.currencyCode;
      return (
        row?.rateCodeId === selectedIds.rateCodeId &&
        row?.roomTypeId === selectedIds.roomTypeId &&
        row?.mealPlanId === selectedIds.mealPlanId &&
        currencyMatches
      );
    });

    for (const row of rows) {
      const hotelRates: any[] = row?.hotelRates ?? [];
      for (const hr of hotelRates) {
        const d = hr?.rateDate ? new Date(hr.rateDate) : null;
        if (d && datesOverlap(selStart, selEnd, d)) {
          conflicts.push(hr.rateDate);
        }
      }
    }

    return {
      isDuplicate: conflicts.length > 0,
      conflictingDates: conflicts.sort().slice(0, 8),
    };
  }, [
    rateAvail,
    selectedIds.rateCodeId,
    selectedIds.roomTypeId,
    selectedIds.mealPlanId,
    formData.currencyCode,
    formData.dateFrom,
    formData.dateTo,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));

      if (name === "sellMode") {
        if (value === "Per Room") {
          updated = {
            ...updated,
            rateMode: "",
            rateFor1: "",
            rateFor2: "",
            childrenFee: "",
            increaseBy: "",
            decreaseBy: "",
          };
        } else if (value === "Per Person") {
          updated = { ...updated, defaultRate: "" };
        }
      }

      if (name === "rateMode" && updated.sellMode === "Per Person") {
        if (value === "Manual") {
          updated = {
            ...updated,
            increaseBy: "",
            decreaseBy: "",
            defaultRate: "",
            primaryOccupancy:
              formData.manualPersonCount || updated.primaryOccupancy,
          };
        } else if (value === "Auto") {
          updated = {
            ...updated,
            rateFor1: "",
            rateFor2: "",
            manualPersonCount: formData.primaryOccupancy,
          };
        }
      }
      return updated;
    });
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string | undefined> = {};
    const stepId = visibleSteps[currentStep]?.id;

    switch (stepId) {
      case "rate-code":
        if (!formData.rateCodeID) errors.rateCodeID = "Rate Code is required.";
        break;

      case "room-type":
        if (!formData.roomTypeID) errors.roomTypeID = "Room Type is required.";
        break;

      case "meal-plan":
        if (!formData.mealPlanID) errors.mealPlanID = "Meal Plan is required.";
        break;

      case "period":
        if (!formData.dateFrom) errors.dateFrom = "Start date is required.";
        if (!formData.dateTo) errors.dateTo = "End date is required.";
        if (
          formData.dateFrom &&
          formData.dateTo &&
          new Date(formData.dateFrom) > new Date(formData.dateTo)
        ) {
          errors.dateTo = "End date cannot be earlier than start date.";
        }
        break;

      case "currency":
        if (!formData.currencyCode)
          errors.currencyCode = "Currency is required.";
        break;

      case "sell-mode":
        if (!formData.sellMode) errors.sellMode = "Sell Mode is required.";
        break;

      case "rate-mode":
        // Only relevant when the step is visible (Per Person)
        if (formData.sellMode === "Per Person" && !formData.rateMode) {
          errors.rateMode = "Rate Mode is required.";
        }
        break;

      // Add pricing validations here if needed (based on sellMode/rateMode)
    }

    setFormErrors(errors);
    return Object.values(errors).every((e) => e === undefined);
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, visibleSteps.length - 1));
    }
  };

  // Previous
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (isDuplicate) {
      setFormErrors((prev) => ({
        ...prev,
        dateFrom:
          "A rate already exists for this Rate Code + Room Type + Meal Plan within the selected period.",
        dateTo: conflictingDates.length
          ? `Conflicting dates: ${conflictingDates.join(", ")}${
              conflictingDates.length === 8 ? " ..." : ""
            }`
          : prev.dateTo,
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitRatePlan(formData);
      if (res?.ok) {
        onComplete?.(formData);
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error("Rate plan submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const quickPickDays = (days: number) => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + (days - 1)); // inclusive
    setFormData({
      ...formData,
      dateFrom: fmt(start),
      dateTo: fmt(end),
    });
    setFormErrors?.((e: any) => ({ ...e, dateFrom: "", dateTo: "" }));
  };

  const steps = [
    {
      id: "rate-code",
      title: "Select Rate Code",
      description: "Choose the rate plan for your property",
      icon: <Settings className="w-6 h-6" />,
      component: (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Select Rate Code
            </h2>
            <p className="text-gray-600">
              Choose the correct rate plan for your property
            </p>
          </div>

          {/* Quick filter */}
          {/* <div>
            <Label className="mb-2 block">Search Rate Codes</Label>
            <Input
              placeholder="Type to filter…"
              onChange={(e) =>
                ((window as any).__filterRateCodes =
                  e.target.value.toLowerCase())
              }
              className="h-10"
            />
          </div> */}

          {/* Vertical card list */}
          <div className="space-y-3">
            {rateCodes
              .filter((rc) => {
                const q = (window as any).__filterRateCodes || "";
                if (!q) return true;
                return rc.rateCode.toLowerCase().includes(q);
              })
              .map((rc) => {
                const selected =
                  formData.rateCodeID === rc.rateCodeID.toString();
                return (
                  <button
                    key={rc.rateCodeID}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        rateCodeID: rc.rateCodeID.toString(),
                        rateCode: rc.rateCode,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        rateCodeID: undefined,
                      }));
                    }}
                    className={[
                      "w-full text-left rounded-xl border transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-teal-500/50",
                      "hover:shadow-sm",
                      selected
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                              selected
                                ? "border-teal-500 bg-teal-500"
                                : "border-gray-300 bg-white",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            {selected && (
                              <Check className="h-3.5 w-3.5 text-white" />
                            )}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {rc.rateCode}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {rc.description}
                        </p>
                      </div>
                      {selected ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-700">
                          Selected
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          Choose
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

            {/* Empty state */}
            {rateCodes.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                No rate codes found.
              </div>
            )}
          </div>

          {/* Error */}
          {formErrors.rateCodeID && (
            <p className="text-sm text-red-500">{formErrors.rateCodeID}</p>
          )}
        </div>
      ),
    },
    {
      id: "room-type",
      title: "Select Room Type",
      description: "Choose the room type for this rate",
      icon: <Settings className="w-6 h-6" />,
      component: (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Select Room Type
            </h2>
            <p className="text-gray-600">
              Choose the room type for this rate plan
            </p>
          </div>

          {/* Quick filter */}
          {/* <div>
            <Label className="mb-2 block">Search Room Types</Label>
            <Input
              placeholder="Type to filter…"
              onChange={(e) =>
                ((window as any).__filterRoomTypes =
                  e.target.value.toLowerCase())
              }
              className="h-10"
            />
          </div> */}

          {/* Vertical card list */}
          <div className="space-y-3">
            {roomTypes
              .filter((rt) => {
                const q = (window as any).__filterRoomTypes || "";
                if (!q) return true;
                return rt.roomType.toLowerCase().includes(q);
              })
              .map((rt) => {
                const idStr = String(rt.hotelRoomTypeID);
                const selected = formData.roomTypeID === idStr;
                const occ = rt.adultSpace ?? undefined;

                return (
                  <button
                    key={rt.hotelRoomTypeID}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        roomTypeID: idStr,
                        primaryOccupancy:
                          rt.adultSpace !== null && rt.adultSpace !== undefined
                            ? String(rt.adultSpace)
                            : "",
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        roomTypeID: undefined,
                        primaryOccupancy: undefined,
                      }));
                    }}
                    className={[
                      "w-full text-left rounded-xl border transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-teal-500/50",
                      "hover:shadow-sm",
                      selected
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                              selected
                                ? "border-teal-500 bg-teal-500"
                                : "border-gray-300 bg-white",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            {selected && (
                              <Check className="h-3.5 w-3.5 text-white" />
                            )}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {rt.roomType}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {typeof occ === "number" && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                            {occ} Adult{occ === 1 ? "" : "s"}
                          </span>
                        )}
                        {selected ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-700">
                            Selected
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Choose
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

            {/* Empty state */}
            {roomTypes.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                No room types found.
              </div>
            )}
          </div>

          {/* Error */}
          {formErrors.roomTypeID && (
            <p className="text-sm text-red-500">{formErrors.roomTypeID}</p>
          )}
        </div>
      ),
    },
    {
      id: "meal-plan",
      title: "Select Meal Plan",
      description: "Choose the meal plan option",
      icon: <Settings className="w-6 h-6" />,
      component: (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Select Meal Plan
            </h2>
            <p className="text-gray-600">Choose the meal plan for this rate</p>
          </div>

          {/* Quick filter */}
          {/* <div>
            <Label className="mb-2 block">Search Meal Plans</Label>
            <Input
              placeholder="Type to filter…"
              onChange={(e) =>
                ((window as any).__filterMealPlans =
                  e.target.value.toLowerCase())
              }
              className="h-10"
            />
          </div> */}

          {/* Vertical card list */}
          <div className="space-y-3">
            {mealPlans
              .filter((mp) => {
                const q = (window as any).__filterMealPlans || "";
                if (!q) return true;
                return mp.mealPlan.toLowerCase().includes(q);
              })
              .map((mp) => {
                const idStr = String(mp.mealPlanID);
                const selected = formData.mealPlanID === idStr;

                return (
                  <button
                    key={mp.mealPlanID}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        mealPlanID: idStr,
                      }));
                      setFormErrors((prev) => ({
                        ...prev,
                        mealPlanID: undefined,
                      }));
                    }}
                    className={[
                      "w-full text-left rounded-xl border transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-teal-500/50",
                      "hover:shadow-sm",
                      selected
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                              selected
                                ? "border-teal-500 bg-teal-500"
                                : "border-gray-300 bg-white",
                            ].join(" ")}
                            aria-hidden="true"
                          >
                            {selected && (
                              <Check className="h-3.5 w-3.5 text-white" />
                            )}
                          </span>
                          <span className="font-medium text-gray-900 truncate">
                            {mp.mealPlan}
                          </span>
                        </div>
                      </div>

                      {selected ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-700">
                          Selected
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          Choose
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

            {/* Empty state */}
            {mealPlans.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                No meal plans found.
              </div>
            )}
          </div>

          {/* Error */}
          {formErrors.mealPlanID && (
            <p className="text-sm text-red-500">{formErrors.mealPlanID}</p>
          )}
        </div>
      ),
    },
    {
      id: "period",
      title: "Period",
      description: "Choose when this rate plan is active",
      icon: <Calendar className="w-6 h-6" />,
      component: (
        <div className="space-y-6 text-black">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Rate Period
            </h2>
            <p className="text-gray-600">
              Set the start and end dates for this rate plan
            </p>
          </div>

          {/* Quick picks */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => quickPickDays(30)}
              className="px-3 py-1.5 text-sm rounded-full border border-slate-200 hover:bg-slate-50"
            >
              Next 30 days
            </button>
            <button
              type="button"
              onClick={() => quickPickDays(90)}
              className="px-3 py-1.5 text-sm rounded-full border border-slate-200 hover:bg-slate-50"
            >
              Next 90 days
            </button>
            <button
              type="button"
              onClick={() => quickPickDays(180)}
              className="px-3 py-1.5 text-sm rounded-full border border-slate-200 hover:bg-slate-50"
            >
              Next 180 days
            </button>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Label htmlFor="dateFrom" className="text-slate-700">
                Start date
              </Label>
              <div className="mt-2 relative">
                <Input
                  id="dateFrom"
                  name="dateFrom"
                  type="date"
                  value={formData.dateFrom || ""}
                  onChange={(e) => {
                    const nextFrom = e.target.value;
                    let nextTo = formData.dateTo || "";
                    // ensure end >= start
                    if (nextFrom && nextTo && nextTo < nextFrom)
                      nextTo = nextFrom;
                    setFormData({
                      ...formData,
                      dateFrom: nextFrom,
                      dateTo: nextTo,
                    });
                    setFormErrors?.((err: any) => ({
                      ...err,
                      dateFrom: "",
                      dateTo: "",
                    }));
                  }}
                  className="text-center text-lg h-12 text-black bg-white"
                />
              </div>
              {formErrors.dateFrom && (
                <p className="mt-2 text-sm text-red-500">
                  {formErrors.dateFrom}
                </p>
              )}
            </div>

            {/* End */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <Label htmlFor="dateTo" className="text-slate-700">
                End date
              </Label>
              <div className="mt-2 relative">
                <Input
                  id="dateTo"
                  name="dateTo"
                  type="date"
                  min={formData.dateFrom || undefined}
                  value={formData.dateTo || ""}
                  onChange={(e) => {
                    const nextTo = e.target.value;
                    // guard: if user picks end before start, snap to start
                    const safeTo =
                      formData.dateFrom && nextTo < formData.dateFrom
                        ? formData.dateFrom
                        : nextTo;
                    setFormData({ ...formData, dateTo: safeTo });
                    setFormErrors?.((err: any) => ({ ...err, dateTo: "" }));
                  }}
                  className="text-center text-lg h-12 text-black bg-white"
                />
              </div>
              {formErrors.dateTo && (
                <p className="mt-2 text-sm text-red-500">{formErrors.dateTo}</p>
              )}
            </div>
          </div>

          {/* Summary chip */}
          {formData.dateFrom && formData.dateTo && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 flex items-center justify-between">
              <div className="text-slate-700">
                <span className="font-medium">From:</span> {formData.dateFrom}{" "}
                <span className="mx-2 text-slate-400">→</span>
                <span className="font-medium">To:</span> {formData.dateTo}
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-sky-700 border border-sky-200">
                {(() => {
                  const s = new Date(formData.dateFrom);
                  const e = new Date(formData.dateTo);
                  const days = Math.max(
                    0,
                    Math.round((+e - +s) / 86400000) + 1
                  ); // inclusive
                  return `${days} day${days === 1 ? "" : "s"}`;
                })()}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "currency",
      title: "Select Rate Currency",
      description: "Choose the pricing currency",
      icon: <DollarSign className="w-6 h-6" />,
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Select Rate Currency
            </h2>
            <p className="text-gray-600">Choose the currency for pricing</p>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={formData.currencyCode}
              onValueChange={(v) => {
                setFormData((prev) => ({ ...prev, currencyCode: v }));
                setFormErrors((prev) => ({ ...prev, currencyCode: undefined }));
              }}
            >
              <SelectTrigger className="bg-white text-black ">
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black ">
                {currencies.map((c) => (
                  <SelectItem key={c.currencyCode} value={c.currencyCode}>
                    {c.currencyName} ({c.currencyCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.currencyCode && (
              <p className="text-sm text-red-500">{formErrors.currencyCode}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "sell-mode",
      title: "Sell Mode",
      description: "Choose how to sell this rate",
      icon: <CreditCard className="w-6 h-6" />,
      component: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Sell Mode
            </h2>
            <p className="text-gray-600">
              How would you like to sell this rate?
            </p>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              {["Per Room", "Per Person"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    handleSelectChange("sellMode", mode);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.sellMode === mode
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 bg-white text-black hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-medium">{mode}</div>
                      <div className="text-sm text-gray-500">
                        {mode === "Per Room"
                          ? "Fixed rate per room"
                          : "Rate varies by occupancy"}
                      </div>
                    </div>
                    {formData.sellMode === mode && (
                      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {formErrors.sellMode && (
              <p className="text-sm text-red-500">{formErrors.sellMode}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "rate-mode",
      title: "Rate Mode",
      description: "Choose how rates should be calculated",
      icon: <Settings className="w-6 h-6" />,
      component: formData.sellMode === "Per Person" && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Rate Mode
            </h2>
            <p className="text-gray-600">Select Manual or Auto</p>
          </div>

          {/* Pretty selectable cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["Manual", "Auto"].map((mode) => {
              const selected = formData.rateMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleSelectChange("rateMode", mode)}
                  className={[
                    "relative w-full text-left rounded-xl border p-4 transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-teal-500/40",
                    selected
                      ? "border-teal-500 bg-teal-50 ring-2 ring-teal-400/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  {/* Corner check badge when selected */}
                  {selected && (
                    <div className="absolute top-2 right-2">
                      <div className="h-6 w-6 rounded-full bg-teal-500 text-white flex items-center justify-center shadow">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{mode}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {mode === "Manual"
                          ? "Set rates for each occupancy"
                          : "Auto-calc from default rate"}
                      </div>
                    </div>
                    <span
                      className={[
                        "px-2 py-1 text-xs font-medium rounded-full",
                        selected
                          ? "bg-teal-100 text-teal-700"
                          : "bg-gray-100 text-gray-700",
                      ].join(" ")}
                    >
                      {selected ? "Selected" : "Choose"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {formErrors.rateMode && (
            <p className="text-sm text-red-500">{formErrors.rateMode}</p>
          )}
        </div>
      ),
    },
    {
      id: "pricing",
      title: "Pricing Details",
      description: "Enter the rate values",
      icon: <DollarSign className="w-6 h-6" />,
      component: (
        <div className="space-y-6 text-black">
          {/* Per Room Mode */}
          {formData.sellMode === "Per Room" && (
            <div className="space-y-2">
              <Label htmlFor="defaultRate">Default Rate</Label>
              <MoneyInput
                id="defaultRate"
                name="defaultRate"
                placeholder="Default Rate"
                value={formData.defaultRate}
                onChange={handleChange}
                currency={formData.currencyCode}
              />
              {formErrors.defaultRate && (
                <p className="text-sm text-red-500">{formErrors.defaultRate}</p>
              )}
            </div>
          )}

          {/* Per Person + Manual */}
          {formData.sellMode === "Per Person" &&
            formData.rateMode === "Manual" && (
              <>
                <div className="space-y-2">
                  <Label>Default Occupancy</Label>
                  <Input value={formData.primaryOccupancy} readOnly disabled />
                </div>

                {[...Array(Number(formData.primaryOccupancy) || 0)].map(
                  (_, i) => {
                    const pax = i + 1;
                    const key = `rateFor${pax}`;
                    return (
                      <div className="space-y-2" key={key}>
                        <Label htmlFor={key}>
                          Rate for {pax} Person{pax > 1 ? "s" : ""}
                        </Label>
                        <MoneyInput
                          id={key}
                          name={key}
                          placeholder={`Rate for ${pax}`}
                          value={(formData as any)[key] || ""}
                          onChange={handleChange}
                          currency={formData.currencyCode}
                        />
                        {formErrors[key] && (
                          <p className="text-sm text-red-500">
                            {formErrors[key]}
                          </p>
                        )}
                      </div>
                    );
                  }
                )}

                <div className="space-y-2">
                  <Label htmlFor="childrenFee">Children Fee</Label>
                  <MoneyInput
                    id="childrenFee"
                    name="childrenFee"
                    placeholder="Children Fee"
                    value={formData.childrenFee}
                    onChange={handleChange}
                    currency={formData.currencyCode}
                  />
                  {formErrors.childrenFee && (
                    <p className="text-sm text-red-500">
                      {formErrors.childrenFee}
                    </p>
                  )}
                </div>
              </>
            )}

          {/* Per Person + Auto */}
          {formData.sellMode === "Per Person" &&
            formData.rateMode === "Auto" && (
              <>
                <div className="space-y-2">
                  <Label>Default Occupancy</Label>
                  <Select
                    value={formData.primaryOccupancy?.toString() || ""}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, primaryOccupancy: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default occupancy" />
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

                <div className="space-y-2">
                  <Label htmlFor="defaultRate">Default Rate</Label>
                  <MoneyInput
                    id="defaultRate"
                    name="defaultRate"
                    value={formData.defaultRate}
                    onChange={handleChange}
                    currency={formData.currencyCode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="increaseBy">Increase By</Label>
                  <MoneyInput
                    id="increaseBy"
                    name="increaseBy"
                    value={formData.increaseBy}
                    onChange={handleChange}
                    currency={formData.currencyCode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decreaseBy">Decrease By</Label>
                  <MoneyInput
                    id="decreaseBy"
                    name="decreaseBy"
                    value={formData.decreaseBy}
                    onChange={handleChange}
                    currency={formData.currencyCode}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="childrenFee">Children Fee</Label>
                  <MoneyInput
                    id="childrenFee"
                    name="childrenFee"
                    value={formData.childrenFee}
                    onChange={handleChange}
                    currency={formData.currencyCode}
                  />
                </div>
              </>
            )}
        </div>
      ),
    },

    // Add more steps for rate mode, pricing fields, etc.
    {
      id: "complete",
      title: "Review & Submit",
      description: "Review your rate plan details",
      icon: <Check className="w-6 h-6" />,
      component: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Review Rate Plan
            </h2>
            <p className="text-gray-600">
              Please review your rate plan details before submitting
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Rate Code:</span>
                <p className="text-gray-900">{formData.rateCode}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Room Type:</span>
                <p className="text-gray-900">
                  {
                    roomTypes.find(
                      (rt) =>
                        rt.hotelRoomTypeID.toString() === formData.roomTypeID
                    )?.roomType
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Meal Plan:</span>
                <p className="text-gray-900">
                  {
                    mealPlans.find(
                      (mp) => mp.mealPlanID.toString() === formData.mealPlanID
                    )?.mealPlan
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Currency:</span>
                <p className="text-gray-900">{formData.currencyCode}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Period:</span>
                <p className="text-gray-900">
                  {formData.dateFrom} to {formData.dateTo}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Sell Mode:</span>
                <p className="text-gray-900">{formData.sellMode}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="lockUI"
              checked={formData.lockUI}
              onCheckedChange={(v) =>
                setFormData((prev) => ({ ...prev, lockUI: !!v }))
              }
            />
            <Label htmlFor="lockUI">Lock editing at UI</Label>
          </div>

          {isDuplicate && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-medium">
                Duplicate Rate Detected
              </p>
              <p className="text-red-600 text-sm">
                A rate already exists for this combination within the selected
                period.
              </p>
              {conflictingDates.length > 0 && (
                <p className="text-red-600 text-sm mt-1">
                  Conflicting dates: {conflictingDates.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const visibleSteps = useMemo(
    () =>
      steps.filter(
        (s) => s.id !== "rate-mode" || formData.sellMode === "Per Person"
      ),
    // `steps` is re-created each render; including it is fine
    [steps, formData.sellMode]
  );

  // If the visible steps shrink (e.g., switch to Per Room), keep index valid
  useEffect(() => {
    if (currentStep >= visibleSteps.length) {
      setCurrentStep(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, currentStep]);

  const currentStepData = visibleSteps[currentStep];
  const progress = ((currentStep + 1) / visibleSteps.length) * 100;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {visibleSteps.length}
            </span>

            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 flex items-center justify-center text-white">
                {currentStepData.icon}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentStepData.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">{currentStepData.component}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 bg-transparent text-black"
              >
                <ArrowLeft className="w-4 h-4 " />
                Previous
              </Button>

              {currentStep === visibleSteps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isDuplicate}
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 flex items-center gap-2 text-white"
                >
                  {isSubmitting ? "Creating..." : "Create Rate Plan"}
                  <Check className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 flex items-center gap-2 text-white"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              Create another rate plan?
            </DialogTitle>
            <DialogDescription>
              Your rate plan was created successfully. Would you like to add
              another now, or go to rates?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <div className="mb-1 font-medium">Next steps</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Create another</strong> resets this wizard for a fresh
                entry.
              </li>
              <li>
                <strong>Go to Dashboard</strong> takes you to the Dashboard.
              </li>
            </ul>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                resetForm();
              }}
            >
              Create another
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white"
              onClick={() => {
                setShowSuccessModal(false);
                router.replace("/reservation/front-desk");
              }}
            >
              Go to dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="top-10 right-10 absolute">
        <VideoButton
          onClick={() => setShowRawOverlay(true)}
          label="Watch Video"
        />
      </div>
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </div>
  );
}

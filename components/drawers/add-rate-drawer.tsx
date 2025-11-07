"use client";

import { useState } from "react";
import { useEffect } from "react";
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
import { createHotelRatePlan } from "@/controllers/hotelRatePlanController";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

interface AddRateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function AddRateDrawer({
  isOpen,
  onClose,
  onSubmit,
}: AddRateDrawerProps) {
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

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "roomsAndRates",
    "addRate"
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="text-sm text-red-500 mt-1">{message}</p> : null;

  const [rateCodes, setRateCodes] = useState<
    { rateCodeID: number; rateCode: string }[]
  >([]);

  useEffect(() => {
    const fetchRateCodes = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) {
          console.error("Token not found in localStorage");
          return;
        }

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

  const [roomTypes, setRoomTypes] = useState<
    { hotelRoomTypeID: number; roomType: string; adultSpace: number | null }[]
  >([]);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const propData = localStorage.getItem("selectedProperty");
        if (!propData) {
          console.error("Hotel not selected");
          return;
        }

        const { id: hotelId } = JSON.parse(propData);
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) {
          console.error("Token not found in localStorage");
          return;
        }

        const { accessToken } = JSON.parse(tokenData);

        const data = await getHotelRoomTypes({
          token: accessToken,
          hotelId,
        });

        const validRoomTypes = data.filter((rt: any) => rt.roomType);
        setRoomTypes(validRoomTypes);
      } catch (error) {
        console.error("Error fetching room types:", error);
      }
    };

    fetchRoomTypes();
  }, []);

  const [mealPlans, setMealPlans] = useState<
    { mealPlanID: number; mealPlan: string }[]
  >([]);

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) {
          console.error("Token not found in localStorage");
          return;
        }

        const { accessToken } = JSON.parse(tokenData);

        const data = await getMealPlans({
          token: accessToken,
        });
        console.log("data");

        const validMealPlans = data.filter((mp: any) => mp.mealPlan);
        setMealPlans(validMealPlans);
      } catch (error) {
        console.error("Error fetching meal plans:", error);
      }
    };

    fetchMealPlans();
  }, []);

  const [currencies, setCurrencies] = useState<
    { currencyCode: string; currencyName: string }[]
  >([]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        if (!tokenData) {
          console.error("Token not found in localStorage");
          return;
        }

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

  const CurrencySuffix = ({ currency }: { currency: string }) => (
    <span className="text-sm text-muted-foreground ml-2">{currency || ""}</span>
  );

  const parseOptionalInt = (
    value: string | null | undefined
  ): number | null => {
    if (value === null || value === undefined || value.trim() === "") {
      return null;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  };

  const parseOptionalFloat = (
    value: string | null | undefined
  ): number | null => {
    if (value === null || value === undefined || value.trim() === "") {
      return null;
    }
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const submitRatePlan = async (formData: any) => {
    try {
      const tokenData = localStorage.getItem("hotelmateTokens");
      if (!tokenData) throw new Error("Access token not found in localStorage");

      const { accessToken } = JSON.parse(tokenData);

      const propertyData = localStorage.getItem("selectedProperty");
      const { id: hotelId } = propertyData
        ? JSON.parse(propertyData)
        : { id: null };

      // Derive names for the title
      const selectedMealPlanName =
        mealPlans.find((mp) => mp.mealPlanID.toString() === formData.mealPlanID)
          ?.mealPlan || "";
      // formData.rateCode (name) is already set when formData.rateCodeID is selected
      const finalTitle = `${formData.rateCode || "N/A"}-${
        selectedMealPlanName || "N/A"
      }`;

      // --- PATCH: Use new hotelRatePlanDtoData conditional logic ---
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
      // Always include primaryOccupancy and defaultRate regardless of sellMode
      hotelRatePlanDtoData.primaryOccupancy =
        parseOptionalInt(formData.primaryOccupancy) ?? 1;
      hotelRatePlanDtoData.defaultRate = parseOptionalFloat(
        formData.defaultRate
      );
      // Override defaultRate for Per Person + Manual mode
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
      // --- END PATCH ---

      await createHotelRatePlan({
        token: accessToken,
        payload: hotelRatePlanDtoData,
      });

      // console.log("Rate plan created successfully:", result);
      // return result;
    } catch (error) {
      console.error("Error creating rate plan:", error);
      throw error;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      // Clear errors for the field being changed
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));

      if (name === "sellMode") {
        if (value === "Per Room") {
          // When switching to "Per Room", rateMode is not applicable for payload.
          // Clear fields relevant only to "Per Person"
          updated = {
            ...updated,
            rateMode: "", // Reset internal rateMode state, not used in payload for "Per Room"
            rateFor1: "",
            rateFor2: "",
            childrenFee: "",
            // primaryOccupancy should retain its value derived from the selected room's adultSpace
            // It will be used in the payload for "Per Room" mode.
            increaseBy: "",
            decreaseBy: "",
            // defaultRate is used by "Per Room", so don't clear it here.
          };
        } else if (value === "Per Person") {
          // When switching to "Per Person", defaultRate is used by "Auto" mode,
          // but not by "Manual" mode. Clearing it forces re-evaluation.
          updated = {
            ...updated,
            defaultRate: "", // Clear defaultRate, user will set it if in "Auto" mode.
          };
        }
      }

      // This logic applies when rateMode itself is changed (which only happens if sellMode is "Per Person")
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

  const validateForm = (): boolean => {
    const errors: Record<string, string | undefined> = {};
    // Basic validations
    if (!formData.rateCodeID) errors.rateCodeID = "Rate Code is required.";
    if (!formData.roomTypeID) errors.roomTypeID = "Room Type is required.";
    if (!formData.mealPlanID) errors.mealPlanID = "Meal Plan is required.";
    if (!formData.currencyCode) errors.currencyCode = "Currency is required.";
    if (!formData.sellMode) errors.sellMode = "Sell Mode is required.";
    if (!formData.dateFrom) errors.dateFrom = "Date From is required.";
    if (!formData.dateTo) errors.dateTo = "Date To is required.";
    if (
      formData.dateFrom &&
      formData.dateTo &&
      new Date(formData.dateFrom) > new Date(formData.dateTo)
    ) {
      errors.dateTo = "Date To cannot be earlier than Date From.";
    }

    // Conditional validations
    if (formData.sellMode === "Per Room") {
      if (!formData.defaultRate.trim())
        errors.defaultRate = "Default Rate is required.";
      else if (isNaN(parseFloat(formData.defaultRate)))
        errors.defaultRate = "Default Rate must be a valid number.";
    } else if (formData.sellMode === "Per Person") {
      if (!formData.rateMode) errors.rateMode = "Rate Mode is required.";

      if (formData.rateMode === "Manual") {
        if (!formData.rateFor1.trim())
          errors.rateFor1 = "Rate for 1 Person is required.";
        else if (isNaN(parseFloat(formData.rateFor1)))
          errors.rateFor1 = "Rate for 1 Person must be a valid number.";
        if (!formData.rateFor2.trim())
          errors.rateFor2 = "Rate for 2 Persons is required.";
        else if (isNaN(parseFloat(formData.rateFor2)))
          errors.rateFor2 = "Rate for 2 Persons must be a valid number.";
        if (
          formData.childrenFee.trim() &&
          isNaN(parseFloat(formData.childrenFee))
        )
          errors.childrenFee = "Children Fee must be a valid number.";
      } else if (formData.rateMode === "Auto") {
        // Validate primaryOccupancy only if it's not empty (derived from adultSpace)
        if (formData.primaryOccupancy.trim()) {
          const poNum = parseInt(formData.primaryOccupancy, 10);
          if (isNaN(poNum))
            errors.primaryOccupancy =
              "Default Occupancy (from room type) must be a valid number.";
          else if (poNum < 1)
            errors.primaryOccupancy =
              "Default Occupancy (from room type) must be at least 1.";
        }
        // Default Rate for P.P/Auto is hardcoded to 100 in payload, UI input is for user reference or future change.
        // If UI input for defaultRate is to be validated:
        // if (!formData.defaultRate.trim()) errors.defaultRate = "Default Rate is required.";
        // else if (isNaN(parseFloat(formData.defaultRate))) errors.defaultRate = "Default Rate must be a valid number.";
        if (
          formData.increaseBy.trim() &&
          isNaN(parseFloat(formData.increaseBy))
        )
          errors.increaseBy = "Increase By must be a valid number.";
        if (
          formData.decreaseBy.trim() &&
          isNaN(parseFloat(formData.decreaseBy))
        )
          errors.decreaseBy = "Decrease By must be a valid number.";
        if (
          formData.childrenFee.trim() &&
          isNaN(parseFloat(formData.childrenFee))
        )
          errors.childrenFee = "Children Fee must be a valid number.";
      }
    }
    setFormErrors(errors);
    return Object.values(errors).every((error) => error === undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log("Form validation failed", formErrors);
      return;
    }
    setIsSubmitting(true); // Start loading
    try {
      await submitRatePlan(formData);
      onSubmit(formData);
      onClose();
      window.location.href = "/rooms/rates";
    } catch (err) {
      console.error("Rate plan submission failed:", err);
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  // --- PATCH: Calculate selectedRoom and maxOccupancy for Per Person + Auto mode ---
  const selectedRoom = roomTypes.find(
    (rt) => rt.hotelRoomTypeID.toString() === formData.roomTypeID
  );
  const maxOccupancy = selectedRoom?.adultSpace || 1;
  // --- END PATCH ---

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle>Create Rate</SheetTitle>
          <SheetDescription>
            Enter the details for the new rate
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Rate Code */}
          <div className="space-y-1">
            <Label htmlFor="title">
              Rate Code{" "}
              <span className="text-sm text-muted-foreground">
                - Select the correct rate plan
              </span>
            </Label>
            <Select
              value={formData.rateCodeID?.toString() || ""}
              onValueChange={(v) => {
                const selected = rateCodes.find(
                  (rc) => rc.rateCodeID.toString() === v
                );
                if (selected) {
                  setFormData((prev) => ({
                    ...prev,
                    rateCodeID: selected.rateCodeID.toString(),
                    rateCode: selected.rateCode,
                  }));
                }
              }}
            >
              <SelectTrigger id="rateCode">
                <SelectValue placeholder="Select Rate Code" />
              </SelectTrigger>
              <SelectContent>
                {rateCodes.map((rate) => (
                  <SelectItem
                    key={rate.rateCodeID}
                    value={rate.rateCodeID.toString()}
                  >
                    {rate.rateCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.rateCodeID} />
          </div>

          {/* Room Type */}
          <div className="space-y-1">
            <Label htmlFor="roomType">Room Type</Label>
            <Select
              value={formData.roomTypeID?.toString() || ""}
              onValueChange={(v) => {
                const selectedRoom = roomTypes.find(
                  (rt) => rt.hotelRoomTypeID.toString() === v
                );
                setFormData((prev) => ({
                  ...prev,
                  roomTypeID: v,
                  primaryOccupancy:
                    selectedRoom?.adultSpace !== null &&
                    selectedRoom?.adultSpace !== undefined
                      ? selectedRoom.adultSpace.toString()
                      : "",
                }));
                setFormErrors((prevErrors) => ({
                  ...prevErrors,
                  roomTypeID: undefined,
                  primaryOccupancy: undefined,
                }));
              }}
            >
              <SelectTrigger id="roomType">
                <SelectValue placeholder="Select Room Type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem
                    key={rt.hotelRoomTypeID}
                    value={String(rt.hotelRoomTypeID)}
                  >
                    {rt.roomType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.roomTypeID} />
          </div>

          {/* Meal Plan */}
          <div className="space-y-1">
            <Label htmlFor="mealType">Meal Plan</Label>
            <Select
              value={formData.mealPlanID?.toString() || ""}
              onValueChange={(v) => {
                setFormData((prev) => ({
                  ...prev,
                  mealPlanID: parseInt(v).toString(),
                }));
              }}
            >
              <SelectTrigger id="mealType">
                <SelectValue placeholder="Select Meal Plan" />
              </SelectTrigger>
              <SelectContent>
                {mealPlans.map((mp) => (
                  <SelectItem key={mp.mealPlanID} value={String(mp.mealPlanID)}>
                    {mp.mealPlan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={formErrors.mealPlanID} />
          </div>

          {/* Period Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Period</p>

            <div className="space-y-1">
              <Label htmlFor="dateFrom">Date from</Label>
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                placeholder="Date from"
                value={formData.dateFrom || ""}
                onChange={handleChange}
              />
              <FieldError message={formErrors.dateFrom} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="dateTo">Date to</Label>
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                placeholder="Date to"
                value={formData.dateTo || ""}
                onChange={handleChange}
              />
              <FieldError message={formErrors.dateTo} />
            </div>
          </div>

          {/* Currency */}

          <div className="space-y-2">
            <p className="text-sm font-medium text-primary pt-4">
              Price Setting
            </p>
            <Label>Currency</Label>
            <Select
              value={formData.currencyCode}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, currencyCode: v }))
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

          {/* Sell Mode */}
          <div className="space-y-2">
            <Label>Sell Mode</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={
                  formData.sellMode === "Per Room" ? "default" : "outline"
                }
                onClick={() => handleSelectChange("sellMode", "Per Room")}
              >
                Per Room
              </Button>
              <Button
                type="button"
                variant={
                  formData.sellMode === "Per Person" ? "default" : "outline"
                }
                onClick={() => handleSelectChange("sellMode", "Per Person")}
              >
                Per Person
              </Button>
            </div>
            <FieldError message={formErrors.sellMode} />
          </div>

          {/* Rate Mode - visible only if Sell Mode is not "Per Room" */}
          {formData.sellMode !== "Per Room" && (
            <div className="space-y-2">
              <Label>Rate Mode</Label>
              <div className="flex gap-4">
                {["Manual", "Auto"].map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={formData.rateMode === mode ? "default" : "outline"}
                    onClick={() => handleSelectChange("rateMode", mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            // Error for rateMode will be shown if sellMode is "Per Person" and rateMode is not selected
            // This can be implicitly handled by the form logic, or add: <FieldError message={formErrors.rateMode} />
          )}

          {/* Pricing Fields based on Sell Mode and Rate Mode */}
          {formData.sellMode === "Per Room" && (
            <div className="space-y-1">
              <Label htmlFor="defaultRate">Default Rate</Label>
              <Input
                id="defaultRate"
                name="defaultRate"
                placeholder="Default Rate"
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
                <div className="space-y-1">
                  <Label htmlFor="primaryOccupancy">Default Occupancy</Label>
                  <Input
                    id="primaryOccupancy"
                    name="primaryOccupancy"
                    value={formData.primaryOccupancy}
                    readOnly
                    disabled
                  />
                </div>
                {[...Array(Number(formData.primaryOccupancy) || 0)].map(
                  (_, i) => {
                    const pax = i + 1;
                    const key = `rateFor${pax}`;
                    return (
                      <div className="space-y-1" key={key}>
                        <Label htmlFor={key}>
                          Rate for {pax} Person{pax > 1 ? "s" : ""}
                        </Label>
                        <Input
                          id={key}
                          name={key}
                          placeholder={`Rate for ${pax} person${
                            pax > 1 ? "s" : ""
                          }`}
                          value={(formData as any)[key] || ""}
                          onChange={handleChange}
                        />
                        <CurrencySuffix currency={formData.currencyCode} />
                        <FieldError message={formErrors[key]} />
                      </div>
                    );
                  }
                )}
                <div className="space-y-1">
                  <Label htmlFor="childrenFee">Children Fee</Label>
                  <Input
                    id="childrenFee"
                    name="childrenFee"
                    placeholder="Children Fee"
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
                  <Label htmlFor="primaryOccupancy">Default Occupancy</Label>
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
                  {/* FieldError can be kept if derived adultSpace might be invalid for API rules not yet handled */}
                  <FieldError message={formErrors.primaryOccupancy} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="defaultRate">Default Rate</Label>
                  <Input
                    id="defaultRate"
                    name="defaultRate"
                    placeholder="Default Rate"
                    value={formData.defaultRate}
                    onChange={handleChange}
                  />
                  <CurrencySuffix currency={formData.currencyCode} />
                  <FieldError message={formErrors.defaultRate} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="increaseBy">Increase By</Label>
                  <Input
                    id="increaseBy"
                    name="increaseBy"
                    placeholder="Increase By"
                    value={formData.increaseBy}
                    onChange={handleChange}
                  />
                  <CurrencySuffix currency={formData.currencyCode} />
                  <FieldError message={formErrors.increaseBy} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="decreaseBy">Decrease By</Label>
                  <Input
                    id="decreaseBy"
                    name="decreaseBy"
                    placeholder="Decrease By"
                    value={formData.decreaseBy}
                    onChange={handleChange}
                  />
                  <CurrencySuffix currency={formData.currencyCode} />
                  <FieldError message={formErrors.decreaseBy} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="childrenFee">Children Fee</Label>
                  <Input
                    id="childrenFee"
                    name="childrenFee"
                    placeholder="Children Fee"
                    value={formData.childrenFee}
                    onChange={handleChange}
                  />
                  <CurrencySuffix currency={formData.currencyCode} />
                  <FieldError message={formErrors.childrenFee} />
                </div>
              </>
            )}
          {/* Lock UI */}
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

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
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

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
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchRateCodes,
  selectRateCodes,
  selectRateCodesLoading,
  selectRateCodesError,
} from "@/redux/slices/fetchRateCodesSlice";
import {
  fetchRoomTypeMas,
  selectRoomTypeMas,
  selectRoomTypeMasLoading,
  selectRoomTypeMasError,
} from "@/redux/slices/roomTypeMasSlice";
import {
  fetchBasisMas,
  selectBasisMasItems,
  selectBasisMasLoading,
  selectBasisMasError,
} from "@/redux/slices/fetchBasisMasSlice";
import {
  fetchCurrencyMas,
  selectCurrencyMasItems,
  selectCurrencyMasLoading,
  selectCurrencyMasError,
} from "@/redux/slices/fetchCurrencyMasSlice";
import type { CreateHotelRatePlanRequest } from "@/redux/slices/createHotelRatePlansSlice";
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

  // Redux hooks
  const dispatch = useAppDispatch();
  const rateCodes = useAppSelector(selectRateCodes);
  const rateCodesLoading = useAppSelector(selectRateCodesLoading);
  const rateCodesError = useAppSelector(selectRateCodesError);

  useEffect(() => {
    dispatch(fetchRateCodes());
  }, [dispatch]);

  const roomTypes = useAppSelector(selectRoomTypeMas);
  const roomTypesLoading = useAppSelector(selectRoomTypeMasLoading);
  const roomTypesError = useAppSelector(selectRoomTypeMasError);

  useEffect(() => {
    dispatch(fetchRoomTypeMas());
  }, [dispatch]);

  const mealPlans = useAppSelector(selectBasisMasItems);
  const mealPlansLoading = useAppSelector(selectBasisMasLoading);
  const mealPlansError = useAppSelector(selectBasisMasError);

  useEffect(() => {
    dispatch(fetchBasisMas());
  }, [dispatch]);

  const currencies = useAppSelector(selectCurrencyMasItems);
  const currenciesLoading = useAppSelector(selectCurrencyMasLoading);
  const currenciesError = useAppSelector(selectCurrencyMasError);

  useEffect(() => {
    dispatch(fetchCurrencyMas());
  }, [dispatch]);

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

  const buildRatePlanPayload = (formData: any): CreateHotelRatePlanRequest => {
    const propertyData = localStorage.getItem("selectedProperty");
    const { id: hotelId } = propertyData
      ? JSON.parse(propertyData)
      : { id: null };

    // Derive names for the title
    const selectedMealPlanName =
      mealPlans.find((mp) => mp.basisID.toString() === formData.mealPlanID)
        ?.basis || "";
    const finalTitle = `${formData.rateCode || "N/A"}-${
      selectedMealPlanName || "N/A"
    }`;

    // Build payload according to createHotelRatePlansSlice interface
    const payload: CreateHotelRatePlanRequest = {
      recordID: 0,
      hotelRatePlanID: 0,
      rateDate: new Date().toISOString().split("T")[0],
      defaultRate: parseOptionalFloat(formData.defaultRate) ?? 0,
      pax1: 0,
      pax2: 0,
      pax3: 0,
      pax4: 0,  
      pax5: 0,
      pax6: 0,
      pax7: 0,
      pax8: 0,
      pax9: 0,
      pax10: 0,
      pax11: 0,
      pax12: 0,
      pax13: 0,
      pax14: 0,
      pax15: 0,
      pax16: 0,
      pax17: 0,
      pax18: 0,
      child: parseOptionalFloat(formData.childrenFee) ?? 0,
      dateFrom: formData.dateFrom ? new Date(formData.dateFrom).toISOString() : new Date().toISOString(),
      dateTo: formData.dateTo ? new Date(formData.dateTo).toISOString() : new Date().toISOString(),
      sellMode: formData.sellMode || "Per Room",
      rateMode: formData.rateMode || "Per Room",
      roomTypeID: parseOptionalInt(formData.roomTypeID) ?? 0,
      primaryOccupancy: parseOptionalInt(formData.primaryOccupancy) ?? 1,
      increaseBy: parseOptionalFloat(formData.increaseBy) ?? 0,
      decreaseBy: parseOptionalFloat(formData.decreaseBy) ?? 0,
      hotelID: hotelId ?? 0,
      hotelMaster: {
        hotelID: hotelId ?? 0,
      },
      rateCodeID: parseOptionalInt(formData.rateCodeID) ?? 0,
      rateCode: {
        rateCodeID: parseOptionalInt(formData.rateCodeID) ?? 0,
        rateCode: formData.rateCode || "",
      },
      title: finalTitle,
      hotelRoomType: {
        hotelRoomTypeID: parseOptionalInt(formData.roomTypeID) ?? 0,
        hotelID: hotelId ?? 0,
        roomType: selectedRoom?.roomType || "",
        adultSpace: selectedRoom?.maxAdult || 0,
        childSpace: selectedRoom?.maxChild || 0,
      },
      mealPlanID: parseOptionalInt(formData.mealPlanID) ?? 0,
      mealPlanMaster: {
        basisID: parseOptionalInt(formData.mealPlanID) ?? 0,
        basis: selectedMealPlanName,
      },
      currencyCode: formData.currencyCode || "USD",
      childRate: parseOptionalFloat(formData.childrenFee) ?? 0,
      createdOn: new Date().toISOString(),
      createdBy: "system",
      hotelRates: [],
      cmid: "string",
    };

    // Set pax rates based on sell mode and rate mode
    if (formData.sellMode === "Per Person" && formData.rateMode === "Manual") {
      const maxOccupancy = parseOptionalInt(formData.primaryOccupancy) ?? 1;
      for (let i = 1; i <= maxOccupancy; i++) {
        const rateKey = `rateFor${i}`;
        const userRate = parseOptionalFloat(formData[rateKey]) ?? 0;
        (payload as any)[`pax${i}`] = userRate;
      }
      // Set defaultRate to the max occupancy rate for Manual mode
      const maxRateKey = `rateFor${maxOccupancy}`;
      const maxRate = parseOptionalFloat(formData[maxRateKey]);
      if (maxRate !== null) {
        payload.defaultRate = maxRate;
      }
    }

    return payload;
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
          updated = {
            ...updated,
            defaultRate: "", 
          };
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
      const finalFormData = buildRatePlanPayload(formData);
      await onSubmit(finalFormData);
      onClose();
    } catch (err) {
      console.error("Rate plan submission failed:", err);
    } finally {
      setIsSubmitting(false); // Stop loading
    }
  };

  // --- PATCH: Calculate selectedRoom and maxOccupancy for Per Person + Auto mode ---
  const selectedRoom = roomTypes.find(
    (rt) => rt.roomTypeID.toString() === formData.roomTypeID
  );
  const maxOccupancy = selectedRoom?.maxAdult || 1;
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
                  (rt) => rt.roomTypeID.toString() === v
                );
                setFormData((prev) => ({
                  ...prev,
                  roomTypeID: v,
                  primaryOccupancy:
                    selectedRoom?.maxAdult !== null &&
                    selectedRoom?.maxAdult !== undefined
                      ? selectedRoom.maxAdult.toString()
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
                    key={rt.roomTypeID}
                    value={String(rt.roomTypeID)}
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
                  <SelectItem key={mp.basisID} value={String(mp.basisID)}>
                    {mp.basis}
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

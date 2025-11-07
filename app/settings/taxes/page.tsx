"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchHotelTaxByHotelId,
  resetHotelTaxByHotelIdState,
} from "@/redux/slices/hotelTaxByHotelIdSlice";
import {
  updateHotelTax,
  resetUpdateHotelTaxState,
} from "@/redux/slices/updateHotelTaxSlice";

import { DashboardLayout } from "@/components/dashboard-layout";
import { createHotelTax } from "@/redux/slices/hotelTaxSlice";
import { log } from "node:console";

export default function TaxesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [selectedProperty, setSelectedProperty] = useState<any>({});

  useEffect(() => {
    const stored = localStorage.getItem("selectedProperty");
    if (stored) {
      setSelectedProperty(JSON.parse(stored));
    }
  }, []);

  const hotelId = selectedProperty?.id;

  const { loading: updateLoading, error: updateError } = useSelector(
    (state: RootState) => state.updateHotelTax
  );

  const { data: fetchedTaxes, loading } = useSelector(
    (state: RootState) => state.hotelTaxByHotelId
  );

  console.log("hotel id", hotelId);
  console.log("fetched taxes", fetchedTaxes);

  const [editMode, setEditMode] = useState(true); // editable if no data
  const [hasInitialData, setHasInitialData] = useState(false); // determine if it's new or existing

  const tax = fetchedTaxes[0];
  console.log("tax", tax);

  const [formData, setFormData] = useState({
    serviceCharge: "",
    tdl: "",
    sscl: "",
    vat: "",
  });

  console.log("form data", tax);

  useEffect(() => {
    dispatch(fetchHotelTaxByHotelId(hotelId));

    return () => {
      dispatch(resetHotelTaxByHotelIdState());
      dispatch(resetUpdateHotelTaxState());
    };
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (tax) {
      setFormData({
        serviceCharge: tax.serviceCharge.toString(),
        tdl: tax.tdl.toString(),
        sscl: tax.sscl.toString(),
        vat: tax.vat.toString(),
      });
      setEditMode(false);
      setHasInitialData(true);
    } else {
      setEditMode(true);
      setHasInitialData(false);
      setFormData({
        serviceCharge: "0",
        tdl: "0",
        sscl: "0",
        vat: "0",
      });
    }
  }, [tax]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (hasInitialData && tax?.hotelTaxId) {
      // UPDATE existing
      await dispatch(
        updateHotelTax({
          id: tax.hotelTaxId,
          serviceCharge: Number(formData.serviceCharge),
          tdl: Number(formData.tdl),
          sscl: Number(formData.sscl),
          vat: Number(formData.vat),
        })
      );
      console.log("Updating tax:", {
        id: tax.hotelTaxId,
        values: {
          serviceCharge: Number(formData.serviceCharge),
          tdl: Number(formData.tdl),
          sscl: Number(formData.sscl),
          vat: Number(formData.vat),
        },
      });
    } else {
      await dispatch(
        createHotelTax({
          hotelId,
          serviceCharge: Number(formData.serviceCharge),
          tdl: Number(formData.tdl),
          sscl: Number(formData.sscl),
          vat: Number(formData.vat),
        })
      );
    }

    // Refresh and lock fields
    await dispatch(fetchHotelTaxByHotelId(hotelId));
    setEditMode(false);
  };

  const handleCancel = () => {
    if (tax) {
      setFormData({
        serviceCharge: tax.serviceCharge.toString(),
        tdl: tax.tdl.toString(),
        sscl: tax.sscl.toString(),
        vat: tax.vat.toString(),
      });
      setEditMode(false);
    }
  };

  const taxFields = [
    { key: "serviceCharge", label: "Service Charge (%)" },
    { key: "tdl", label: "TDL (%)" },
    { key: "sscl", label: "SSCL (%)" },
    { key: "vat", label: "VAT (%)" },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Hotel Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxFields.map(({ key, label }) => (
              <div key={key}>
                <Label className="mb-1 block">{label}</Label>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="pr-8"
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        handleInputChange(key, val);
                        return;
                      }
                      if (/^\d{0,3}(\.\d{0,2})?$/.test(val)) {
                        const num = parseFloat(val);
                        if (num <= 100) {
                          handleInputChange(key, val);
                        }
                      }
                    }}
                    disabled={!editMode}
                    placeholder={`Enter ${label}`}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            ))}

            <div className="col-span-full mt-4 flex gap-4">
              {!editMode ? (
                <Button onClick={() => setEditMode(true)}>Edit</Button>
              ) : (
                <>
                  <Button onClick={handleSave}>Save</Button>
                  {hasInitialData && (
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        {updateError && (
          <p className="text-red-500 text-sm">Update failed: {updateError}</p>
        )}
      </div>
    </DashboardLayout>
  );
}

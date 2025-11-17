// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "@/redux/store";

import {
  updateNameMas,
  resetUpdateState,
} from "@/redux/slices/updateNameMasSlice";

export type TravelAgentForEdit = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  code?: string;
  vatNo?: string;
  customerType?: string;
  cpForDelivery?: string;
  isAllowCredit?: boolean;
  isFullPaymentNeededForCheckIn?: boolean;
  nameID?: string | number;
  nameType?: string;
  finAct?: boolean;
  creditLimit?: number;
  companyName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  tranCode?: string;
};

export type EditTravelAgentValues = {
  name: string;
  email: string;
  phone: string;
  code: string;
  vatNo: string;
  customerType: string;
  cpForDelivery: string;
  isAllowCredit: boolean;
  isFullPaymentNeededForCheckIn: boolean;
  finAct: boolean;
  creditLimit: number;
  companyName: string;
  address1: string;
  address2: string;
  city: string;
  tranCode: string;
};

type EditTravelAgentDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  agent: TravelAgentForEdit | null;
  onUpdated?: () => void; // parent can refresh list
};

const emptyValues: EditTravelAgentValues = {
  name: "",
  email: "",
  phone: "",
  code: "",
  vatNo: "",
  customerType: "",
  cpForDelivery: "",
  isAllowCredit: false,
  isFullPaymentNeededForCheckIn: false,
  finAct: false,
  creditLimit: 0,
  companyName: "",
  address1: "",
  address2: "",
  city: "",
  tranCode: "",
};

export default function EditTravelAgentDrawer({
  isOpen,
  onClose,
  agent,
  onUpdated,
}: EditTravelAgentDrawerProps) {
  const dispatch = useDispatch<AppDispatch>()
  
  ;

  const [values, setValues] = useState<EditTravelAgentValues>(emptyValues);

  const updateState = useSelector((state: RootState) => state.updateNameMas);
  const updating = updateState.loading;

  // Load agent data into form when drawer opens / agent changes
  useEffect(() => {
    if (isOpen && agent) {
      setValues({
        name: agent.name || "",
        email: agent.email || "",
        phone: agent.phone || "",
        code: agent.code || "",
        vatNo: agent.vatNo || "",
        customerType: agent.customerType || "",
        cpForDelivery: agent.cpForDelivery || "",
        isAllowCredit: agent.isAllowCredit ?? false,
        isFullPaymentNeededForCheckIn:
          agent.isFullPaymentNeededForCheckIn ?? false,
        finAct: agent.finAct ?? false,
        creditLimit: agent.creditLimit || 0,
        companyName: agent.companyName || "",
        address1: agent.address1 || "",
        address2: agent.address2 || "",
        city: agent.city || "",
        tranCode: agent.tranCode || "",
      });
    }
    if (!isOpen) {
      setValues(emptyValues);
    }
  }, [isOpen, agent]);

  // Handle update success / error
  useEffect(() => {
    if (updateState.success) {
      toast.success("Agent updated successfully");
      dispatch(resetUpdateState());
      onUpdated?.();
      onClose();
    }

    if (updateState.error) {
      toast.error(`Update failed: ${updateState.error}`);
      dispatch(resetUpdateState());
    }
  }, [updateState.success, updateState.error, dispatch, onClose, onUpdated]);

  const handleInputChange = (
    field: keyof EditTravelAgentValues,
    value: string | number | boolean
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!agent?.nameID) return;

    const payload = {
      nameMas: {
        nameID: Number(agent.nameID),
        finAct: values.finAct,
        nameType: agent.nameType || "AGENT",
        code: values.code,
        name: values.name,
        companyName: values.companyName,
        title: "",
        firstName: "",
        lastName: "",
        email: values.email,
        phone: values.phone,
        fax: "",
        customerType: values.customerType,
        priceGroupID: 0,
        discount: 0,
        vatNo: values.vatNo,
        creditLimit: values.creditLimit,
        createdOn: new Date().toISOString(),
        createdBy: "Web",
        lastModOn: new Date().toISOString(),
        lastModBy: "Web",
        nic: "",
        warehouseID: 0,
        cpForDelivery: values.cpForDelivery,
        cpForDeliveryPhone: "",
        cpForPayments: "",
        cpForPaymentPhone: "",
        creditPeriod: 0,
        buid: 0,
        address1: values.address1,
        address2: values.address2,
        address3: "",
        city: values.city,
        countryID: 0,
        customerMasterType: "",
        repID: 0,
        purPriceGroupID: 0,
        epfNo: "",
        initials: "",
        gender: "",
        dob: null,
        nationality: "",
        maritalStatus: "",
        passportNo: "",
        jobCategoryID: 0,
        designationID: 0,
        agencyID: 0,
        quotaID: 0,
        insurance: 0,
        wpCategoryID: 0,
        wpNo: 0,
        siteCategoryID: 0,
        basicSalary: 0,
        allowance1: 0,
        allowance2: 0,
        allowance3: 0,
        dateOfJoined: null,
        dateOfPermanent: null,
        dateOfResigned: null,
        empPicturePath: "",
        pin: 0,
        perDaySalary: false,
        priceGroupApproved: false,
        currencyID: 0,
        distance: 0,
        mobileNo: "",
        shortCode: "",
        notes: "",
        bankAccNo: "",
        bankName: "",
        nAmeOnCheque: "",
        phoneRes: "",
        opBal: 0,
        opBalAsAt: null,
        routeID: 0,
        joinedDate: null,
        isAllowCredit: values.isAllowCredit,
        cmTaxRate: 0,
        cmChannelID: "",
        isFullPaymentNeededForCheckIn:
          values.isFullPaymentNeededForCheckIn,
        isResigned: false,
        departmentID: 0,
        empCategoryID: 0,
        serviceChargePercentage: 0,
        tranCode: values.tranCode || "DEFAULT",
      },
    };

    try {
      await dispatch(
        updateNameMas({
          nameID: Number(agent.nameID),
          payload,
        })
      ).unwrap();
    } catch (err) {
      console.error("Failed to update agent:", err);
      // error toast comes from useEffect
    }
  };

  const isSaveDisabled =
    !agent?.nameID || !values.name.trim() || !values.code.trim() || updating;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modal={false}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-l-2xl p-0 z-[100]"
      >
        <SheetHeader className="px-5 pt-5">
          <div className="flex items-center justify-between">
            <SheetTitle>Edit Travel Agent</SheetTitle>
          </div>
          <Separator className="mt-3" />
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-4rem)] px-5 pb-5 pt-3">
          <div className="space-y-4">
            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              <div>
                <Label htmlFor="name">Agent Name </Label>
                <Input
                  id="name"
                  value={values.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              <div>
                <Label htmlFor="code">Agent Code </Label>
                <Input
                  id="code"
                  value={values.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder="Enter agent code"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={values.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="customerType">Agent Type</Label>
                <Input
                  id="customerType"
                  value={values.customerType}
                  onChange={(e) =>
                    handleInputChange("customerType", e.target.value)
                  }
                  placeholder="Enter agent type"
                />
              </div>
              <div>
                <Label htmlFor="cpForDelivery">Contact Person</Label>
                <Input
                  id="cpForDelivery"
                  value={values.cpForDelivery}
                  onChange={(e) =>
                    handleInputChange("cpForDelivery", e.target.value)
                  }
                  placeholder="Enter contact person"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={values.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="vatNo">VAT No</Label>
                <Input
                  id="vatNo"
                  value={values.vatNo}
                  onChange={(e) =>
                    handleInputChange("vatNo", e.target.value)
                  }
                  placeholder="Enter VAT number"
                />
              </div>
              <div>
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={values.creditLimit}
                  onChange={(e) =>
                    handleInputChange(
                      "creditLimit",
                      Number(e.target.value) || 0
                    )
                  }
                  placeholder="Enter credit limit"
                />
              </div>
              <div>
                <Label htmlFor="tranCode">Transaction Code</Label>
                <Input
                  id="tranCode"
                  value={values.tranCode}
                  onChange={(e) =>
                    handleInputChange("tranCode", e.target.value)
                  }
                  placeholder="Enter transaction code"
                />
              </div>
              <div>
                <Label htmlFor="address1">Address (No)</Label>
                <Input
                  id="address1"
                  value={values.address1}
                  onChange={(e) =>
                    handleInputChange("address1", e.target.value)
                  }
                  placeholder="Enter address number"
                />
              </div>
              <div>
                <Label htmlFor="address2">Address (Street)</Label>
                <Input
                  id="address2"
                  value={values.address2}
                  onChange={(e) =>
                    handleInputChange("address2", e.target.value)
                  }
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={values.city}
                  onChange={(e) =>
                    handleInputChange("city", e.target.value)
                  }
                  placeholder="Enter city"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAllowCredit"
                  checked={values.isAllowCredit}
                  onCheckedChange={(checked) =>
                    handleInputChange("isAllowCredit", checked)
                  }
                />
                <Label htmlFor="isAllowCredit">Allow Credit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isFullPaymentNeededForCheckIn"
                  checked={values.isFullPaymentNeededForCheckIn}
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "isFullPaymentNeededForCheckIn",
                      checked
                    )
                  }
                />
                <Label htmlFor="isFullPaymentNeededForCheckIn">
                  Full Payment Needed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="finAct"
                  checked={!values.finAct}
                  onCheckedChange={(checked) =>
                    handleInputChange("finAct", !checked)
                  }
                />
                <Label htmlFor="finAct">Active</Label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaveDisabled}>
                {updating ? "Saving…" : "Update Agent"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
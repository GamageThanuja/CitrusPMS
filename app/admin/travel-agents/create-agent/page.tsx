"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";

// Redux slices
import {
  createNameMas,
  selectCreateNameMasLoading,
  selectCreateNameMasError,
} from "@/redux/slices/createNameMasSlice";

import {
  updateNameMas,
} from "@/redux/slices/updateNameMasSlice";

import {
  fetchNameMas,
  selectFetchNameMasItems,
} from "@/redux/slices/fetchNameMasSlice";

interface AgentForm {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  cpForDelivery: string;
  code: string;
  companyName: string;
  creditLimit: number;
  isAllowCredit: boolean;
  isFullPaymentNeededForCheckIn: boolean;
  vatNo: string;
  finAct: boolean;
  nameType: string;
  customerType: string;
}

export default function CreateAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<any>();
  
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  // Redux selectors
  const creating = useSelector(selectCreateNameMasLoading);
  const createError = useSelector(selectCreateNameMasError);
  const nameMasterList = useSelector(selectFetchNameMasItems) || [];

  const [formData, setFormData] = useState<AgentForm>({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    cpForDelivery: "",
    code: "",
    companyName: "",
    creditLimit: 0,
    isAllowCredit: true,
    isFullPaymentNeededForCheckIn: false,
    vatNo: "",
    finAct: false,
    nameType: "AGENT",
    customerType: "",
  });

  // Find the agent to edit if in edit mode
  useEffect(() => {
    if (isEditMode && editId && nameMasterList.length > 0) {
      const agentToEdit = nameMasterList.find((agent: any) => 
        String(agent.nameID) === editId
      );
      
      if (agentToEdit) {
        setFormData({
          name: agentToEdit.name || "",
          email: agentToEdit.email || "",
          phone: agentToEdit.phone || "",
          address1: agentToEdit.address1 || "",
          address2: agentToEdit.address2 || "",
          city: agentToEdit.city || "",
          cpForDelivery: agentToEdit.cpForDelivery || "",
          code: agentToEdit.code || "",
          companyName: agentToEdit.companyName || "",
          creditLimit: agentToEdit.creditLimit || 0,
          isAllowCredit: agentToEdit.isAllowCredit ?? true,
          isFullPaymentNeededForCheckIn: agentToEdit.isFullPaymentNeededForCheckIn ?? false,
          vatNo: agentToEdit.vatNo || "",
          finAct: agentToEdit.finAct ?? false,
          nameType: agentToEdit.nameType || "AGENT",
          customerType: agentToEdit.customerType || "",
        });
      }
    }
  }, [isEditMode, editId, nameMasterList]);

  // Handle form input changes
  const handleInputChange = (field: keyof AgentForm, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (field: keyof AgentForm, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  // Reset form after successful creation
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      cpForDelivery: "",
      code: "",
      companyName: "",
      creditLimit: 0,
      isAllowCredit: true,
      isFullPaymentNeededForCheckIn: false,
      vatNo: "",
      finAct: false,
      nameType: "AGENT",
      customerType: "",
    });
  };

  // Base field generator for NameMasPayload
  const getBaseFields = (data: any = {}, mode: "create" | "update" = "create") => {
    const now = new Date().toISOString();

    return {
      nameID: data?.nameID || 0,
      companyName: data?.companyName || "",
      title: data?.title || "",
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      email: data?.email || "",
      phone: data?.phone || "",
      fax: data?.fax || "",
      customerType: data?.customerType || "",
      priceGroupID: data?.priceGroupID || 0,
      discount: data?.discount || 0,
      vatNo: data?.vatNo || "",
      creditLimit: data?.creditLimit || 0,
      createdOn: mode === "create" ? now : data?.createdOn || now,
      createdBy: mode === "create" ? "Web" : data?.createdBy || "Web",
      lastModOn: now,
      lastModBy: "Web",
      nic: data?.nic || "",
      warehouseID: data?.warehouseID || 0,
      cpForDelivery: data?.cpForDelivery || "",
      cpForDeliveryPhone: data?.cpForDeliveryPhone || "",
      cpForPayments: data?.cpForPayments || "",
      cpForPaymentPhone: data?.cpForPaymentPhone || "",
      creditPeriod: data?.creditPeriod || 0,
      buid: data?.buid || 0,
      address1: data?.address1 || "",
      address2: data?.address2 || "",
      address3: data?.address3 || "",
      city: data?.city || "",
      countryID: data?.countryID || 0,
      customerMasterType: data?.customerMasterType || "",
      repID: data?.repID || 0,
      purPriceGroupID: data?.purPriceGroupID || 0,
      epfNo: data?.epfNo || "",
      initials: data?.initials || "",
      gender: data?.gender || "",
      dob: data?.dob || now,
      nationality: data?.nationality || "",
      maritalStatus: data?.maritalStatus || "",
      passportNo: data?.passportNo || "",
      jobCategoryID: data?.jobCategoryID || 0,
      designationID: data?.designationID || 0,
      agencyID: data?.agencyID || 0,
      quotaID: data?.quotaID || 0,
      insurance: data?.insurance || 0,
      wpCategoryID: data?.wpCategoryID || 0,
      wpNo: data?.wpNo || 0,
      siteCategoryID: data?.siteCategoryID || 0,
      basicSalary: data?.basicSalary || 0,
      allowance1: data?.allowance1 || 0,
      allowance2: data?.allowance2 || 0,
      allowance3: data?.allowance3 || 0,
      dateOfJoined: data?.dateOfJoined || now,
      dateOfPermanent: data?.dateOfPermanent || now,
      dateOfResigned: data?.dateOfResigned || now,
      empPicturePath: data?.empPicturePath || "",
      pin: data?.pin || 0,
      perDaySalary: data?.perDaySalary || false,
      priceGroupApproved: data?.priceGroupApproved || false,
      currencyID: data?.currencyID || 0,
      distance: data?.distance || 0,
      mobileNo: data?.mobileNo || "",
      shortCode: data?.shortCode || "",
      notes: data?.notes || "",
      bankAccNo: data?.bankAccNo || "",
      bankName: data?.bankName || "",
      nAmeOnCheque: data?.nAmeOnCheque || "",
      phoneRes: data?.phoneRes || "",
      opBal: data?.opBal || 0,
      opBalAsAt: data?.opBalAsAt || now,
      routeID: data?.routeID || 0,
      joinedDate: data?.joinedDate || now,
      isAllowCredit: data?.isAllowCredit ?? true,
      cmTaxRate: data?.cmTaxRate || 0,
      cmChannelID: data?.cmChannelID || "",
      isFullPaymentNeededForCheckIn: data?.isFullPaymentNeededForCheckIn ?? false,
      isResigned: data?.isResigned ?? false,
      departmentID: data?.departmentID || 0,
      empCategoryID: data?.empCategoryID || 0,
      serviceChargePercentage: data?.serviceChargePercentage || 0,
      tranCode: data?.tranCode || "",
    };
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Agent Name is required");
      return;
    }

    try {
      const baseFields = getBaseFields(formData, isEditMode ? "update" : "create");
      const payload = {
        ...baseFields,
        name: formData.name || "",
        code: formData.code || "",
        nameType: formData.nameType || "AGENT",
        finAct: formData.finAct,
        phone: formData.phone || "",
        email: formData.email || "",
        address1: formData.address1 || "",
        address2: formData.address2 || "",
        city: formData.city || "",
        cpForDelivery: formData.cpForDelivery || "",
        companyName: formData.companyName || "",
        creditLimit: formData.creditLimit || 0,
        isAllowCredit: formData.isAllowCredit,
        isFullPaymentNeededForCheckIn: formData.isFullPaymentNeededForCheckIn,
        vatNo: formData.vatNo || "",
        customerType: formData.customerType || "",
      };

      if (isEditMode && editId) {
        // Update existing agent
        await dispatch(updateNameMas({ 
          nameID: Number(editId), 
          payload: { ...payload, nameID: Number(editId) } 
        })).unwrap();
        toast.success("Agent updated successfully");
        
        // Refresh the agents list
        await dispatch(fetchNameMas({ nameType: "AGENT" }));
      } else {
        // Create new agent
        await dispatch(createNameMas(payload)).unwrap();
        toast.success("Agent created successfully");
        
        // Refresh the agents list and reset form
        await dispatch(fetchNameMas({ nameType: "AGENT" }));
        resetForm();
      }
      
    } catch (error) {
      console.error(`${isEditMode ? "Update" : "Create"} failed:`, error);
      toast.error(`Failed to ${isEditMode ? "update" : "create"} agent`);
    }
  };

  const handleCancel = () => {
    router.push("/agent-list");
  };

  const isLoading = creating;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Agent" : "Create Agent"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? "Update agent information" 
                : "Add a new agent to the system"
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading 
                ? (isEditMode ? "Updating..." : "Creating...") 
                : (isEditMode ? "Update Agent" : "Create Agent")
              }
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {createError && (
          <div className="text-red-600 border border-red-300 rounded p-3 bg-red-50">
            {createError}
          </div>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core agent details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              <div>
                <Label htmlFor="code">Agent Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder="Enter agent code"
                />
              </div>
              <div>
                <Label htmlFor="customerType">Agent Type</Label>
                <Input
                  id="customerType"
                  value={formData.customerType}
                  onChange={(e) => handleInputChange("customerType", e.target.value)}
                  placeholder="Enter agent type"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="finAct" className="cursor-pointer">
                  This agent is active
                </Label>
                <Switch
                  id="finAct"
                  checked={!formData.finAct}
                  onCheckedChange={(checked) => handleInputChange("finAct", !checked)}
                />
                <span className="text-sm text-gray-600 ml-2">
                  {!formData.finAct ? "Active" : "Inactive"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Agent contact details and communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="cpForDelivery">Contact Person</Label>
                <Input
                  id="cpForDelivery"
                  value={formData.cpForDelivery}
                  onChange={(e) => handleInputChange("cpForDelivery", e.target.value)}
                  placeholder="Enter contact person name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>
                Agent address details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address1">Address (No)</Label>
                <Input
                  id="address1"
                  value={formData.address1}
                  onChange={(e) => handleInputChange("address1", e.target.value)}
                  placeholder="Enter address number/street"
                />
              </div>
              <div>
                <Label htmlFor="address2">Address (Street)</Label>
                <Input
                  id="address2"
                  value={formData.address2}
                  onChange={(e) => handleInputChange("address2", e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>
                Agent financial settings and limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleInputChange("creditLimit", Number(e.target.value))}
                  placeholder="Enter credit limit"
                />
              </div>
              <div>
                <Label htmlFor="vatNo">VAT/TIN No</Label>
                <Input
                  id="vatNo"
                  value={formData.vatNo}
                  onChange={(e) => handleInputChange("vatNo", e.target.value)}
                  placeholder="Enter VAT/TIN number"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isAllowCredit" className="cursor-pointer">
                  Allow Credit
                </Label>
                <Switch
                  id="isAllowCredit"
                  checked={formData.isAllowCredit}
                  onCheckedChange={(checked) => handleSwitchChange("isAllowCredit", checked)}
                />
                <span className="text-sm text-gray-600 ml-2">
                  {formData.isAllowCredit ? "Allowed" : "Not Allowed"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isFullPaymentNeededForCheckIn" className="cursor-pointer">
                  Full Payment Needed for Check-in
                </Label>
                <Switch
                  id="isFullPaymentNeededForCheckIn"
                  checked={formData.isFullPaymentNeededForCheckIn}
                  onCheckedChange={(checked) => handleSwitchChange("isFullPaymentNeededForCheckIn", checked)}
                />
                <span className="text-sm text-gray-600 ml-2">
                  {formData.isFullPaymentNeededForCheckIn ? "Required" : "Not Required"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
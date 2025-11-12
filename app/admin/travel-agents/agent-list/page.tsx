"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Plus, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

// Redux slices
import {
  fetchNameMas,
  selectFetchNameMasItems,
  selectFetchNameMasLoading,
  selectFetchNameMasError,
} from "@/redux/slices/fetchNameMasSlice";

import {
  updateNameMas,
  resetUpdateState,
} from "@/redux/slices/updateNameMasSlice";

interface TravelAgent {
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
}

interface EditAgentForm {
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
}

export default function TravelAgentsListPage() {
  const router = useRouter();
  const dispatch = useDispatch<any>();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingAgent, setEditingAgent] = useState<TravelAgent | null>(null);
  const [editForm, setEditForm] = useState<EditAgentForm>({
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
  });

  // NameMaster slice (list)
  const nameMasterList = useSelector(selectFetchNameMasItems) || [];
  const loading = useSelector(selectFetchNameMasLoading);
  const error = useSelector(selectFetchNameMasError);

  // Update slice states
  const updateState = useSelector((state: any) => state.updateNameMas);

  // Fetch agents
  useEffect(() => {
    dispatch(fetchNameMas({ nameType: "AGENT" }));
  }, [dispatch]);

  // Handle update success/error
  useEffect(() => {
    if (updateState.success) {
      toast.success("Agent updated successfully");
      dispatch(resetUpdateState());
      setEditingAgent(null);
      // Refresh the list
      dispatch(fetchNameMas({ nameType: "AGENT" }));
    }
    
    if (updateState.error) {
      toast.error(`Update failed: ${updateState.error}`);
      dispatch(resetUpdateState());
    }
  }, [updateState.success, updateState.error, dispatch]);

  // Normalize agents to the shape your UI needs
  const agentsData: TravelAgent[] = useMemo(() => {
    return nameMasterList
      .filter((n: any) => {
        const t = String(n?.nameType || "").toLowerCase();
        return (t === "customer" || t === "agent");
      })
      .sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      )
      .map((n: any) => ({
        id: String(n.nameID),
        name: n.name?.trim() || n.code || `#${n.nameID}`,
        email: n.email || "",
        phone: n.phone || "",
        code: n.code || "",
        vatNo: n.vatNo || "",
        customerType: n.customerType || "",
        cpForDelivery: n.cpForDelivery || "",
        isAllowCredit: n.isAllowCredit ?? false,
        isFullPaymentNeededForCheckIn: n.isFullPaymentNeededForCheckIn ?? false,
        nameID: n.nameID,
        nameType: n.nameType,
        finAct: n.finAct ?? false,
        creditLimit: n.creditLimit || 0,
        companyName: n.companyName || "",
        address1: n.address1 || "",
        address2: n.address2 || "",
        city: n.city || "",
        tranCode: n.tranCode || "",
      }));
  }, [nameMasterList]);

  // Filter by search
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return agentsData.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.phone && a.phone.toLowerCase().includes(q)) ||
        (a.customerType && a.customerType.toLowerCase().includes(q)) ||
        (a.cpForDelivery && a.cpForDelivery.toLowerCase().includes(q)) ||
        (a.vatNo && a.vatNo.toLowerCase().includes(q))
    );
  }, [agentsData, searchQuery]);

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(1);
  }, [searchQuery, pageSize]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const handlePrev = () => canPrev && setPageIndex((p) => p - 1);
  const handleNext = () => canNext && setPageIndex((p) => p + 1);
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value) || 10);
    setPageIndex(1);
  };

  const paginated = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, pageIndex, pageSize]);

  const handleCreate = () => {
    router.push("/admin/travel-agents/create-agent");
  };

  // Open edit modal
  const handleEdit = (agent: TravelAgent) => {
    setEditingAgent(agent);
    setEditForm({
      name: agent.name || "",
      email: agent.email || "",
      phone: agent.phone || "",
      code: agent.code || "",
      vatNo: agent.vatNo || "",
      customerType: agent.customerType || "",
      cpForDelivery: agent.cpForDelivery || "",
      isAllowCredit: agent.isAllowCredit ?? false,
      isFullPaymentNeededForCheckIn: agent.isFullPaymentNeededForCheckIn ?? false,
      finAct: agent.finAct ?? false,
      creditLimit: agent.creditLimit || 0,
      companyName: agent.companyName || "",
      address1: agent.address1 || "",
      address2: agent.address2 || "",
      city: agent.city || "",
      tranCode: agent.tranCode || "",
    });
  };

  // Close edit modal
  const handleCloseEdit = () => {
    setEditingAgent(null);
    setEditForm({
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
    });
  };

  // Handle form input changes
  const handleInputChange = (field: keyof EditAgentForm, value: string | number | boolean) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Submit update
  const handleUpdate = async () => {
    if (!editingAgent?.nameID) return;

    try {
      const updatePayload = {
        nameMas: {
          nameID: Number(editingAgent.nameID),
          finAct: editForm.finAct,
          nameType: editingAgent.nameType || "AGENT",
          code: editForm.code,
          name: editForm.name,
          companyName: editForm.companyName,
          title: "",
          firstName: "",
          lastName: "",
          email: editForm.email,
          phone: editForm.phone,
          fax: "",
          customerType: editForm.customerType,
          priceGroupID: 0,
          discount: 0,
          vatNo: editForm.vatNo,
          creditLimit: editForm.creditLimit,
          createdOn: new Date().toISOString(),
          createdBy: "Web",
          lastModOn: new Date().toISOString(),
          lastModBy: "Web",
          nic: "",
          warehouseID: 0,
          cpForDelivery: editForm.cpForDelivery,
          cpForDeliveryPhone: "",
          cpForPayments: "",
          cpForPaymentPhone: "",
          creditPeriod: 0,
          buid: 0,
          address1: editForm.address1,
          address2: editForm.address2,
          address3: "",
          city: editForm.city,
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
          isAllowCredit: editForm.isAllowCredit,
          cmTaxRate: 0,
          cmChannelID: "",
          isFullPaymentNeededForCheckIn: editForm.isFullPaymentNeededForCheckIn,
          isResigned: false,
          departmentID: 0,
          empCategoryID: 0,
          serviceChargePercentage: 0,
          tranCode: editForm.tranCode || "DEFAULT", // Added TranCode field with default value
        }
      };

      await dispatch(updateNameMas({
        nameID: Number(editingAgent.nameID),
        payload: updatePayload
      })).unwrap();

    } catch (error) {
      console.error("Failed to update agent:", error);
      toast.error("Failed to update agent");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Travel Agents</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-8"
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-red-600 border border-red-300 rounded p-3 bg-red-50">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[150px]">Type</TableHead>
                <TableHead className="w-[120px]">Phone No</TableHead>
                <TableHead className="w-[200px]">Email</TableHead>
                <TableHead className="w-[120px]">VAT No</TableHead>
                <TableHead className="w-[150px]">Cont Person</TableHead>
                <TableHead className="w-[120px]">Allow Credit</TableHead>
                <TableHead className="w-[120px]">Full Pmt Needed</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-6 text-center">
                    Loading agents...
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {agent.code || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {agent.name}
                    </TableCell>
                    <TableCell>
                      {agent.customerType || agent.nameType || "-"}
                    </TableCell>
                    <TableCell>{agent.phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {agent.email || "-"}
                    </TableCell>
                    <TableCell>{agent.vatNo || "-"}</TableCell>
                    <TableCell>{agent.cpForDelivery || "-"}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={agent.isAllowCredit ? "default" : "secondary"}
                        className={agent.isAllowCredit ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}
                      >
                        {agent.isAllowCredit ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={agent.isFullPaymentNeededForCheckIn ? "default" : "secondary"}
                        className={agent.isFullPaymentNeededForCheckIn ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}
                      >
                        {agent.isFullPaymentNeededForCheckIn ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={!agent.finAct ? "default" : "secondary"}
                        className={!agent.finAct ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}
                      >
                        {!agent.finAct ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(agent)}
                        disabled={updateState.loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No travel agents found.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {filtered.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
            <div className="hidden sm:block" />
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="px-3 py-1 rounded bg-black text-white text-sm">
                  {pageIndex} / {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={!canNext}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-600">
                  Rows per page:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="px-2 py-1 text-sm border rounded bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Edit Agent</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Agent Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter agent name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Agent Code</Label>
                    <Input
                      id="code"
                      value={editForm.code}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      placeholder="Enter agent code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerType">Agent Type</Label>
                    <Input
                      id="customerType"
                      value={editForm.customerType}
                      onChange={(e) => handleInputChange("customerType", e.target.value)}
                      placeholder="Enter agent type"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpForDelivery">Contact Person</Label>
                    <Input
                      id="cpForDelivery"
                      value={editForm.cpForDelivery}
                      onChange={(e) => handleInputChange("cpForDelivery", e.target.value)}
                      placeholder="Enter contact person"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={editForm.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vatNo">VAT No</Label>
                    <Input
                      id="vatNo"
                      value={editForm.vatNo}
                      onChange={(e) => handleInputChange("vatNo", e.target.value)}
                      placeholder="Enter VAT number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="creditLimit">Credit Limit</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={editForm.creditLimit}
                      onChange={(e) => handleInputChange("creditLimit", Number(e.target.value))}
                      placeholder="Enter credit limit"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tranCode">Transaction Code</Label>
                    <Input
                      id="tranCode"
                      value={editForm.tranCode}
                      onChange={(e) => handleInputChange("tranCode", e.target.value)}
                      placeholder="Enter transaction code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address1">Address (No)</Label>
                    <Input
                      id="address1"
                      value={editForm.address1}
                      onChange={(e) => handleInputChange("address1", e.target.value)}
                      placeholder="Enter address number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address2">Address (Street)</Label>
                    <Input
                      id="address2"
                      value={editForm.address2}
                      onChange={(e) => handleInputChange("address2", e.target.value)}
                      placeholder="Enter street address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAllowCredit"
                      checked={editForm.isAllowCredit}
                      onCheckedChange={(checked) => handleInputChange("isAllowCredit", checked)}
                    />
                    <Label htmlFor="isAllowCredit">Allow Credit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFullPaymentNeededForCheckIn"
                      checked={editForm.isFullPaymentNeededForCheckIn}
                      onCheckedChange={(checked) => handleInputChange("isFullPaymentNeededForCheckIn", checked)}
                    />
                    <Label htmlFor="isFullPaymentNeededForCheckIn">Full Payment Needed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="finAct"
                      checked={!editForm.finAct}
                      onCheckedChange={(checked) => handleInputChange("finAct", !checked)}
                    />
                    <Label htmlFor="finAct">Active</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-6 border-t">
                <Button variant="outline" onClick={handleCloseEdit}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdate} 
                  disabled={updateState.loading}
                >
                  {updateState.loading ? "Updating..." : "Update Agent"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
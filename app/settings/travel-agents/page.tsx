"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit, ChartNoAxesCombined, Plus, Search } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslatedText } from "@/lib/translation";
import { AddTravelAgentDrawer } from "@/components/drawers/add-travel-agent-drawer";
import { EditTravelAgentDrawer } from "@/components/drawers/edit-travel-agent-drawer";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useDispatch, useSelector } from "react-redux";

// ⬇️ Redux slices
import {
  fetchPerformanceByAgent,
  selectPerformanceByAgent,
} from "@/redux/slices/performanceByAgentSlice";

// import { fetchNameMasterByHotel } from "@/redux/slices/nameMasterSlice"; // your fetch slice (already provided)

// import { createNameMaster } from "@/redux/slices/createNameMasterSlice"; // your POST slice (you showed it)
import {
  createNameMas,
  selectCreateNameMasLoading,
  selectCreateNameMasError,
  selectCreateNameMasSuccess,
} from "@/redux/slices/createNameMasSlice";


// import { updateNameMaster } from "@/redux/slices/updateNameMasterSlice"; // the PUT slice from the previous answer
import { updateNameMas } from "@/redux/slices/updateNameMasSlice";

import {
  fetchNameMas,
  selectFetchNameMasItems,
  selectFetchNameMasLoading,
  selectFetchNameMasError,
} from "@/redux/slices/fetchNameMasSlice";

type RootState = any; 
interface TravelAgent {
  id?: string;
  name: string;
  email?: string;
  phoneNo?: string;
  commission?: string | number;
  code?: string;
  address?: string;
  vatNo?: string;
  finAct?: boolean;
  status?: string;
  nameID?: string | number;
  hotelID?: string | number;
  hotelCode?: string | number;
  tranCode?: string;
  taType?: string;
  Type?: string;
  nameType?: string;
}

function StatisticsPieChart({
  agentPerformanceData,
  viewMode,
}: {
  agentPerformanceData: any[];
  viewMode: "Revenue" | "Room Nights";
}) {
  const data = agentPerformanceData.map((agent) => ({
    name: agent.name,
    value: viewMode === "Revenue" ? agent.revenue : agent.roomNights,
  }));

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalValue = data.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="w-full flex flex-col md:flex-row items-center gap-6">
      <div className="flex-1">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-shrink-0">
        <div className="flex flex-col gap-1 mt-2">
          {data.map((entry, index) => {
            const percentage =
              totalValue > 0
                ? ((entry.value / totalValue) * 100).toFixed(0)
                : 0;
            return (
              <div
                key={index}
                className="flex items-center justify-between min-w-[320px]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{entry.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-right w-16">
                    {entry.value?.toLocaleString?.() ?? entry.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatisticsPanel({
  agentPerformanceData,
}: {
  agentPerformanceData: any[];
}) {
  const [viewMode, setViewMode] = useState<"Revenue" | "Room Nights">(
    "Revenue"
  );
  return (
    <div className="p-4 border rounded-md bg-card text-card-foreground min-h-[330px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Travel Agent Performance</h2>
        <label className="themeSwitcherTwo shadow-card relative inline-flex cursor-pointer select-none items-center justify-center rounded-md bg-white dark:bg-muted p-1">
          <input
            type="checkbox"
            className="sr-only"
            checked={viewMode === "Room Nights"}
            onChange={() =>
              setViewMode((prev) =>
                prev === "Revenue" ? "Room Nights" : "Revenue"
              )
            }
          />
          <span
            className={`flex items-center space-x-[6px] rounded py-2 px-[18px] text-sm font-medium ${
              viewMode === "Revenue"
                ? "text-primary bg-[#f4f7ff] dark:bg-background"
                : "text-muted-foreground"
            }`}
          >
            Revenue
          </span>
          <span
            className={`flex items-center space-x-[6px] rounded py-2 px-[18px] text-sm font-medium ${
              viewMode === "Room Nights"
                ? "text-primary bg-[#f4f7ff] dark:bg-background"
                : "text-muted-foreground"
            }`}
          >
            Room Nights
          </span>
        </label>
      </div>
      <StatisticsPieChart
        agentPerformanceData={agentPerformanceData}
        viewMode={viewMode}
      />
    </div>
  );
}

export default function TravelAgentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<TravelAgent | null>(null);

  const dispatch = useDispatch<any>();

  const [transactions, setTransactions] = useState<any[]>([]); // Store the fetched data
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  console.log("transactions : ", transactions);

  console.log("transactions : ", transactions);

  // Fetch POS transactions when the component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://cape.citruspms.site/API/POS/Transactions.aspx?POSCenterCode=CAPE`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // AuthKey: "cbe4498c-c342-4eaf-a17e-19329695ab34", // Use the provided AuthKey here
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Log the raw response text for debugging
        const data = await response.json();
        console.log("Fetched transactions:", data); // Verify the response data structure

        if (data && Array.isArray(data)) {
          setTransactions(data); // Set the fetched data only if it's an array
        } else {
          setError("Data format is incorrect.");
        }
      } catch (err) {
        setError(`Failed to fetch data: ${err.message}`); // Handle errors
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions(); // Trigger the fetch
  }, []); // Empty dependency array means this effect runs only once when the component mounts

  // Performance slice
  const { data: agentPerformanceData = [] } = useSelector(
    selectPerformanceByAgent
  );

  // NameMaster slice (list)
  // const nameMasterState = useSelector((state: RootState) => state.nameMaster);
  // const nameMasterList: any[] = Array.isArray(nameMasterState?.data)
  //   ? nameMasterState.data
  //   : [];
  const nameMasterList = useSelector(selectFetchNameMasItems) || [];
const nameMasLoading = useSelector(selectFetchNameMasLoading);
const nameMasError = useSelector(selectFetchNameMasError);


  // i18n texts
  const travelAgentsText = useTranslatedText("Travel Agents");
  const addAgentText = useTranslatedText("Add Agent");
  const searchText = useTranslatedText("Search");
  const noAgentsText = useTranslatedText("No travel agents found");
  const addAgentToGetStartedText = useTranslatedText(
    "Add a travel agent to get started"
  );

  // Fetch agents & performance
  // useEffect(() => {
  //   dispatch(fetchNameMasterByHotel());
  // }, [dispatch]);

  useEffect(() => {
  // Example: fetching all NameMas with nameType = "Agent"
  dispatch(fetchNameMas({ nameType: "AGENT" }));
}, [dispatch]);


  useEffect(() => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    dispatch(fetchPerformanceByAgent({ startDate, endDate }));
  }, [dispatch]);

  // Normalize agents to the shape your UI needs
  const agentsData: TravelAgent[] = useMemo(() => {
    return nameMasterList
      .filter((n: any) => {
        const t = String(n?.nameType || "").toLowerCase();
        // Keep your original filter logic: show Customers/Agents that are "Active" (finAct === false in your data)
        return (t === "customer" || t === "agent") && n?.finAct === false;
      })
      .sort((a: any, b: any) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        })
      )
      .map((n: any) => ({
        id: String(n.nameID), // for list key
        name: n.name?.trim() || n.code || `#${n.nameID}`,
        email: n.email || "",
        phoneNo: n.phoneNo || "",
        commission: n.commissionPercentage ?? "",
        code: n.code || "",
        address: n.address || "",
        vatNo: n.vatNo || "",
        finAct: n.finAct,
        status: n.finAct === false ? "Active" : "Inactive",
        nameID: n.nameID,
        hotelID: n.hotelID,
        hotelCode: n.hotelCode,
        tranCode: n.tranCode,
        taType: n.taType,
        Type: n.nameType,
        nameType: n.nameType,
      }));
  }, [nameMasterList]);

  console.log("agentsData : ", agentsData);

  // Filter by search
  const filteredAgents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return agentsData.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q))
    );
  }, [agentsData, searchQuery]);

  // === Handlers =========================================

// --- Add agent via slice (POST) ---
const handleAddAgent = async (form: any) => {
  try {
    const baseFields = getBaseFields(form, "create");
    const payload = {
      ...baseFields,
      name: form.name || "",
      code: form.code || "",
      nameType: form.Type || "Customer",
      taType: form.taType || "Online Travel Agent",
      finAct: form.status === "Inactive" ? true : false,
      hotelCode: Number(form.hotelCode) || 0,
      phoneNo: form.phoneNo || "",
      email: form.email || "",
      address: form.address || "",
      vatNo: form.vatNo || "",
      commissionPercentage: Number(form.commission) || 0,
    };

    await dispatch(createNameMas(payload)).unwrap();
    await dispatch(fetchNameMas({ nameType: "AGENT" }));
    setIsAddDrawerOpen(false);
  } catch (e) {
    console.error("Create agent failed:", e);
  }
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
    address1: data?.address || "",
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

// --- Edit agent via slice (PUT) ---
const handleEditAgent = async (updatedAgent: any) => {
  try {
    const id = Number(updatedAgent?.nameID ?? updatedAgent?.id);
    const baseFields = getBaseFields(updatedAgent, "update");
    const payload = {
      ...baseFields,
      nameID: id,
      name: updatedAgent.name || "",
      code: updatedAgent.code || "",
      nameType: updatedAgent.Type || updatedAgent.nameType || "Customer",
      taType: updatedAgent.taType || "Online Travel Agent",
      finAct: updatedAgent.status === "Inactive" ? true : false,
      phoneNo: updatedAgent.phoneNo || "",
      email: updatedAgent.email || "",
      address: updatedAgent.address || "",
      vatNo: updatedAgent.vatNo || "",
      commissionPercentage: Number(updatedAgent.commission) || 0,
      tranCode: updatedAgent.tranCode || "",
      hotelCode: Number(updatedAgent.hotelCode) || 0,
    };

    // Add token here
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      "";

    await dispatch(updateNameMas({ nameID: id, payload })).unwrap();
    await dispatch(fetchNameMas({ nameType: "AGENT" }));
    setIsEditDrawerOpen(false);
  } catch (e) {
    console.error("Update agent failed:", e);
  }
};


  // =======================================================

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <StatisticsPanel agentPerformanceData={agentPerformanceData} />
          <div className="p-4 border rounded-md bg-card text-card-foreground mt-4 min-h-[330px]">
            <h2 className="text-xl font-bold mb-4">Agent Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Channel
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Currency
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Revenue
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Reservations
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Room Nights
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agentPerformanceData.map((agent: any, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-xs text-foreground">
                        {agent.name}
                      </td>
                      <td className="px-4 py-2 text-xs text-foreground">
                        {agent.currencyCode || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-xs text-foreground text-right">
                        {agent.revenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-xs text-foreground text-right">
                        {agent.noOfRes}
                      </td>
                      <td className="px-4 py-2 text-xs text-foreground text-right">
                        {agent.roomNights}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <div className="bg-background p-6 rounded-lg shadow-sm border border-border overflow-y-auto max-h-[86vh] scrollbar-hide scrollbar-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={`${searchText}...`}
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddDrawerOpen(true)} className="ml-4">
                <Plus className="mr-2 h-4 w-4" />
                {addAgentText}
              </Button>
            </div>

            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => (
                <div
                  key={agent.id || `${agent.name}-${agent.code}`}
                  className="flex justify-between items-center py-4 px-4 border-b border-border last:border-b-0"
                >
                  <div>
                    <div className="font-semibold">{agent.name}</div>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1 items-center">
                      {/* <span>{agent.code || "N/A"}</span> */}
                      {/* <span>|</span> */}
                      <span>{agent.email || "N/A"}</span>
                      <span>|</span>
                      <span>{agent.phoneNo || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingAgent({
                          id: String(agent.nameID),
                          name: agent.name || "",
                          email: agent.email || "",
                          phoneNo: agent.phoneNo || "",
                          commission: agent.commission ?? "",
                          code: agent.code || "",
                          address: agent.address || "",
                          vatNo: agent.vatNo || "",
                          status:
                            agent.finAct === false ? "Active" : "Inactive",
                          finAct: agent.finAct,
                          nameID: agent.nameID,
                          hotelID: agent.hotelID,
                          hotelCode: agent.hotelCode,
                          tranCode: agent.tranCode,
                          taType: agent.taType,
                          Type: agent.nameType,
                        });
                        setIsEditDrawerOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Performance">
                      <ChartNoAxesCombined className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mb-2 text-lg font-medium">{noAgentsText}</p>
                <p className="text-sm text-muted-foreground">
                  {addAgentToGetStartedText}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawers */}
      <AddTravelAgentDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSubmit={handleAddAgent}
        onCreated={(agent) => {
          // Refresh list so it appears in the options (no page reload)
          // dispatch(fetchNameMasterByHotel());
            dispatch(fetchNameMas({ nameType: "AGENT" }));
        }}
      />
      <EditTravelAgentDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        agentData={editingAgent}
        onSubmit={handleEditAgent}
      />
    </DashboardLayout>
  );
}

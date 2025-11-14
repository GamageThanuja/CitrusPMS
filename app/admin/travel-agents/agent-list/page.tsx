"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, ChevronLeft, ChevronRight, Edit } from "lucide-react";
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
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import {
  fetchNameMas,
  selectFetchNameMasItems,
  selectFetchNameMasLoading,
  selectFetchNameMasError,
} from "@/redux/slices/fetchNameMasSlice";

import AddTravelAgentDrawer from "@/components/drawers/add-travel-agent-drawer";
import EditTravelAgentDrawer from "@/components/drawers/edit-travel-agent-drawer";

import type { AppDispatch } from "@/redux/store";

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

export default function TravelAgentsListPage() {
  const dispatch = useDispatch<AppDispatch>();

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<TravelAgent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const nameMasterList = useSelector(selectFetchNameMasItems) || [];
  const loading = useSelector(selectFetchNameMasLoading);
  const error = useSelector(selectFetchNameMasError);

  // Fetch agents
  useEffect(() => {
    dispatch(fetchNameMas({ nameType: "AGENT" }));
  }, [dispatch]);

  // Normalize agents
  const agentsData: TravelAgent[] = useMemo(
    () =>
      nameMasterList
        .filter((n: any) => {
          const t = String(n?.nameType || "").toLowerCase();
          return t === "customer" || t === "agent";
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
          isFullPaymentNeededForCheckIn:
            n.isFullPaymentNeededForCheckIn ?? false,
          nameID: n.nameID,
          nameType: n.nameType,
          finAct: n.finAct ?? false,
          creditLimit: n.creditLimit || 0,
          companyName: n.companyName || "",
          address1: n.address1 || "",
          address2: n.address2 || "",
          city: n.city || "",
          tranCode: n.tranCode || "",
        })),
    [nameMasterList]
  );

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

  // Reset page when filters change
  useEffect(() => {
    setPageIndex(1);
  }, [searchQuery, pageSize]);

  // Pagination
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

  // Open Add drawer
  const handleCreate = () => {
    setAddDrawerOpen(true);
  };

  // Open Edit drawer
  const handleEdit = (agent: TravelAgent) => {
    setEditingAgent(agent);
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
                <TableHead className="w-[80px] text-right">Actions</TableHead>
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
                    <TableCell className="font-medium">{agent.name}</TableCell>
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
                      {agent.isAllowCredit ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      {agent.isFullPaymentNeededForCheckIn ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      {!agent.finAct ? "Active" : "Inactive"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(agent)}
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

        {/* Add Travel Agent Drawer */}
        <AddTravelAgentDrawer
          isOpen={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          onCreated={() => {
            toast.success("Agent created successfully");
            setAddDrawerOpen(false);
            dispatch(fetchNameMas({ nameType: "AGENT" }));
          }}
        />

        {/* Edit Travel Agent Drawer */}
        <EditTravelAgentDrawer
          isOpen={!!editingAgent}
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onUpdated={() => {
            toast.success("Agent updated successfully");
            setEditingAgent(null);
            dispatch(fetchNameMas({ nameType: "AGENT" }));
          }}
        />
      </div>
    </DashboardLayout>
  );
}
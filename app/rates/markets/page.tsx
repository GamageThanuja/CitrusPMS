"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import {
  fetchMarketMas,
  selectMarketMasData,
  selectMarketMasLoading,
  selectMarketMasError,
} from "@/redux/slices/fetchMarketMasSlice";
import {
  createMarketMas,
  selectCreateMarketMasLoading,
  selectCreateMarketMasError,
} from "@/redux/slices/createMarketMasSlice";
import {
  updateMarketMas,
  selectUpdateMarketMasLoading,
  selectUpdateMarketMasError,
} from "@/redux/slices/updateMarketMasSlice";

import { useAppSelector } from "@/redux/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// ---- Type ----
interface MarketUI {
  marketID: number;
  marketName: string;
  finAct: boolean;
  hotelCode: string;
  showOnFO: boolean;
}

export default function MarketPage() {
  const dispatch = useDispatch<any>();

  const markets = useAppSelector(selectMarketMasData);
  const loading = useAppSelector(selectMarketMasLoading);
  const error = useAppSelector(selectMarketMasError);

  const creating = useAppSelector(selectCreateMarketMasLoading);
  const createError = useAppSelector(selectCreateMarketMasError);

  const updating = useAppSelector(selectUpdateMarketMasLoading);
  const updateError = useAppSelector(selectUpdateMarketMasError);

  const [filtered, setFiltered] = useState<MarketUI[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [marketData, setMarketData] = useState({
    marketName: "",
    finAct: false, 
    hotelCode: "",
    showOnFO: false,
  });
  const [editId, setEditId] = useState<number | null>(null);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch markets on mount
  useEffect(() => {
    dispatch(fetchMarketMas());
  }, [dispatch]);

  // Filter & map markets
  useEffect(() => {
    const mapped: MarketUI[] = markets.map((m) => ({
      marketID: m.marketID,
      marketName: m.marketName,
      finAct: m.finAct ?? false,
      hotelCode: m.hotelCode || "",
      showOnFO: m.showOnFO || false,
    }));
    const q = query.trim().toLowerCase();
    setFiltered(
      mapped.filter((m) =>
        m.marketName.toLowerCase().includes(q) ||
        m.hotelCode.toLowerCase().includes(q)
      )
    );
  }, [markets, query]);

  // Reset to first page when filters change
  useEffect(() => {
    setPageIndex(1);
  }, [query, pageSize]);

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

  const openCreateDialog = () => {
    setMarketData({
      marketName: "",
      finAct: false,
      hotelCode: "",
      showOnFO: false,
    });
    setEditId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (market: MarketUI) => {
    setMarketData({
      marketName: market.marketName,
      finAct: market.finAct ?? false, 
      hotelCode: market.hotelCode,
      showOnFO: market.showOnFO ?? false,
    });
    setEditId(market.marketID);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!marketData.marketName.trim()) {
      toast.error("Market name cannot be empty");
      return;
    }

    try {
      if (editId !== null) {
        // UPDATE
        const action = await dispatch(
          updateMarketMas({
            marketID: editId,
            marketName: marketData.marketName,
            finAct: marketData.finAct ?? null,
            hotelCode: marketData.hotelCode || null,
            showOnFO: marketData.showOnFO,
          })
        );
        if (updateMarketMas.rejected.match(action)) {
          toast.error(action.payload || "Failed to update market");
          return;
        }
        toast.success(`Market "${marketData.marketName}" updated`);
      } else {
        // CREATE
        const action = await dispatch(
          createMarketMas({
            marketName: marketData.marketName,
            finAct: marketData.finAct ?? null,
            hotelCode: marketData.hotelCode || null,
            showOnFO: marketData.showOnFO,
          })
        );
        if (createMarketMas.rejected.match(action)) {
          toast.error(action.payload || "Failed to create market");
          return;
        }
        toast.success(`Market "${marketData.marketName}" created`);
      }

      setDialogOpen(false);
      setMarketData({ marketName: "", finAct: false, hotelCode: "", showOnFO: false });
      setEditId(null);
      dispatch(fetchMarketMas());
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleInputChange = (field: keyof typeof marketData, value: string | boolean) => {
    setMarketData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold">Markets</h1>
          <div className="flex gap-2">
            <Input
              placeholder="Search markets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button
              variant="outline"
              onClick={() => dispatch(fetchMarketMas())}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button onClick={openCreateDialog}>Add Market</Button>
          </div>
        </div>

        {/* Errors */}
        {(error || createError || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || createError || updateError}
          </div>
        )}

        {/* Table - Updated to use common component */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead>Market Name</TableHead>
                <TableHead className="w-[140px]">Financial Activity</TableHead>
                <TableHead className="w-[120px]">Hotel Code</TableHead>
                <TableHead className="w-[120px]">Show on FO</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">
                    Loading markets…
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((market, idx) => (
                  <TableRow key={market.marketID} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {(pageIndex - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell>{market.marketName}</TableCell>
                    <TableCell>{market.finAct ? "Yes" : "No"}</TableCell>
                    <TableCell>{market.hotelCode || "-"}</TableCell>
                    <TableCell>{market.showOnFO ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditDialog(market)}
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
              No markets found.
            </div>
          )}
        </div>

        {/* Pagination Controls - Consistent with venues */}
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

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editId !== null ? "Edit Market" : "Create Market"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="marketName">Market Name *</Label>
                <Input
                  id="marketName"
                  placeholder="Enter market name"
                  value={marketData.marketName}
                  onChange={(e) => handleInputChange("marketName", e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="finAct"
                  checked={marketData.finAct}
                  onCheckedChange={(checked) => handleInputChange("finAct", checked as boolean)}
                />
                <Label htmlFor="finAct">Financial Activity</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotelCode">Hotel Code</Label>
                <Input
                  id="hotelCode"
                  placeholder="Enter hotel code"
                  value={marketData.hotelCode}
                  onChange={(e) => handleInputChange("hotelCode", e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOnFO"
                  checked={marketData.showOnFO}
                  onCheckedChange={(checked) => handleInputChange("showOnFO", checked as boolean)}
                />
                <Label htmlFor="showOnFO">Show on Front Office</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={creating || updating}>
                  {creating || updating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editId !== null ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
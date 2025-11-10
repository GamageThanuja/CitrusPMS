"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2 } from "lucide-react";

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

  const openCreateDialog = () => {
    setMarketData({
      marketName: "",
      finAct: "",
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
      <div className="p-6 space-y-4">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Button variant="outline" onClick={() => dispatch(fetchMarketMas())} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh Markets</span>
          </Button>

          <div className="flex gap-2 md:ml-auto">
            <Input
              placeholder="Search markets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-64"
            />
            <Button onClick={openCreateDialog}>Add Market</Button>
          </div>
        </div>

        {/* Errors */}
        {(error || createError || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || createError || updateError}
          </div>
        )}

        {/* Market List */}
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-2 border-b">#</th>
                <th className="px-4 py-2 border-b">Market Name</th>
                <th className="px-4 py-2 border-b">Financial Activity</th>
                <th className="px-4 py-2 border-b">Hotel Code</th>
                <th className="px-4 py-2 border-b">Show on FO</th>
                <th className="px-4 py-2 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-2 animate-pulse bg-gray-100 dark:bg-zinc-900 h-10" />
                    </tr>
                  ))
                : filtered.map((market, idx) => (
                    <tr key={market.marketID} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                      <td className="px-4 py-2 border-b">{idx + 1}</td>
                      <td className="px-4 py-2 border-b">{market.marketName}</td>
                      <td className="px-4 py-2 border-b">{market.finAct ? "Yes" : "No"}</td>
                      <td className="px-4 py-2 border-b">{market.hotelCode || "-"}</td>
                      <td className="px-4 py-2 border-b">
                        {market.showOnFO ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-2 border-b text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(market)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No markets found.
            </div>
          )}
        </div>

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
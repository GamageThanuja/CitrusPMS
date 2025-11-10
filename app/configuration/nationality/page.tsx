"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/redux/hooks";

import {
  fetchNationalityMas,
  selectNationalityMasItems,
  selectNationalityMasLoading,
  selectNationalityMasError,
} from "@/redux/slices/fetchNationalityMasSlice";

import {
  createNationalityMas,
  selectCreateNationalityMasLoading,
  selectCreateNationalityMasError,
} from "@/redux/slices/createNationalityMasSlice";

import {
  updateNationalityMas,
  selectUpdateNationalityMasLoading,
  selectUpdateNationalityMasError,
} from "@/redux/slices/updateNationalityMasSlice";

interface NationalityUI {
  nationalityID: number;
  nationality: string;
  countryCode: string;
  country: string;
}

export default function NationalityPage() {
  const dispatch = useDispatch<any>();

  const items = useAppSelector(selectNationalityMasItems);
  const loading = useAppSelector(selectNationalityMasLoading);
  const error = useAppSelector(selectNationalityMasError);

  const creating = useAppSelector(selectCreateNationalityMasLoading);
  const createError = useAppSelector(selectCreateNationalityMasError);

  const updating = useAppSelector(selectUpdateNationalityMasLoading);
  const updateError = useAppSelector(selectUpdateNationalityMasError);

  const [filtered, setFiltered] = useState<NationalityUI[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nationalityData, setNationalityData] = useState({
    nationality: "",
    countryCode: "",
    country: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchNationalityMas());
  }, [dispatch]);

  // Filter list
  useEffect(() => {
    const q = query.toLowerCase().trim();
    const filteredItems = items.filter(
      (n) =>
        (n.nationality ?? "").toLowerCase().includes(q) ||
        (n.country ?? "").toLowerCase().includes(q) ||
        (n.countryCode ?? "").toLowerCase().includes(q)
    );
    setFiltered(filteredItems);
    setCurrentPage(1); // reset page on search
  }, [items, query]);

  // Pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const paginatedItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const openCreateDialog = () => {
    setEditId(null);
    setNationalityData({
      nationality: "",
      countryCode: "",
      country: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (nat: NationalityUI) => {
    setEditId(nat.nationalityID);
    setNationalityData({
      nationality: nat.nationality,
      countryCode: nat.countryCode,
      country: nat.country,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nationalityData.nationality.trim()) {
      toast.error("Nationality is required");
      return;
    }

    if (!nationalityData.country.trim()) {
      toast.error("Country is required");
      return;
    }

    const username = localStorage.getItem("rememberedUsername") || "unknown";

    try {
      if (editId !== null) {
        const action = await dispatch(
          updateNationalityMas({
            nationality: nationalityData.nationality,
            country: nationalityData.country,
            countryCode: nationalityData.countryCode,
          })
        );
        if (updateNationalityMas.rejected.match(action)) {
          toast.error(action.payload || "Failed to update nationality");
          return;
        }
        toast.success(`Nationality "${nationalityData.nationality}" updated`);
      } else {
        const action = await dispatch(
          createNationalityMas({
            nationality: nationalityData.nationality,
            country: nationalityData.country,
            countryCode: nationalityData.countryCode,
          })
        );
        if (createNationalityMas.rejected.match(action)) {
          toast.error(action.payload || "Failed to create nationality");
          return;
        }
        toast.success(`Nationality "${nationalityData.nationality}" created`);
      }

      setDialogOpen(false);
      dispatch(fetchNationalityMas());
    } catch {
      toast.error("Operation failed");
    }
  };

  const handleInputChange = (field: keyof typeof nationalityData, value: string) => {
    setNationalityData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Button
            variant="outline"
            onClick={() => dispatch(fetchNationalityMas())}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>

          <div className="flex gap-2 md:ml-auto">
            <Input
              placeholder="Search by nationality, country, or code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full md:w-64"
            />
            <Button onClick={openCreateDialog}>Add Nationality</Button>
          </div>
        </div>

        {/* Errors */}
        {(error || createError || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || createError || updateError}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-2 border-b">#</th>
                <th className="px-4 py-2 border-b">Nationality</th>
                <th className="px-4 py-2 border-b">Country</th>
                <th className="px-4 py-2 border-b">Country Code</th>
                <th className="px-4 py-2 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-4 py-2 animate-pulse bg-gray-100 dark:bg-zinc-900 h-10" />
                    </tr>
                  ))
                : paginatedItems.map((nat, idx) => (
                    <tr key={nat.nationalityID} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                      <td className="px-4 py-2 border-b">{indexOfFirst + idx + 1}</td>
                      <td className="px-4 py-2 border-b">{nat.nationality}</td>
                      <td className="px-4 py-2 border-b">{nat.country}</td>
                      <td className="px-4 py-2 border-b">{nat.countryCode}</td>
                      <td className="px-4 py-2 border-b text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(nat)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!loading && filtered.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No nationalities found.
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Nationality" : "Create Nationality"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {["nationality", "country", "countryCode"].map((f) => (
                <div key={f} className="space-y-2">
                  <Label htmlFor={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</Label>
                  <Input
                    id={f}
                    placeholder={`Enter ${f}`}
                    value={(nationalityData as any)[f]}
                    onChange={(e) => handleInputChange(f as keyof typeof nationalityData, e.target.value)}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={creating || updating}>
                  {creating || updating ? <Loader2 className="h-4 w-4 animate-spin" /> : editId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

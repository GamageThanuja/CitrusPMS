"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Edit, Loader2 } from "lucide-react";

import {
  fetchSeasonMas,
  selectSeasonMasData,
  selectSeasonMasLoading,
  selectSeasonMasError,
} from "@/redux/slices/fetchSeasonMasSlice";
import {
  createSeasonMas,
  selectCreateSeasonMasLoading,
  selectCreateSeasonMasError,
} from "@/redux/slices/createSeasonMasSlice";
import {
  updateSeasonMas,
  selectUpdateSeasonMasLoading,
  selectUpdateSeasonMasError,
} from "@/redux/slices/updateSeasonMasSlice";

import { useAppSelector } from "@/redux/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ---- Type ----
interface SeasonUI {
  id: number;
  name: string;
}

export default function SeasonPage() {
  const dispatch = useDispatch<any>();

  const seasons = useAppSelector(selectSeasonMasData);
  const loading = useAppSelector(selectSeasonMasLoading);
  const error = useAppSelector(selectSeasonMasError);

  const creating = useAppSelector(selectCreateSeasonMasLoading);
  const createError = useAppSelector(selectCreateSeasonMasError);

  const updating = useAppSelector(selectUpdateSeasonMasLoading);
  const updateError = useAppSelector(selectUpdateSeasonMasError);

  const [filtered, setFiltered] = useState<SeasonUI[]>([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // Fetch seasons on mount
  useEffect(() => {
    dispatch(fetchSeasonMas());
  }, [dispatch]);

  // Filter & map seasons
  useEffect(() => {
    const mapped: SeasonUI[] = seasons.map((s) => ({ id: s.seasonID, name: s.season }));
    const q = query.trim().toLowerCase();
    setFiltered(mapped.filter((s) => s.name.toLowerCase().includes(q)));
  }, [seasons, query]);

  const openCreateDialog = () => {
    setSeasonName("");
    setEditId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (season: SeasonUI) => {
    setSeasonName(season.name);
    setEditId(season.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!seasonName.trim()) {
      toast.error("Season name cannot be empty");
      return;
    }

    try {
      if (editId !== null) {
        // UPDATE
        const action = await dispatch(updateSeasonMas({ seasonID: editId, season: seasonName }));
        if (updateSeasonMas.rejected.match(action)) {
          toast.error(action.payload || "Failed to update season");
          return;
        }
        toast.success(`Season updated to "${seasonName}"`);
      } else {
        // CREATE
        const action = await dispatch(createSeasonMas({ seasonID: 0, season: seasonName }));
        if (createSeasonMas.rejected.match(action)) {
          toast.error(action.payload || "Failed to create season");
          return;
        }
        toast.success(`Season "${seasonName}" created`);
      }

      setDialogOpen(false);
      setSeasonName("");
      setEditId(null);
      dispatch(fetchSeasonMas());
    } catch {
      toast.error("Operation failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4">
        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Button variant="outline" onClick={() => dispatch(fetchSeasonMas())} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh Seasons</span>
          </Button>

          <div className="flex gap-2 md:ml-auto">
            <Input
              placeholder="Search by season"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button onClick={openCreateDialog}>Add Season</Button>
          </div>
        </div>

        {/* Errors */}
        {(error || createError || updateError) && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {error || createError || updateError}
          </div>
        )}

        {/* Season List */}
        <div className="overflow-x-auto border rounded-md">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-2 border-b">#</th>
                <th className="px-4 py-2 border-b">Season Name</th>
                <th className="px-4 py-2 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
            {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                    <td colSpan={3} className="px-4 py-2 animate-pulse bg-gray-100 dark:bg-zinc-900 h-10" />
                    </tr>
                ))
                : filtered.map((season, idx) => (
                    <tr key={season.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700">
                    <td className="px-4 py-2 border-b">{idx + 1}</td>
                    <td className="px-4 py-2 border-b">{season.name}</td>
                    {/* Align actions to the right */}
                    <td className="px-4 py-2 border-b text-right">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(season)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                    </td>
                    </tr>
                ))}
            </tbody>

          </table>
          {filtered.length === 0 && !loading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No seasons found.
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editId !== null ? "Edit Season" : "Create Season"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                placeholder="Season Name"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
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

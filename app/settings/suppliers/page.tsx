// app/(dashboard)/suppliers/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Edit, Filter, Package, Plus, Search, Trash2 } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslatedText } from "@/lib/translation";
import { AddSupplierDrawer } from "@/components/drawers/add-supplier-drawer";

import type { RootState, AppDispatch } from "@/redux/store";
import { fetchNameMasterByHotel } from "@/redux/slices/nameMasterSlice";

import {
  deleteNameMasterById,
  selectNameMasterDeleteLoading,
  selectNameMasterDeleteError,
  resetDeleteState,
} from "@/redux/slices/nameMasterDeleteSlice";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Shape we render in the table
type SupplierRow = {
  id: string | number;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  category?: string;
  status?: "Active" | "Inactive" | string;
};

// ----- in suppliers/page.tsx -----
const mapNameMasterToSupplier = (nm: any): SupplierRow => {
  return {
    id: nm.nameID ?? nm.id ?? nm.guid ?? nm.code ?? crypto.randomUUID(), // ✅ prefer nameID
    name: nm.name ?? nm.displayName ?? nm.companyName ?? "—",
    contact: nm.contactPerson ?? nm.contact ?? nm.primaryContact ?? "—",
    email: nm.email ?? nm.contactEmail ?? "—",
    phone: nm.phoneNo ?? nm.phone ?? nm.contactPhone ?? "—", // ✅ phoneNo first (your API)
    category: nm.category ?? nm.group ?? "—",
    status: (nm.isActive === false ? "Inactive" : "Active") as
      | "Active"
      | "Inactive",
  };
};

export default function SuppliersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editInitial, setEditInitial] = useState<any | null>(null);

  const { data, loading, error } = useSelector((s: RootState) => s.nameMaster);

  console.log("data : ", data);

  // If you still want to allow adding (locally) until you wire POST:
  const [localAdds, setLocalAdds] = useState<SupplierRow[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // i18n
  const suppliersText = useTranslatedText("Suppliers");
  const addSupplierText = useTranslatedText("Add Supplier");
  const searchText = useTranslatedText("Search");
  const filterText = useTranslatedText("Filter");
  const noSuppliersText = useTranslatedText("No suppliers found");
  const nameText = useTranslatedText("Name");
  const contactText = useTranslatedText("Contact");
  const emailText = useTranslatedText("Email");
  const phoneText = useTranslatedText("Phone");
  const categoryText = useTranslatedText("Category");
  const statusText = useTranslatedText("Status");
  const actionsText = useTranslatedText("Actions");
  const addSupplierToGetStartedText = useTranslatedText(
    "Add a supplier to get started"
  );

  const selectedProperty = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("selectedProperty") || "{}");
    } catch {
      return {};
    }
  }, []); // runs client-side only because this is a "use client" file

  const hotelId = selectedProperty?.id;

  // 1) Fetch on first mount (and when hotel changes)
  useEffect(() => {
    if (hotelId) {
      dispatch(fetchNameMasterByHotel());
    }
  }, [dispatch, hotelId]);

  // 2) Keep your existing "refetch after EDIT closes"
  useEffect(() => {
    if (!isEditOpen && editInitial) {
      dispatch(fetchNameMasterByHotel());
    }
  }, [isEditOpen, editInitial, dispatch]);

  const delLoading = useSelector(selectNameMasterDeleteLoading);
  const delError = useSelector(selectNameMasterDeleteError);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // optional: clear delete error when dialog opens/closes
  useEffect(() => {
    if (!confirmOpen) {
      dispatch(resetDeleteState());
    }
  }, [confirmOpen, dispatch]);

  // 3) (Optional) also refetch after CREATE closes
  useEffect(() => {
    if (!isCreateOpen) {
      // If you only want to refetch when it *was* open, track a prev state or
      // just always refetch on close—it’s cheap and simplest:
      dispatch(fetchNameMasterByHotel());
    }
  }, [isCreateOpen, dispatch]);

  const suppliers: SupplierRow[] = useMemo(() => {
    // keep only suppliers from NameMaster
    const apiRows = Array.isArray(data)
      ? data
          .filter((nm) => {
            const t = (nm.taType ?? nm.type ?? "").toString().toLowerCase();
            return t === "supplier";
          })
          .map(mapNameMasterToSupplier)
      : [];

    return [...apiRows, ...localAdds];
  }, [data, localAdds]);

  // Search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase();
    return suppliers.filter((s) =>
      [s.name, s.contact, s.email, s.phone, s.category, s.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [suppliers, searchQuery]);

  // Local add handler (until POST is wired)
  const handleAddSupplier = (form: any) => {
    const next: SupplierRow = {
      id: crypto.randomUUID(),
      name: form.name ?? "—",
      contact: form.contact ?? "—",
      email: form.email ?? "—",
      phone: form.phone ?? "—",
      category: form.category ?? "—",
      status: form.status ?? "Active",
    };
    setLocalAdds((x) => [...x, next]);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{suppliersText}</h1>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {addSupplierText}
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`${searchText}...`}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            {filterText}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{suppliersText}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Loading */}
            {loading && (
              <div className="py-8 text-sm text-muted-foreground">
                Loading suppliers…
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="py-8 text-sm text-red-600">
                {typeof error === "string" ? error : "Failed to load suppliers"}
              </div>
            )}

            {/* Table / Empty */}
            {!loading && !error && (filtered?.length ?? 0) > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{nameText}</TableHead>
                    <TableHead>{contactText}</TableHead>
                    <TableHead>{emailText}</TableHead>
                    <TableHead>{phoneText}</TableHead>
                    <TableHead>{categoryText}</TableHead>
                    <TableHead>{statusText}</TableHead>
                    <TableHead>{actionsText}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        {supplier.name}
                      </TableCell>
                      <TableCell>{supplier.contact ?? "—"}</TableCell>
                      <TableCell>{supplier.email ?? "—"}</TableCell>
                      <TableCell>{supplier.phone ?? "—"}</TableCell>
                      <TableCell>{supplier.category ?? "—"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            supplier.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {supplier.status ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              const original = Array.isArray(data)
                                ? data.find(
                                    (nm: any) => nm.nameID === supplier.id
                                  )
                                : null;
                              if (!original) return;

                              setEditInitial({
                                nameID: original.nameID,
                                name: original.name ?? "",
                                email: original.email ?? "",
                                phoneNo: original.phoneNo ?? "",
                                address: original.address ?? "",
                                status:
                                  original.isActive === false
                                    ? "Inactive"
                                    : "Active",
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              // Only allow delete for rows that came from API (nameID is numeric)
                              const original = Array.isArray(data)
                                ? data.find(
                                    (nm: any) => nm.nameID === supplier.id
                                  )
                                : null;

                              if (
                                !original ||
                                typeof original?.nameID !== "number"
                              )
                                return;

                              setConfirmTarget({
                                id: original.nameID as number,
                                name: supplier.name,
                              });
                              setConfirmOpen(true);
                            }}
                            disabled={delLoading}
                            title={delLoading ? "Deleting..." : "Delete"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              !loading &&
              !error && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 text-lg font-medium">{noSuppliersText}</p>
                  <p className="text-sm text-muted-foreground">
                    {addSupplierToGetStartedText}
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      <AddSupplierDrawer
        isOpen={isCreateOpen}
        mode="create"
        initial={null}
        onClose={() => setIsCreateOpen(false)}
        onSubmitLocal={handleAddSupplier} // optional local append UX
      />

      {/* EDIT drawer */}
      <AddSupplierDrawer
        isOpen={isEditOpen}
        mode="edit"
        initial={editInitial}
        onClose={() => setIsEditOpen(false)}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget
                ? `This will permanently delete “${confirmTarget.name}”.`
                : "This will permanently delete the selected supplier."}
              {delError && (
                <span className="mt-2 block text-red-600">
                  {typeof delError === "string" ? delError : "Delete failed."}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={delLoading || !confirmTarget}
              onClick={async () => {
                if (!confirmTarget) return;
                const res = await dispatch(
                  deleteNameMasterById(confirmTarget.id)
                );
                if (deleteNameMasterById.fulfilled.match(res)) {
                  setConfirmOpen(false);
                  setConfirmTarget(null);
                  // refresh table after delete
                  dispatch(fetchNameMasterByHotel());
                }
              }}
            >
              {delLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

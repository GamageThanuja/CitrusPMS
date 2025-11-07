"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import type { AppDispatch, RootState } from "@/redux/store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

// Slices you already have / asked for
import { fetchEmployeesByHotel } from "@/redux/slices/hotelEmployeesByHotelSlice";
import { createHotelEmployee } from "@/redux/slices/createHotelEmployeeSlice";
import { updateHotelEmployee } from "@/redux/slices/updateHotelEmployeeSlice";
import {
  deleteHotelEmployee,
  resetDeleteHotelEmployeeState,
} from "@/redux/slices/deleteHotelEmployeeSlice";
import { useToast } from "@/components/toast/ToastProvider";

// Shared types mirrored from slices
interface HotelEmployee {
  empId: number;
  hotelId: number;
  empNo: string;
  empName: string;
  dateOfJoined: string;
  status: string;
  department: string;
  phone: string;
  email: string;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
}

type CreateUpdatePayload = {
  hotelId?: number;
  empNo: string;
  empName: string;
  dateOfJoined: string;
  status: string;
  department: string;
  phone: string;
  email: string;
  finAct: boolean;
  createdBy?: string;
};

export default function Page() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    data: employees,
    loading,
    error,
  } = useAppSelector(
    (s: RootState) =>
      s.hotelEmployeesByHotel || { data: [], loading: false, error: null }
  );
  const createState = useAppSelector(
    (s: RootState) =>
      s.createHotelEmployee || { loading: false, error: null, data: null }
  );
  const updateState = useAppSelector(
    (s: RootState) =>
      s.updateHotelEmployee || { loading: false, error: null, data: null }
  );
  const delState = useAppSelector(
    (s: RootState) =>
      s.deleteHotelEmployee || { loading: false, error: null, success: null }
  );

  console.log("employees : ", employees);

  // --- Hotel Id from localStorage.selectedProperty ---
  const [hotelId, setHotelId] = useState<number | null>(null);
  useEffect(() => {
    const selectedProperty = localStorage.getItem("selectedProperty");
    const property = selectedProperty ? JSON.parse(selectedProperty) : {};
    setHotelId(property?.id ?? null);
  }, []);

  // --- Local UI state ---
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<HotelEmployee | null>(null);
  const { show } = useToast();

  // --- Fetch list ---
  useEffect(() => {
    if (hotelId != null) {
      dispatch(fetchEmployeesByHotel(hotelId));
    }
  }, [hotelId, dispatch]);

  // --- Delete feedback ---
  useEffect(() => {
    if (delState.success === true) {
      // toast.success("Employee deleted");
      show({
        variant: "success",
        title: "Recorded successfully!",
        description: "Employee deleted",
      });
      dispatch(resetDeleteHotelEmployeeState());
      if (hotelId != null) dispatch(fetchEmployeesByHotel(hotelId));
    }
    if (delState.error) {
      toast.error(delState.error);
    }
  }, [delState.success, delState.error, dispatch, hotelId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees ?? [];
    return (employees ?? []).filter((e) =>
      [e.empNo, e.empName, e.department, e.email, e.phone, e.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [employees, search]);

  // --- Form State (shared for create / edit) ---
  const [form, setForm] = useState<CreateUpdatePayload>({
    empNo: "",
    empName: "",
    dateOfJoined: new Date().toISOString(),
    status: "active",
    department: "",
    phone: "",
    email: "",
    finAct: true,
    createdBy: "system",
  });

  const resetForm = () =>
    setForm({
      empNo: "",
      empName: "",
      dateOfJoined: new Date().toISOString(),
      status: "active",
      department: "",
      phone: "",
      email: "",
      finAct: true,
      createdBy: "system",
    });

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (row: HotelEmployee) => {
    setEditing(row);
    setForm({
      empNo: row.empNo,
      empName: row.empName,
      dateOfJoined: row.dateOfJoined,
      status: row.status,
      department: row.department,
      phone: row.phone,
      email: row.email,
      finAct: row.finAct,
    });
    setEditOpen(true);
  };

  const handleCreate = async () => {
    if (hotelId == null) return toast.error("No hotel selected");
    const action = await dispatch(
      createHotelEmployee({
        ...form,
        hotelId,
        createdBy: form.createdBy ?? "system",
      }) as any
    );
    if ((createHotelEmployee as any).fulfilled.match(action)) {
      // toast.success("Employee created");
      show({
        variant: "success",
        title: "Recorded successfully!",
        description: "Employee created!",
      });
      setCreateOpen(false);
      resetForm();
      dispatch(fetchEmployeesByHotel(hotelId));
    } else {
      toast.error(String(action.payload ?? "Failed"));
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const id = editing.empId;
    const action = await dispatch(
      updateHotelEmployee({
        id,
        data: { ...form, hotelId: editing.hotelId },
      }) as any
    );
    if ((updateHotelEmployee as any).fulfilled.match(action)) {
      // toast.success("Employee updated");
      show({
        variant: "success",
        title: "Recorded successfully!",
        description: "Employee updated!",
      });

      setEditOpen(false);
      setEditing(null);
      if (hotelId != null) dispatch(fetchEmployeesByHotel(hotelId));
    } else {
      toast.error(String(action.payload ?? "Failed"));
    }
  };

  const handleDelete = async (row: HotelEmployee) => {
    const action = await dispatch(deleteHotelEmployee(row.empId) as any);
    if ((deleteHotelEmployee as any).fulfilled.match(action)) {
      // success handled by effect
    } else {
      toast.error(String(action.payload ?? "Delete failed"));
    }
  };

  const busy = loading || createState.loading || updateState.loading;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Hotel Employees</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                hotelId != null && dispatch(fetchEmployeesByHotel(hotelId))
              }
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> New Employee
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" /> Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by No / Name / Dept / Email / Phone / Status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Emp No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="min-w-[150px]">Joined</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {busy && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}

                  {!busy && filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No employees
                      </TableCell>
                    </TableRow>
                  )}

                  {!busy &&
                    filtered.map((e) => (
                      <TableRow key={e.empId} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{e.empNo}</TableCell>
                        <TableCell>{e.empName}</TableCell>
                        <TableCell>{e.department}</TableCell>
                        <TableCell>{e.status}</TableCell>
                        <TableCell>{e.phone}</TableCell>
                        <TableCell>{e.email}</TableCell>
                        <TableCell>
                          {new Date(e.dateOfJoined).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => openEdit(e)}>
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(e)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Create Drawer */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>New Employee</SheetTitle>
            <SheetDescription>Fill details and click "Create"</SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-4">
            <Field label="Employee No">
              <Input
                value={form.empNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, empNo: e.target.value }))
                }
              />
            </Field>
            <Field label="Name">
              <Input
                value={form.empName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, empName: e.target.value }))
                }
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
              />
            </Field>
            <Field label="Status">
              <Input
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </Field>
            <Field label="Joined (ISO)">
              <Input
                value={form.dateOfJoined}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateOfJoined: e.target.value }))
                }
              />
            </Field>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createState.loading}>
                Create
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Drawer */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Employee</SheetTitle>
            <SheetDescription>Update details and click "Save"</SheetDescription>
          </SheetHeader>
          <div className="mt-6 grid gap-4">
            <Field label="Employee No">
              <Input
                value={form.empNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, empNo: e.target.value }))
                }
              />
            </Field>
            <Field label="Name">
              <Input
                value={form.empName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, empName: e.target.value }))
                }
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
              />
            </Field>
            <Field label="Status">
              <Input
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({ ...p, status: e.target.value }))
                }
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
              />
            </Field>
            <Field label="Joined (ISO)">
              <Input
                value={form.dateOfJoined}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateOfJoined: e.target.value }))
                }
              />
            </Field>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateState.loading}>
                Save
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

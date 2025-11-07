"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { format } from "date-fns";
import { RefreshCw, Loader2 } from "lucide-react";

import { fetchHotelRoomNumbers } from "@/redux/slices/fetchHotelRoomNumbersSlice";
import {
  updateHousekeepingStatus,
  type UpdateHousekeepingPayload,
} from "@/redux/slices/housekeepingStatusSlice";
import { fetchEmployeesByHotel } from "@/redux/slices/hotelEmployeesByHotelSlice";

// NEW: import the HK log thunk & types
import {
  createHousekeepingLog,
  type CreateHousekeepingLogPayload,
} from "@/redux/slices/createHousekeepingLogSlice";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RootState } from "@/redux/store";
import { useAppSelector } from "@/redux/hooks";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ===== Types =====
type HKStatus = "Clean" | "Dirty" | "Occupied" | "WIP" | string;

type UIRoom = {
  id: number;
  code: string;
  type: string;
  status: HKStatus;
  availability: "Occupied" | "Available";
  attendant?: string | null;
  attendantId?: number | null;
  checkedOutAt?: string | null;
};

type EmployeeOpt = {
  id: number;
  label: string;
};

// ===== Helpers =====
const coalesce = (...vals: any[]) =>
  vals.find((v) => v !== undefined && v !== null && v !== "");

function getHotelId(): number | null {
  try {
    const raw = localStorage.getItem("selectedHotelId");
    if (raw) return Number(raw);

    const tokens = localStorage.getItem("hotelmateTokens");
    if (tokens) {
      const parsed = JSON.parse(tokens);
      if (parsed?.hotelId) return Number(parsed.hotelId);
      if (parsed?.user?.hotelId) return Number(parsed.user.hotelId);
    }
  } catch {}
  return null;
}

// NEW: who is performing the action (for createdBy / jobAssignedBy / jobFinishedBy)
function getCurrentUserIdentity(): string {
  try {
    const tokens = localStorage.getItem("hotelmateTokens");
    if (!tokens) return "system";
    const parsed = JSON.parse(tokens);
    return (
      parsed?.user?.email ||
      parsed?.user?.userName ||
      parsed?.username ||
      parsed?.name ||
      "system"
    );
  } catch {
    return "system";
  }
}

// NEW: small helper to dispatch HK log creation
async function dispatchHKLog(
  dispatch: any,
  base: {
    roomNo: string;
    createdBy: string;
    status: HKStatus;
    attendantName?: string | null;
  },
  extra?: Partial<CreateHousekeepingLogPayload>
) {
  const now = new Date().toISOString();

  const payload: CreateHousekeepingLogPayload = {
    roomNo: base.roomNo,
    hkLog: `HK: ${base.status}${
      base.attendantName ? ` (Attendant: ${base.attendantName})` : ""
    }`,
    createdBy: base.createdBy,
    status: base.status,
    housekeepingAttendant: base.attendantName ?? undefined,

    // sensible timestamp defaults (server also sets these, but we send them)
    entryDate: now,
    timeStamp: now,
    loggedOn: now,
    jobCreated_TimeStamp: extra?.jobCreated_TimeStamp ?? now,
    jobAssigned_TimeStamp: extra?.jobAssigned_TimeStamp,
    jobFinished_TimeStamp: extra?.jobFinished_TimeStamp,

    isStarted: extra?.isStarted,
    isFinished: extra?.isFinished,
    jobAssignedBy: extra?.jobAssignedBy,
    jobFinishedBy: extra?.jobFinishedBy,

    // optional
    remarks: extra?.remarks,
    loggedBy: extra?.loggedBy,
  };

  const action = await dispatch(createHousekeepingLog(payload));
  if (createHousekeepingLog.rejected.match(action)) {
    // don't block UX on logging errors; just notify
    toast.error(action.payload || "Failed to write housekeeping log.");
    return false;
  }
  return true;
}

export default function HousekeepingPage() {
  const dispatch = useDispatch<any>();

  // ---- slice states ----
  const loadingRooms: boolean = useSelector(
    (s: any) => s.hotelRoomNumbers?.loading
  );
  const roomsError: string | null = useSelector(
    (s: any) => s.hotelRoomNumbers?.error
  );
  const roomsData: any[] =
    useSelector((s: any) => s.hotelRoomNumbers?.data) || [];

  const {
    data: employees,
    loading,
    error,
  } = useAppSelector(
    (s: RootState) =>
      s.hotelEmployeesByHotel || { data: [], loading: false, error: null }
  );

  console.log("employees : ", employees);

  // ---- local state ----
  const [rooms, setRooms] = useState<UIRoom[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  // dialog state
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRoom, setAssignRoom] = useState<UIRoom | null>(null);
  const [assignEmpId, setAssignEmpId] = useState<number | null>(null);

  // ---- fetch data on mount ----
  const loadRooms = async () => {
    const action = await dispatch(fetchHotelRoomNumbers());
    if (fetchHotelRoomNumbers.rejected.match(action)) {
      toast.error(action.payload || "Failed to load rooms");
    }
  };

  const loadEmployees = async () => {
    const hotelId = getHotelId();
    if (!hotelId) {
      toast.info("No hotel selected. Employees not loaded.");
      return;
    }
    const action = await dispatch(fetchEmployeesByHotel(hotelId));
    if (fetchEmployeesByHotel.rejected.match(action)) {
      toast.error(action.payload || "Failed to load employees");
    }
  };

  useEffect(() => {
    loadRooms();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- map rooms slice -> UI model ----
  useEffect(() => {
    const mapped: UIRoom[] = (roomsData || []).map((r: any) => {
      const id: number = Number(coalesce(r.roomID, r.id));
      const code: string = coalesce(r.roomNo, r.code, `ROOM-${id}`)?.toString();
      const type: string =
        coalesce(
          r.roomTypeName,
          r.hotelRoomType?.roomTypeName,
          r.hotelRoomType?.roomType,
          `Type ${r.roomTypeID}`
        ) || "—";

      const status: HKStatus = normalizeStatus(
        coalesce(r.housekeepingStatus, r.hkStatus, "Clean")
      );

      const availability: "Occupied" | "Available" =
        status === "Occupied" ? "Occupied" : "Available";

      const attendantName = coalesce(r.attendantName, r.hkAttendant, null);
      const attendantId = coalesce(r.attendantId, r.hkAttendantId, null);

      const checkedOutAt = coalesce(
        r.lastCheckedOutAt,
        r.lastCheckoutAt,
        r.lastCheckOut,
        r.updatedOn,
        r.checkedOutAt,
        null
      );

      return {
        id,
        code,
        type,
        status,
        availability,
        attendant: attendantName,
        attendantId: attendantId ? Number(attendantId) : null,
        checkedOutAt,
      };
    });

    setRooms(mapped);
  }, [roomsData]);

  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOpt[]>([]);

  useEffect(() => {
    const arr = (employees || []).map((e: any) => ({
      id: Number(e.empId),
      label: e.empName || `EMP-${e.empId}`,
    }));
    setEmployeeOptions(arr);
  }, [employees]);

  const nameById = (id?: number | null) =>
    employeeOptions.find((o) => o.id === id)?.label ?? "—";

  const [filtered, setFiltered] = useState<UIRoom[]>([]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    const next = rooms.filter((room) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "Available"
          ? room.availability === "Available"
          : room.status === activeTab;

      const matchesQuery =
        !q ||
        room.code.toLowerCase().includes(q) ||
        room.type.toLowerCase().includes(q) ||
        (room.attendant || "").toLowerCase().includes(q);

      return matchesTab && matchesQuery;
    });

    setFiltered(next);
  }, [rooms, activeTab, query]);

  // ---- local patch ----
  const patchRoomLocal = (roomId: number, patch: Partial<UIRoom>) => {
    setRooms((rs) => rs.map((r) => (r.id === roomId ? { ...r, ...patch } : r)));
  };

  const changeStatus = async (
    room: UIRoom,
    housekeepingStatus: HKStatus,
    extra?: Partial<UIRoom>
  ) => {
    const prev = { ...room };

    patchRoomLocal(room.id, {
      status: housekeepingStatus,
      availability:
        housekeepingStatus === "Occupied" ? "Occupied" : "Available",
      ...extra,
    });

    const payload: UpdateHousekeepingPayload = {
      id: Number(room.id),
      housekeepingStatus,
      attendantId: extra?.attendantId ?? room.attendantId ?? undefined,
      attendantName: extra?.attendant ?? room.attendant ?? undefined,
    } as any;

    const action = await dispatch(updateHousekeepingStatus(payload));
    if (updateHousekeepingStatus.rejected.match(action)) {
      patchRoomLocal(room.id, prev);
      toast.error(action.payload || "Failed to update status");
      return false;
    }

    // NEW: write HK log for status change (Start/Complete/etc.)
    const createdBy = getCurrentUserIdentity();
    const attendantName = extra?.attendant ?? room.attendant ?? null;

    const isStart = housekeepingStatus === "WIP";
    const isFinish = housekeepingStatus === "Clean";

    await dispatchHKLog(
      dispatch,
      {
        roomNo: room.code,
        createdBy,
        status: housekeepingStatus,
        attendantName,
      },
      {
        isStarted: isStart || undefined,
        isFinished: isFinish || undefined,
        jobAssigned_TimeStamp: undefined, // not an assign here
        jobCreated_TimeStamp: new Date().toISOString(),
        jobFinished_TimeStamp: isFinish ? new Date().toISOString() : undefined,
        jobAssignedBy: undefined,
        jobFinishedBy: isFinish ? createdBy : undefined,
      }
    );

    toast.success(
      `Room ${room.code} marked ${housekeepingStatus}${
        attendantName ? ` (assigned to ${attendantName})` : ""
      }`
    );
    return true;
  };

  // ---- primary CTA logic: only Start or Complete ----
  const getPrimaryAction = (room: UIRoom) => {
    if (room.status === "WIP" || room.status === "Occupied") {
      return {
        label: "Complete",
        onClick: () => changeStatus(room, "Clean"),
        className:
          "h-10 w-full rounded-md bg-emerald-600 text-white hover:bg-emerald-700",
      };
    }
    return {
      label: "Start",
      onClick: () =>
        changeStatus(room, "WIP", {
          attendant: room.attendant ?? undefined,
          attendantId: room.attendantId ?? undefined,
        }),
      className:
        "h-10 w-full rounded-md bg-indigo-700 text-white hover:bg-indigo-800",
    };
  };

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    Clean: 0,
    Dirty: 0,
    Occupied: 0,
    WIP: 0,
  });

  useEffect(() => {
    const base: Record<string, number> = {
      Clean: 0,
      Dirty: 0,
      Occupied: 0,
      WIP: 0,
    };
    rooms.forEach((r) => {
      if (base[r.status] === undefined) base[r.status] = 0;
      base[r.status] += 1;
    });
    setStatusCounts(base);
  }, [rooms]);

  const cardBase =
    "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white text-black dark:bg-zinc-900 dark:text-white shadow-sm";

  const statusChipClasses = (status: string) => {
    switch (status) {
      case "Clean":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
      case "Dirty":
        return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
      case "Occupied":
        return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
      case "WIP":
        return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
      default:
        return "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200";
    }
  };

  const availabilityChipClasses = (avail: string) => {
    switch (avail) {
      case "Occupied":
        return "bg-amber-600/90 text-white";
      case "Available":
        return "bg-indigo-600/90 text-white";
      default:
        return "bg-zinc-200 text-zinc-800";
    }
  };

  const statusAccent = (status: string) => {
    switch (status) {
      case "Clean":
        return "border-l-4 border-l-emerald-500";
      case "Dirty":
        return "border-l-4 border-l-rose-500";
      case "Occupied":
        return "border-l-4 border-l-amber-500";
      case "WIP":
        return "border-l-4 border-l-sky-500";
      default:
        return "border-l-4 border-l-zinc-300";
    }
  };

  function normalizeStatus(raw: any): HKStatus {
    const s = (raw ?? "").toString().trim().toLowerCase();

    if (!s) return "Clean";
    if (s.includes("wip") || s.includes("in progress")) return "WIP";
    if (s.includes("dirty")) return "Dirty";
    if (s.includes("occupied") || s.startsWith("occu")) return "Occupied";
    if (s.includes("clean")) return "Clean";

    // fallback to original if nothing matched
    return (raw ?? "Clean") as HKStatus;
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4 bg-white text-black dark:bg-black ">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadRooms}
              disabled={!!loadingRooms}
            >
              {loadingRooms ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 dark:text-white">Refresh Rooms</span>
            </Button>

            <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground ml-2">
              <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                Clean {statusCounts["Clean"] ?? 0}
              </span>
              <span className="px-2 py-1 rounded bg-red-100 text-red-700">
                Dirty {statusCounts["Dirty"] ?? 0}
              </span>
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">
                Occupied {statusCounts["Occupied"] ?? 0}
              </span>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                WIP {statusCounts["WIP"] ?? 0}
              </span>
            </div>
          </div>

          <div className="w-full md:w-80">
            <Input
              placeholder="Search by room code / type / attendant"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {roomsError && (
          <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">
            {roomsError}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Clean">Clean</TabsTrigger>
            <TabsTrigger value="Dirty">Dirty</TabsTrigger>
            <TabsTrigger value="Occupied">Occupied</TabsTrigger>
            <TabsTrigger value="WIP">WIP</TabsTrigger>
            <TabsTrigger value="Available">Available</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loadingRooms ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 rounded-lg border border-gray-200 animate-pulse bg-gray-100/60 dark:bg-zinc-900"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground p-6 border rounded-lg">
                No rooms to show. Select a property or try a different
                tab/search.
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {filtered.map((room) => {
                  const action = getPrimaryAction(room);

                  const showPending =
                    room.status === "Dirty" ||
                    room.status === "Available" ||
                    room.status === "Pending";

                  const whenLabel =
                    room.availability === "Occupied"
                      ? "Checked-IN"
                      : "Checked-out";

                  return (
                    <Card
                      key={room.id}
                      className={`${cardBase} ${statusAccent(
                        room.status
                      )} p-4 flex flex-col h-[230px]`}
                    >
                      {/* Top chips row */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold truncate">
                          {room.code}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 whitespace-nowrap">
                          {room.type}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${statusChipClasses(
                            room.status
                          )}`}
                        >
                          {room.status}
                        </span>

                        <div className="ml-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() => {
                              setAssignRoom(room);
                              setAssignEmpId(room.attendantId ?? null);
                              setAssignOpen(true);
                            }}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>

                      {/* Attendant + Pending chip */}
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          HK Attendant:{" "}
                          <span className="font-medium">
                            {room.attendant ?? "—"}
                          </span>
                        </span>
                        {showPending && (
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-rose-600 text-white">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="mt-3 h-px bg-emerald-600/60" />

                      {/* Middle state */}
                      <div className="mt-3">
                        <div className="text-lg font-semibold">
                          {room.availability}
                        </div>
                        <div className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                          {room.checkedOutAt
                            ? `${whenLabel} at ${format(
                                new Date(room.checkedOutAt),
                                "M/d/yyyy h:mm:ss a"
                              )}`
                            : "—"}
                        </div>
                      </div>

                      {/* One full-width CTA at the bottom */}
                      <div className="mt-auto">
                        <button
                          onClick={action.onClick}
                          className={action.className}
                        >
                          {action.label}
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base">
                Assign a Housekeeping Attendant
              </DialogTitle>
              <div className="text-xs text-zinc-500 font-medium">
                {assignRoom?.code ?? ""}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm text-zinc-600" htmlFor="attendantSelect">
              Select an Attendant
            </label>

            <select
              id="attendantSelect"
              className="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={assignEmpId ?? ""}
              onChange={(e) => setAssignEmpId(Number(e.target.value))}
            >
              <option value="" disabled>
                Choose an attendant
              </option>
              {employeeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setAssignOpen(false)}
              className="px-5"
            >
              NO
            </Button>
            <Button
              className="px-5"
              onClick={async () => {
                if (!assignRoom || !assignEmpId) {
                  toast.error("Please select an attendant.");
                  return;
                }
                const attendantName = nameById(assignEmpId);

                // optimistic
                patchRoomLocal(assignRoom.id, {
                  attendant: attendantName,
                  attendantId: assignEmpId,
                });

                // persist (keep current status)
                await changeStatus(assignRoom, assignRoom.status, {
                  attendant: attendantName,
                  attendantId: assignEmpId,
                });

                // NEW: log the assignment action
                const createdBy = getCurrentUserIdentity();
                await dispatchHKLog(
                  dispatch,
                  {
                    roomNo: assignRoom.code,
                    createdBy,
                    status: assignRoom.status, // status unchanged on assign
                    attendantName,
                  },
                  {
                    jobAssigned_TimeStamp: new Date().toISOString(),
                    jobAssignedBy: createdBy,
                    remarks: "Assigned housekeeping attendant",
                  }
                );

                setAssignOpen(false);
              }}
            >
              ASSIGN
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

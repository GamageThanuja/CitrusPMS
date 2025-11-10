"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";

import {
  fetchRoomMas,
  type RoomMasItem,
  updateRoomHousekeepingStatus,
  selectRoomMas,
  selectRoomMasLoading,
  selectRoomMasError,
} from "@/redux/slices/roomMasSlice";

import {
  updateHousekeepingStatus,
  type UpdateHousekeepingPayload,
} from "@/redux/slices/housekeepingStatusSlice";

import {
  createHousekeepingLog,
  type CreateHousekeepingLogPayload,
} from "@/redux/slices/createHousekeepingLogSlice";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useAppSelector } from "@/redux/hooks";

// ===== Types =====
type HKStatus = "Clean" | "Dirty" | "Turn-down" | "Inspection" | "Occupied" | "WIP" | string;

type UIRoom = {
  id: number;
  code: string;
  type: string;
  status: HKStatus;
  availability: "Occupied" | "Available";
  attendant?: string | null;
};

// ===== Helpers =====
function getCurrentUserIdentity(): string {
  try {
    const tokens = localStorage.getItem("hotelmateTokens");
    if (!tokens) return "system";
    const parsed = JSON.parse(tokens);
    return parsed?.user?.email || parsed?.user?.userName || parsed?.username || parsed?.name || "system";
  } catch {
    return "system";
  }
}

function mapHousekeepingStatus(id: number | null): HKStatus {
  switch (id) {
    case 1:
      return "Clean";
    case 2:
      return "Dirty";
    case 3:
      return "Turn-down";
    case 4:
      return "Inspection";
    case 5:
      return "WIP"; // Dirty - WIP
    case 6:
    case 7:
      return "Occupied"; // Occu.-Clean / Occ-Dirty
    default:
      return "Clean";
  }
}

async function dispatchHKLog(
  dispatch: any,
  base: { roomNo: string; createdBy: string; status: HKStatus; attendantName?: string | null },
  extra?: Partial<CreateHousekeepingLogPayload>
) {
  const now = new Date().toISOString();
  const payload: CreateHousekeepingLogPayload = {
    roomNo: base.roomNo,
    hkLog: `HK: ${base.status}${base.attendantName ? ` (Attendant: ${base.attendantName})` : ""}`,
    createdBy: base.createdBy,
    status: base.status,
    housekeepingAttendant: base.attendantName ?? undefined,
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
    remarks: extra?.remarks,
    loggedBy: extra?.loggedBy,
  };

  const action = await dispatch(createHousekeepingLog(payload));
  if (createHousekeepingLog.rejected.match(action)) {
    toast.error(action.payload || "Failed to write housekeeping log.");
    return false;
  }
  return true;
}

// ===== Component =====
export default function HousekeepingPage() {
  const dispatch = useDispatch<any>();

  const roomsData: RoomMasItem[] = useAppSelector(selectRoomMas);
  const loadingRooms = useAppSelector(selectRoomMasLoading);
  const roomsError = useAppSelector(selectRoomMasError);

  const [rooms, setRooms] = useState<UIRoom[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [query, setQuery] = useState<string>("");
  const [filtered, setFiltered] = useState<UIRoom[]>([]);

  // Fetch rooms on mount
  useEffect(() => {
    dispatch(fetchRoomMas());
  }, [dispatch]);

  // Map RoomMasItem -> UIRoom using HouseKeepingStatusID
  useEffect(() => {
    const mapped: UIRoom[] = (roomsData || []).map((r) => {
      const status = mapHousekeepingStatus(r.houseKeepingStatusID);
      return {
        id: r.roomID,
        code: r.roomNumber,
        type: r.description || "—",
        status,
        availability: status === "Occupied" ? "Occupied" : "Available",
        attendant: r.assignTo ?? null,
      };
    });
    setRooms(mapped);
  }, [roomsData]);

  // Filter rooms based on tab & search query
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

  // Update room status
  const changeStatus = async (room: UIRoom, housekeepingStatus: HKStatus) => {
    const prev = { ...room };
    setRooms((rs) =>
      rs.map((r) =>
        r.id === room.id
          ? { ...r, status: housekeepingStatus, availability: housekeepingStatus === "Occupied" ? "Occupied" : "Available" }
          : r
      )
    );

    const payload: UpdateHousekeepingPayload = { id: room.id, housekeepingStatus } as any;
    const action = await dispatch(updateHousekeepingStatus(payload));

    if (updateHousekeepingStatus.rejected.match(action)) {
      setRooms((rs) => rs.map((r) => (r.id === room.id ? prev : r)));
      toast.error(action.payload || "Failed to update status");
      return;
    }

    const createdBy = getCurrentUserIdentity();
    await dispatchHKLog(dispatch, { roomNo: room.code, createdBy, status: housekeepingStatus });
    toast.success(`Room ${room.code} marked ${housekeepingStatus}`);
  };

  const cardBase = "rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white text-black dark:bg-zinc-900 dark:text-white shadow-sm";

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
      case "Turn-down":
        return "bg-purple-50 text-purple-700 ring-1 ring-purple-200";
      case "Inspection":
        return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200";
      default:
        return "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4 bg-white text-black dark:bg-black">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <Button variant="outline" onClick={() => dispatch(fetchRoomMas())} disabled={loadingRooms}>
            {loadingRooms ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 dark:text-white">Refresh Rooms</span>
          </Button>

          <div className="w-full md:w-80">
            <Input placeholder="Search by room code / type / attendant" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {roomsError && <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-md p-3">{roomsError}</div>}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-8 w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="Clean">Clean</TabsTrigger>
            <TabsTrigger value="Dirty">Dirty</TabsTrigger>
            <TabsTrigger value="Turn-down">Turn-down</TabsTrigger>
            <TabsTrigger value="Inspection">Inspection</TabsTrigger>
            <TabsTrigger value="WIP">WIP</TabsTrigger>
            <TabsTrigger value="Occupied">Occupied</TabsTrigger>
            <TabsTrigger value="Available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
            {loadingRooms ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-40 rounded-lg border border-gray-200 animate-pulse bg-gray-100/60 dark:bg-zinc-900" />
                ))}
            </div>
            ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground p-6 border rounded-lg">
                No rooms to show. Select a property or try a different tab/search.
            </div>
            ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {filtered.map((room) => (
                <Card key={room.id} className={`${cardBase} p-0 overflow-hidden min-h-[150px]`}>
                    <div className="flex items-center gap-2 p-3 pb-2 border-b-2 border-green-200">
                    <span className="text-base font-bold text-zinc-800 dark:text-zinc-200">{room.code}</span>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-600 text-white dark:bg-blue-700 whitespace-nowrap">{room.type}</span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${statusChipClasses(room.status)}`}>{room.status}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{room.availability}</div>
                    </div>
                </Card>
                ))}
            </div>
            )}
        </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
}

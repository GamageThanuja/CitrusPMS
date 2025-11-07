"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Pencil, RefreshCw, X } from "lucide-react";

import { fetchHotelRoomNumbers } from "@/redux/slices/fetchHotelRoomNumbersSlice";
import { updateHotelRoomNumber } from "@/redux/slices/updateHotelRoomNumberSlice";

import { updateHotelRoomType } from "@/redux/slices/updateHotelRoomTypeSlice";
import { fetchHotelRoomTypes } from "@/redux/slices/hotelRoomTypesSlice";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function RoomListDrawer({ isOpen, onClose }: Props) {
  const dispatch = useDispatch<any>();
  const { toast } = useToast();

  // Rooms
  const {
    data: rooms,
    loading: roomsLoading,
    error: roomsError,
  } = useSelector((s: RootState) => s.fetchHotelRoomNumbers);

  // Room Types (from your slice)
  const {
    data: roomTypes,
    loading: typesLoading,
    error: typesError,
  } = useSelector((s: RootState) => s.hotelRoomTypes);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftRoomNo, setDraftRoomNo] = useState<string>("");
  const [draftRoomTypeId, setDraftRoomTypeId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Optional: rename room type
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTypeId, setRenameTypeId] = useState<number | null>(null);
  const [renameText, setRenameText] = useState("");
  const [renaming, setRenaming] = useState(false);

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  // Load when opened
  useEffect(() => {
    if (!isOpen) return;
    dispatch(fetchHotelRoomNumbers());
    dispatch(fetchHotelRoomTypes());
  }, [isOpen, dispatch]);

  // Start/cancel edit
  const startEdit = (
    roomID: number,
    currentNo: string,
    currentTypeId?: number
  ) => {
    setEditingId(roomID);
    setDraftRoomNo(currentNo ?? "");
    setDraftRoomTypeId(currentTypeId ?? null);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraftRoomNo("");
    setDraftRoomTypeId(null);
  };

  // Update row (room number + type)
  const handleUpdate = async (roomID: number) => {
    const row = rooms.find((r) => r.roomID === roomID);
    if (!row) return;

    const trimmedNo = (draftRoomNo || "").trim();
    if (!trimmedNo) {
      toast({ title: "Room number is required", variant: "destructive" });
      return;
    }

    const nextTypeId = draftRoomTypeId ?? row.roomTypeID;
    const selectedType =
      roomTypes.find((t) => t.hotelRoomTypeID === nextTypeId) ||
      row.hotelRoomType;

    const payload = {
      roomID: row.roomID,
      hotelID: row.hotelID,
      roomTypeID: nextTypeId,
      roomNo: trimmedNo,
      finAct: row.finAct,
      createdOn: row.createdOn,
      createdBy: row.createdBy,
      // If API expects nested, pass it through:
      hotelRoomType: selectedType,
      // hotelMaster: row.hotelMaster,
    };

    try {
      setUpdatingId(roomID);
      await dispatch(updateHotelRoomNumber({ id: roomID, payload })).unwrap();
      toast({ title: "Room updated", description: `Saved successfully.` });
      cancelEdit();
      dispatch(fetchHotelRoomNumbers());
    } catch (e: any) {
      const msg =
        e?.data?.detail ||
        e?.data?.message ||
        e?.message ||
        "Failed to update room";
      toast({
        title: "Update failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Open rename selected type
  const openRename = () => {
    const typeId = draftRoomTypeId;
    if (typeId == null) return;
    const t = roomTypes.find((x) => x.hotelRoomTypeID === typeId);
    if (!t) return;
    setRenameTypeId(typeId);
    setRenameText(t.roomType || "");
    setRenameOpen(true);
  };

  // Save type rename (uses your updateHotelRoomType slice)
  const saveRename = async () => {
    if (renameTypeId == null) return;
    const t = roomTypes.find((x) => x.hotelRoomTypeID === renameTypeId);
    if (!t) return;

    const body = {
      hotelRoomTypeID: t.hotelRoomTypeID,
      hotelID: t.hotelID,
      roomType: (renameText || "").trim(),
      adultSpace: t.adultSpace,
      childSpace: t.childSpace,
      noOfRooms: t.noOfRooms,
      cmid: t.cmid,
      createdTimeStamp: t.createdTimeStamp,
      createdBy: t.createdBy,
      updatedBy: t.updatedBy ?? t.createdBy, // ensure non-null
      finAct: t.finAct,
      updatedTimeStamp: t.updatedTimeStamp ?? new Date().toISOString(),
      roomDescription: t.roomDescription ?? "",
    };

    if (!body.roomType) {
      toast({ title: "Type name is required", variant: "destructive" });
      return;
    }

    try {
      setRenaming(true);
      await dispatch(updateHotelRoomType(body)).unwrap();
      toast({ title: "Room type updated" });
      setRenameOpen(false);
      // Refresh the types to reflect new name
      dispatch(fetchHotelRoomTypes());
    } catch (e: any) {
      toast({
        title: "Failed to update room type",
        description: e?.message || "Update failed",
        variant: "destructive",
      });
    } finally {
      setRenaming(false);
    }
  };

  // Sorted rooms (numeric-aware)
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const ax = a.roomNo?.toString() ?? "";
      const bx = b.roomNo?.toString() ?? "";
      const na = parseInt(ax, 10);
      const nb = parseInt(bx, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return ax.localeCompare(bx);
    });
  }, [rooms]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl overflow-y-auto rounded-l-2xl p-0"
      >
        <SheetHeader className="p-6 border-b bg-gradient-to-b from-muted/40 to-background">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold">Room List</SheetTitle>
              <SheetDescription>
                View & edit room numbers inline.
              </SheetDescription>
            </div>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dispatch(fetchHotelRoomNumbers());
                dispatch(fetchHotelRoomTypes());
              }}
              disabled={roomsLoading || typesLoading}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  roomsLoading || typesLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button> */}
          </div>
        </SheetHeader>

        <div className="p-6">
          {(roomsError || typesError) && (
            <div className="mb-4 text-sm text-red-600">
              {typeof roomsError === "string" ? roomsError : null}
              {typeof typesError === "string" ? (
                <>
                  {roomsError ? " • " : null}
                  {typesError}
                </>
              ) : null}
            </div>
          )}

          {roomsLoading ? (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 w-full animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : sortedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border p-10 text-center">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                No rooms
              </Badge>
              <p className="text-sm text-muted-foreground">
                There are no rooms to display for this property.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead className="w-56 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRooms.map((r) => {
                    const isEditing = editingId === r.roomID;
                    const isUpdating = updatingId === r.roomID;
                    const currentTypeId = r?.roomTypeID;
                    const currentTypeName = r?.hotelRoomType?.roomType ?? "-";

                    return (
                      <TableRow
                        key={r.roomID}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        {/* Room Number (editable) */}
                        <TableCell>
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={draftRoomNo}
                              onChange={(e) => setDraftRoomNo(e.target.value)}
                              className="h-9 "
                              disabled={isUpdating}
                              placeholder="Enter room number"
                            />
                          ) : (
                            <div className="font-medium pl-4">
                              {r.roomNo || "-"}
                            </div>
                          )}
                        </TableCell>

                        {/* Room Type (dropdown while editing) */}
                        <TableCell>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={
                                  (
                                    draftRoomTypeId ?? currentTypeId
                                  )?.toString() ?? ""
                                }
                                onValueChange={(val) =>
                                  setDraftRoomTypeId(Number(val))
                                }
                                disabled={isUpdating || typesLoading}
                              >
                                <SelectTrigger className="w-[240px]">
                                  <SelectValue
                                    placeholder={
                                      typesLoading
                                        ? "Loading types…"
                                        : "Select type"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypes.map((t) => (
                                    <SelectItem
                                      key={t.hotelRoomTypeID}
                                      value={t.hotelRoomTypeID.toString()}
                                    >
                                      {t.roomType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Optional: rename selected type */}
                              {/* <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-xl"
                                onClick={openRename}
                                disabled={
                                  (draftRoomTypeId ?? currentTypeId) == null ||
                                  isUpdating ||
                                  typesLoading
                                }
                                title="Rename selected room type"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button> */}
                            </div>
                          ) : (
                            <Badge variant="outline" className="rounded-xl p-3">
                              {currentTypeName}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdate(r.roomID)}
                                disabled={isUpdating}
                                className="rounded-xl"
                              >
                                {isUpdating ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating…
                                  </>
                                ) : (
                                  "Update"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-xl"
                                onClick={cancelEdit}
                                disabled={isUpdating}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="rounded-xl gap-2"
                              onClick={() =>
                                startEdit(r.roomID, r.roomNo, r.roomTypeID)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Rename room type dialog */}
        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename room type</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                placeholder="Type name"
                disabled={renaming}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setRenameOpen(false)}
                disabled={renaming}
              >
                Cancel
              </Button>
              <Button onClick={saveRename} disabled={renaming}>
                {renaming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />

        <div className="top-10 right-10 absolute">
          <VideoButton
            onClick={() => setShowRawOverlay(true)}
            label="Watch Video"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

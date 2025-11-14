// src/app/whatever/RatesPage.tsx (or wherever this page lives)
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DollarSign, Edit, Filter, Plus, Search } from "lucide-react";
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
import { AddRateDrawer } from "@/components/drawers/add-rate-drawer";
import { EditRateDrawer } from "@/components/drawers/edit-rate-drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";

// ✅ Rate codes (already wired)
import {
  fetchRateCodes,
  selectRateCodes,
  selectRateCodesLoading,
  selectRateCodesError,
} from "@/redux/slices/fetchRateCodesSlice";

// ✅ Room types
import {
  fetchRoomTypeMas,
  selectRoomTypeMas,
  selectRoomTypeMasLoading,
  selectRoomTypeMasError,
} from "@/redux/slices/roomTypeMasSlice";

// ✅ NEW: Hotel Rate Plans 
import {
  fetchHotelRatePlans,
  selectHotelRatePlansItems,
  selectHotelRatePlansLoading,
  selectHotelRatePlansError,
} from "@/redux/slices/fetchHotelRatePlanSlice";

export default function RatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [rateToDisable, setRateToDisable] = useState<any | null>(null);
  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl] = useState<string>("");

  const dispatch = useDispatch<any>();

  // 🔹 Rate codes state (for later use)
  const rateCodes = useSelector(selectRateCodes);
  const rateCodesLoading = useSelector(selectRateCodesLoading);
  const rateCodesError = useSelector(selectRateCodesError);

  // 🔹 Room types (for room type names)
  const roomTypes = useSelector(selectRoomTypeMas);
  const roomTypesLoading = useSelector(selectRoomTypeMasLoading);
  const roomTypesError = useSelector(selectRoomTypeMasError);

  // 🔹 Hotel Rate Plans (THIS replaces RateMas)
  const hotelRatePlans = useSelector(selectHotelRatePlansItems);
  const hotelRatePlansLoading = useSelector(selectHotelRatePlansLoading);
  const hotelRatePlansError = useSelector(selectHotelRatePlansError);

  useEffect(() => {
    dispatch(fetchRateCodes());
    dispatch(fetchRoomTypeMas());
    dispatch(fetchHotelRatePlans()); // ✅ call your new API
  }, [dispatch]);

  console.log("rateCodes:", rateCodes, {
    rateCodesLoading,
    rateCodesError,
  });

  console.log("roomTypes:", roomTypes, {
    roomTypesLoading,
    roomTypesError,
  });

  console.log("hotelRatePlans:", hotelRatePlans, {
    hotelRatePlansLoading,
    hotelRatePlansError,
  });

  // i18n / labels
  const rates = useTranslatedText("Rates");
  const addRate = useTranslatedText("Add Rate");
  const search = useTranslatedText("Search");
  const filter = useTranslatedText("Filter");
  const noRates = useTranslatedText("No rates found");
  const ratePlanTitleText = useTranslatedText("Rate Plan Title");
  const sellModeText = useTranslatedText("Sell Mode");
  const rateModeText = useTranslatedText("Rate Mode");
  const actionsText = useTranslatedText("Actions");
  const addRateToGetStartedText = useTranslatedText(
    "Add a rate to get started"
  );

  // ✅ Use real RoomTypeMas for names
  const getRoomTypeName = (roomTypeId: number | null | undefined): string => {
    if (roomTypeId === null || roomTypeId === undefined) return "N/A";
    const roomType = roomTypes.find(
      (rt: any) => rt.roomTypeID === roomTypeId
    );
    return roomType
      ? roomType.roomType || roomType.shortCode || `ID: ${roomTypeId}`
      : `ID: ${roomTypeId}`;
  };

  // ✅ Group hotelRatePlans by roomTypeID
  const groupedRates = useMemo(() => {
    if (!hotelRatePlans || hotelRatePlans.length === 0) return {};

    const filtered = hotelRatePlans.filter((r: any) =>
      (r.title ?? "")
        .toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    return filtered.reduce((acc: Record<string | number, any[]>, rate: any) => {
      const roomTypeId = rate.roomTypeID;
      if (!acc[roomTypeId]) acc[roomTypeId] = [];
      acc[roomTypeId].push(rate);
      return acc;
    }, {});
  }, [hotelRatePlans, searchQuery]);

  const handleAddRateSubmit = (data: any) => {
    console.log("AddRateDrawer submitted data (no API call):", data);
    setIsAddDrawerOpen(false);
  };

  const handleEditRateOpen = (rate: any) => {
    setEditingRate(rate);
    setIsEditDrawerOpen(true);
  };

  const handleEditRateSubmit = (data: any) => {
    console.log("EditRateDrawer submitted data (no API call):", {
      data,
      editingRate,
    });
    setIsEditDrawerOpen(false);
    setEditingRate(null);
  };

  const handleDeactivateRate = (ratePlanID: number | string | undefined) => {
    console.log("Deactivate rate (no API call):", ratePlanID);
  };

  const headerTitle = "IBE Rates";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        {/* Top Heading + Actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{rates}</h1>
          <div className="flex flex-row">
            <div className="pr-4">
              <VideoButton
                onClick={() => setShowRawOverlay(true)}
                label="Watch Video"
              />
            </div>
            <Button onClick={() => setIsAddDrawerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {addRate}
            </Button>
          </div>
        </div>

        {/* Search + Filter Row */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`${search}...`}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            {filter}
          </Button>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>{rates}</CardTitle>
          </CardHeader>
          <CardContent>
            {hotelRatePlansLoading ? (
              <div className="flex justify-center items-center py-8">
                <p>Loading rate plans...</p>
              </div>
            ) : hotelRatePlansError ? (
              <div className="flex justify-center items-center py-8 text-red-600">
                <p>{hotelRatePlansError}</p>
              </div>
            ) : Object.keys(groupedRates).length > 0 ? (
              Object.entries(groupedRates).map(
                ([roomTypeId, ratesForRoomType]) => (
                  <div
                    key={roomTypeId}
                    className="mb-8 border-t-2 border-muted pt-6 first:pt-0 first:border-t-0"
                  >
                    <h2 className="text-xl font-semibold mb-3 border-b pb-2">
                      {getRoomTypeName(Number(roomTypeId))}
                    </h2>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{ratePlanTitleText}</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>{sellModeText}</TableHead>
                          <TableHead>{rateModeText}</TableHead>
                          <TableHead className="text-right">
                            {actionsText}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(ratesForRoomType as any[]).map((rate) => (
                          <TableRow key={rate.hotelRatePlanID}>
                            <TableCell>{rate.title ?? "N/A"}</TableCell>
                            <TableCell>{rate.currencyCode ?? "N/A"}</TableCell>
                            <TableCell>{rate.sellMode ?? "N/A"}</TableCell>
                            <TableCell>{rate.rateMode ?? "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleEditRateOpen(rate)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  className="px-3 py-1"
                                  onClick={() => {
                                    setRateToDisable(rate);
                                    setIsDisableModalOpen(true);
                                  }}
                                >
                                  Disable
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="mb-2 text-lg font-medium">{noRates}</p>
                <p className="text-sm text-muted-foreground">
                  {addRateToGetStartedText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawers */}
      <AddRateDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSubmit={handleAddRateSubmit}
      />
      {editingRate && (
        <EditRateDrawer
          isOpen={isEditDrawerOpen}
          initialData={editingRate}
          onClose={() => setIsEditDrawerOpen(false)}
          onSubmit={handleEditRateSubmit}
        />
      )}

      {/* Disable dialog */}
      <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Rate Plan</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to disable "{rateToDisable?.title}"?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDisableModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDeactivateRate(rateToDisable?.hotelRatePlanID);
                setIsDisableModalOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video overlay */}
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </DashboardLayout>
  );
}
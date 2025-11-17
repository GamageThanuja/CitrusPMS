"use client";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  fetchHotelRatePlans,
  selectHotelRatePlansItems,
  selectHotelRatePlansLoading,
  selectHotelRatePlansError,
} from "@/redux/slices/fetchHotelRatePlanSlice";
import {
  createHotelRatePlans,
  selectCreateHotelRatePlansLoading,
  selectCreateHotelRatePlansError,
  selectCreateHotelRatePlansSuccess,
  resetCreateHotelRatePlans,
} from "@/redux/slices/createHotelRatePlansSlice";

import {
  fetchRoomTypeMas,
  selectRoomTypeMas,
  selectRoomTypeMasLoading,
  selectRoomTypeMasError,
} from "@/redux/slices/roomTypeMasSlice";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function RatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [rateToDisable, setRateToDisable] = useState<any | null>(null);

  const dispatch = useAppDispatch();
  const roomTypes = useAppSelector(selectRoomTypeMas);
  const roomTypesLoading = useAppSelector(selectRoomTypeMasLoading);
  const roomTypesError = useAppSelector(selectRoomTypeMasError);
  
  // Hotel Rate Plans Redux state
  const ratesData = useAppSelector(selectHotelRatePlansItems);
  const ratesLoading = useAppSelector(selectHotelRatePlansLoading);
  const ratesError = useAppSelector(selectHotelRatePlansError);
  
  // Create Rate Plans state
  const createLoading = useAppSelector(selectCreateHotelRatePlansLoading);
  const createError = useAppSelector(selectCreateHotelRatePlansError);
  const createSuccess = useAppSelector(selectCreateHotelRatePlansSuccess);

  // Translation hooks called outside conditional blocks
  const rates = useTranslatedText("Rates");
  const addRate = useTranslatedText("Add Rate");
  const search = useTranslatedText("Search");
  const filter = useTranslatedText("Filter");
  const noRates = useTranslatedText("No rates found");
  const ratePlanTitleText = useTranslatedText("Rate Plan Title");
  const nameText = useTranslatedText("Name");
  const roomTypeText = useTranslatedText("Room Type");
  const basePriceText = useTranslatedText("Base Rate");
  const sellModeText = useTranslatedText("Sell Mode");
  const rateModeText = useTranslatedText("Rate Mode");
  const statusText = useTranslatedText("Status");
  const childRateText = useTranslatedText("Child Rate");
  const actionsText = useTranslatedText("Actions");
  const addRateToGetStartedText = useTranslatedText(
    "Add a rate to get started"
  );

  const [roomTypesData, setRoomTypesData] = useState<any[]>([]); // To store room type details
  
  // Combine loading states
  const loading = ratesLoading || createLoading;

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "roomsAndRates",
    "addRate"
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);


  useEffect(() => {
  dispatch(fetchRoomTypeMas());
}, [dispatch]);

  // ---- date helpers (yyyy-MM-dd -> ISO at start/end of that day UTC) ----
  function ymdToStartISO(ymd?: string): string | undefined {
    if (!ymd) return undefined;
    // Guards bad strings and preserves consistency
    const d = new Date(`${ymd}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  function ymdToEndISO(ymd?: string): string | undefined {
    if (!ymd) return undefined;
    const d = new Date(`${ymd}T23:59:59.999Z`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

const fetchData = useCallback(async () => {
  try {
    // Dispatch Redux action to fetch rates
    dispatch(fetchHotelRatePlans());
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddRateSubmit = async (data: any) => {
    console.log("Submitting new rate data:", data);
    try {
      // Reset previous state
      dispatch(resetCreateHotelRatePlans());
      
      // Dispatch create action
      const result = await dispatch(createHotelRatePlans(data));
      
      if (createHotelRatePlans.fulfilled.match(result)) {
        setIsAddDrawerOpen(false);
        await fetchData();
      }
    } catch (error) {
      console.error("Error adding rate:", error);
    }
  };

  const handleEditRateOpen = (rate: any) => {
    setEditingRate(rate);
    setIsEditDrawerOpen(true);
  };

  /** Build API payload for create/update HotelRatePlan
   * - Works for both Per Room, and Per Person (Manual/Auto)
   * - Uses your sample structure with nested hotelMaster/rateCode/hotelRoomType/mealPlanMaster
   */
  function buildRatePlanUpdatePayload(formData: any, initialData: any) {
    // ---- read current context ----
    const propertyString = localStorage.getItem("selectedProperty");
    const tokensString = localStorage.getItem("hotelmateTokens");
    const property = propertyString ? JSON.parse(propertyString) : null;
    const tokens = tokensString ? JSON.parse(tokensString) : null;

    const numOrNull = (v: any) =>
      v === "" || v === null || v === undefined || isNaN(Number(v))
        ? null
        : Number(v);

    const uiFromISO = ymdToStartISO(formData.dateFrom);
    const uiToISO = ymdToEndISO(formData.dateTo);

    const dateFrom =
      uiFromISO ||
      initialData?.dateFrom ||
      initialData?.rateDate ||
      new Date().toISOString();

    const dateTo =
      uiToISO ||
      initialData?.dateTo ||
      new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString();

    const hotelID = Number(property?.id ?? initialData?.hotelID ?? 0);
    const username =
      tokens?.user?.userName ||
      tokens?.user?.email ||
      tokens?.user?.name ||
      "system";

    // ---- helpers ----
    const num = (v: any, fallback = 0) =>
      v === "" || v === null || v === undefined || isNaN(Number(v))
        ? fallback
        : Number(v);

    const iso = (d?: string) =>
      d ? new Date(d).toISOString() : new Date().toISOString();

    // pax1..pax18 mapping
    const pax: Record<string, number | null> = {};
    if (formData.sellMode === "Per Person" && formData.rateMode === "Manual") {
      // Manual: use only what user typed; others are null
      for (let i = 1; i <= 18; i++) {
        const key = `rateFor${i}`; // drawer field name
        pax[`pax${i}`] = numOrNull(formData[key]); // number or null
      }
    } else {
      // Per Room or Per Person / Auto: all null (backend derives from defaultRate/increaseBy/decreaseBy)
      for (let i = 1; i <= 18; i++) {
        pax[`pax${i}`] = null;
      }
    }

    // childrenFee maps to both child & childRate in some backends
    const childFee = numOrNull(formData.childrenFee);

    const primaryOcc = num(formData.primaryOccupancy, 1);

    // Compose a safe title if missing
    const safeTitle =
      initialData?.title ||
      `${formData.rateCode || "Rate"} - ${
        initialData?.mealPlanShort || formData.mealPlanID || ""
      }`.trim();

    // Final payload (matches your sample)
    const payload = {
      recordID: initialData?.recordID ?? 0,
      hotelRatePlanID: initialData?.hotelRatePlanID, // REQUIRED for updates
      defaultRate: num(formData.defaultRate, 0),
      ...pax,
      child: childFee,
      dateFrom, // <- now from drawer if provided
      dateTo,
      sellMode: formData.sellMode,
      rateMode: formData.rateMode,
      roomTypeID: num(formData.roomTypeID),
      primaryOccupancy: primaryOcc,
      increaseBy: num(formData.increaseBy, 0),
      decreaseBy: num(formData.decreaseBy, 0),
      hotelID,
      rateCodeID: num(formData.rateCodeID),
      mealPlanID: num(formData.mealPlanID),
      currencyCode: formData.currencyCode,
      childRate: childFee,
      createdOn: new Date().toISOString(),
      createdBy: username,
      title: safeTitle,

      hotelMaster: {
        hotelID,
      },
      rateCode: {
        rateCodeID: num(formData.rateCodeID),
      },
      hotelRoomType: {
        hotelRoomTypeID: num(formData.roomTypeID),
        hotelID,
      },
      mealPlanMaster: {
        mealPlanID: num(formData.mealPlanID),
      },
      cmid: initialData?.cmid ?? "string",
    };

    return payload;
  }

  const handleEditRateSubmit = async (data: any) => {
    if (!editingRate) return;
    try {
      const tokensString = localStorage.getItem("hotelmateTokens");
      if (!tokensString) throw new Error("Authentication tokens not found.");
      const tokens = JSON.parse(tokensString);
      const accessToken = tokens.accessToken;

      // Build the correct payload using the current form + the row being edited
      const payload = buildRatePlanUpdatePayload(data, editingRate);

      // IMPORTANT: Use the single endpoint with isUpdate=true (not PUT /{id})
      const resp = await fetch(`${BASE_URL}/api/HotelRatePlans?isUpdate=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(
          `Update failed: ${resp.status} ${resp.statusText} - ${errText}`
        );
      }

      // Close + refresh
      setIsEditDrawerOpen(false);
      setEditingRate(null);
      await fetchData();
    } catch (error) {
      console.error("Error editing rate:", error);
      alert(String(error));
    }
  };
  const handleDeactivateRate = async (
    ratePlanID: number | string | undefined
  ) => {
    if (!ratePlanID) return;
    if (
      !confirm(
        `Are you sure you want to deactivate rate plan ID: ${ratePlanID}?`
      )
    )
      return;
    console.log(`Attempting to deactivate rate plan with ID: ${ratePlanID}`);
    // TODO: Implement API call to deactivate the rate plan
    alert(
      `Rate Plan ID: ${ratePlanID} would be deactivated. API call not yet implemented.`
    );
  };

  const handleDeleteRate = async (ratePlanID: number | string | undefined) => {
    if (
      !ratePlanID ||
      !confirm(`Are you sure you want to delete rate plan ID: ${ratePlanID}?`)
    ) {
      return;
    }
    console.log(`Attempting to delete rate plan with ID: ${ratePlanID}`);

    alert(
      `Rate Plan ID: ${ratePlanID} would be deleted. API call is commented out.`
    );
  };

const getRoomTypeName = (roomTypeId: number | null | undefined): string => {
  if (roomTypeId === null || roomTypeId === undefined) return "N/A";
  const rt = roomTypes.find((x) => x.roomTypeID === roomTypeId);
  return rt ? rt.roomType ?? `ID: ${roomTypeId}` : `ID: ${roomTypeId}`;
};

  const groupedRates = useMemo(() => {
    if (!ratesData || ratesData.length === 0) {
      return {};
    }
    const filteredRates = ratesData.filter((rate) =>
      rate.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filteredRates.reduce((acc, rate) => {
      const roomTypeId = rate.roomTypeID;
      if (!acc[roomTypeId]) {
        acc[roomTypeId] = [];
      }
      acc[roomTypeId].push(rate);
      return acc;
    }, {} as Record<string | number, any[]>);
  }, [ratesData, searchQuery]);

  console.log("group rates : ", groupedRates);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
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

        <Card>
          <CardHeader>
            <CardTitle>{rates}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <p>Loading rates...</p>{" "}
                {/* You can replace this with a spinner component */}
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
                          {/* <TableHead>{basePriceText}</TableHead>
                          <TableHead>{childRateText}</TableHead> */}
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
                            {/* <TableCell>
                              {rate.defaultRate
                                ? `$${Number(rate.defaultRate).toFixed(2)}`
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {rate.childRate !== null &&
                              rate.childRate !== undefined
                                ? `$${Number(rate.childRate).toFixed(2)}`
                                : "N/A"}
                            </TableCell> */}
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
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </DashboardLayout>
  );
}
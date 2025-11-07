"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Importing switch
import { Pencil, Loader2, DeleteIcon, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getAdminAllHotels } from "@/controllers/adminAllHotelsController";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useDispatch, useSelector } from "react-redux";
import {
  createHotelImage,
  resetHotelImageState,
} from "@/redux/slices/hotelImageSlice";

import { fetchHotelImagesByHotelId } from "@/redux/slices/fetchHotelImageSlice";
import { updateHotelImage } from "@/redux/slices/updateHotelImageSlice";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { RootState } from "@/redux/store";
import Image from "next/image";
import { MapIframe } from "../mapIframe";
import { MapPicker } from "../mapPicker";
import { deleteHotelImage } from "@/redux/slices/deleteHotelImageSlice";
import {
  fetchHotelMealAllocations,
  selectHotelMealAllocations,
} from "@/redux/slices/fetchHotelMealAllocationSlice";
import {
  createHotelMealAllocation,
  selectCreateHotelMealAllocation,
  resetCreateHotelMealAllocationState,
} from "@/redux/slices/createHotelMealAllocationSlice";
import {
  updateHotelMealAllocation,
  selectUpdateHotelMealAllocation,
  resetUpdateHotelMealAllocationState,
} from "@/redux/slices/updateHotelMealAllocationSlice";
import {
  deleteHotelMealAllocation,
  selectDeleteHotelMealAllocation,
  resetDeleteHotelMealAllocationState,
} from "@/redux/slices/deleteHotelMealAllocationSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { getIpgSettings, upsertIpgSettings } from "@/controllers/ipgController";
import TaxesTab from "./taxesTab";
import CurrencyTab from "./currencyTab";
import ThemeTab from "./themeTab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  selectHotelIPGs,
  selectHotelIPGsLoading,
  selectHotelIPGsError,
  fetchHotelIPGsByHotel,
} from "@/redux/slices/fetchHotelIPGSlice";
import { createHotelIPG } from "@/redux/slices/createHotelIPGSlice";
import { updateHotelIPG } from "@/redux/slices/updateHotelIPGSlice";
import { deleteHotelIPG } from "@/redux/slices/deleteHotelIPGSlice";
import { Badge } from "@/components/ui/badge";
import { IPGTab } from "./iPGTab";
import HotelLogoTab from "./hotelLogoTab";

export interface HotelImage {
  imageID: number;
  hotelID: number;
  imageFileName: string;
  description: string;
  isMain: boolean;
  finAct: boolean;
  createdOn: string;
  createdBy: string;
  updatedOn: string;
  updatedBy: string;
  base64Image: string;
}

type Currency = "USD" | "LKR";

export interface PaymentGatewaySetting {
  hotelID: number;
  isActive: boolean;
  ipgBankName: string; // e.g. HNB
  ipgName: string; // e.g. CYBERSOURCE
  merchantIdUSD: string;
  profileIdUSD: string;
  accessKeyUSD: string;
  secretKeyUSD: string;
  merchantIdLKR: string;
  profileIdLKR: string;
  accessKeyLKR: string;
  secretKeyLKR: string;
}

const emptyIpg: PaymentGatewaySetting = {
  hotelID: 0,
  isActive: false,
  ipgBankName: "",
  ipgName: "",
  merchantIdUSD: "",
  profileIdUSD: "",
  accessKeyUSD: "",
  secretKeyUSD: "",
  merchantIdLKR: "",
  profileIdLKR: "",
  accessKeyLKR: "",
  secretKeyLKR: "",
};

export default function PropertyDetailTab({
  mapLoaded,
}: {
  mapLoaded: boolean;
}) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [hotelData, setHotelData] = useState<any>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageDescription, setImageDescription] = useState("");
  const [isMainImage, setIsMainImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [hotelImages, setHotelImages] = useState<HotelImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<HotelImage | null>(null);
  const { fullName } = useUserFromLocalStorage();
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [mainImageId, setMainImageId] = useState<number | null>(null);
  const [ipg, setIpg] = useState<PaymentGatewaySetting>(emptyIpg);
  const [ipgEditing, setIpgEditing] = useState(false);
  const [ipgSaving, setIpgSaving] = useState(false);
  const [ipgLoading, setIpgLoading] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<
    { name: string; base64: string; preview: string }[]
  >([]);

  const fileToDataUrl = (file: File) =>
    new Promise<{ name: string; base64: string; preview: string }>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve({
            name: file.name,
            base64: result.split(",")[1], // strip data:image/...;base64,
            preview: result,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    );

  const [mealForm, setMealForm] = useState({
    id: 0, // used when editing
    breakfast: "0",
    lunch: "0",
    dinner: "0",
    currencyCode: hotelData?.currencyCode || "USD",
    ai: false, // show as boolean; send 0/1 to API
  });
  const [mode, setMode] = useState<"create" | "edit">("create");

  const mealListStateRaw = useSelector(selectHotelMealAllocations) as any;
  const mealListState = mealListStateRaw ?? {
    data: [],
    status: "idle",
    error: null,
  };
  console.log("mealListStateRaw : ", mealListStateRaw);

  const createStateRaw = useSelector(selectCreateHotelMealAllocation) as any;
  const createState = createStateRaw ?? {
    data: null,
    status: "idle",
    error: null,
  };

  const updateStateRaw = useSelector(selectUpdateHotelMealAllocation) as any;
  const updateState = updateStateRaw ?? {
    data: null,
    status: "idle",
    error: null,
  };

  const deleteStateRaw = useSelector(selectDeleteHotelMealAllocation) as any;
  const deleteState = deleteStateRaw ?? {
    deletedId: null,
    status: "idle",
    error: null,
  };
  const mealDispatch = useDispatch();

  // Load allocations when hotel is known
  useEffect(() => {
    if (hotelData?.hotelID) {
      mealDispatch(fetchHotelMealAllocations() as any);
    }
  }, [mealDispatch, hotelData?.hotelID]);

  // When hotel currency changes (e.g., user changed localization tab), reflect on form (only when creating)
  useEffect(() => {
    if (mode === "create" && hotelData?.currencyCode) {
      setMealForm((f) => ({
        ...f,
        currencyCode: hotelData.currencyCode || "USD",
      }));
    }
  }, [hotelData?.currencyCode, mode]);

  // Reset create/update slice success to keep UI clean
  useEffect(() => {
    if (
      createState.status === "succeeded" ||
      updateState.status === "succeeded"
    ) {
      setMode("create");
      setMealForm({
        id: 0,
        breakfast: "0",
        lunch: "0",
        dinner: "0",
        currencyCode: hotelData?.currencyCode || "USD",
        ai: false,
      });
      mealDispatch(resetCreateHotelMealAllocationState());
      mealDispatch(resetUpdateHotelMealAllocationState());
      mealDispatch(fetchHotelMealAllocations() as any);
    }
  }, [
    createState.status,
    updateState.status,
    hotelData?.currencyCode,
    mealDispatch,
  ]);

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(
    (state: any) => state.hotelImage
  );

  const { images } = useSelector((state: RootState) => state.fetchHotelImage);

  useEffect(() => {
    if (hotelData?.hotelID) {
      dispatch(fetchHotelImagesByHotelId(hotelData.hotelID) as any);
    }
  }, [dispatch, hotelData?.hotelID]);

  useEffect(() => {
    if (Array.isArray(images) && images.length > 0) {
      const currentMain = images.find((it: HotelImage) => it.isMain);
      setMainImageId(currentMain ? currentMain.imageID : null);
    } else {
      setMainImageId(null);
    }
  }, [images]);

  const handleSaveMainImage = async () => {
    if (!Array.isArray(images) || images.length === 0) return;

    // Find currently-marked main on server and the newly-selected one
    const prevMain = images.find((it: HotelImage) => it.isMain);
    const newMain = images.find((it: HotelImage) => it.imageID === mainImageId);

    // Nothing changed → no-op
    if ((prevMain?.imageID ?? null) === (newMain?.imageID ?? null)) return;

    // We will flip prevMain.isMain -> false and newMain.isMain -> true (PUT each)
    const updates: Promise<any>[] = [];

    if (prevMain) {
      updates.push(
        (
          dispatch(
            updateHotelImage({
              ...prevMain,
              isMain: false,
              updatedBy: fullName,
              base64Image: prevMain.base64Image, // keep existing
            } as HotelImage)
          ) as any
        ).unwrap()
      );
    }

    if (newMain) {
      updates.push(
        (
          dispatch(
            updateHotelImage({
              ...newMain,
              isMain: true,
              updatedBy: fullName,
              base64Image: newMain.base64Image, // keep existing
            } as HotelImage)
          ) as any
        ).unwrap()
      );
    }

    await Promise.all(updates);
    await (dispatch(fetchHotelImagesByHotelId(hotelData.hotelID)) as any);
  };

  console.log("hotel images : ", images);

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // if user is editing a single image, respect that path (first file only)
    if (selectedImage && files.length === 1) {
      const { base64, preview } = await fileToDataUrl(files[0]);
      setImageBase64(base64);
      setImagePreview(preview);
      return;
    }

    // bulk mode
    const items = await Promise.all(files.map(fileToDataUrl));
    setBulkFiles(items);

    // keep single-image preview populated with the first item for backward UI bits
    setImageBase64(items[0].base64);
    setImagePreview(items[0].preview);
  };

  const handleImageUpload = async () => {
    if (!hotelData?.hotelID) return;

    // ---- BULK MODE ----
    if (!selectedImage && bulkFiles.length > 0) {
      const now = new Date().toISOString();

      try {
        await Promise.allSettled(
          bulkFiles.map((f, idx) =>
            (
              dispatch(
                createHotelImage({
                  imageID: 0,
                  imageFileName: `hotel-image-${Date.now()}-${idx}-${f.name}`,
                  description: imageDescription, // apply same description to all (optional)
                  isMain: isMainImage && bulkFiles.length === 1, // only allow main if exactly one
                  finAct: false,
                  createdOn: now,
                  createdBy: fullName,
                  updatedBy: fullName,
                  base64Image: f.base64,
                  hotelID: hotelData.hotelID,
                } as HotelImage)
              ) as any
            ).unwrap()
          )
        );

        clearImageForm();
        await (dispatch(fetchHotelImagesByHotelId(hotelData.hotelID)) as any);
      } catch (e) {
        console.error("Bulk upload failed:", e);
      }
      return;
    }

    // ---- SINGLE (existing behavior: create or update) ----
    if (!imageBase64) return;

    const now = new Date().toISOString();
    const payload = {
      imageID: selectedImage?.imageID ?? 0,
      imageFileName:
        selectedImage?.imageFileName || `hotel-image-${Date.now()}.jpg`,
      description: imageDescription,
      isMain: isMainImage,
      finAct: false,
      createdOn: selectedImage?.createdOn ?? now,
      createdBy: fullName,
      updatedBy: fullName,
      base64Image: imageBase64,
      hotelID: hotelData.hotelID,
    };

    try {
      if (selectedImage) {
        await (dispatch(updateHotelImage(payload)) as any).unwrap();
      } else {
        await (dispatch(createHotelImage(payload)) as any).unwrap();
      }
      clearImageForm();
      await (dispatch(fetchHotelImagesByHotelId(hotelData.hotelID)) as any);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (success) {
      setImageBase64("");
      setImagePreview("");
      setImageDescription("");
      setIsMainImage(false);
      dispatch(resetHotelImageState());
    }
  }, [success, dispatch]);

  const clearImageForm = () => {
    setSelectedImage(null);
    setImageBase64("");
    setImagePreview("");
    setImageDescription("");
    setIsMainImage(false);
    setBulkFiles([]);
  };

  useEffect(() => {
    if (selectedImage) {
      setImageBase64(selectedImage.base64Image);
      setImageDescription(selectedImage.description || "");
      setIsMainImage(selectedImage.isMain);
      setImagePreview(`data:image/jpeg;base64,${selectedImage.base64Image}`);
    }
  }, [selectedImage]);

  // useEffect(() => {
  //   const fetchPropertyDetails = async () => {
  //     const selectedProperty = localStorage.getItem("selectedProperty");
  //     const tokenData = localStorage.getItem("hotelmateTokens");

  //     if (!selectedProperty || !tokenData) {
  //       console.error("No selected property or token found in localStorage.");
  //       return;
  //     }

  //     try {
  //       const { guid } = JSON.parse(selectedProperty);
  //       const { accessToken } = JSON.parse(tokenData);

  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       });

  //       if (!response.ok) throw new Error("Failed to fetch hotels");

  //       const hotels = await response.json();
  //       const selectedHotel = hotels.find((hotel: any) => hotel.hotelGUID === guid);

  //       if (selectedHotel) {
  //         setHotelData(selectedHotel);
  //       } else {
  //         console.error("Selected property not found in the hotel list.");
  //       }
  //     } catch (error) {
  //       console.error("Error fetching property details:", error);
  //     }
  //   };

  //   fetchPropertyDetails();
  // }, []);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      const selectedProperty = localStorage.getItem("selectedProperty");
      const tokenData = localStorage.getItem("hotelmateTokens");

      if (!selectedProperty || !tokenData) {
        console.error("No selected property or token found in localStorage.");
        return;
      }

      try {
        const { guid } = JSON.parse(selectedProperty);
        const { accessToken } = JSON.parse(tokenData);

        // Call your helper instead of fetch
        const hotels = await getAdminAllHotels({ token: accessToken });

        const selectedHotel = hotels.find((hotel) => hotel.hotelGUID === guid);

        if (selectedHotel) {
          setHotelData(selectedHotel);
        } else {
          console.error("Selected property not found in the hotel list.");
        }
      } catch (error) {
        console.error("Error fetching property details:", error);
      }
    };

    fetchPropertyDetails();
  }, []);

  useEffect(() => {
    if (
      mapLoaded &&
      window.google?.maps &&
      mapRef.current &&
      hotelData.latitude &&
      hotelData.longitude
    ) {
      const { maps } = window.google;
      const center = {
        lat: parseFloat(hotelData.latitude),
        lng: parseFloat(hotelData.longitude),
      };
      const map = new maps.Map(mapRef.current, { center, zoom: 15 });
      const marker = new maps.Marker({
        position: center,
        map,
        draggable: true,
      });

      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          setHotelData((prev: any) => ({
            ...prev,
            latitude: pos.lat(),
            longitude: pos.lng(),
          }));
        }
      });
    }
  }, [mapLoaded, hotelData.latitude, hotelData.longitude]);

  const handleInputChange = (field: string, value: any) => {
    setHotelData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const markDeleting = (id: number, on: boolean) =>
    setDeletingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  console.log("images : ", images);

  const hasAllocations =
    Array.isArray(mealListState?.data) && mealListState.data.length > 0;

  const createLocked = mode === "create" && hasAllocations;

  // Load IPG when hotel known
  useEffect(() => {
    const run = async () => {
      if (!hotelData?.hotelID) return;
      const tokenData = localStorage.getItem("hotelmateTokens");
      const accessToken = tokenData ? JSON.parse(tokenData).accessToken : "";
      if (!accessToken) return;

      setIpgLoading(true);
      try {
        const data = await getIpgSettings(hotelData.hotelID, accessToken);
        setIpg({
          hotelID: hotelData.hotelID,
          isActive: !!data?.isActive,
          ipgBankName: data?.ipgBankName ?? "HNB",
          ipgName: data?.ipgName ?? "CYBERSOURCE",
          merchantIdUSD: data?.merchantIdUSD ?? "",
          profileIdUSD: data?.profileIdUSD ?? "",
          accessKeyUSD: data?.accessKeyUSD ?? "",
          secretKeyUSD: data?.secretKeyUSD ?? "",
          merchantIdLKR: data?.merchantIdLKR ?? "",
          profileIdLKR: data?.profileIdLKR ?? "",
          accessKeyLKR: data?.accessKeyLKR ?? "",
          secretKeyLKR: data?.secretKeyLKR ?? "",
        });
      } catch (e) {
        console.error("Load IPG failed", e);
        setIpg({ ...emptyIpg, hotelID: hotelData.hotelID });
      } finally {
        setIpgLoading(false);
      }
    };
    run();
  }, [hotelData?.hotelID]);

  const saveIpg = async () => {
    const tokenData = localStorage.getItem("hotelmateTokens");
    const accessToken = tokenData ? JSON.parse(tokenData).accessToken : "";
    if (!accessToken || !hotelData?.hotelID) return;

    setIpgSaving(true);
    try {
      await upsertIpgSettings(
        { ...ipg, hotelID: hotelData.hotelID },
        accessToken
      );
      setIpgEditing(false);
    } catch (e) {
      console.error("Save IPG failed", e);
    } finally {
      setIpgSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Property Details</CardTitle>
        {!isEditingDetails ? (
          <Button size="sm" onClick={() => setIsEditingDetails(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingDetails(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                // Save main image selection first
                try {
                  await handleSaveMainImage();
                } catch (e) {
                  console.error("Saving main image failed:", e);
                }
                setIsEditingDetails(false);
              }}
            >
              Save
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="propertyInfo" className="w-full ">
          <TabsList className="mb-4 flex flex-wrap gap-2 justify-start">
            <TabsTrigger value="propertyInfo">Property Info</TabsTrigger>
            {/* <TabsTrigger value="contact">Contact</TabsTrigger> */}
            <TabsTrigger value="location">Location</TabsTrigger>

            <TabsTrigger value="channel">Channel Manager</TabsTrigger>
            <TabsTrigger value="system">System Metadata</TabsTrigger>
            <TabsTrigger value="image">Property Image</TabsTrigger>
            <TabsTrigger value="meal">Meal Allocation</TabsTrigger>
            <TabsTrigger value="ipg">Payment Gateway</TabsTrigger>
            <TabsTrigger value="taxes">Taxes</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="theme">Theme</TabsTrigger>
            <TabsTrigger value="logo">Hotel Logo</TabsTrigger>
          </TabsList>

          <TabsContent value="propertyInfo">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Hotel Name"
                value={hotelData.hotelName}
                onChange={(val) => handleInputChange("hotelName", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Hotel Type"
                value={hotelData.hotelType}
                onChange={(val) => handleInputChange("hotelType", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Star Category"
                value={hotelData.starCatgeory}
                onChange={(val) => handleInputChange("starCatgeory", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Number of Rooms"
                type="number"
                value={hotelData.noOfRooms}
                onChange={(val) => handleInputChange("noOfRooms", val)}
                editable={isEditingDetails}
              />
              <SwitchField
                label="On Trial"
                checked={hotelData.isOnTrial}
                onChange={(val) => handleInputChange("isOnTrial", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Plan"
                type="number"
                value={hotelData.planId}
                onChange={(val) => handleInputChange("planId", val)}
                editable={isEditingDetails}
              />
            </div>
            <div className="py-6">
              <div className="w-full h-[0.2px]  dark:bg-slate-400 " />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <InputField
                label="Hotel Address"
                value={hotelData.hotelAddress}
                onChange={(val) => handleInputChange("hotelAddress", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="City"
                value={hotelData.city}
                onChange={(val) => handleInputChange("city", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Zip Code"
                value={hotelData.zipCode}
                onChange={(val) => handleInputChange("zipCode", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Country"
                value={hotelData.country}
                onChange={(val) => handleInputChange("country", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Hotel Phone"
                value={hotelData.hotelPhone}
                onChange={(val) => handleInputChange("hotelPhone", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Hotel Email"
                value={hotelData.hotelEmail}
                onChange={(val) => handleInputChange("hotelEmail", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Hotel Website"
                value={hotelData.hotelWeb}
                onChange={(val) => handleInputChange("hotelWeb", val)}
                editable={isEditingDetails}
              />
            </div>
            <div className="py-6">
              <div className="w-full h-[0.2px] dark:bg-slate-400 " />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Home Currency"
                value={hotelData.currencyCode}
                onChange={(val) => handleInputChange("currencyCode", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Language Code"
                value={hotelData.languageCode}
                onChange={(val) => handleInputChange("languageCode", val)}
                editable={isEditingDetails}
              />
            </div>
          </TabsContent>

          {/* <TabsContent value="contact">
            
          </TabsContent> */}

          <TabsContent value="location">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Latitude"
                type="number"
                value={hotelData.latitude}
                onChange={(val) => handleInputChange("latitude", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="Longitude"
                type="number"
                value={hotelData.longitude}
                onChange={(val) => handleInputChange("longitude", val)}
                editable={isEditingDetails}
              />

              <div className="md:col-span-2 space-y-2">
                <Label>Location on Map</Label>

                {isEditingDetails ? (
                  mapLoaded && window.google?.maps ? (
                    <MapPicker
                      lat={hotelData.latitude}
                      lng={hotelData.longitude}
                      onChange={({ lat, lng }) =>
                        setHotelData((prev: any) => ({
                          ...prev,
                          latitude: lat,
                          longitude: lng,
                        }))
                      }
                      height={500} // <- compact editor size
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Map is loading… ensure Google Maps script is loaded.
                    </p>
                  )
                ) : (
                  <MapIframe
                    lat={hotelData.latitude}
                    lng={hotelData.longitude}
                    height={500} // <- smaller read-only preview
                  />
                )}

                <p className="text-xs text-muted-foreground">
                  {isEditingDetails
                    ? "Drag the pin to update the coordinates."
                    : "Read-only preview."}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="CM Property ID"
                value={hotelData.cM_PropertyID}
                onChange={(val) => handleInputChange("cM_PropertyID", val)}
                editable={isEditingDetails}
              />
              <InputField
                label="CM Active"
                value={hotelData.isCMActive ? "Yes" : "No"}
                disabled
              />
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Created On"
                value={hotelData.createdOn}
                disabled
              />
              <InputField
                label="Created Timestamp"
                value={hotelData.createdTimeStamp}
                disabled
              />
              <InputField
                label="Last Updated On"
                value={hotelData.lastUpdatedOn}
                disabled
              />
              <InputField
                label="Last Updated Timestamp"
                value={hotelData.lastUpdatedTimeStamp}
                disabled
              />
              <InputField
                label="Last Updated By (User GUID)"
                value={hotelData.lastUpdatedBy_UserGUID}
                disabled
              />
            </div>
          </TabsContent>

          <TabsContent value="image">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload */}
                <div className="space-y-3">
                  <Label className="text-lg">Upload Property Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileChange}
                  />

                  {bulkFiles.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-2">
                        {bulkFiles.length} file{bulkFiles.length > 1 ? "s" : ""}{" "}
                        selected
                      </div>
                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                        {bulkFiles.map((f, i) => (
                          <img
                            key={i}
                            src={f.preview}
                            alt={f.name}
                            className="rounded-md border w-full aspect-[4/3] object-cover"
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBulkFiles([])}
                          disabled={loading}
                        >
                          Clear selection
                        </Button>
                      </div>
                    </div>
                  )}

                  <Textarea
                    placeholder="Image description"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    disabled={!isEditingDetails}
                  />

                  {/* Removed the Main switch here to avoid conflicts with radio main */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleImageUpload}
                      disabled={!imageBase64 || loading}
                    >
                      {selectedImage
                        ? loading
                          ? "Updating..."
                          : "Update Image"
                        : loading
                        ? "Uploading..."
                        : "Upload Image"}
                    </Button>

                    {selectedImage && (
                      <Button
                        variant="outline"
                        onClick={clearImageForm}
                        disabled={!isEditingDetails}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </div>

                  {success && (
                    <p className="text-sm text-green-500">
                      {selectedImage
                        ? "Update successful!"
                        : "Upload successful!"}
                    </p>
                  )}
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                {/* Gallery */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg">Uploaded Images</Label>
                    {isEditingDetails && (
                      <span className="text-xs text-muted-foreground">
                        Select one as Main and click Save (top-right)
                      </span>
                    )}
                  </div>

                  {/* Beautiful grid */}
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(images) &&
                      images.map((img: HotelImage) => {
                        const isDeleting = deletingIds.has(img.imageID);
                        const checked = mainImageId === img.imageID;

                        return (
                          <div
                            key={img.imageID}
                            className={`relative group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition ${
                              isDeleting ? "opacity-50" : ""
                            }`}
                          >
                            {/* Radio overlay when editing */}
                            {isEditingDetails && (
                              <div className="absolute right-2 top-2 z-10 bg-white/90 backdrop-blur rounded-full px-2 py-1 flex items-center gap-2 shadow">
                                <input
                                  type="radio"
                                  name="mainImage"
                                  className="h-4 w-4"
                                  checked={checked}
                                  onChange={() => setMainImageId(img.imageID)}
                                />
                                <span className="text-xs font-medium">
                                  {checked ? "Main" : "Set main"}
                                </span>
                              </div>
                            )}

                            {/* Image */}
                            <div className="aspect-[4/3] bg-muted/30">
                              <Image
                                src={img.imageFileName}
                                alt={img.description || "Hotel image"}
                                width={800}
                                height={600}
                                className="h-full w-full object-cover"
                              />
                            </div>

                            {/* Footer */}
                            <div className="p-3 flex items-start justify-between">
                              <div className="space-y-1 pr-2">
                                <p className="text-sm font-medium line-clamp-2">
                                  {img.description || "No description"}
                                </p>
                                {!isEditingDetails && img.isMain && (
                                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                    Main Image
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    markDeleting(img.imageID, true);
                                    try {
                                      const deletedId = await (
                                        dispatch(
                                          deleteHotelImage(img.imageID)
                                        ) as any
                                      ).unwrap();

                                      if (deletedId) {
                                        console.log(
                                          `✅ Hotel image ${deletedId} deleted successfully from backend.`
                                        );
                                      } else {
                                        console.log(
                                          "⚠️ Backend did not confirm deletion."
                                        );
                                      }

                                      await dispatch(
                                        fetchHotelImagesByHotelId(
                                          hotelData.hotelID
                                        ) as any
                                      );
                                    } catch (e: any) {
                                      console.error("❌ Delete failed:", e);
                                    } finally {
                                      markDeleting(img.imageID, false);
                                    }
                                  }}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting…
                                    </>
                                  ) : (
                                    <Trash2 />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="meal">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Meal Allocation</h3>
                  <p className="text-xs text-muted-foreground">
                    Set the number of included meals per day and whether the
                    plan is All-Inclusive.
                  </p>
                </div>
              </div>

              {/* Form Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {mode === "create"
                        ? "Create Allocation"
                        : `Edit Allocation #${mealForm.id}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    className={`space-y-3 ${createLocked ? "opacity-50" : ""}`}
                  >
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Breakfast</Label>
                        <Input
                          inputMode="numeric"
                          value={mealForm.breakfast}
                          onChange={(e) =>
                            setMealForm((f) => ({
                              ...f,
                              breakfast:
                                e.target.value.replace(/\D/g, "") || "0",
                            }))
                          }
                          disabled={createLocked}
                        />
                      </div>
                      <div>
                        <Label>Lunch</Label>
                        <Input
                          inputMode="numeric"
                          value={mealForm.lunch}
                          onChange={(e) =>
                            setMealForm((f) => ({
                              ...f,
                              lunch: e.target.value.replace(/\D/g, "") || "0",
                            }))
                          }
                          disabled={createLocked}
                        />
                      </div>
                      <div>
                        <Label>Dinner</Label>
                        <Input
                          inputMode="numeric"
                          value={mealForm.dinner}
                          onChange={(e) =>
                            setMealForm((f) => ({
                              ...f,
                              dinner: e.target.value.replace(/\D/g, "") || "0",
                            }))
                          }
                          disabled={createLocked}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Currency</Label>
                        <Select
                          value={mealForm.currencyCode}
                          onValueChange={(val) =>
                            setMealForm((f) => ({ ...f, currencyCode: val }))
                          }
                          // Shadcn Select supports disabling via its trigger
                        >
                          <SelectTrigger disabled={createLocked}>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="LKR">LKR</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="INR">INR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-3 mt-6">
                        <Label className="whitespace-nowrap">
                          All-Inclusive
                        </Label>
                        <Switch
                          checked={mealForm.ai}
                          onCheckedChange={(v) =>
                            setMealForm((f) => ({ ...f, ai: v }))
                          }
                          disabled={createLocked}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={async () => {
                          // basic validation
                          const b = Number(mealForm.breakfast || 0);
                          const l = Number(mealForm.lunch || 0);
                          const d = Number(mealForm.dinner || 0);
                          if (b < 0 || l < 0 || d < 0) return;

                          try {
                            if (mode === "create") {
                              await mealDispatch(
                                createHotelMealAllocation({
                                  breakfast: b,
                                  lunch: l,
                                  dinner: d,
                                  currencyCode: mealForm.currencyCode,
                                  ai: mealForm.ai ? 1 : 0,
                                }) as any
                              ).unwrap();
                            } else {
                              await mealDispatch(
                                updateHotelMealAllocation({
                                  id: mealForm.id,
                                  breakfast: b,
                                  lunch: l,
                                  dinner: d,
                                  currencyCode: mealForm.currencyCode,
                                  ai: mealForm.ai ? 1 : 0,
                                }) as any
                              ).unwrap();
                            }

                            // ✅ success: do something here (e.g. toast)
                          } catch (err: any) {
                            // err will contain rejectWithValue(...) or thrown error
                            if (err?.response) {
                              // Axios-style error object
                              console.error(
                                "Backend error:",
                                err.response.data
                              );
                            } else {
                              console.error("Meal allocation failed:", err);
                            }
                          }
                        }}
                        disabled={
                          createLocked ||
                          createState.status === "loading" ||
                          updateState.status === "loading" ||
                          !hotelData?.hotelID
                        }
                      >
                        {createState.status === "loading" ||
                        updateState.status === "loading" ? (
                          <span className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {mode === "create" ? "Saving..." : "Updating..."}
                          </span>
                        ) : mode === "create" ? (
                          "Create"
                        ) : (
                          "Update"
                        )}
                      </Button>

                      {mode === "edit" && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMode("create");
                            setMealForm({
                              id: 0,
                              breakfast: "0",
                              lunch: "0",
                              dinner: "0",
                              currencyCode: hotelData?.currencyCode || "USD",
                              ai: false,
                            });
                          }}
                          disabled={updateState.status === "loading"}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {/* Errors */}
                    {createState.status === "failed" && createState.error && (
                      <p className="text-xs text-red-600">
                        Error: {createState.error}
                      </p>
                    )}
                    {updateState.status === "failed" && updateState.error && (
                      <p className="text-xs text-red-600">
                        Error: {updateState.error}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* List Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Existing Allocations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mealListState.status === "loading" ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading…
                      </div>
                    ) : mealListState.status === "failed" ? (
                      <p className="text-sm text-red-600">
                        Error: {mealListState.error}
                      </p>
                    ) : Array.isArray(mealListState.data) &&
                      mealListState.data.length > 0 ? (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Breakfast</TableHead>
                              <TableHead>Lunch</TableHead>
                              <TableHead>Dinner</TableHead>
                              <TableHead>All-Inclusive</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead className="text-right w-[160px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mealListState.data.map((row: any) => (
                              <TableRow key={row.id}>
                                <TableCell>{row.breakfast}</TableCell>
                                <TableCell>{row.lunch}</TableCell>
                                <TableCell>{row.dinner}</TableCell>
                                <TableCell>{row.ai ? "Yes" : "No"}</TableCell>
                                <TableCell>{row.currencyCode}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setMode("edit");
                                        setMealForm({
                                          id: row.id,
                                          breakfast: String(
                                            row.breakfast ?? "0"
                                          ),
                                          lunch: String(row.lunch ?? "0"),
                                          dinner: String(row.dinner ?? "0"),
                                          currencyCode:
                                            row.currencyCode || "USD",
                                          ai: Boolean(row.ai),
                                        });
                                      }}
                                    >
                                      Edit
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={async () => {
                                        const ok = confirm(
                                          `Delete allocation #${row.id}?`
                                        );
                                        if (!ok) return;
                                        const action = await mealDispatch(
                                          deleteHotelMealAllocation(
                                            row.id
                                          ) as any
                                        );
                                        if (
                                          deleteHotelMealAllocation.fulfilled.match(
                                            action
                                          )
                                        ) {
                                          mealDispatch(
                                            fetchHotelMealAllocations() as any
                                          );
                                        }
                                      }}
                                      disabled={
                                        deleteState.status === "loading"
                                      }
                                    >
                                      {deleteState.status === "loading" &&
                                      deleteState.deletedId === row.id ? (
                                        <span className="flex items-center">
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Deleting…
                                        </span>
                                      ) : (
                                        "Delete"
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No allocations yet.
                      </p>
                    )}

                    {deleteState.status === "failed" && deleteState.error && (
                      <p className="mt-3 text-xs text-red-600">
                        Delete error: {deleteState.error}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="ipg">
            <IPGTab hotelId={hotelData?.hotelID} />
          </TabsContent>
          <TabsContent value="taxes">
            <TaxesTab
              initialOpen="serviceCharge"
              hotelId={hotelData?.hotelID}
            />
          </TabsContent>
          <TabsContent value="currency">
            {/* Optionally pass the hotel’s current currency code so it shows as default */}
            <CurrencyTab defaultCode={hotelData?.currencyCode} />
          </TabsContent>
          <TabsContent value="theme">
            <ThemeTab />
          </TabsContent>
          <TabsContent value="logo">
            <HotelLogoTab hotelData={hotelData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function InputField({
  label,
  value,
  onChange,
  editable = false,
  disabled = false,
  type = "text",
}: any) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value || ""}
        disabled={!editable || disabled}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  );
}

function SwitchField({ label, checked, onChange, editable = false }: any) {
  return (
    <div className="flex items-center gap-2">
      <Label>{label}</Label>
      <Switch
        checked={checked || false}
        disabled={!editable}
        onCheckedChange={onChange}
      />
    </div>
  );
}

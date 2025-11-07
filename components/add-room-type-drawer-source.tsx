"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoomTypeFormData as EditRoomTypeFormData } from "./edit-room-type-drawer";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface RoomTypeFormData extends Omit<EditRoomTypeFormData, "photo"> {
  selectedRoomTypeId: string;
  photos: File[];
}

interface RoomFeature {
  roomFeatureID: number;
  featureCategory: string;
  featureName: string;
}

interface ExistingRoomType {
  roomTypeID: number;
  roomType: string;
  finAct: boolean;
}

interface AddRoomTypeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: EditRoomTypeFormData) => void;
}

export function AddRoomTypeDrawer({
  isOpen,
  onClose,
  onSubmit,
}: AddRoomTypeDrawerProps) {
  const [formData, setFormData] = useState<RoomTypeFormData>({
    roomType: "",
    selectedRoomTypeId: "",
    title: "",
    adultSpace: "",
    childSpace: "",
    description: "",
    amenities: [], // ✅ array
    bedding: "", // ✅ string
    view: "", // ✅ string
    washroom: [], // ✅ array
    roomNumbers: [""], // updated from []
    photos: [],
    noOfRooms: 0, // Added noOfRooms property
  });

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [numberOfRooms, setNumberOfRooms] = useState(null);
  const [hasDuplicateRoomNumber, setHasDuplicateRoomNumber] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [roomNameExists, setRoomNameExists] = useState(false);
  const { fullName } = useUserFromLocalStorage();
  // Ensure at least one room box is shown when the "rooms" tab is opened
  useEffect(() => {
    if (activeTab === "rooms" && formData.roomNumbers.length === 0) {
      setFormData((prev) => ({ ...prev, roomNumbers: [""] }));
    }
  }, [activeTab]);
  const [roomFeatures, setRoomFeatures] = useState<RoomFeature[]>([]);
  const [existingRoomTypes, setExistingRoomTypes] = useState<
    ExistingRoomType[]
  >([]);
  const [createdRoomTypeId, setCreatedRoomTypeId] = useState<number | null>(
    null
  );
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hotelID, setHotelID] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("admin");
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hotelmateTokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      setAccessToken(hotelmateTokens?.accessToken || null);
      setHotelID(selectedProperty?.id || null);
      setCurrentUser(hotelmateTokens?.fullName || "admin");
    }
  }, []);

  useEffect(() => {
    if (isOpen && accessToken && hotelID) {
      fetchRoomFeatures();
      fetchExistingRoomTypes();
    }
  }, [isOpen, accessToken, hotelID]);

  const fetchRoomFeatures = async () => {
    if (!accessToken) return;
    try {
      setLoadingFeatures(true);
      const res = await fetch(`${BASE_URL}/api/RoomFeature`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setRoomFeatures(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const fetchExistingRoomTypes = async () => {
    if (!accessToken) return;
    try {
      setLoadingRoomTypes(true);
      const res = await fetch(`${BASE_URL}/api/RoomType`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setExistingRoomTypes(data);
    } catch (error) {
      console.error("Error fetching room types:", error);
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "roomType") {
      if (activeTab === "details") {
        const roomTypeMap = JSON.parse(
          localStorage.getItem("roomTypeMap") || "[]"
        );
        const normalizedInput = value.toLowerCase().replace(/\s+/g, " ").trim();
        const isDuplicateName = roomTypeMap.some(
          (r: { name: string }) =>
            r.name.toLowerCase().replace(/\s+/g, " ").trim() === normalizedInput
        );
        setRoomNameExists(isDuplicateName);
      }

      setFormData((prev) => ({
        ...prev,
        roomType: value,
        ...(formData.selectedRoomTypeId ? {} : { title: value }),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "selectedRoomTypeId") {
      const selected = existingRoomTypes.find(
        (type) => type.roomTypeID.toString() === value
      );
      const selectedName = selected?.roomType || "";

      if (activeTab === "details") {
        const roomTypeMap = JSON.parse(
          localStorage.getItem("roomTypeMap") || "[]"
        );
        const normalizedInput = selectedName
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
        const isDuplicateName = roomTypeMap.some(
          (r: { name: string }) =>
            r.name.toLowerCase().replace(/\s+/g, " ").trim() === normalizedInput
        );
        setRoomNameExists(isDuplicateName);
      }

      setFormData((prev) => ({
        ...prev,
        selectedRoomTypeId: value,
        roomType: selectedName,
        title: selectedName,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;

    setFormData((prev) => {
      const currentField = prev[name as keyof RoomTypeFormData];

      if (!Array.isArray(currentField)) return prev; // prevent runtime error

      const updatedArray = checked
        ? [...currentField, value]
        : currentField.filter((v) => v !== value);

      return {
        ...prev,
        [name]: updatedArray,
      };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const previews = files.map((f) => URL.createObjectURL(f));
      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...files] }));
      setPhotoPreviews((prev) => [...prev, ...previews]);
    }
  };
  const handleCreateRoomNumbers = async () => {
    const sanitizedRoomNumbers = formData.roomNumbers
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (sanitizedRoomNumbers.length !== numberOfRooms) {
      toast({
        title: "Missing Room Numbers",
        description: "Please fill in all room numbers before submitting.",
        variant: "destructive",
      });
      return;
    }

    for (const roomNo of sanitizedRoomNumbers) {
      const res = await fetch(`${BASE_URL}/api/HotelRoomNumber`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          roomID: 0,
          hotelID,
          hotelMaster: { hotelID },
          roomTypeID: createdRoomTypeId,
          hotelRoomType: {
            hotelRoomTypeID: createdRoomTypeId,
            hotelID,
            roomType: formData.roomType || formData.title,
            adultSpace: Number(formData.adultSpace),
            childSpace: Number(formData.childSpace),
            noOfRooms: Number(numberOfRooms),
            cmid: null,
            createdTimeStamp: null,
            createdBy: fullName,
            finAct: false,
          },
          roomNo: roomNo,
          finAct: false,
          createdOn: new Date().toISOString(),
          createdBy: fullName,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create room number: ${roomNo}`);
      }
    }
  };

  // Debounced room number validation logic
  const [isValidatingRoomNumbers, setIsValidatingRoomNumbers] = useState(false);
  let debounceTimer: NodeJS.Timeout;
  const handleRoomNumberChange = (idx: number, value: string) => {
    const updated = [...formData.roomNumbers];
    updated[idx] = value;
    setFormData((prev) => ({ ...prev, roomNumbers: updated }));
    setNumberOfRooms(updated.filter((r) => r.trim() !== "").length);

    clearTimeout(debounceTimer);
    setIsValidatingRoomNumbers(true);
    debounceTimer = setTimeout(async () => {
      const trimmed = updated
        .map((num) => num.trim())
        .filter((num) => num !== "");
      const duplicates = trimmed.filter(
        (item, index) => trimmed.indexOf(item) !== index
      );

      let isDuplicateAcrossTypes = false;
      if (accessToken && hotelID) {
        try {
          const res = await fetch(
            `${BASE_URL}/api/HotelRoomNumber/hotel-id/${hotelID}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const existingRoomNos = data.map((room: any) =>
              room.roomNo?.trim()
            );
            isDuplicateAcrossTypes = existingRoomNos.includes(value.trim());
          }
        } catch (error) {
          console.error("Error during room number validation:", error);
        }
      }

      setHasDuplicateRoomNumber(
        duplicates.length > 0 || isDuplicateAcrossTypes
      );
      setIsValidatingRoomNumbers(false);
    }, 600);
  };

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleCreateRoomType = async (): Promise<number | null> => {
    if (!accessToken || !hotelID) return null;

    const timestamp = new Date().toISOString();
    const payload = {
      hotelRoomTypeID: 0,
      hotelID,
      roomType: formData.roomType || formData.title,
      adultSpace: Number(formData.adultSpace),
      childSpace: Number(formData.childSpace),
      noOfRooms: numberOfRooms,
      cmid: null,
      createdTimeStamp: timestamp,
      createdBy: fullName,
      updatedBy: fullName,
      finAct: false,
      updatedTimeStamp: timestamp,
    };
    const res = await fetch(`${BASE_URL}/api/HotelRoomType`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setCreatedRoomTypeId(data.hotelRoomTypeID);
    return data.hotelRoomTypeID ?? null;
  };

  const canGoToImages =
    (formData.roomType || formData.selectedRoomTypeId) &&
    formData.title &&
    formData.adultSpace &&
    formData.childSpace;
  const canGoToRooms = canGoToImages && formData.photos.length > 0;
  const canGoToAmenities = canGoToRooms && numberOfRooms > 0;

  const nextStep = async () => {
    if (activeTab === "details") {
      setActiveTab("amenities");
    } else if (activeTab === "amenities") setActiveTab("images");
    else if (activeTab === "images") setActiveTab("rooms");
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !hotelID || isSubmitting) return;

    if (hasDuplicateRoomNumber) {
      toast({
        title: "Duplicate Room Numbers",
        description: "Room numbers must be unique.",
        variant: "destructive",
      });
      return;
    }

    let roomTypeIdToUse = createdRoomTypeId;
    if (!roomTypeIdToUse) {
      roomTypeIdToUse = await handleCreateRoomType();
      if (!roomTypeIdToUse) {
        throw new Error("Room Type creation failed. Cannot proceed.");
      }
      setCreatedRoomTypeId(roomTypeIdToUse);
    }

    const sanitizedRoomNumbers = formData.roomNumbers
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (sanitizedRoomNumbers.length !== numberOfRooms) {
      toast({
        title: "Missing Room Numbers",
        description: "Please fill in all room numbers before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const features = [
        ...(Array.isArray(formData.amenities) ? formData.amenities : []),
        ...(formData.bedding ? [formData.bedding] : []),
        ...(formData.view ? [formData.view] : []),
        ...(Array.isArray(formData.washroom) ? formData.washroom : []),
      ].filter(
        (val): val is string => typeof val === "string" && val.trim() !== ""
      );

      const base64Images = await Promise.all(
        formData.photos.map((file, index) =>
          toBase64(file).then((base64) => ({
            imageID: 0,
            hotelID,
            hotelRoomTypeID: roomTypeIdToUse,
            imageURL: null,
            description: `Room photo ${index + 1}`,
            isMain: index === 0,
            finAct: false,
            createdOn: new Date().toISOString(),
            createdBy: fullName,
            updatedOn: new Date().toISOString(),
            updatedBy: fullName,
            base64Image: base64.replace(/^data:image\/[^;]+;base64,/, ""),
            imageFileName: `room_image_${Date.now()}_${index + 1}.jpg`,
          }))
        )
      );

      for (const image of base64Images) {
        const res = await fetch(`${BASE_URL}/api/HotelRoomTypeImage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(image),
        });

        if (!res.ok) {
          throw new Error("Failed to upload room image");
        }
      }

      for (const name of features) {
        console.log(name);
        const match = roomFeatures.find((f) => f.featureName === name);
        if (!match) continue;

        const res = await fetch(`${BASE_URL}/api/HotelRoomFeature`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            hotelRoomFeatureID: 0,
            hotelID,
            hotelMaster: { hotelID },
            roomFeatureID: match.roomFeatureID,
            roomFeature: {
              roomFeatureID: match.roomFeatureID,
              featureCategory: match.featureCategory,
              featureName: match.featureName,
            },
            hotelRoomTypeID: roomTypeIdToUse,
            hotelRoomType: {
              hotelRoomTypeID: roomTypeIdToUse,
              hotelID,
              roomType: formData.roomType || formData.title,
              adultSpace: Number(formData.adultSpace),
              childSpace: Number(formData.childSpace),
              noOfRooms: Number(numberOfRooms),
              cmid: null,
              createdTimeStamp: null,
              createdBy: fullName,
              finAct: false,
            },
            isTrue: true,
            hotelRoomTypeImage: null,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create feature: ${match.featureName}`);
        }
      }

      for (const roomNo of sanitizedRoomNumbers) {
        const res = await fetch(`${BASE_URL}/api/HotelRoomNumber`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            roomID: 0,
            hotelID,
            hotelMaster: { hotelID },
            roomTypeID: roomTypeIdToUse,
            hotelRoomType: {
              hotelRoomTypeID: roomTypeIdToUse,
              hotelID,
              roomType: formData.roomType || formData.title,
              adultSpace: Number(formData.adultSpace),
              childSpace: Number(formData.childSpace),
              noOfRooms: Number(numberOfRooms),
              cmid: null,
              createdTimeStamp: null,
              createdBy: fullName,
              finAct: false,
            },
            roomNo: roomNo,
            finAct: false,
            createdOn: new Date().toISOString(),
            createdBy: fullName,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create room number: ${roomNo}`);
        }
      }

      const submittedData: EditRoomTypeFormData = {
        id: roomTypeIdToUse.toString(),
        roomType: formData.roomType,
        title: formData.title,
        description: formData.description,
        adultSpace: formData.adultSpace,
        childSpace: formData.childSpace,
        amenities: formData.amenities.map((name) => ({
          category: "Amenities",
          name: typeof name === "string" ? name : name.name,
        })),
        bedding: formData.bedding,
        view: formData.view,
        washroom: formData.washroom,
        roomNumbers: sanitizedRoomNumbers,
        images: photoPreviews,
        photo: photoPreviews.length > 0 ? photoPreviews[0] : null,
        noOfRooms: numberOfRooms, // Added noOfRooms property
      };

      toast({
        title: "Room Type Created",
        description: "The new room type was successfully created.",
      });

      window.location.href = "/rooms/types";

      if (onSubmit) onSubmit(submittedData);
      onClose();
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast({
        title: "Error",
        description:
          error.message || "An error occurred while saving the room type.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group features by category
  const groupedFeatures = roomFeatures.reduce<Record<string, RoomFeature[]>>(
    (acc, feature) => {
      if (!acc[feature.featureCategory]) {
        acc[feature.featureCategory] = [];
      }
      acc[feature.featureCategory].push(feature);
      return acc;
    },
    {}
  );

  // Helper for legacy filter logic
  const filterFeatures = (category: string) =>
    roomFeatures.filter((f) => f.featureCategory === category);

  if (!accessToken || !hotelID) return null;

  // const handleRoomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = parseInt(e.target.value, 10);
  //   const count = isNaN(value) || value < 1 ? 1 : value;

  //   setNumberOfRooms(count);

  //   const currentRooms = formData.roomNumbers;
  //   const updatedRooms = [...currentRooms];

  //   if (count > currentRooms.length) {
  //     for (let i = currentRooms.length; i < count; i++) {
  //       updatedRooms.push("");
  //     }
  //   } else {
  //     updatedRooms.length = count;
  //   }

  //   setFormData((prev) => ({
  //     ...prev,
  //     roomNumbers: updatedRooms,
  //   }));
  // };

  const handleRoomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input while typing
    if (value === "") {
      setNumberOfRooms(null); // or empty string if you prefer
      setFormData((prev) => ({ ...prev, roomNumbers: [] }));
      return;
    }

    const parsed = Number.parseInt(value, 10);

    if (!isNaN(parsed) && parsed >= 0) {
      setNumberOfRooms(parsed);

      const currentRooms = formData.roomNumbers;
      const updatedRooms = [...currentRooms];

      if (parsed > currentRooms.length) {
        for (let i = currentRooms.length; i < parsed; i++) {
          updatedRooms.push("");
        }
      } else {
        updatedRooms.length = parsed;
      }

      setFormData((prev) => ({
        ...prev,
        roomNumbers: updatedRooms,
      }));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-2xl font-bold">Add Room Type</SheetTitle>
          <SheetDescription>
            Enter room type details to create a new room type
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6 px-[10px]">
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="amenities" disabled={!canGoToAmenities}>
                  Amenities
                </TabsTrigger>
                <TabsTrigger value="images" disabled={!canGoToImages}>
                  Images
                </TabsTrigger>
                <TabsTrigger value="rooms" disabled={!canGoToRooms}>
                  Rooms
                </TabsTrigger>
              </TabsList>
              {/* Step 1: Details */}
              <TabsContent value="details">
                <div className="space-y-4">
                  {loadingRoomTypes ? (
                    <div>Loading existing room types...</div>
                  ) : (
                    <>
                      <Label>Select Existing Room Type</Label>
                      <Select
                        value={formData.selectedRoomTypeId}
                        onValueChange={(value) =>
                          handleSelectChange("selectedRoomTypeId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a room type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            new Map(
                              existingRoomTypes
                                .filter((r) => r.roomType)
                                .map((type) => [type.roomType, type])
                            ).values()
                          ).map((type) => (
                            <SelectItem
                              key={type.roomTypeID}
                              value={type.roomTypeID.toString()}
                            >
                              {type.roomType}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-gray-500 mb-4">
                        {formData.selectedRoomTypeId
                          ? "Create your own name"
                          : "Or create a new room type below"}
                      </div>
                    </>
                  )}

                  <Label>Room Type</Label>
                  <Input
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleChange}
                    required={!formData.selectedRoomTypeId} // Make required if not selecting existing
                  />
                  {roomNameExists && (
                    <p className="text-sm text-red-500 mt-1">
                      Room name is already being used by this property.
                    </p>
                  )}
                  {/* Title input is now always hidden, but its value is managed in formData */}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Adult Space</Label>
                      <Input
                        type="number"
                        name="adultSpace"
                        value={formData.adultSpace}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label>Child Space</Label>
                      <Input
                        type="number"
                        name="childSpace"
                        value={formData.childSpace}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <Label>Description</Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                  <div className="flex justify-end pt-6">
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!canGoToImages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Step 2: Images */}
              <TabsContent value="images">
                <Label className="mb-2 block">Room Images</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {photoPreviews.map((url, idx) => (
                    <div key={idx} className="relative">
                      {/* Delete bin icon in top right */}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedImages =
                            formData.images?.filter((img) => {
                              const imgUrl =
                                typeof img === "string"
                                  ? img
                                  : URL.createObjectURL(img);
                              return imgUrl !== url;
                            }) || [];

                          // Remove the corresponding photo from formData.photos as well
                          const updatedPhotos = formData.photos.filter(
                            (file, i) => photoPreviews[i] !== url
                          );

                          setFormData((prev) => ({
                            ...prev,
                            images: updatedImages,
                            photos: updatedPhotos,
                          }));
                          // Remove the preview as well
                          setPhotoPreviews((prev) =>
                            prev.filter((u) => u !== url)
                          );
                        }}
                        className="absolute top-1 right-1 text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                      <img
                        src={url}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <div className="absolute bottom-1 left-1 bg-white bg-opacity-80 rounded px-2 py-0.5 text-xs">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="mainImage"
                            checked={photoPreviews[0] === url}
                            onChange={() => {
                              const reordered = [
                                url,
                                ...photoPreviews.filter((u) => u !== url),
                              ];
                              setPhotoPreviews(reordered);
                            }}
                          />
                          Main
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                />
                <div className="flex justify-end pt-6">
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={!canGoToRooms}
                  >
                    Next
                  </Button>
                </div>
              </TabsContent>
              {/* Step 3: Rooms */}
              <TabsContent value="rooms">
                <Label>Number of Rooms</Label>
                <Input
                  type="number"
                  placeholder="Enter number of rooms"
                  name="numberOfRooms"
                  value={numberOfRooms}
                  onChange={handleRoomCountChange}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.roomNumbers.map((room, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <Label>Room {idx + 1}</Label>
                      <Input
                        value={room}
                        onChange={(e) =>
                          handleRoomNumberChange(idx, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
                {hasDuplicateRoomNumber && (
                  <p className="text-sm text-red-500 mt-2">
                    Duplicate room numbers detected. Please ensure all room
                    numbers are unique.
                  </p>
                )}
                <div className="flex justify-between pt-6">
                  <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      hasDuplicateRoomNumber ||
                      isValidatingRoomNumbers ||
                      formData.roomNumbers.filter((r) => r.trim() !== "")
                        .length < 1
                    }
                  >
                    {isSubmitting ? "Processing..." : "Click to Save"}
                  </Button>
                </div>
              </TabsContent>

              {/* Step 4: Amenities */}
              <TabsContent value="amenities">
                {loadingFeatures ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p>Loading room features...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 px-[10px]">
                    {Object.entries(groupedFeatures).map(
                      ([category, features]) => {
                        // Determine if green style should be used
                        const useGreenStyle = [
                          "Amenities",
                          "Bedding",
                          "View",
                          "Washroom",
                        ].includes(category);
                        return (
                          <div key={category} className="mb-6">
                            <Label className="text-lg font-semibold mb-2">
                              {category}
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                              {features.map((feature) => {
                                const isRadioType =
                                  category === "Bedding" || category === "View";
                                const fieldName =
                                  category === "Amenities"
                                    ? "amenities"
                                    : category === "Bedding"
                                    ? "bedding"
                                    : category === "View"
                                    ? "view"
                                    : category === "Washroom"
                                    ? "washroom"
                                    : "";

                                if (isRadioType) {
                                  // Radio input styling
                                  const isSelected =
                                    formData[
                                      fieldName as keyof RoomTypeFormData
                                    ] === feature.featureName;
                                  return (
                                    <label
                                      key={feature.roomFeatureID}
                                      className={
                                        "flex items-center gap-2 p-3 border rounded-md text-sm hover:bg-gray-50 dark:bg-black dark:hover:bg-gray-700  transition-colors " +
                                        (isSelected
                                          ? useGreenStyle
                                            ? "border-green-600"
                                            : "border-blue-600"
                                          : "border-gray-600")
                                      }
                                    >
                                      <div
                                        className={
                                          "flex items-center justify-center w-5 h-5 border rounded-full " +
                                          (isSelected
                                            ? useGreenStyle
                                              ? "border-green-600"
                                              : "border-blue-600"
                                            : "border-gray-300")
                                        }
                                      >
                                        {isSelected && (
                                          <div
                                            className={
                                              useGreenStyle
                                                ? "w-3 h-3 bg-green-600  rounded-full"
                                                : "w-3 h-3 bg-blue-600 rounded-full"
                                            }
                                          ></div>
                                        )}
                                      </div>
                                      <input
                                        type="radio"
                                        name={fieldName}
                                        value={feature.featureName}
                                        checked={isSelected}
                                        onChange={handleRadioChange}
                                        className="sr-only"
                                      />
                                      <span>{feature.featureName}</span>
                                    </label>
                                  );
                                } else {
                                  // Checkbox styling
                                  const isArray = Array.isArray(
                                    formData[
                                      fieldName as keyof RoomTypeFormData
                                    ]
                                  );
                                  const isChecked =
                                    isArray &&
                                    (
                                      formData[
                                        fieldName as keyof RoomTypeFormData
                                      ] as string[]
                                    ).includes(feature.featureName);
                                  return (
                                    <label
                                      key={feature.roomFeatureID}
                                      className={
                                        "flex items-center gap-2 p-3 border rounded-md text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" +
                                        (isChecked
                                          ? useGreenStyle
                                            ? "border-green-600 border"
                                            : "border-blue-600"
                                          : "border-gray-300")
                                      }
                                    >
                                      <div
                                        className={
                                          "flex items-center justify-center w-5 h-5 border rounded " +
                                          (isChecked
                                            ? useGreenStyle
                                              ? "border-green-600"
                                              : "border-blue-600"
                                            : "border-gray-300")
                                        }
                                      >
                                        {isChecked && (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={
                                              "h-4 w-4 " +
                                              (useGreenStyle
                                                ? "text-green-600"
                                                : "text-blue-600")
                                            }
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        )}
                                      </div>
                                      <input
                                        type="checkbox"
                                        name={fieldName}
                                        value={feature.featureName}
                                        checked={isChecked}
                                        onChange={handleCheckboxChange}
                                        className="sr-only"
                                      />
                                      <span>{feature.featureName}</span>
                                    </label>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
                <div className="flex justify-end pt-6">
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

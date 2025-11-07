"use client";

import type React from "react";

import { useEffect, useState } from "react";
import {
  BedDouble,
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Users,
  Baby,
  Camera,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslatedText } from "@/lib/translation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchHotelRoomTypes } from "@/redux/slices/hotelRoomTypesSlice";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Image from "next/image";
import Logo from "../assets/images/HotelMate_Logo.png";
import VideoButton from "./videoButton";
import VideoOverlay from "./videoOverlay";
// add this import
import { createGlAccount } from "@/redux/slices/glAccountCreateSlice";
import { useTutorial } from "@/hooks/useTutorial";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface RoomTypeFormData {
  selectedRoomTypeId: string;
  roomType: string;
  title: string;
  adultSpace: string;
  childSpace: string;
  description: string;
  amenities: string[];
  bedding: string[];
  view: string;
  washroom: string[];
  roomNumbers: string[];
  photos: File[];
  noOfRooms: number;
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

const STEPS = [
  { id: "welcome", title: "Welcome", description: "Create a new room type" },
  {
    id: "existingRoomType",
    title: "Existing Room Type",
    description: "Select from existing types",
  },
  {
    id: "roomType",
    title: "Room Type Name",
    description: "Enter room type name",
  },
  {
    id: "adultCapacity",
    title: "Adult Capacity",
    description: "Maximum adults per room",
  },
  {
    id: "childCapacity",
    title: "Child Capacity",
    description: "Maximum children per room",
  },

  { id: "amenities", title: "Amenities", description: "Select room amenities" },
  {
    id: "bedding",
    title: "Bedding",
    description: "Select bedding configuration",
  },
  {
    id: "view",
    title: "Room View",
    description: "What view does the room have?",
  },
  {
    id: "washroom",
    title: "Washroom Features",
    description: "Select washroom features",
  },
  { id: "images", title: "Room Images", description: "Upload room photos" },
  {
    id: "roomCount",
    title: "Room Count",
    description: "How many rooms of this type?",
  },
  {
    id: "roomNumbers",
    title: "Room Numbers",
    description: "Assign room numbers",
  },
  {
    id: "description",
    title: "Description",
    description: "Describe your room",
  },
  { id: "review", title: "Review", description: "Review and create room type" },
];

export default function RoomTypesMultiStep() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<RoomTypeFormData>({
    selectedRoomTypeId: "",
    roomType: "",
    title: "",
    adultSpace: "1",
    childSpace: "0",
    description: "",
    amenities: [],
    bedding: [],
    view: "",
    washroom: [],
    roomNumbers: [],
    photos: [],
    noOfRooms: 0,
  });
  const [aiWriting, setAiWriting] = useState(false);
  const [roomFeatures, setRoomFeatures] = useState<RoomFeature[]>([]);
  const [existingRoomTypes, setExistingRoomTypes] = useState<
    ExistingRoomType[]
  >([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [numberOfRooms, setNumberOfRooms] = useState<number | null>(1);
  const [hasDuplicateRoomNumber, setHasDuplicateRoomNumber] = useState(false);
  const [roomNameExists, setRoomNameExists] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hotelID, setHotelID] = useState<number | null>(null);
  const [fullName, setFullName] = useState<string>("admin");
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRoomTypeId, setCreatedRoomTypeId] = useState<number | null>(
    null
  );
  const [isValidatingRoomNumbers, setIsValidatingRoomNumbers] = useState(false);
  const [roomCreatedFlag, setRoomCreatedFlag] = useState(false);
  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "onBoarding",
    "room creation"
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  const dispatch = useAppDispatch();
  const hotelRoomTypes = useAppSelector((state) => state.hotelRoomTypes);
  const router = useRouter();

  const roomTypes = useTranslatedText("Room Types");
  const continueText = useTranslatedText("Continue");
  const backText = useTranslatedText("Back");
  const createRoomType = useTranslatedText("Create Room Type");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const composeRoomDescription = (fd: any) => {
    const roomType = fd.roomType || fd.title || fd.propertyType || "room";
    const adults = Number(fd.adultSpace) || 2;
    const kids = Number(fd.childSpace) || 0;

    const amenityNames = (fd.amenities ?? [])
      .map((a: any) => a?.name || a?.label || a?.feature || a?.featureName)
      .filter(Boolean)
      .slice(0, 8);

    const amenitiesLine = amenityNames.length
      ? `Highlights include ${amenityNames.join(", ")}.`
      : `Thoughtful touches include fresh linens, plush pillows, and daily housekeeping.`;

    return (
      `Welcome to our ${roomType.toLowerCase()} — a calm, airy space designed for comfort and effortless downtime. ` +
      `Perfect for up to ${adults} adult${adults > 1 ? "s" : ""}` +
      (kids ? ` and ${kids} child${kids > 1 ? "ren" : ""}` : "") +
      `. Enjoy a balanced blend of style and practicality with cozy bedding, ample storage, and warm ambient lighting.\n\n` +
      `${amenitiesLine} Wake up refreshed, brew a hot drink, and unwind after a day of exploring. ` +
      `Whether you're here for business or leisure, this space is set up to make your stay easy and memorable.`
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hotelmateTokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const userProfile = JSON.parse(
        localStorage.getItem("userProfile") || "{}"
      );
      setAccessToken(hotelmateTokens?.accessToken || null);
      setHotelID(selectedProperty?.id || null);
      setFullName(userProfile?.fullName || "admin");
    }
  }, []);

  useEffect(() => {
    if (accessToken && hotelID) {
      fetchRoomFeatures();
      fetchExistingRoomTypes();
    }
    dispatch(fetchHotelRoomTypes());
  }, [dispatch, accessToken, hotelID]);

  useEffect(() => {
    if (numberOfRooms !== null) {
      const newRoomNumbers = Array.from(
        { length: numberOfRooms },
        (_, i) => formData.roomNumbers[i] || ""
      );
      setFormData((prev) => ({
        ...prev,
        roomNumbers: newRoomNumbers,
        noOfRooms: numberOfRooms,
      }));
    }
  }, [numberOfRooms]);

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

  const checkRoomNameExists = async (roomName: string) => {
    if (!roomName.trim() || !accessToken || !hotelID) return false;

    try {
      const res = await fetch(
        `${BASE_URL}/api/HotelRoomType/hotel/${hotelID}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const existingRoomTypes = await res.json();
      return existingRoomTypes.some(
        (room: any) =>
          room.roomType?.toLowerCase().trim() === roomName.toLowerCase().trim()
      );
    } catch (error) {
      console.error("Error checking room name:", error);
      return false;
    }
  };

  const validateRoomNumbers = async (roomNumbers: string[]) => {
    if (!accessToken || !hotelID) return false;

    try {
      setIsValidatingRoomNumbers(true);
      const res = await fetch(
        `${BASE_URL}/api/HotelRoomNumber/hotel-id/${hotelID}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok)
        throw new Error(`Failed to fetch room numbers: ${res.status}`);
      const existingRoomNumbers = await res.json();

      const existingNumbers = existingRoomNumbers
        .map((room: any) => room.roomNo?.toString().trim())
        .filter(Boolean);

      return roomNumbers.some((num) => existingNumbers.includes(num.trim()));
    } catch (error) {
      console.error("Error validating room numbers:", error);
      return false;
    } finally {
      setIsValidatingRoomNumbers(false);
    }
  };

  const isStepValid = () => {
    const step = STEPS[currentStep];
    switch (step.id) {
      case "roomType":
        return formData.roomType.length > 0 && !roomNameExists;

      case "roomCount":
        return numberOfRooms !== null && numberOfRooms > 0;
      case "adultCapacity":
        return (
          formData.adultSpace.length > 0 &&
          Number.parseInt(formData.adultSpace) > 0
        );
      case "childCapacity":
        return formData.childSpace.length > 0;
      case "bedding":
        return formData.bedding.length > 0;
      case "view":
        return formData.view.length > 0;
      case "amenities":
        return formData.amenities.length > 0;
      case "washroom":
        return formData.washroom.length > 0;
      case "roomNumbers":
        return (
          formData.roomNumbers.filter((r) => r.trim() !== "").length > 0 &&
          !hasDuplicateRoomNumber &&
          !isValidatingRoomNumbers
        );
      case "images":
        return formData.photos.length > 0;
      case "description":
        return formData.description.length > 0;
      default:
        return true;
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setFormData({
      selectedRoomTypeId: "",
      roomType: "",
      title: "",
      adultSpace: "1",
      childSpace: "0",
      description: "",
      amenities: [],
      bedding: [],
      view: "",
      washroom: [],
      roomNumbers: [],
      photos: [],
      noOfRooms: 0,
    });
    setPhotoPreviews([]);
    setNumberOfRooms(1);
    setCreatedRoomTypeId(null);
    setHasDuplicateRoomNumber(false);
    setRoomNameExists(false);
  };

  const handleNext = async () => {
    if (STEPS[currentStep].id === "roomType" && formData.roomType.trim()) {
      const exists = await checkRoomNameExists(formData.roomType);
      setRoomNameExists(exists);
      if (exists) return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const previews = files.map((f) => URL.createObjectURL(f));
      setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...files] }));
      setPhotoPreviews((prev) => [...prev, ...previews]);
    }
  };

  async function generateRoomTypeCopy(payload: any): Promise<string> {
    const res = await fetch("/api/ai/describe-room-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || `AI request failed (${res.status})`);
    }
    const data = await res.json();
    return data.text?.trim() ?? "";
  }

  const handleRoomNumberChange = async (idx: number, value: string) => {
    const updated = [...formData.roomNumbers];
    updated[idx] = value;
    setFormData((prev) => ({ ...prev, roomNumbers: updated }));

    // Check for duplicates within the form
    const trimmed = updated
      .map((num) => num.trim())
      .filter((num) => num !== "");
    const duplicates = trimmed.filter(
      (item, index) => trimmed.indexOf(item) !== index
    );
    const hasDuplicates = duplicates.length > 0;

    // Check against existing room numbers in database
    const hasExistingConflict = await validateRoomNumbers(trimmed);

    setHasDuplicateRoomNumber(hasDuplicates || hasExistingConflict);
  };

  const toAccountCode = (name: string) =>
    `REV-${name}`
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .slice(0, 30);

  // create (or ensure) a GL revenue account for this room type
  const ensureRevenueAccountForRoomType = async (roomTypeName: string) => {
    const accountCode = toAccountCode(roomTypeName || "ROOM");

    const glPayload = {
      accountTypeID: 10, // Revenue
      accDetailTypeID: 88, // Detail type your API expects for room revenue
      accountCode: "", // <-- must NOT be empty
      accountName: `${roomTypeName} - Revenue`,
      description: `Revenue account for room type ${roomTypeName}`,
      finAct: true,
    };

    // will throw if server returns non-2xx; you can wrap in try/catch if desired
    const created = await dispatch(createGlAccount(glPayload)).unwrap();

    return created.accountID; // number
  };

  const handleCreateRoomType = async (): Promise<number | null> => {
    console.log("hi1");

    if (!accessToken || !hotelID) return null;
    console.log("hi2");

    const rtName = (formData.roomType || formData.title || "").trim();
    if (!rtName) return null;

    const glAccountId = await ensureRevenueAccountForRoomType(rtName);

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
      glAccountId: glAccountId,
    };
    console.log("hi3");
    const res = await fetch(`${BASE_URL}/api/HotelRoomType`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    console.log("hi4");
    const data = await res.json();
    console.log("hi5");
    console.log("✅ Created room type:", data);
    console.log("hi6");

    setCreatedRoomTypeId(data.hotelRoomTypeID);
    return data.hotelRoomTypeID ?? null;
  };

  console.log("🚀🚀🚀 formData :", createdRoomTypeId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () =>
      setRoomCreatedFlag(localStorage.getItem("roomCreated") === "true");
    sync();

    // keep in sync if other parts of the app change it
    const onStorage = (e: StorageEvent) => {
      if (e.key === "roomCreated") sync();
    };
    window.addEventListener("storage", onStorage);

    // optional: also resync when tab regains focus
    const onFocus = () => sync();
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleSubmit = async () => {
    if (!accessToken || !hotelID || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Create room type first
      let roomTypeIdToUse = createdRoomTypeId;
      console.log("🚀 :", roomTypeIdToUse);

      if (!roomTypeIdToUse) {
        roomTypeIdToUse = await handleCreateRoomType();
        if (!roomTypeIdToUse) {
          throw new Error("Room Type creation failed. Cannot proceed.");
        }
        setCreatedRoomTypeId(roomTypeIdToUse);
      }

      if (!roomTypeIdToUse) {
        throw new Error("Failed to create or get room type ID");
      }

      // ========================
      // Upload images
      // ========================
      if (formData.photos.length > 0) {
        const base64Images = await Promise.all(
          formData.photos.map(async (file, index) => {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            return {
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
            };
          })
        );

        for (const image of base64Images) {
          console.log(
            "👉 Uploading image payload:",
            JSON.stringify(image, null, 2)
          );
          const res = await fetch(`${BASE_URL}/api/HotelRoomTypeImage`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(image),
          });
          const respData = await res.json().catch(() => null);
          console.log("✅ Image response:", respData);
          if (!res.ok) {
            throw new Error(
              `Failed to upload room image. ${JSON.stringify(respData)}`
            );
          }
        }
      }

      // ========================
      // Create room features
      // ========================
      const features = [
        ...formData.amenities,
        ...formData.bedding,
        formData.view,
        ...formData.washroom,
      ].filter(Boolean);

      for (const featureName of features) {
        const match = roomFeatures.find((f) => f.featureName === featureName);
        if (!match) continue;

        const payload = {
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
        };

        console.log(
          "👉 Posting feature payload:",
          JSON.stringify(payload, null, 2)
        );
        const res = await fetch(`${BASE_URL}/api/HotelRoomFeature`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        const respData = await res.json().catch(() => null);
        console.log("✅ Feature response:", respData);

        if (!res.ok) {
          throw new Error(
            `Failed to create feature "${match.featureName}". ${JSON.stringify(
              respData
            )}`
          );
        }
      }

      // ========================
      // Create room numbers
      // ========================
      const sanitizedRoomNumbers = formData.roomNumbers.filter(
        (num) => num.trim() !== ""
      );
      for (const roomNo of sanitizedRoomNumbers) {
        const payload = {
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
          housekeepingStatus: "Clean",
          createdOn: new Date().toISOString(),
          createdBy: fullName,
        };

        console.log(
          "👉 Posting room number payload:",
          JSON.stringify(payload, null, 2)
        );
        const res = await fetch(`${BASE_URL}/api/HotelRoomNumber`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        const respData = await res.json().catch(() => null);
        console.log("✅ Room number response:", respData);

        if (!res.ok) {
          throw new Error(
            `Failed to create room number ${roomNo}. ${JSON.stringify(
              respData
            )}`
          );
        }
      }

      toast.success("Room type created successfully!");

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      resetForm();
      setShowSuccessModal(true);

      // Reset form
      // setTimeout(() => {
      //   setCurrentStep(0);
      //   setFormData({
      //     selectedRoomTypeId: "",
      //     roomType: "",
      //     title: "",
      //     adultSpace: "1",
      //     childSpace: "0",
      //     description: "",
      //     amenities: [],
      //     bedding: "",
      //     view: "",
      //     washroom: [],
      //     roomNumbers: [],
      //     photos: [],
      //     noOfRooms: 0,
      //   });
      //   setPhotoPreviews([]);
      //   setNumberOfRooms(1);
      //   setCreatedRoomTypeId(null);
      // }, 2000);
    } catch (error) {
      console.error("❌ Error creating room type:", error);
      toast.error("Failed to create room type");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const renderStep = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "welcome":
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
              <BedDouble className="w-10 h-10 text-sky-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Create New Room Type
              </h2>
              <p className="text-slate-600">
                Let's set up a new room type for your property
              </p>
            </div>
          </div>
        );

      case "existingRoomType":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Select Existing Room Type
              </h2>
              <p className="text-slate-600">
                Choose from existing room types or skip to create new
              </p>
            </div>

            {loadingRoomTypes ? (
              <div className="text-center">Loading existing room types...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from(
                  new Map(
                    existingRoomTypes
                      .filter((r) => r.roomType)
                      .map((type) => [type.roomType, type])
                  ).values()
                ).map((type) => {
                  const isSelected =
                    formData.selectedRoomTypeId === type.roomTypeID.toString();

                  return (
                    <div
                      key={type.roomTypeID}
                      className={`relative cursor-pointer border rounded-xl p-5 text-center shadow-sm transition 
            hover:shadow-md hover:border-sky-400 
            ${isSelected ? "ring-2 ring-sky-500 bg-sky-50" : "bg-white"}
          `}
                      onClick={() => {
                        setFormData({
                          ...formData,
                          selectedRoomTypeId: type.roomTypeID.toString(),
                          roomType: type.roomType || "",
                          title: type.roomType || "",
                        });
                      }}
                    >
                      {/* Checkmark when selected */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 bg-sky-500 text-white rounded-full p-1 shadow">
                          <Check className="w-4 h-4" />
                        </div>
                      )}

                      <h3 className="text-lg font-semibold text-slate-800">
                        {type.roomType}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Click to select this type
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-sm text-slate-500 text-center">
              {formData.selectedRoomTypeId
                ? "You can customize the name in the next step"
                : "Or skip to create a completely new room type"}
            </div>
          </div>
        );

      case "roomType":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Create Your Own Name
              </h2>
              <p className="text-slate-600">Enter a name for this room type</p>
            </div>
            <div className="space-y-4 focus:border-sky-400">
              <Input
                placeholder="e.g., Deluxe Ocean View Suite"
                value={formData.roomType}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    roomType: value,
                    title: formData.selectedRoomTypeId ? value : formData.title,
                  });
                }}
                className="text-center text-lg py-6 bg-white text-black"
                required={!formData.selectedRoomTypeId}
              />
              {roomNameExists && (
                <p className="text-sm text-red-500 text-center">
                  Room name is already being used by this property.
                </p>
              )}
            </div>
          </div>
        );

      case "adultCapacity":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Maximum adults per room
              </h2>
              <p className="text-slate-600">
                How many adults can stay in this room?
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      adultSpace: Math.max(
                        1,
                        Number.parseInt(formData.adultSpace || "1") - 1
                      ).toString(),
                    })
                  }
                  disabled={Number.parseInt(formData.adultSpace || "1") <= 1}
                  className="bg-white border-sky-400 text-black border-4 hover:bg-white hover:border-sky-400 hover:text-black text-xl"
                >
                  -
                </Button>
                <div className="flex items-center gap-2">
                  <Users className="w-8 h-8 text-sky-600" />
                  <span className="text-4xl font-bold text-sky-600">
                    {formData.adultSpace || "1"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      adultSpace: (
                        Number.parseInt(formData.adultSpace || "1") + 1
                      ).toString(),
                    })
                  }
                  className="bg-white border-sky-400 text-black border-4 hover:bg-white hover:border-sky-400 hover:text-black  text-xl"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        );

      case "childCapacity":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Maximum children per room
              </h2>
              <p className="text-slate-600">
                How many children can stay in this room?
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      childSpace: Math.max(
                        0,
                        Number.parseInt(formData.childSpace || "0") - 1
                      ).toString(),
                    })
                  }
                  disabled={Number.parseInt(formData.childSpace || "0") <= 0}
                  className="bg-white border-sky-400 text-black border-4 hover:bg-white hover:border-sky-400 hover:text-black text-xl"
                >
                  -
                </Button>
                <div className="flex items-center gap-2">
                  <Baby className="w-8 h-8 text-teal-600" />
                  <span className="text-4xl font-bold text-teal-600">
                    {formData.childSpace || "0"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      childSpace: (
                        Number.parseInt(formData.childSpace || "0") + 1
                      ).toString(),
                    })
                  }
                  className="bg-white border-sky-400 text-black border-4 hover:bg-white hover:border-sky-400 hover:text-black text-xl"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        );

      case "amenities":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Select room amenities
              </h2>
              <p className="text-slate-600">
                Choose all amenities available in this room
              </p>
            </div>

            {loadingFeatures ? (
              <div className="text-center">Loading amenities...</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedFeatures)
                  .filter(([category]) => category === "Amenities")
                  .map(([category, features]) => (
                    <div key={category}>
                      {/* 2-column grid on md+ screens */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {features.map((feature) => {
                          const isSelected = formData.amenities.includes(
                            feature.featureName
                          );
                          return (
                            <button
                              type="button"
                              key={feature.roomFeatureID}
                              aria-pressed={isSelected}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    amenities: formData.amenities.filter(
                                      (a) => a !== feature.featureName
                                    ),
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    amenities: [
                                      ...formData.amenities,
                                      feature.featureName,
                                    ],
                                  });
                                }
                              }}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                                isSelected
                                  ? "border-teal-500 bg-teal-50"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 border rounded flex items-center justify-center ${
                                  isSelected
                                    ? "border-teal-600 bg-teal-600"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="font-medium text-slate-800">
                                {feature.featureName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );

      case "bedding":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Select bedding options (choose one or more)
              </h2>
              <p className="text-slate-600">
                Pick all bedding configurations that apply to this room type
              </p>
            </div>
            {loadingFeatures ? (
              <div className="text-center">Loading bedding options...</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(groupedFeatures)
                  .filter(([category]) => category === "Bedding")
                  .flatMap(([, features]) =>
                    features.map((feature) => {
                      const isSelected = formData.bedding.includes(
                        feature.featureName
                      );
                      return (
                        <button
                          type="button"
                          key={feature.roomFeatureID}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              bedding: isSelected
                                ? prev.bedding.filter(
                                    (b) => b !== feature.featureName
                                  )
                                : [...prev.bedding, feature.featureName],
                            }));
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                            isSelected
                              ? "border-teal-500 bg-teal-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 border rounded flex items-center justify-center ${
                              isSelected
                                ? "border-teal-600 bg-teal-600"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-slate-800">
                            {feature.featureName}
                          </span>
                        </button>
                      );
                    })
                  )}
              </div>
            )}
          </div>
        );

      case "view":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                What view does the room have?
              </h2>
              <p className="text-slate-600">
                Select the primary view from this room
              </p>
            </div>
            {loadingFeatures ? (
              <div className="text-center">Loading view options...</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(groupedFeatures)
                  .filter(([category]) => category === "View")
                  .map(([category, features]) =>
                    features.map((feature) => (
                      <button
                        key={feature.roomFeatureID}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            view: feature.featureName,
                          })
                        }
                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                          formData.view === feature.featureName
                            ? "border-teal-500 bg-teal-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 border rounded-full ${
                            formData.view === feature.featureName
                              ? "border-teal-600"
                              : "border-gray-300"
                          } flex items-center justify-center`}
                        >
                          {formData.view === feature.featureName && (
                            <div className="w-3 h-3 bg-sky-600 rounded-full"></div>
                          )}
                        </div>
                        <span className="font-medium text-slate-800">
                          {feature.featureName}
                        </span>
                        {formData.view === feature.featureName && (
                          <Check className="w-5 h-5 text-sky-600 ml-auto" />
                        )}
                      </button>
                    ))
                  )}
              </div>
            )}
          </div>
        );

      case "washroom":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Select washroom features
              </h2>
              <p className="text-slate-600">
                Choose all washroom amenities available
              </p>
            </div>
            {loadingFeatures ? (
              <div className="text-center">Loading washroom features...</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(groupedFeatures)
                  .filter(([category]) => category === "Washroom")
                  .map(([category, features]) =>
                    features.map((feature) => {
                      const isSelected = formData.washroom.includes(
                        feature.featureName
                      );
                      return (
                        <button
                          key={feature.roomFeatureID}
                          onClick={() => {
                            if (isSelected) {
                              setFormData({
                                ...formData,
                                washroom: formData.washroom.filter(
                                  (w) => w !== feature.featureName
                                ),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                washroom: [
                                  ...formData.washroom,
                                  feature.featureName,
                                ],
                              });
                            }
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${
                            isSelected
                              ? "border-teal-500 bg-teal-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 border rounded ${
                              isSelected
                                ? "border-teal-600 bg-sky-600"
                                : "border-gray-300"
                            } flex items-center justify-center`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-slate-800">
                            {feature.featureName}
                          </span>
                        </button>
                      );
                    })
                  )}
              </div>
            )}
          </div>
        );

      case "images":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Upload room photos
              </h2>
              <p className="text-slate-600">Add photos to showcase your room</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {photoPreviews.map((url, idx) => (
                  <div key={idx} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPhotos = formData.photos.filter(
                          (_, i) => i !== idx
                        );
                        const updatedPreviews = photoPreviews.filter(
                          (_, i) => i !== idx
                        );
                        setFormData((prev) => ({
                          ...prev,
                          photos: updatedPhotos,
                        }));
                        setPhotoPreviews(updatedPreviews);
                      }}
                      className="absolute top-1 right-1 text-red-500 hover:text-red-600 bg-white rounded-full p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                    <img
                      src={url || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Select images to upload</p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <Label htmlFor="photo-upload">
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>
        );

      case "roomCount":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                How many rooms of this type?
              </h2>
              <p className="text-slate-600">
                Specify the total number of rooms
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setNumberOfRooms(Math.max(1, (numberOfRooms || 1) - 1))
                  }
                  disabled={(numberOfRooms || 1) <= 1}
                  className="bg-white border-sky-400 text-black border-4 hover:bg-white hover:border-sky-400 hover:text-black text-xl"
                >
                  -
                </Button>
                <div className="text-4xl font-bold text-teal-600 min-w-16 text-center">
                  {numberOfRooms || 1}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNumberOfRooms((numberOfRooms || 1) + 1)}
                  className="bg-white border-sky-400 text-black border-4 hover:bg-white hover:border-sky-400 hover:text-black text-xl"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        );

      case "roomNumbers":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Assign room numbers
              </h2>
              <p className="text-slate-600">Enter room numbers for each room</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: numberOfRooms || 1 }, (_, idx) => (
                  <div key={idx} className="space-y-2">
                    <Label>Room {idx + 1}</Label>
                    <Input
                      placeholder={`Room ${idx + 1} number`}
                      value={formData.roomNumbers[idx] || ""}
                      onChange={(e) =>
                        handleRoomNumberChange(idx, e.target.value)
                      }
                      className="bg-white text-black focus:border-sky-400"
                    />
                  </div>
                ))}
              </div>

              {/* Fixed-height message area to prevent layout shift */}
              <div className="relative min-h-[28px]">
                <p
                  className={[
                    "absolute inset-0 text-sm text-red-500 text-center transition-opacity duration-200",
                    hasDuplicateRoomNumber
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none",
                  ].join(" ")}
                  aria-live="polite"
                >
                  Duplicate room numbers detected. Please ensure all room
                  numbers are unique.
                </p>

                <p
                  className={[
                    "absolute inset-0 text-sm text-yellow-500 text-center transition-opacity duration-200",
                    isValidatingRoomNumbers
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none",
                  ].join(" ")}
                  aria-live="polite"
                >
                  Validating room numbers...
                </p>
              </div>
            </div>
          </div>
        );
      case "description":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Describe your room
              </h2>
              <p className="text-slate-600">
                Provide details about what makes this room special
              </p>
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Describe the room features, ambiance, and what guests can expect..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="min-h-32 bg-white text-black focus:border-sky-400"
                required
              />

              {/* Write with AI */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={aiWriting}
                  onClick={async () => {
                    setAiWriting(true);
                    try {
                      // small pause for UX smoothness (optional)
                      await new Promise((r) => setTimeout(r, 250));

                      const payload = {
                        // optional property context if you have them in localStorage or props
                        // propertyName, propertyType, city, country,

                        // pull from current form:
                        roomType: formData.roomType || formData.title,
                        title: formData.title,
                        adultSpace: Number(formData.adultSpace || 0),
                        childSpace: Number(formData.childSpace || 0),
                        amenities: formData.amenities,
                        bedding: formData.bedding,
                        view: formData.view,
                        washroom: formData.washroom,
                        existingNotes: formData.description,
                        // language: "English",
                        // tone: "warm, modern",
                      };

                      let text = "";
                      try {
                        text = await generateRoomTypeCopy(payload);
                      } catch {
                        // fallback to local composer if API fails
                        text = composeRoomDescription(formData);
                      }

                      setFormData((prev) => ({
                        ...prev,
                        description:
                          (prev.description?.trim()
                            ? prev.description.trim() + "\n\n"
                            : "") + text,
                      }));
                    } finally {
                      setAiWriting(false);
                    }
                  }}
                  className="rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow hover:brightness-110 transition-all duration-200 px-5 h-10"
                >
                  {aiWriting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Writing…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Write with AI
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Review room type details
              </h2>
              <p className="text-slate-600">
                Please review all information before creating
              </p>
            </div>
            <div className="space-y-4 text-black">
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-2">
                  {formData.roomType}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Adults:</span>{" "}
                    {formData.adultSpace}
                  </div>
                  <div>
                    <span className="text-slate-600">Children:</span>{" "}
                    {formData.childSpace}
                  </div>
                  <div>
                    <span className="text-slate-600">Rooms:</span>{" "}
                    {numberOfRooms}
                  </div>
                  <div>
                    <span className="text-slate-600">Bedding:</span>{" "}
                    {formData.bedding.join(", ")}
                  </div>

                  <div>
                    <span className="text-slate-600">View:</span>{" "}
                    {formData.view}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-slate-600 text-sm mb-1">
                    Description:
                  </div>
                  <p className="text-sm">{formData.description}</p>
                </div>
                <div className="mt-4">
                  <div className="text-slate-600 text-sm mb-1">Amenities:</div>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-teal-100 text-sky-800 px-2 py-1 rounded-full text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-slate-600 text-sm mb-1">
                    Washroom Features:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.washroom.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-slate-600 text-sm mb-1">
                    Room Numbers:
                  </div>
                  <p className="text-sm">{formData.roomNumbers.join(", ")}</p>
                </div>
                <div className="mt-4">
                  <div className="text-slate-600 text-sm mb-1">Images:</div>
                  <p className="text-sm">
                    {formData.photos.length} photo(s) uploaded
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="top-10 right-10 absolute">
        <VideoButton
          onClick={() => setShowRawOverlay(true)}
          label="Watch Video"
        />
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backText}</span>
            </Button>
            <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full flex flex-row gap-6 items-center">
              <div>
                {currentStep + 1}/{STEPS.length}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center mb-2">
            <Image
              src={Logo}
              alt="Logo"
              className="mx-auto"
              width={34}
              height={34}
            />
            <h1 className="font-extrabold text-slate-800 mt-2">HOTEL MATE</h1>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 mb-8">
            <div
              className="bg-gradient-to-r from-sky-500 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <Card className="bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
            <CardContent className="p-6 sm:p-8">{renderStep()}</CardContent>
          </Card>

          <div className=" mt-6 gap-2">
            {currentStep === STEPS.length - 1 ? (
              <div className="flex justify-center mt-6 gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  {isSubmitting ? "Creating..." : createRoomType}
                </Button>
              </div>
            ) : (
              <div className="flex flex-row justify-between">
                {/* ✅ Show Skip only if roomCreated is true */}
                {roomCreatedFlag && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.removeItem("roomCreated");
                      }
                      router.replace("/add-rate");
                    }}
                    className="px-8 py-3 rounded-xl font-medium w-full sm:w-auto"
                  >
                    Skip
                  </Button>
                )}

                <Button
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-sky-300 to-sky-600 hover:from-sky-600 hover:to-sky-600 disabled:from-slate-300 disabled:to-slate-400 text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  {continueText}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              Create another room?
            </DialogTitle>
            <DialogDescription>
              Your room type was created successfully. Would you like to add
              another room type now, or go to rate setup?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <div className="mb-1 font-medium">Next steps</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                “Create another” will reset this wizard for a fresh entry.
              </li>
              <li>
                “Go to rates” will take you to the rate configuration page.
              </li>
            </ul>
          </div>

          <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-800">
                  Create another room?
                </DialogTitle>
                <DialogDescription>
                  Your room type was created successfully. Would you like to add
                  another room type now, or go to rate setup?
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                <div className="mb-1 font-medium">Next steps</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    “Create another” will reset this wizard for a fresh entry.
                  </li>
                  <li>
                    “Go to rates” will take you to the rate configuration page.
                  </li>
                </ul>
              </div>

              <DialogFooter className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccessModal(false);
                    resetForm();
                    // ✅ set roomCreated = true
                    if (typeof window !== "undefined") {
                      localStorage.setItem("roomCreated", "true");
                    }
                  }}
                >
                  Create another
                </Button>

                <Button
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"
                  onClick={() => {
                    setShowSuccessModal(false);
                    // ✅ remove roomCreated if it exists
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("roomCreated");
                    }
                    router.replace("/add-rate");
                  }}
                >
                  Go to rates
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
      <VideoOverlay
        videoUrl={videoUrl}
        isOpen={showRawOverlay}
        onClose={() => setShowRawOverlay(false)}
      />
    </div>
  );
}

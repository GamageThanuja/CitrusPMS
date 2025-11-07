"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { updateHotelRoomTypeImage } from "@/redux/slices/updateHotelRoomTypeImageSlice";
import { createHotelRoomTypeImage } from "@/redux/slices/createHotelRoomTypeImageSlice";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { updateHotelRoomType } from "@/redux/slices/updateHotelRoomTypeSlice";
import { updateHotelRoomNumber } from "@/redux/slices/updateHotelRoomNumberSlice";
import { fetchHotelRoomNumbers } from "@/redux/slices/fetchHotelRoomNumbersSlice";
import { RootState } from "@/redux/store";
import { log } from "console";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface RoomTypeFormData {
  noOfRooms: string | number | readonly string[] | undefined;
  id?: string;
  roomType: string;
  title: string;
  description: string;
  adultSpace: string;
  childSpace: string;
  amenities: { category: string; name: string }[];
  bedding: string;
  view: string;
  washroom: string[];
  roomNumbers: string[];
  photo: File | string | null;
  images?: (File | string)[]; // Allow File objects for new uploads
}

interface EditRoomTypeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RoomTypeFormData) => void;
  onDelete: (id?: string) => void;
  roomTypeData: RoomTypeFormData | null;
}

export function EditRoomTypeDrawer({
  isOpen,
  onClose,
  onSave,
  onDelete,
  roomTypeData,
}: EditRoomTypeDrawerProps) {
  const initialFormData: RoomTypeFormData = {
    id: undefined,
    roomType: "",
    title: "",
    description: "",
    adultSpace: "",
    childSpace: "",
    amenities: [],
    bedding: "",
    view: "",
    washroom: [],
    roomNumbers: [],
    photo: null,
    images: [],
    noOfRooms: "0",
  };
  const [formData, setFormData] = useState<RoomTypeFormData>(initialFormData);
  const { toast } = useToast();
  const dispatch = useDispatch();

  interface RoomFeature {
    roomFeatureID: number;
    featureCategory: string;
    featureName: string;
    isSelected: boolean;
    hotelRoomFeatureID?: number;
  }

  const [roomFeatures, setRoomFeatures] = useState<RoomFeature[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hotelID, setHotelID] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const { fullName } = useUserFromLocalStorage();
  const [selectedMainImageId, setSelectedMainImageId] = useState<number | null>(
    null
  );

  const [showRawOverlay, setShowRawOverlay] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const { tutorial, status: tutStatus } = useTutorial(
    "roomsAndRates",
    "editRatePlan"
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  const handleNewImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files));
    }
  };

  const hotelRoomNumbers = useSelector(
    (state: RootState) => state.fetchHotelRoomNumbers.data
  );

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchHotelRoomNumbers());
    }
  }, [isOpen, dispatch]);

  const getRoomIDByNumber = (roomNo: string, roomTypeID?: number) => {
    return hotelRoomNumbers.find(
      (r) =>
        r.roomNo.trim().toLowerCase() === roomNo.trim().toLowerCase() &&
        (roomTypeID ? r.roomTypeID === roomTypeID : true)
    )?.roomID;
  };

  console.log("hotel room numbers : ", hotelRoomNumbers);

  const handleUploadNewImages = async () => {
    const roomTypeId = Number(formData.id ?? roomTypeData?.id);
    if (!roomTypeId) return;
    for (const image of newImages) {
      const base64Image = await toBase64(image);

      const payload = {
        imageID: 0,
        hotelRoomTypeID: Number(formData.id),
        imageURL: "",
        description: "",
        isMain: false, // Not main by default
        finAct: false,
        base64Image,
        imageFileName: image.name,
      };

      await dispatch(createHotelRoomTypeImage(payload));
    }
    await fetchRoomTypeImages(roomTypeId);
    setNewImages([]); // Clear after upload
  };

  useEffect(() => {
    const fetchFeatures = async () => {
      const tokens = JSON.parse(
        localStorage.getItem("hotelmateTokens") || "{}"
      );
      const selectedProperty = JSON.parse(
        localStorage.getItem("selectedProperty") || "{}"
      );
      const hotelID = selectedProperty.id;

      try {
        const headers = { Authorization: `Bearer ${tokens.accessToken}` };

        const [allFeaturesRes, hotelFeaturesRes] = await Promise.all([
          fetch(`${BASE_URL}/api/RoomFeature`, { headers }),
          fetch(`${BASE_URL}/api/HotelRoomFeature/hotel-id/${hotelID}`, {
            headers,
          }),
        ]);

        const allFeatures = await allFeaturesRes.json();
        const hotelFeatures = await hotelFeaturesRes.json();

        const selected: string[] = hotelFeatures
          .filter((f: any) => f.isTrue && f.roomFeature)
          .map((f: any) => f.roomFeature.featureName);

        const formattedFeatures = allFeatures.map((f: any) => {
          const matchedFeature = hotelFeatures.find(
            (hf: any) => hf.roomFeature?.featureName === f.featureName
          );

          return {
            roomFeatureID: f.roomFeatureID,
            featureCategory: f.featureCategory,
            featureName: f.featureName,
            isSelected: matchedFeature?.isTrue || false,
            hotelRoomFeatureID: matchedFeature?.hotelRoomFeatureID || undefined,
          };
        });

        setRoomFeatures(formattedFeatures);
      } catch (err) {
        console.error("Feature fetch failed", err);
      }
    };

    if (isOpen) fetchFeatures();
  }, [isOpen]);

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

  const [numberOfRooms, setNumberOfRooms] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("details");

  // Track duplicate room number state
  const [hasDuplicateRoomNumber, setHasDuplicateRoomNumber] = useState(false);

  // Track duplicate room type name state
  const [roomNameExists, setRoomNameExists] = useState(false);

  useEffect(() => {
    if (!roomTypeData) {
      setFormData(initialFormData);
      setNumberOfRooms(0);
      return;
    }
    // Ensure noOfRooms is a string for input binding, and correctly reflects the count
    const currentNoOfRooms =
      roomTypeData.noOfRooms?.toString() ??
      roomTypeData.roomNumbers.length.toString();
    setFormData({
      ...roomTypeData,
      noOfRooms: currentNoOfRooms,
      description: roomTypeData.description || "",
    });
    setNumberOfRooms(
      parseInt(currentNoOfRooms, 10) || roomTypeData.roomNumbers.length || 0
    );
  }, [roomTypeData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "roomType" && activeTab === "details") {
      const roomTypeMap = JSON.parse(
        localStorage.getItem("roomTypeMap") || "[]"
      );
      const normalizedInput = value.toLowerCase().replace(/\s+/g, " ").trim();

      const isDuplicateName = roomTypeMap.some(
        (r: { id: string | number; name: string }) =>
          r.name.toLowerCase().replace(/\s+/g, " ").trim() ===
            normalizedInput && r.id !== formData.id
      );
      setRoomNameExists(isDuplicateName);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => {
      const updatedAmenities = [...prev.amenities];
      if (checked) {
        updatedAmenities.push({ category: "General", name: value });
      } else {
        const filtered = updatedAmenities.filter((a) => a.name !== value);
        return { ...prev, amenities: filtered };
      }
      return { ...prev, amenities: updatedAmenities };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length === 0) return;

      setFormData((prev) => {
        const newFormData = { ...prev };
        let newFilesForImages = [...filesArray];

        // If current photo is not a File (i.e., it's a string URL or null),
        // assign the first new file to 'photo'.
        if (!newFormData.photo || typeof newFormData.photo === "string") {
          newFormData.photo = newFilesForImages.shift() || null;
        }
        newFormData.images = [
          ...(newFormData.images || []),
          ...newFilesForImages,
        ];
        return newFormData;
      });
    }
  };

  const handleRoomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputCount = parseInt(e.target.value) || 0;
    const originalCount = roomTypeData?.roomNumbers?.length || 0;
    const minCount = originalCount;

    if (inputCount < minCount) return; // Disallow decreasing below original count

    setNumberOfRooms(inputCount);
    setFormData((prev) => {
      const currentRoomNumbers = prev.roomNumbers || [];
      const newRoomNumbers = Array.from(
        { length: inputCount },
        (_, i) => currentRoomNumbers[i] || ""
      );
      return {
        ...prev,
        roomNumbers: newRoomNumbers,
        noOfRooms: inputCount.toString(),
      };
    });
  };
  const handleRoomNumberChange = (idx: number, value: string) => {
    const allRoomNumbers: string[] = JSON.parse(
      localStorage.getItem("allRoomNumbers") || "[]"
    );
    const existingRoomNumbers = roomTypeData?.roomNumbers || [];

    const otherRoomNumbers = allRoomNumbers.filter(
      (n) => !existingRoomNumbers.includes(n)
    );

    const currentValues = formData.roomNumbers.filter((_, i) => i !== idx);
    const normalizedInput = value.trim().toLowerCase();

    const isDuplicate =
      currentValues
        .map((v) => v.trim().toLowerCase())
        .includes(normalizedInput) ||
      otherRoomNumbers
        .map((v) => v.trim().toLowerCase())
        .includes(normalizedInput);

    setHasDuplicateRoomNumber(isDuplicate);

    setFormData((prev) => {
      const arr = [...prev.roomNumbers];
      arr[idx] = value;
      return { ...prev, roomNumbers: arr };
    });
  };

  const submit = async () => {
    // Check for duplicate room numbers across all types
    const allRoomNumbers: string[] = JSON.parse(
      localStorage.getItem("allRoomNumbers") || "[]"
    );
    const existingRoomNumbers = roomTypeData?.roomNumbers || [];
    const otherRoomTypeNumbers = allRoomNumbers.filter(
      (num) => !existingRoomNumbers.includes(num)
    );
    const normalize = (s: string) => s.trim().toLowerCase();
    const currentValues = formData.roomNumbers.map(normalize);

    const hasAnyDuplicate = currentValues.some((num) =>
      otherRoomTypeNumbers.map(normalize).includes(num)
    );

    if (hasAnyDuplicate) {
      toast({
        title: "Duplicate Room Numbers",
        description: "Some room numbers already exist in other room types.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.id || !accessToken || !hotelID) {
      toast({
        title: "Error",
        description: "Missing required information to save.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    let didUpdate = false;
    try {
      // --- Room Details Update ---
      if (activeTab === "details") {
        const payload = {
          hotelRoomTypeID: Number(formData.id),
          hotelID: hotelID,
          roomType: formData.roomType,
          adultSpace: Number(formData.adultSpace),
          childSpace: Number(formData.childSpace),
          noOfRooms: Number(formData.noOfRooms) || numberOfRooms,
          cmid: "aaa",
          updatedBy: currentUser,
          roomDescription: formData.description || "",
          finAct: false,
        };

        await dispatch(updateHotelRoomType(payload));

        console.log("payload detail : ", payload);

        // if (!response.ok) {
        //   const errorData = await response.json();
        //   throw new Error(errorData.title || "Failed to update room type.");
        // }
        didUpdate = true;
      }

      // --- Room Image Update ---
      if (activeTab === "image") {
        // ✅ these have imageID
        console.log("hi1");

        const allExistingImages = imageObjects;

        console.log("hi1", allExistingImages);

        // flip isMain ONLY where it changed
        for (const existing of allExistingImages) {
          console.log("hi2");
          if (!existing?.imageID) continue; // safety
          console.log("hi3");
          const shouldBeMain =
            selectedMainImageId != null &&
            existing.imageID === selectedMainImageId;
          console.log("hi4");
          if (existing.isMain !== shouldBeMain) {
            console.log("hi5");
            const payload = {
              imageID: existing.imageID,
              hotelID,
              hotelRoomTypeID: Number(formData.id),
              imageURL: existing.imageURL ?? "",
              description: existing.description ?? "",
              isMain: shouldBeMain,
              finAct: existing.finAct ?? false,
              updatedOn: new Date().toISOString(),
              updatedBy: currentUser,
              createdBy: existing.createdBy ?? fullName,
              createdOn: existing.createdOn ?? new Date().toISOString(),
              base64Image: "",
              imageFileName: existing.imageFileName ?? "",
            };
            console.log("hi6");
            console.log("hi6", payload);
            await dispatch(
              updateHotelRoomTypeImage({
                id: existing.imageID,
                imageData: payload,
              })
            );
            console.log("hi7");
          }
        }

        // new uploads (unchanged) — if no selectedMainImageId, you allow a NEW file to be main
        if (formData.images) {
          for (const image of formData.images) {
            if (typeof image !== "string") {
              const base64Image = await toBase64(image);
              const isMainNew =
                selectedMainImageId == null &&
                formData.photo &&
                typeof formData.photo !== "string" &&
                (formData.photo as File).name === image.name;

              const payload = {
                imageID: 0,
                hotelID,
                hotelRoomTypeID: Number(formData.id),
                imageURL: "",
                description: "",
                isMain: !!isMainNew,
                finAct: false,
                createdOn: new Date().toISOString(),
                createdBy: fullName,
                updatedOn: new Date().toISOString(),
                updatedBy: currentUser,
                base64Image,
                imageFileName: image.name,
              };

              await dispatch(createHotelRoomTypeImage(payload));
            }
          }
        }

        didUpdate = true;

        // (optional) re-fetch to refresh the grid after save
        // ... call the same GET as above and setImageObjects(...)
      }
      // --- Amenities Update ---
      if (activeTab === "amenities") {
        try {
          const featurePayloads = roomFeatures.map((feature) => ({
            hotelRoomFeatureID: feature.hotelRoomFeatureID || 0,

            hotelID,
            roomFeatureID: feature.roomFeatureID,
            hotelRoomTypeID: Number(formData.id),
            isTrue: feature.isSelected,
            roomFeature: {
              roomFeatureID: feature.roomFeatureID,
              featureCategory: feature.featureCategory,
              featureName: feature.featureName,
            },
            hotelRoomType: {
              hotelRoomTypeID: Number(formData.id),
            },
          }));

          const newFeatures = featurePayloads.filter(
            (f) => f.hotelRoomFeatureID === 0
          );
          const existingFeatures = featurePayloads.filter(
            (f) => f.hotelRoomFeatureID !== 0
          );

          if (newFeatures.length > 0) {
            await fetch(`${BASE_URL}/api/HotelRoomFeature/multiple`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(newFeatures),
            });
          }

          if (existingFeatures.length > 0) {
            await fetch(`${BASE_URL}/api/HotelRoomFeature/multiple`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(existingFeatures),
            });
          }

          didUpdate = true;
        } catch (featureErr: any) {
          toast({
            title: "Error",
            description: featureErr.message || "Failed to update amenities.",
            variant: "destructive",
          });
        }
      }

      // --- Room Numbers Update ---
      // --- Room Numbers Update ---
      if (activeTab === "numbers") {
        try {
          // Build original list aligned by index
          const originalRoomNumbers = (roomTypeData?.roomNumbers || []).map(
            (num, idx) => ({
              roomNo: num,
              roomID: (roomTypeData as any)?.roomNumberIDs?.[idx] || undefined,
            })
          );

          const roomTypeIdNum = Number(formData.id);
          let newRoomAdded = false;

          // (Optional) fast lookup from slice by current DB state
          const lc = (s: string) => (s ?? "").trim().toLowerCase();
          const sliceMap = new Map<string, number>();
          hotelRoomNumbers
            .filter((r) => r.roomTypeID === roomTypeIdNum)
            .forEach((r) =>
              sliceMap.set(`${r.roomTypeID}|${lc(r.roomNo)}`, r.roomID)
            );

          await Promise.all(
            formData.roomNumbers.map(async (roomNo, idx) => {
              const existing = originalRoomNumbers[idx]; // may be undefined for new index
              const oldLc = lc(existing?.roomNo || "");
              const newLc = lc(roomNo);

              // 1) UPDATE (rename existing index)
              if (existing) {
                // unchanged -> skip
                if (oldLc === newLc) return;

                // Use the existing roomID (primary source of truth)
                let roomID = existing.roomID;

                // Fallbacks if original didn't come with IDs
                if (!roomID && oldLc) {
                  roomID = sliceMap.get(`${roomTypeIdNum}|${oldLc}`);
                }
                if (!roomID) {
                  console.warn(
                    `Cannot resolve roomID for original room '${existing.roomNo}' (index ${idx}). Skipping.`
                  );
                  return;
                }
                console.log("hiiiiiiiiiiiii", roomID);

                await dispatch(
                  updateHotelRoomNumber({
                    id: roomID,
                    payload: {
                      roomID,
                      hotelID,
                      roomNo, // new value
                      roomTypeID: roomTypeIdNum,
                      hotelRoomType: {
                        hotelRoomTypeID: roomTypeIdNum,
                        hotelID,
                        roomType: formData.roomType,
                        adultSpace: Number(formData.adultSpace),
                        childSpace: Number(formData.childSpace),
                        noOfRooms: Number(formData.noOfRooms),
                        cmid: "aaa",
                        createdTimeStamp: new Date().toISOString(),
                        createdBy: currentUser,
                        updatedBy: currentUser,
                        updatedTimeStamp: new Date().toISOString(),
                        finAct: false,
                        roomDescription: formData.description,
                      },
                      housekeepingStatus: "Clean",
                      finAct: false,
                      createdOn: new Date().toISOString(),
                      createdBy: currentUser,
                    },
                  })
                );
                console.log(
                  "hi4",
                  JSON.stringify(
                    {
                      roomID: existing.roomID,
                      hotelID,
                      roomNo,
                      roomTypeID: Number(formData.id),
                      hotelRoomType: {
                        hotelRoomTypeID: Number(formData.id),
                        hotelID,
                        roomType: formData.roomType,
                        adultSpace: Number(formData.adultSpace),
                        childSpace: Number(formData.childSpace),
                        noOfRooms: Number(formData.noOfRooms),
                        cmid: "aaa",
                        createdTimeStamp: new Date().toISOString(),
                        createdBy: currentUser,
                        updatedBy: currentUser,
                        updatedTimeStamp: new Date().toISOString(),
                        finAct: false,
                        roomDescription: formData.description,
                      },
                      finAct: false,
                      createdOn: new Date().toISOString(),
                      createdBy: currentUser,
                    },
                    null,
                    2 // indentation spaces for pretty-print
                  )
                );
                return;
              }

              // 2) CREATE (index beyond original length)
              if (!existing && newLc) {
                newRoomAdded = true;
                await fetch(`${BASE_URL}/api/HotelRoomNumber`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    roomID: 0,
                    hotelID,
                    roomNo,
                    roomTypeID: roomTypeIdNum,
                    hotelRoomType: {
                      hotelRoomTypeID: roomTypeIdNum,
                    },
                    finAct: false,
                    housekeepingStatus: "Clean",
                    createdBy: fullName,
                  }),
                });
              }
            })
          );

          // keep count in sync if we inserted any new rows
          if (newRoomAdded) {
            await dispatch(
              updateHotelRoomType({
                hotelRoomTypeID: roomTypeIdNum,
                hotelID,
                roomType: formData.roomType,
                adultSpace: Number(formData.adultSpace),
                childSpace: Number(formData.childSpace),
                noOfRooms: formData.roomNumbers.length,
                cmid: "aaa",
                updatedBy: currentUser,
                finAct: false,
                createdBy: currentUser,
                createdTimeStamp: new Date().toISOString(),
                updatedTimeStamp: new Date().toISOString(),
                roomDescription: formData.description || "",
              })
            );
            // Optional: refresh the slice so future edits resolve fresh IDs
            dispatch(fetchHotelRoomNumbers());
          }

          didUpdate = true;
        } catch (roomNumErr: any) {
          toast({
            title: "Error",
            description: roomNumErr.message || "Failed to update room numbers.",
            variant: "destructive",
          });
        }
      }

      // Show final toast and callbacks only if something was updated
      if (didUpdate) {
        toast({
          title: "Success",
          description: "Changes saved successfully.",
        });
        onSave(formData);
        const updatedAllRoomNumbers = JSON.parse(
          localStorage.getItem("allRoomNumbers") || "[]"
        )
          .filter((num: string) => !existingRoomNumbers.includes(num)) // remove old ones
          .concat(formData.roomNumbers); // add updated ones

        localStorage.setItem(
          "allRoomNumbers",
          JSON.stringify([...new Set(updatedAllRoomNumbers)])
        );

        onClose();
      }
    } catch (error: any) {
      console.error("Failed to save room type:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = () => {
    onDelete(formData.id);
    onClose();
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const groupedAmenities: Record<string, string[]> = {};

  formData.amenities.forEach(({ category, name }) => {
    if (!groupedAmenities[category]) {
      groupedAmenities[category] = [];
    }
    if (!groupedAmenities[category].includes(name)) {
      groupedAmenities[category].push(name);
    }
  });

  const photoPreviews = useMemo(() => {
    const urls = new Set<string>();

    if (formData.images) {
      formData.images.forEach((img) => {
        const url = typeof img === "string" ? img : URL.createObjectURL(img);
        urls.add(url);
      });
    }

    if (formData.photo) {
      const photoUrl =
        typeof formData.photo === "string"
          ? formData.photo
          : URL.createObjectURL(formData.photo);

      urls.add(photoUrl);
    }

    return Array.from(urls);
  }, [formData.photo, formData.images]);

  useEffect(() => {
    const m = (roomTypeData?.imageObjects || []).find((x: any) => x.isMain);
    setSelectedMainImageId(m?.imageID ?? null);
  }, [roomTypeData]);

  // add this effect (near your other useEffects)
  useEffect(() => {
    const objs = (roomTypeData as any)?.imageObjects ?? [];
    if (objs.length) {
      // merge unique URLs into formData.images as strings
      setFormData((prev) => ({
        ...prev,
        images: [
          ...new Set([
            ...(prev.images || []),
            ...objs
              .map(
                (o: any) =>
                  o.imageURL || o.imageUrl || o.url || o.imageFilePath || ""
              )
              .filter(Boolean),
          ]),
        ],
      }));
    }
  }, [roomTypeData]);

  // at top

  const API_BASE = `${BASE_URL}/api`;
  const [imageObjects, setImageObjects] = useState<any[]>([]);

  // fetch when drawer opens / tab = image
  useEffect(() => {
    if (!isOpen || activeTab !== "image") return;

    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };
    const roomTypeId = Number(roomTypeData?.id ?? formData.id);
    if (!roomTypeId) return;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/HotelRoomTypeImage/room-type/${roomTypeId}`,
          { headers }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list = await res.json(); // [{ imageID, imageURL, isMain, ... }]
        setImageObjects(list ?? []);

        const main = (list ?? []).find((x: any) => x.isMain);
        setSelectedMainImageId(main?.imageID ?? null);
      } catch (err) {
        console.error("Failed to load room images", err);
      }
    })();
  }, [isOpen, activeTab, roomTypeData?.id, formData.id]);

  const fetchRoomTypeImages = async (roomTypeId: number) => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const headers = { Authorization: `Bearer ${tokens.accessToken}` };

    const res = await fetch(
      `${API_BASE}/HotelRoomTypeImage/room-type/${roomTypeId}`,
      { headers }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    setImageObjects(list ?? []);

    const main = (list ?? []).find((x: any) => x.isMain);
    setSelectedMainImageId(main?.imageID ?? null);
  };

  useEffect(() => {
    if (!isOpen || activeTab !== "image") return;
    const roomTypeId = Number(roomTypeData?.id ?? formData.id);
    if (!roomTypeId) return;
    fetchRoomTypeImages(roomTypeId).catch((err) =>
      console.error("Failed to load room images", err)
    );
  }, [isOpen, activeTab, roomTypeData?.id, formData.id]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto rounded-l-2xl"
      >
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-2xl font-bold">Edit Room Type</SheetTitle>
          <SheetDescription>
            Modify fields or delete this room type.
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6 px-[10px]">
          <Tabs
            defaultValue="details"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="details">Room Details</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="image">Room Images</TabsTrigger>
              <TabsTrigger value="numbers">Number of Rooms</TabsTrigger>
            </TabsList>

            {/* Room Details Tab */}
            <TabsContent value="details">
              <div className="space-y-4">
                <Label>Room Type</Label>
                <Input
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                />
                {roomNameExists && (
                  <p className="text-sm text-red-500 mt-1">
                    Room name is already being used by this property.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Adult Space</Label>
                    <Input
                      type="number"
                      name="adultSpace"
                      value={formData.adultSpace}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label>Child Space</Label>
                    <Input
                      type="number"
                      name="childSpace"
                      value={formData.childSpace}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <br></br>
                <Label>No of Rooms</Label>
                <Input
                  type="number"
                  name="noOfRooms"
                  value={formData.noOfRooms}
                  readOnly
                  className="bg-gray-100 dark:bg-black dark:text-white cursor-not-allowed"
                />
                <Label>Description</Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </TabsContent>

            {/* Room Image Tab */}
            <TabsContent value="image">
              <Label className="mb-2 block">Room Images</Label>

              {/* Prefer server images via imageObjects */}
              {imageObjects.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {imageObjects.map((img: any) => {
                    const raw =
                      img.imageURL ||
                      img.imageUrl ||
                      img.url ||
                      img.imageFilePath ||
                      "";
                    const src = raw?.startsWith("http")
                      ? raw
                      : `${BASE_URL}${raw}`;

                    return (
                      <div key={img.imageID} className="relative">
                        <img
                          src={src}
                          alt={img.imageFileName || "room image"}
                          className="w-full h-32 object-cover rounded-md border shadow-sm"
                        />
                        <div className="absolute bottom-1 left-1 bg-white/80 rounded px-2 py-0.5 text-xs">
                          <label className="flex items-center gap-1">
                            <input
                              type="radio"
                              name="mainImage"
                              checked={selectedMainImageId === img.imageID}
                              onChange={() => {
                                setSelectedMainImageId(img.imageID);
                                // photo preview is optional; selectedMainImageId is the source of truth
                                setFormData((prev) => ({
                                  ...prev,
                                  photo: src,
                                }));
                              }}
                            />
                            Main
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : photoPreviews.length > 0 ? (
                // Fallback to previews (strings or local File object URLs)
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {photoPreviews.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-md border shadow-sm"
                      />
                      <div className="absolute bottom-1 left-1 bg-white bg-opacity-80 rounded px-2 py-0.5 text-xs">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="mainImage"
                            checked={formData.photo === url}
                            onChange={() =>
                              setFormData((prev) => ({ ...prev, photo: url }))
                            }
                          />
                          Main
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  No images selected or available.
                </p>
              )}

              {/* New uploads (unchanged) */}
              <div className="mt-6 space-y-2">
                <Label>Upload New Room Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewImageSelection}
                />
                {newImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                    {newImages.map((file) => {
                      const url = URL.createObjectURL(file);
                      const isMainNew =
                        typeof formData.photo !== "string" &&
                        formData.photo &&
                        (formData.photo as File).name === file.name;
                      return (
                        <div key={file.name} className="relative">
                          <img
                            src={url}
                            alt={file.name}
                            className="w-full h-32 object-cover rounded-md border shadow-sm"
                          />
                          <div className="absolute bottom-1 left-1 bg-white bg-opacity-80 rounded px-2 py-0.5 text-xs">
                            <label className="flex items-center gap-1">
                              <input
                                type="radio"
                                name="mainImage"
                                checked={isMainNew}
                                onChange={() => {
                                  setSelectedMainImageId(null);
                                  setFormData((prev) => ({
                                    ...prev,
                                    photo: file,
                                  }));
                                }}
                              />
                              Main
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {newImages.length > 0 && (
                  <Button
                    className="mt-2"
                    onClick={handleUploadNewImages}
                    disabled={isSubmitting}
                  >
                    Upload {newImages.length} Image
                    {newImages.length > 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Number of Rooms Tab */}
            <TabsContent value="numbers">
              <div className="space-y-4">
                <Label>Number of Rooms</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    onClick={() => {
                      if (
                        numberOfRooms > (roomTypeData?.roomNumbers?.length || 0)
                      ) {
                        const newCount = numberOfRooms - 1;
                        setNumberOfRooms(newCount);
                        setFormData((prev) => {
                          const updated = [...prev.roomNumbers];
                          updated.length = newCount; // Trim array
                          return {
                            ...prev,
                            roomNumbers: updated,
                            noOfRooms: newCount.toString(),
                          };
                        });
                      }
                    }}
                    disabled={
                      numberOfRooms <= (roomTypeData?.roomNumbers?.length || 0)
                    }
                    variant="outline"
                  >
                    -
                  </Button>

                  <span className="font-semibold">{numberOfRooms}</span>

                  <Button
                    type="button"
                    onClick={() => {
                      const newCount = numberOfRooms + 1;
                      setNumberOfRooms(newCount);
                      setFormData((prev) => {
                        const currentRoomNumbers = [
                          ...(prev.roomNumbers || []),
                        ];
                        const updated = Array.from(
                          { length: newCount },
                          (_, i) => currentRoomNumbers[i] || ""
                        );
                        return {
                          ...prev,
                          roomNumbers: updated,
                          noOfRooms: newCount.toString(),
                        };
                      });
                    }}
                    variant="outline"
                  >
                    +
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 bg-gray-100 text-black dark:bg-black dark:text-black">
                  {(formData.roomNumbers ?? []).map((num, idx) => {
                    const isOriginal =
                      idx < (roomTypeData?.roomNumbers?.length || 0);
                    return (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg shadow hover:shadow-md transition"
                      >
                        <Label className="block mb-1 bg-gray-100 text-black dark:bg-black dark:text-white">
                          Room {idx + 1}
                        </Label>
                        <Input
                          value={num}
                          onChange={(e) =>
                            handleRoomNumberChange(idx, e.target.value)
                          }
                          placeholder={`Room ${idx + 1}`}
                          className={
                            isOriginal
                              ? "bg-white text-black dark:bg-black dark:text-white"
                              : "bg-white text-black dark:bg-black dark:text-white"
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                {hasDuplicateRoomNumber && (
                  <p className="text-sm text-red-500 mt-2">
                    Room number already exists. Please enter a unique value.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Amenities Tab */}
            <TabsContent value="amenities">
              {roomFeatures.length > 0 ? (
                <div className="space-y-6 px-[10px]">
                  {(() => {
                    const grouped = roomFeatures.reduce<
                      Record<string, RoomFeature[]>
                    >((acc, f) => {
                      if (!acc[f.featureCategory]) acc[f.featureCategory] = [];
                      acc[f.featureCategory].push(f);
                      return acc;
                    }, {});

                    return Object.entries(grouped).map(
                      ([category, features]) => {
                        const isRadio = category === "View";
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

                        return (
                          <div key={category}>
                            <Label className="text-lg font-semibold mb-2 block">
                              {category}
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {features.map(({ featureName }) => {
                                const isSelected =
                                  roomFeatures.find(
                                    (f) =>
                                      f.featureCategory === category &&
                                      f.featureName === featureName
                                  )?.isSelected || false;

                                const inputType = isRadio
                                  ? "radio"
                                  : "checkbox";

                                return (
                                  <label
                                    key={featureName}
                                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm cursor-pointer hover:shadow-sm ${
                                      isSelected
                                        ? "bg-green-100 border-green-600 text-green-700 dark:bg-black dark:text-white"
                                        : "bg-white dark:bg-black dark:text-white"
                                    }`}
                                  >
                                    <input
                                      type={inputType}
                                      name={category}
                                      value={featureName}
                                      checked={isSelected}
                                      onChange={() => {
                                        setRoomFeatures((prev) =>
                                          prev.map((f) => {
                                            const isMatch =
                                              f.featureCategory === category &&
                                              f.featureName === featureName;

                                            if (isRadio) {
                                              if (
                                                f.featureCategory === category
                                              ) {
                                                return {
                                                  ...f,
                                                  isSelected: isMatch,
                                                };
                                              }
                                              return f;
                                            } else {
                                              return isMatch
                                                ? {
                                                    ...f,
                                                    isSelected: !f.isSelected,
                                                  }
                                                : f;
                                            }
                                          })
                                        );
                                      }}
                                      className="h-4 w-4 accent-green-600"
                                    />
                                    {featureName}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    );
                  })()}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Loading features...
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={submit}
              disabled={isSubmitting || hasDuplicateRoomNumber}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
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

// Example: Ensure all room numbers are loaded globally into localStorage
// You should call this logic at a higher level, e.g., after fetching all room types:
// localStorage.setItem("allRoomNumbers", JSON.stringify([...array of all room numbers from other room types]))

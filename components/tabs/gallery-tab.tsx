"use client";

import { useEffect, useState, ChangeEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  createHotelImage,
  deleteHotelImage,
  getHotelImages,
} from "@/controllers/hotelImageController";
import { getHotelRoomTypeImages } from "@/controllers/getHotelRoomTypeImagesController";

interface HotelImage {
  imageID: number;
  hotelID: number;
  hotelRoomTypeID?: number;
  imageFileName: string | null;
  imageURL?: string | null;
  description: string;
  isMain: boolean;
}

export default function GalleryTab() {
  const [hotelImages, setHotelImages] = useState<HotelImage[]>([]);
  const [roomImages, setRoomImages] = useState<HotelImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "property" | "room">(
    "all"
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // const fetchImages = async () => {
  //   try {
  //     const tokenString = localStorage.getItem("hotelmateTokens");
  //     const hotelString = localStorage.getItem("selectedProperty");
  //     if (!tokenString || !hotelString) return;

  //     const { accessToken } = JSON.parse(tokenString);
  //     const { id: hotelId } = JSON.parse(hotelString);

  //     const [hotelRes, roomRes] = await Promise.all([

  //         headers: { Authorization: `Bearer ${accessToken}` },
  //       }),
  //       fetch(

  //         {
  //           headers: { Authorization: `Bearer ${accessToken}` },
  //         }
  //       ),
  //     ]);

  //     const hotelData = hotelRes.ok ? await hotelRes.json() : [];
  //     const roomData = roomRes.ok ? await roomRes.json() : [];

  //     setHotelImages(hotelData);
  //     setRoomImages(roomData);
  //   } catch (err) {
  //     console.error("Error loading images:", err);
  //   }
  // };

  const fetchImages = async () => {
    try {
      const tokenString = localStorage.getItem("hotelmateTokens");
      const hotelString = localStorage.getItem("selectedProperty");
      if (!tokenString || !hotelString) return;

      const { accessToken } = JSON.parse(tokenString);
      const { id: hotelId } = JSON.parse(hotelString);

      // Fetch both in parallel
      const [hotelData, roomData] = await Promise.all([
        getHotelImages({ token: accessToken, hotelId }),
        getHotelRoomTypeImages({ token: accessToken, hotelId }),
      ]);

      setHotelImages(hotelData);
      setRoomImages(roomData);
    } catch (err) {
      console.error("Error loading images:", err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const imagesToDisplay =
    activeTab === "all"
      ? [...hotelImages, ...roomImages]
      : activeTab === "room"
      ? roomImages
      : hotelImages.filter(
          (h) => !roomImages.find((r) => r.imageFileName === h.imageFileName)
        );

  const convertToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const result = reader.result as string;
      setBase64Image(result.split(",")[1]);
    };
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      convertToBase64(file);
    }
  };

  // const uploadImage = async () => {
  //   const tokenString = localStorage.getItem("hotelmateTokens");
  //   const hotelString = localStorage.getItem("selectedProperty");
  //   const userId = localStorage.getItem("userId")?.trim();
  //   const fullName = localStorage.getItem("fullName")?.trim();

  //   if (!tokenString || !hotelString || !base64Image) return;

  //   const { accessToken } = JSON.parse(tokenString);
  //   const { id: hotelID } = JSON.parse(hotelString);

  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //     body: JSON.stringify({
  //       imageID: 0,
  //       hotelID,
  //       imageFileName: selectedFile?.name || "uploaded_image.jpg",
  //       description,
  //       isMain: true,
  //       finAct: true,
  //       createdOn: new Date().toISOString(),
  //       createdBy: fullName,
  //       updatedOn: new Date().toISOString(),
  //       updatedBy: userId,
  //       base64Image,
  //     }),
  //   });

  //   if (!response.ok) {
  //     console.error("❌ Upload failed", await response.text());
  //   }

  //   setUploadModalOpen(false);
  //   setSelectedFile(null);
  //   setBase64Image("");
  //   setDescription("");
  //   fetchImages();
  // };

  // const deleteImage = async (id: number) => {
  //   const tokenString = localStorage.getItem("hotelmateTokens");
  //   if (!tokenString) return;
  //   const { accessToken } = JSON.parse(tokenString);

  //     method: "DELETE",
  //     headers: {
  //       Authorization: `Bearer ${accessToken}`,
  //     },
  //   });

  //   if (res.ok) {
  //     fetchImages();
  //   } else {
  //     console.error("Failed to delete image");
  //   }
  // };

  const uploadImage = async () => {
    const tokenString = localStorage.getItem("hotelmateTokens");
    const hotelString = localStorage.getItem("selectedProperty");
    const userId = localStorage.getItem("userId")?.trim();
    const fullName = localStorage.getItem("fullName")?.trim();

    if (!tokenString || !hotelString || !base64Image) return;

    const { accessToken } = JSON.parse(tokenString);
    const { id: hotelID } = JSON.parse(hotelString);

    try {
      await createHotelImage({
        token: accessToken,
        payload: {
          imageID: 0,
          hotelID,
          imageFileName: selectedFile?.name || "uploaded_image.jpg",
          description,
          isMain: true,
          finAct: true,
          createdOn: new Date().toISOString(),
          createdBy: fullName ?? "",
          updatedOn: new Date().toISOString(),
          updatedBy: userId ?? "",
          base64Image,
        },
      });

      // Optionally show a success message
      console.log("✅ Image uploaded successfully");

      // Clean up UI state
      setUploadModalOpen(false);
      setSelectedFile(null);
      setBase64Image("");
      setDescription("");

      // Refresh images
      fetchImages();
    } catch (err) {
      console.error("❌ Upload failed:", err);
      alert("Failed to upload image. Please try again.");
    }
  };

  const deleteImage = async (id: number) => {
    const tokenString = localStorage.getItem("hotelmateTokens");
    if (!tokenString) return;

    const { accessToken } = JSON.parse(tokenString);

    try {
      await deleteHotelImage({
        token: accessToken,
        imageId: id,
      });

      console.log("✅ Image deleted successfully");
      fetchImages();
    } catch (err) {
      console.error("❌ Failed to delete image:", err);
      alert("Failed to delete image. Please try again.");
    }
  };

  const showPrevious = () =>
    setSelectedIndex((prev) =>
      prev !== null
        ? prev === 0
          ? imagesToDisplay.length - 1
          : prev - 1
        : null
    );

  const showNext = () =>
    setSelectedIndex((prev) =>
      prev !== null
        ? prev === imagesToDisplay.length - 1
          ? 0
          : prev + 1
        : null
    );

  const getImageSrc = (img: HotelImage) => {
    return img.imageURL || img.imageFileName || null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Gallery</h2>
            <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Image</DialogTitle>
                </DialogHeader>
                <Input type="file" onChange={handleFileChange} />
                <Input
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2"
                />
                <Button className="mt-4" onClick={uploadImage}>
                  Submit
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="property">Property</TabsTrigger>
              <TabsTrigger value="room">Rooms</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {imagesToDisplay.map((img, index) => {
                  const src = getImageSrc(img);
                  return (
                    <div
                      key={`${img.imageID}-${img.hotelRoomTypeID ?? "hotel"}`}
                      className="flex flex-col items-center"
                    >
                      <div
                        className="relative w-full cursor-pointer"
                        onClick={() => src && setSelectedIndex(index)}
                      >
                        {src ? (
                          <Image
                            src={src}
                            alt={img.description || `Image ${index}`}
                            width={400}
                            height={300}
                            className="object-cover rounded-xl w-full h-64"
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 rounded-xl">
                            No image
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(img.imageID);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {img.description && (
                        <p className="text-sm mt-2 text-muted-foreground text-center max-w-[90%] truncate">
                          {img.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          {selectedIndex !== null &&
            getImageSrc(imagesToDisplay[selectedIndex]) && (
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                onClick={() => setSelectedIndex(null)}
              >
                <div
                  className="relative w-full max-w-5xl p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={getImageSrc(imagesToDisplay[selectedIndex])!}
                    alt={
                      imagesToDisplay[selectedIndex].description || "Selected"
                    }
                    width={1200}
                    height={800}
                    className="rounded-xl mx-auto shadow-2xl object-contain max-h-[80vh]"
                  />
                  <button
                    className="absolute top-6 right-6 bg-black/60 text-white rounded-full p-2"
                    onClick={() => setSelectedIndex(null)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/60 text-white rounded-full p-3"
                    onClick={showPrevious}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/60 text-white rounded-full p-3"
                    onClick={showNext}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

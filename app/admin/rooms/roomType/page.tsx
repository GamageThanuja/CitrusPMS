// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import type { AppDispatch } from "@/redux/store";
// import { 
//   BedDouble, 
//   Edit, 
//   Plus, 
//   Search, 
//   LayoutGrid, 
//   List,
//   ChevronLeft, 
//   ChevronRight 
// } from "lucide-react";

// import { DashboardLayout } from "@/components/dashboard-layout";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { AddRoomTypeDrawer } from "../../../../components/drawers/add-room-type-drawer";
// import { UpdateRoomTypeDrawer, type RoomTypeUI } from "../../../../components/drawers/update-room-type-mas-drawer"; // Import the update drawer

// import {
//   fetchRoomTypeMas,
//   selectRoomTypeMas,
//   selectRoomTypeMasLoading,
//   selectRoomTypeMasError,
//   type RoomTypeMasItem,
// } from "@/redux/slices/roomTypeMasSlice";

// export default function RoomTypePage() {
//   const dispatch = useDispatch<AppDispatch>();

//   const items = useSelector(selectRoomTypeMas);
//   const loading = useSelector(selectRoomTypeMasLoading);
//   const error = useSelector(selectRoomTypeMasError);

//   const [query, setQuery] = useState("");
//   const [pageIndex, setPageIndex] = useState(1);
//   const [pageSize, setPageSize] = useState(10);
//   const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
//   const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
//   const [roomTypeToDisable, setRoomTypeToDisable] = useState<RoomTypeMasItem | null>(null);
//   const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
//   const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false); // Edit drawer state
//   const [editingRoomType, setEditingRoomType] = useState<RoomTypeUI | null>(null); // Room type being edited

//   // Get username from localStorage
//   const username = typeof window !== 'undefined' ? localStorage.getItem("rememberedUsername") || "system" : "system";

//   useEffect(() => {
//     dispatch(fetchRoomTypeMas());
//   }, [dispatch]);

//   const filtered: RoomTypeMasItem[] = useMemo(() => {
//     if (!query.trim()) return items;

//     const q = query.toLowerCase();

//     return items.filter((r) => {
//       return (
//         String(r.roomTypeID).toLowerCase().includes(q) ||
//         (r.roomType ?? "").toLowerCase().includes(q) ||
//         (r.shortCode ?? "").toLowerCase().includes(q) ||
//         (r.bedType ?? "").toLowerCase().includes(q) ||
//         (r.hotelCode ?? "").toLowerCase().includes(q)
//       );
//     });
//   }, [items, query]);

//   useEffect(() => {
//     setPageIndex(1);
//   }, [query, pageSize]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const canPrev = pageIndex > 1 && !loading;
//   const canNext = !loading && pageIndex < totalPages;

//   const paginated = useMemo(() => {
//     const start = (pageIndex - 1) * pageSize;
//     const end = start + pageSize;
//     return filtered.slice(start, end);
//   }, [filtered, pageIndex, pageSize]);

//   const handlePrev = () => canPrev && setPageIndex((p) => p - 1);
//   const handleNext = () => canNext && setPageIndex((p) => p + 1);

//   const handleToggleDisableRoomType = async (roomType: RoomTypeMasItem) => {
//     try {
//       // Add your disable/enable logic here
//       console.log("Toggling room type:", roomType);
//       // await dispatch(toggleRoomTypeStatus(roomType.roomTypeID));
//       setIsDisableModalOpen(false);
//     } catch (err) {
//       console.error("Toggle failed", err);
//     }
//   };

//   const openEditDrawer = (roomType: RoomTypeMasItem) => {
//     // Convert RoomTypeMasItem to RoomTypeUI for the update drawer
//     const roomTypeUI: RoomTypeUI = {
//       roomTypeID: roomType.roomTypeID,
//       roomType: roomType.roomType || "",
//       description: roomType.description || "",
//       stOccupancy: roomType.stOccupancy || 0,
//       maxOccupancy: roomType.maxOccupancy || 0,
//       hotelCode: roomType.hotelCode || "",
//       isVirtualRoom: roomType.isVirtualRoom || false,
//       noOfRooms: roomType.noOfRooms || 0,
//       shortCode: roomType.shortCode || "",
//       maxAdult: roomType.maxAdult || 0,
//       maxChild: roomType.maxChild || 0,
//       bedType: roomType.bedType || "",
//       roomSize: roomType.roomSize || "",
//       createdBy: roomType.createdBy || "",
//       createdOn: roomType.createdOn || new Date().toISOString(),
//     };
    
//     setEditingRoomType(roomTypeUI);
//     setIsEditDrawerOpen(true);
//   };

//   const handleRoomTypeCreated = () => {
//     // Refresh the room types list after successful creation
//     dispatch(fetchRoomTypeMas());
//   };

//   const handleRoomTypeUpdated = () => {
//     // Refresh the room types list after successful update
//     dispatch(fetchRoomTypeMas());
//   };

//   const handleCloseEditDrawer = () => {
//     setIsEditDrawerOpen(false);
//     setEditingRoomType(null);
//   };

//   return (
//     <DashboardLayout>
//       <div className="flex flex-col gap-4 p-4">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <h1 className="text-2xl font-bold">Room Types</h1>
//           <div className="gap-4 flex flex-row">
//             <Button onClick={() => setIsAddDrawerOpen(true)}>
//               <Plus className="mr-2 h-4 w-4" />
//               Add Room Type
//             </Button>
//           </div>
//         </div>

//         {/* Search */}
//         <div className="flex flex-col gap-4 md:flex-row">
//           <div className="relative flex-1">
//             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//             <Input
//               type="search"
//               placeholder="Search by ID, name, bed type, hotel code…"
//               className="pl-8"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//             />
//           </div>
//         </div>

//         {/* Error */}
//         {error && (
//           <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
//             {error}
//           </div>
//         )}

//         <Card>
//           <CardHeader>
//             <div className="flex items-center justify-between">
//               <CardTitle>Room Types</CardTitle>
//               <div className="inline-flex items-center rounded-full bg-muted p-1">
//                 <Button
//                   variant={viewMode === "grid" ? "default" : "ghost"}
//                   className="rounded-full p-2"
//                   onClick={() => setViewMode("grid")}
//                   size="icon"
//                 >
//                   <LayoutGrid className="w-4 h-4" />
//                 </Button>
//                 <Button
//                   variant={viewMode === "table" ? "default" : "ghost"}
//                   className="rounded-full p-2"
//                   onClick={() => setViewMode("table")}
//                   size="icon"
//                 >
//                   <List className="w-4 h-4" />
//                 </Button>
//               </div>
//             </div>
//           </CardHeader>

//           <CardContent>
//             {loading ? (
//               <div className="text-center py-10 text-gray-500">Loading…</div>
//             ) : filtered.length > 0 ? (
//               viewMode === "grid" ? (
//                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
//                   {paginated.map((r) => {
//                     const imageSrc =
//                       r.photo && r.photo.startsWith("http")
//                         ? r.photo
//                         : r.images?.length
//                         ? r.images[0]
//                         : "https://via.placeholder.com/400x250?text=No+Image";

//                     return (
//                       <Card
//                         key={r.roomTypeID}
//                         className="group border border-border rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-2xl flex flex-col"
//                       >
//                         {/* Room Image */}
//                         <div className="relative w-full h-56">
//                           <img
//                             src={imageSrc}
//                             alt={r.roomType}
//                             className="absolute inset-0 w-full h-full object-cover"
//                           />
//                         </div>

//                         {/* Title */}
//                         <CardHeader className="pb-2">
//                           <CardTitle className="text-lg font-semibold truncate">
//                             {r.roomType || "Unnamed"}
//                           </CardTitle>
//                         </CardHeader>

//                         {/* Content */}
//                         <CardContent className="text-sm text-muted-foreground flex flex-col gap-1 flex-grow">
//                           <p>
//                             <strong>No of rooms:</strong> {r.noOfRooms ?? "—"}
//                           </p>
//                           <p>
//                             <strong>Max Adults:</strong> {r.maxAdult ?? "—"}
//                           </p>
//                           <p>
//                             <strong>Max Children:</strong> {r.maxChild ?? "—"}
//                           </p>
//                           <p>
//                             <strong>Rooms:</strong> {r.roomNumbers ?? "Not Assigned"}
//                           </p>
//                           <p>
//                             <strong>Amenities:</strong> {r.amenities ?? "—"}
//                           </p>

//                           {/* Buttons */}
//                           <div className="flex gap-2 mt-auto pt-3">
//                             <Button
//                               className="flex-1"
//                               onClick={() => openEditDrawer(r)}
//                             >
//                               Edit Room Type
//                             </Button>
//                             <Button
//                               className="flex-1"
//                               variant="outline"
//                               onClick={() => {
//                                 setRoomTypeToDisable(r);
//                                 setIsDisableModalOpen(true);
//                               }}
//                             >
//                               Disable
//                             </Button>
//                           </div>
//                         </CardContent>
//                       </Card>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>ID</TableHead>
//                       <TableHead>Room Type</TableHead>
//                       <TableHead>Bed Type</TableHead>
//                       <TableHead>Max Adult</TableHead>
//                       <TableHead>Max Child</TableHead>
//                       <TableHead>Hotel Code</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {paginated.map((r) => (
//                       <TableRow key={r.roomTypeID}>
//                         <TableCell>{r.roomTypeID}</TableCell>
//                         <TableCell>{r.roomType}</TableCell>
//                         <TableCell>{r.bedType}</TableCell>
//                         <TableCell>{r.maxAdult}</TableCell>
//                         <TableCell>{r.maxChild}</TableCell>
//                         <TableCell>{r.hotelCode}</TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex gap-2 justify-end">
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               className="h-8 w-8"
//                               onClick={() => openEditDrawer(r)}
//                             >
//                               <Edit className="h-4 w-4" />
//                             </Button>
//                             <Button
//                               variant="outline"
//                               className="px-3 py-1"
//                               onClick={() => {
//                                 setRoomTypeToDisable(r);
//                                 setIsDisableModalOpen(true);
//                               }}
//                             >
//                               Disable
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               )
//             ) : (
//               <div className="py-8 text-center">
//                 <BedDouble className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
//                 <p className="text-lg font-medium">No room types found</p>
//                 <p className="text-sm text-muted-foreground">
//                   Add a room type to get started
//                 </p>
//               </div>
//             )}
//           </CardContent>
//         </Card>

//         {/* Pagination Footer */}
//         {filtered.length > 0 && (
//           <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
//             <div className="hidden sm:block" />

//             <div className="flex justify-center">
//               <div className="flex items-center gap-4">
//                 <button
//                   onClick={handlePrev}
//                   disabled={!canPrev}
//                   className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
//                 >
//                   <ChevronLeft className="h-4 w-4" /> Previous
//                 </button>

//                 <span className="px-3 py-1 rounded bg-black text-white text-sm">
//                   {pageIndex} / {totalPages}
//                 </span>

//                 <button
//                   onClick={handleNext}
//                   disabled={!canNext}
//                   className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
//                 >
//                   Next <ChevronRight className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>

//             <div className="flex justify-end">
//               <div className="flex items-center gap-2">
//                 <label htmlFor="pageSize" className="text-sm text-gray-600">
//                   Rows per page:
//                 </label>

//                 <select
//                   id="pageSize"
//                   value={pageSize}
//                   onChange={(e) => setPageSize(Number(e.target.value) || 10)}
//                   className="px-2 py-1 text-sm border rounded bg-white"
//                 >
//                   <option value={10}>10</option>
//                   <option value={25}>25</option>
//                   <option value={50}>50</option>
//                   <option value={100}>100</option>
//                 </select>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Disable Modal */}
//         <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Disable Room Type</DialogTitle>
//             </DialogHeader>
//             <p>
//               Are you sure you want to disable "{roomTypeToDisable?.roomType}"?
//             </p>
//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => setIsDisableModalOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 onClick={() =>
//                   roomTypeToDisable &&
//                   handleToggleDisableRoomType(roomTypeToDisable)
//                 }
//               >
//                 Confirm
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Add Room Type Drawer */}
//         <AddRoomTypeDrawer
//           isOpen={isAddDrawerOpen}
//           onClose={() => setIsAddDrawerOpen(false)}
//           onCreated={handleRoomTypeCreated}
//         />

//         {/* Update Room Type Drawer */}
//         <UpdateRoomTypeDrawer
//           isOpen={isEditDrawerOpen}
//           onClose={handleCloseEditDrawer}
//           roomType={editingRoomType}
//           username={username}
//           onRoomTypeUpdated={handleRoomTypeUpdated}
//         />
//       </div>
//     </DashboardLayout>
//   );
// }




"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { 
  BedDouble, 
  Edit, 
  Plus, 
  Search, 
  LayoutGrid, 
  List,
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddRoomTypeDrawer } from "../../../../components/drawers/add-room-type-drawer";
import { UpdateRoomTypeDrawer, type RoomTypeUI } from "../../../../components/drawers/update-room-type-mas-drawer";

import {
  fetchRoomTypeMas,
  selectRoomTypeMas,
  selectRoomTypeMasLoading,
  selectRoomTypeMasError,
  type RoomTypeMasItem,
} from "@/redux/slices/roomTypeMasSlice";

// Import the folio attachment API
import { getFolioAttachments, type FolioAttachmentPayload } from "../../../../controllers/hotelRoomTypeImageController";

// Define interface for room type with images
interface RoomTypeWithImages extends RoomTypeMasItem {
  images: string[];
}

export default function RoomTypePage() {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector(selectRoomTypeMas);
  const loading = useSelector(selectRoomTypeMasLoading);
  const error = useSelector(selectRoomTypeMasError);

  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [roomTypeToDisable, setRoomTypeToDisable] = useState<RoomTypeMasItem | null>(null);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeUI | null>(null);
  const [folioAttachments, setFolioAttachments] = useState<FolioAttachmentPayload[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // Get username from localStorage
  const username = typeof window !== 'undefined' ? localStorage.getItem("rememberedUsername") || "system" : "system";

  useEffect(() => {
    dispatch(fetchRoomTypeMas());
    fetchFolioAttachments();
  }, [dispatch]);

  // Fetch folio attachments
  const fetchFolioAttachments = async () => {
    try {
      setAttachmentsLoading(true);
      const attachments = await getFolioAttachments();
      setFolioAttachments(attachments);
    } catch (error) {
      console.error("Failed to fetch folio attachments:", error);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  // Get the first valid image URL from folio attachments
  const getFirstValidImage = (): string => {
    if (!folioAttachments.length) return "";
    
    // Find the first attachment with a valid image URL
    const firstValidAttachment = folioAttachments.find(attachment => 
      attachment.url && 
      attachment.url.trim() !== "" && 
      (attachment.url.startsWith('http') || attachment.url.startsWith('/'))
    );
    
    return firstValidAttachment?.url || "";
  };

  // Enhance room types with images - assign the first image to all rooms
  const itemsWithImages: RoomTypeWithImages[] = useMemo(() => {
    const firstImage = getFirstValidImage();
    
    return items.map(item => ({
      ...item,
      images: firstImage ? [firstImage] : [] // Assign the same first image to all rooms
    }));
  }, [items, folioAttachments]);

  const filtered: RoomTypeWithImages[] = useMemo(() => {
    if (!query.trim()) return itemsWithImages;

    const q = query.toLowerCase();

    return itemsWithImages.filter((r) => {
      return (
        String(r.roomTypeID).toLowerCase().includes(q) ||
        (r.roomType ?? "").toLowerCase().includes(q) ||
        (r.shortCode ?? "").toLowerCase().includes(q) ||
        (r.bedType ?? "").toLowerCase().includes(q) ||
        (r.hotelCode ?? "").toLowerCase().includes(q)
      );
    });
  }, [itemsWithImages, query]);

  useEffect(() => {
    setPageIndex(1);
  }, [query, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;

  const paginated = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, pageIndex, pageSize]);

  const handlePrev = () => canPrev && setPageIndex((p) => p - 1);
  const handleNext = () => canNext && setPageIndex((p) => p + 1);

  const handleToggleDisableRoomType = async (roomType: RoomTypeMasItem) => {
    try {
      // Add your disable/enable logic here
      console.log("Toggling room type:", roomType);
      // await dispatch(toggleRoomTypeStatus(roomType.roomTypeID));
      setIsDisableModalOpen(false);
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  const openEditDrawer = (roomType: RoomTypeMasItem) => {
    const roomTypeUI: RoomTypeUI = {
      roomTypeID: roomType.roomTypeID,
      roomType: roomType.roomType || "",
      description: roomType.description || "",
      stOccupancy: roomType.stOccupancy || 0,
      maxOccupancy: roomType.maxOccupancy || 0,
      hotelCode: roomType.hotelCode || "",
      isVirtualRoom: roomType.isVirtualRoom || false,
      noOfRooms: roomType.noOfRooms || 0,
      shortCode: roomType.shortCode || "",
      maxAdult: roomType.maxAdult || 0,
      maxChild: roomType.maxChild || 0,
      bedType: roomType.bedType || "",
      roomSize: roomType.roomSize || "",
      createdBy: roomType.createdBy || "",
      createdOn: roomType.createdOn || new Date().toISOString(),
    };
    
    setEditingRoomType(roomTypeUI);
    setIsEditDrawerOpen(true);
  };

  const handleRoomTypeCreated = () => {
    dispatch(fetchRoomTypeMas());
  };

  const handleRoomTypeUpdated = () => {
    dispatch(fetchRoomTypeMas());
  };

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingRoomType(null);
  };

  // Function to get the image for a room type
  const getRoomTypeImage = (roomType: RoomTypeWithImages): string => {
    // Priority 1: Use the assigned image from folio attachments
    if (roomType.images.length > 0) {
      return roomType.images[0];
    }
    
    // Priority 2: Use the photo field if it exists and is a valid URL
    if (roomType.photo && roomType.photo.startsWith("http")) {
      return roomType.photo;
    }
    
    // Priority 3: Use images array from room type data
    if (roomType.images && roomType.images.length > 0 && roomType.images[0].startsWith("http")) {
      return roomType.images[0];
    }
    
    // Fallback: Use placeholder image
    return "https://via.placeholder.com/400x250?text=No+Image";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Room Types</h1>
          <div className="gap-4 flex flex-row">
            <Button onClick={() => setIsAddDrawerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by ID, name, bed type, hotel code…"
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Room Types</CardTitle>
              <div className="inline-flex items-center rounded-full bg-muted p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className="rounded-full p-2"
                  onClick={() => setViewMode("grid")}
                  size="icon"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  className="rounded-full p-2"
                  onClick={() => setViewMode("table")}
                  size="icon"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {(loading || attachmentsLoading) ? (
              <div className="text-center py-10 text-gray-500">Loading…</div>
            ) : filtered.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {paginated.map((r) => {
                    const imageSrc = getRoomTypeImage(r);

                    return (
                      <Card
                        key={r.roomTypeID}
                        className="group border border-border rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-2xl flex flex-col"
                      >
                        {/* Room Image */}
                        <div className="relative w-full h-56">
                          <img
                            src={imageSrc}
                            alt={r.roomType || "Room Type Image"}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.src = "https://via.placeholder.com/400x250?text=No+Image";
                            }}
                          />
                          {/* Show indicator if using shared image */}
                          {folioAttachments.length > 0 && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              Shared Image
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-semibold truncate">
                            {r.roomType || "Unnamed"}
                          </CardTitle>
                        </CardHeader>

                        {/* Content */}
                        <CardContent className="text-sm text-muted-foreground flex flex-col gap-1 flex-grow">
                          <p>
                            <strong>No of rooms:</strong> {r.noOfRooms ?? "—"}
                          </p>
                          <p>
                            <strong>Max Adults:</strong> {r.maxAdult ?? "—"}
                          </p>
                          <p>
                            <strong>Max Children:</strong> {r.maxChild ?? "—"}
                          </p>
                          <p>
                            <strong>Rooms:</strong> {r.roomNumbers ?? "Not Assigned"}
                          </p>
                          <p>
                            <strong>Amenities:</strong> {r.amenities ?? "—"}
                          </p>

                          {/* Buttons */}
                          <div className="flex gap-2 mt-auto pt-3">
                            <Button
                              className="flex-1"
                              onClick={() => openEditDrawer(r)}
                            >
                              Edit Room Type
                            </Button>
                            <Button
                              className="flex-1"
                              variant="outline"
                              onClick={() => {
                                setRoomTypeToDisable(r);
                                setIsDisableModalOpen(true);
                              }}
                            >
                              Disable
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Bed Type</TableHead>
                      <TableHead>Max Adult</TableHead>
                      <TableHead>Max Child</TableHead>
                      <TableHead>Hotel Code</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((r) => (
                      <TableRow key={r.roomTypeID}>
                        <TableCell>{r.roomTypeID}</TableCell>
                        <TableCell>{r.roomType}</TableCell>
                        <TableCell>{r.bedType}</TableCell>
                        <TableCell>{r.maxAdult}</TableCell>
                        <TableCell>{r.maxChild}</TableCell>
                        <TableCell>{r.hotelCode}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            folioAttachments.length > 0 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {folioAttachments.length > 0 ? 'Shared' : 'No Image'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEditDrawer(r)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              className="px-3 py-1"
                              onClick={() => {
                                setRoomTypeToDisable(r);
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
              )
            ) : (
              <div className="py-8 text-center">
                <BedDouble className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-lg font-medium">No room types found</p>
                <p className="text-sm text-muted-foreground">
                  Add a room type to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
            <div className="hidden sm:block" />

            <div className="flex justify-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  disabled={!canPrev}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                <span className="px-3 py-1 rounded bg-black text-white text-sm">
                  {pageIndex} / {totalPages}
                </span>

                <button
                  onClick={handleNext}
                  disabled={!canNext}
                  className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-600">
                  Rows per page:
                </label>

                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                  className="px-2 py-1 text-sm border rounded bg-white"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Disable Modal */}
        <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Room Type</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to disable "{roomTypeToDisable?.roomType}"?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDisableModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  roomTypeToDisable &&
                  handleToggleDisableRoomType(roomTypeToDisable)
                }
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Room Type Drawer */}
        <AddRoomTypeDrawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          onCreated={handleRoomTypeCreated}
        />

        {/* Update Room Type Drawer */}
        <UpdateRoomTypeDrawer
          isOpen={isEditDrawerOpen}
          onClose={handleCloseEditDrawer}
          roomType={editingRoomType}
          username={username}
          onRoomTypeUpdated={handleRoomTypeUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
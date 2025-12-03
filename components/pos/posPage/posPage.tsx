"use client";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Filter,
  ListChecks,
  Plus,
  PlusIcon,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslatedText } from "@/lib/translation";

import { DeliveryMethodDrawer } from "@/components/drawers/delivery-method-drawer";
import { TableManagementDrawer } from "@/components/drawers/table-management-drawer";
import { PaymentMethodDrawer } from "@/components/drawers/payment-method-drawer";
import { ItemManagementDrawer } from "@/components/drawers/item-management-drawer";
import { TodaySalesDrawer } from "@/components/drawers/today-sales-drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OutletCenterDrawer } from "@/components/drawers/add-outlet-drawer";
import { log } from "console";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CreateCategoryDrawer } from "@/components/drawers/add-category-drawer";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  clearCart,
  removeFromCart,
  removeItemCompletely,
} from "@/redux/slices/cartSlice";
import { RootState, AppDispatch } from "@/redux/store";
import {
  fetchItemMas,
  selectItemMasItems,
} from "@/redux/slices/fetchItemMasSlice";
// import { getCategory } from "@/controllers/categoryController";
import { getPosCenter } from "@/controllers/posCenterController";
import {
  fetchItemsByPOSCenter,
  selectItemsByPOSCenterData,
} from "@/redux/slices/fetchItemsByPOSCenterSlice";
import { createPosOrder } from "@/redux/slices/posOrderSlice";
import { set } from "lodash";
import { AttachItemToOutletDrawer } from "@/components/drawers/attachItemToOutletDrawer";
import EditOutletDrawer from "@/components/drawers/edit-outlet-drawer";
import { Item } from "@/components/itemForm";
import AddItemModal from "@/components/modals/add-item-modal";
import * as XLSX from "xlsx";
import { createHotelImage } from "@/controllers/hotelImageController";
import { createItemMas } from "@/redux/slices/createItemMasSlice";
import {
  createItemMasList,
  type ItemMasListItem,
} from "@/redux/slices/createItemMasListSlice";
import { postCategoryList } from "@/redux/slices/categoryMasterSlice";
import {
  fetchCategoryMas,
  selectCategoryMasItems,
} from "@/redux/slices/fetchCategoryMasSlice";
import AddItemDrawer from "@/components/drawers/add-item-drawer";
import { useAppSelector } from "@/redux/hooks";
import {
  fetchHotelPOSCenterMas,
  selectHotelPOSCenterMasData,
  selectHotelPOSCenterMasLoading,
  selectHotelPOSCenterMasError,
} from "@/redux/slices/fetchHotelPOSCenterMasSlice";
// import {
//   fetchHotelPosCenterTaxConfig,
//   type HotelPosCenterTaxConfig,
// } from "@/redux/slices/fetchHotelPosCenterTaxConfigSlice";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string | null;
  itemCode?: string;
};

type CartItem = Product & {
  quantity: number;
  outletId: number | null;
};

type DeliveryMethodDrawerProps = {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
};

interface Table {
  id: string;
  number: string;
  status: "available" | "occupied" | "reserved";
  seats: number;
  order?: {
    id: string;
    items: number;
    startTime: string;
    total: number;
    tranMasId?: number;
  };
  items?: Array<{
    id?: string | number;
    name?: string;
    qty?: number;
    quantity?: number;
    price?: number;
    code?: string;
    itemCode?: string;
    itemDescription?: string;
    itemId?: string | number;
    itemID?: string | number;
  }>;
}

type TaxBreakdown = {
  base: number;
  scPct: number;
  tdlPct: number;
  ssclPct: number;
  vatPct: number;
  sc: number;
  tdl: number;
  sscl: number;
  vat: number;
  grand: number;
};

export default function POSPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const fetchedOutlets = useSelector(selectHotelPOSCenterMasData);
  const loadingOutlets = useSelector(selectHotelPOSCenterMasLoading);
  const fetchedOutletsError = useSelector(selectHotelPOSCenterMasError); // optional, if you want it
  const SEARCH_TAB = "search";

  const LS_OUTLET_ID = "hm_selected_pos_center_id";
  const LS_OUTLET_OBJ = "hm_selected_pos_center";

  const [showDeliveryMethod, setShowDeliveryMethod] = useState(false);
  const [showTableManagement, setShowTableManagement] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [fromTableManagement, setFromTableManagement] = useState(false);
  const [showItemManagement, setShowItemManagement] = useState(false);
  const [showOutletCenter, setShowOutletCenter] = useState(false);
  const [showTodaySales, setShowTodaySales] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [outlets, setOutlets] = useState<
    { hotelPosCenterId: number; posCenter: string }[]
  >([]);

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

  console.log("outlets : ", outlets);

  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const prevSelectedCenterIdRef = useRef<number | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const cart = useSelector((state: RootState) => state.cart.items);
  const [outletModalOpen, setOutletModalOpen] = useState(true);
  console.log("outlets pos aaaaaa :", outlets);
  const [selectedOutlet, setSelectedOutlet] = useState<any[]>([]);
  const [selectedTableForOrder, setSelectedTableForOrder] =
    useState<Table | null>(null);
  const [showAddItemToOutletDrawer, setShowAddItemToOutletDrawer] =
    useState(false);

  const [addOpen, setAddOpen] = useState(false);

  // const {
  //   data: posTaxRows,
  //   status: posTaxStatus,
  //   error: posTaxError,
  // } = useSelector((s: RootState) => s.fetchHotelPosCenterTaxConfig);

  const openAddForCategory = (catId: string | number) => {
    setEditing({
      id: "",
      itemCode: "",
      name: "",
      price: 0,
      category: catId, // 👈 preselect the active tab’s category
      description: "",
      imageUrl: "",
    });
    setAddOpen(true);
  };

  const handleSaveItem = async (
    formData: Item,
    selectedCenters: number[],
    imageFile?: File
  ) => {
    const userID = JSON.parse(localStorage.getItem("userID") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    // const accessToken = tokens.accessToken;
    const hotelID = property.id;

    // let imageUrl = formData.imageUrl || "";

    // // upload image first (optional)
    // if (imageFile) {
    //   const reader = new FileReader();
    //   const base64Image: string = await new Promise((resolve, reject) => {
    //     reader.onloadend = () => {
    //       resolve((reader.result as string).split(",")[1]);
    //     };
    //     reader.onerror = reject;
    //     reader.readAsDataURL(imageFile);
    //   });

    //   const imagePayload = {
    //     imageID: 0,
    //     hotelID,
    //     imageFileName: `hotel-image-${Date.now()}.jpg`,
    //     description: "Item image",
    //     isMain: true,
    //     finAct: false,
    //     createdOn: new Date().toISOString(),
    //     createdBy: tokens.fullName || "admin",
    //     updatedOn: new Date().toISOString(),
    //     updatedBy: tokens.fullName || "admin",
    //     base64Image,
    //   };

    //   try {
    //     const uploadResult = await createHotelImage({
    //       token: accessToken,
    //       payload: imagePayload,
    //     });
    //     const cleanImageUrl = (uploadResult.imageFileName || "").split("?")[0];
    //     imageUrl = cleanImageUrl;
    //   } catch (err) {
    //     console.error("Image upload failed", err);
    //   }
    // }

    const payload = {
      itemID: 0,
      hotelID,
      categoryID: formData.category,
      itemCode: formData.itemCode,
      itemName: formData.name,
      description: formData.description || "",
      salesAccountID: 0,
      price: formData.price,
      imageURL: null, //imageUrl,
      finAct: false,
      createdBy: userID,
      createdOn: new Date().toISOString(),
      updatedBy: userID,
      updatedOn: new Date().toISOString(),
    };

    try {
      await dispatch(createItemMas(payload as any)).unwrap();

      await dispatch(fetchItemMas({}));

      setAddOpen(false);
    } catch (error) {
      console.error("Failed to save item or link to POS centers:", error);
      setAddOpen(false);
    }
  };

  // bulk-import from Excel in the AddItemModal
  // bulk-import from Excel in the AddItemModal
  const handleExcelUpload = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const property = JSON.parse(
          localStorage.getItem("selectedProperty") || "{}"
        );

        const hotelID = property.id || 0;
        const userID = localStorage.getItem("userID") || "system";
        const now = new Date().toISOString();

        // 🔹 Step 0: fetch latest items via Redux (NO access token)
        let existingItemCodes = new Set<string>();
        try {
          const result: any = await dispatch(fetchItemMas({})).unwrap();
          const latestItems: any[] = Array.isArray(result)
            ? result
            : Array.isArray(result?.items)
            ? result.items
            : [];

          latestItems.forEach((item: any) => {
            const code = item?.itemCode ?? item?.itemNumber;
            if (code) {
              const normalized = String(code).trim().toLowerCase();
              if (normalized) existingItemCodes.add(normalized);
            }
          });
        } catch (error) {
          console.warn(
            "Failed to fetch latest items for duplicate check:",
            error
          );
        }

        // 1) unique categories from Excel
        const uniqueCategoryNames = [
          ...new Set(
            (rows as any[]).map((r: any) => r["Item Category"]).filter(Boolean)
          ),
        ];

        // 2) post categories and get IDs back
        const categoryPayloads = uniqueCategoryNames.map((name) => ({
          categoryID: 0,
          hotelID,
          categoryName: String(name).trim(),
          finAct: false,
        }));

        const categoryRes: any = await dispatch(
          postCategoryList(categoryPayloads)
        ).unwrap();

        // 3) name -> id map
        const categoryMap = new Map<string, number>();
        categoryRes.forEach((cat: any) => {
          categoryMap.set(String(cat.categoryName).trim(), cat.categoryID);
        });

        // 4) Filter out items with duplicate item codes before building payloads
        const processedItemCodes = new Set<string>();
        const rawPayloads: (ItemMasListItem | null)[] = (rows as any[]).map(
          (row): ItemMasListItem | null => {
            const itemCode = String(row["Item Code"] || "").trim();
            const normalizedCode = itemCode.toLowerCase();

            // already in DB?
            if (existingItemCodes.has(normalizedCode)) {
              console.warn(
                `Skipping duplicate item code: "${itemCode}" (already exists in system)`
              );
              return null;
            }

            // duplicated in this Excel import?
            if (processedItemCodes.has(normalizedCode)) {
              console.warn(
                `Skipping duplicate item code: "${itemCode}" (duplicated in Excel file)`
              );
              return null;
            }

            processedItemCodes.add(normalizedCode);
            existingItemCodes.add(normalizedCode);

            return {
              categoryID:
                categoryMap.get(String(row["Item Category"] || "").trim()) || 0,
              itemID: 0,
              hotelID,
              itemCode,
              itemName: String(row["Item Name"] || "").trim(),
              description: String(row["Description"] || "").trim(),
              salesAccountID: 0,
              price: parseFloat(row["Guest Price"]) || 0,
              imageURL:
                "https://hotelmate.s3.us-east-1.amazonaws.com/system/healthy.png",
              finAct: false,
              createdBy: userID, // string | number is OK for ItemMasListItem
              createdOn: now,
              updatedBy: userID,
              updatedOn: now,
            };
          }
        );

        const itemPayloads: ItemMasListItem[] = rawPayloads.filter(
          (item): item is ItemMasListItem => item !== null
        );
        if (itemPayloads.length === 0) {
          toast("No items to import", {
            description: "All items have duplicate item codes or are invalid.",
          });
          return;
        }

        const skippedCount = (rows as any[]).length - itemPayloads.length;
        if (skippedCount > 0) {
          console.warn(
            `⚠️ Skipped ${skippedCount} item(s) due to duplicate item codes`
          );
        }

        await dispatch(createItemMasList(itemPayloads)).unwrap();

        // 🔹 refresh UI with Redux API (no tokens)
        await dispatch(fetchItemMas({}));

        if (skippedCount > 0) {
          toast("Import completed", {
            description: `Successfully imported ${itemPayloads.length} item(s). ${skippedCount} item(s) skipped due to duplicate item codes.`,
          });
        } else {
          toast("Import successful", {
            description: "Categories and items imported successfully.",
          });
        }
      } catch (error) {
        console.error("❌ Error during import:", error);
        toast("Import failed", {
          description:
            "An error occurred during import. Check console for details.",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  function saveSelectedOutletToLS(outlet: any) {
    try {
      localStorage.setItem(LS_OUTLET_ID, String(outlet.hotelPosCenterId));
      localStorage.setItem(
        LS_OUTLET_OBJ,
        JSON.stringify({
          hotelPosCenterId: outlet.hotelPosCenterId,
          posCenter: outlet.posCenter,
          outletCurrency: outlet.outletCurrency ?? "",
          serviceCharge: outlet.serviceCharge ?? null,
          taxes: outlet.taxes ?? null,
        })
      );
    } catch {}
  }

  // Optional: show only the currently selected POS center in the modal
  const posCentersForModal = selectedCenterId
    ? outlets
        .filter((o) => o.hotelPosCenterId === selectedCenterId)
        .map((o) => ({
          hotelPosCenterId: o.hotelPosCenterId,
          posCenter: o.posCenter,
        }))
    : outlets.map((o) => ({
        hotelPosCenterId: o.hotelPosCenterId,
        posCenter: o.posCenter,
      }));

  const [showEditOutlet, setShowEditOutlet] = useState(false);

  const currentOutletObj = useMemo(
    () =>
      fetchedOutlets?.find((o: any) => o.posCenterID === selectedCenterId) ??
      null,
    [fetchedOutlets, selectedCenterId]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const openAdd = () => {
    setEditing({
      id: "",
      itemCode: "",
      name: "",
      price: 0,
      category: categories?.[0]?.id ?? "",
      description: "",
      imageUrl: "",
    });
    setDialogOpen(true);
  };

  console.log("selectedOutlet ✅✅✅  :", selectedOutlet);

  const dispatch = useDispatch<AppDispatch>();
  const posCenters = useAppSelector(selectHotelPOSCenterMasData);
  const loading = useAppSelector(selectHotelPOSCenterMasLoading);

  useEffect(() => {
    if (addOpen) dispatch(fetchHotelPOSCenterMas());
  }, [addOpen, dispatch]);

  const reduxCategories = useSelector(selectCategoryMasItems);

  // useEffect(() => {
  //   if (selectedCenterId) {
  //     dispatch(fetchHotelPosCenterTaxConfig(selectedCenterId));
  //   }
  // }, [dispatch, selectedCenterId]);

  const canon = (s: string) => (s || "").toLowerCase().replace(/\s+|_/g, "");
  const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // function calcTaxes(total: number, rows: HotelPosCenterTaxConfig[]) {
  //   // map by canonical tax name (e.g., "servicecharge", "tdl", "sscl", "vat")
  //   const by = new Map<string, HotelPosCenterTaxConfig>();
  //   rows.forEach((r) => by.set(canon(r.taxName), r));

  //   const base = total;

  //   const scPct = by.get("servicecharge")?.percentage ?? 0; // Base
  //   const tdlPct = by.get("tdl")?.percentage ?? 0; // Base
  //   const ssclPct = by.get("sscl")?.percentage ?? 0; // Subtotal1
  //   const vatPct = by.get("vat")?.percentage ?? 0; // Subtotal2

  //   const sc = r2((base * scPct) / 100);
  //   const tdl = r2((base * tdlPct) / 100);
  //   const st1 = r2(base + sc + tdl);

  //   const sscl = r2((st1 * ssclPct) / 100);
  //   const st2 = r2(st1 + sscl);

  //   const vat = r2((st2 * vatPct) / 100);
  //   const grand = r2(st2 + vat);

  //   return { scPct, tdlPct, ssclPct, vatPct, sc, tdl, sscl, vat, base, grand };
  // }
  useEffect(() => {
    dispatch(fetchCategoryMas());
  }, [dispatch]);

  const STORAGE_SUPPRESS_KEY = "hm_block_outlet_modal_until_tax";
  const askedForOutletRef = useRef(false);

  // OPTIONAL: read tax-creation status from your tax slice
  // Adjust selector to your slice names
  const taxesStatus = useSelector(
    (s: RootState) => (s.createHotelTax?.loading ? "loading" : "idle") // simplified status check
  );

  // Blocker flag (persisted)
  const [suppressOutletModal, setSuppressOutletModal] = useState<boolean>(
    () => {
      return localStorage.getItem(STORAGE_SUPPRESS_KEY) === "1";
    }
  );

  const getPosCenterNameById = (id?: number | null) =>
    fetchedOutlets.find((o: any) => o.posCenterID === id)?.posCenterName ?? "";
  const getPosCenterIdById = (id?: number | null) =>
    fetchedOutlets.find((o: any) => o.posCenterID === id)?.posCenterID ?? null;

  useEffect(() => {
    const saved = localStorage.getItem("hm_selected_pos_center_id");
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) setSelectedCenterId(parsed);
    }
  }, []);

  useEffect(() => {
    if (selectedCenterId) {
      localStorage.setItem(
        "hm_selected_pos_center_id",
        String(selectedCenterId)
      );
      setOutletModalOpen(false);
    }
  }, [selectedCenterId]);

  // ✅ Clear cart when outlet changes (but not on initial mount)
  useEffect(() => {
    // Skip on initial mount (when prevSelectedCenterIdRef.current is null and selectedCenterId is set from localStorage)
    if (prevSelectedCenterIdRef.current !== null && selectedCenterId !== null) {
      // Only clear if the outlet actually changed
      if (prevSelectedCenterIdRef.current !== selectedCenterId) {
        dispatch(clearCart());
        setSelectedTableForOrder(null); // Also clear any selected table
        console.log(
          "✅ Cart cleared because outlet changed from",
          prevSelectedCenterIdRef.current,
          "to",
          selectedCenterId
        );
      }
    }
    // Update the ref to the current outlet ID
    prevSelectedCenterIdRef.current = selectedCenterId;
  }, [selectedCenterId, dispatch]);

  // When taxes finish creating, allow the Select Outlet modal to open again
  useEffect(() => {
    if (taxesStatus === "idle") {
      setSuppressOutletModal(false);
      localStorage.removeItem(STORAGE_SUPPRESS_KEY);
    }
  }, [taxesStatus]);

  useEffect(() => {
    if (!Array.isArray(reduxCategories)) return;
    const transformed = reduxCategories.map((cat: any) => ({
      id: String(cat.categoryID),
      name: String(cat.categoryName),
    }));
    setCategories(transformed);

    const defaultCategory = transformed.find((c) => c.id === "1");
    setActiveTab(defaultCategory ? "1" : transformed[0]?.id ?? ""); // string
  }, [reduxCategories]);

  const [selectOutletCurrency, setSelectOutletCurrency] = useState("");

  const currentSelectedOutlet = useMemo(() => {
    if (!selectedCenterId) return null;
    return (
      outlets.find((o: any) => o.hotelPosCenterId === selectedCenterId) ?? null
    );
  }, [outlets, selectedCenterId]);

  useEffect(() => {
    // Try full object first
    const savedObjRaw = localStorage.getItem(LS_OUTLET_OBJ);
    if (savedObjRaw) {
      try {
        const saved = JSON.parse(savedObjRaw);
        if (saved?.hotelPosCenterId) {
          setSelectedCenterId(Number(saved.hotelPosCenterId));
          setSelectOutletCurrency(saved.outletCurrency ?? "");
          return; // ✅ done
        }
      } catch {}
    }

    // Fallback: old key with just the id
    const savedIdRaw = localStorage.getItem(LS_OUTLET_ID);
    if (savedIdRaw && !Number.isNaN(Number(savedIdRaw))) {
      setSelectedCenterId(Number(savedIdRaw));
    }
  }, []);

  useEffect(() => {
    // setSelectOutletCurrency(currentSelectedOutlet?.outletCurrency ?? "");
  }, [currentSelectedOutlet]);

  // ❗ put this near the top of POSPage component
  const normalizeOutlet = (rawOutlet: any) => {
    return {
      hotelPosCenterId: rawOutlet.hotelPosCenterId ?? rawOutlet.posCenterID,
      posCenter: rawOutlet.posCenter ?? rawOutlet.posCenterName,
      outletCurrency: rawOutlet.outletCurrency ?? "",
      serviceCharge: rawOutlet.serviceCharge ?? rawOutlet.sc ?? 0,
      taxes: rawOutlet.taxes ?? {
        vat: rawOutlet.vat ?? 0,
        nbt: rawOutlet.nbt ?? 0,
        sc: rawOutlet.sc ?? 0,
        ct: rawOutlet.ct ?? 0,
      },
    };
  };

  const handleOutletSelect = (rawOutlet: any) => {
    const outlet = normalizeOutlet(rawOutlet);

    if (!outlet.hotelPosCenterId) {
      console.warn("handleOutletSelect: outlet has no id", rawOutlet);
      return;
    }

    setSelectedCenterId(outlet.hotelPosCenterId);
    setOutletModalOpen(false);
    setSelectedOutlet([outlet]);

    setSelectOutletCurrency(outlet.outletCurrency ?? "");
    saveSelectedOutletToLS(outlet);

    console.log("Selected outlet ✅:", outlet);
  };

  useEffect(() => {
    const canPromptForOutlet =
      !selectedCenterId &&
      fetchedOutlets.length > 0 &&
      !suppressOutletModal && // 👈 block until taxes done
      taxesStatus !== "loading"; // 👈 also avoid while taxes API is running

    if (canPromptForOutlet && !askedForOutletRef.current) {
      setOutletModalOpen(true);
      askedForOutletRef.current = true; // prompt only once per page load
    }
  }, [
    selectedCenterId,
    fetchedOutlets.length,
    suppressOutletModal,
    taxesStatus,
  ]);

  console.log("cart:", cart);

  console.log("outlets", outlets);

  const itemsFromMas = useSelector(selectItemMasItems);

  console.log("item : ", itemsFromMas);

  // Load ItemMas filtered by selected category
  useEffect(() => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    if (!property.id) return;

    // If we have an active tab that's not the search tab, fetch items for that category
    if (activeTab && activeTab !== SEARCH_TAB) {
      const categoryId = parseInt(activeTab);
      if (!isNaN(categoryId)) {
        dispatch(fetchItemMas({ categoryId }));
      }
    } else {
      // If no specific category is selected or it's search tab, fetch all items
      dispatch(fetchItemMas({}));
    }
  }, [dispatch, activeTab]);

  useEffect(() => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    // Dispatch with proper parameters
    dispatch(fetchHotelPOSCenterMas({ hotelCode: property.hotelCode }));
  }, [dispatch]);

  // Map fetchedOutlets to the expected format
  useEffect(() => {
    if (fetchedOutlets && Array.isArray(fetchedOutlets)) {
      const mappedOutlets = fetchedOutlets.map((outlet: any) => ({
        hotelPosCenterId: outlet.posCenterID,
        posCenter: outlet.posCenterName,
        outletCurrency: outlet.outletCurrency || "USD",
        serviceCharge: outlet.sc || 0,
        taxes: {
          vat: outlet.vat || 0,
          nbt: outlet.nbt || 0,
          sc: outlet.sc || 0,
          ct: outlet.ct || 0,
        },
      }));
      setOutlets(mappedOutlets);
      console.log("Mapped outlets:", mappedOutlets);
    }
  }, [fetchedOutlets]);

  const pos = useTranslatedText("Point of Sale");
  const search = useTranslatedText("Search");
  const filterText = useTranslatedText("Filter");
  const checkout = useTranslatedText("Checkout");
  const total = useTranslatedText("Total");
  const emptyCart = useTranslatedText("Your cart is empty");
  const foodText = useTranslatedText("Food");
  const drinksText = useTranslatedText("Drinks");
  const servicesText = useTranslatedText("Services");
  const amenitiesText = useTranslatedText("Amenities");
  const addText = useTranslatedText("Add");
  const cartText = useTranslatedText("Cart");
  const addItemsText = useTranslatedText("Add items to your cart");
  const manageItemsText = useTranslatedText("Action");
  const tableManagementText = useTranslatedText("Orders Management");
  const { fullName } = useUserFromLocalStorage();

  console.log("categories", categories);
  console.log("active tab", activeTab);
  console.log("cart", cart);

  const handleAddToCart = (product: Product) => {
    dispatch(addToCart({ ...product, outlets: selectedOutlet }));
  };

  const handleRemoveFromCart = (item: CartItem) => {
    dispatch(removeFromCart({ id: item.id, outlets: selectedOutlet }));
  };

  const cartTotal = cart.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0
  );

  const [fullCheckoutData, setFullCheckoutData] = useState<{
    cart: CartItem[];
    total: number;
    deliveryMethod: string;
    deliveryDetails: Record<string, string>;
    tranMasId?: number;
  } | null>(null);

  console.log("fullCheckoutData : ", fullCheckoutData);

  const handleCheckout = () => {
    if (selectedTableForOrder) {
      handleStartHoldTransaction(selectedTableForOrder); // ✅ direct post as hold
      setSelectedTableForOrder(null); // reset table after checkout
    } else {
      setFullCheckoutData(null); // reset
      setShowDeliveryMethod(true); // fallback: go through delivery flow
    }
  };

  const handleDeliveryMethodComplete = () => {
    setShowDeliveryMethod(false);
    setShowPaymentMethod(true);
  };

  const handlePaymentComplete = (
    backToDelivery = false,
    opts?: { silent?: boolean; fromTableManagement?: boolean }
  ) => {
    if (backToDelivery && fullCheckoutData) {
      setShowPaymentMethod(false);

      if (opts?.fromTableManagement) {
        // 🔁 Came from Orders Management → go back there
        setShowTableManagement(true);
      } else {
        // 🔁 Normal flow → go back to delivery method
        setShowDeliveryMethod(true);
      }
    } else {
      // ✅ Payment completed or closed normally
      setShowPaymentMethod(false);
      setFullCheckoutData(null);
      dispatch(clearCart());
    }
  };

  const selectedOutletName = useMemo(() => {
    if (!selectedCenterId || !Array.isArray(outlets)) return "";
    const found = outlets.find(
      (o: any) => o.hotelPosCenterId === selectedCenterId
    );
    return found?.posCenter ?? "";
  }, [outlets, selectedCenterId]);

  const selectedOutletCurrency = useMemo(() => {
    if (!selectedCenterId || !Array.isArray(fetchedOutlets)) return "USD";
    const found = fetchedOutlets.find(
      (o: any) => o.posCenterID === selectedCenterId
    );
    // Use USD billing if enabled, otherwise default to USD
    return found?.usdBilling ? "USD" : "USD";
  }, [fetchedOutlets, selectedCenterId]);

  console.log("fetchedOutlets : ", selectedOutletCurrency);

  console.log("selectedCenterId aaaaaaa :", selectedCenterId);

  // Normalize ItemMas records into Product shape
  const normalizedItems: Product[] = (itemsFromMas ?? []).map((it: any) => ({
    id: String(it.itemID ?? it.itemNumber),
    // choose a sensible display name
    name:
      it.nameOnBill ||
      it.description ||
      it.extDescription ||
      it.itemNumber ||
      "",
    price: Number(it.price ?? it.guestPrice ?? 0),
    category: String(it.categoryID ?? "uncategorized"),
    description: it.extDescription || it.description || "",
    imageUrl: it.imageURL || null,
    itemCode: it.itemNumber, // treat ItemMas.itemNumber as the "code"
  }));

  const matchesText = (name: string) =>
    (name || "").toLowerCase().includes(searchQuery.toLowerCase());

  // Search tab → text search across all items
  const searchResults: Product[] = normalizedItems.filter((p) =>
    matchesText(p.name)
  );

  // Category tabs → items for that category
  const categoryResults: Product[] = normalizedItems.filter(
    (p) => String(p.category) === String(activeTab)
  );

  // Final list depending on tab
  const productsForTab =
    activeTab === SEARCH_TAB ? searchResults : categoryResults;

  const tabScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      const defaultCategory = categories.find((c) => c.id === "1");
      setActiveTab(defaultCategory ? "1" : categories[0].id);
    }
  }, [categories, activeTab]);

  const [modalQuantity, setModalQuantity] = useState(1);

  // --- 80mm KOT print for table re-orders ---
  const openKot80mm = (
    orderResult: any,
    payload: any,
    cartSnapshot: CartItem[]
  ) => {
    if (typeof window === "undefined") return;

    // Hotel info
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    const hotelName =
      property.hotelName ||
      property.propertyName ||
      property.hotel ||
      property.name ||
      payload.hotelCode ||
      "Hotel";

    const outletName = selectedOutletName || payload.posCenter || "Outlet";

    // Order number from backend or fallback to docNo
    const orderNo =
      orderResult?.orderNo ||
      orderResult?.docNo ||
      orderResult?.tranMasId ||
      payload?.docNo ||
      "N/A";

    const currency = selectedOutletCurrency || payload.currencyCode || "";
    const tranDate = new Date(
      payload.tranDate || payload.createdOn || Date.now()
    ).toLocaleString();

    const items = payload.items || [];

    // # | Code | Item | Qty
    const itemsHtml = items
      .map((item: any, idx: number) => {
        const qty = Number(item.quantity ?? item.qty ?? 0);

        // 🔍 Try to resolve itemCode:
        // 1) from payload (if backend ever sends it)
        // 2) from cart snapshot (product.itemCode)
        // 3) fallback to itemId
        let code: string = item.itemCode ?? item.code ?? "";

        if (!code) {
          const matchedCart = cartSnapshot.find((c) => {
            const lineId = Number(item.itemId ?? item.itemID);
            return !Number.isNaN(lineId) && Number(c.id) === lineId;
          });

          if (matchedCart) {
            code =
              (matchedCart as any).itemCode || matchedCart.id?.toString() || "";
          } else if (item.itemId != null || item.itemID != null) {
            code = String(item.itemId ?? item.itemID);
          }
        }

        const name =
          item.itemDescription ??
          item.itemName ??
          (() => {
            const matchedCart = cartSnapshot.find((c) => {
              const lineId = Number(item.itemId ?? item.itemID);
              return !Number.isNaN(lineId) && Number(c.id) === lineId;
            });
            return matchedCart?.name ?? "";
          })();

        return `
          <tr>
            <td class="col-idx">${idx + 1}</td>
            <td class="col-code">${code}</td>
            <td class="col-item">${name}</td>
            <td class="col-qty">${qty}</td>
          </tr>
        `;
      })
      .join("");

    const total = Number(payload.currAmount || payload.tranValue || 0);

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) {
      console.warn("Popup blocked – allow popups to print KOT.");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>KOT - Order ${orderNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              width: 80mm;
              padding: 6px 8px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 10px;
            }
            .receipt { width: 100%; }
            .center { text-align: center; }
            .title {
              font-weight: 700;
              font-size: 14px;
            }
            .subtitle {
              font-weight: 600;
              font-size: 13px;
              margin-top: 2px;
            }
            .meta {
              font-size: 10px;
              margin-top: 2px;
            }
            hr {
              border: none;
              border-top: 1px dashed #000;
              margin: 4px 0;
            }

            table.items-table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              margin-top: 4px;
            }
            table.items-table th,
            table.items-table td {
              padding: 2px 0;
              font-size: 10px;
              vertical-align: top;
            }
            table.items-table th {
              border-bottom: 1px solid #000;
              font-weight: 600;
            }
            .col-idx { width: 8%; }
            .col-code { width: 18%; }
            .col-item {
              width: 54%;
              padding-right: 4px;
              word-wrap: break-word;
              white-space: normal;
            }
            .col-qty {
              width: 20%;
              text-align: right;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              margin-top: 4px;
              padding-top: 4px;
              border-top: 1px dashed #000;
              font-weight: 600;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="receipt">
            <div class="center">
              <div class="title">${hotelName}</div>
              <div class="subtitle">KOT</div>
              <div class="meta">${outletName}</div>
            </div>
            <hr />
            <div class="meta">Order No: ${orderNo}</div>
            <div class="meta">Table: ${payload.tableNo || "-"}</div>
            <div class="meta">Date: ${tranDate}</div>
            <hr />
            <table class="items-table">
              <thead>
                <tr>
                  <th class="col-idx">#</th>
                  <th class="col-code">Code</th>
                  <th class="col-item">Item</th>
                  <th class="col-qty">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="total-row">
              <span>Total</span>
              <span>${total.toFixed(2)} ${currency}</span>
            </div>
          </div>
        </body>
      </html>
    `);

    win.document.close();
  };

  const handleStartHoldTransaction = async (table: any) => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelCode = property?.hotelCode || "DEFAULT_CODE";
    const now = new Date().toISOString();

    const posCenter = String(
      outlets.find((o) => o.hotelPosCenterId === selectedCenterId)?.posCenter ||
        "DefaultPOSCenter"
    );

    const posCenterId = Number(
      selectedCenterId ||
        outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
          ?.hotelPosCenterId ||
        0
    );

    const payload = {
      accountId: 0,
      isTaxApplied: true,
      ssclTaxAmount: 0,
      ssclTaxId: 0,
      vatTaxAmount: 0,
      vatTaxId: 0,
      serviceChargeAmount: 0,
      serviceChargeId: 0,
      tdlTaxAmount: 0,
      tdlTaxId: 0,
      tranMasId: 0,
      posCenter: String(posCenter || "DefaultPOSCenter"),
      accountIdDebit: 0,
      accountIdCredit: 0,
      hotelCode: String(hotelCode),
      finAct: false,
      tranTypeId: 75, // HOLD
      tranDate: now,
      effectiveDate: now,
      docNo: `DOC-${Date.now()}`,
      createdOn: now,
      tranValue: cartTotal,
      nameId: 0,
      chequeNo: "",
      paymentMethod: "hold",
      chequeDate: now,
      exchangeRate: 0,
      debit: 0,
      amount: cartTotal,
      comment: "Auto hold transaction from POS page",
      createdBy: fullName,
      currAmount: cartTotal,
      currencyCode: selectedOutletCurrency,
      convRate: "1",
      credit: 0,
      paymentReceiptRef: "N/A",
      remarks: "Generated by POS",
      dueDate: now,
      refInvNo: `REF-${Date.now()}`,
      tableNo: String(table.number || "UNKNOWN"),
      isFinished: false,
      discPercentage: 0,
      onCost: false,
      startTimeStamp: now,
      endTimeStamp: now,
      roomId: 999,
      noOfPax: table.seats || 1,
      deliveryMethod: "dineIn",
      phoneNo: "",
      hotelPosCenterId: posCenterId,

      items: cart.length
        ? cart.map((item) => ({
            itemId: Number(item.id),
            quantity: item.quantity || 1,
            price: item.price || 0,
            cost: 0,
            lineDiscount: 0,
            comment: "",
            itemDescription: item.name || "Unnamed Item",
            isKOT: true,
            isBOT: true,
            cover: "",
            discPercentage: 0,
            reservationDetailId: 0,
            finAct: "false",
          }))
        : [],
      payments: [
        {
          method: "hold",
          amount: cartTotal,
          currency: selectedOutletCurrency,
          cardType: "",
          lastDigits: "",
          roomNo: "",
        },
      ],
    };

    console.log("📦 HOLD Payload:", JSON.stringify(payload, null, 2));

    try {
      const result = await dispatch(createPosOrder(payload)).unwrap();
      console.log("✅ Hold Transaction Created:", result);

      // 🔹 Print KOT for this table re-order (use current cart to get itemCode)
      openKot80mm(result, payload, cart as any);

      dispatch(clearCart());
    } catch (err) {
      console.error("❌ Failed to create hold transaction:", err);
    }
  };

  // add this helper in POSPage component
  const refreshMappedItems = async () => {
    try {
      await dispatch(fetchItemsByPOSCenter());
    } catch (e) {
      console.error("Failed to refresh mapped items:", e);
    }
  };

  console.log("reduxCategories : ", reduxCategories);

  function tableToCart(table: Table): CartItem[] {
    console.log("table item table : ", table);

    const lines = Array.isArray(table.items) ? table.items : [];

    return lines.map((line: any) => {
      const qty = Number(line.qty ?? line.quantity ?? 0) || 1;
      const price = Number(line.price ?? 0);

      return {
        // try to keep a stable item id
        id: String(
          line.id ?? line.itemId ?? line.itemID ?? line.itemCode ?? ""
        ),
        // ✅ use the correct name field
        name: String(line.name ?? line.itemDescription ?? line.item ?? "Item"),
        price,
        quantity: qty,
        category: "POS",
        description: "",
        imageUrl: null,

        // ✅ pass itemCode through so the payment / receipt can show it
        itemCode: line.code ?? line.itemCode ?? undefined,

        // optional: if you want to know which outlet this came from
        outletId: selectedCenterId ?? null,
      } as CartItem;
    });
  }

  // Simple tax calc stub (all taxes 0 for now)
  const taxCalc: TaxBreakdown = useMemo(
    () => ({
      base: Number(cartTotal),
      scPct: 0,
      tdlPct: 0,
      ssclPct: 0,
      vatPct: 0,
      sc: 0,
      tdl: 0,
      sscl: 0,
      vat: 0,
      grand: Number(cartTotal),
    }),
    [cartTotal]
  );

  const taxForDrawer: TaxBreakdown = taxCalc;

  // const taxForDrawer: TaxBreakdown = useMemo(() => {
  //   // when collecting from a table, recompute from that total,
  //   // otherwise use current cart calculation
  //   if (fullCheckoutData && posTaxStatus === "succeeded") {
  //     return calcTaxes(fullCheckoutData.total, posTaxRows || []);
  //   }
  //   return taxCalc as TaxBreakdown;
  // }, [fullCheckoutData, posTaxStatus, posTaxRows, taxCalc]);

  console.log("selected outlet : ", selectedOutletName);

  return (
    <>
      <Dialog
        open={outletModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            router.push("/dashboard");
          }
        }}
      >
        <DialogContent className="text-center max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Select an Outlet
            </DialogTitle>
            <DialogDescription>
              Please select your working outlet before continuing.
            </DialogDescription>
          </DialogHeader>

          {loadingOutlets ? (
            <div className="py-6 text-muted-foreground">Loading outlets...</div>
          ) : outlets.length > 0 ? (
            <>
              <div className="grid gap-3 mt-4 ">
                {outlets.map((outlet) => (
                  <Button
                    key={outlet.hotelPosCenterId}
                    className="w-full"
                    onClick={() => handleOutletSelect(outlet)}
                  >
                    {outlet.posCenter}
                  </Button>
                ))}
              </div>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setShowOutletCenter(true);
                    setOutletModalOpen(false);
                    setSuppressOutletModal(true);
                    localStorage.setItem(STORAGE_SUPPRESS_KEY, "1");
                  }}
                >
                  + Create Outlet
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center mt-4 space-y-4">
              <p>No outlets found for this property.</p>
              <Button
                onClick={() => {
                  setShowOutletCenter(true);
                  setOutletModalOpen(false);
                }}
              >
                + Create Outlet
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DashboardLayout>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{selectedOutletName}</h1>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="pr-4">
                  <VideoButton
                    onClick={() => setShowRawOverlay(true)}
                    label="Watch Video"
                  />
                </div>
                <div className="inline-block px-2 py-1 border border-blue-300 rounded-sm text-blue-300">
                  {selectedOutletCurrency}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 px-4 py-2">
                      {selectedCenterId
                        ? outlets.find(
                            (o: any) => o.hotelPosCenterId === selectedCenterId
                          )?.posCenter ?? "Select Outlet"
                        : "Select Outlet"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {outlets.length > 0 ? (
                      outlets.map((outlet: any) => (
                        <DropdownMenuItem
                          key={outlet.hotelPosCenterId}
                          onClick={() => handleOutletSelect(outlet)}
                        >
                          {outlet.posCenter}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No outlets</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setShowOutletCenter(true);
                    setSuppressOutletModal(true);
                    localStorage.setItem(STORAGE_SUPPRESS_KEY, "1");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowEditOutlet(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowTableManagement(true)}
                className="gap-2"
              >
                <ListChecks className="h-4 w-4" />
                {tableManagementText}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    {manageItemsText}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setShowItemManagement(true)}>
                    Manage Items
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowAddItemToOutletDrawer(true)}
                  >
                    Attach Item to Outlet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowTodaySales(true)}>
                    Today's Sales
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={`${search}...`}
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        // 🆕 if user types something, jump to the Search tab; if cleared, go back to last category
                        if (val && activeTab !== SEARCH_TAB)
                          setActiveTab(SEARCH_TAB);
                        if (!val && activeTab === SEARCH_TAB) {
                          // return to a sensible category (1 or first)
                          const fallback =
                            categories.find((c) => c.id === "1")?.id ??
                            categories[0]?.id ??
                            "";
                          setActiveTab(fallback);
                        }
                      }}
                    />
                  </div>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(val) => setActiveTab(val)}
                >
                  <div className="relative w-full">
                    <div className="flex items-center gap-2 overflow-hidden border-b border-muted">
                      {/* Left Scroll Button */}
                      <button
                        onClick={scrollLeft}
                        className="z-10 h-8 w-8 rounded-md border bg-background shadow-sm flex items-center justify-center"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Scrollable Tabs */}
                      <div
                        ref={scrollRef}
                        className="flex-1 overflow-x-auto scrollbar-none pr-[96px]"
                      >
                        <TabsList className="flex w-max gap-2 whitespace-nowrap px-2 py-6">
                          {searchQuery && (
                            <TabsTrigger
                              key={SEARCH_TAB}
                              value={SEARCH_TAB}
                              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
                            >
                              <div className="flex flex-row gap-2 items-center">
                                <Search width={16} height={16} />
                                <p>Search</p>
                              </div>
                            </TabsTrigger>
                          )}
                          {categories.map((category) => (
                            <TabsTrigger
                              key={category.id}
                              value={category.id}
                              className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary "
                            >
                              {category.name}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>

                      {/* Right Scroll Button */}
                      <button
                        onClick={scrollRight}
                        className="z-10 h-8 w-8 rounded-md border bg-background shadow-sm flex items-center justify-center"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Create Category */}
                      <div className="flex-shrink-0 -ml-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setShowCreateCategory(true)}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* ✅ Add Item (inside category tabs header) */}
                    </div>
                  </div>

                  <TabsContent value={activeTab} className="mt-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6">
                      {/* Show Add Item only for real category tabs */}
                      {activeTab !== SEARCH_TAB && (
                        <Card
                          className="cursor-pointer flex flex-col items-center justify-center border-dashed border-2 dark:border-white border-gray-500"
                          onClick={() => openAddForCategory(activeTab)}
                        >
                          <CardHeader className="p-4 flex flex-col items-center justify-center">
                            <Plus className="w-10 h-10 text-gray-500 mb-2" />
                            <CardTitle className="text-base">
                              Add Item
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      )}

                      {/* Products */}
                      {productsForTab.map((product: Product) => (
                        <Card
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className="cursor-pointer"
                        >
                          <CardHeader className="p-4">
                            <img
                              src={
                                product.imageUrl
                                  ? product.imageUrl
                                  : "/placeholder.jpg"
                              }
                              alt={product.name}
                              className="mb-1 h-[150px] w-full object-cover rounded-md"
                            />
                            <CardTitle className="text-base ">
                              {product.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 pb-2">
                            <p className="text-sm font-extralight">
                              code - {product.itemCode}
                            </p>
                            <p className="text-lg font-bold">
                              {product.price.toFixed(2)}
                            </p>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button
                              variant="outline"
                              className="w-full gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                              {addText}
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {cartText}
                  </CardTitle>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => dispatch(clearCart())}
                    >
                      Clear Cart
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Running Table Order Indicator */}
                  {selectedTableForOrder && selectedTableForOrder.order && (
                    <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 dark:text-blue-100">
                        <UtensilsCrossed className="h-4 w-4" />
                        <span>
                          Running Order - Table {selectedTableForOrder.number}
                        </span>
                      </div>
                    </div>
                  )}

                  {cart.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {cart.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => handleRemoveFromCart(item)}
                            >
                              <span className="text-lg">-</span>
                            </Button>

                            <span className="w-6 text-center">
                              {item.quantity}
                            </span>

                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => handleAddToCart(item)}
                            >
                              <span className="text-lg">+</span>
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() =>
                                dispatch(
                                  removeItemCompletely({
                                    id: item.id,
                                    outlets: selectedOutlet,
                                  })
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ShoppingBag className="mb-2 h-10 w-10 text-muted-foreground" />
                      <p className="mb-2 text-lg font-medium">{emptyCart}</p>
                      <p className="text-sm text-muted-foreground">
                        {addItemsText}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  {/* {posTaxStatus === "failed" && (
                    <p className="text-xs text-red-600">
                      {String(posTaxError)}
                    </p>
                  )} */}

                  {cart.length > 0 && (
                    <>
                      <div className="flex w-full items-center justify-between border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                          Subtotal
                        </p>
                        <p className="text-sm">
                          {selectedOutletCurrency} {taxCalc.base.toFixed(2)}
                        </p>
                      </div>

                      {/* Only render a tax line if that tax exists or is > 0 */}
                      {(taxCalc.scPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Service Charge ({taxCalc.scPct}%)
                          </p>
                          <p className="text-sm">
                            {selectedOutletCurrency} {taxCalc.sc.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {(taxCalc.tdlPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            TDL ({taxCalc.tdlPct}%)
                          </p>
                          <p className="text-sm">
                            {selectedOutletCurrency} {taxCalc.tdl.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {(taxCalc.ssclPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            SSCL ({taxCalc.ssclPct}%)
                          </p>
                          <p className="text-sm">
                            {selectedOutletCurrency} {taxCalc.sscl.toFixed(2)}
                          </p>
                        </div>
                      )}
                      {(taxCalc.vatPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            VAT ({taxCalc.vatPct}%)
                          </p>
                          <p className="text-sm">
                            {selectedOutletCurrency} {taxCalc.vat.toFixed(2)}
                          </p>
                        </div>
                      )}

                      <div className="flex w-full items-center justify-between border-t pt-3">
                        <p className="text-lg font-bold">Total</p>
                        <p className="text-lg font-bold">
                          {selectedOutletCurrency} {taxCalc.grand.toFixed(2)}
                        </p>
                      </div>

                      <Button className="w-full gap-2" onClick={handleCheckout}>
                        <CreditCard className="h-4 w-4" />
                        {checkout}
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>

        {/* Dialog Modal */}
        <Dialog
          open={!!selectedProduct}
          onOpenChange={() => setSelectedProduct(null)}
        >
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedProduct?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <>
                <img
                  src={selectedProduct.imageUrl || "/placeholder.jpg"}
                  alt={selectedProduct.name}
                  className="mx-auto mb-4 h-[180px] w-full rounded-md object-cover"
                />
                <DialogDescription className="mb-2">
                  {selectedProduct.description || "No description available."}
                </DialogDescription>

                <div className="mb-4 text-lg font-semibold">
                  ${selectedProduct.price.toFixed(2)}
                </div>

                <div className="flex items-center justify-center gap-4 mb-4">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() =>
                      setModalQuantity((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    -
                  </Button>
                  <span className="text-lg font-bold">{modalQuantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => setModalQuantity((prev) => prev + 1)}
                  >
                    +
                  </Button>
                </div>

                <DialogFooter className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      for (let i = 0; i < modalQuantity; i++) {
                        handleAddToCart(selectedProduct);
                      }
                      setModalQuantity(1);
                      setSelectedProduct(null);
                    }}
                    className="w-full"
                  >
                    Add to Cart
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSelectedProduct(null)}
                    className="w-full"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Drawers */}
        {showDeliveryMethod && (
          <DeliveryMethodDrawer
            open={showDeliveryMethod}
            cart={cart}
            total={cartTotal}
            selectedPosCenterId={String(
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.hotelPosCenterId || ""
            )}
            selectedPosCenterName={
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.posCenter || ""
            }
            onClose={() => setShowDeliveryMethod(false)}
            onComplete={(data: any) => {
              setFromTableManagement(false);
              setFullCheckoutData(data);
              setShowPaymentMethod(true);
            }}
            initialMethod={fullCheckoutData?.deliveryMethod} // ✅ Preserve selected method
            initialDetails={fullCheckoutData?.deliveryDetails} // ✅ Preserve input data like table/pax
            // selectedOutletCurrency={selectedOutletCurrency}
          />
        )}
{/* 
        <AddItemModal
          open={addOpen}
          onOpenChange={setAddOpen}
          item={editing}
          categories={categories}
          onSaveManual={handleSaveItem}
          onImportExcel={handleExcelUpload}
          posCenters={posCentersForModal} // optional
          onCreateCategoryClick={() => setShowCreateCategory(true)} 
        /> */}
        <AddItemDrawer
          open={addOpen}
          onOpenChange={setAddOpen}
          item={editing}
          categories={categories}
          onSaveManual={handleSaveItem}
          onImportExcel={handleExcelUpload}
          posCenters={posCenters.map((pc: any) => ({
            hotelPosCenterId: pc.posCenterID,
            posCenter: pc.posCenterName,
          }))}
          onCreateCategoryClick={() => setShowCreateCategory(true)}
        />

        {showTableManagement && (
          <TableManagementDrawer
            open={showTableManagement}
            onClose={() => setShowTableManagement(false)}
            onTableSelected={(table) => {
              // Set the selected table for order tracking (just display indicator)
              setSelectedTableForOrder(table);
              setShowTableManagement(false);
            }}
            // outletCurrency={selectOutletCurrency}
            // selectedPosCenterId={selectedCenterId}
            // posCenterName={selectedOutletName}
            onCollectPayment={(table) => {
              // ✅ directly open the PAYMENT drawer with table’s current bill
              const cartFromTable = tableToCart(table);
              const totalFromTable = Number(table?.order?.total ?? 0);

              setFullCheckoutData({
                cart: cartFromTable as any,
                total: totalFromTable,
                deliveryMethod: "Table",
                deliveryDetails: {
                  tableNo: String(table.number),
                  noOfPax: String(table.seats ?? 0),
                },
                // tranMasId: table?.order?.tranMasId,
              });
              setFromTableManagement(true);
              setShowTableManagement(false);
              setShowPaymentMethod(true);
            }}
          />
        )}
        {showPaymentMethod && fullCheckoutData && (
          <PaymentMethodDrawer
            open={showPaymentMethod}
            total={fullCheckoutData.total}
            cart={fullCheckoutData.cart}
            deliveryMethod={fullCheckoutData.deliveryMethod}
            deliveryDetails={fullCheckoutData.deliveryDetails}
            onClose={handlePaymentComplete}
            posCenter={String(
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.hotelPosCenterId || ""
            )}
            posCenterName={
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.posCenter || ""
            }
            tranMasId={fullCheckoutData.tranMasId}
            // tax={taxForDrawer}
            // fromTableManagement={fromTableManagement}
          />
        )}

        {showItemManagement && (
          <ItemManagementDrawer
            open={showItemManagement}
            categories={categories}
            onClose={() => setShowItemManagement(false)}
          />
        )}
        {showAddItemToOutletDrawer && (
          <AttachItemToOutletDrawer
            open={showAddItemToOutletDrawer}
            // categories={categories}
            onClose={() => setShowAddItemToOutletDrawer(false)}
            onMappingChanged={refreshMappedItems}
          />
        )}

        {showOutletCenter && (
          <OutletCenterDrawer
            open={showOutletCenter}
            onClose={
              (/* no args */) => {
                setShowOutletCenter(false);
                dispatch(fetchHotelPOSCenterMas());
                // do NOT open the Select Outlet modal here
              }
            }
            // onCreated={(created) => {
            //   if (created?.hotelPosCenterId) {
            //     const newOutletId = Number(created.hotelPosCenterId);
            //     setSelectedCenterId(newOutletId);
            //     // ✅ Refresh tax config for the newly created outlet
            //     // Note: If taxes haven't been saved yet, this will return empty, which is fine
            //     // The tax config will be refreshed again when onTaxesSaved is called
            //     dispatch(fetchHotelPosCenterTaxConfig(newOutletId) as any);
            //     console.log(
            //       "✅ Tax config refresh triggered for newly created outlet:",
            //       newOutletId
            //     );
            //   }
            // }}
            // onTaxesSaved={() => {
            //   // ✅ lift the suppression so the Select-Outlet modal becomes eligible again
            //   setSuppressOutletModal(false);
            //   localStorage.removeItem(STORAGE_SUPPRESS_KEY);

            //   // ✅ Refresh tax config if an outlet is currently selected
            //   if (selectedCenterId) {
            //     dispatch(fetchHotelPosCenterTaxConfig(selectedCenterId) as any);
            //     console.log(
            //       "✅ Tax config refreshed after taxes saved for outlet:",
            //       selectedCenterId
            //     );
            //   }
            // }}
          />
        )}
        {showCreateCategory && (
          <CreateCategoryDrawer
            open={showCreateCategory}
            onClose={() => {
              setShowCreateCategory(false);
              dispatch(fetchCategoryMas());
            }}
          />
        )}
        {showEditOutlet && (
          <EditOutletDrawer
            open={showEditOutlet}
            onClose={() => setShowEditOutlet(false)}
            outlet={currentOutletObj as any}
          />
        )}

        {showTodaySales && (
          <TodaySalesDrawer
            open={showTodaySales}
            onClose={() => setShowTodaySales(false)}
            selectedPosCenterId={selectedCenterId}
            outletCurrency={selectedOutletCurrency}
          />
        )}

        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />
      </DashboardLayout>
    </>
  );
}

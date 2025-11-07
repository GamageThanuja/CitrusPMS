"use client";

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
import { RootState } from "@/redux/store";
import { fetchItems } from "@/redux/slices/itemSlice";
import { getCategory } from "@/controllers/categoryController";
import { getPosCenter } from "@/controllers/posCenterController";
import { getItemsByPosCenter } from "@/controllers/itemByPosCenterController";
import { getItemMaster } from "@/controllers/itemMasterController";
import { createPosOrder } from "@/redux/slices/posOrderSlice";
import { set } from "lodash";
import { AttachItemToOutletDrawer } from "@/components/drawers/attachItemToOutletDrawer";
// import { fetchCategories as fetchCategoriesThunk } from "@/redux/slices/categorySlice";
import EditOutletDrawer from "@/components/drawers/edit-outlet-drawer";
import { Item } from "@/components/itemForm";
import AddItemModal from "@/components/modals/add-item-modal";
import * as XLSX from "xlsx";
import { createHotelImage } from "@/controllers/hotelImageController";
import { createItemMaster } from "@/controllers/itemMasterController"; // you already import getItemMaster; keep both
import { createItemByPosCenter } from "@/controllers/itemByPosCenterController";
import { postItemMasterList } from "@/redux/slices/itemMasterSlice";
import { postCategoryList } from "@/redux/slices/categoryMasterSlice";
import { fetchCategories } from "@/redux/slices/fetchCategoriesSlice";
import AddItemDrawer from "@/components/drawers/add-item-drawer";
import { useAppSelector } from "@/redux/hooks";
import {
  fetchHotelPosCenters,
  selectHotelPosCenters,
  selectHotelPosCentersLoading,
  selectHotelPosCentersError,
} from "@/redux/slices/hotelPosCenterSlice";
import {
  fetchHotelPosCenterTaxConfig,
  type HotelPosCenterTaxConfig,
} from "@/redux/slices/fetchHotelPosCenterTaxConfigSlice";
import VideoOverlay from "@/components/videoOverlay";
import VideoButton from "@/components/videoButton";
import { useTutorial } from "@/hooks/useTutorial";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string | null;
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
  };
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
  const { data: fetchedOutlets, loading: loadingOutlets } = useSelector(
    (state: RootState) => state.hotelPosCenter
  );
  const [hotelId, setHotelId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const SEARCH_TAB = "search";

  // Fetch localStorage values only on the client side
  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    const accessToken = tokens.accessToken;
    const hotelID = property.id;

    setHotelId(hotelID);
    setAccessToken(accessToken);
  }, []);

  const LS_OUTLET_ID = "hm_selected_pos_center_id";
  const LS_OUTLET_OBJ = "hm_selected_pos_center";

  const [showDeliveryMethod, setShowDeliveryMethod] = useState(false);
  const [showTableManagement, setShowTableManagement] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showItemManagement, setShowItemManagement] = useState(false);
  const [showOutletCenter, setShowOutletCenter] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
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
  const [mappedItems, setMappedItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
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

  const {
    data: posTaxRows,
    status: posTaxStatus,
    error: posTaxError,
  } = useSelector((s: RootState) => s.fetchHotelPosCenterTaxConfig);

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
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken = tokens.accessToken;
    const hotelID = property.id;

    if (!accessToken || !hotelID) {
      console.error("Missing accessToken or hotelID");
      return;
    }

    let imageUrl = formData.imageUrl || "";

    // upload image first (optional)
    if (imageFile) {
      const reader = new FileReader();
      const base64Image: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
          resolve((reader.result as string).split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const imagePayload = {
        imageID: 0,
        hotelID,
        imageFileName: `hotel-image-${Date.now()}.jpg`,
        description: "Item image",
        isMain: true,
        finAct: true,
        createdOn: new Date().toISOString(),
        createdBy: tokens.fullName || "admin",
        updatedOn: new Date().toISOString(),
        updatedBy: tokens.fullName || "admin",
        base64Image,
      };

      try {
        const uploadResult = await createHotelImage({
          token: accessToken,
          payload: imagePayload,
        });
        const cleanImageUrl = (uploadResult.imageFileName || "").split("?")[0];
        imageUrl = cleanImageUrl;
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }

    const payload = {
      itemID: 0,
      hotelID,
      categoryID: formData.category,
      itemCode: formData.itemCode,
      itemName: formData.name,
      description: formData.description || "",
      salesAccountID: 0,
      price: formData.price,
      imageURL: imageUrl,
      finAct: true,
      createdBy: tokens.fullName || "system",
      createdOn: new Date().toISOString(),
      updatedBy: tokens.fullName || "system",
      updatedOn: new Date().toISOString(),
    };

    try {
      // create the item
      await createItemMaster({ token: accessToken, payload });

      // refresh list in redux
      await dispatch(fetchItems(hotelID));

      // fetch again to get created itemID to map POS centers
      const itemsAfterCreate = await getItemMaster({
        token: accessToken,
        hotelId: hotelID,
      });
      const createdItem = itemsAfterCreate[itemsAfterCreate.length - 1];
      const itemID = createdItem?.itemID;

      if (itemID && Array.isArray(selectedCenters)) {
        for (const posCenterId of selectedCenters) {
          const posPayload = {
            hotelId: hotelID,
            itemId: itemID,
            hotelPosCenterId: posCenterId,
          };
          await createItemByPosCenter({
            token: accessToken,
            payload: posPayload,
          });
        }
      }

      // ...in handleSaveItem, after you've determined `itemID` and finished linking:

      if (itemID && Array.isArray(selectedCenters)) {
        // Optimistically add to local mapping so the UI shows it immediately
        setMappedItems((prev) => [
          ...prev,
          ...selectedCenters.map((cid) => ({
            hotelPosCenterId: cid,
            itemId: Number(itemID),
          })),
        ]);
      }

      // Make sure Redux store has the new item (await so UI updates right after)
      await dispatch(fetchItems(hotelID));

      // If the new item belongs to the currently selected outlet and active category,
      // it will now pass the filter and appear without refresh.
      setAddOpen(false);
    } catch (error) {
      console.error("Failed to save item or link to POS centers:", error);
      setAddOpen(false);
    }
  };

  // bulk-import from Excel in the AddItemModal
  const handleExcelUpload = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const tokens = JSON.parse(
          localStorage.getItem("hotelmateTokens") || "{}"
        );
        const property = JSON.parse(
          localStorage.getItem("selectedProperty") || "{}"
        );

        const hotelID = property.id || 0;
        const fullName = tokens.fullName || "system";
        const now = new Date().toISOString();

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
          finAct: true,
        }));

        const categoryRes: any = await dispatch(
          postCategoryList(categoryPayloads)
        ).unwrap();

        // 3) name -> id map
        const categoryMap = new Map<string, number>();
        categoryRes.forEach((cat: any) => {
          categoryMap.set(String(cat.categoryName).trim(), cat.categoryID);
        });

        // 4) build items with mapped category IDs
        const itemPayloads = (rows as any[]).map((row) => ({
          categoryID:
            categoryMap.get(String(row["Item Category"] || "").trim()) || 0,
          itemID: 0,
          hotelID,
          itemCode: String(row["Item Code"] || ""),
          itemName: String(row["Item Name"] || "").trim(),
          description: String(row["Description"] || "").trim(),
          salesAccountID: 0,
          price: parseFloat(row["Guest Price"]) || 0,
          imageURL:
            "https://hotelmate.s3.us-east-1.amazonaws.com/system/healthy.png",
          finAct: true,
          createdBy: fullName,
          createdOn: now,
          updatedBy: fullName,
          updatedOn: now,
        }));

        await dispatch(postItemMasterList(itemPayloads)).unwrap();

        // optional: refresh UI
        await dispatch(fetchItems(hotelID));

        alert("✅ Categories and Items imported successfully");
      } catch (error) {
        console.error("❌ Error during import:", error);
        alert("❌ Import failed. Check console for details.");
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
      fetchedOutlets?.find(
        (o: any) => o.hotelPosCenterId === selectedCenterId
      ) ?? null,
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

  const dispatch = useDispatch();
  const posCenters = useAppSelector(selectHotelPosCenters);
  const loading = useAppSelector(selectHotelPosCentersLoading);

  useEffect(() => {
    if (addOpen) dispatch(fetchHotelPosCenters());
  }, [addOpen, dispatch]);

  // const { categories: reduxCategories } = useSelector(
  //   (state: RootState) => (state as any).categories
  // );

  const categoriesState = useSelector(
    (state: RootState) => state.fetchCategories
  );
  const reduxCategories = categoriesState?.data ?? [];

  useEffect(() => {
    if (selectedCenterId) {
      dispatch(fetchHotelPosCenterTaxConfig(selectedCenterId));
    }
  }, [dispatch, selectedCenterId]);

  const canon = (s: string) => (s || "").toLowerCase().replace(/\s+|_/g, "");
  const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  function calcTaxes(total: number, rows: HotelPosCenterTaxConfig[]) {
    // map by canonical tax name (e.g., "servicecharge", "tdl", "sscl", "vat")
    const by = new Map<string, HotelPosCenterTaxConfig>();
    rows.forEach((r) => by.set(canon(r.taxName), r));

    const base = total;

    const scPct = by.get("servicecharge")?.percentage ?? 0; // Base
    const tdlPct = by.get("tdl")?.percentage ?? 0; // Base
    const ssclPct = by.get("sscl")?.percentage ?? 0; // Subtotal1
    const vatPct = by.get("vat")?.percentage ?? 0; // Subtotal2

    const sc = r2((base * scPct) / 100);
    const tdl = r2((base * tdlPct) / 100);
    const st1 = r2(base + sc + tdl);

    const sscl = r2((st1 * ssclPct) / 100);
    const st2 = r2(st1 + sscl);

    const vat = r2((st2 * vatPct) / 100);
    const grand = r2(st2 + vat);

    return { scPct, tdlPct, ssclPct, vatPct, sc, tdl, sscl, vat, base, grand };
  }

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const STORAGE_SUPPRESS_KEY = "hm_block_outlet_modal_until_tax";
  const askedForOutletRef = useRef(false);

  // OPTIONAL: read tax-creation status from your tax slice
  // Adjust selector to your slice names
  const taxesStatus = useSelector(
    (s: RootState) => s.hotelTaxes?.status ?? "idle" // "idle" | "loading" | "succeeded" | "failed"
  );

  // Blocker flag (persisted)
  const [suppressOutletModal, setSuppressOutletModal] = useState<boolean>(
    () => {
      return localStorage.getItem(STORAGE_SUPPRESS_KEY) === "1";
    }
  );

  const getPosCenterNameById = (id?: number | null) =>
    fetchedOutlets.find((o: any) => o.hotelPosCenterId === id)?.posCenter ?? "";
  const getPosCenterIdById = (id?: number | null) =>
    fetchedOutlets.find((o: any) => o.hotelPosCenterId === id)
      ?.hotelPosCenterId ?? null;

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

  // When taxes finish creating, allow the Select Outlet modal to open again
  useEffect(() => {
    if (taxesStatus === "succeeded") {
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
      fetchedOutlets?.find(
        (o: any) => o.hotelPosCenterId === selectedCenterId
      ) ?? null
    );
  }, [fetchedOutlets, selectedCenterId]);

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
    setSelectOutletCurrency(currentSelectedOutlet?.outletCurrency ?? "");
  }, [currentSelectedOutlet]);

  const handleOutletSelect = (outlet: any) => {
    setSelectedCenterId(outlet.hotelPosCenterId);
    setOutletModalOpen(false);
    setSelectedOutlet(outlet);

    // ✅ currency
    setSelectOutletCurrency(outlet.outletCurrency ?? "");

    // ✅ persist full object
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
  console.log("allItems", allItems);

  // useEffect(() => {
  //   const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
  //   const property = JSON.parse(
  //     localStorage.getItem("selectedProperty") || "{}"
  //   );
  //   const hotelID = property.id;
  //   const accessToken = tokens.accessToken;

  //   if (!accessToken || !hotelID) return;

  //   // Fetch categories
  //   getCategory({ token: accessToken, hotelID })
  //     .then((data) => {
  //       const transformed = data.map((cat: any) => ({
  //         id: cat.categoryID.toString(),
  //         name: cat.categoryName,
  //       }));
  //       setCategories(transformed);
  //       const defaultCategory = transformed.find(
  //         (c: { id: string; name: string }) => c.id === "1"
  //       );
  //       if (defaultCategory) {
  //         setActiveTab(1);
  //       } else if (transformed.length > 0) {
  //         setActiveTab(Number(transformed[0].id)); // fallback
  //       }
  //     })
  //     .catch((err) => {
  //       console.error("Failed to load categories:", err);
  //       setCategories([]); // fallback to empty array on error
  //     });
  // }, []);

  const itemState = useSelector((state: RootState) => state.items);
  const { items, status, error } = itemState;

  console.log("item : ", items);

  useEffect(() => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    if (property.id) {
      dispatch(fetchItems(property.id));
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchHotelPosCenters());
  }, [dispatch]);

  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = property?.id;
    const accessToken = tokens.accessToken;

    if (!hotelId || !accessToken) return;

    // Fetch mapping data

    getItemsByPosCenter({ token: accessToken, hotelId })
      .then(setMappedItems)
      .catch((err) => {
        console.error("Failed to fetch mapped items:", err);
      });

    getItemMaster({ token: accessToken, hotelId })
      .then(setAllItems)
      .catch((err) => {
        console.error("Failed to fetch item master:", err);
      });
  }, []);

  useEffect(() => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken = tokens.accessToken;
    const hotelId = property.id;

    if (!accessToken || !hotelId) return;

    getItemMaster({ token: accessToken, hotelId })
      .then((res) => res)
      .then((data) => {
        const loaded = data.map((item: any) => ({
          id: item.itemCode,
          name: item.itemName,
          price: item.price,
          category: item.categoryID?.toString() || "uncategorized",
          description: item.description,
          imageUrl: item.imageURL || null,
        }));

        setProducts(loaded);
      })
      .catch((err) => console.error("Failed to fetch products:", err));

    getPosCenter({ token: accessToken, hotelId })
      .then((res) => {
        return res;
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((outlet: any) => ({
            hotelPosCenterId: outlet.hotelPosCenterId,
            posCenter: outlet.posCenter,
            serviceCharge: outlet.serviceCharge,
            taxes: outlet.taxes,
            outletCurrency: outlet.outletCurrency,
          }));
          setOutlets(formatted);
        } else {
          setOutlets([]);
        }
      })

      .catch((err) => {
        console.error("Failed to fetch outlets:", err);
      });
  }, []);

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
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
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

  const handlePaymentComplete = (backToDelivery = false) => {
    if (backToDelivery && fullCheckoutData) {
      setShowPaymentMethod(false);
      setShowDeliveryMethod(true);
    } else {
      setShowPaymentMethod(false);
      setFullCheckoutData(null);
      dispatch(clearCart());
    }
  };

  // const fetchCategories = async () => {
  //   try {
  //     const transformed = reduxCategories.map((cat) => ({
  //       id: cat.categoryID.toString(),
  //       name: cat.categoryName,
  //     }));

  //     setCategories(transformed);

  //     const defaultCategory = transformed.find((c) => c.id === "1");
  //     if (defaultCategory) {
  //       setActiveTab(1);
  //     } else if (transformed.length > 0) {
  //       setActiveTab(Number(transformed[0].id)); // fallback
  //     }
  //   } catch (err) {
  //     console.error("Failed to load categories:", err);
  //     setCategories([]); // fallback to empty array on error
  //   }
  // };

  // useEffect(() => {
  //   fetchCategories();
  // }, []);

  const selectedOutletName = useMemo(() => {
    if (!selectedCenterId || !Array.isArray(fetchedOutlets)) return "";
    const found = fetchedOutlets.find(
      (o: any) => o.hotelPosCenterId === selectedCenterId
    );
    return found?.posCenter ?? "";
  }, [fetchedOutlets, selectedCenterId]);

  const selectedOutletCurrency = useMemo(() => {
    if (!selectedCenterId || !Array.isArray(fetchedOutlets)) return "";
    const found = fetchedOutlets.find(
      (o: any) => o.hotelPosCenterId === selectedCenterId
    );
    return found?.outletCurrency ?? "";
  }, [fetchedOutlets, selectedCenterId]);

  console.log("fetchedOutlets : ", selectedOutletCurrency);

  console.log("item", items);

  console.log("selectedCenterId aaaaaaa :", selectedCenterId);

  // Normalize Redux items to a consistent shape
  const normalizedItems: Product[] = (items ?? []).map((it: any) => ({
    id: String(it.id ?? it.itemID ?? it.itemCode), // <- normalize ID
    name: it.name ?? it.itemName ?? "",
    price: Number(it.price ?? 0),
    category: String(it.category ?? it.categoryID ?? "uncategorized"),
    description: it.description ?? "",
    imageUrl: it.imageUrl ?? it.imageURL ?? null,
    itemCode: it.itemCode,
    salesAccountID: it.salesAccountID,
  }));

  console.log("mappedItems : ", mappedItems);

  const isMappedToCurrentCenter = (prod: Product) =>
    !selectedCenterId ||
    mappedItems.some(
      (map: any) =>
        String(map.itemId) === String(prod.id) &&
        map.hotelPosCenterId === selectedCenterId
    );

  const matchesText = (name: string) =>
    (name || "").toLowerCase().includes(searchQuery.toLowerCase());

  // Results for Search tab: center + text (across all categories)
  const searchResults: Product[] = normalizedItems.filter(
    (p) => isMappedToCurrentCenter(p) && matchesText(p.name)
  );

  // Results for normal category tabs: center + category
  const categoryResults: Product[] = normalizedItems.filter((p) => {
    const inCenter = isMappedToCurrentCenter(p);
    const inCategory = String(p.category) === String(activeTab);
    return inCenter && inCategory;
  });

  // Final list depending on tab
  const productsForTab =
    activeTab === SEARCH_TAB ? searchResults : categoryResults;

  const filteredItems = allItems.filter((item) =>
    mappedItems.some(
      (map) =>
        map.hotelPosCenterId === selectedCenterId && map.itemId === item.itemID
    )
  );

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

  const handleStartHoldTransaction = async (table) => {
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

    const posCenterId = String(
      outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
        ?.hotelPosCenterId || "DefaultPOSCenter"
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
      createdBy: "System",
      currAmount: cartTotal,
      currencyCode: "LKR",
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
          currency: "LKR",
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
      dispatch(clearCart());
    } catch (err) {
      console.error("❌ Failed to create hold transaction:", err);
    }
  };

  // add this helper in POSPage component
  const refreshMappedItems = async () => {
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken = tokens.accessToken;
    const hotelId = property?.id;
    if (!hotelId || !accessToken) return;
    try {
      const data = await getItemsByPosCenter({ token: accessToken, hotelId });
      setMappedItems(data); // 👈 this is what your filtering uses
    } catch (e) {
      console.error("Failed to refresh mapped items:", e);
    }
  };

  console.log("reduxCategories : ", reduxCategories);

  function tableToCart(table: any) {
    console.log("table item table : ", table);
    const lines = Array.isArray(table.items) ? table.items : [];
    return lines.map((line: any, idx: number) => ({
      id: String(line.id),
      name: String(line.item ?? "Item"),
      price: Number(line.price ?? 0),
      quantity: Number(line.qty ?? 0),
      category: "POS",
      description: "",
      imageUrl: null,
    }));
  }

  const taxCalc = useMemo(() => {
    if (!cart.length || posTaxStatus !== "succeeded") {
      return {
        base: cartTotal,
        scPct: 0,
        tdlPct: 0,
        ssclPct: 0,
        vatPct: 0,
        sc: 0,
        tdl: 0,
        sscl: 0,
        vat: 0,
        grand: cartTotal,
      };
    }
    return calcTaxes(cartTotal, posTaxRows || []);
  }, [cart.length, cartTotal, posTaxRows, posTaxStatus]);

  const taxForDrawer: TaxBreakdown = useMemo(() => {
    // when collecting from a table, recompute from that total,
    // otherwise use current cart calculation
    if (fullCheckoutData && posTaxStatus === "succeeded") {
      return calcTaxes(fullCheckoutData.total, posTaxRows || []);
    }
    return taxCalc as TaxBreakdown;
  }, [fullCheckoutData, posTaxStatus, posTaxRows, taxCalc]);

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
              <div className="grid gap-3 mt-4">
                {fetchedOutlets.map((outlet) => (
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
                        ? fetchedOutlets?.find(
                            (o: any) => o.hotelPosCenterId === selectedCenterId
                          )?.posCenter ?? "Select Outlet"
                        : "Select Outlet"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    {(fetchedOutlets?.length ?? 0) > 0 ? (
                      fetchedOutlets!.map((outlet: any) => (
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
                        className="flex-1 overflow-x-auto scrollbar-none pr-[96px]" // Reserve space for buttons on the right
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
                          className="cursor-pointer flex flex-col items-center justify-center border-dashed border-2 border-white"
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {cartText}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {cart.map((item: CartItem) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${item.price.toFixed(2)} x {item.quantity}
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
                  {posTaxStatus === "failed" && (
                    <p className="text-xs text-red-600">
                      {String(posTaxError)}
                    </p>
                  )}

                  {cart.length > 0 && (
                    <>
                      <div className="flex w-full items-center justify-between border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                          Subtotal
                        </p>
                        <p className="text-sm">${taxCalc.base.toFixed(2)}</p>
                      </div>

                      {/* Only render a tax line if that tax exists or is > 0 */}
                      {(taxCalc.scPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Service Charge ({taxCalc.scPct}%)
                          </p>
                          <p className="text-sm">${taxCalc.sc.toFixed(2)}</p>
                        </div>
                      )}
                      {(taxCalc.tdlPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            TDL ({taxCalc.tdlPct}%)
                          </p>
                          <p className="text-sm">${taxCalc.tdl.toFixed(2)}</p>
                        </div>
                      )}
                      {(taxCalc.ssclPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            SSCL ({taxCalc.ssclPct}%)
                          </p>
                          <p className="text-sm">${taxCalc.sscl.toFixed(2)}</p>
                        </div>
                      )}
                      {(taxCalc.vatPct ?? 0) > 0 && (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            VAT ({taxCalc.vatPct}%)
                          </p>
                          <p className="text-sm">${taxCalc.vat.toFixed(2)}</p>
                        </div>
                      )}

                      <div className="flex w-full items-center justify-between border-t pt-3">
                        <p className="text-lg font-bold">Total</p>
                        <p className="text-lg font-bold">
                          ${taxCalc.grand.toFixed(2)}
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
            selectedPosCenterId={
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.hotelPosCenterId || ""
            }
            selectedPosCenterName={
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.posCenter || ""
            }
            onClose={() => setShowDeliveryMethod(false)}
            onComplete={(data) => {
              setFullCheckoutData(data);
              setShowPaymentMethod(true);
            }}
            initialMethod={fullCheckoutData?.deliveryMethod} // ✅ Preserve selected method
            initialDetails={fullCheckoutData?.deliveryDetails} // ✅ Preserve input data like table/pax
          />
        )}

        {/* <AddItemModal
          open={addOpen}
          onOpenChange={setAddOpen}
          item={editing}
          categories={categories}
          onSaveManual={handleSaveItem}
          onImportExcel={handleExcelUpload}
          posCenters={posCentersForModal} // optional
          onCreateCategoryClick={() => setShowCreateCategory(true)} // optional
        /> */}
        <AddItemDrawer
          open={addOpen}
          onOpenChange={setAddOpen}
          item={editing}
          categories={categories}
          onSaveManual={handleSaveItem}
          onImportExcel={handleExcelUpload}
          posCenters={posCenters}
          onCreateCategoryClick={() => setShowCreateCategory(true)}
        />

        {showTableManagement && (
          <TableManagementDrawer
            open={showTableManagement}
            onClose={() => setShowTableManagement(false)}
            onTableSelected={(table) => {
              // your existing “start new/hold” flow
              setSelectedTableForOrder(table);
              setShowTableManagement(false);
            }}
            onCollectPayment={(table) => {
              // ✅ directly open the PAYMENT drawer with table’s current bill
              const cartFromTable = tableToCart(table);
              const totalFromTable = Number(table?.order?.total ?? 0);

              setFullCheckoutData({
                cart: cartFromTable,
                total: totalFromTable,
                deliveryMethod: "Table",
                deliveryDetails: {
                  tableNo: String(table.number),
                  noOfPax: String(table.seats ?? 0),
                },
                tranMasId: table?.order?.tranMasId,
              });

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
            posCenter={
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.hotelPosCenterId || ""
            }
            posCenterName={
              outlets.find((o) => o.hotelPosCenterId === selectedCenterId)
                ?.posCenter || ""
            }
            tranMasId={fullCheckoutData.tranMasId}
            tax={taxForDrawer}
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
            categories={categories}
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
                dispatch(fetchHotelPosCenters());
                // do NOT open the Select Outlet modal here
              }
            }
            onCreated={(created) => {
              // optional: preselect the new outlet immediately
              if (created?.hotelPosCenterId) {
                setSelectedCenterId(Number(created.hotelPosCenterId));
              }
            }}
            onTaxesSaved={() => {
              // ✅ lift the suppression so the Select-Outlet modal becomes eligible again
              setSuppressOutletModal(false);
              localStorage.removeItem(STORAGE_SUPPRESS_KEY);
            }}
          />
        )}
        {showCreateCategory && (
          <CreateCategoryDrawer
            open={showCreateCategory}
            onClose={() => {
              setShowCreateCategory(false);
              dispatch(fetchCategories());
            }}
          />
        )}
        {showEditOutlet && (
          <EditOutletDrawer
            open={showEditOutlet}
            onClose={() => setShowEditOutlet(false)}
            outlet={currentOutletObj}
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

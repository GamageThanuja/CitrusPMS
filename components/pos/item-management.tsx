"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetFooter } from "@/components/ui/sheet";
import { ChevronDown, Edit, Plus, Trash } from "lucide-react";
import { useTranslatedText } from "@/lib/translation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCategoryDrawer } from "../drawers/add-category-drawer";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchItemMas,
  selectItemMasItems,
  selectItemMasLoading,
  selectItemMasError,
} from "@/redux/slices/fetchItemMasSlice";
import { addItem, fetchItems } from "@/redux/slices/itemSlice";
import { createHotelImage } from "@/controllers/hotelImageController";
import type { ItemMasData } from "@/redux/slices/createItemMasSlice";
import { createItemMas } from "@/redux/slices/createItemMasSlice";
import { createItemByPOSCenter } from "@/redux/slices/createItemsByPOSCenterSlice";
import {
  fetchHotelPOSCenterMas,
  selectHotelPOSCenterMasData,
} from "@/redux/slices/fetchHotelPOSCenterMasSlice";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import * as XLSX from "xlsx";
import { createItemMasList } from "@/redux/slices/createItemMasListSlice";
import { postCategoryList } from "@/redux/slices/categoryMasterSlice";
import AddItemModal from "../modals/add-item-modal";
import {
  updateItemMaster,
  selectUpdateItemStatus,
  selectUpdateItemError,
} from "@/redux/slices/updateItemMasterSlice";
import EditItemDrawer from "@/components/drawers/edit-item-drawer";
import {
  deleteItemMas,
  selectDeleteItemMasLoading,
  selectDeleteItemMasError,
} from "@/redux/slices/deleteItemMasSlice";

interface Item {
  id: string; // UI key (often equals itemCode)
  itemID?: number; // real PK used by PUT /{id}
  name: string;
  itemCode: string;
  price: number;
  category: number | string; // accept both; we'll coerce to number on save
  description?: string;
  imageUrl?: string;
}

interface Item {
  id: string; // UI key (often equals itemCode)
  itemID?: number; // real PK used by PUT /{id}
  name: string;
  itemCode: string;
  price: number;
  category: number | string;
  description?: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

interface ItemManagementProps {
  categories: Category[];
  onClose: () => void;
}

export function ItemManagement({ categories, onClose }: ItemManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEditDialog, setShowAddEditDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // get raw items from ItemMas slice
  const itemMasItems = useSelector(selectItemMasItems);
  const itemMasLoading = useSelector(selectItemMasLoading);
  const itemMasError = useSelector(selectItemMasError);

  // fetch them when drawer mounts
  useEffect(() => {
    dispatch(fetchItemMas());
  }, [dispatch]);

  // map API shape -> UI Item shape
  const items: Item[] = (itemMasItems ?? []).map((it: any) => ({
    id: String(it.itemID),
    itemID: it.itemID,
    // API sometimes has itemName null, but description filled
    name: it.itemName || it.description || "",
    // API uses itemNumber / itemCode
    itemCode: it.itemNumber || it.itemCode || "",
    price: it.price ?? 0,
    // keep as string for filtering
    category: String(it.categoryID ?? ""),
    description: it.description || "",
    imageUrl: it.imageURL || undefined,
  }));

  // 🔽 NEW: category filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);

  console.log("categories passed into ItemManagement", categories);

  const search = useTranslatedText("Search");
  const addNewItem = useTranslatedText("Add New Item");
  const editItem = useTranslatedText("Edit Item");
  const deleteItem = useTranslatedText("Delete Item");
  const itemName = useTranslatedText("Item Name");
  const description = useTranslatedText("Description");
  const price = useTranslatedText("Price");
  const category = useTranslatedText("Category");
  const save = useTranslatedText("Save");
  const cancel = useTranslatedText("Cancel");
  const confirmDelete = useTranslatedText("Confirm Delete");
  const deleteConfirmation = useTranslatedText(
    "Are you sure you want to delete this item? This action cannot be undone."
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const delStatus = useSelector(selectDeleteItemMasLoading);
  const delError = useSelector(selectDeleteItemMasError);

  const handleEditItem = (item: Item) => {
    setCurrentItem(item);
    setEditOpen(true);
  };

  // open
  const openAdd = () => {
    const defaultCategory = selectedCategoryId || categories?.[0]?.id || "";

    setEditing({
      id: "",
      itemCode: "",
      name: "",
      price: 0,
      category: defaultCategory,
      description: "",
      imageUrl: "",
    });
    setDialogOpen(true);
  };

  // 🔽 UPDATED: filter by search + selected category
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategoryId ||
      String(item.category) === String(selectedCategoryId);

    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    const defaultCategory =
      selectedCategoryId || (categories.length > 0 ? categories[0].id : "");

    setCurrentItem({
      id: "",
      itemCode: "",
      name: "",
      price: 0,
      category: defaultCategory,
      description: "",
      imageUrl: "",
    });

    setShowAddEditDialog(true);
  };

  // ... rest of your code (postItemWithImage, handleSaveItem, etc.) stays the same

  const handleDeleteItem = (item: Item) => {
    setCurrentItem(item);
    setShowDeleteDialog(true);
  };

  const postItemWithImage = (formData: Item) => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    const imageUrl = formData.imageUrl || "";
    const itemMasPayload = buildItemMasPayload(formData, imageUrl);

    dispatch(createItemMas(itemMasPayload))
      .unwrap()
      .then(() => {
        // keep local slice in sync if needed
        dispatch(addItem(formData));
        // refresh ItemMas list used by this screen
        dispatch(fetchItemMas());
        setShowAddEditDialog(false);
      })
      .catch((error: any) => {
        console.error("Failed to create item:", error);
      });
  };

  // build ItemMasData payload from our form + image URL
  const buildItemMasPayload = (
    formData: Item,
    imageUrl: string
  ): ItemMasData => {
    const now = new Date().toISOString();
    return {
      finAct: true,
      itemID: 0, // backend will assign
      itemNumber: formData.itemCode,
      description: formData.name || formData.description || "",
      extDescription: formData.description || "",
      uomid: 0,
      itemTypeID: 0,
      categoryID: Number(formData.category) || 0,
      salesTaxID: 0,
      price: formData.price,
      cost: 0,
      binLocation: "",
      notes: "",
      reorderPoint: 0,
      restockLevel: 0,
      picturePath: imageUrl || "",
      notDiscountable: false,
      cannotPurchase: false,
      cannotInvoDecimal: false,
      waighMustEnter: false,
      itemMessage: "",
      createdBy: 0,
      createdOn: now,
      lastModBy: 0,
      lastModOn: now,
      cogsAccountID: 0,
      salesAccountID: 0,
      inventoryAssetsAccID: 0,
      lowestSellingPrice: 0,
      packagingSize: "",
      messageClient: "",
      cannotInvoInsufQty: false,
      subCompanyID: 0,
      serialNo: "",
      costCenterID: 0,
      custodianID: 0,
      supplierID: 0,
      acqDate: null,
      lifeTimeYears: 0,
      lifeTimeMonths: 0,
      serviceProvider: "",
      warranty: "",
      nextServiceDate: null,
      serviceContractNo: "",
      commercialDepreMethodID: 0,
      fiscalDepreMethodID: 0,
      profitMargin: 0,
      vat: false,
      nbt: false,
      sinhalaDes: "",
      brandID: 0,
      kitItem: false,
      buid: 0,
      serialNumbered: false,
      preferedSupplierID: 0,
      backColour: "",
      limitWholesaleQtyAtCHK: false,
      limitWholesaleQtyAt: 0,
      maxWholesaleQtyCHK: false,
      maxWholesaleQty: 0,
      discountRTNarration: "",
      discountWSNarration: "",
      limitRetailQtyAtCHK: false,
      limitRetailQtyAt: 0,
      maxRetialQtyCHK: false,
      maxRetailQty: 0,
      isPick: false,
      rtPrice: 0,
      wsPrice: 0,
      itemMessage_Client: "",
      showOnPOS: true,
      isKOT: false,
      isBOT: false,
      posCenter: "",
      rackNo: "",
      isTrading: true,
      isTaxIncluded: false,
      isSCIncluded: false,
      baseItemCatID: 0,
      oldItemCode: "",
      small: false,
      regular: false,
      large: false,
      guestPrice: formData.price,
      childPrice: 0,
      guidePrice: 0,
      driverPrice: 0,
      isRecipe: false,
      isAIEntitled: false,
      sku: "",
      useBatchPriceOnSale: false,
      discountPercentage: 0,
      discountID: 0,
      isFastCheckOut: false,
      changePriceOnGRN: false,
      partNo: "",
      oldPrice: 0,
      oldPriceAsAt: null,
      lastPriceUpdateBy: "",
      colour: "",
      askQtyOnSale: false,
      isAskSKU: false,
      skuid: 0,
      isShotItem: false,
      shotItemID: 0,
      shotItemCode: "",
      subItemOf: "",
      imageURL: imageUrl || "",
      lastDepreciatedDate: null,
      depreciationExpenseAccountID: 0,
      bookValue: 0,
      bookValueAsAt: null,
      guardian: "",
      barCode: "",
      nameOnBill: formData.name,
    };
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

    console.log("access token  item add", accessToken);
    console.log("hotel id", hotelID);
    console.log("form data", formData);

    let imageUrl = formData.imageUrl || "";

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

      // try {
      //   const uploadRes = await fetch(

      //     {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //         Authorization: `Bearer ${accessToken}`,
      //       },
      //       body: JSON.stringify(imagePayload),
      //     }
      //   );

      //   const uploadedImage = await uploadRes.json();
      //   const cleanImageUrl = (uploadedImage.imageFileName || "").split("?")[0];
      //   imageUrl = cleanImageUrl;
      // } catch (err) {
      //   console.error("Image upload failed", err);
      // }
      try {
        const uploadResult = await createHotelImage({
          token: accessToken,
          payload: imagePayload,
        });

        // ✅ Use the filename returned by the backend
        const cleanImageUrl = (uploadResult.imageFileName || "").split("?")[0];
        imageUrl = cleanImageUrl;

        console.log("Image uploaded successfully:", imageUrl);
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }

    // Build ItemMas payload
    const itemMasPayload = buildItemMasPayload(formData, imageUrl);
    console.log("Payload being sent to ItemMas:", itemMasPayload);

    try {
      // Create the item in ItemMas
      const created = await dispatch(createItemMas(itemMasPayload)).unwrap();
      const itemID = created.itemID;

      // Refresh ItemMas list used for this screen
      await dispatch(fetchItemMas()).unwrap();

      // ✅ Loop over selected POS centers and create mappings via Redux thunk
      for (const posCenterId of selectedCenters) {
        await dispatch(
          createItemByPOSCenter({
            id: 0,
            posCenterID: posCenterId,
            itemID,
            price: formData.price,
            guidePrice: 0,
            driverPrice: 0,
            kidsPrice: 0,
            price2: 0,
          })
        ).unwrap();
      }

      setShowAddEditDialog(false);
    } catch (error) {
      console.error("Failed to save item or link to POS centers:", error);
      setShowAddEditDialog(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentItem?.itemCode) {
      alert("Missing itemNumber (itemCode) for delete.");
      return;
    }

    try {
      // DELETE /api/ItemMas/{itemNumber}
      await dispatch(
        deleteItemMas({ itemNumber: currentItem.itemCode })
      ).unwrap();

      // refresh ItemMas list used by this screen
      await dispatch(fetchItemMas()).unwrap();

      setShowDeleteDialog(false);
    } catch (e: any) {
      console.error("Delete failed:", e);
      alert(typeof e === "string" ? e : "Delete failed.");
    }
  };
  const [excelData, setExcelData] = useState<any[]>([]);

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

        // ✅ Step 1: Extract unique category names
        const uniqueCategoryNames = [
          ...new Set(rows.map((r: any) => r["Item Category"]).filter(Boolean)),
        ];

        // ✅ Step 2: Build category payloads
        const categoryPayloads = uniqueCategoryNames.map((name) => ({
          categoryID: 0,
          hotelID,
          categoryName: name.trim(),
          finAct: true,
        }));

        console.log("🔹 Posting categories:", categoryPayloads);

        // ✅ Step 3: Post categories and get category IDs
        const categoryRes: any = await dispatch(
          postCategoryList(categoryPayloads)
        ).unwrap();

        console.log("✅ Created categories:", categoryRes);

        // ✅ Step 4: Build category map (name -> ID)
        const categoryMap = new Map<string, number>();
        categoryRes.forEach((cat: any) => {
          categoryMap.set(cat.categoryName.trim(), cat.categoryID);
        });

        // ✅ Step 5: Build item payloads using mapped category IDs
        const itemPayloads = (rows as any[]).map((row) => ({
          categoryID: categoryMap.get((row["Item Category"] || "").trim()) || 0,
          itemID: 0,
          hotelID,
          itemCode: String(row["Item Code"] || ""), // ✅ Must be a string
          itemName: row["Item Name"]?.trim() || "",
          description: row["Description"]?.trim() || "",
          salesAccountID: 0,
          price: parseFloat(row["Guest Price"]) || 0,
          imageURL:
            "https://hotelmate.s3.us-east-1.amazonaws.com/system/healthy.png",
          finAct: true, // ✅ Must be true according to schema
          createdBy: fullName,
          createdOn: now,
          updatedBy: fullName,
          updatedOn: now,
        }));

        console.log("📦 Final items to post:", itemPayloads);

        // ✅ Step 6: Post items using createItemMasList
        await dispatch(createItemMasList(itemPayloads));

        alert("✅ Categories and Items imported successfully");
      } catch (error) {
        console.error("❌ Error during import:", error);
        alert("❌ Import failed. Check console for details.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-6 py-6 h-full">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Input
              type="search"
              placeholder={`${search}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Popover
            open={categoryFilterOpen}
            onOpenChange={setCategoryFilterOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={categoryFilterOpen}
                className="w-[200px] justify-between"
              >
                {selectedCategoryId
                  ? categories.find((c) => c.id === selectedCategoryId)?.name
                  : "All Categories"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedCategoryId("");
                      setCategoryFilterOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedCategoryId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All Categories
                  </CommandItem>

                  {categories.map((cat) => (
                    <CommandItem
                      key={cat.id}
                      onSelect={() => {
                        setSelectedCategoryId(cat.id);
                        setCategoryFilterOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategoryId === cat.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {cat.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button className="ml-2" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {addNewItem}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Code: {item.itemCode || "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {categories.find((c) => c.id === item.category)?.name}
                </p>
                {item.description && (
                  <p className="text-sm mt-1">{item.description}</p>
                )}
                <p className="font-bold mt-2">${item.price.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleEditItem(item)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => handleDeleteItem(item)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SheetFooter className="mb-6">
        <Button variant="outline" onClick={onClose} className="w-full">
          {cancel}
        </Button>
      </SheetFooter>

      <AddItemModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        categories={categories}
        onSaveManual={handleSaveItem}
        onImportExcel={handleExcelUpload}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteItem}</DialogTitle>
            <DialogDescription>{deleteConfirmation}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={delStatus} // boolean loading flag
            >
              {cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={delStatus} // boolean loading flag
            >
              {delStatus ? "Deleting..." : confirmDelete}
            </Button>
          </DialogFooter>
          {delError && (
            <p className="mt-2 text-xs text-destructive" title={delError}>
              {delError}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <EditItemDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        item={currentItem}
        categories={categories as any}
        relinkPosCenters={true}
      />
    </div>
  );
}

interface ItemFormProps {
  item: Item;
  categories: { id: string; name: string }[];
  onSave: (item: Item) => void;
  onCancel: () => void;
}

interface PosCenter {
  hotelPosCenterId: number;
  posCenter: string;
}

function ItemForm({ item, categories, onSave, onCancel }: ItemFormProps) {
  const [formData, setFormData] = useState<Item>(item);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    item.imageUrl
  );

  const itemName = useTranslatedText("Item Name");
  const description = useTranslatedText("Description (optional)");
  const price = useTranslatedText("Price");
  const category = useTranslatedText("Category");
  const uploadImage = useTranslatedText("Upload Image");
  const save = useTranslatedText("Save");
  const cancel = useTranslatedText("Cancel");

  const dispatch = useDispatch<AppDispatch>();

  // 🔽 get POS centers from Redux slice
  const hotelPosCenters = useSelector(selectHotelPOSCenterMasData);

  const [posCenters, setPosCenters] = useState<PosCenter[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<
    File | undefined
  >();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      if (typeof formData.category === "number") {
        setSelectedCategory(formData.category);
      } else {
        const match = categories.find((c) => c.name === formData.category);
        setSelectedCategory(match?.id || null);
      }
    }
  }, [categories, formData.category, selectedCategory]);

  const [openPopover, setOpenPopover] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (selectedCategory !== null) {
      setFormData((prev) => ({ ...prev, category: selectedCategory }));
    }
  }, [selectedCategory]);

  // 🔹 Fetch POS centers via Redux thunk
  useEffect(() => {
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    // Use whatever your property shape has – adjust if needed
    const hotelCode =
      property.hotelCode ||
      property.code ||
      (property.id ? String(property.id) : undefined);

    // Dispatch with or without params depending on hotelCode
    if (hotelCode) {
      dispatch(fetchHotelPOSCenterMas({ hotelCode }));
    } else {
      dispatch(fetchHotelPOSCenterMas());
    }
  }, [dispatch]);

  // 🔹 Map Redux data -> local PosCenter[]
  useEffect(() => {
    if (!hotelPosCenters) return;

    const mapped: PosCenter[] = hotelPosCenters.map((c) => ({
      hotelPosCenterId: c.posCenterID,
      posCenter: c.posCenterName,
    }));

    setPosCenters(mapped);
  }, [hotelPosCenters]);

  const handleChange = (field: keyof Item, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const toggleCenter = (id: number) => {
    setSelectedCenters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.itemCode ||
      !formData.name ||
      !formData.price ||
      !formData.category
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (selectedCenters.length === 0) {
      alert("Please select at least one POS Center.");
      return;
    }
    setSaving(true); // 👈 Start saving
    try {
      await onSave(formData, selectedCenters, selectedImageFile);
    } finally {
      setSaving(false); // 👈 End saving
    }
  };

  console.log("categories 1111", categories);
  console.log("Selected POS centers to post:", selectedCenters);
  console.log("Form data:", formData);
  console.log("pos centers", posCenters);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 scrollbar-none"
    >
      {/* Item Code */}
      <div className="space-y-2 mx-2">
        <Label htmlFor="itemCode">Item Code</Label>
        <Input
          id="itemCode"
          value={formData.itemCode}
          onChange={(e) => handleChange("itemCode", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2 mx-2">
        <Label htmlFor="name">{itemName}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
      </div>

      <div className="space-y-2 mx-2">
        <Label htmlFor="description">{description}</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
        />
      </div>

      <div className="space-y-2 mx-2">
        <Label htmlFor="price">{price}</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) =>
            handleChange("price", parseFloat(e.target.value) || 0)
          }
          required
        />
      </div>

      <div className="space-y-2 mx-2">
        <Label htmlFor="category">{category}</Label>
        <div className="flex gap-2">
          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openPopover}
                className="w-full justify-between"
              >
                {categories.find((cat) => cat.id === selectedCategory)?.name ||
                  "Select category"}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {categories.map((cat) => (
                    <CommandItem
                      key={cat.id}
                      onSelect={() => {
                        setSelectedCategory(cat.id);
                        handleChange("category", cat.id);
                        setOpenPopover(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCategory === cat.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {cat.name}
                    </CommandItem>
                  ))}

                  <div className="flex items-center justify-between p-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Can't find?
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-sm"
                      onClick={() => {
                        setDrawerOpen(true);
                        setOpenPopover(false);
                      }}
                    >
                      <Plus className="w-4 h-4" /> New
                    </Button>
                  </div>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
            onClick={() => setDrawerOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 mx-2">
        <Label>{"POS Centers"}</Label>
        <div className="grid grid-cols-2 gap-2">
          {posCenters.map((center) => (
            <label
              key={center.hotelPosCenterId}
              className="flex items-center gap-2"
            >
              <Checkbox
                checked={selectedCenters.includes(center.hotelPosCenterId)}
                onCheckedChange={() => toggleCenter(center.hotelPosCenterId)}
              />
              <span>{center.posCenter}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2 mx-2">
        <Label htmlFor="image">{uploadImage}</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 h-32 w-full object-cover rounded-md"
          />
        )}
      </div>
      <CreateCategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : save}
        </Button>
      </DialogFooter>
    </form>
  );
}

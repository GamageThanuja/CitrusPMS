// components/drawers/add-item-drawer.tsx
"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Check, Plus, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslatedText } from "@/lib/translation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";
import {
  fetchHotelPOSCenterMas,
  selectHotelPOSCenterMasData,
  selectHotelPOSCenterMasLoading,
  selectHotelPOSCenterMasError,
} from "@/redux/slices/fetchHotelPOSCenterMasSlice";

import { toast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";

// ---------- Types ----------
export interface Item {
  id: string;
  itemID?: number | string;
  name: string;
  itemCode: string;
  price: number;
  category: string | number;
  description?: string;
  imageUrl?: string;
}

export interface Category {
  id: string | number;
  name: string;
}

// This is the shape the drawer uses everywhere
export interface PosCenter {
  hotelPosCenterId: number;
  posCenter: string;
}

// ---------- Props ----------
export interface AddItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When editing pass the existing item, for add pass a prefilled blank */
  item: Item | null;
  categories: Category[];
  /** Persist handler for manual entry */
  onSaveManual: (
    item: Item,
    selectedCenters: number[],
    imageFile?: File
  ) => Promise<void> | void;
  /** Optional bulk import handler (Excel) */
  onImportExcel?: (file: File) => Promise<void> | void;
  /** Optional preloaded POS center list. If omitted, the form fetches from API. */
  posCenters?: PosCenter[];
  /** Optional: open your CreateCategory drawer */
  onCreateCategoryClick?: () => void;
  /** Optional custom titles */
  titleAddText?: string;
  titleEditText?: string;
}

export default function AddItemDrawer({
  open,
  onOpenChange,
  item,
  categories,
  onSaveManual,
  onImportExcel,
  posCenters = [],
  onCreateCategoryClick,
  titleAddText,
  titleEditText,
}: AddItemDrawerProps) {
  const addNewItem = useTranslatedText("Add New Item");
  const editItem = useTranslatedText("Edit Item");
  const isAdd = !item || !item.id;
  const title = isAdd ? titleAddText ?? addNewItem : titleEditText ?? editItem;

  const [showRawOverlay, setShowRawOverlay] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState("");
  const { tutorial } = useTutorial("onBoarding", "taxes");

  const dispatch = useAppDispatch();
  const masData = useAppSelector(selectHotelPOSCenterMasData);
  const masLoading = useAppSelector(selectHotelPOSCenterMasLoading);
  const masError = useAppSelector(selectHotelPOSCenterMasError);

  const existingItems = useAppSelector(
    (state: any) => state.items?.items ?? []
  );

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  React.useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

  // Fetch POS centers from new API only if parent didn't give any
  React.useEffect(() => {
    if (!open) return;
    if (posCenters && posCenters.length > 0) return; // parent-provided list wins
    dispatch(fetchHotelPOSCenterMas());
  }, [open, posCenters?.length, dispatch]);

  // Map API shape -> PosCenter shape used by this component
  const effectivePosCenters: PosCenter[] = React.useMemo(() => {
    if (posCenters && posCenters.length > 0) {
      return posCenters;
    }
    return (masData || []).map((c) => ({
      hotelPosCenterId: c.posCenterID,
      posCenter: c.posCenterName,
    }));
  }, [posCenters, masData]);

  // local ref to pass file to parent when saving
  const imageFileRef = React.useRef<File | undefined>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <VideoOverlay
          videoUrl={videoUrl}
          isOpen={showRawOverlay}
          onClose={() => setShowRawOverlay(false)}
        />
        {/* Title + Video button inline */}
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>{title}</SheetTitle>
          <VideoButton
            onClick={() => setShowRawOverlay(true)}
            label="Watch Video"
          />
        </SheetHeader>

        {/* Optional loading / error for POS centers */}
        {masLoading && effectivePosCenters.length === 0 && (
          <p className="px-2 pt-2 text-xs text-muted-foreground">
            Loading POS centers…
          </p>
        )}
        {masError && effectivePosCenters.length === 0 && (
          <p className="px-2 pt-2 text-xs text-red-500">
            Failed to load POS centers: {masError}
          </p>
        )}

        <Tabs defaultValue="manual" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual">Add Manual Item</TabsTrigger>
            <TabsTrigger value="excel">Import Excel</TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            {item && (
              <ManualItemForm
                item={item}
                categories={categories}
                posCenters={effectivePosCenters}
                onCreateCategoryClick={onCreateCategoryClick}
                onSave={async (payload, centers) => {
                  await onSaveManual(payload, centers, imageFileRef.current);
                  imageFileRef.current = undefined; // reset
                  onOpenChange(false);
                }}
                onImageSelected={(f) => (imageFileRef.current = f)}
                onCancel={() => onOpenChange(false)}
              />
            )}
          </TabsContent>

          <TabsContent value="excel">
            <ExcelImport
              onImportExcel={onImportExcel}
              categories={categories}
              posCenters={effectivePosCenters}
              onSaveManual={onSaveManual}
              existingItems={existingItems}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Manual form ----------
interface ManualItemFormProps {
  item: Item;
  categories: Category[];
  posCenters: PosCenter[];
  onCreateCategoryClick?: () => void;
  onSave: (item: Item, selectedCenters: number[]) => Promise<void> | void;
  onCancel: () => void;
  onImageSelected?: (file?: File) => void;
}

function ManualItemForm({
  item,
  categories,
  posCenters,
  onCreateCategoryClick,
  onSave,
  onCancel,
  onImageSelected,
}: ManualItemFormProps) {
  const [formData, setFormData] = React.useState<Item>(item);
  const [imagePreview, setImagePreview] = React.useState<string | undefined>(
    item.imageUrl
  );
  const [saving, setSaving] = React.useState(false);
  const [selectedCenters, setSelectedCenters] = React.useState<number[]>([]);
  const [openPopover, setOpenPopover] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(
    typeof item.category === "number" ? (item.category as number) : null
  );

  const itemName = useTranslatedText("Item Name");
  const description = useTranslatedText("Description (optional)");
  const price = useTranslatedText("Price");
  const category = useTranslatedText("Category");
  const uploadImage = useTranslatedText("Upload Image");
  const save = useTranslatedText("Save");
  const cancel = useTranslatedText("Cancel");

  React.useEffect(() => {
    if (selectedCategory !== null) {
      setFormData((prev) => ({ ...prev, category: selectedCategory as any }));
    }
  }, [selectedCategory]);

  const handleChange = (field: keyof Item, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onImageSelected?.(file);
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const toggleCenter = (id: number) => {
    setSelectedCenters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async (e: React.FormEvent) => {
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
    setSaving(true);
    try {
      await onSave(formData, selectedCenters);
      console.log("formData : ", formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 scrollbar-none mt-2"
    >
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
            <PopoverContent className="w-full p-0 max-h-80">
              <Command className="flex flex-col w-full">
                <CommandInput placeholder="Search category..." />
                <CommandEmpty>No category found.</CommandEmpty>

                {/* Scrollable list area */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <CommandGroup>
                    {categories.map((cat) => (
                      <CommandItem
                        key={cat.id}
                        onSelect={() => {
                          setSelectedCategory(cat.id as number);
                          setOpenPopover(false);
                        }}
                      >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCategory === (cat.id as any)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        {cat.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>

                {/* Fixed footer (stays visible, list scrolls behind it) */}
                <div className="flex items-center justify-between p-2 border-t">
                  <span className="text-sm text-muted-foreground">
                    Can&apos;t find?
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-sm"
                    type="button"
                    onClick={onCreateCategoryClick}
                  >
                    <Plus className="w-4 h-4" /> New
                  </Button>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
            onClick={onCreateCategoryClick}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 mx-2">
        <Label>{"POS Centers"}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(posCenters ?? []).map((center) => (
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
          onChange={(e) => {
            const f = e.target.files?.[0];
            onImageSelected?.(f);
            if (!f) return;
            const url = URL.createObjectURL(f);
            setImagePreview(url);
          }}
        />
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="mt-2 h-32 w-full object-cover rounded-md"
          />
        )}
      </div>

      <div className="flex justify-end gap-2 px-2 pb-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancel}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : save}
        </Button>
      </div>
    </form>
  );
}

// ---------- Excel Import ----------
interface ExcelImportProps {
  onImportExcel?: (file: File) => Promise<void> | void;
  categories: Category[];
  posCenters: PosCenter[];
  onSaveManual: (
    item: Item,
    selectedCenters: number[],
    imageFile?: File
  ) => Promise<void> | void;
  existingItems: Item[];
}

function ExcelImport({
  onImportExcel,
  categories,
  posCenters,
  onSaveManual,
  existingItems,
}: ExcelImportProps) {
  const [importing, setImporting] = React.useState(false);
  const [selectedCenters, setSelectedCenters] = React.useState<number[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [importResult, setImportResult] = React.useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
    skippedCount: number;
  } | null>(null);

  console.log("importResult : ", importResult);

  // Debug: Log when importResult changes
  React.useEffect(() => {
    console.log("importResult changed:", importResult);
  }, [importResult]);

  // Load selected POS centers from localStorage on mount
  React.useEffect(() => {
    if (typeof window === "undefined" || posCenters.length === 0) return;

    try {
      const raw = localStorage.getItem("hm_selected_pos_center");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.hotelPosCenterId) {
          setSelectedCenters([parsed.hotelPosCenterId]);
          return;
        }
      }
      // If no stored center, select all available centers
      setSelectedCenters(posCenters.map((c) => c.hotelPosCenterId));
    } catch (error) {
      console.warn("Failed to parse hm_selected_pos_center", error);
      // If error, select all available centers
      setSelectedCenters(posCenters.map((c) => c.hotelPosCenterId));
    }
  }, [posCenters]);

  // Download sample Excel file
  const downloadSampleExcel = () => {
    const sampleData = [
      {
        "Item Code": "ITEM001",
        "Item Name": "Sample Item 1",
        "Item Category": "Food & Beverage",
        "Description": "This is a sample item description",
        "Guest Price": "25.50",
      },
      {
        "Item Code": "ITEM002",
        "Item Name": "Sample Item 2",
        "Item Category": "Beverages",
        "Description": "Another sample item",
        "Guest Price": "15.00",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Items");

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Item Code
      { wch: 25 }, // Item Name
      { wch: 20 }, // Item Category
      { wch: 40 }, // Description
      { wch: 15 }, // Guest Price
    ];
    (ws as any)["!cols"] = colWidths;

    XLSX.writeFile(wb, "item-import-template.xlsx");
  };

  // Handle Excel file import
  const handleFileImport = async (file: File) => {
    if (onImportExcel) {
      // If parent provides custom handler, use it
      setImporting(true);
      try {
        await onImportExcel(file);
        // Set a generic success result since we don't know the details from custom handler
        setImportResult({
          successCount: 1,
          errorCount: 0,
          errors: [],
          skippedCount: 0,
        });
      } catch (error: any) {
        setImportResult({
          successCount: 0,
          errorCount: 1,
          errors: [error.message || "Import failed"],
          skippedCount: 0,
        });
      } finally {
        setImporting(false);
      }
      return;
    }

    // Otherwise, use built-in parsing
    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet) as any[];

        if (rows.length === 0) {
          toast({
            title: "Empty file",
            description: "The Excel file is empty. Please add items to import.",
            variant: "destructive",
          });
          setImportResult({
            successCount: 0,
            errorCount: 1,
            errors: ["The Excel file is empty. Please add items to import."],
            skippedCount: 0,
          });
          setImporting(false);
          return;
        }

        // Validate required columns
        const requiredColumns = [
          "Item Code",
          "Item Name",
          "Item Category",
          "Guest Price",
        ];
        const firstRow = rows[0];
        const missingColumns = requiredColumns.filter(
          (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
          toast({
            title: "Invalid file format",
            description: `Missing required columns: ${missingColumns.join(
              ", "
            )}`,
            variant: "destructive",
          });
          setImportResult({
            successCount: 0,
            errorCount: 1,
            errors: [`Missing required columns: ${missingColumns.join(", ")}`],
            skippedCount: 0,
          });
          setImporting(false);
          return;
        }

        // Build category map from provided categories
        const categoryMap = new Map<string, number>();
        categories.forEach((cat) => {
          const catName = String(cat.name || "").trim().toLowerCase();
          const catId = cat.id;
          if (catName && catId) {
            categoryMap.set(catName, Number(catId));
          }
        });

        // Validate POS centers selection
        if (selectedCenters.length === 0) {
          toast({
            title: "No POS centers selected",
            description:
              "Please select at least one POS center before importing.",
            variant: "destructive",
          });
          setImportResult({
            successCount: 0,
            errorCount: 1,
            errors: [
              "No POS centers selected. Please select at least one POS center before importing.",
            ],
            skippedCount: 0,
          });
          setImporting(false);
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];
        const skippedMessages: string[] = [];

        // Track item codes processed in this import session to prevent duplicates within Excel
        const processedItemCodes = new Set<string>();

        // Build a set of existing item codes for quick lookup from existingItems
        const existingItemCodes = new Set<string>();
        existingItems.forEach((existing) => {
          if (existing?.itemCode) {
            const normalized = String(existing.itemCode).trim().toLowerCase();
            if (normalized) {
              existingItemCodes.add(normalized);
            }
          }
        });
        console.log(
          `Found ${existingItemCodes.size} existing item codes in system`
        );
        console.log(
          "Existing item codes sample:",
          Array.from(existingItemCodes).slice(0, 5)
        );

        // Process each row and create items
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            const itemCode = String(row["Item Code"] || "").trim();
            const itemName = String(row["Item Name"] || "").trim();
            const categoryName = String(row["Item Category"] || "").trim();
            const description = String(row["Description"] || "").trim();
            const price = parseFloat(row["Guest Price"]) || 0;

            // Validate required fields
            if (!itemCode) {
              errors.push(`Row ${i + 2}: Item Code is required`);
              errorCount++;
              continue;
            }

            if (!itemName) {
              errors.push(`Row ${i + 2}: Item Name is required`);
              errorCount++;
              continue;
            }

            if (!categoryName) {
              errors.push(`Row ${i + 2}: Item Category is required`);
              errorCount++;
              continue;
            }

            if (price <= 0) {
              errors.push(
                `Row ${i + 2}: Guest Price must be greater than 0`
              );
              errorCount++;
              continue;
            }

            // Normalize item code for comparison
            const normalizedCode = itemCode.trim().toLowerCase();

            // Check for duplicate item code in existing items (SKIPPED, not error)
            if (existingItemCodes.has(normalizedCode)) {
              console.log(
                `[SKIP] Row ${i + 2}: Item Code "${itemCode}" (normalized: "${normalizedCode}") already exists in system`
              );
              skippedMessages.push(
                `Row ${i + 2}: Item Code "${itemCode}" already exists in the system`
              );
              skippedCount++;
              continue;
            }

            // Check for duplicate item code within the Excel file (SKIPPED, not error)
            if (processedItemCodes.has(normalizedCode)) {
              console.log(
                `[SKIP] Row ${i + 2}: Item Code "${itemCode}" duplicated in Excel file`
              );
              skippedMessages.push(
                `Row ${i + 2}: Item Code "${itemCode}" is duplicated in the Excel file`
              );
              skippedCount++;
              continue;
            }

            // Find category ID from map
            const categoryId = categoryMap.get(
              categoryName.trim().toLowerCase()
            );
            if (!categoryId) {
              errors.push(
                `Row ${i + 2}: Category "${categoryName}" could not be found.`
              );
              errorCount++;
              continue;
            }

            // Mark this item code as processed BEFORE posting to prevent race conditions
            processedItemCodes.add(normalizedCode);

            // Create item object
            const item: Item = {
              id: `temp-${Date.now()}-${i}`,
              itemCode,
              name: itemName,
              category: categoryId,
              price,
              description: description || undefined,
            };

            // Save item
            console.log(
              `[POST] Row ${i + 2}: Posting item "${itemCode}" (normalized: "${normalizedCode}")`
            );
            await onSaveManual(item, selectedCenters);

            // Add to existing codes set to prevent duplicates in subsequent iterations
            existingItemCodes.add(normalizedCode);

            successCount++;
            console.log(
              `[SUCCESS] Row ${i + 2}: Successfully posted. Total success: ${successCount}`
            );
          } catch (error: any) {
            // If error occurred, remove from processed set so it can be retried if needed
            const itemCode = String(row["Item Code"] || "").trim();
            const normalizedCode = itemCode.toLowerCase();
            processedItemCodes.delete(normalizedCode);

            errors.push(
              `Row ${i + 2}: ${error.message || "Unknown error"}`
            );
            errorCount++;
          }
        }

        // Set import results to display in drawer
        console.log(
          `Import Summary: Total rows=${rows.length}, Success=${successCount}, Errors=${errorCount}, Skipped=${skippedCount}`
        );
        console.log(
          `Skipped messages count: ${skippedMessages.length}`
        );

        const result = {
          successCount,
          errorCount,
          errors: [...errors, ...skippedMessages], // Include both errors and skipped messages
          skippedCount,
        };
        console.log("Setting import result:", result);
        setImportResult(result);
        console.log("setImportResult called with:", result);

        // Log errors to console
        if (errors.length > 0) {
          console.error("Import errors:", errors);
        }
        if (skippedCount > 0) {
          console.warn(
            `Found ${skippedCount} duplicate item code(s) that were skipped.`
          );
        }
      } catch (error: any) {
        console.error("Error during Excel import:", error);
        const errorResult = {
          successCount: 0,
          errorCount: 1,
          errors: [
            error.message ||
              "An error occurred while importing the file.",
          ],
          skippedCount: 0,
        };
        console.log("Setting error result:", errorResult);
        setImportResult(errorResult);
      } finally {
        setImporting(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Download the sample Excel template, fill it with your items, and upload
          it to import multiple items at once.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={downloadSampleExcel}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Sample Template
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excel-file">Upload Excel File</Label>
        <Input
          id="excel-file"
          type="file"
          accept=".xlsx, .xls"
          disabled={importing}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelectedFile(file || null);
            // Don't clear result immediately - let user see previous result until new import starts
          }}
        />
        {selectedFile && (
          <p className="text-sm text-muted-foreground">
            Selected:{" "}
            <span className="font-medium">{selectedFile.name}</span>
          </p>
        )}
        <Button
          type="button"
          onClick={async () => {
            if (!selectedFile) return;
            setImportResult(null); // Clear previous result before starting new import
            await handleFileImport(selectedFile);
            setSelectedFile(null); // Clear selected file after import
          }}
          disabled={!selectedFile || importing}
          className="w-full"
        >
          {importing ? "Importing..." : "Import"}
        </Button>
      </div>

      {/* Import Status Display - Under Upload Section */}
      {importing && (
        <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
            ⏳ Importing items... Please wait.
          </p>
        </div>
      )}

      {/* Debug: Show if importResult exists */}
      {/* {importResult && (
        <div className="p-2 bg-gray-100 dark:bg-gray-800 text-xs">
          DEBUG: importResult exists - Success: {importResult.successCount},
          Errors: {importResult.errorCount}, Skipped:{" "}
          {importResult.skippedCount}
        </div>
      )} */}

      {/* Import Results Display - Always show when available */}
      {/* {importResult && (
        <div
          key={`result-${importResult.successCount}-${importResult.errorCount}-${importResult.skippedCount}`}
          className={`p-4 rounded-lg border-2 shadow-lg mt-4 ${
            importResult.successCount > 0 &&
            importResult.errorCount === 0 &&
            importResult.skippedCount === 0
              ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
              : importResult.successCount > 0 &&
                (importResult.errorCount > 0 ||
                  importResult.skippedCount > 0)
              ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700"
              : "bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700"
          }`}
        >
          <div className="space-y-3">
            <h3
              className={`font-bold text-lg ${
                importResult.successCount > 0 &&
                importResult.errorCount === 0 &&
                importResult.skippedCount === 0
                  ? "text-green-900 dark:text-green-100"
                  : importResult.successCount > 0 &&
                    (importResult.errorCount > 0 ||
                      importResult.skippedCount > 0)
                  ? "text-yellow-900 dark:text-yellow-100"
                  : "text-red-900 dark:text-red-100"
              }`}
            >
              {importResult.successCount > 0 &&
              importResult.errorCount === 0 &&
              importResult.skippedCount === 0
                ? "✅ Import Successful"
                : importResult.successCount > 0 &&
                  (importResult.errorCount > 0 ||
                    importResult.skippedCount > 0)
                ? "⚠️ Import Completed with Warnings"
                : "❌ Import Failed"}
            </h3>

            <div className="text-sm space-y-2">
              {importResult.successCount > 0 && (
                <p
                  className={`font-semibold text-base ${
                    importResult.successCount > 0 &&
                    importResult.errorCount === 0 &&
                    importResult.skippedCount === 0
                      ? "text-green-800 dark:text-green-200"
                      : "text-yellow-800 dark:text-yellow-200"
                  }`}
                >
                  ✅ Successfully posted:{" "}
                  <strong className="text-lg">
                    {importResult.successCount}
                  </strong>{" "}
                  item(s)
                </p>
              )}

              {importResult.skippedCount > 0 && (
                <p className="text-yellow-800 dark:text-yellow-200 font-semibold text-base">
                  ⚠️ Skipped (duplication detected):{" "}
                  <strong className="text-lg">
                    {importResult.skippedCount}
                  </strong>{" "}
                  duplicate item code(s)
                </p>
              )}

              {importResult.errorCount > 0 && (
                <p className="text-red-800 dark:text-red-200 font-semibold text-base">
                  ❌ Errors:{" "}
                  <strong className="text-lg">
                    {importResult.errorCount}
                  </strong>{" "}
                  item(s) failed
                </p>
              )}

              {importResult.successCount === 0 &&
                importResult.errorCount === 0 &&
                importResult.skippedCount === 0 && (
                  <p className="text-muted-foreground font-medium">
                    No items were processed.
                  </p>
                )}
            </div>

            {(importResult.errors.length > 0 ||
              importResult.skippedCount > 0) && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
                  View details ({importResult.errors.length}{" "}
                  {importResult.skippedCount > 0
                    ? `(${importResult.skippedCount} skipped)`
                    : ""})
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1 p-2 bg-white dark:bg-gray-900 rounded">
                  {importResult.errors.map((error, idx) => {
                    const isSkipped =
                      error.includes("already exists") ||
                      error.includes("duplicated");
                    return (
                      <p
                        key={idx}
                        className={`text-xs ${
                          isSkipped
                            ? "text-yellow-700 dark:text-yellow-300"
                            : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        {error}
                      </p>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}
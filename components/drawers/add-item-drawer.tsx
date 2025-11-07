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
import { ChevronDown, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslatedText } from "@/lib/translation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchHotelPosCenters,
  selectHotelPosCenters,
  selectHotelPosCentersLoading,
  selectHotelPosCentersError,
} from "@/redux/slices/hotelPosCenterSlice";
import VideoOverlay from "../videoOverlay";
import VideoButton from "../videoButton";
import { useTutorial } from "@/hooks/useTutorial";

// ---------- Types ----------
export interface Item {
  id: string;
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
  /** Optional preloaded POS center list. If omitted, the form shows none. */
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
  const { tutorial, status: tutStatus } = useTutorial("onBoarding", "taxes");

  console.log("videoUrl : ", videoUrl);

  // If your tutorial has a videoURL, use it for the overlay/button automatically
  React.useEffect(() => {
    if (tutorial?.videoURL) {
      setVideoUrl(tutorial.videoURL);
    }
  }, [tutorial]);

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

        <div className="top-10 right-10 absolute">
          <VideoButton
            onClick={() => setShowRawOverlay(true)}
            label="Watch Video"
          />
        </div>

        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

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
                posCenters={posCenters}
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
            <ExcelImport onImportExcel={onImportExcel} />
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
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search category..." />
                <CommandEmpty>No category found.</CommandEmpty>
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
                </CommandGroup>
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
function ExcelImport({
  onImportExcel,
}: {
  onImportExcel?: (file: File) => Promise<void> | void;
}) {
  return (
    <div className="p-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload your Excel file (.xlsx) to import categories & items.
      </p>
      <Input
        type="file"
        accept=".xlsx, .xls"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (onImportExcel) await onImportExcel(file);
        }}
      />
    </div>
  );
}

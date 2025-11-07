"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
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

export interface ItemFormProps {
  item: Item;
  categories: Category[];
  onSave: (
    item: Item,
    selectedCenters: number[],
    imageFile?: File
  ) => Promise<void> | void;
  onCancel: () => void;
  /** optional: use pre-fetched POS centers */
  posCenters?: PosCenter[];
  /** optional: create-category action */
  onCreateCategoryClick?: () => void;
}

export function ItemForm({
  item,
  categories,
  onSave,
  onCancel,
  posCenters,
  onCreateCategoryClick,
}: ItemFormProps) {
  const [formData, setFormData] = React.useState<Item>(item);
  const [imagePreview, setImagePreview] = React.useState<string | undefined>(
    item.imageUrl
  );
  const [saving, setSaving] = React.useState(false);
  const [selectedCenters, setSelectedCenters] = React.useState<number[]>([]);
  const [openPopover, setOpenPopover] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<number | null>(
    typeof item.category === "number"
      ? (item.category as unknown as number)
      : null
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
      setFormData((prev) => ({
        ...prev,
        category: selectedCategory as unknown as any,
      }));
    }
  }, [selectedCategory]);

  const handleChange = (field: keyof Item, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    // Store file object on state via a symbol key to avoid widening Item
    (handleImageUpload as any)._file = file;
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
      await onSave(
        formData,
        selectedCenters,
        (handleImageUpload as any)._file as File | undefined
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 scrollbar-none"
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
                        setSelectedCategory(cat.id as unknown as number);
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
                      Can't find?
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

// components/items/types.ts
export interface Item {
  id: string;
  name: string;
  itemCode: string;
  price: number;
  category: string | number; // accept either form
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

// Example usage inside your ItemManagement.tsx (trimmed to show integration)
// import { ItemFormDialog } from "@/components/items/ItemFormDialog";
// ...
// const [dialogOpen, setDialogOpen] = useState(false);
// const [editing, setEditing] = useState<Item | null>(null);
//
// const openAdd = () => {
//   setEditing({ id: "", itemCode: "", name: "", price: 0, category: categories?.[0]?.id ?? "", description: "", imageUrl: "" });
//   setDialogOpen(true);
// };
//
// <Button onClick={openAdd}>Add Item</Button>
// <ItemFormDialog
//   open={dialogOpen}
//   onOpenChange={setDialogOpen}
//   item={editing}
//   categories={formattedCategories}
//   onSaveManual={handleSaveItem}
//   onImportExcel={handleExcelUpload}
//   // posCenters={preloadedPosCenters}
// />

"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslatedText } from "@/lib/translation";
import { getPosCenter } from "@/controllers/posCenterController";
import { createHotelImage } from "@/controllers/hotelImageController";
import { createItemByPosCenter } from "@/controllers/itemByPosCenterController";
import {
  updateItemMaster,
  selectUpdateItemStatus,
  selectUpdateItemError,
} from "@/redux/slices/updateItemMasterSlice";
import { fetchItems } from "@/redux/slices/itemSlice";
import { Checkbox } from "@/components/ui/checkbox";

type Category = { id: number | string; name: string };
type PosCenter = { hotelPosCenterId: number; posCenter: string };

type Item = {
  id: string; // UI key (itemCode)
  itemID?: number; // REAL PK (required for PUT)
  itemCode: string;
  name: string;
  price: number;
  category: number | string;
  description?: string;
  imageUrl?: string;
};

export default function EditItemDrawer({
  open,
  onOpenChange,
  item,
  categories,
  relinkPosCenters = true, // toggle relinking
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Item | null;
  categories: Category[];
  relinkPosCenters?: boolean;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const updStatus = useSelector(selectUpdateItemStatus);
  const updError = useSelector(selectUpdateItemError);
  console.log("EditItemDrawer render", { item });

  const tName = useTranslatedText("Item Name");
  const tDesc = useTranslatedText("Description");
  const tPrice = useTranslatedText("Price");
  const tCat = useTranslatedText("Category");
  const tUpload = useTranslatedText("Upload Image");
  const tCancel = useTranslatedText("Cancel");
  const tSave = useTranslatedText("Save");
  const tPosCenters = useTranslatedText("POS Centers");

  const [form, setForm] = useState<Item | null>(item);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [openPopover, setOpenPopover] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    item?.imageUrl
  );
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [posCenters, setPosCenters] = useState<PosCenter[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);

  useEffect(() => {
    setForm(item ?? null);
    setImagePreview(item?.imageUrl);
    setImageFile(undefined);
  }, [item]);

  useEffect(() => {
    if (!form) return;
    if (typeof form.category === "number") {
      setSelectedCategory(form.category);
    } else {
      const match = categories.find((c) => c.id === form.category);
      setSelectedCategory(match ? Number(match.id as any) : null);
    }
  }, [form, categories]);

  useEffect(() => {
    if (!open) return;
    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken = tokens.accessToken;
    const hotelID = property.id;
    if (!accessToken || !hotelID) return;

    (async () => {
      try {
        const data = await getPosCenter({
          token: accessToken,
          hotelId: hotelID,
        });
        setPosCenters(data || []);
      } catch (e) {
        console.error("POS centers fetch failed", e);
      }
    })();
  }, [open]);

  const setField = (k: keyof Item, v: any) =>
    form && setForm({ ...form, [k]: v });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const toggleCenter = (id: number) =>
    setSelectedCenters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const submit = async () => {
    if (!form?.itemID) {
      alert("Missing itemID for update.");
      return;
    }
    if (!form.itemCode || !form.name || !form.price || !selectedCategory) {
      alert("Please fill required fields.");
      return;
    }

    const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const accessToken = tokens.accessToken;
    const hotelID = property.id;
    const fullName = tokens.fullName || "system";
    if (!accessToken || !hotelID) {
      alert("Missing auth or hotel context.");
      return;
    }

    let imageURL = form.imageUrl || "";
    if (imageFile) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve((r.result as string).split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(imageFile);
      });
      try {
        const up = await createHotelImage({
          token: accessToken,
          payload: {
            imageID: 0,
            hotelID,
            imageFileName: `hotel-image-${Date.now()}.jpg`,
            description: "Item image",
            isMain: true,
            finAct: true,
            createdOn: new Date().toISOString(),
            createdBy: fullName,
            updatedOn: new Date().toISOString(),
            updatedBy: fullName,
            base64Image: base64,
          },
        });
        imageURL = (up.imageFileName || "").split("?")[0];
      } catch (e) {
        console.error("Image upload failed", e);
      }
    }

    const body = {
      categoryID: Number(selectedCategory),
      itemID: form.itemID,
      hotelID,
      itemCode: form.itemCode || form.id,
      itemName: form.name,
      description: form.description || "",
      salesAccountID: 0,
      price: Number(form.price),
      imageURL,
      finAct: true,
      createdBy: fullName,
      createdOn: new Date().toISOString(),
      updatedBy: fullName,
      updatedOn: new Date().toISOString(),
    };

    try {
      const updated = await (dispatch as AppDispatch)(
        updateItemMaster({ id: form.itemID, data: body })
      ).unwrap();

      if (relinkPosCenters && selectedCenters.length) {
        for (const pc of selectedCenters) {
          await createItemByPosCenter({
            token: accessToken,
            payload: {
              hotelId: hotelID,
              itemId: updated.itemID,
              hotelPosCenterId: pc,
            },
          });
        }
      }

      await (dispatch as AppDispatch)(fetchItems(hotelID));
      onOpenChange(false);
    } catch (e) {
      console.error("Update failed", e);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit Item</SheetTitle>
        </SheetHeader>

        {form && (
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="code">Item Code</Label>
              <Input
                id="code"
                value={form.itemCode}
                onChange={(e) => setField("itemCode", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{tName}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">{tDesc}</Label>
              <Textarea
                id="desc"
                value={form.description || ""}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{tPrice}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setField("price", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{tCat}</Label>
              <Popover open={openPopover} onOpenChange={setOpenPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {categories.find((c) => Number(c.id) === selectedCategory)
                      ?.name || "Select category"}
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
                          key={String(cat.id)}
                          onSelect={() => {
                            setSelectedCategory(Number(cat.id));
                            setField("category", Number(cat.id));
                            setOpenPopover(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCategory === Number(cat.id)
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

            {relinkPosCenters && (
              <div className="space-y-2">
                <Label>{tPosCenters}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {posCenters.map((c) => (
                    <label
                      key={c.hotelPosCenterId}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={selectedCenters.includes(c.hotelPosCenterId)}
                        onCheckedChange={() => toggleCenter(c.hotelPosCenterId)}
                      />
                      <span>{c.posCenter}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="image">{tUpload}</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={onFile}
              />
              {!!imagePreview && (
                <img
                  src={imagePreview}
                  className="mt-2 h-32 w-full object-cover rounded-md"
                  alt="Preview"
                />
              )}
            </div>
          </div>
        )}

        <SheetFooter className="mt-6">
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="w-1/2"
              onClick={() => onOpenChange(false)}
            >
              {tCancel}
            </Button>
            <Button
              className="w-1/2"
              onClick={submit}
              disabled={updStatus === "loading"}
            >
              {updStatus === "loading" ? "Saving..." : tSave}
            </Button>
          </div>
          {updError && (
            <p
              className="text-xs text-destructive mt-2 truncate"
              title={updError}
            >
              {updError}
            </p>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

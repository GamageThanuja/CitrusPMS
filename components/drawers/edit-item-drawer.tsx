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
import { createHotelImage } from "@/controllers/hotelImageController";
import {
  updateItemMas,
  selectUpdateItemMasLoading,
  selectUpdateItemMasError,
} from "@/redux/slices/updateItemMasSlice";
import { fetchItemMas } from "@/redux/slices/fetchItemMasSlice";
import { Checkbox } from "@/components/ui/checkbox";
import {
  fetchHotelPOSCenterMas,
  selectHotelPOSCenterMasData,
} from "@/redux/slices/fetchHotelPOSCenterMasSlice";
import {
  createHotelPOSCenterMas,
  type CreateHotelPOSCenterMasPayload,
} from "@/redux/slices/createHotelPOSCenterMasSlice";
// ✅ toast
import { toast } from "sonner";

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
  const updStatus = useSelector(selectUpdateItemMasLoading);
  const updError = useSelector(selectUpdateItemMasError);
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
  const hotelPosCenters = useSelector(selectHotelPOSCenterMasData);

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

  // ✅ When drawer opens, fetch POS centers via Redux thunk
  useEffect(() => {
    if (!open) return;

    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    const hotelCode: string | undefined =
      property.hotelCode ||
      property.code ||
      (property.id ? String(property.id) : undefined);

    if (hotelCode) {
      dispatch(fetchHotelPOSCenterMas({ hotelCode }));
    } else {
      dispatch(fetchHotelPOSCenterMas());
    }
  }, [open, dispatch]);

  // ✅ Map Redux data -> local PosCenter[] (same shape as before)
  useEffect(() => {
    if (!hotelPosCenters) return;
    const mapped: PosCenter[] = hotelPosCenters.map((c) => ({
      hotelPosCenterId: c.posCenterID,
      posCenter: c.posCenterName,
    }));
    setPosCenters(mapped);
  }, [hotelPosCenters]);

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
    const hotelID = property.id;

    let imageURL = form.imageUrl || "";

    const userID = JSON.parse(localStorage.getItem("userID") || "0");

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
      createdBy: userID,
      createdOn: new Date().toISOString(),
      updatedBy: "system",
      updatedOn: new Date().toISOString(),
    };

    console.log("Submitting form data:", form);

    try {
      const updated = await dispatch(
        updateItemMas({
          ...(body as any),
          itemNumber: form.itemCode,
        } as any)
      ).unwrap();

      // 🔁 REPLACED: createItemByPosCenter -> createHotelPOSCenterMas (Redux)
      if (relinkPosCenters && selectedCenters.length) {
        for (const pc of selectedCenters) {
          const src = hotelPosCenters.find((c: any) => c.posCenterID === pc);

          const payload: CreateHotelPOSCenterMasPayload = {
            posCenterID: 0,
            posCenterCode: src?.posCenterCode ?? "",
            posCenterName: src?.posCenterName ?? "",
            nextBillNo: src?.nextBillNo ?? "1",
            hotelCode:
              src?.hotelCode ??
              property.hotelCode ??
              property.code ??
              String(hotelID),
            createdBy: src?.createdBy ?? "system",
            createdOn: src?.createdOn ?? new Date().toISOString(),
            finAct: src?.finAct ?? true,
            kotPrinterName: src?.kotPrinterName ?? "",
            botPrinterName: src?.botPrinterName ?? "",
            billPrinterName: src?.billPrinterName ?? "",
            nextOrderNo: src?.nextOrderNo ?? "",
            locationID: src?.locationID ?? 0,
            show: src?.show ?? true,
            isTaxInclusivePrices: src?.isTaxInclusivePrices ?? false,
            isAskRoomNo: src?.isAskRoomNo ?? false,
            isAskTableNo: src?.isAskTableNo ?? false,
            isAskDeliveryMtd: src?.isAskDeliveryMtd ?? false,
            isAskPOSCenter: src?.isAskPOSCenter ?? false,
            isAskNoOfPax: src?.isAskNoOfPax ?? false,
            isChargeSeperateSC: src?.isChargeSeperateSC ?? false,
            vat: src?.vat ?? 0,
            nbt: src?.nbt ?? 0,
            sc: src?.sc ?? 0,
            ct: src?.ct ?? 0,
            gotoLogin: src?.gotoLogin ?? false,
            isNBTPlusVat: src?.isNBTPlusVat ?? false,
            printBillOnLQ: src?.printBillOnLQ ?? false,
            usdBilling: src?.usdBilling ?? false,
            noOfBillCopies: src?.noOfBillCopies ?? 1,
            isPossibleToPostToFOCashier:
              src?.isPossibleToPostToFOCashier ?? false,
            isTakeAway: src?.isTakeAway ?? false,
            outletGroup: src?.outletGroup ?? "",
            isProfitCenter: src?.isProfitCenter ?? false,
            roomServiceSC: src?.roomServiceSC ?? 0,
            takeAwaySC: src?.takeAwaySC ?? 0,
            deliverySC: src?.deliverySC ?? 0,
            allowDirectBill: src?.allowDirectBill ?? false,
            printKOTCopyAtBILLPrinter: src?.printKOTCopyAtBILLPrinter ?? false,
            costPercentage: src?.costPercentage ?? 0,
            isBar: src?.isBar ?? false,
            isMergeTableWhenPrintSt: src?.isMergeTableWhenPrintSt ?? false,
            koT_paperwidth: src?.koT_paperwidth ?? 0,
            boT_paperwidth: src?.boT_paperwidth ?? 0,
            bilL_paperwidth: src?.bilL_paperwidth ?? 0,
            showOnGSS: src?.showOnGSS ?? true,
          };

          await (dispatch as AppDispatch)(
            createHotelPOSCenterMas(payload)
          ).unwrap();
        }
      }

      // 🔄 refresh items so parent list shows updated data without manual refresh
      await dispatch(fetchItemMas()).unwrap();

      // ✅ toast on success
      toast.success("Item updated successfully");

      // close drawer
      onOpenChange(false);
    } catch (e) {
      console.error("Update failed", e);
      toast.error("Failed to update item");
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
            <Button className="w-1/2" onClick={submit} disabled={updStatus}>
              {updStatus ? "Saving..." : tSave}
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
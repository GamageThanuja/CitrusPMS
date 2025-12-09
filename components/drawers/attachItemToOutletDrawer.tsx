// AttachItemToOutletDrawer.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { toast } from "@/components/ui/use-toast";
import { createItemByPOSCenter } from "@/redux/slices/createItemsByPOSCenterSlice";
import { fetchItemsByPOSCenter } from "@/redux/slices/fetchItemsByPOSCenterSlice";
import {
  fetchItemMas,
  selectItemMasItems,
} from "@/redux/slices/fetchItemMasSlice";
import {
  fetchHotelPOSCenterMas,
  type HotelPOSCenterMas,
} from "@/redux/slices/fetchHotelPOSCenterMasSlice";
import {
  fetchCategoryMas,
  selectCategoryMasItems,
  type CategoryMasItem,
} from "@/redux/slices/fetchCategoryMasSlice";

interface ItemManagementDrawerProps {
  open: boolean;
  onClose: () => void;
  onMappingChanged?: () => void;
}

export function AttachItemToOutletDrawer({
  open,
  onClose,
  onMappingChanged,
}: ItemManagementDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const items = useSelector(selectItemMasItems);
  const categoryMasItems = useSelector(selectCategoryMasItems);

  // Map ItemMas to the format expected by the component
  const mappedItems = items.map((item) => ({
    id: item.itemID,
    name: item.description || item.itemNumber,
    category: item.categoryID,
    price: item.price,
  }));

  const categories = (categoryMasItems ?? []).map((c: CategoryMasItem) => ({
    id: String(c.categoryID),
    name: c.categoryName,
  }));

  const [posCenters, setPosCenters] = useState<
    { hotelPosCenterId: number; posCenter: string }[]
  >([]);
  const [assigned, setAssigned] = useState<{ [itemId: number]: number[] }>({});

  useEffect(() => {
    if (!open) return;

    // 👇 Move localStorage reads *inside* the effect
    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );
    const hotelId = property.id;

    const hotelCode: string = property.hotelCode;

    const fetchInitialData = async () => {
      try {
        // categories via CategoryMas slice
        dispatch(fetchCategoryMas());

        // Fetch items (fetchItemMas fetches all items, no hotelId filter)
        dispatch(fetchItemMas());

        const [centersRes, assignedData] = await Promise.all([
          dispatch(
            fetchHotelPOSCenterMas(hotelCode ? { hotelCode } : undefined)
          ).unwrap(),
          dispatch(fetchItemsByPOSCenter()).unwrap(),
        ]);

        const centers = (centersRes || []) as HotelPOSCenterMas[];

        setPosCenters(
          centers.map((c) => ({
            hotelPosCenterId: c.posCenterID,
            posCenter: c.posCenterName,
          }))
        );

        const map: { [itemId: number]: number[] } = {};
        for (const entry of assignedData) {
          if (!map[entry.itemID]) map[entry.itemID] = [];
          map[entry.itemID].push(entry.posCenterID);
        }

        setAssigned(map);
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to load data" });
      }
    };

    fetchInitialData();
  }, [open, dispatch]);

  const handleToggle = async (
    itemId: number,
    hotelPosCenterId: number,
    checked: boolean
  ) => {
    try {
      const currentItem = mappedItems.find((it: any) => it.id === itemId);
      const price = currentItem?.price ?? 0;

      await dispatch(
        createItemByPOSCenter({
          id: 0,
          posCenterID: hotelPosCenterId,
          itemID: itemId,
          price,
          guidePrice: 0,
          driverPrice: 0,
          kidsPrice: 0,
          price2: 0,
        })
      ).unwrap();

      setAssigned((prev) => {
        const current = prev[itemId] || [];
        const updated = checked
          ? [...current, hotelPosCenterId]
          : current.filter((id) => id !== hotelPosCenterId);
        return { ...prev, [itemId]: updated };
      });

      onMappingChanged?.();
    } catch (e) {
      console.error("Failed to update item assignment", e);
      toast({
        title: "Error",
        description: "Failed to update item assignment",
      });
    }
  };

  const groupedItems = mappedItems.reduce(
    (acc: { [category: string]: typeof mappedItems }, item: any) => {
      const key = String(item.category);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {}
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-5xl bg-white dark:bg-gray-900 text-black dark:text-white overflow-x-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-black dark:text-white text-lg">
            Attach Items to Outlets
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <table className="min-w-full border border-black dark:border-gray-700 text-sm">
        <thead className="bg-white dark:bg-gray-800 text-black dark:text-white sticky top-0 z-10">
  <tr className="border-b border-black dark:border-gray-700">
    <th className="px-4 py-3 text-left border-r border-black dark:border-gray-700 border-b w-20">
      Code
    </th>
    <th className="px-4 py-3 text-left border-r border-black dark:border-gray-700 border-b w-64">
      Item Name
    </th>
    {posCenters.map((center) => (
      <th
        key={center.hotelPosCenterId}
        className="px-4 py-3 text-center border-r border-black dark:border-gray-700 border-b "
      >
        {center.posCenter}
      </th>
    ))}
  </tr>
</thead>

            <tbody>
              {Object.entries(groupedItems).map(
                ([categoryId, itemsInCategory]) => (
                  <Fragment key={categoryId}>
                    {/* Category row */}
                    <tr className="bg-white dark:bg-gray-800 text-black dark:text-white text-sm border-t border-b border-black dark:border-gray-700">
                      <td
                        colSpan={posCenters.length + 2}
                        className="px-4 py-2 font-bold uppercase tracking-wide text-black dark:text-white bg-white dark:bg-gray-800 border-black dark:border-gray-700"
                      >
                        {categories.find((cat: any) => cat.id === categoryId)
                          ?.name || `Category ${categoryId}`}
                      </td>
                    </tr>

                    {/* Item rows */}
                    {itemsInCategory.map((item: any) => (
                      <tr
                        key={item.id}
                        className="even:bg-white even:dark:bg-gray-900 odd:bg-white odd:dark:bg-gray-900 border-t border-black dark:border-gray-700"
                      >
                        <td className="px-4 py-2 border-r border-black dark:border-gray-700">
                          {item.id}
                        </td>
                        <td className="px-4 py-2 border-r border-black dark:border-gray-700">
                          {item.name}
                        </td>
                        {posCenters.map((center) => (
                          <td
                            key={center.hotelPosCenterId}
                            className="text-center border-r border-black dark:border-gray-700"
                          >
                            <Checkbox
                              checked={
                                assigned[item.id]?.includes(
                                  center.hotelPosCenterId
                                ) || false
                              }
                              onCheckedChange={(checked) =>
                                handleToggle(
                                  item.id,
                                  center.hotelPosCenterId,
                                  checked as boolean
                                )
                              }
                              className="border-black dark:border-gray-400 data-[state=checked]:bg-white data-[state=checked]:text-black dark:data-[state=checked]:bg-gray-700 dark:data-[state=checked]:text-white"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                )
              )}
            </tbody>
          </table>
        </div>
      </SheetContent>
    </Sheet>
  );
}

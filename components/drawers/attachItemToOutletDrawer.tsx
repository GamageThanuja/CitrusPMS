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
import { RootState } from "@/redux/store";
import { toast } from "@/components/ui/use-toast";
import { getPosCenter } from "@/controllers/posCenterController";
import {
  createItemByPosCenter,
  getItemsByPosCenter,
} from "@/controllers/itemByPosCenterController";
import { fetchCategories } from "@/redux/slices/categorySlice";

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
  const dispatch = useDispatch();
  const { items } = useSelector((state: RootState) => state.items);
  const { categories } = useSelector((state: RootState) => state.categories);
  const [posCenters, setPosCenters] = useState<
    { hotelPosCenterId: number; posCenter: string }[]
  >([]);
  const [assigned, setAssigned] = useState<{ [itemId: number]: number[] }>({});

  const tokens = JSON.parse(localStorage.getItem("hotelmateTokens") || "{}");
  const accessToken = tokens.accessToken;
  const property = JSON.parse(localStorage.getItem("selectedProperty") || "{}");
  const hotelId = property.id;

  useEffect(() => {
    if (!open) return;

    const fetchInitialData = async () => {
      try {
        dispatch(fetchCategories(hotelId));
        const [centers, assignedData] = await Promise.all([
          getPosCenter({ token: accessToken, hotelId }),
          getItemsByPosCenter({ token: accessToken, hotelId }),
        ]);

        setPosCenters(centers || []);

        const map: { [itemId: number]: number[] } = {};
        for (const entry of assignedData) {
          if (!map[entry.itemId]) map[entry.itemId] = [];
          map[entry.itemId].push(entry.hotelPosCenterId);
        }

        setAssigned(map);
      } catch {
        toast({ title: "Error", description: "Failed to load data" });
      }
    };

    fetchInitialData();
  }, [open]);

  const handleToggle = async (
    itemId: number,
    hotelPosCenterId: number,
    checked: boolean
  ) => {
    try {
      await createItemByPosCenter({
        token: accessToken,
        payload: {
          hotelId,
          itemId,
          hotelPosCenterId,
        },
      });

      setAssigned((prev) => {
        const current = prev[itemId] || [];
        const updated = checked
          ? [...current, hotelPosCenterId]
          : current.filter((id) => id !== hotelPosCenterId);
        return { ...prev, [itemId]: updated };
      });

      onMappingChanged?.();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update item assignment",
      });
    }
  };

  const groupedItems = items.reduce(
    (acc: { [category: number]: typeof items }, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {}
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-5xl bg-black text-white overflow-x-auto rounded-l-2xl"
      >
        <SheetHeader>
          <SheetTitle className="text-white text-lg">
            Attach Items to Outlets
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <table className="min-w-full border border-gray-700 text-sm">
            <thead className="bg-gray-800 text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-700 w-20">
                  Code
                </th>
                <th className="px-4 py-3 text-left border-r border-gray-700 w-64">
                  Item Name
                </th>
                {posCenters.map((center) => (
                  <th
                    key={center.hotelPosCenterId}
                    className="px-4 py-3 text-center border-r border-gray-700"
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
                    <tr className="bg-gray-700 text-white text-sm">
                      <td
                        colSpan={posCenters.length + 2}
                        className="px-4 py-2 font-bold uppercase tracking-wide text-white border-b border-gray-800 bg-gray-700"
                      >
                        {categories.find((cat) => cat.id === categoryId)
                          ?.name || `Category ${categoryId}`}
                      </td>
                    </tr>
                    {itemsInCategory.map((item) => (
                      <tr
                        key={item.id}
                        className="even:bg-gray-900 odd:bg-gray-800 border-t border-gray-700"
                      >
                        <td className="px-4 py-2">{item.id}</td>
                        <td className="px-4 py-2">{item.name}</td>
                        {posCenters.map((center) => (
                          <td
                            key={center.hotelPosCenterId}
                            className="text-center"
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
                              className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchPosTables } from "@/redux/slices/posTableSlice";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslatedText } from "@/lib/translation";

/* ----------------------------- Types ----------------------------- */

type TableItem = {
  id: string | number;
  name: string;
  qty: number;
  price: number; // unit price
};

interface Table {
  id: string; // "t{tableNo}" or "o-{tranMasId}" for virtual (non-dine-in)
  number: string; // tableNo or orderId display
  status: "available" | "occupied" | "reserved";
  seats: number;
  order?: {
    id: string; // "o{tableNo}" or "o-{tranMasId}"
    items: number;
    startTime: string;
    total: number;
    tranMasId?: number;
  };
  items?: TableItem[];
}

interface TableManagementProps {
  onStartOrder: (table: Table) => void; // kept for compatibility (unused here)
  onCollectPayment: (table: Table) => void;
}

/* --------------------------- Helpers --------------------------- */

const norm = (v: any) => String(v ?? "").trim();
const normLower = (v: any) => norm(v).toLowerCase();

const rawMethod = (e: any) =>
  norm(
    e.deliveryMethod ?? e.DeliveryMethod ?? e.method ?? e.Method ?? "UNKNOWN"
  );

const isDineInLabel = (m: string) => {
  const s = normLower(m).replaceAll("_", "-").replaceAll(" ", "-");
  return (
    s === "dine-in" || s === "dinein" || s === "restaurant" || s === "dine"
  );
};

// Map any backend label to one of three UI methods
type UIMethod = "DINE_IN" | "ROOM_SERVICE" | "TAKE_AWAY";
const classifyMethod = (m: string): UIMethod => {
  const s = normLower(m);
  if (isDineInLabel(m)) return "DINE_IN";
  if (s.includes("room")) return "ROOM_SERVICE"; // room, room-service, etc.
  // treat everything else (take away, pickup, delivery) as take away
  return "TAKE_AWAY";
};

const getStatusColor = (status: Table["status"]) => {
  switch (status) {
    case "available":
      return "ring-green-400";
    case "occupied":
      return "ring-red-400";
    case "reserved":
      return "ring-blue-400";
    default:
      return "ring-gray-300";
  }
};

const getStatusBadgeColor = (status: Table["status"]) => {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    case "occupied":
      return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    case "reserved":
      return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    default:
      return "";
  }
};

export function TableManagement({
  onStartOrder, // eslint-disable-line @typescript-eslint/no-unused-vars
  onCollectPayment,
}: TableManagementProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { tables: posTable, loading } = useSelector(
    (s: RootState) => s.posTable
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<UIMethod>("DINE_IN");

  // i18n
  const available = useTranslatedText("Available");
  const occupied = useTranslatedText("Occupied");
  const reserved = useTranslatedText("Reserved");
  const tableLbl = useTranslatedText("Table");
  const seats = useTranslatedText("Seats");
  const itemsLbl = useTranslatedText("Items");
  const since = useTranslatedText("Since");
  const total = useTranslatedText("Total");
  const collectPayment = useTranslatedText("Collect Payment");
  const orderLbl = useTranslatedText("Order");
  const methodLbl = useTranslatedText("Method");
  const dineInLbl = useTranslatedText("Dine-In");
  const roomServiceLbl = useTranslatedText("Room Service");
  const takeAwayLbl = useTranslatedText("Take Away");
  const startNewOrder = useTranslatedText("Start a New Order");

  useEffect(() => {
    // Only show pending (isFinished === false)
    dispatch(fetchPosTables({ isFinished: false }));
  }, [dispatch]);

  const getStatusText = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return available;
      case "occupied":
        return occupied;
      case "reserved":
        return reserved;
      default:
        return "";
    }
  };

  /* ---------------------- Partition by UI methods ---------------------- */

  // Keep only pending
  const pendingEntries = useMemo(
    () =>
      (posTable ?? []).filter(
        (e: any) =>
          (e.isFinished ??
            e.IsFinished ??
            e.finished ??
            e.Finished ??
            false) === false
      ),
    [posTable]
  );

  const dineInEntries = useMemo(
    () =>
      pendingEntries.filter((e) => classifyMethod(rawMethod(e)) === "DINE_IN"),
    [pendingEntries]
  );

  const roomServiceEntries = useMemo(
    () =>
      pendingEntries.filter(
        (e) => classifyMethod(rawMethod(e)) === "ROOM_SERVICE"
      ),
    [pendingEntries]
  );

  const takeAwayEntries = useMemo(
    () =>
      pendingEntries.filter(
        (e) => classifyMethod(rawMethod(e)) === "TAKE_AWAY"
      ),
    [pendingEntries]
  );

  /* ---------------------- Dine-In: group by table ---------------------- */

  const dineInTables: Table[] = useMemo(() => {
    const map: {
      [tableNo: string]: Table & { itemsMap: Record<string, TableItem> };
    } = {};

    (dineInEntries ?? []).forEach((entry: any) => {
      const tableNoRaw =
        entry.tableNo ??
        entry.TableNo ??
        entry.table_number ??
        entry.tableno ??
        entry.table ??
        "0";
      const tableNo = String(tableNoRaw);
      const tableId = `t${tableNo}`;

      const status: Table["status"] = "occupied"; // only pending shown

      if (!map[tableId]) {
        map[tableId] = {
          id: tableId,
          number: tableNo,
          status,
          seats: Number(entry.seats ?? entry.Seats ?? 4),
          itemsMap: {},
          order: {
            id: `o${tableNo}`,
            items: 0,
            startTime:
              (
                entry.startTimeStamp ??
                entry.StartTimeStamp ??
                entry.startedAt ??
                entry.startTime ??
                ""
              )?.slice(11, 16) || "",
            total: Number(entry.tranValue ?? entry.TranValue ?? 0),
            tranMasId:
              Number(
                entry.tranMasId ??
                  entry.tranMasID ??
                  entry.tranmasid ??
                  entry.TranMasId ??
                  entry.TranMasID
              ) || undefined,
          },
        };
      } else {
        map[tableId].order!.total += Number(
          entry.tranValue ?? entry.TranValue ?? 0
        );
        const t1 =
          (
            entry.startTimeStamp ??
            entry.StartTimeStamp ??
            entry.startedAt ??
            entry.startTime ??
            ""
          )?.slice(11, 16) || "";
        const t0 = map[tableId].order!.startTime || "99:99";
        if (t1 && (!t0 || t1 < t0)) map[tableId].order!.startTime = t1;
      }

      const backendItems: any[] = entry.items ?? entry.Items ?? [];
      for (const it of backendItems) {
        const rawId = it.itemId ?? it.itemID ?? it.id ?? it.itemCode;
        if (rawId == null) continue;

        const key = String(rawId);
        const name = it.itemDescription ?? it.itemName ?? it.name ?? key;
        const qty = Number(it.qty ?? it.Qty ?? 0);
        const unitPrice = Number(it.price ?? it.unitPrice ?? it.UnitPrice ?? 0);

        if (!map[tableId].itemsMap[key]) {
          map[tableId].itemsMap[key] = {
            id: rawId,
            name,
            qty,
            price: unitPrice,
          };
        } else {
          map[tableId].itemsMap[key].qty += qty;
        }
        map[tableId].order!.items += qty;
      }
    });

    return Object.values(map).map(({ itemsMap, ...rest }) => ({
      ...rest,
      items: Object.values(itemsMap),
    }));
  }, [dineInEntries]);

  /* ----------------- Non-dine-in: vertical cards ----------------- */

  type OrderCard = {
    idKey: string; // "o-{tranMasId}" or fallback
    displayId: string; // number or "—"
    method: string;
    category: UIMethod; // ROOM_SERVICE | TAKE_AWAY
    status: "available" | "occupied";
    startTime: string;
    total: number;
    itemsCount: number;
    items: TableItem[];
  };

  const buildCards = (entries: any[]): OrderCard[] =>
    entries.map((entry: any, idx: number) => {
      const methodRaw = rawMethod(entry);
      const category = classifyMethod(methodRaw);
      const status: "available" | "occupied" = "occupied";

      const tranMasId = Number(
        entry.tranMasId ??
          entry.tranMasID ??
          entry.tranmasid ??
          entry.TranMasId ??
          entry.TranMasID
      );
      const idKey = Number.isFinite(tranMasId) ? `o-${tranMasId}` : `o-${idx}`;

      const startTime =
        (
          entry.startTimeStamp ??
          entry.StartTimeStamp ??
          entry.startedAt ??
          entry.startTime ??
          ""
        )?.slice(11, 16) || "";

      const backendItems: any[] = entry.items ?? entry.Items ?? [];
      let itemsCount = 0;
      const items: TableItem[] = backendItems.map((it: any) => {
        const rawId =
          it.itemId ?? it.itemID ?? it.id ?? it.itemCode ?? `i-${idx}`;
        const name =
          it.itemDescription ?? it.itemName ?? it.name ?? String(rawId);
        const qty = Number(it.qty ?? it.Qty ?? 0);
        const unitPrice = Number(it.price ?? it.unitPrice ?? it.UnitPrice ?? 0);
        itemsCount += qty;
        return { id: rawId, name, qty, price: unitPrice };
      });

      const total = Number(entry.tranValue ?? entry.TranValue ?? 0);

      return {
        idKey,
        displayId: Number.isFinite(tranMasId) ? String(tranMasId) : "—",
        method: methodRaw,
        category,
        status,
        startTime,
        total,
        itemsCount,
        items,
      };
    });

  const roomServiceCards = useMemo(
    () => buildCards(roomServiceEntries),
    [roomServiceEntries]
  );
  const takeAwayCards = useMemo(
    () => buildCards(takeAwayEntries),
    [takeAwayEntries]
  );

  // Clear selection when switching tab
  useEffect(() => {
    setSelectedId(null);
  }, [activeMethod]);

  /* ------------------------------ Renderers ------------------------------ */

  const renderDineInGrid = (tables: Table[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 m-2">
      {tables.map((t) => (
        <div
          key={t.id}
          onClick={() => setSelectedId(t.id)}
          className={clsx(
            "relative h-auto min-h-[200px] w-full rounded-xl p-4 transition-transform duration-200 hover:scale-105 bg-white/30 dark:bg-white/10 backdrop-blur-md shadow-md cursor-pointer",
            selectedId === t.id && "ring-2 " + getStatusColor(t.status)
          )}
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-muted-foreground/40" />
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-muted-foreground/40" />

          <div className="flex justify-between items-center">
            <span className="font-medium">
              {tableLbl} {t.number}
            </span>
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded-full",
                getStatusBadgeColor(t.status)
              )}
            >
              {getStatusText(t.status)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {seats}: {t.seats}
          </div>

          {t.order && (
            <div className="mt-3 pt-2 border-t border-gray-300 dark:border-gray-700 text-xs">
              <div className="mb-2">
                <div className="flex justify-between">
                  <span>{itemsLbl}:</span>
                  <span>{t.order.items}</span>
                </div>
                <div className="flex justify-between">
                  <span>{since}:</span>
                  <span>{t.order.startTime}</span>
                </div>
              </div>

              {t.items && t.items.length > 0 && (
                <div className="max-h-24 overflow-y-auto overflow-x-hidden rounded border border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-white/10">
                  <table className="w-full text-xs table-fixed">
                    <thead className="sticky top-0 bg-gray-200 dark:bg-gray-700 text-left z-10">
                      <tr>
                        <th className="px-2 py-1 font-medium w-1/2">Item</th>
                        <th className="px-2 py-1 font-medium w-1/4 text-right">
                          Qty
                        </th>
                        <th className="px-2 py-1 font-medium w-1/4 text-right">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.items.map((i, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <td className="px-2 py-1 truncate">{i.name}</td>
                          <td className="px-2 py-1 text-right">{i.qty}</td>
                          <td className="px-2 py-1 text-right">
                            ${Number(i.price || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-2 border-t pt-1 border-gray-300 dark:border-gray-700 font-semibold flex justify-between text-sm">
                <span>{total}:</span>
                <span>${Number(t.order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      ))}
      {tables.length === 0 && (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground col-span-full">
          No pending orders.
        </div>
      )}
    </div>
  );

  const renderOrderList = (cards: OrderCard[]) => (
    <div className="flex flex-col gap-3 m-2">
      {cards.map((c) => (
        <div
          key={c.idKey}
          onClick={() => setSelectedId(c.idKey)}
          className={clsx(
            "w-full rounded-xl p-4 bg-white/30 dark:bg-white/10 backdrop-blur-md shadow-md cursor-pointer transition-transform duration-200 hover:scale-[1.01]",
            selectedId === c.idKey && "ring-2 " + getStatusColor(c.status)
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-medium">
                {orderLbl} #{c.displayId}
              </span>
              <span className="text-xs text-muted-foreground">
                {methodLbl}: {c.method}
              </span>
            </div>
            <span
              className={clsx(
                "text-xs px-2 py-0.5 rounded-full self-start",
                getStatusBadgeColor(c.status)
              )}
            >
              {getStatusText(c.status)}
            </span>
          </div>

          <div className="mt-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>{itemsLbl}:</span>
              <span>{c.itemsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>{since}:</span>
              <span>{c.startTime}</span>
            </div>
          </div>

          {c.items.length > 0 && (
            <div className="mt-2 max-h-28 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 bg-white/40 dark:bg-white/10">
              <ul className="text-xs">
                {c.items.map((i, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between px-2 py-1 border-t border-gray-200 dark:border-gray-700"
                  >
                    <span className="truncate mr-2">{i.name}</span>
                    <span className="shrink-0">
                      {i.qty} × ${Number(i.price || 0).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 border-t pt-1 border-gray-300 dark:border-gray-700 font-semibold flex justify-between text-sm">
            <span>{total}:</span>
            <span>${Number(c.total || 0).toFixed(2)}</span>
          </div>
        </div>
      ))}
      {cards.length === 0 && (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          No pending orders.
        </div>
      )}
    </div>
  );

  /* --------------------------------- UI -------------------------------- */

  // Only 3 tabs, equal width
  return (
    <div className="flex flex-col gap-6 py-6 h-full">
      {/* Legend */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">{available}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">{occupied}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm">{reserved}</span>
          </div>
        </div>
      </div>

      <Tabs
        value={activeMethod}
        onValueChange={(v) => setActiveMethod(v as UIMethod)}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="DINE_IN" className="w-full">
            {dineInLbl}
          </TabsTrigger>
          <TabsTrigger value="ROOM_SERVICE" className="w-full">
            {roomServiceLbl}
          </TabsTrigger>
          <TabsTrigger value="TAKE_AWAY" className="w-full">
            {takeAwayLbl}
          </TabsTrigger>
        </TabsList>

        {/* Dine-In */}
        <TabsContent
          value="DINE_IN"
          className="flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              renderDineInGrid(dineInTables)
            )}
          </div>
        </TabsContent>

        {/* Room Service */}
        <TabsContent
          value="ROOM_SERVICE"
          className="flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              renderOrderList(roomServiceCards)
            )}
          </div>
        </TabsContent>

        {/* Take Away */}
        <TabsContent
          value="TAKE_AWAY"
          className="flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Loading…
              </div>
            ) : (
              renderOrderList(takeAwayCards)
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer actions — only for Dine-In */}
      <SheetFooter className="flex-col gap-2 sm:flex-col mb-6">
        {(() => {
          if (activeMethod !== "DINE_IN") return null;
          if (!selectedId?.startsWith("t")) return null;

          const sel = dineInTables.find((t) => t.id === selectedId);
          if (!sel) return null;

          if (sel.status === "occupied") {
            return (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button variant="outline" onClick={() => onStartOrder(sel)}>
                  {startNewOrder}
                </Button>
                <Button onClick={() => onCollectPayment(sel)}>
                  {collectPayment}
                </Button>
              </div>
            );
          }

          if (sel.status === "available") {
            return (
              <Button className="w-full" onClick={() => onStartOrder(sel)}>
                {startNewOrder}
              </Button>
            );
          }

          return null;
        })()}
      </SheetFooter>
    </div>
  );
}

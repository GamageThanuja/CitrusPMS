"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import clsx from "clsx";
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchPosTables } from "@/redux/slices/posTableSlice";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslatedText } from "@/lib/translation";
import {
  CreditCard,
  Printer,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";

/* ----------------------------- Types ----------------------------- */

type TableItem = {
  id: string | number;
  name: string;
  qty: number;
  price: number; // unit price
  code?: string;
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
  onStartOrder: (table: Table) => void; // kept for compatibility
  onCollectPayment: (table: Table) => void;
  posCenterName?: string;
  selectedPosCenterId?: number | null;
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
type UIMethod = "DINE_IN" | "ROOM_SERVICE" | "TAKE_AWAY" | "OTHER";
const classifyMethod = (m: string): UIMethod => {
  const s = normLower(m);
  if (isDineInLabel(m)) return "DINE_IN";
  if (s.includes("room")) return "ROOM_SERVICE"; // room, room-service, etc.
  // Only classify as TAKE_AWAY if it's explicitly "take away" or "takeaway"
  if (s === "takeaway" || s === "take away" || s === "take-away") {
    return "TAKE_AWAY";
  }
  // Everything else (delivery, pickup, etc.) goes to "OTHER" which won't show in any tab
  return "OTHER";
};

// High-level status (sub-tabs)
type StatusTab = "ACTIVE" | "FINISHED" | "VOID";

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

/* --------------- Non-dine-in cards (Room/TakeAway) --------------- */

type OrderCard = {
  idKey: string; // "o-{tranMasId}" or fallback
  displayId: string; // number or "—"
  tranMasId?: number;
  method: string;
  category: UIMethod; // ROOM_SERVICE | TAKE_AWAY
  status: "available" | "occupied";
  startTime: string;
  total: number;
  itemsCount: number;
  items: TableItem[];
};

const buildDineInTables = (entries: any[]): Table[] => {
  const map: {
    [tableNo: string]: Table & { itemsMap: Record<string, TableItem> };
  } = {};

  (entries ?? []).forEach((entry: any) => {
    const tableNoRaw =
      entry.tableNo ??
      entry.TableNo ??
      entry.table_number ??
      entry.tableno ??
      entry.table ??
      "0";
    const tableNo = String(tableNoRaw);
    const tableId = `t${tableNo}`;

    const status: Table["status"] = "occupied"; // only orders

    const startTimeStr =
      (
        entry.startTimeStamp ??
        entry.StartTimeStamp ??
        entry.startedAt ??
        entry.startTime ??
        ""
      )?.slice(11, 16) || "";

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
          startTime: startTimeStr,
          total: 0, // 🔹 start from 0 – we'll build from items only
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
      // 🔹 Only adjust earliest start time – no more total += tranValue
      const t1 = startTimeStr;
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
      const code = it.itemCode ?? it.item_code ?? key; // 🔹 itemCode if present

      if (!map[tableId].itemsMap[key]) {
        map[tableId].itemsMap[key] = {
          id: rawId,
          name,
          qty,
          price: unitPrice,
          code,
        };
      } else {
        map[tableId].itemsMap[key].qty += qty;
      }

      // 🔹 Count items & total ONLY from item currency
      map[tableId].order!.items += qty;
      map[tableId].order!.total += qty * unitPrice;
    }
  });

  return Object.values(map).map(({ itemsMap, ...rest }) => ({
    ...rest,
    items: Object.values(itemsMap),
  }));
};

const buildOrderCards = (entries: any[]): OrderCard[] =>
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
    let total = 0; // 🔹 build from item price * qty

    const items: TableItem[] = backendItems.map((it: any) => {
      const rawId =
        it.itemId ?? it.itemID ?? it.id ?? it.itemCode ?? `i-${idx}`;
      const name =
        it.itemDescription ?? it.itemName ?? it.name ?? String(rawId);
      const qty = Number(it.qty ?? it.Qty ?? 0);
      const unitPrice = Number(it.price ?? it.unitPrice ?? it.UnitPrice ?? 0);
      const code = it.itemCode ?? it.item_code ?? rawId; // 🔹 itemCode

      itemsCount += qty;
      total += qty * unitPrice; // 🔹 sum in item currency

      return { id: rawId, name, qty, price: unitPrice, code };
    });

    return {
      idKey,
      displayId: Number.isFinite(tranMasId) ? String(tranMasId) : "—",
      tranMasId: Number.isFinite(tranMasId) ? tranMasId : undefined,
      method: methodRaw,
      category,
      status,
      startTime,
      total, // 🔹 now matches items[]
      itemsCount,
      items,
    };
  });

/* -------------------------- Component -------------------------- */

export function TableManagement({
  onStartOrder,
  onCollectPayment, // still used for Dine-In
  posCenterName,
  selectedPosCenterId,
}: TableManagementProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { tables: posTable, loading } = useSelector(
    (s: RootState) => s.posTable
  );


  console.log("onStartOrder : ", onStartOrder);
  

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<UIMethod>("DINE_IN");
  const { fullName } = useUserFromLocalStorage();

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
  const printBillLbl = useTranslatedText("Print Bill");
  const activeLbl = useTranslatedText("Active");
  const finishedLbl = useTranslatedText("Finished");
  const voidLbl = useTranslatedText("Void");
  const cashierLbl = useTranslatedText("Cashier");

  // ⬇️ KOT reprint drawer state
  const [isKotDrawerOpen, setIsKotDrawerOpen] = useState(false);
  const [kotTableNo, setKotTableNo] = useState<string | null>(null);

  const reprintKotLbl = useTranslatedText("Reprint KOT");
  const kotTicketsLbl = useTranslatedText("KOT Tickets");
  const kotNoLbl = useTranslatedText("KOT No.");
  const timeLbl = useTranslatedText("Time");
  const printKotLbl = useTranslatedText("Print KOT");

  useEffect(() => {
    // Load all orders (Active / Finished / Void) for selected POS center
    dispatch(fetchPosTables({ hotelPosCenterId: selectedPosCenterId ?? null } as any));
  }, [dispatch, selectedPosCenterId]);

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

  // Helpers to read finished / finAct flags from any backend casing
  const getIsFinished = (e: any): boolean => {
    const raw =
      e.isFinished ??
      e.IsFinished ??
      e.finished ??
      e.Finished ??
      e.isFinish ??
      e.IsFinish ??
      false;
    return Boolean(raw);
  };

  const getFinAct = (e: any): boolean => {
    const raw = e.finAct ?? e.FinAct ?? e.finact ?? e.FINACT ?? false;
    return Boolean(raw);
  };

  const getStatusTabMeta = (tab: StatusTab) => {
    switch (tab) {
      case "ACTIVE":
        return {
          ring: "ring-yellow-400",
          badge:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
          text: activeLbl,
        };
      case "FINISHED":
        return {
          ring: "ring-green-400",
          badge:
            "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
          text: finishedLbl,
        };
      case "VOID":
        return {
          ring: "ring-red-400",
          badge: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
          text: voidLbl,
        };
      default:
        return {
          ring: "ring-gray-300",
          badge:
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
          text: "",
        };
    }
  };

  // ACTIVE: isFinish = false & finAct = false
  // FINISHED: isFinish = true & finAct = false
  // VOID: finAct = true (ignore isFinish)
  const classifyStatus = (e: any): StatusTab => {
    const finAct = getFinAct(e);
    const finished = getIsFinished(e);
    if (finAct) return "VOID";
    if (finished) return "FINISHED";
    return "ACTIVE";
  };

  const handleOpenKotReprint = (table: Table) => {
    setKotTableNo(table.number);
    setIsKotDrawerOpen(true);

    // Load only unfinished KOT for that table and selected POS center
    dispatch(
      fetchPosTables({
        tableNo: table.number,
        isFinished: false,
        hotelPosCenterId: selectedPosCenterId ?? null,
      } as any)
    );
  };

  const handlePrintKOT = (entry: any) => {
    if (typeof window === "undefined") return;

    let hotelName = "Hotel";
    try {
      const stored = window.localStorage.getItem("selectedProperty");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) hotelName = parsed.name;
      }
    } catch {
      // ignore
    }

    const tableNo =
      entry.tableNo ??
      entry.TableNo ??
      entry.table_number ??
      entry.tableno ??
      entry.table ??
      "-";

    const ticketNo =
      entry.docNo ??
      entry.DocNo ??
      entry.tranMasId ??
      entry.TranMasId ??
      entry.tranMasID ??
      "—";

    const dateStr = new Date().toLocaleString();

    const backendItems: any[] = entry.items ?? entry.Items ?? [];
    const itemsRows =
      backendItems.length > 0
        ? backendItems
            .map((it: any) => {
              const name =
                it.itemDescription ?? it.itemName ?? it.name ?? "Item";
              const qty = Number(it.qty ?? it.Qty ?? 0);
              const code =
                it.itemCode ?? it.item_code ?? it.code ?? it.id ?? "";

              const remarks = it.remarks ?? it.Remarks ?? "";

              return `
              <tr>
                <td class="code">${code || ""}</td>
                <td class="name">${name}</td>
                <td class="qty">${qty}</td>
              </tr>
              ${
                remarks
                  ? `<tr><td></td><td class="remarks" colspan="2">* ${remarks}</td></tr>`
                  : ""
              }
            `;
            })
            .join("")
        : `<tr><td colspan="3" class="muted center">No items</td></tr>`;

    const html = `
<!doctype html>
<html>
  <head>
    <meta charSet="utf-8" />
    <title>KOT - Table ${tableNo}</title>
    <style>
      @page {
        size: 80mm auto;
        margin: 0;
      }
      * { box-sizing: border-box; }
      body {
        width: 80mm;
        margin: 0;
        padding: 4mm 3mm;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 11px;
        color: #000;
      }
      .center { text-align: center; }
      .hotel-name {
        font-weight: 700;
        font-size: 14px;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      .ticket-title {
        font-weight: 700;
        font-size: 13px;
        margin-top: 1mm;
      }
      .muted {
        font-size: 10px;
        opacity: 0.75;
      }
      .reprint-badge {
        font-weight: 700;
        font-size: 11px;
        margin-top: 1mm;
        text-transform: uppercase;
      }
      .header-sub {
        font-size: 10px;
        opacity: 0.85;
      }
      .section-divider {
        border-top: 1px dashed #000;
        margin: 4mm 0 2mm;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2mm;
      }
      td {
        padding: 2px 0;
        vertical-align: top;
      }
      .code {
        width: 15mm;
        font-size: 10px;
        padding-right: 2mm;
        word-break: break-all;
      }
      .name {
        font-size: 12px;
        font-weight: 600;
      }
      .qty {
        width: 10mm;
        font-weight: 700;
        text-align: right;
      }
      .remarks {
        font-size: 10px;
        padding-left: 2mm;
      }
      .footer {
        margin-top: 4mm;
      }
    </style>
  </head>
  <body>
    <div class="center">
      <div class="hotel-name">${hotelName}</div>
      ${posCenterName ? `<div class="header-sub">${posCenterName}</div>` : ""}
      <div class="ticket-title">KITCHEN ORDER TICKET</div>
      <div class="reprint-badge">RE-PRINT</div>
    </div>

    <div class="section-divider"></div>

    <div>
      <div class="muted">Table: ${tableNo}</div>
      <div class="muted">KOT No: ${ticketNo}</div>
      <div class="muted">POS Center: ${posCenterName || "-"}</div>
      <div class="muted">${cashierLbl}: ${fullName || "-"}</div>
      <div class="muted">Time: ${dateStr}</div>
    </div>

    <table>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="footer muted center">
      Printed by HotelMate POS
    </div>
  </body>
</html>
  `;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the KOT ticket.");
      return;
    }

    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for the document to fully load before printing
      const triggerPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
          // Close window after print dialog is dismissed (user cancels or prints)
          // Use a longer timeout to allow user to interact with print dialog
          setTimeout(() => {
            if (printWindow && !printWindow.closed) {
              printWindow.close();
            }
          }, 1000);
        } catch (err) {
          console.error("Print error:", err);
          alert("Failed to open print dialog. Please try again.");
        }
      };

      // Wait for document to be ready
      if (printWindow.document.readyState === "complete") {
        // Document already loaded, trigger print after small delay
        setTimeout(triggerPrint, 250);
      } else {
        // Wait for load event
        printWindow.onload = () => {
          setTimeout(triggerPrint, 250);
        };
        // Fallback timeout in case onload doesn't fire
        setTimeout(() => {
          if (printWindow && !printWindow.closed && printWindow.document.readyState === "complete") {
            triggerPrint();
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Error opening print window:", err);
      alert("Failed to open print window. Please check your popup blocker settings.");
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
    }
  };

  // KOT orders for currently selected table in drawer
  const kotOrders = (posTable ?? []).filter((e: any) => {
    if (!kotTableNo) return false;
    const tableNoRaw =
      e.tableNo ?? e.TableNo ?? e.table_number ?? e.tableno ?? e.table ?? "0";
    return String(tableNoRaw) === String(kotTableNo) && !getIsFinished(e);
  });

  // When closing KOT drawer, reload all tables again for selected POS center
  useEffect(() => {
    if (!isKotDrawerOpen && kotTableNo) {
      dispatch(fetchPosTables({ hotelPosCenterId: selectedPosCenterId ?? null } as any));
      setKotTableNo(null);
    }
  }, [isKotDrawerOpen, kotTableNo, dispatch, selectedPosCenterId]);

  const handlePrintBill = (table: Table) => {
    if (typeof window === "undefined") return;

    let hotelName = "Hotel";
    let hotelCurrency = "";
    let hotelCode: number | string | undefined;

    try {
      const stored = window.localStorage.getItem("selectedProperty");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) hotelName = parsed.name;
        if (parsed?.hotelCurrency) hotelCurrency = parsed.hotelCurrency;
        if (parsed?.hotelCode) hotelCode = parsed.hotelCode;
      }
    } catch {
      // ignore parsing errors
    }

    const items = table.items ?? [];
    const subtotal = items.reduce(
      (sum, it) => sum + (it.qty || 0) * (it.price || 0),
      0
    );

    const dateStr = new Date().toLocaleString();

    const rowsHtml =
      items.length > 0
        ? items
            .map((it) => {
              const qty = it.qty || 0;
              const price = it.price || 0;
              const lineTotal = qty * price;
              const code = (it as any).code || it.id || "";

              return `
              <tr class="item-row">
                <td class="item-name">
                  ${it.name || ""}
                  <div class="item-meta muted">
                    ${code ? `Code: ${code} • ` : ""}${qty} 
                  </div>
                </td>
                <td class="qty">${qty}</td>
              </tr>
            `;
            })
            .join("")
        : `<tr><td colspan="3" class="muted center">No items</td></tr>`;

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Bill - Table ${table.number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            width: 80mm;
            margin: 0;
            padding: 4mm 3mm;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 11px;
            color: #000;
          }

          .center { text-align: center; }

          .hotel-name {
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }

          .header-sub {
            font-size: 10px;
            opacity: 0.85;
          }

          .section-divider {
            border-top: 1px dashed #000;
            margin: 4mm 0 2mm;
          }

          .muted {
            font-size: 10px;
            opacity: 0.75;
          }

          .title {
            font-weight: 600;
            font-size: 12px;
            margin-top: 2mm;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2mm;
          }

          td {
            padding: 2px 0;
            vertical-align: top;
            word-break: break-word;
          }

          .item-name {
            width: 60%;
          }

          .item-meta {
            margin-top: 1px;
          }

          .qty {
            width: 8mm;
            text-align: right;
            white-space: nowrap;
          }

          .amount {
            width: 18mm;
            text-align: right;
            white-space: nowrap;
          }

          .totals {
            margin-top: 3mm;
            border-top: 1px dashed #000;
            padding-top: 2mm;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
          }

          .total-label {
            font-weight: 600;
          }

          .total-amount {
            font-weight: 700;
            font-size: 12px;
          }

          .footer {
            margin-top: 5mm;
          }

          .footer-note {
            margin-top: 1mm;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="hotel-name">${hotelName}</div>
          ${
            hotelCode
              ? `<div class="header-sub muted">Hotel Code: ${hotelCode}</div>`
              : ""
          }
          ${
            posCenterName
              ? `<div class="header-sub">${posCenterName}</div>`
              : ""
          }
          <div class="reprint-badge">RE-PRINT</div>
          <div class="header-sub">Restaurant Bill</div>
        </div>

        <div class="section-divider"></div>

        <div>
          <div class="muted">Date &amp; Time: ${dateStr}</div>
          <div class="muted">${tableLbl} ${table.number}</div>
          ${
            table.order?.id
              ? `<div class="muted">${orderLbl}: ${table.order.id}</div>`
              : ""
          }
          <div class="muted">${cashierLbl}: ${fullName || "-"}</div>
        </div>

        <div class="title">Items</div>
        <table>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer center">
          <div class="muted">Thank you &amp; come again!</div>
          <div class="footer-note muted">Powered by HotelMate</div>
        </div>
      </body>
    </html>
  `;

    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) {
      alert("Please allow popups to print the bill.");
      return;
    }

    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for the document to fully load before printing
      const triggerPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
          // Close window after print dialog is dismissed (user cancels or prints)
          // Use a longer timeout to allow user to interact with print dialog
          setTimeout(() => {
            if (printWindow && !printWindow.closed) {
              printWindow.close();
            }
          }, 1000);
        } catch (err) {
          console.error("Print error:", err);
          alert("Failed to open print dialog. Please try again.");
        }
      };

      // Wait for document to be ready
      if (printWindow.document.readyState === "complete") {
        // Document already loaded, trigger print after small delay
        setTimeout(triggerPrint, 250);
      } else {
        // Wait for load event
        printWindow.onload = () => {
          setTimeout(triggerPrint, 250);
        };
        // Fallback timeout in case onload doesn't fire
        setTimeout(() => {
          if (printWindow && !printWindow.closed && printWindow.document.readyState === "complete") {
            triggerPrint();
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Error opening print window:", err);
      alert("Failed to open print window. Please check your popup blocker settings.");
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
    }
  };

  /* ----------------- Build data for each main/sub tab ----------------- */

  const dineInActiveTables = buildDineInTables(
    (posTable ?? []).filter(
      (e: any) =>
        classifyMethod(rawMethod(e)) === "DINE_IN" &&
        classifyStatus(e) === "ACTIVE"
    )
  );
  const dineInFinishedTables = buildDineInTables(
    (posTable ?? []).filter(
      (e: any) =>
        classifyMethod(rawMethod(e)) === "DINE_IN" &&
        classifyStatus(e) === "FINISHED"
    )
  );
  const dineInVoidTables = buildDineInTables(
    (posTable ?? []).filter(
      (e: any) =>
        classifyMethod(rawMethod(e)) === "DINE_IN" &&
        classifyStatus(e) === "VOID"
    )
  );

  // ❌ No more ACTIVE usage for Room Service / Take Away
  const roomServiceFinishedCards = buildOrderCards(
    (posTable ?? []).filter(
      (e: any) =>
        classifyMethod(rawMethod(e)) === "ROOM_SERVICE" &&
        classifyStatus(e) === "FINISHED"
    )
  );
  const roomServiceVoidCards = buildOrderCards(
    (posTable ?? []).filter(
      (e: any) =>
        classifyMethod(rawMethod(e)) === "ROOM_SERVICE" &&
        classifyStatus(e) === "VOID"
    )
  );

  // ✅ Only show orders with "take away" delivery method in Take Away tab
  const takeAwayFinishedCards = buildOrderCards(
    (posTable ?? []).filter((e: any) => {
      const method = rawMethod(e);
      const methodLower = normLower(method);
      const isTakeAway = 
        methodLower === "takeaway" || 
        methodLower === "take away" || 
        methodLower === "take-away";
      return isTakeAway && classifyStatus(e) === "FINISHED";
    })
  );
  const takeAwayVoidCards = buildOrderCards(
    (posTable ?? []).filter((e: any) => {
      const method = rawMethod(e);
      const methodLower = normLower(method);
      const isTakeAway = 
        methodLower === "takeaway" || 
        methodLower === "take away" || 
        methodLower === "take-away";
      return isTakeAway && classifyStatus(e) === "VOID";
    })
  );

  // Clear selection when switching main tab
  useEffect(() => {
    setSelectedId(null);
  }, [activeMethod]);

  /* ------------------------------ Renderers ------------------------------ */

  const renderDineInGrid = (tables: Table[], statusTab: StatusTab) => {
    const meta = getStatusTabMeta(statusTab);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 m-2">
        {tables.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={clsx(
              "relative h-auto min-h-[200px] w-full rounded-xl p-4 transition-transform duration-200 hover:scale-105 bg-white/30 dark:bg-white/10 backdrop-blur-md shadow-md cursor-pointer",
              selectedId === t.id && "ring-2 " + meta.ring
            )}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-muted-foreground/40" />
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-muted-foreground/40" />

            <div className="flex justify-between items-center">
              <span className="font-medium">
                {tableLbl} {t.number}
              </span>
              <span
                className={clsx("text-xs px-2 py-0.5 rounded-full", meta.badge)}
              >
                {meta.text}
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
                              {Number(i.price || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-2 border-t pt-1 border-gray-300 dark:border-gray-700 font-semibold flex justify-between text-sm">
                  <span>{total}:</span>
                  <span>{Number(t.order.total || 0).toFixed(2)}</span>
                </div>

                {/* 🔹 Icon actions for Dine-In */}
                <div className="mt-2 flex justify-end gap-2">
                  {/* Start New Order */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartOrder(t);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="sr-only">{startNewOrder}</span>
                  </Button>

                  {/* Collect Payment */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCollectPayment(t);
                    }}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="sr-only">{collectPayment}</span>
                  </Button>

                  {/* Print Bill */}
                  {/* <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintBill(t);
                    }}
                  >
                    <Printer className="w-4 h-4" />
                    <span className="sr-only">{printBillLbl}</span>
                  </Button> */}

                  {/* Reprint KOT */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenKotReprint(t);
                    }}
                  >
                    <Printer className="w-4 h-4" />
                    <span className="sr-only">{reprintKotLbl}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {tables.length === 0 && (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground col-span-full">
            No orders.
          </div>
        )}
      </div>
    );
  };

  // 🔹 Used by Room Service & Take Away
  //   → NO payment button, ONLY print
  // 🔹 Used by Room Service & Take Away
  //   → NO payment button, ONLY print
  const renderOrderList = (cards: OrderCard[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 m-2">
      {cards.map((c) => (
        <div
          key={c.idKey}
          onClick={() => setSelectedId(c.idKey)}
          className={clsx(
            "relative h-auto min-h-[200px] w-full rounded-xl p-4 bg-white/30 dark:bg-white/10 backdrop-blur-md shadow-md cursor-pointer transition-transform duration-200 hover:scale-[1.01]",
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
                      {i.qty} × {Number(i.price || 0).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 border-t pt-1 border-gray-300 dark:border-gray-700 font-semibold flex justify-between text-sm">
            <span>{total}:</span>
            <span>{Number(c.total || 0).toFixed(2)}</span>
          </div>

          {/* 🔹 ONLY Print option here */}
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                const tableLike: Table = {
                  id: c.idKey,
                  number: c.displayId !== "—" ? c.displayId : c.idKey,
                  status: c.status,
                  seats: 0,
                  order: {
                    id: c.idKey,
                    items: c.itemsCount,
                    startTime: c.startTime,
                    total: c.total,
                    tranMasId: c.tranMasId,
                  },
                  items: c.items,
                };
                handlePrintBill(tableLike);
              }}
            >
              <Printer className="w-4 h-4" />
              <span className="sr-only">{printBillLbl}</span>
            </Button>
          </div>
        </div>
      ))}

      {cards.length === 0 && (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground col-span-full">
          No orders.
        </div>
      )}
    </div>
  );

  /* --------------------------------- UI -------------------------------- */

  return (
    <>
      <div className="flex flex-col gap-6 py-6 h-full min-h-0">
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

        {/* Main tabs: Dine-In / Room Service / Take Away */}
        <Tabs
          value={activeMethod}
          onValueChange={(v) => setActiveMethod(v as UIMethod)}
          className="flex-1 flex min-h-0 flex-col overflow-hidden"
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
            className="flex-1 flex min-h-0 data-[state=inactive]:hidden"
          >
            {/* Sub-tabs: Active / Finished / Void */}
            <Tabs
              defaultValue="ACTIVE"
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="mb-3 inline-flex items-center gap-1 rounded-full bg-muted/60 dark:bg-muted/40 px-1.5 py-1 shadow-sm justify-start">
                <TabsTrigger
                  value="ACTIVE"
                  className="px-4 py-1.5 text-sm rounded-full text-muted-foreground transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:scale-[1.02]"
                >
                  {activeLbl}
                </TabsTrigger>
                <TabsTrigger
                  value="FINISHED"
                  className="px-4 py-1.5 text-sm rounded-full text-muted-foreground transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:scale-[1.02]"
                >
                  {finishedLbl}
                </TabsTrigger>
                <TabsTrigger
                  value="VOID"
                  className="px-4 py-1.5 text-sm rounded-full text-muted-foreground transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:scale-[1.02]"
                >
                  {voidLbl}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="ACTIVE"
                className="flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  renderDineInGrid(dineInActiveTables, "ACTIVE")
                )}
              </TabsContent>

              <TabsContent
                value="FINISHED"
                className="flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  renderDineInGrid(dineInFinishedTables, "FINISHED")
                )}
              </TabsContent>

              <TabsContent
                value="VOID"
                className="flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  renderDineInGrid(dineInVoidTables, "VOID")
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Room Service */}
          <TabsContent
            value="ROOM_SERVICE"
            className="flex-1 flex min-h-0 data-[state=inactive]:hidden"
          >
            <Tabs
              defaultValue="FINISHED"
              className="flex-1 flex min-h-0 flex-col"
            >
              <TabsList className="mb-3 inline-flex items-center gap-1 rounded-full bg-muted/60 dark:bg-muted/40 px-1.5 py-1 shadow-sm justify-start">
                {/* ❌ NO ACTIVE TAB HERE */}
                <TabsTrigger
                  value="FINISHED"
                  className="px-4 py-1.5 text-sm rounded-full text-muted-foreground transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:scale-[1.02]"
                >
                  {finishedLbl}
                </TabsTrigger>
                <TabsTrigger
                  value="VOID"
                  className="px-4 py-1.5 text-sm rounded-full text-muted-foreground transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:scale-[1.02]"
                >
                  {voidLbl}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="FINISHED"
                className="flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  renderOrderList(roomServiceFinishedCards)
                )}
              </TabsContent>

              <TabsContent
                value="VOID"
                className="flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  renderOrderList(roomServiceVoidCards)
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Take Away */}
          <TabsContent
            value="TAKE_AWAY"
            className="flex-1 flex min-h-0 data-[state=inactive]:hidden"
          >
            <Tabs defaultValue="FINISHED" className="flex-1 flex flex-col">
              <TabsList className="mb-3 inline-flex items-center gap-1 rounded-full bg-muted/60 dark:bg-muted/40 px-1.5 py-1 shadow-sm justify-start">
                {/* ❌ NO ACTIVE TAB HERE */}
                <TabsTrigger
                  value="FINISHED"
                  className="px-4 py-1.5 text-sm rounded-full text-muted-foreground transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:scale-[1.02]"
                >
                  {finishedLbl}
                </TabsTrigger>
                <TabsTrigger
                  value="VOID"
                  className="px-4 py-1.5 text-sm rounded-full text-muted-foreground transition-all duration-150 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:scale-[1.02]"
                >
                  {voidLbl}
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="FINISHED"
                className="flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  renderOrderList(takeAwayFinishedCards)
                )}
              </TabsContent>

              <TabsContent
                value="VOID"
                className="flex-1 min-h-0 overflow-y-auto data-[state=inactive]:hidden"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    Loading…
                  </div>
                ) : (
                  renderOrderList(takeAwayVoidCards)
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* KOT Reprint Sheet */}
      <Sheet open={isKotDrawerOpen} onOpenChange={setIsKotDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {kotTicketsLbl} {kotTableNo ? `- ${tableLbl} ${kotTableNo}` : ""}
            </SheetTitle>
            <SheetDescription>{reprintKotLbl}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3 max-h-[80vh] overflow-y-auto">
            {loading && (
              <div className="text-sm text-muted-foreground py-4">
                Loading...
              </div>
            )}

            {!loading && kotOrders.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">
                No KOT tickets for this table.
              </div>
            )}

            {!loading &&
              kotOrders.map((o: any, idx: number) => {
                const ticketNo =
                  o.docNo ??
                  o.DocNo ??
                  o.tranMasId ??
                  o.TranMasId ??
                  o.tranMasID ??
                  "—";
                const createdAt =
                  (
                    o.startTimeStamp ??
                    o.StartTimeStamp ??
                    o.createdOn ??
                    o.CreatedOn ??
                    ""
                  ).slice(11, 16) || "";

                const items = o.items ?? o.Items ?? [];

                return (
                  <div
                    key={o.tranMasId ?? idx}
                    className="rounded-lg border border-border p-3 flex flex-col gap-2 bg-background/40"
                  >
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <div className="font-medium">
                          {kotNoLbl}: {ticketNo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {timeLbl}: {createdAt || "-"}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintKOT(o)}
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        {printKotLbl}
                      </Button>
                    </div>

                    {items && items.length > 0 && (
                      <div className="border-t border-dashed pt-2 mt-1">
                        <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                          {items.map((it: any, idx2: number) => {
                            const name =
                              it.itemDescription ??
                              it.itemName ??
                              it.name ??
                              "Item";
                            const qty = Number(it.qty ?? it.Qty ?? 0);
                            const code =
                              it.itemCode ??
                              it.item_code ??
                              it.code ??
                              it.id ??
                              "";

                            return (
                              <li
                                key={idx2}
                                className="flex justify-between gap-2"
                              >
                                <span className="truncate">
                                  {code ? `${code} - ${name}` : name}
                                </span>
                                <span className="shrink-0">× {qty}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

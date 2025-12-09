"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SheetFooter } from "@/components/ui/sheet";
import { Home, Package, Truck, UtensilsCrossed } from "lucide-react";
import { useTranslatedText } from "@/lib/translation";
import { AppDispatch, RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { createPosOrder } from "@/redux/slices/createPosOrderSlice";
import { clearCart } from "@/redux/slices/cartSlice";
import { toast } from "../ui/use-toast";
import { Alert } from "../ui/alert";
import { fetchReservationList } from "@/redux/slices/reservationListSlice";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { fetchNameMas } from "@/redux/slices/fetchNameMasSlice";
import { useAppSelector } from "@/redux/hooks";
import { fetchSystemDate } from "@/redux/slices/systemDateSlice";

type DeliveryMethod = "dineIn" | "takeaway" | "roomService" | "deliveryService";

interface DeliveryMethodSelectionProps {
  onComplete: (method: string, formData: Record<string, string>) => void;
  selectedPosCenterId: string;
  selectedPosCenterName: string;
  initialMethod?: string;
  initialDetails?: Record<string, string>;
  selectedOutletCurrency?: string;
}

export function DeliveryMethodSelection({
  onComplete,
  selectedPosCenterId,
  selectedPosCenterName,
  initialMethod,
  initialDetails,
  selectedOutletCurrency,
}: DeliveryMethodSelectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod | null>(
    null
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { tables: posTable } = useSelector(
    (state: RootState) => state.posTable
  );

  console.log("posTable 1 : ", formData);
  console.log("pos delevery currency selection: ", selectedOutletCurrency);

  const dineIn = useTranslatedText("Dine In");
  const takeaway = useTranslatedText("Takeaway");
  const roomService = useTranslatedText("Room Service");
  const deliveryService = useTranslatedText("Delivery Service");
  const roomNo = useTranslatedText("Room No");
  const tableNo = useTranslatedText("Table No");
  const noOfPax = useTranslatedText("No. of Pax");
  const phoneNumber = useTranslatedText("Phone Number");
  const customerName = useTranslatedText("Customer Name");
  const customerAddress = useTranslatedText("Customer Address");
  const continueText = useTranslatedText("Continue");
  const [submitted, setSubmitted] = useState(false);
  const [isRunningTableSelected, setIsRunningTableSelected] = useState(false);
  const { fullName } = useUserFromLocalStorage();

  const systemDate = useAppSelector(
    (state: RootState) => state.systemDate.value
  );


  const dispatch = useDispatch<AppDispatch>();

  const { data: reservations, loading: roomsLoading } = useSelector(
    (state: RootState) => state.reservationList
  );

  console.log("reservations : ", reservations);

  useEffect(() => {
    dispatch(fetchSystemDate());
  }, [dispatch]);

  console.log("systemDate : ", systemDate);

useEffect(() => {
  dispatch(fetchNameMas({})); // or e.g. { nameType: "GUEST" } if you need
}, [dispatch]);

  useEffect(() => {
    if (selectedMethod === "roomService") {
      dispatch(fetchReservationList({ reservationStatusId: 4 }));
    }
  }, [dispatch, selectedMethod]);

  const cart = useSelector((state: RootState) => state.cart.items); // Adjust based on your slice structure
  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // --- 80mm receipt popup helper ---
  const open80mmReceipt = (
    orderResult: any,
    payload: any,
    cartSnapshot: any[]
  ) => {
    if (typeof window === "undefined") return;

    const property = JSON.parse(
      localStorage.getItem("selectedProperty") || "{}"
    );

    const hotelName =
      property.hotelName ||
      property.propertyName ||
      property.hotel ||
      property.name ||
      payload.hotelCode ||
      "Hotel";

    const outletName = selectedPosCenterName || payload.posCenter || "Outlet";

    const orderNo =
      orderResult?.orderNo ||
      orderResult?.docNo ||
      orderResult?.tranMasId ||
      payload?.docNo ||
      "N/A";

    const items = payload.items || [];
    const currency = selectedOutletCurrency || payload.currencyCode || "";
    const tranDate = systemDate;

    // 🔹 Build item rows: # | Code | Item | Qty
    const itemsHtml = items
      .map((item: any, idx: number) => {
        const qty = Number(item.quantity || 0);

        // Try to match this line with a cart item by itemId
        const lineItemId = Number(item.itemId ?? item.itemID ?? item.id ?? 0);
        const cartMatch =
          !Number.isNaN(lineItemId) && lineItemId !== 0
            ? cartSnapshot.find((c) => Number(c.id) === lineItemId)
            : undefined;

        // ✅ Prefer real itemCode from cart, with sensible fallbacks
        const code =
          item.itemCode || // if backend ever sends it
          cartMatch?.itemCode || // from product.itemCode in cart
          cartMatch?.id?.toString() || // fallback to id from cart
          (item.itemId != null || item.itemID != null
            ? String(item.itemId ?? item.itemID)
            : "");

        const name = item.itemDescription || cartMatch?.name || "";

        return `
        <tr>
          <td class="col-idx">${idx + 1}</td>
          <td class="col-code">${code}</td>
          <td class="col-item">${name}</td>
          <td class="col-qty">${qty}</td>
        </tr>
      `;
      })
      .join("");

    const total = Number(payload.currAmount || payload.tranValue || 0);

    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) {
      console.warn("Popup blocked by browser. Please allow popups to print.");
      return;
    }

    win.document.write(`
    <html>
      <head>
        <title>KOT - Order ${orderNo}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 10px;
          }
          .receipt {
            width: 80mm;
            padding: 6px 8px;
            overflow: hidden;
          }
          .center {
            text-align: center;
          }
          .title {
            font-weight: 700;
            font-size: 14px;
          }
          .subtitle {
            font-weight: 600;
            font-size: 13px;
            margin-top: 2px;
          }
          hr {
            border: none;
            border-top: 1px dashed #000;
            margin: 4px 0;
          }
          .meta {
            font-size: 10px;
            margin-top: 2px;
          }

          table.items-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 4px;
          }
          table.items-table th,
          table.items-table td {
            padding: 2px 0;
            font-size: 10px;
            vertical-align: top;
          }
          table.items-table th {
            border-bottom: 1px solid #000;
            font-weight: 600;
          }
          .col-idx { width: 8%; }
          .col-code { width: 18%; }
          .col-item {
            width: 54%;
            padding-right: 4px;
            word-wrap: break-word;
            white-space: normal;
          }
          .col-qty {
            width: 20%;
            text-align: right;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin-top: 4px;
            padding-top: 4px;
            border-top: 1px dashed #000;
            font-weight: 600;
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="receipt">
          <div class="center">
            <div class="title">${hotelName}</div>
            <div class="subtitle">KOT</div>
            <div class="meta">${outletName}</div>
          </div>
          <hr />
          <div class="meta">Order No: ${orderNo}</div>
          <div class="meta">Table: ${payload.tableNo || "-"}</div>
          <div class="meta">Date: ${tranDate}</div>
          <hr />
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-idx">#</th>
                <th class="col-code">Code</th>
                <th class="col-item">Item</th>
                <th class="col-qty">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="total-row">
            <span>Total</span>
            <span>${total.toFixed(2)} ${currency}</span>
          </div>
        </div>
      </body>
    </html>
  `);

    win.document.close();
  };

  console.log("cart : ", cart);
  console.log("method : ", initialMethod);
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field === "tableNo") setError(null); // Clear error on new table input
  };

  // --- inside component state / helpers ---
  const isFormValid = () => {
    if (!selectedMethod) return false;
    switch (selectedMethod) {
      case "dineIn":
        return !!formData.tableNo && !!formData.noOfPax;
      case "takeaway":
        return !!formData.phoneNumber;
      case "roomService":
        // ✅ validate using roomId (not roomNo)
        return !!formData.roomId;
      case "deliveryService":
        return (
          !!formData.phoneNumber &&
          !!formData.customerName &&
          !!formData.customerAddress
        );
      default:
        return false;
    }
  };

  const handleContinue = async () => {
    if (!isFormValid()) return;

    if (selectedMethod === "dineIn") {
      const enteredTableNo = formData.tableNo?.trim();
      if (!isRunningTableSelected) {
        const conflict = posTable?.some(
          (table) =>
            table.tableNo === enteredTableNo && table.isFinished === false
        );
        if (conflict) {
          setError(`Table ${enteredTableNo} is already in use.`);
          return;
        }
      }

      await handlePostHoldOrder(
        enteredTableNo,
        parseInt(formData.noOfPax || "1", 10)
      );
      return;
    }

    // Handle other methods as needed
    onComplete(selectedMethod!, formData);
  };

const handlePostHoldOrder = async (tableNo: string, noOfPax: number) => {
  const property = JSON.parse(
    localStorage.getItem("selectedProperty") || "{}"
  );
  const hotelCode = property?.hotelCode || "DEFAULT_CODE";
  const now = systemDate;

  const payload = {
    accountId: 0,
    isTaxApplied: true,
    ssclTaxAmount: 0,
    ssclTaxId: 0,
    vatTaxAmount: 0,
    vatTaxId: 0,
    serviceChargeAmount: 0,
    serviceChargeId: 0,
    tdlTaxAmount: 0,
    tdlTaxId: 0,
    tranMasId: 0,
    posCenter: String(selectedPosCenterName || "DefaultPOSCenter"),
    accountIdDebit: 0,
    accountIdCredit: 0,
    hotelCode: String(hotelCode),
    finAct: false,
    tranTypeId: 75,
    tranDate: now,
    effectiveDate: now,
    docNo: `DOC-${Date.now()}`,
    createdOn: now,
    tranValue: cartTotal,
    nameId: 0,
    chequeNo: "",
    paymentMethod: "hold",
    chequeDate: now,
    exchangeRate: 0,
    debit: 0,
    amount: cartTotal,
    comment: "Auto hold transaction from POS page",
    createdBy: fullName,
    currAmount: cartTotal,
    currencyCode: selectedOutletCurrency || "",
    convRate: "1",
    credit: 0,
    paymentReceiptRef: "N/A",
    remarks: "Generated by POS",
    dueDate: now,
    refInvNo: `REF-${Date.now()}`,
    tableNo,
    isFinished: false,
    discPercentage: 0,
    onCost: false,
    startTimeStamp: now,
    endTimeStamp: now,
    roomId: 999,
    noOfPax: noOfPax || 1,
    deliveryMethod: "dineIn",
    phoneNo: "",
    hotelPosCenterId: Number(selectedPosCenterId) || 0,
    items: cart.map((item) => ({
      itemId: Number(item.id),
      quantity: item.quantity || 1,
      price: item.price || 0,
      cost: 0,
      lineDiscount: 0,
      comment: "",
      itemDescription: item.name || "Unnamed Item",
      isKOT: true,
      isBOT: true,
      cover: "",
      discPercentage: 0,
      reservationDetailId: 0,
      finAct: "false",
    })),
    payments: [
      {
        method: "hold",
        amount: cartTotal,
        currency: selectedOutletCurrency || "",
        cardType: "",
        lastDigits: "",
        roomNo: "",
      },
    ],
  };

  console.log("payload selection : ", JSON.stringify(payload));

  try {
    // 🔹 Get username from localStorage (key: rememberedUsername)
    const username =
      localStorage.getItem("rememberedUsername") || " ";

    const result = await dispatch(
      createPosOrder({
        username, // <- new arg
        payload,  // <- same body as before
      })
    ).unwrap();

    console.log("test order sent");
    console.log(`Order sent to table ${tableNo}`);
    console.log("✅ Hold Transaction Created:", result);

    // 80mm KOT print
    open80mmReceipt(result, payload, cart);

    setSubmitted(true);
    dispatch(clearCart());
    setIsRunningTableSelected(false);
    onComplete("dineIn", { tableNo, noOfPax: noOfPax.toString() });
  } catch (err) {
    console.error("❌ Failed to create hold transaction:", err);
  }
};

  useEffect(() => {
    if (initialMethod) {
      setSelectedMethod(initialMethod as DeliveryMethod);
    }
    if (initialDetails) {
      setFormData(initialDetails);
    }
  }, [initialMethod, initialDetails]);

  console.log(
    "✅ Running Tables:",
    posTable?.filter((t) => !t.isFinished)
  );

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            method: "dineIn",
            icon: <UtensilsCrossed className="h-8 w-8" />,
            label: dineIn,
          },
          {
            method: "takeaway",
            icon: <Package className="h-8 w-8" />,
            label: takeaway,
          },
          {
            method: "roomService",
            icon: <Home className="h-8 w-8" />,
            label: roomService,
          },
          {
            method: "deliveryService",
            icon: <Truck className="h-8 w-8" />,
            label: deliveryService,
          },
        ].map(({ method, icon, label }) => (
          <Card
            key={method}
            className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
              selectedMethod === method ? "border-primary" : ""
            }`}
            onClick={() => {
              setSelectedMethod(method as DeliveryMethod);
              setError(null);
            }}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              {icon}
              <h3 className="font-medium">{label}</h3>
            </div>
          </Card>
        ))}
      </div>

      {selectedMethod && (
        <div className="space-y-4 mt-4">
          {selectedMethod === "dineIn" && (
            <div className="space-y-4 mt-4">
              <Label>Table No</Label>
              <Input
                value={formData.tableNo || ""}
                onChange={(e) => handleInputChange("tableNo", e.target.value)}
              />

              <Label>No. of Pax</Label>
              <Input
                value={formData.noOfPax || ""}
                type="number"
                onChange={(e) => handleInputChange("noOfPax", e.target.value)}
              />

              {posTable?.filter((t) => !t.isFinished).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Running Tables
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from(
                      new Map(
                        posTable
                          .filter((t) => !t.isFinished)
                          .map((t) => [t.tableNo, t])
                      ).values()
                    ).map((t) => (
                      <div
                        key={t.tableNo}
                        onClick={() => {
                          if (!cart.length) return console.log();
                          ("Cart is empty");

                          const tableNo = t.tableNo;
                          const pax = t.noOfPax || 1;

                          setFormData({
                            ...formData,
                            tableNo,
                            noOfPax: pax.toString(),
                          });

                          setIsRunningTableSelected(true);

                          // ✅ Immediately post order
                          handlePostHoldOrder(tableNo, pax);
                        }}
                        className="bg-black text-white border border-white rounded-lg p-3 text-center cursor-pointer hover:bg-gray-500 transition"
                      >
                        <p className="font-bold text-lg">Table {t.tableNo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}
            </div>
          )}

          {selectedMethod === "takeaway" && (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{phoneNumber}</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
              />
            </div>
          )}

          {selectedMethod === "roomService" && (
            <div className="space-y-2">
              <Label>{roomNo}</Label>
              {roomsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading rooms...
                </p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {reservations.flatMap((reservation) =>
                    reservation.rooms
                      .filter((room) => room.status === 4)
                      .map((room) => {
                        const isSelected =
                          formData.roomId === String(room.roomID);
                        return (
                          <Card
                            key={room.roomID}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                // ✅ store roomId (used by the submitter)
                                roomId: String(room.roomID),
                                // (optional) keep roomNo for UX / slips
                                roomNo: room.roomNumber,
                                // (recommended) pass linkage for GL/lines
                                reservationId: String(
                                  reservation.reservationID
                                ),
                                reservationDetailId: String(
                                  room.reservationDetailID
                                ),
                              })
                            }
                            className={`p-3 text-center cursor-pointer border-2 transition ${
                              isSelected
                                ? "border-blue-400"
                                : "border-gray-200 hover:border-blue-400"
                            }`}
                          >
                            <p className="font-medium text-lg">
                              {room.roomNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {room.roomType}
                            </p>
                          </Card>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          )}

          {selectedMethod === "deliveryService" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{phoneNumber}</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber || ""}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">{customerName}</Label>
                <Input
                  id="customerName"
                  value={formData.customerName || ""}
                  onChange={(e) =>
                    handleInputChange("customerName", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">{customerAddress}</Label>
                <Input
                  id="customerAddress"
                  value={formData.customerAddress || ""}
                  onChange={(e) =>
                    handleInputChange("customerAddress", e.target.value)
                  }
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>
      )}

      <SheetFooter>
        <SheetFooter>
          <Button
            onClick={handleContinue}
            disabled={!isFormValid() || isRunningTableSelected || submitted}
            className="w-full"
          >
            {continueText}
          </Button>
        </SheetFooter>
      </SheetFooter>
    </div>
  );
}

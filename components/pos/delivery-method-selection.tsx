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
import { createPosOrder } from "@/redux/slices/posOrderSlice";
import { clearCart } from "@/redux/slices/cartSlice";
import { toast } from "../ui/use-toast";
import { Alert } from "../ui/alert";
import { fetchReservationList } from "@/redux/slices/reservationListSlice";

type DeliveryMethod = "dineIn" | "takeaway" | "roomService" | "deliveryService";

interface DeliveryMethodSelectionProps {
  onComplete: (method: string, formData: Record<string, string>) => void;
  selectedPosCenterId: string;
  selectedPosCenterName: string;
  initialMethod?: string;
  initialDetails?: Record<string, string>;
}

export function DeliveryMethodSelection({
  onComplete,
  selectedPosCenterId,
  selectedPosCenterName,
  initialMethod,
  initialDetails,
}: DeliveryMethodSelectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod | null>(
    null
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { tables: posTable } = useSelector(
    (state: RootState) => state.posTable
  );

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

  const dispatch = useDispatch<AppDispatch>();

  const { data: reservations, loading: roomsLoading } = useSelector(
    (state: RootState) => state.reservationList
  );

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

  console.log("cart : ", cart);
  console.log("method : ", initialMethod);
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (field === "tableNo") setError(null); // Clear error on new table input
  };

  const isFormValid = () => {
    if (!selectedMethod) return false;
    switch (selectedMethod) {
      case "dineIn":
        return !!formData.tableNo && !!formData.noOfPax;
      case "takeaway":
        return !!formData.phoneNumber;
      case "roomService":
        return !!formData.roomNo;
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
    const now = new Date().toISOString();

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
      createdBy: "System",
      currAmount: cartTotal,
      currencyCode: "LKR",
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
      hotelPosCenterId: selectedPosCenterId,
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
          currency: "LKR",
          cardType: "",
          lastDigits: "",
          roomNo: "",
        },
      ],
    };
    console.log("payload : ", payload);

    try {
      const result = await dispatch(createPosOrder(payload)).unwrap();
      console.log(`Order sent to table ${tableNo}`);
      console.log("✅ Hold Transaction Created:", result);

      setSubmitted(true); // ✅ prevent re-submission
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
                        const isSelected = formData.roomNo === room.roomNumber;
                        return (
                          <Card
                            key={room.roomID}
                            onClick={() =>
                              handleInputChange("roomNo", room.roomNumber)
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
              {/* {formData.roomNo && (
                <p className="text-sm text-green-600">
                  Selected Room: {formData.roomNo}
                </p>
              )} */}
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

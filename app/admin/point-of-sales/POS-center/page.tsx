"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  fetchHotelPOSCenterMas,
  selectHotelPOSCenterMasLoading,
  selectHotelPOSCenterMasError,
  selectHotelPOSCenterMasData,
  type HotelPOSCenterMas,
} from "@/redux/slices/fetchHotelPOSCenterMasSlice";

// ✅ NEW: create thunk + selectors
import {
  createHotelPOSCenterMas,
  selectCreateHotelPOSCenterMasLoading,
  selectCreateHotelPOSCenterMasError,
  resetCreateHotelPOSCenterMasState,
} from "@/redux/slices/createHotelPOSCenterMasSlice";

export default function POSCenterPage() {
  const dispatch = useDispatch<AppDispatch>();

  const loading = useSelector(selectHotelPOSCenterMasLoading);
  const error = useSelector(selectHotelPOSCenterMasError);
  const data = useSelector(selectHotelPOSCenterMasData);

  // ✅ create state
  const creating = useSelector(selectCreateHotelPOSCenterMasLoading);
  const createError = useSelector(selectCreateHotelPOSCenterMasError);

  // ---------- Create form (fields as in the screenshot) ----------
  const [form, setForm] = useState({
    posCenterCode: "",
    posCenterName: "",
    isProfitCenter: false,
    kotPrinterName: "",
    botPrinterName: "",
    billPrinterName: "",
    locationID: "", // Sub-store location (kept as text; we’ll coerce to number)
    vat: "",
    nbt: "",
    ct: "", // TDL Rate -> API field `ct`
    scDineIn: "", // maps to `sc`
    scRoomService: "",
    scTakeAway: "",
    scDelivery: "",
    noOfBillCopies: "",
    costPercentage: "",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const canSave =
    form.posCenterCode.trim() &&
    form.posCenterName.trim() &&
    !creating;

  const handleSave = async () => {
    if (!canSave) return;

    const hotelCode =
      typeof window !== "undefined"
        ? localStorage.getItem("hotelCode") || ""
        : "";
    if (!hotelCode) {
      console.error("Missing hotelCode in localStorage");
      return;
    }

    const now = new Date().toISOString();

    // Build payload matching your slice type
    const payload = {
      posCenterID: 0,
      posCenterCode: form.posCenterCode.trim(),
      posCenterName: form.posCenterName.trim(),
      nextBillNo: "0",
      hotelCode,
      createdBy: "System",
      createdOn: now,
      finAct: true,

      kotPrinterName: form.kotPrinterName.trim() || "",
      botPrinterName: form.botPrinterName.trim() || "",
      billPrinterName: form.billPrinterName.trim() || "",

      nextOrderNo: "0",
      locationID: Number(form.locationID) || 0,
      show: true,
      isTaxInclusivePrices: false,
      isAskRoomNo: false,
      isAskTableNo: false,
      isAskDeliveryMtd: false,
      isAskPOSCenter: false,
      isAskNoOfPax: false,
      isChargeSeperateSC: false,

      vat: Number(form.vat) || 0,
      nbt: Number(form.nbt) || 0,
      sc: Number(form.scDineIn) || 0,
      ct: Number(form.ct) || 0, // TDL
      gotoLogin: false,
      isNBTPlusVat: false,
      printBillOnLQ: false,
      usdBilling: false,
      noOfBillCopies: Number(form.noOfBillCopies) || 0,
      isPossibleToPostToFOCashier: false,
      isTakeAway: false,
      outletGroup: "",
      isProfitCenter: form.isProfitCenter,
      roomServiceSC: Number(form.scRoomService) || 0,
      takeAwaySC: Number(form.scTakeAway) || 0,
      deliverySC: Number(form.scDelivery) || 0,
      allowDirectBill: false,
      printKOTCopyAtBILLPrinter: false,
      costPercentage: Number(form.costPercentage) || 0,
      isBar: false,
      isMergeTableWhenPrintSt: false,
      koT_paperwidth: 0,
      boT_paperwidth: 0,
      bilL_paperwidth: 0,
      showOnGSS: false,
    };

    try {
      await dispatch(createHotelPOSCenterMas(payload)).unwrap();
      // refresh list
      await dispatch(fetchHotelPOSCenterMas({ hotelCode }));
      // clear form
      setForm({
        posCenterCode: "",
        posCenterName: "",
        isProfitCenter: false,
        kotPrinterName: "",
        botPrinterName: "",
        billPrinterName: "",
        locationID: "",
        vat: "",
        nbt: "",
        ct: "",
        scDineIn: "",
        scRoomService: "",
        scTakeAway: "",
        scDelivery: "",
        noOfBillCopies: "",
        costPercentage: "",
      });
      dispatch(resetCreateHotelPOSCenterMasState());
    } catch (e) {
      // keep values for correction
      console.error("Create POS center failed:", e);
    }
  };

  // ---------- list: search + pagination ----------
  const [q, setQ] = useState("");
  const [pageIndex, setPageIndex] = useState(1); // 1-based
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const hotelCode =
      typeof window !== "undefined"
        ? localStorage.getItem("hotelCode") ?? undefined
        : undefined;
    dispatch(fetchHotelPOSCenterMas(hotelCode ? { hotelCode } : undefined));
  }, [dispatch]);

  const filtered: HotelPOSCenterMas[] = useMemo(() => {
    if (!q.trim()) return data;
    const s = q.toLowerCase();
    return data.filter((r) =>
      [r.posCenterCode, r.posCenterName, r.hotelCode, String(r.posCenterID)]
        .filter(Boolean)
        .some((v) => v!.toString().toLowerCase().includes(s))
    );
  }, [data, q]);

  useEffect(() => setPageIndex(1), [q, pageSize, data.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canPrev = pageIndex > 1 && !loading;
  const canNext = !loading && pageIndex < totalPages;
  const start = (pageIndex - 1) * pageSize;
  const page = useMemo(
    () => filtered.slice(start, start + pageSize),
    [filtered, start, pageSize]
  );

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold">POS Centers</h1>
          <p className="text-sm text-gray-500 -mt-1">Manage Sales Outlets</p>
        </div>

        {/* ---------- Create form (matches the screenshot) ---------- */}
        <div className="rounded-xl border p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">POS Center Code</label>
              <Input name="posCenterCode" value={form.posCenterCode} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-gray-600">POS Center Name</label>
              <Input name="posCenterName" value={form.posCenterName} onChange={onChange} />
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <input
                id="isProfitCenter"
                type="checkbox"
                name="isProfitCenter"
                checked={form.isProfitCenter}
                onChange={onChange}
                className="h-4 w-4"
              />
              <label htmlFor="isProfitCenter" className="text-sm text-gray-700">
                Is a Profit Center (Like a Bar or Cafe Selling Trading Items) If this is
                Active, COGS will be calculated at the Sale
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">KOT Printer</label>
              <Input name="kotPrinterName" value={form.kotPrinterName} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">BOT Printer</label>
              <Input name="botPrinterName" value={form.botPrinterName} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Bill Printer</label>
              <Input name="billPrinterName" value={form.billPrinterName} onChange={onChange} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Sub-Store Location</label>
              <Input
                name="locationID"
                inputMode="numeric"
                value={form.locationID}
                onChange={onChange}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">VAT Rate</label>
              <Input name="vat" inputMode="decimal" value={form.vat} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">NBT Rate</label>
              <Input name="nbt" inputMode="decimal" value={form.nbt} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">TDL Rate</label>
              <Input name="ct" inputMode="decimal" value={form.ct} onChange={onChange} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">SC Rate (Dine-in)</label>
              <Input
                name="scDineIn"
                inputMode="decimal"
                value={form.scDineIn}
                onChange={onChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">SC Rate (Room Service)</label>
              <Input
                name="scRoomService"
                inputMode="decimal"
                value={form.scRoomService}
                onChange={onChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">SC Rate (Take-Away)</label>
              <Input
                name="scTakeAway"
                inputMode="decimal"
                value={form.scTakeAway}
                onChange={onChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">SC Rate (Delivery)</label>
              <Input
                name="scDelivery"
                inputMode="decimal"
                value={form.scDelivery}
                onChange={onChange}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Bill Copies</label>
              <Input
                name="noOfBillCopies"
                inputMode="numeric"
                value={form.noOfBillCopies}
                onChange={onChange}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Executive Price/ Cost %</label>
              <Input
                name="costPercentage"
                inputMode="decimal"
                value={form.costPercentage}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="w-48 bg-slate-900 hover:bg-slate-800"
            >
              {creating ? "Saving…" : "Save"}
            </Button>
          </div>

          {createError && (
            <div className="mt-2 text-xs text-red-600">{createError}</div>
          )}
        </div>

        {/* ---------- table ---------- */}

        {error && (
          <div className="text-red-600 text-sm border border-red-200 rounded-md p-3 bg-red-50">
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground border rounded-md p-4">
            No POS centers found.
          </div>
        )}

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px] text-center">#</TableHead>
                <TableHead>POS Center Code</TableHead>
                <TableHead>POS Center Name</TableHead>
                <TableHead>is Profit Center</TableHead>
                <TableHead>Hotel Code</TableHead>
                <TableHead>KOT Printer</TableHead>
                <TableHead>BOT Printer</TableHead>
                <TableHead>BILL Printer</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>VAT</TableHead>
                <TableHead>NBT</TableHead>
                <TableHead>TDL</TableHead>
                <TableHead>SC_DineIn</TableHead>
                <TableHead>SC_RoomService</TableHead>
                <TableHead>SC_TakeAway</TableHead>
                <TableHead>SC_Delivery</TableHead>
                <TableHead>Cost Percentage</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={17} className="py-6 text-center">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : page.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={17} className="py-6 text-center text-gray-500">
                    No data to display
                  </TableCell>
                </TableRow>
              ) : (
                page.map((r, i) => (
                  <TableRow key={r.posCenterID}>
                    <TableCell className="text-center">{start + i + 1}</TableCell>
                    <TableCell className="font-mono">{r.posCenterCode}</TableCell>
                    <TableCell>{r.posCenterName}</TableCell>
                    <TableCell>{r.isProfitCenter ? "Yes" : "No"}</TableCell>
                    <TableCell>{r.hotelCode}</TableCell>
                    <TableCell>{r.kotPrinterName || "—"}</TableCell>
                    <TableCell>{r.botPrinterName || "—"}</TableCell>
                    <TableCell>{r.billPrinterName || "—"}</TableCell>
                    <TableCell>{r.noOfBillCopies ?? "—"}</TableCell>
                    <TableCell>{r.vat ?? 0}</TableCell>
                    <TableCell>{r.nbt ?? 0}</TableCell>
                    <TableCell>{r.ct ?? 0}</TableCell>
                    <TableCell>{r.sc ?? 0}</TableCell>
                    <TableCell>{r.roomServiceSC ?? 0}</TableCell>
                    <TableCell>{r.takeAwaySC ?? 0}</TableCell>
                    <TableCell>{r.deliverySC ?? 0}</TableCell>
                    <TableCell>{r.costPercentage ?? 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="hidden sm:block" />
          <div className="flex justify-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => canPrev && setPageIndex((p) => p - 1)}
                disabled={!canPrev}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-3 py-1 rounded bg-black text-white text-sm">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={() => canNext && setPageIndex((p) => p + 1)}
                disabled={!canNext}
                className="flex items-center gap-1 text-sm text-black disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-600">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) || 10);
                  setPageIndex(1);
                }}
                className="px-2 py-1 text-sm border rounded bg-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
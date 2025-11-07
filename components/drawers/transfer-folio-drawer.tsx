"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/redux/store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getFolioByReservationDetailId } from "@/controllers/folioController";
import { getReservationById } from "@/controllers/reservationController";
import { toast } from "sonner";
import { createGlTransaction } from "@/redux/slices/glTransactionCreateSlice";

/* ----------------------------- Local Types ----------------------------- */
type FolioRow = {
  tranDate?: string;
  tranType?: string;
  docNo?: string;
  accountName?: string;
  paymentMethod?: string;
  amount?: number;
};

type RoomOption = {
  reservationDetailID: number;
  roomNumber?: string | number;
  guest1?: string;
  roomType?: string;
};

interface TransferFolioDrawerProps {
  open: boolean;
  onClose: () => void;
  bookingDetail: {
    reservationID: number;
    reservationDetailID: number;
    reservationNo?: string;
    roomNumber?: string | number;
    guest?: string;
  };
  onTransfer?: (payload: {
    sourceReservationDetailID: number;
    targetReservationDetailID: number;
    lines: FolioRow[];
    totalAmount: number;
  }) => Promise<void> | void;
}

/* ------------------------- GL Payload (local) -------------------------- */
export interface GlAccTransaction {
  accountID: number;
  debit?: number;
  credit?: number;
  amount?: number; // + for debit lines, - for credit lines (as requested)
  memo?: string;
  tranDate?: string;
  propertyID?: number;
}

export interface GlTransactionRequest {
  glAccTransactions: GlAccTransaction[];
  tranTypeId?: number; // 36
  tranDate?: string;
  docNo?: string;
  tranValue?: number;
  currencyCode?: string;
  isTaxInclusive?: boolean;
  finAct: boolean;
}

type SelectedProperty = {
  id: number;
  name: string;
  guid: string;
  hotelCode: number | string;
  hotelCurrency?: string;
};

type StoredUser = {
  userName?: string;
  name?: string;
  email?: string;
};

/* If you want to extend header meta in the future */
export type BuildGlPayloadArgs = {
  amount: number; // positive number
  currencyCode?: string; // e.g., "LKR", "USD"
  memo?: string; // header/line narration
  remarks?: string; // header remarks
  docNo?: string; // optional reference
  createdBy?: string; // user name
  tranDateIso?: string; // ISO string; defaults to now
  hotelCode?: string; // if backend expects it
  nameID?: number; // optional guest/account link
  reservationId?: number; // optional
  reservationDetailId?: number; // optional (header-level)
};

type TwoStepArgs = Partial<BuildGlPayloadArgs> & {
  sourceAccountId?: number; // default 2
  clearingAccountId?: number; // default 77
  targetAccountId?: number; // default 1
  sourceReservationDetailId?: number; // ✅ NEW
  targetReservationDetailId?: number; // ✅ NEW
};

/* ------------------------------ Component ------------------------------ */
export function TransferFolioDrawer({
  open,
  onClose,
  bookingDetail,
  onTransfer,
}: TransferFolioDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [folioRows, setFolioRows] = useState<FolioRow[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [targetDetailId, setTargetDetailId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const getSelectedProperty = (): SelectedProperty | undefined => {
    try {
      const raw = localStorage.getItem("selectedProperty");
      if (!raw) return undefined;
      return JSON.parse(raw) as SelectedProperty;
    } catch {
      return undefined;
    }
  };

  const getPosCenterInfo = (): {
    posCenter?: string;
    outletCurrency?: string;
    hotelPosCenterId?: number;
  } => {
    try {
      const raw = localStorage.getItem("hm_selected_pos_center");
      if (!raw) return {};
      const j = JSON.parse(raw);
      return {
        posCenter: j?.posCenter,
        outletCurrency: j?.outletCurrency,
        hotelPosCenterId: j?.hotelPosCenterId,
      };
    } catch {
      return {};
    }
  };

  const getUserName = (): string | undefined => {
    try {
      const raw =
        localStorage.getItem("hotelmateUser") || localStorage.getItem("user");
      if (!raw) return undefined;
      const u = JSON.parse(raw) as StoredUser;
      return u?.userName || u?.name || u?.email;
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    // clear all selections on new folio data
    setSelected({});
  }, [folioRows]);

  // ...keep your existing selectedAmount & amountToShow
  // selectedAmount already recalculates from checked rows

  // --- improve "select all" checkbox state
  const allChecked =
    folioRows.length > 0 && folioRows.every((_, i) => !!selected[i]);
  const someChecked = folioRows.some((_, i) => !!selected[i]) && !allChecked;

  const getCurrencyCode = (): string | undefined => {
    try {
      const pos = getPosCenterInfo();
      if (pos?.outletCurrency && typeof pos.outletCurrency === "string")
        return pos.outletCurrency;

      const selectedProperty = getSelectedProperty();
      if (selectedProperty?.hotelCurrency)
        return selectedProperty.hotelCurrency;

      const selectedOutletCurrency = localStorage.getItem(
        "selectedOutletCurrency"
      );
      if (selectedOutletCurrency) {
        const parsed = JSON.parse(selectedOutletCurrency);
        if (typeof parsed === "string") return parsed;
        if (parsed?.code) return parsed.code;
      }

      const selectedCurrencyCode = localStorage.getItem("selectedCurrencyCode");
      if (selectedCurrencyCode) {
        const parsed = JSON.parse(selectedCurrencyCode);
        if (typeof parsed === "string") return parsed;
        if (parsed?.code) return parsed.code;
      }
    } catch {}
    return undefined;
  };

  /** Build the two GL payloads:
   *  A: 2 -> 77  (CR 2, DR 77)
   *  B: 77 -> 1  (CR 77, DR 1)
   */
  const buildTwoStepGlTransfer = (
    amount: number,
    args?: TwoStepArgs
  ): [GlTransactionRequest, GlTransactionRequest] => {
    const nowIso = args?.tranDateIso || new Date().toISOString();
    const selectedProperty = getSelectedProperty();
    const { posCenter, hotelPosCenterId } = getPosCenterInfo();
    const currencyCode = args?.currencyCode || getCurrencyCode();
    const createdBy = args?.createdBy || getUserName() || "system";
    const hotelCodeStr =
      (selectedProperty?.hotelCode != null
        ? String(selectedProperty.hotelCode)
        : undefined) || (args?.hotelCode ? String(args.hotelCode) : undefined);

    const SRC = args?.sourceAccountId ?? 2;
    const CLG = args?.clearingAccountId ?? 77;
    const TGT = args?.targetAccountId ?? 2;

    const srcDetailId = args?.sourceReservationDetailId; // ✅
    const tgtDetailId = args?.targetReservationDetailId; // ✅

    const baseHeaderCommon = {
      finAct: false,
      tranTypeId: 36,
      tranDate: nowIso,
      docNo: args?.docNo,
      tranValue: amount,
      currencyCode,
      isTaxInclusive: false,

      hotelCode: hotelCodeStr,
      createdOn: nowIso,
      createdBy,
      posted: false,
      nameID: args?.nameID,
      posCenter,
      reservationId: args?.reservationId,
      hotelPosCenterId,
      grossTotal: amount,
      currTranValue: amount,
      effectiveDate: nowIso,
    } as any;

    // —— STEP A (2 -> 77) should attach to SOURCE detail ——
    const memoA =
      `Transfer A: SRC(${SRC}) → CLG(${CLG})` +
      (args?.reservationId ? ` • Res#${args.reservationId}` : "");
    const headerA = {
      ...baseHeaderCommon,
      remarks:
        args?.remarks ||
        args?.memo ||
        `Folio transfer ${args?.docNo || ""} (A)`,
      reservationDetailId: srcDetailId, // ✅ header links to SOURCE
    } as GlTransactionRequest;

    const lineCommonA = {
      memo: memoA,
      narration: memoA,
      tranDate: nowIso,
      propertyID: selectedProperty?.id,
      currencyCode,
      reservationDetailID: srcDetailId, // ✅ lines link to SOURCE
    } as any;

    const payloadA: GlTransactionRequest = {
      ...headerA,
      glAccTransactions: [
        {
          finAct: true,
          accountID: CLG,
          debit: amount,
          credit: 0,
          amount: +amount,
          ...lineCommonA,
          currDebit: amount,
          currCredit: 0,
        },
        {
          finAct: true,
          accountID: SRC,
          debit: 0,
          credit: amount,
          amount: -amount,
          ...lineCommonA,
          currDebit: 0,
          currCredit: amount,
          currAmount: -amount,
        },
      ],
    };

    // —— STEP B (77 -> 1) should attach to TARGET detail ——
    const memoB =
      `Transfer B: CLG(${CLG}) → TGT(${TGT})` +
      (args?.reservationId ? ` • Res#${args.reservationId}` : "");
    const headerB = {
      ...baseHeaderCommon,
      remarks:
        args?.remarks ||
        args?.memo ||
        `Folio transfer ${args?.docNo || ""} (B)`,
      reservationDetailId: tgtDetailId, // ✅ header links to TARGET
    } as GlTransactionRequest;

    const lineCommonB = {
      memo: memoB,
      narration: memoB,
      tranDate: nowIso,
      propertyID: selectedProperty?.id,
      currencyCode,
      reservationDetailID: tgtDetailId, // ✅ lines link to TARGET
    } as any;

    const payloadB: GlTransactionRequest = {
      ...headerB,
      glAccTransactions: [
        {
          finAct: true,
          accountID: TGT,
          debit: amount,
          credit: 0,
          amount: +amount,
          ...lineCommonB,
          currDebit: amount,
          currCredit: 0,
        },
        {
          finAct: true,
          accountID: CLG,
          debit: 0,
          credit: amount,
          amount: -amount,
          ...lineCommonB,
          currDebit: 0,
          currCredit: amount,
          currAmount: -amount,
        },
      ],
    };

    return [payloadA, payloadB];
  };

  /* --------------------------- Data loaders --------------------------- */
  const loadFolio = useCallback(async () => {
    if (!open || !bookingDetail?.reservationDetailID) return;
    try {
      setLoading(true);
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      const token = storedToken ? JSON.parse(storedToken).accessToken : null;
      if (!token) throw new Error("No access token found");

      const rows = await getFolioByReservationDetailId({
        token,
        reservationDetailId: bookingDetail.reservationDetailID,
      });
      setFolioRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Failed to load folio for transfer:", e);
      setFolioRows([]);
    } finally {
      setLoading(false);
    }
  }, [open, bookingDetail?.reservationDetailID]);

  const loadRooms = useCallback(async () => {
    if (!open || !bookingDetail?.reservationID) return;
    try {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("hotelmateTokens")
          : null;
      const token = storedToken ? JSON.parse(storedToken).accessToken : null;
      if (!token) throw new Error("No access token found");

      const res = await getReservationById({
        token,
        reservationId: bookingDetail.reservationID,
      });

      const roomOptions: RoomOption[] = (res?.rooms ?? [])
        .map((r: any) => ({
          reservationDetailID: r.reservationDetailID,
          roomNumber: r.roomNumber,
          guest1: r.guest1,
          roomType: r.roomType,
        }))
        .filter(
          (r: RoomOption) =>
            r.reservationDetailID !== bookingDetail.reservationDetailID
        );

      setRooms(roomOptions);
    } catch (e) {
      console.error("Failed to load sibling rooms:", e);
      setRooms([]);
    }
  }, [open, bookingDetail?.reservationID, bookingDetail?.reservationDetailID]);

  useEffect(() => {
    loadFolio();
    loadRooms();
    if (open) {
      setSelected({});
      setTargetDetailId("");
    }
  }, [open, loadFolio, loadRooms]);

  /* ----------------------------- Memoized ----------------------------- */
  const total = useMemo(
    () =>
      (folioRows || []).reduce((s, r) => s + Number(r?.amount || 0), 0) || 0,
    [folioRows]
  );

  const selectedLines = useMemo(
    () => folioRows.filter((_, idx) => !!selected[idx]),
    [folioRows, selected]
  );

  const selectedAmount = useMemo(
    () => selectedLines.reduce((s, r) => s + Number(r?.amount || 0), 0) || 0,
    [selectedLines]
  );

  // Show only the amount that will be posted (selected lines)
  const amountToShow = selectedAmount;

  const canTransfer = useMemo(
    () =>
      !submitting &&
      !!targetDetailId &&
      selectedLines.length > 0 &&
      selectedAmount > 0,
    [submitting, targetDetailId, selectedLines.length, selectedAmount]
  );

  const EPS = 1e-6;

  const handleRowToggle = (index: number, checked: boolean) => {
    const amt = Number(folioRows[index]?.amount || 0);

    // if turning ON would push selected sum over table total, block it
    if (checked && selectedAmount + amt > total + EPS) {
      toast.warning("Selection exceeds table total.");
      return;
    }

    setSelected((prev) => ({ ...prev, [index]: checked }));
  };

  const handleToggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected({});
      return;
    }

    let sum = 0;
    const map: Record<number, boolean> = {};

    // pick rows in order, but never let sum exceed table total
    for (let i = 0; i < folioRows.length; i++) {
      const amt = Number(folioRows[i]?.amount || 0);
      if (sum + amt <= total + EPS) {
        map[i] = true;
        sum += amt;
      } else {
        map[i] = false;
      }
    }

    setSelected(map);
  };

  const handleTransfer = async () => {
    if (!canTransfer) return;

    try {
      setSubmitting(true);

      // 1) Transfer payload for your backend handler
      const payload = {
        sourceReservationDetailID: bookingDetail.reservationDetailID,
        targetReservationDetailID: targetDetailId as number,
        lines: selectedLines,
        totalAmount: total, // UI info; GL uses selectedAmount below
      };

      // 2) Perform folio transfer (callback supplied by parent)
      if (onTransfer) {
        await onTransfer(payload);
      } else {
        console.log("Transfer payload:", payload);
        toast.success("Prepared transfer payload (check console)");
      }

      // 3) Post GL (two-step) using selectedAmount
      const glAmount = selectedAmount;
      if (glAmount > 0) {
        const [payloadA, payloadB] = buildTwoStepGlTransfer(glAmount, {
          docNo: bookingDetail?.reservationNo,
          reservationId: bookingDetail?.reservationID,

          // ✅ bind detail ids explicitly
          sourceReservationDetailId: bookingDetail?.reservationDetailID,
          targetReservationDetailId: Number(targetDetailId),

          // optional: override accounts
          // sourceAccountId: 2,
          // clearingAccountId: 77,
          // targetAccountId: 1,
        });

        console.log("[GL payload A]", JSON.stringify(payloadA, null, 2));
        await dispatch(createGlTransaction(payloadA)).unwrap();
        toast.success("GL Step A posted (CR 2 / DR 77)");

        console.log("[GL payload B]", JSON.stringify(payloadB, null, 2));
        await dispatch(createGlTransaction(payloadB)).unwrap();
        toast.success("GL Step B posted (DR 1 / CR 77)");
      } else {
        toast.message("No positive amount selected to post to GL.");
      }

      // 4) Reset UI and refresh folio
      setSelected({});
      setTargetDetailId("");
      await loadFolio();
      toast.success("Transfer complete");
    } catch (e: any) {
      console.error("Transfer/GL failed:", e);
      const msg =
        e?.detail || e?.message || "Failed to transfer and/or post GL";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------- UI -------------------------------- */
  return (
    <div className="flex flex-col h-full mt-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center justify-between ">
          <div>
            <h2 className="text-lg font-semibold">Transfer Folio</h2>
            <p className="text-xs text-muted-foreground">
              Reservation No: {bookingDetail?.reservationNo ?? "—"} • Room:{" "}
              {bookingDetail?.roomNumber ?? "—"}
            </p>
          </div>
          {/* <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div> */}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 overflow-auto flex-1">
        <div className="space-y-2">
          <Separator className="my-2" />

          <div className="overflow-auto border rounded-md">
            <table className="w-full text-xs border border-muted">
              <thead className="bg-muted text-muted-foreground divide-y divide-muted">
                <tr>
                  <th className="p-2 text-left border border-muted w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={(e) => handleToggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="p-2 text-left border border-muted">Date</th>
                  <th className="p-2 text-left border border-muted">
                    Tran Type
                  </th>
                  <th className="p-2 text-left border border-muted">Doc No</th>
                  <th className="p-2 text-left border border-muted">
                    POS Center
                  </th>
                  <th className="p-2 text-left border border-muted">
                    Pmt. Mtd
                  </th>
                  <th className="p-2 text-right border border-muted">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {loading ? (
                  <tr>
                    <td className="p-3 text-center text-sm" colSpan={7}>
                      Loading folio…
                    </td>
                  </tr>
                ) : (folioRows || []).length > 0 ? (
                  <>
                    {folioRows.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border border-muted">
                          <input
                            type="checkbox"
                            checked={!!selected[idx]}
                            onChange={(e) =>
                              handleRowToggle(idx, e.target.checked)
                            }
                          />
                        </td>
                        <td className="p-2 border border-muted">
                          {item.tranDate
                            ? format(new Date(item.tranDate), "MMM d, yyyy")
                            : "—"}
                        </td>
                        <td className="p-2 border border-muted">
                          {item.tranType || "—"}
                        </td>
                        <td className="p-2 border border-muted">
                          {item.docNo || "—"}
                        </td>
                        <td className="p-2 border border-muted">
                          {item.accountName || "—"}
                        </td>
                        <td className="p-2 border border-muted">
                          {item.paymentMethod || "—"}
                        </td>
                        <td className="p-2 text-right border border-muted">
                          {(item.amount ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-muted/50">
                      <td
                        colSpan={6}
                        className="p-2 border border-muted text-left"
                      >
                        Total
                      </td>
                      <td className="p-2 border border-muted text-right">
                        {total.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td
                      className="p-3 text-center text-sm text-muted-foreground"
                      colSpan={7}
                    >
                      No folio records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Transfer Row */}
          <div className="mt-3 border rounded-md p-3 bg-muted/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
              {/* Dropdown */}
              <div className="flex flex-col">
                <label className="text-xs font-medium mb-1">Transfer to</label>
                <select
                  className="border rounded-md p-2 text-sm bg-background"
                  value={targetDetailId}
                  onChange={(e) =>
                    setTargetDetailId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                >
                  <option value="">Select room…</option>
                  {rooms.map((r) => (
                    <option
                      key={r.reservationDetailID}
                      value={r.reservationDetailID}
                    >
                      Room {r.roomNumber ?? "—"}
                      {r.roomType ? ` • ${r.roomType}` : ""}
                      {r.guest1 ? ` • ${r.guest1}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount (selected lines) */}
              <div className="flex flex-col">
                <span className="text-xs font-medium mb-1">Amount</span>
                <div className="border rounded-md px-3 py-2 text-sm bg-background">
                  {amountToShow.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>

              {/* Transfer button */}
              <div className="flex md:justify-end items-end">
                <Button
                  className="w-full md:w-auto"
                  disabled={!canTransfer}
                  onClick={handleTransfer}
                >
                  {submitting ? "Transferring…" : "Transfer"}
                </Button>
              </div>
            </div>
          </div>
          {/* End Transfer Row */}
        </div>
      </div>
    </div>
  );
}

export default TransferFolioDrawer;

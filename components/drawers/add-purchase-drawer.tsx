"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

import { AddSupplierDrawer } from "./add-supplier-drawer";
import { useTranslatedText } from "@/lib/translation";
import { getGlAccounts } from "@/controllers/glAccountsController";
import { getAllCurrencies } from "@/controllers/AllCurrenciesController";
import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { useStoredCurrencyCode } from "@/hooks/useStoredCurrencyCode";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchNameMasterByHotel } from "@/redux/slices/nameMasterSlice";

import {
  createGlTransaction,
  selectGlTxnCreateError,
  selectGlTxnCreateLast,
  selectGlTxnCreateLoading,
  resetGlTransactionState,
} from "@/redux/slices/glTransactionCreateSlice";

type SDItem = { value: string; label: string; hint?: string };

function SearchableDropdown({
  value,
  onChange,
  items,
  placeholder = "Select...",
  emptyText = "No results",
  disabled = false,
  className = "",
  inputClassName = "",
}: {
  value: string;
  onChange: (val: string) => void;
  items: SDItem[];
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = items.find((i) => i.value === value);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(needle) ||
        (i.hint ?? "").toLowerCase().includes(needle) ||
        i.value.toLowerCase().includes(needle)
    );
  }, [items, q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest?.("[data-sd-root]")) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div data-sd-root className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`w-full justify-between inline-flex items-center rounded-md border px-3 py-2 text-sm bg-background hover:bg-accent ${
          disabled ? "opacity-60 cursor-not-allowed" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className="ml-2 h-4 w-4 opacity-60"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.086l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-[100] mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          <div className="p-2 border-b">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to search…"
              className={`w-full rounded-md border px-2 py-1 text-sm bg-background ${inputClassName}`}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filtered.map((it) => (
                <button
                  key={it.value}
                  type="button"
                  onClick={() => {
                    onChange(it.value);
                    setQ("");
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${
                    it.value === value ? "bg-accent/60" : ""
                  }`}
                >
                  <div className="truncate">{it.label}</div>
                  {it.hint ? (
                    <div className="text-xs text-muted-foreground truncate">
                      {it.hint}
                    </div>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Types --------------------------------- */
type Account = {
  accountID: number;
  accountName: string;
  accountTypeID: number;
};

type Line = {
  id: string;
  accountID: string; // select value (string); convert to number on submit
  side: "Debit" | "Credit";
  amount: string; // input value; convert to number on submit
  memo?: string;
};

interface AddPurchaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

/* ------------------------------- Constants -------------------------------- */
const SUPPLIER_ACCOUNT_ID = 3; // Supplier control/account payable

export function AddPurchaseDrawer({
  isOpen,
  onClose,
  onSubmit,
}: AddPurchaseDrawerProps) {
  const [formData, setFormData] = useState({
    supplierID: "",
    date: "",
    billAmount: "", // will be auto set & read-only
    narration: "",
    invoiceNumber: "",
    dueDate: "",
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currencies, setCurrencies] = useState<
    { currencyId: number; currencyCode: string; currencyName: string }[]
  >([]);
  const [isSupplierDrawerOpen, setIsSupplierDrawerOpen] = useState(false);

  // Start with one editable line
  const [lines, setLines] = useState<Line[]>([
    {
      id: crypto.randomUUID(),
      accountID: "",
      side: "Debit",
      amount: "",
      memo: "",
    },
  ]);

  const { fullName } = useUserFromLocalStorage();
  const hotelCurrency = useStoredCurrencyCode();

  console.log("hotelCurrency : ", hotelCurrency);

  const dispatch = useDispatch<AppDispatch>();
  const { data: nameMasterData, loading: suppliersLoading } = useSelector(
    (s: RootState) => s.nameMaster
  );

  const posting = useSelector(selectGlTxnCreateLoading);
  const postError = useSelector(selectGlTxnCreateError);
  const lastPosted = useSelector(selectGlTxnCreateLast);

  const suppliers = useMemo(
    () =>
      (nameMasterData || [])
        .filter((e: any) => e?.tranCode === "45" && e?.name?.trim())
        .map((s: any) => ({
          nameID: s.nameID,
          name: s.name,
          tranCode: s.tranCode,
        })),
    [nameMasterData]
  );

  const supplierItems = useMemo(
    () =>
      suppliers.map((s) => ({
        value: s.nameID.toString(),
        label: s.name || `Supplier #${s.nameID}`,
        hint: `ID ${s.nameID}`,
      })),
    [suppliers]
  );

  const accountItems = useMemo(
    () =>
      (accounts || []).map((acc) => ({
        value: acc.accountID.toString(),
        label: `${acc.accountName} (${acc.accountID})`,
        hint: `Type ${acc.accountTypeID}`,
      })),
    [accounts]
  );

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNameMasterByHotel());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    const tokenData = localStorage.getItem("hotelmateTokens");
    const parsed = tokenData ? JSON.parse(tokenData) : null;
    const accessToken = parsed?.accessToken;
    if (!accessToken) return;

    getGlAccounts({ token: accessToken })
      .then((data) => {
        const filtered = Array.isArray(data)
          ? data
              .filter((a: any) => [11, 12].includes(Number(a?.accountTypeID)))
              .sort((a: any, b: any) =>
                String(a?.accountName || "").localeCompare(
                  String(b?.accountName || "")
                )
              )
          : [];
        setAccounts(filtered);
      })
      .catch((err) => console.error("GL Account fetch error:", err));

    getAllCurrencies()
      .then((data) => setCurrencies(data))
      .catch((err) => console.error("Currency fetch error:", err));
  }, []);

  useEffect(() => {
    if (isOpen) dispatch(resetGlTransactionState());
  }, [isOpen, dispatch]);

  const addPurchase = useTranslatedText("Add Purchase");
  const supplierLabel = useTranslatedText("Supplier");
  const dateLabel = useTranslatedText("Purchase Date");
  const saveLabel = useTranslatedText("Save");
  const cancelLabel = useTranslatedText("Cancel");
  const enterPurchaseDetails = useTranslatedText(
    "Enter the details for the new purchase"
  );

  const safeFloat = (v: string) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const totals = useMemo(() => {
    const debit = lines
      .filter((l) => l.side === "Debit")
      .reduce((s, l) => s + safeFloat(l.amount), 0);
    const credit = lines
      .filter((l) => l.side === "Credit")
      .reduce((s, l) => s + safeFloat(l.amount), 0);
    return { debit, credit };
  }, [lines]);

  // ✅ Auto-fill Reference Amount with the GL total and make it read-only
  useEffect(() => {
    const ref = Math.max(totals.debit, totals.credit) || 0;
    setFormData((p) => ({ ...p, billAmount: ref.toFixed(2) }));
  }, [totals.debit, totals.credit]);

  const formattedCurrency = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: hotelCurrency,
      maximumFractionDigits: 2,
    }).format(n);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const addLine = () => {
    setLines((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        accountID: "",
        side: "Debit",
        amount: "",
        memo: "",
      },
    ]);
  };

  const removeLine = (id: string) => {
    setLines((p) => (p.length <= 1 ? p : p.filter((l) => l.id !== id))); // keep at least 1
  };

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierID) return alert("Please select a supplier.");
    if (!formData.date) return alert("Please select a purchase date.");
    if (
      lines.some((l) => !l.accountID || !l.amount || isNaN(Number(l.amount)))
    ) {
      return alert("Each line requires an account and a valid amount.");
    }

    const supplierObj = suppliers.find(
      (s) => s.nameID.toString() === formData.supplierID
    );
    onSubmit({ ...formData, supplierName: supplierObj?.name || "" });

    const nowIso = new Date().toISOString();
    const selectedPropertyRaw = localStorage.getItem("selectedProperty");
    const property = selectedPropertyRaw
      ? JSON.parse(selectedPropertyRaw)
      : null;
    const hotelCode = property?.hotelCode ? String(property.hotelCode) : "";

    // 1) Build GL lines from user selection
    //    ✅ credits go out as NEGATIVE currAmount
    const userLines = lines.map((l) => {
      const amt = safeFloat(l.amount);
      const isCredit = l.side === "Credit";
      const signed = isCredit ? -amt : amt; // credit negative, debit positive

      return {
        // --- required / existing ---
        accountID: Number(l.accountID),
        debit: isCredit ? 0 : amt,
        credit: isCredit ? amt : 0,
        memo: l.memo || formData.narration || "",

        tranDate: formData.date
          ? new Date(formData.date + "T00:00:00").toISOString()
          : nowIso,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate + "T00:00:00").toISOString()
          : undefined,
        docNo: formData.invoiceNumber || "",
        comment: formData.narration || "",
        currencyCode: hotelCurrency || "LKR",
        currAmount: signed, // keep your existing currAmount sign rule
        convRate: "1",
        supplierInvoNo: formData.invoiceNumber || "",

        // --- NEW: always filled ---
        amount: signed, // <— fill amount (signed)
        finAct: false, // <— fill finAct
        tranTypeID: 19, // <— fill tranTypeID
      };
    });

    // 2) Compute imbalance & auto-append Supplier control line (ID = 3)
    const totalDebit = userLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = userLines.reduce((s, l) => s + l.credit, 0);
    const diff = +(totalDebit - totalCredit).toFixed(2); // >0 => need CREDIT; <0 => need DEBIT

    const glAccTransactions = [...userLines];

    if (Math.abs(diff) > 0.0001) {
      const needCredit = diff > 0; // net debit -> credit supplier
      const abs = Math.abs(diff);
      const signed = needCredit ? -abs : abs; // credit negative, debit positive

      glAccTransactions.push({
        // --- required / existing ---
        accountID: SUPPLIER_ACCOUNT_ID,
        debit: needCredit ? 0 : abs,
        credit: needCredit ? abs : 0,
        memo:
          formData.narration ||
          `Supplier balance (${supplierObj?.name || formData.supplierID})`,
        tranDate: formData.date
          ? new Date(formData.date + "T00:00:00").toISOString()
          : nowIso,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate + "T00:00:00").toISOString()
          : undefined,
        docNo: formData.invoiceNumber || "",
        comment: formData.narration || "",
        currencyCode: hotelCurrency || "LKR",
        currAmount: signed,
        convRate: "1",
        supplierInvoNo: formData.invoiceNumber || "",
        paymentReceiptRef: formData.invoiceNumber || "",

        // --- NEW: always filled ---
        amount: signed, // <— fill amount (signed)
        finAct: false, // <— fill finAct
        tranTypeID: 19, // <— fill tranTypeID
      });
    }

    // 3) Header reference value mirrors the (auto) total; UI has already synced it
    const headerTranValue =
      Number(formData.billAmount) || totalDebit || totalCredit || 0;

    const payload = {
      hotelCode,
      finAct: false,
      tranTypeId: 19, // Purchase
      tranDate: formData.date
        ? new Date(formData.date + "T00:00:00").toISOString()
        : nowIso,
      effectiveDate: nowIso,
      docNo: formData.invoiceNumber || "",
      createdOn: nowIso,
      createdBy: fullName || "",
      tranValue: headerTranValue,
      isTaxInclusive: true,
      currencyCode: hotelCurrency,
      remarks: formData.narration || "",
      dueDate: formData.dueDate
        ? new Date(formData.dueDate + "T00:00:00").toISOString()
        : undefined,
      refInvNo: formData.invoiceNumber || "",
      nameID: Number(formData.supplierID), // Supplier (NameMaster) ID
      glAccTransactions, // ✅ no `amount` property; credits carry negative `currAmount`
    };

    try {
      const res = await dispatch(createGlTransaction(payload)).unwrap();
      console.log(
        "✓ createGlTransaction response:",
        JSON.stringify(res, null, 2)
      );

      setFormData({
        supplierID: "",
        date: "",
        billAmount: "",
        narration: "",
        invoiceNumber: "",
        dueDate: "",
      });
      setLines([
        {
          id: crypto.randomUUID(),
          accountID: "",
          side: "Debit",
          amount: "",
          memo: "",
        },
      ]);
      onClose();
    } catch (err) {
      console.error("✗ createGlTransaction failed:", err);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <SheetContent
        side="right"
        className="z-[60] w-full sm:max-w-3xl overflow-y-auto rounded-l-2xl"
        // ✅ keep parent open when supplier drawer is up
        onInteractOutside={(e) => {
          if (isSupplierDrawerOpen) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isSupplierDrawerOpen) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (isSupplierDrawerOpen) e.preventDefault();
        }}
      >
        <SheetHeader>
          <SheetTitle>{addPurchase}</SheetTitle>
          <SheetDescription>{enterPurchaseDetails}</SheetDescription>
        </SheetHeader>

        {postError ? (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <div className="font-semibold">Failed to save transaction</div>
            <div className="opacity-80">
              {(postError as any)?.detail ||
                (postError as any)?.title ||
                "Unknown error"}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplierID">{supplierLabel}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchableDropdown
                  value={formData.supplierID}
                  onChange={(val) => handleSelectChange("supplierID", val)}
                  items={supplierItems}
                  placeholder={
                    suppliersLoading
                      ? "Loading suppliers..."
                      : "Select a supplier"
                  }
                  disabled={suppliersLoading}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setIsSupplierDrawerOpen(true);
                  // fetch latest when opening picker or drawer
                  dispatch(fetchNameMasterByHotel());
                }}
                title="Add new supplier"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Dates & header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{dateLabel}</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                placeholder="e.g. SUPP-INV-000123"
                required
              />
            </div>

            {/* ✅ Reference Amount: read-only; auto shows GL lines total */}
            <div className="space-y-2">
              <Label htmlFor="billAmount">Reference Amount</Label>
              <Input
                id="billAmount"
                name="billAmount"
                value={formData.billAmount}
                readOnly
                disabled
                title="Auto-calculated from GL lines"
              />
            </div>
          </div>

          {/* Narration */}
          <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <textarea
              id="narration"
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              className="w-full border border-input bg-background px-3 py-2 text-sm shadow-sm rounded-md resize-y"
              rows={3}
              placeholder="Optional note to appear in ledger"
            />
          </div>

          {/* Lines (single-side) */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">GL Lines</Label>

            <div className="rounded-xl border bg-card">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground border-b">
                <div className="col-span-5">Account</div>

                <div className="col-span-3">Amount</div>
                <div className="col-span-3">Memo</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b last:border-b-0"
                >
                  {/* Account */}
                  <div className="col-span-5">
                    <SearchableDropdown
                      value={line.accountID}
                      onChange={(v) => updateLine(line.id, { accountID: v })}
                      items={accountItems}
                      placeholder="Select account"
                    />
                  </div>

                  {/* Side */}
                  {/* <div className="col-span-2">
                    <Select
                      value={line.side}
                      onValueChange={(v: "Debit" | "Credit") =>
                        updateLine(line.id, { side: v })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Debit">Debit</SelectItem>
                        <SelectItem value="Credit">Credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}

                  {/* Amount */}
                  <div className="col-span-3">
                    <Input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={line.amount}
                      onChange={(e) =>
                        updateLine(line.id, { amount: e.target.value })
                      }
                      className="text-right"
                    />
                  </div>

                  {/* Memo */}
                  <div className="col-span-3">
                    <Input
                      placeholder="—"
                      value={line.memo ?? ""}
                      onChange={(e) =>
                        updateLine(line.id, { memo: e.target.value })
                      }
                    />
                  </div>

                  {/* Remove */}
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(line.id)}
                      title="Remove line"
                      disabled={lines.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="px-3 py-3">
                <div className="flex flex-wrap items-center justify-end gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total Debit</span>
                    <span className="font-semibold">
                      {formattedCurrency(totals.debit)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total Credit</span>
                    <span className="font-semibold">
                      {formattedCurrency(totals.credit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Move Add Line button UNDER the lines, aligned left */}
            <div className="flex justify-start">
              <Button type="button" variant="outline" onClick={addLine}>
                <Plus className="w-4 h-4 mr-1" /> Add Line
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={posting || lines.length === 0}>
              {posting ? "Saving..." : saveLabel}
            </Button>
          </div>
        </form>
      </SheetContent>

      <AddSupplierDrawer
        isOpen={isSupplierDrawerOpen}
        onClose={() => setIsSupplierDrawerOpen(false)}
        onSubmit={() => {
          setIsSupplierDrawerOpen(false);
          dispatch(fetchNameMasterByHotel());
        }}
        contentClassName="z-[80]"
      />
    </Sheet>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/redux/store";

import { useUserFromLocalStorage } from "@/hooks/useUserFromLocalStorage";
import { createGlTransaction } from "@/redux/slices/glTransactionCreateSlice";
import {
  fetchGlAccounts,
  selectGlAccountList,
  selectGlAccountListLoading,
  selectGlAccountListError,
} from "@/redux/slices/glAccountSlice";
import { useAppToast } from "../toast/useAppToast";
import { useToast } from "../toast/ToastProvider";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
// If you have the cn helper; otherwise remove it and inline classNames.
import { cn } from "@/lib/utils";

const EXPENSE_TRAN_TYPE_ID = 20; // header + lines
const BANK_ACCOUNT_TYPE_ID = 19; // bank accounts
const EXPENSE_ACCOUNT_TYPE_ID = 12; // expense accounts
const ALLOWED_ACCOUNT_TYPES = new Set([11, 12]);
type AddExpenseDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddExpenseDrawer({ isOpen, onClose }: AddExpenseDrawerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { fullName } = useUserFromLocalStorage();

  const [hotelId, setHotelId] = useState<number | null>(null);
  const [hotelCode, setHotelCode] = useState<string>("");
  const { show } = useToast();

  const [expensePopoverOpen, setExpensePopoverOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    expenseAccountID: "",
    bankAccountID: "",
    description: "",
    remark: "",
  });

  // Load selected property
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("selectedProperty");
    const prop = raw ? JSON.parse(raw) : {};
    setHotelId(prop?.id ?? null);
    setHotelCode(prop?.hotelCode);
  }, []);

  console.log("hotel code : ", hotelCode);

  // Fetch GL accounts
  useEffect(() => {
    (dispatch as any)(fetchGlAccounts());
  }, [dispatch]);

  const glAccounts = useSelector(selectGlAccountList) as
    | Array<{
        accountID: number;
        accountTypeID: number;
        accountCode: string;
        accountName: string;
        description?: string | null;
        finAct: boolean;
        hotelID: string | number;
      }>
    | [];

  // Helpers to format option label
  const fmtName = (s: string) => s?.replace(/\s+/g, " ").trim();

  // Expense accounts (from your sample array)
  const expenseAccounts = useMemo(
    () =>
      (glAccounts ?? [])
        .filter((acc) => {
          const sameHotel =
            String(acc?.hotelID) === String(hotelId) ||
            String(acc?.hotelID) === "0";
          const isAllowedType = ALLOWED_ACCOUNT_TYPES.has(
            Number(acc?.accountTypeID)
          );
          const isActive = acc?.finAct === false; // keep only non-finalized/inactive as you had
          return sameHotel && isAllowedType && isActive;
        })
        // optional: sort nicely by name
        .sort((a, b) =>
          String(a.accountName || "").localeCompare(String(b.accountName || ""))
        ),
    [glAccounts, hotelId]
  );

  // Bank accounts
  const bankAccounts = useMemo(
    () =>
      (Array.isArray(glAccounts) ? glAccounts : []).filter(
        (acc) =>
          (acc.hotelID === String(hotelId) || acc.hotelID === "0") &&
          acc.accountTypeID === 1 &&
          acc.finAct === false
      ),
    [glAccounts, hotelId]
  );

  console.log("bankAccounts : ", hotelId);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () =>
    setFormData({
      date: "",
      amount: "",
      expenseAccountID: "",
      bankAccountID: "",
      description: "",
      remark: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.date ||
      !formData.amount ||
      !formData.expenseAccountID ||
      !formData.bankAccountID ||
      !formData.description
    ) {
      // toast.error("Please fill all required fields");
      return;
    }

    const amt = Number.parseFloat(formData.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      // toast.error("Amount must be a positive number");
      return;
    }

    const nowIso = new Date().toISOString();
    const headerDate = formData.date; // yyyy-mm-dd

    const payload = {
      glAccTransactions: [
        {
          // EXPENSE (DEBIT)
          finAct: false,
          accountID: Number(formData.expenseAccountID),
          amount: amt,
          debit: amt,
          credit: 0,
          docNo: "",
          comment: formData.description,
          createdOn: nowIso,
          createdBy: fullName || "",
          tranTypeID: EXPENSE_TRAN_TYPE_ID, // <- line-level
          refAccountID: 0,
          siteID: 0,
          memo: formData.description,
          tranDate: headerDate,
          dueDate: headerDate,
          chequeDate: headerDate,
          chequePrinted: false,
          paymentVoucherNo: "",
          offSetAccID: 0,
          chequeNo: "",
          supplierInvoNo: "",
          taxCode: "",
          costCenterID: 0,
          billRef: "",
          paymentReceiptRef: "",
          reconciled: 0,
          recDate: headerDate,
          currAmount: amt,
          currDebit: amt,
          currCredit: 0,
          active: true,
          isDue: false,
          isArrears: false,
          isEarlySettlement: false,
          split: "",
          narration: formData.remark || "",
          effectiveDate: headerDate,
          currencyCode: "LKR",
          amtInCurr: amt,
          currCode: "LKR",
          convRate: "1",
          cardType: "",
          reservationDetailID: 0,
        },
        {
          // BANK (CREDIT)
          finAct: false,
          accountID: Number(formData.bankAccountID),
          amount: -amt,
          debit: 0,
          credit: amt,
          docNo: "",
          comment: `Bank credit - ${formData.description}`,
          createdOn: nowIso,
          createdBy: fullName || "",
          tranTypeID: EXPENSE_TRAN_TYPE_ID, // <- line-level
          refAccountID: 0,
          siteID: 0,
          memo: `Bank credit - ${formData.description}`,
          tranDate: headerDate,
          dueDate: headerDate,
          chequeDate: headerDate,
          chequePrinted: false,
          paymentVoucherNo: "",
          offSetAccID: 0,
          chequeNo: "",
          supplierInvoNo: "",
          taxCode: "",
          costCenterID: 0,
          billRef: "",
          paymentReceiptRef: "",
          reconciled: 0,
          recDate: headerDate,
          currAmount: -amt,
          currDebit: 0,
          currCredit: amt,
          active: true,
          isDue: false,
          isArrears: false,
          isEarlySettlement: false,
          split: "",
          narration: formData.remark || "",
          effectiveDate: headerDate,
          currencyCode: "LKR",
          amtInCurr: -amt,
          currCode: "LKR",
          convRate: "1",
          cardType: "",
          reservationDetailID: 0,
        },
      ],

      // Header
      finAct: false,
      hotelCode,
      tranTypeId: EXPENSE_TRAN_TYPE_ID, // 20
      tranDate: headerDate,
      docNo: "",
      createdOn: nowIso,
      createdBy: fullName || "",
      posted: false,
      nameID: 0,
      tranValue: amt,
      currencyCode: "LKR",
      exchangeRate: 1,
      remarks: formData.remark || "",
      isTaxInclusive: false,
      invoiceType: "Expenses",
    };

    try {
      await dispatch(createGlTransaction(payload as any)).unwrap();

      show({
        variant: "success",
        title: "Recorded successfully!",
        description: "Expense recorded successfully!",
      });
      resetForm();
      onClose();
    } catch (err: any) {
      const msg =
        err?.detail ||
        err?.title ||
        (typeof err === "string" ? err : "Failed to post GL transaction");
      // toast.error(msg);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto rounded-l-2xl">
        <SheetHeader>
          <SheetTitle>Add Expense</SheetTitle>
          <SheetDescription>Enter the expense details</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Expense (Debit) */}
          <div className="space-y-2">
            <Label htmlFor="expenseAccountID">Expense Type/Account</Label>

            <Popover
              open={expensePopoverOpen}
              onOpenChange={setExpensePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={expensePopoverOpen}
                  className="w-full justify-between"
                  id="expenseAccountID"
                >
                  {(() => {
                    const sel = expenseAccounts.find(
                      (a) =>
                        String(a.accountID) ===
                        String(formData.expenseAccountID)
                    );
                    return sel
                      ? `${sel.accountCode} — ${fmtName(sel.accountName)}`
                      : "Select expense type/account";
                  })()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search accounts..." autoFocus />
                  <CommandList>
                    <CommandEmpty>No account found.</CommandEmpty>
                    <CommandGroup heading="Expense accounts">
                      {expenseAccounts.map((acc) => {
                        const value = String(acc.accountID);
                        const selected =
                          String(formData.expenseAccountID) === value;
                        return (
                          <CommandItem
                            key={acc.accountID}
                            value={`${acc.accountCode} ${acc.accountName} ${acc.accountID}`}
                            onSelect={() => {
                              setFormData((p: any) => ({
                                ...p,
                                expenseAccountID: value,
                              }));
                              setExpensePopoverOpen(false); // ← close after select
                            }}
                            className="flex items-center gap-2"
                          >
                            <Check
                              className={`h-4 w-4 ${
                                selected ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <span className="truncate">
                              {acc.accountCode} — {fmtName(acc.accountName)}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Bank (Credit) */}
          <div className="space-y-2">
            <Label htmlFor="bankAccountID">Paid Using</Label>
            <select
              id="bankAccountID"
              name="bankAccountID"
              className="w-full border rounded-md p-2 text-sm"
              value={formData.bankAccountID}
              onChange={handleChange}
              required
            >
              <option value="">Select bank/cash account</option>
              {bankAccounts.map((acc) => (
                <option key={acc.accountID} value={acc.accountID}>
                  {acc.accountCode} — {fmtName(acc.accountName)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Electricity Bill - April"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              placeholder="Optional remarks (e.g., invoice #)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

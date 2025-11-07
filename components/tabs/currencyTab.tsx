// components/tabs/CurrencyTab.tsx
"use client";

import { useMemo, useState } from "react";
import { DollarSign, Edit, Filter, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslatedText } from "@/lib/translation";
import { AddCurrencyDrawer } from "@/components/drawers/add-currency-drawer";

type Props = {
  defaultCode?: string; // e.g., hotelData.currencyCode
};

export default function CurrencyTab({ defaultCode = "USD" }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  // seed with some dummy data; mark default using defaultCode
  const [currenciesData, setCurrenciesData] = useState(() => {
    const base = [
      {
        id: "C-001",
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        exchangeRate: 1.0,
        isDefault: false,
      },
      {
        id: "C-002",
        code: "EUR",
        name: "Euro",
        symbol: "€",
        exchangeRate: 0.92,
        isDefault: false,
      },
      {
        id: "C-003",
        code: "GBP",
        name: "British Pound",
        symbol: "£",
        exchangeRate: 0.79,
        isDefault: false,
      },
      {
        id: "C-004",
        code: "JPY",
        name: "Japanese Yen",
        symbol: "¥",
        exchangeRate: 134.56,
        isDefault: false,
      },
    ];
    return base.map((c) => ({ ...c, isDefault: c.code === defaultCode }));
  });

  const currency = useTranslatedText("Currency");
  const addCurrency = useTranslatedText("Add Currency");
  const search = useTranslatedText("Search");
  const filter = useTranslatedText("Filter");
  const noCurrencies = useTranslatedText("No currencies found");
  const codeText = useTranslatedText("Code");
  const nameText = useTranslatedText("Name");
  const symbolText = useTranslatedText("Symbol");
  const exchangeRateText = useTranslatedText("Exchange Rate");
  const defaultText = useTranslatedText("Default");
  const actionsText = useTranslatedText("Actions");
  const yesText = useTranslatedText("Yes");
  const noText = useTranslatedText("No");
  const addCurrencyToGetStartedText = useTranslatedText(
    "Add a currency to get started"
  );

  const handleAddCurrency = (data: any) => {
    // If new currency is default, clear previous defaults
    let updated = [...currenciesData];
    if (data.isDefault) {
      updated = updated.map((c) => ({ ...c, isDefault: false }));
    }
    const newCurrency = {
      id: `C-${String(Date.now()).slice(-6)}`, // simple unique id
      code: data.code,
      name: data.name,
      symbol: data.symbol,
      exchangeRate: Number.parseFloat(data.exchangeRate),
      isDefault: !!data.isDefault,
    };
    setCurrenciesData([...updated, newCurrency]);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currenciesData;
    return currenciesData.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [currenciesData, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{currency}</h2>
        <Button onClick={() => setIsAddDrawerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {addCurrency}
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`${search}...`}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          {filter}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{currency}</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{codeText}</TableHead>
                  <TableHead>{nameText}</TableHead>
                  <TableHead>{symbolText}</TableHead>
                  <TableHead>{exchangeRateText}</TableHead>
                  <TableHead>{defaultText}</TableHead>
                  <TableHead>{actionsText}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((curr) => (
                  <TableRow key={curr.id}>
                    <TableCell className="font-medium">{curr.code}</TableCell>
                    <TableCell>{curr.name}</TableCell>
                    <TableCell>{curr.symbol}</TableCell>
                    <TableCell>{curr.exchangeRate.toFixed(2)}</TableCell>
                    <TableCell>
                      {curr.isDefault ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {yesText}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{noText}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          disabled={curr.isDefault}
                          onClick={() =>
                            setCurrenciesData((prev) =>
                              prev.filter((c) => c.id !== curr.id)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="mb-2 text-lg font-medium">{noCurrencies}</p>
              <p className="text-sm text-muted-foreground">
                {addCurrencyToGetStartedText}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddCurrencyDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSubmit={handleAddCurrency}
      />
    </div>
  );
}

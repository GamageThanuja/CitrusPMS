import { useState, useEffect } from "react";

export const useStoredCurrencyCode = (): string | null => {
  const [currencyCode, setCurrencyCode] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem("selectedProperty");
    if (!raw) return null;

    try {
      const property = JSON.parse(raw);
      return property?.hotelCurrency || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem("selectedProperty");
    if (!raw) return;

    try {
      const property = JSON.parse(raw);
      setCurrencyCode(property?.hotelCurrency || null);
    } catch {
      setCurrencyCode(null);
    }
  }, []);

  return currencyCode;
};

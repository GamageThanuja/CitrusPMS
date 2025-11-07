import { useEffect, useState } from "react";

export const useCurrency = (): string | null => {
  const [currency, setCurrency] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("currencyCode") || null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const trySetCurrency = () => {
      try {
        const hotelsRaw = localStorage.getItem("hotels");
        const selectedRaw = localStorage.getItem("selectedProperty");

        if (!hotelsRaw || !selectedRaw) return;

        const hotels = JSON.parse(hotelsRaw);
        const selected = JSON.parse(selectedRaw);

        const matchedHotel = hotels.find(
          (hotel: any) => hotel.id === selected.id
        );

        if (matchedHotel?.currencyCode) {
          setCurrency(matchedHotel.currencyCode);
          localStorage.setItem("currencyCode", matchedHotel.currencyCode);
        } else {
          setCurrency(null);
        }
      } catch (err) {
        console.error("Failed to extract currency code:", err);
        setCurrency(null);
      }
    };

    trySetCurrency();

    // Retry a few times if null
    const retryInterval = setInterval(() => {
      if (!currency) trySetCurrency();
    }, 300); // 300ms retry

    const timeout = setTimeout(() => {
      clearInterval(retryInterval);
    }, 3000); // stop retrying after 3s

    return () => {
      clearInterval(retryInterval);
      clearTimeout(timeout);
    };
  }, []);

  return currency;
};

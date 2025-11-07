"use client";

import { useEffect, useState } from "react";

export function useClientStorage() {
  const [localData, setLocalData] = useState({
    hotelId: null,
    accessToken: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedProperty");
      const tokens = localStorage.getItem("hotelmateTokens");

      setLocalData({
        hotelId: stored ? JSON.parse(stored)?.id || null : null,
        accessToken: tokens ? JSON.parse(tokens)?.accessToken || null : null,
      });
    }
  }, []);

  return localData;
}

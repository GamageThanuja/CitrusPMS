"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  startSignalRConnection,
  stopSignalRConnection,
} from "@/lib/SignalRService";

type SignalRContextType = {
  onReservationUpdate: (cb: (data: any) => void) => void;
  isConnected: boolean;
};

const SignalRContext = createContext<SignalRContextType | null>(null);

let updateCallback: (data: any) => void = () => {};

export const SignalRProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    startSignalRConnection(
      (data: any) => {
        updateCallback(data);
      },
      (status: "connected" | "disconnected" | "error") => {
        setIsConnected(status === "connected");
      }
    );

    return () => {
      stopSignalRConnection();
    };
  }, []);

  const onReservationUpdate = (cb: (data: any) => void) => {
    updateCallback = cb;
  };

  return (
    <SignalRContext.Provider value={{ onReservationUpdate, isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalR must be used within a SignalRProvider");
  }
  return context;
};

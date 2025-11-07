// app/providers.tsx
"use client";

import { Provider } from "react-redux";
import store from "@/redux/store";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Bold } from "lucide-react";
import { useEffect } from "react";
import { initEphemeralLocalTokens } from "@/lib/localSessionShim";
import { QRModalProvider } from "@/components/modals/qr-modal";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Make localStorage behave like a session when hmPersist === "session"
    initEphemeralLocalTokens();
  }, []);
  return (
    <Provider store={store}>
      <ThemeProvider
        attribute="class" // adds class to <html>
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        themes={["light", "dark", "system"]}
      >
        <QRModalProvider>{children}</QRModalProvider>
        {/* <Toaster
          position="top-right"
          className="z-[10000]"
          toastOptions={{
            style: {
              width: "300px",
              padding: "16px",
              fontSize: "16px",
              minHeight: "40px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            },
          }}
        /> */}
        <Toaster
          position="top-right"
          closeButton
          style={{ zIndex: 2147483647 }} // max-ish
        />
      </ThemeProvider>
    </Provider>
  );
}

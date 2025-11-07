"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import NotFound from "./not-found";
import { usePathname } from "next/navigation";
import { SignalRProvider } from "@/lib/SignalRContext";
import { Toaster } from "sonner";
import {
  isAuthenticated,
  clearTokens,
  isPublicAllowedPath,
} from "@/lib/auth-client";
import { ToastProvider } from "@/components/toast/ToastProvider";


const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/404") {
    return (
      <html lang="en" suppressHydrationWarning className="transition-colors">
        <body suppressHydrationWarning className={inter.className}>
          <NotFound />
        </body>
      </html>
    );
  }


  // Lazy‑load Google Translate after hydration to avoid SSR/CSR markup mismatch
  useEffect(() => {
    const loadGoogleTranslate = () => {
      if (document.getElementById("google-translate-script")) return;
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      (window as any).googleTranslateElementInit = function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "google_translate_element"
        );
      };
    };

    const removeGoogleTranslateBar = () => {
      const interval = setInterval(() => {
        const frame = document.querySelector("iframe.goog-te-banner-frame");
        if (frame?.parentNode) frame.parentNode.removeChild(frame);
        const banner = document.querySelector(
          ".goog-te-banner-frame.skiptranslate"
        );
        if (banner?.parentNode) banner.parentNode.removeChild(banner);
        document.body.style.top = "0px";
      }, 500);
      setTimeout(() => clearInterval(interval), 10000);
    };

    loadGoogleTranslate();
    window.addEventListener("load", removeGoogleTranslateBar);

    const style = document.createElement("style");
    style.innerHTML = `
      iframe.goog-te-banner-frame { display: none !important; }
      body { top: 0px !important; }
      .goog-te-banner-frame.skiptranslate { display: none !important; }
      .goog-te-gadget-icon { display: none !important; }
      .goog-te-gadget-simple { border: none !important; }
    `;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("load", removeGoogleTranslateBar);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning className="transition-colors">
      <body suppressHydrationWarning className={inter.className}>
        <Providers>
          <SignalRProvider>
              <ToastProvider>
                {/* ✅ REMOVE nested <body> */}
                <div id="overlay-root"></div>
                <div id="app-root">{children}</div>
                <SpeedInsights />

                {/* <Toaster richColors closeButton position="top-right" /> */}
                <Analytics />
              </ToastProvider>
          </SignalRProvider>
        </Providers>
        <div id="google_translate_element" style={{ display: "none" }}></div>
      </body>
    </html>
  );
}

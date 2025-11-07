"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: typeof google.maps;
  }
}

interface Language {
  code: string;
  name: string;
  countryCode: string; // change 'flag' to 'countryCode'
}

const languages: Language[] = [
  { code: "en", name: "English", countryCode: "us" },
  { code: "es", name: "Español", countryCode: "es" },
  { code: "fr", name: "Français", countryCode: "fr" },
  { code: "de", name: "Deutsch", countryCode: "de" },
  { code: "it", name: "Italiano", countryCode: "it" },
  { code: "pt", name: "Português", countryCode: "pt" },
  { code: "ru", name: "Русский", countryCode: "ru" },
  { code: "ja", name: "日本語", countryCode: "jp" },
  { code: "ko", name: "한국어", countryCode: "kr" },
  { code: "zh", name: "中文", countryCode: "cn" },
  { code: "ar", name: "العربية", countryCode: "sa" },
  { code: "hi", name: "हिन्दी", countryCode: "in" },
  { code: "th", name: "ไทย", countryCode: "th" },
  { code: "vi", name: "Tiếng Việt", countryCode: "vn" },
  { code: "nl", name: "Nederlands", countryCode: "nl" },
  { code: "sv", name: "Svenska", countryCode: "se" },
  { code: "si", name: "Sinhala", countryCode: "lk" },
];

// Removed pageLanguage: 'en' from googleTranslateElementInit initialization
if (typeof window !== "undefined" && !window.googleTranslateElementInit) {
  window.googleTranslateElementInit = () => {
    new (window as any).google.translate.TranslateElement(
      {
        includedLanguages: languages.map((lang) => lang.code).join(","),
        layout: (window as any).google.translate.TranslateElement.InlineLayout
          .SIMPLE,
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };
}

const LanguageSelector = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    languages[0]
  );
  const [isTranslateReady, setIsTranslateReady] = useState(false);

  useEffect(() => {
    // Check if Google Translate is ready
    const checkTranslateReady = () => {
      if (window.google && (window.google as any).translate) {
        setIsTranslateReady(true);
        return true;
      }
      if (window.google && (window.google as any).translate) {
        setIsTranslateReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkTranslateReady()) {
      return;
    }

    // If not ready, check periodically
    const interval = setInterval(() => {
      if (checkTranslateReady()) {
        clearInterval(interval);
      }
    }, 100);

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    const cookieMatch = document.cookie.match(/googtrans=\/([^/]+)\/([^/]+)/);
    const cookieTarget = cookieMatch?.[2];

    const effectiveLangCode =
      (cookieTarget &&
        languages.some((l) => l.code === cookieTarget) &&
        cookieTarget) ||
      (savedLanguage &&
        languages.some((l) => l.code === savedLanguage) &&
        savedLanguage) ||
      "en";

    const lang = languages.find((l) => l.code === effectiveLangCode);
    setCurrentLanguage(lang ?? languages[0]);
  }, [isTranslateReady]);

  const translateToLanguage = (languageCode: string) => {
    if (
      !isTranslateReady ||
      !window.google ||
      !(window.google as any).translate
    ) {
      console.warn("Google Translate not ready yet");
      return;
    }
    if (
      !isTranslateReady ||
      !window.google ||
      !(window.google as any).translate
    ) {
      console.warn("Google Translate not ready yet");
      return;
    }
    const selectedLanguage = languages.find(
      (lang) => lang.code === languageCode
    );
    if (selectedLanguage) {
      setCurrentLanguage(selectedLanguage);
      // Save language preference
      localStorage.setItem("selectedLanguage", languageCode);
    }

    try {
      // Method 1: Try to find existing combo element
      let selectElement = document.querySelector(
        ".goog-te-combo"
      ) as HTMLSelectElement;

      if (!selectElement) {
        // Method 2: Use URL hash method directly (more reliable)
        console.log("Using URL hash method for", languageCode);
        history.replaceState(
          null,
          "",
          window.location.pathname +
            window.location.search +
            `#googtrans(en|${languageCode})`
        );
        window.location.reload();
        return;
      }

      // If combo element exists, use it directly
      if (selectElement.value !== languageCode) {
        selectElement.value = languageCode;
        selectElement.dispatchEvent(new Event("change"));
      }
    } catch (error) {
      console.error("Error translating page:", error);
      // Fallback method using URL hash
      history.replaceState(
        null,
        "",
        window.location.pathname +
          window.location.search +
          `#googtrans(en|${languageCode})`
      );
      window.location.reload();
    }
  };

  const resetToOriginal = () => {
    console.log("EMERGENCY RESET TO ENGLISH");

    // Remove all Google Translate related data
    localStorage.removeItem("googtrans");
    localStorage.removeItem("googtrans/en");
    localStorage.removeItem("selectedLanguage");

    // Remove cookies with domain-scoped removal
    const domain = window.location.hostname;
    document.cookie =
      "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" +
      domain;
    document.cookie =
      "googtrans=/auto/en; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" +
      domain;

    // Clear the hash (set to English translation state)
    window.location.hash = "googtrans(en|en)";

    // Attempt to interact with the Google Translate banner to reset state
    const iframe = document.getElementsByClassName(
      "goog-te-banner-frame"
    )[0] as HTMLIFrameElement;
    if (iframe) {
      const innerDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (innerDoc) {
        const restoreButtons = innerDoc.getElementsByTagName("button");
        for (let i = 0; i < restoreButtons.length; i++) {
          if (restoreButtons[i].id.indexOf("restore") >= 0) {
            restoreButtons[i].click();
            const closeLinks =
              innerDoc.getElementsByClassName("goog-close-link");
            if (closeLinks.length > 0) {
              (closeLinks[0] as HTMLElement).click();
            }
            break;
          }
        }
      }
    }

    // Reload page to re-render original content
    window.location.reload();
  };

  const handleLanguageSelect = (languageCode: string) => {
    console.log("Selected language:", languageCode);

    if (languageCode === "en") {
      // FORCE reset to English
      resetToOriginal();
    } else {
      translateToLanguage(languageCode);
    }
  };

  return (
    <div className="relative">
      {/* Custom Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white/90 dark:bg-black transition-all duration-200 shadow-lg notranslate"
            disabled={!isTranslateReady}
          >
            <img
              src={`https://flagcdn.com/w20/${currentLanguage.countryCode}.png`}
              alt={currentLanguage.name}
              className="mr-1 w-4 h-3 object-cover rounded-sm"
            />
            <span className="hidden sm:inline text-sm">
              {currentLanguage.name}
            </span>
            <span className="sm:hidden text-xs">
              {currentLanguage.code.toUpperCase()}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 max-h-80 overflow-y-auto bg-white/95 dark:bg-black backdrop-blur-sm border-white/30 notranslate"
          sideOffset={8}
        >
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">
              Select Language
            </div>
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                className={`cursor-pointer rounded-md transition-colors ${
                  currentLanguage.code === language.code
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                <img
                  src={`https://flagcdn.com/w20/${language.countryCode}.png`}
                  alt={language.name}
                  className="mr-3 w-4 h-3 object-cover rounded-sm"
                />
                <span className="text-sm">{language.name}</span>
                {currentLanguage.code === language.code && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </div>
          {!isTranslateReady && (
            <div className="p-2 text-xs text-gray-500 text-center border-t">
              Loading translator...
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LanguageSelector;

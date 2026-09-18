"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isFeatured?: boolean;
}

export const LANGUAGES: Language[] = [
  // Primary Focus
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", isFeatured: true },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", isFeatured: true },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "中文 (简体)", flag: "🇨🇳", isFeatured: true },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", isFeatured: true },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", isFeatured: true },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", isFeatured: true },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩", isFeatured: true },

  // Worldwide Major Languages
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "tl", name: "Tagalog", nativeName: "Filipino", flag: "🇵🇭" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
];

interface LanguageContextType {
  currentLang: string;
  setLanguage: (code: string) => void;
  languages: Language[];
  currentLanguageObj: Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLang, setCurrentLang] = useState<string>("en");

  // Read existing cookie on mount
  useEffect(() => {
    try {
      const match = document.cookie.match(/googtrans=\/([^/]+)\/([^;]+)/);
      if (match && match[2]) {
        setCurrentLang(match[2]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initialize Google Translate Script
  useEffect(() => {
    // Inject custom CSS to hide Google banner & toolbars
    const style = document.createElement("style");
    style.id = "seoralink-translate-styles";
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate,
      .goog-te-banner-frame {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
      }
      body {
        top: 0px !important;
        position: static !important;
      }
      #google_translate_element {
        display: none !important;
      }
      .goog-tooltip,
      .goog-tooltip:hover {
        display: none !important;
      }
      .goog-text-highlight {
        background-color: transparent !important;
        box-shadow: none !important;
      }
      .skiptranslate iframe {
        display: none !important;
      }
      #goog-gt-tt,
      .goog-te-balloon-frame {
        display: none !important;
      }
    `;
    if (!document.getElementById("seoralink-translate-styles")) {
      document.head.appendChild(style);
    }

    // Google translate init callback
    (window as any).googleTranslateElementInit = () => {
      if ((window as any).google && (window as any).google.translate) {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: LANGUAGES.map((l) => l.code).join(","),
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const setLanguage = (code: string) => {
    setCurrentLang(code);
    try {
      // Set cookies for both / and current domain
      const domain = window.location.hostname;
      const cookieVal = `/auto/${code}`;

      document.cookie = `googtrans=${cookieVal}; path=/; max-age=31536000`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${domain}; max-age=31536000`;
      if (domain.includes(".")) {
        const rootDomain = domain.split(".").slice(-2).join(".");
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${rootDomain}; max-age=31536000`;
      }

      // Also try to trigger the Google Translate select element if present
      const selectEl = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (selectEl) {
        selectEl.value = code;
        selectEl.dispatchEvent(new Event("change"));
      } else {
        // Fallback reload so Google Translate picks up the cookie
        window.location.reload();
      }
    } catch (e) {
      console.error("Language switch error:", e);
      window.location.reload();
    }
  };

  const currentLanguageObj =
    LANGUAGES.find((l) => l.code.toLowerCase() === currentLang.toLowerCase()) || LANGUAGES[1]; // default English

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setLanguage,
        languages: LANGUAGES,
        currentLanguageObj,
      }}
    >
      {/* Hidden container for Google Translate Widget */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

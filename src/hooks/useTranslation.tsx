import { createContext, useContext, ReactNode, useMemo } from "react";
import { getTranslation, Language, TranslationKeys } from "@/i18n";
import { useUserPreferences } from "./useUserPreferences";

interface TranslationContextValue {
  t: TranslationKeys;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreference } = useUserPreferences();
  
  const value = useMemo(() => ({
    t: getTranslation(preferences.language),
    language: preferences.language,
    setLanguage: (lang: Language) => updatePreference("language", lang),
  }), [preferences.language, updatePreference]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}

// Helper hook for components that might be outside provider
export function useTranslationSafe() {
  const context = useContext(TranslationContext);
  if (!context) {
    // Return default translations if no provider
    return {
      t: getTranslation("pt-BR"),
      language: "pt-BR" as Language,
      setLanguage: () => {},
    };
  }
  return context;
}

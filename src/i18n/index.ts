import { ptBR, TranslationKeys } from "./translations/pt-BR";
import { enUS } from "./translations/en-US";
import { esES } from "./translations/es-ES";

export type Language = "pt-BR" | "en-US" | "es-ES";

const translations: Record<Language, TranslationKeys> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-ES": esES,
};

export function getTranslation(language: Language): TranslationKeys {
  return translations[language] || ptBR;
}

export { ptBR, enUS, esES };
export type { TranslationKeys };

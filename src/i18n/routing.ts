import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-BR", "en-US", "es-ES", "fr-FR", "it-IT", "ja-JP", "zh-CN"],
  defaultLocale: "pt-BR",
  localePrefix: "as-needed",
});

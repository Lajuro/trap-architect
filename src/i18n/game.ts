import ptBR from "./messages/pt-BR.json";
import enUS from "./messages/en-US.json";

type Messages = typeof ptBR;

const messages: Record<string, Messages> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

let currentLocale = "pt-BR";

export function setGameLocale(locale: string) {
  if (messages[locale]) {
    currentLocale = locale;
  }
}

export function getGameLocale(): string {
  return currentLocale;
}

/**
 * Get a translated string for use in Phaser scenes.
 * Supports dot-notation keys like "game.pause.title"
 * and simple {param} interpolation.
 */
export function gt(key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = messages[currentLocale];

  for (const k of keys) {
    if (value == null) return key;
    value = value[k];
  }

  if (typeof value !== "string") return key;

  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, name) =>
      params[name] !== undefined ? String(params[name]) : `{${name}}`
    );
  }

  return value;
}

/**
 * Get a translated array (e.g. campaign troll messages).
 */
export function gtArray(key: string): string[] {
  const keys = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = messages[currentLocale];

  for (const k of keys) {
    if (value == null) return [];
    value = value[k];
  }

  return Array.isArray(value) ? value : [];
}

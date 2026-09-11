export const LOCALE_COOKIE = "locale";
export const LOCALES = ["en", "ms"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

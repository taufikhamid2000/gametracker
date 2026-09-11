import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n";
import { en } from "@/lib/dictionaries/en";
import { ms } from "@/lib/dictionaries/ms";

const dictionaries = { en, ms };

export async function getDictionary(): Promise<{ locale: Locale; t: typeof en }> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(localeCookie) ? localeCookie : "en";
  return { locale, t: dictionaries[locale] };
}

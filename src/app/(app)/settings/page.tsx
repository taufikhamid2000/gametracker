import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@/utils/supabase/server";
import { THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";
import {
  ACCENT_COOKIE,
  ACCENT_CUSTOM_BG_COOKIE,
  ACCENT_CUSTOM_FG_COOKIE,
  ACCENT_CUSTOM_DEFAULT_BG,
  ACCENT_CUSTOM_DEFAULT_FG,
  isAccent,
  isHexColor,
  type AccentId,
} from "@/lib/accent";
import { LOCALES } from "@/lib/i18n";
import { setLocale } from "@/app/actions/locale";
import { AppearanceForm } from "@/components/appearance-form";
import { SubmitButton } from "@/components/submit-button";
import { getDictionary } from "@/lib/get-dictionary";

export const metadata: Metadata = {
  title: "Settings - Template",
  description: "Appearance and account settings",
};

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data?.user) {
    redirect("/auth/signin");
  }

  const { t: dict, locale: currentLocale } = await getDictionary();

  const LANGUAGE_LABEL: Record<string, string> = {
    en: dict.settings.languageEnglish,
    ms: dict.settings.languageMalay,
  };

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const currentTheme: Theme = isTheme(themeCookie) ? themeCookie : "system";
  const accentCookie = cookieStore.get(ACCENT_COOKIE)?.value;
  const currentAccent: AccentId = isAccent(accentCookie) ? accentCookie : "default";
  const customBgCookie = cookieStore.get(ACCENT_CUSTOM_BG_COOKIE)?.value;
  const customFgCookie = cookieStore.get(ACCENT_CUSTOM_FG_COOKIE)?.value;
  const customBg = isHexColor(customBgCookie) ? customBgCookie : ACCENT_CUSTOM_DEFAULT_BG;
  const customFg = isHexColor(customFgCookie) ? customFgCookie : ACCENT_CUSTOM_DEFAULT_FG;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12 animate-page-in">
      <h1 className="text-xl font-semibold text-foreground">{dict.settings.title}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground/60">{dict.settings.language}</h2>
        <div className="flex gap-2">
          {LOCALES.map((locale) => (
            <form key={locale} action={setLocale}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="redirect_to" value="/settings" />
              <SubmitButton
                ariaPressed={currentLocale === locale}
                className={
                  currentLocale === locale
                    ? "cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    : "cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                }
              >
                {LANGUAGE_LABEL[locale]}
              </SubmitButton>
            </form>
          ))}
        </div>
      </section>

      <AppearanceForm
        initialTheme={currentTheme}
        initialAccent={currentAccent}
        initialCustomBg={customBg}
        initialCustomFg={customFg}
        dict={dict.settings}
      />
    </div>
  );
}

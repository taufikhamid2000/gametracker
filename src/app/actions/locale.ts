"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale") as string;
  const redirectTo = (formData.get("redirect_to") as string) || "/settings";

  if (!isLocale(locale)) {
    throw new Error("Invalid locale");
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  // See app/actions/theme.ts — redirect forces a real full-tree
  // re-render, which a plain revalidatePath doesn't reliably do for
  // root-layout-level <html> changes.
  redirect(redirectTo);
}

"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";

// Called directly from the client (components/appearance-form.tsx) once the
// user hits Save, rather than via <form action>, so it just persists the
// cookie — the visual change already happened instantly client-side as a
// preview, no redirect/refresh needed to make it "take".
export async function setTheme(theme: Theme) {
  if (!isTheme(theme)) {
    throw new Error("Invalid theme");
  }

  const cookieStore = await cookies();

  if (theme === "system") {
    cookieStore.delete(THEME_COOKIE);
  } else {
    cookieStore.set(THEME_COOKIE, theme, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
}

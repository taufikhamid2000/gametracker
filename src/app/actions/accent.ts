"use server";

import { cookies } from "next/headers";
import {
  ACCENT_COOKIE,
  ACCENT_CUSTOM_BG_COOKIE,
  ACCENT_CUSTOM_FG_COOKIE,
  isAccent,
  isHexColor,
  type AccentId,
} from "@/lib/accent";

const COOKIE_OPTIONS = {
  httpOnly: false,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

// Called directly from the client (components/appearance-form.tsx) once the
// user hits Save — same reasoning as setTheme, the preview already applied
// instantly, this just persists it.
export async function setAccent(accent: AccentId, custom?: { bg: string; fg: string }) {
  if (!isAccent(accent)) {
    throw new Error("Invalid accent");
  }

  const cookieStore = await cookies();

  if (accent === "default") {
    cookieStore.delete(ACCENT_COOKIE);
  } else {
    cookieStore.set(ACCENT_COOKIE, accent, COOKIE_OPTIONS);
  }

  if (accent === "custom") {
    if (!custom || !isHexColor(custom.bg) || !isHexColor(custom.fg)) {
      throw new Error("Custom colors must be hex codes");
    }

    cookieStore.set(ACCENT_CUSTOM_BG_COOKIE, custom.bg, COOKIE_OPTIONS);
    cookieStore.set(ACCENT_CUSTOM_FG_COOKIE, custom.fg, COOKIE_OPTIONS);
  }
}

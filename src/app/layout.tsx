import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { SupabaseListener } from "@/components/supabase-listener";
import { getDictionary } from "@/lib/get-dictionary";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import {
  ACCENT_COOKIE,
  ACCENT_CUSTOM_BG_COOKIE,
  ACCENT_CUSTOM_FG_COOKIE,
  ACCENT_CUSTOM_DEFAULT_BG,
  ACCENT_CUSTOM_DEFAULT_FG,
  isAccent,
  isHexColor,
} from "@/lib/accent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GameTracker",
  description: "Track your game library — what you own, what you're playing, and what runs well on Deck",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getDictionary();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value;
  const theme = isTheme(themeCookie) ? themeCookie : "system";
  const accentCookie = cookieStore.get(ACCENT_COOKIE)?.value;
  const accent = isAccent(accentCookie) ? accentCookie : "default";

  // "custom" colors are runtime user input, not a value CSS can express
  // ahead of time — set as inline custom properties instead of a
  // :root[data-accent="custom"] block.
  const customBgCookie = cookieStore.get(ACCENT_CUSTOM_BG_COOKIE)?.value;
  const customFgCookie = cookieStore.get(ACCENT_CUSTOM_FG_COOKIE)?.value;
  const customStyle =
    accent === "custom"
      ? ({
          "--nav-bg": isHexColor(customBgCookie) ? customBgCookie : ACCENT_CUSTOM_DEFAULT_BG,
          "--nav-fg": isHexColor(customFgCookie) ? customFgCookie : ACCENT_CUSTOM_DEFAULT_FG,
        } as React.CSSProperties)
      : undefined;

  return (
    <html
      lang={locale}
      data-theme={theme === "system" ? undefined : theme}
      data-accent={accent === "default" ? undefined : accent}
      style={customStyle}
    >
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <SupabaseListener>{children}</SupabaseListener>
      </body>
    </html>
  );
}

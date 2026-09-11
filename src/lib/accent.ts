export const ACCENT_COOKIE = "accent";
export const ACCENT_CUSTOM_BG_COOKIE = "accent_custom_bg";
export const ACCENT_CUSTOM_FG_COOKIE = "accent_custom_fg";

export const ACCENT_CUSTOM_DEFAULT_BG = "#111827";
export const ACCENT_CUSTOM_DEFAULT_FG = "#ffffff";

// Fixed colors, not theme-aware by design — each preset already reads
// fine against both light and dark page content since the nav itself
// carries its own (usually white) foreground color regardless of which
// page theme is active. "custom" has no fixed swatch here — its colors
// come from the accent_custom_bg/fg cookies instead (see globals.css).
export const ACCENTS = [
  { id: "default", swatch: "linear-gradient(135deg, #7c3aed 50%, #f1f5f9 50%)" },
  { id: "ocean", swatch: "#0b2e59" },
  { id: "forest", swatch: "#0b3d2e" },
  { id: "plum", swatch: "#3b0b59" },
  { id: "slate", swatch: "#1e293b" },
  { id: "custom", swatch: "conic-gradient(from 90deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

export function isAccent(value: string | undefined): value is AccentId {
  return !!value && ACCENTS.some((a) => a.id === value);
}

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: string | undefined): value is string {
  return !!value && HEX_COLOR_RE.test(value);
}

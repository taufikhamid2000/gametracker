import { z } from "zod";
import { STORES, INSTALL_STATUSES, PLAY_STATUSES, DECK_COMPAT_RATINGS } from "@/types";

// Shared by the client form (react-hook-form resolver) and the server
// action (defense in depth — never trust a payload just because the form
// already validated it client-side).
export const gameFormSchema = z.object({
  title: z.string().trim().min(1),
  store: z.enum(STORES),
  store_id: z.string().trim().optional().or(z.literal("")),
  install_status: z.enum(INSTALL_STATUSES),
  install_path: z.string().trim().optional().or(z.literal("")),
  play_status: z.enum(PLAY_STATUSES),
  playtime_minutes: z.coerce.number().int().min(0),
  last_played_at: z.string().optional().or(z.literal("")),
  deck_compat: z.enum(DECK_COMPAT_RATINGS),
  rating: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  price_amount: z.coerce.number().min(0).optional().or(z.literal("")),
  price_currency: z.string().trim().optional().or(z.literal("")),
});

export type GameFormValues = z.infer<typeof gameFormSchema>;

export const gameFormDefaults: GameFormValues = {
  title: "",
  store: "steam",
  store_id: "",
  install_status: "not_installed",
  play_status: "backlog",
  install_path: "",
  playtime_minutes: 0,
  last_played_at: "",
  deck_compat: "unknown",
  rating: "",
  notes: "",
  price_amount: "",
  price_currency: "",
};

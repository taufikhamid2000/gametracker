import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/utils/supabase/service";
import { STORES, INSTALL_STATUSES, PLAY_STATUSES, DECK_COMPAT_RATINGS } from "@/types";

// Called by atlas's `gametracker_stage_game` MCP tool after an AI client
// classifies pasted game text — see supabase/migrations/..._pending_games.sql.
// `user_id` is the caller's real auth.users id, asserted by atlas after ITS
// own login (see atlas's app/api/oauth/authorize) — atlas and gametracker
// share the same Supabase Auth instance (master_db), so a signed-in atlas
// user and a gametracker user are the same person with no separate linking
// step. GAMETRACKER_API_KEY authenticates atlas as a trusted relay; it does
// not identify which end user a given request is for — user_id does that,
// and the pending_games FK to auth.users rejects anything that isn't a real
// account (not just any string atlas might send).
const bodySchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().trim().min(1),
  store: z.enum(STORES).optional(),
  store_id: z.string().trim().optional(),
  install_status: z.enum(INSTALL_STATUSES).optional(),
  install_path: z.string().trim().optional(),
  play_status: z.enum(PLAY_STATUSES).optional(),
  playtime_minutes: z.number().int().min(0).optional(),
  last_played_at: z.string().optional(),
  deck_compat: z.enum(DECK_COMPAT_RATINGS).optional(),
  rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().trim().optional(),
  price_amount: z.number().min(0).optional(),
  price_currency: z.string().trim().optional(),
  source_text: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const apiKey = process.env.GAMETRACKER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is not configured for staging" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("pending_games").insert(parsed.data).select().single();

  if (error) {
    // A user_id with no matching auth.users row fails the FK constraint —
    // surface that as a normal 400 rather than a generic 500.
    const status = error.code === "23503" ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ pendingGame: data });
}

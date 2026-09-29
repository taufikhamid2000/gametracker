import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/utils/supabase/service";
import { STORES, INSTALL_STATUSES, PLAY_STATUSES, DECK_COMPAT_RATINGS } from "@/types";

// Called by atlas's `gametracker_stage_game` MCP tool after an AI client
// classifies pasted game text — see supabase/migrations/..._pending_games.sql.
// Single-user app: the caller never supplies a user id, this always stages
// the draft for the one owner account (GAMETRACKER_OWNER_USER_ID).
const bodySchema = z.object({
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
  const ownerUserId = process.env.GAMETRACKER_OWNER_USER_ID;
  if (!apiKey || !ownerUserId) {
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
  const { data, error } = await supabase
    .from("pending_games")
    .insert({ ...parsed.data, user_id: ownerUserId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pendingGame: data });
}

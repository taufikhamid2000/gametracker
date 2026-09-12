"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/utils/supabase/server";
import { gameFormSchema } from "@/lib/game-schema";
import type { GameInsert } from "@/types";

function toRow(raw: Record<string, unknown>): GameInsert {
  const parsed = gameFormSchema.parse(raw);
  return {
    title: parsed.title,
    store: parsed.store,
    store_id: parsed.store_id || null,
    install_status: parsed.install_status,
    install_path: parsed.install_path || null,
    play_status: parsed.play_status,
    playtime_minutes: parsed.playtime_minutes,
    last_played_at: parsed.last_played_at || null,
    deck_compat: parsed.deck_compat,
    rating: parsed.rating === "" || parsed.rating === undefined ? null : parsed.rating,
    notes: parsed.notes || null,
    price_amount: parsed.price_amount === "" || parsed.price_amount === undefined ? null : parsed.price_amount,
    price_currency: parsed.price_currency || null,
  };
}

export async function addGame(formData: FormData) {
  const supabase = await createServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { error: "Not signed in" };
  }

  const row = toRow(Object.fromEntries(formData.entries()));

  const { error } = await supabase.from("games").insert({ ...row, user_id: userData.user.id });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/games");
  return { error: null };
}

export async function updateGame(id: string, formData: FormData) {
  const supabase = await createServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { error: "Not signed in" };
  }

  const row = toRow(Object.fromEntries(formData.entries()));

  // RLS also enforces this, but scoping the .eq() here keeps a mistaken id
  // from another user's row from ever reaching the query planner at all.
  const { error } = await supabase
    .from("games")
    .update(row)
    .eq("id", id)
    .eq("user_id", userData.user.id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/games");
  return { error: null };
}

export async function deleteGame(id: string) {
  const supabase = await createServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return { error: "Not signed in" };
  }

  const { error } = await supabase.from("games").delete().eq("id", id).eq("user_id", userData.user.id);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/games");
  return { error: null };
}

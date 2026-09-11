import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/utils/supabase/server";
import { getDictionary } from "@/lib/get-dictionary";
import { GamesLibrary } from "@/components/games/games-library";

export const metadata: Metadata = {
  title: "Library - GameTracker",
  description: "Your game library",
};

export default async function GamesPage() {
  const supabase = await createServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (!userData?.user || userError) {
    redirect("/auth/signin");
  }

  const { t: dict } = await getDictionary();

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .order("updated_at", { ascending: false });

  return <GamesLibrary games={games ?? []} dict={dict.games} />;
}

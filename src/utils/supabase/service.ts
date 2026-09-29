import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

// Service-role client for server-only code that must act without a user
// session — currently just the /api/pending-games route, which atlas (no
// user session, only a shared API key) calls to stage a classified game.
// Never import this from anything reachable by a browser bundle.
export function createServiceClient() {
  return createClient<Database, "gametracker">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "gametracker" }, auth: { persistSession: false } }
  );
}

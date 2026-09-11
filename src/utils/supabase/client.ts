import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

// This app's tables live in the dedicated `gametracker` schema on the
// shared master_db Supabase project, not `public` — see supabase/README.md.
export function createClient() {
  return createBrowserClient<Database, "gametracker">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "gametracker" },
      // Configure auth options for best user experience
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
}

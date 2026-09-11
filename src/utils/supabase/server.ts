import { createServerClient as createClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/types";

// This app's tables live in the dedicated `gametracker` schema on the
// shared master_db Supabase project, not `public` — see supabase/README.md.
export const createServerClient = cache(async () => {
  const cookieStore = await cookies();

  return createClient<Database, "gametracker">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "gametracker" },
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // We can't set cookies in a Server Component directly
            // This will fail silently in middleware or when headers are already sent
          }
        },
        remove(name) {
          try {
            cookieStore.delete(name);
          } catch {
            // We can't delete cookies in a Server Component directly
            // This will fail silently in middleware or when headers are already sent
          }
        },
      },
    }
  );
});

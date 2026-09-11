import { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/get-dictionary";
import type { PlayStatus } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard - Template",
  description: "Your dashboard",
};

export default async function DashboardPage() {
  const supabase = await createServerClient(); // Get session if available
  const { data, error } = await supabase.auth.getUser();

  // Redirect to login if no user is found
  if (!data?.user || error) {
    redirect("/auth/signin");
  }

  const { t: dict } = await getDictionary();

  // Get user profile if user exists
  let userProfile = null;
  let userMetadata = null;

  if (data?.user) {
    // Get user metadata directly from user
    userMetadata = data.user.user_metadata;

    // Try to get profile from the profiles table
    const profileResponse = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single(); // Use profile data if available, otherwise fall back to user metadata
    if (profileResponse.data) {
      userProfile = profileResponse.data;
    } else {
      // Create a profile-like object from user metadata
      userProfile = {
        id: data.user.id,
        first_name: userMetadata?.first_name || dict.dashboard.guest,
        last_name: userMetadata?.last_name || "",
        role: userMetadata?.role || "user",
        email: data.user.email,
      };
    }
  }

  const { data: games } = await supabase.from("games").select("play_status");
  const counts = (games ?? []).reduce(
    (acc, g) => {
      const status = g.play_status as PlayStatus;
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<PlayStatus, number>>
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12 animate-page-in">
      <h1 className="text-xl font-semibold text-foreground">
        {dict.dashboard.welcome(userProfile?.first_name || dict.dashboard.guest)}
      </h1>{" "}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-2xl font-semibold text-foreground">{games?.length ?? 0}</p>
          <p className="text-xs text-foreground/60">{dict.dashboard.stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-2xl font-semibold text-primary">{counts.playing ?? 0}</p>
          <p className="text-xs text-foreground/60">{dict.dashboard.stats.playing}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-2xl font-semibold text-foreground">{counts.backlog ?? 0}</p>
          <p className="text-xs text-foreground/60">{dict.dashboard.stats.backlog}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-2xl font-semibold text-accent">{counts.finished ?? 0}</p>
          <p className="text-xs text-foreground/60">{dict.dashboard.stats.finished}</p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-sm font-medium text-foreground/60 mb-4">{dict.dashboard.yourProfile}</h2>
          <div className="space-y-2">
            {userProfile ? (
              <>
                <p>
                  <strong>{dict.dashboard.name}</strong> {userProfile.first_name}{" "}
                  {userProfile.last_name}
                </p>
                <p>
                  <strong>{dict.dashboard.email}</strong> {data?.user?.email}
                </p>
                <p>
                  <strong>{dict.dashboard.role}</strong> {userProfile.role}
                </p>
              </>
            ) : (
              <p>{dict.dashboard.signInToView}</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="text-sm font-medium text-foreground/60 mb-4">{dict.dashboard.quickActions}</h2>
          <div className="space-y-3">
            <p>{dict.dashboard.quickActionsBody}</p>
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {dict.dashboard.goToLibrary}
            </Link>
          </div>
        </div>{" "}
        {/* Debug information panel - only visible in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-2xl border border-border bg-muted/40 p-6">
            <h2 className="text-sm font-medium text-foreground/60 mb-4">{dict.dashboard.sessionDebug}</h2>
            <div className="space-y-2 text-xs font-mono overflow-auto max-h-60 bg-muted p-3 rounded-lg border border-border">
              <div>
                <strong>{dict.dashboard.sessionExists}</strong>{" "}
                {data?.user ? dict.dashboard.yes : dict.dashboard.no}
              </div>
              {data?.user && (
                <>
                  <div>
                    <strong>{dict.dashboard.userId}</strong> {data.user.id}
                  </div>
                  <div>
                    <strong>{dict.dashboard.email}</strong> {data.user.email}
                  </div>
                  <div>
                    <strong>{dict.dashboard.userMetadata}</strong>{" "}
                    <pre>
                      {JSON.stringify(data.user.user_metadata, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

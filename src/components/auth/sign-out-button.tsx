"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

type SignOutButtonProps = {
  redirectTo?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  className?: string;
  label?: string;
  pendingLabel?: string;
};

export default function SignOutButton({
  redirectTo = "/",
  variant = "ghost",
  className = "hover:text-blue-600",
  label = "Sign Out",
  pendingLabel = "Signing out…",
}: SignOutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();

      // Same reasoning as signin-form.tsx: a hard reload here would race
      // SupabaseListener's own SIGNED_OUT-triggered refresh.
      router.refresh();
      router.push(redirectTo);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleSignOut}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? pendingLabel : label}
    </Button>
  );
}

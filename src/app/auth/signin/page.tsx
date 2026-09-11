import { Metadata } from "next";
import { redirect } from "next/navigation";

import SignInForm from "./components/signin-form";
import { createServerClient } from "@/utils/supabase/server";
import { getDictionary } from "@/lib/get-dictionary";

export const metadata: Metadata = {
  title: "Sign In - Template",
  description: "Sign in to your account",
};

export default async function SignInPage() {
  // Check for existing session on the server side
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getSession();

  // Force redirect if session exists
  if (data?.session) {
    redirect("/dashboard");
  }

  const { t: dict } = await getDictionary();

  // SignInForm is a Client Component — only pass the slices it actually
  // uses, not the whole dict. dict.dashboard.welcome (a function) can't
  // cross that boundary as a prop, and passing the entire dict object
  // drags it along even though this form never reads dashboard at all.
  return (
    <SignInForm
      brand={dict.nav.brand}
      dict={{ signin: dict.signin, validation: dict.validation }}
      authDict={dict.auth}
    />
  );
}

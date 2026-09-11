import { Metadata } from "next";
import { redirect } from "next/navigation";

import SignUpForm from "./components/signup-form";
import { createServerClient } from "@/utils/supabase/server";
import { getDictionary } from "@/lib/get-dictionary";

export const metadata: Metadata = {
  title: "Sign Up - Template",
  description: "Create a new account",
};

export default async function SignUpPage() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getSession();

  if (data?.session) {
    redirect("/dashboard");
  }

  const { t: dict } = await getDictionary();

  // Same reasoning as signin/page.tsx — only pass the slices SignUpForm
  // actually reads (it borrows dict.signin's email/password aria labels),
  // not the whole dict, which drags dict.dashboard.welcome (a function)
  // along with it.
  return (
    <SignUpForm
      brand={dict.nav.brand}
      dict={{ signup: dict.signup, signin: dict.signin, validation: dict.validation }}
      authDict={dict.auth}
    />
  );
}

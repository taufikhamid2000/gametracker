"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/utils/supabase/client";
import { AuthBrandingPanel } from "@/components/auth-branding-panel";
import { LogoMark } from "@/components/logo-mark";
import { PasswordInput } from "@/components/password-input";
import { Spinner } from "@/components/spinner";
import type { Dictionary } from "@/lib/dictionaries/en";

type SignInFormValues = { email: string; password: string };

const FIELD_CLASS =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

export default function SignInForm({
  brand,
  dict,
  authDict,
}: {
  brand: string;
  dict: Pick<Dictionary, "signin" | "validation">;
  authDict: Dictionary["auth"];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SignInSchema = z.object({
    email: z.string().email({ message: dict.validation.emailInvalid }),
    password: z.string().min(6, { message: dict.validation.passwordMin }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(SignInSchema),
  });
  const onSubmit = async (data: SignInFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      // Simple authentication without extra checks
      const response = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (response.error) {
        // Provide more specific error messages for common auth issues
        if (response.error.message.includes("Invalid login credentials")) {
          setError(dict.signin.invalidCredentials);
        } else if (response.error.message.includes("Email not confirmed")) {
          setError(dict.signin.emailNotConfirmed);
        } else {
          throw response.error;
        }
        return;
      }

      // A hard window.location.href reload here used to race the
      // SupabaseListener's own post-sign-in refresh (both firing off the
      // same signInWithPassword call), which is what produced the
      // double-reload flash. router.refresh() invalidates the client
      // router cache so /dashboard's server check sees the just-set
      // session cookie, then router.push does a normal soft navigation.
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || dict.signin.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 md:items-stretch">
      <AuthBrandingPanel brand={brand} dict={authDict} />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted px-4">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <LogoMark size={28} />
          <span className="text-lg font-semibold text-foreground">{brand}</span>
        </Link>

        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 animate-page-in">
          <h1 className="text-xl font-semibold text-foreground">{dict.signin.welcomeBack}</h1>
          <p className="mb-6 text-sm text-foreground/60">{dict.signin.subtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <input
              {...register("email")}
              type="email"
              aria-label={dict.signin.emailAriaLabel}
              placeholder="your@email.com"
              disabled={isLoading}
              className={FIELD_CLASS}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}

            <PasswordInput
              registerProps={register("password")}
              ariaLabel={dict.signin.passwordAriaLabel}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
              className={FIELD_CLASS}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {isLoading && <Spinner />}
              {isLoading ? dict.signin.signingIn : dict.signin.signIn}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            {dict.signin.noAccount}{" "}
            <Link href="/auth/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              {dict.signin.signUpLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

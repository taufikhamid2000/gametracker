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

type SignUpFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

const FIELD_CLASS =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring";

export default function SignUpForm({
  brand,
  dict,
  authDict,
}: {
  brand: string;
  dict: Pick<Dictionary, "signup" | "signin" | "validation">;
  authDict: Dictionary["auth"];
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SignUpSchema = z.object({
    firstName: z.string().min(2, { message: dict.validation.firstNameMin }),
    lastName: z.string().min(2, { message: dict.validation.lastNameMin }),
    email: z.string().email({ message: dict.validation.emailInvalid }),
    password: z.string().min(6, { message: dict.validation.passwordMin }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
  });
  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      // First, directly sign up AND auto-confirm without email verification
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: "user",
          },
          // Skip email verification
          emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/dashboard`,
        },
      });

      if (signUpError) {
        throw signUpError;
      } // Immediately sign in with password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        throw signInError;
      }

      // Success - go directly to dashboard, no verification required.
      // See signin-form.tsx for why this isn't window.location.href.
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || dict.signup.genericError);
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
          <h1 className="text-xl font-semibold text-foreground">{dict.signup.createAccount}</h1>
          <p className="mb-6 text-sm text-foreground/60">{dict.signup.subtitle}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <input
                  {...register("firstName")}
                  type="text"
                  aria-label={dict.signup.firstNameAriaLabel}
                  placeholder={dict.signup.firstNamePlaceholder}
                  disabled={isLoading}
                  className={FIELD_CLASS}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <input
                  {...register("lastName")}
                  type="text"
                  aria-label={dict.signup.lastNameAriaLabel}
                  placeholder={dict.signup.lastNamePlaceholder}
                  disabled={isLoading}
                  className={FIELD_CLASS}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
              autoComplete="new-password"
              className={FIELD_CLASS}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {isLoading && <Spinner />}
              {isLoading ? dict.signup.creatingAccount : dict.signup.signUp}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground/60">
            {dict.signup.alreadyHaveAccount}{" "}
            <Link href="/auth/signin" className="font-medium text-primary underline-offset-4 hover:underline">
              {dict.signup.signInLink}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

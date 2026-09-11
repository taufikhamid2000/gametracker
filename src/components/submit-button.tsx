"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/spinner";

export function SubmitButton({
  children,
  pendingText,
  className,
  ariaPressed,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className: string;
  ariaPressed?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-pressed={ariaPressed}
      className={`${className} inline-flex items-center justify-center gap-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100`}
    >
      {pending && <Spinner />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

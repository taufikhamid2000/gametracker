"use client";

import { useState } from "react";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.35 5.42A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.1 13.1 0 0 1-3.14 3.9M6.5 6.66C3.44 8.5 1.5 12 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.24-.87"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Show/hide toggle shared by signin and signup — one place to keep the
// icons and behavior in sync.
export function PasswordInput({
  id,
  name,
  ariaLabel,
  placeholder,
  disabled,
  autoComplete,
  registerProps,
  className,
}: {
  id?: string;
  name?: string;
  ariaLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  // Spread from react-hook-form's register() so this stays a plain
  // controlled-by-RHF input rather than needing its own onChange wiring.
  registerProps?: Record<string, unknown>;
  className: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        aria-label={ariaLabel}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`w-full pr-10 ${className}`}
        {...registerProps}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-foreground/50 transition-colors hover:text-foreground"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

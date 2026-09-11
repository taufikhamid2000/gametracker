"use client";

import { useEffect, useState, useTransition } from "react";
import { setTheme } from "@/app/actions/theme";
import { setAccent } from "@/app/actions/accent";
import { THEMES, type Theme } from "@/lib/theme";
import { ACCENTS, type AccentId } from "@/lib/accent";
import { Tooltip } from "@/components/tooltip";
import { CustomAccentPicker } from "@/components/custom-accent-picker";
import type { Dictionary } from "@/lib/dictionaries/en";

// Selecting a theme/accent previously saved (and redirected) on every
// click, which made each pick feel like a slow round trip. Now every click
// only updates local state and applies it instantly to <html> as a preview
// — nothing is persisted until Save, so a pick you don't like just reverts
// on next reload if you never save it.
function applyPreview(theme: Theme, accent: AccentId, customBg: string, customFg: string) {
  const html = document.documentElement;
  if (theme === "system") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", theme);
  }
  if (accent === "default") {
    html.removeAttribute("data-accent");
  } else {
    html.setAttribute("data-accent", accent);
  }
  if (accent === "custom") {
    html.style.setProperty("--nav-bg", customBg);
    html.style.setProperty("--nav-fg", customFg);
  } else {
    html.style.removeProperty("--nav-bg");
    html.style.removeProperty("--nav-fg");
  }
}

export function AppearanceForm({
  initialTheme,
  initialAccent,
  initialCustomBg,
  initialCustomFg,
  dict,
}: {
  initialTheme: Theme;
  initialAccent: AccentId;
  initialCustomBg: string;
  initialCustomFg: string;
  dict: Dictionary["settings"];
}) {
  const [savedTheme, setSavedTheme] = useState(initialTheme);
  const [savedAccent, setSavedAccent] = useState(initialAccent);
  const [savedCustomBg, setSavedCustomBg] = useState(initialCustomBg);
  const [savedCustomFg, setSavedCustomFg] = useState(initialCustomFg);

  const [theme, setThemeLocal] = useState(initialTheme);
  const [accent, setAccentLocal] = useState(initialAccent);
  const [customBg, setCustomBg] = useState(initialCustomBg);
  const [customFg, setCustomFg] = useState(initialCustomFg);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    applyPreview(theme, accent, customBg, customFg);
  }, [theme, accent, customBg, customFg]);

  const dirty =
    theme !== savedTheme ||
    accent !== savedAccent ||
    (accent === "custom" && (customBg !== savedCustomBg || customFg !== savedCustomFg));

  const THEME_LABEL: Record<Theme, string> = {
    light: dict.themeLight,
    dark: dict.themeDark,
    system: dict.themeSystem,
  };

  const ACCENT_LABEL: Record<AccentId, string> = {
    default: dict.accentDefault,
    ocean: dict.accentOcean,
    forest: dict.accentForest,
    plum: dict.accentPlum,
    slate: dict.accentSlate,
    custom: dict.accentCustom,
  };

  function handleSave() {
    startTransition(async () => {
      await setTheme(theme);
      await setAccent(accent, accent === "custom" ? { bg: customBg, fg: customFg } : undefined);
      setSavedTheme(theme);
      setSavedAccent(accent);
      setSavedCustomBg(customBg);
      setSavedCustomFg(customFg);
    });
  }

  function handleDiscard() {
    setThemeLocal(savedTheme);
    setAccentLocal(savedAccent);
    setCustomBg(savedCustomBg);
    setCustomFg(savedCustomFg);
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-foreground/60">{dict.theme}</h2>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setThemeLocal(t)}
              aria-pressed={theme === t}
              className={
                theme === t
                  ? "cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  : "cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              }
            >
              {THEME_LABEL[t]}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-medium text-foreground/60">{dict.accent}</h2>
          <Tooltip label={dict.accentTooltip} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccentLocal(a.id)}
              aria-pressed={accent === a.id}
              title={ACCENT_LABEL[a.id]}
              style={{ background: a.swatch }}
              className={
                accent === a.id
                  ? "h-8 w-8 cursor-pointer rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background transition-transform active:scale-95"
                  : "h-8 w-8 cursor-pointer rounded-full border border-border transition-transform hover:scale-105 active:scale-95"
              }
            >
              <span className="sr-only">{ACCENT_LABEL[a.id]}</span>
            </button>
          ))}
        </div>

        {accent === "custom" && (
          <CustomAccentPicker
            bg={customBg}
            fg={customFg}
            onBgChange={setCustomBg}
            onFgChange={setCustomFg}
            dict={dict}
          />
        )}
      </section>

      {dirty && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
          <p className="flex-1 text-xs text-foreground/60">{dict.unsavedAppearanceChanges}</p>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isPending}
            className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          >
            {dict.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="cursor-pointer rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
          >
            {isPending ? dict.saving : dict.save}
          </button>
        </div>
      )}
    </>
  );
}

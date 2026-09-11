# Design language

This is the reference for how projects in this portfolio should *feel* — not a
component library, and not tied to Next.js/Tailwind. Extracted from DuitDuit,
which currently has the most fully-realized version of this. When revamping
or starting a project, work from **this doc**, not from DuitDuit's code
directly — DuitDuit's literal colors, copy, and finance-specific pieces are
one *application* of these principles, not the spec itself. Copying its blue
and calling it done misses the point; the point is the structure and the
discipline underneath it.

## How to use this doc

1. Read the principles below — they're stack-agnostic and apply whether
   you're in Next.js, Angular, Expo, or plain HTML.
2. Re-derive your own token *values* for the project's own domain (see
   "Tokens are roles, not colors" below). Don't default to DuitDuit's trust
   blue / profit green unless the project is actually in that space.
3. Re-implement the *mechanisms* (theming, motion, pending states) natively
   for the stack — CSS variables port everywhere; the exact plumbing (React
   Context, Angular services, RN state) won't.

## Tokens are roles, not colors

Every surface, text color, and border in the app should reference a named
role, never a literal hex value in markup:

| Role | Purpose |
|---|---|
| `background` / `foreground` | Page base and default text |
| `muted` | Quiet fills — card backgrounds, subtle panels |
| `border` | Hairlines, dividers — low-contrast, never pure black/white |
| `primary` / `primary-foreground` | Brand action color + its readable-on-top text |
| `secondary` | A lighter/supporting tint of primary, for less emphatic actions |
| `accent` / `accent-foreground` | The domain's "good" signal (DuitDuit: money saved/earned) |
| `destructive` / `destructive-foreground` | Delete, error, "over limit" |
| `ring` | Focus outline color |

Pick actual hex values per project based on its domain (a game project might
want a punchier, higher-variance palette; a tools/dashboard project should
stay closer to DuitDuit's low-chroma, legibility-first end). What matters is
that the *roles* exist and everything in the UI is written against them, so a
full re-theme is a token edit, not a find-and-replace across every component.

**Reference implementation** (DuitDuit's actual values, CSS custom
properties, light/dark pair):

```css
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --muted: #f1f5f9;
  --border: rgba(15, 23, 42, 0.08);
  --primary: #1e40af;
  --primary-foreground: #ffffff;
  --secondary: #3b82f6;
  --accent: #059669;
  --accent-foreground: #ffffff;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --ring: #1e40af;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0f172a;
    --foreground: #ffffff;
    --muted: #101a34;
    --border: rgba(255, 255, 255, 0.08);
    /* primary/accent/destructive often stay the same or shift 1 step
       lighter for dark-mode contrast — ring goes to --secondary's value
       so focus is visible against a dark primary button */
    --ring: #3b82f6;
  }
}
```

- Dark mode follows `prefers-color-scheme` by default, with an explicit
  `data-theme="dark"` / `data-theme="light"` attribute override for a
  user-facing toggle that beats the OS setting.
- For a finance/dashboard-flavored project, default **dark-first** — it's
  the convention users of that category expect. Lighter, more playful
  projects can default light instead; the mechanism doesn't change, just
  which mode ships as the un-toggled default.

### Chart / categorical colors

If the project has any data visualization, use a **fixed, ordered** set of
categorical colors — never re-derive hues per render, and never reuse
`primary`/`accent`/`destructive` for arbitrary categories (those are reserved
for their semantic meaning). DuitDuit's set is a validated CVD-safe 8-hue
sequence with a `--chart-muted` fallback for anything folded into "Other":

```css
--chart-series-1: #2a78d6;
--chart-series-2: #eb6834;
--chart-series-3: #1baf7a;
--chart-series-4: #eda100;
--chart-series-5: #e87ba4;
--chart-series-6: #008300;
--chart-series-7: #4a3aa7;
--chart-series-8: #e34948;
--chart-muted: #898781;
```

Category N always gets series N — never reassigned based on sort order or
what's visible, so a color stays tied to the same meaning across views (e.g.
a donut and a treemap of the same data must agree).

## Typography

Two fonts, both chosen for legibility over personality: a humanist sans for
UI text, a matching monospace for anything numeric or tabular (amounts,
dates, IDs) where digit alignment matters. DuitDuit uses Fira Sans / Fira
Code. Swap the specific family per project's tone, but keep the *pairing
principle* — a UI face and a numeric/mono face, not one font doing both jobs.

## Motion

Tuned deliberately, not decorative:

- **Transform/opacity only** — never animate layout properties (width,
  height, top/left) except through the disclosure pattern below, which uses
  a CSS grid trick specifically to avoid `max-height` guessing.
- **150–350ms**, small displacement (translateY(6px) fade-in is DuitDuit's
  page/row-enter animation — subtle, not a slide-in from off-screen).
- **`prefers-reduced-motion: reduce` is a blanket kill-switch**, applied
  once globally (drop all animation/transition durations to ~0), not
  per-component opt-out.

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
.animate-page-in { animation: fade-in-up 350ms ease-out both; }
.animate-row-in { animation: fade-in-up 250ms ease-out both; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Disclosures (collapsible sections)

CSS-only, no JS height calculation — animate `grid-template-rows` from `0fr`
to `1fr` on a wrapper inside `<details>`/`<summary>` (or the framework's
equivalent). This is what makes a native disclosure element animate instead
of snapping open/closed instantly.

## The pending-state rule

**Nothing that triggers async work is allowed to look frozen.** This was
enforced as an explicit audit pass in DuitDuit (four buttons and several
links had silently drifted from it and got fixed). Concretely:

- Every button that submits a form shows a spinner + optionally swaps its
  label text while pending (`"Save"` → spinner + `"Saving…"`).
- Every link that changes the page's own data via a param (pagination, sort,
  filter — *not* a real navigation to a different page) shows the same
  spinner treatment while the new data loads, instead of doing nothing until
  the new page suddenly appears.
- Real navigations to an actually different route stay as plain links —
  don't dress those up, that's what the browser's own loading indicator is
  for. Reserve the custom spinner for same-page data changes only.

## Meters / progress-against-a-limit

Any "X of Y" tracked-against-a-limit UI (budget vs. spent, usage vs. quota,
progress vs. goal) should use one shared 3-state model across the whole app,
not a bespoke threshold per component:

| State | Threshold | Color |
|---|---|---|
| `ok` | < 90% of limit | `primary` |
| `near` | 90–100% of limit | amber/warning |
| `over` | > 100% of limit | `destructive` |

Keep this as one small shared function/token map, not copy-pasted math per
screen — the whole point is that "getting close" means the same thing
everywhere in the app.

## Cards, rows, and forms

- **Cards**: `rounded-2xl`, hairline `border`, `muted` background at partial
  opacity (DuitDuit: `bg-muted/40`) — quiet containers, not bordered boxes
  with heavy shadows.
- **Row actions** (edit/delete on a list row): small underlined text links,
  not buttons — but still sized for an accessible tap target via negative
  margin trick (`py-2 -my-2` — expands the hit area without expanding the
  visual line height).
- **Form fields**: `rounded-lg`, hairline border, visible focus ring using
  the `ring` token via `focus-visible`, never a default browser outline.
- **Collapsed sections default to showing their headline number** even
  closed — a budget card collapsed still shows "82% spent" in its summary
  line. Never hide the one figure someone opened the page to see.
- **Every chart has a legend that IS the accessible view** — not a
  decorative label list, the actual data table alternative to the visual.

## Adapting this per project

- **Same stack as DuitDuit (Next.js + Tailwind)**: port the CSS variables
  and utility classes close to verbatim, swap only the hue values and
  fonts.
- **Different web stack (Angular, plain CSS, etc.)**: the CSS custom
  properties still work as-is — Tailwind isn't required for the token
  system, just convenient for consuming it. Re-implement the pending-state
  and disclosure behavior in the framework's own idioms.
- **Native/Expo**: tokens become a theme object instead of CSS variables;
  the *values* and *roles* table above still apply directly. Motion timings
  translate to `Animated`/Reanimated durations. The pending-state rule
  applies just as much to a mobile button as a web one.
- **Archived / not actively maintained projects**: skip. This is for
  projects actually getting worked on, not a mandate to touch everything.

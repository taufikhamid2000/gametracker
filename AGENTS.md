# Testing (Playwright)

`e2e/smoke.spec.ts` visits every public page unconditionally, plus `/dashboard` while
authenticated if `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` are set (skips cleanly otherwise —
see `e2e/login.ts`). It fails on any thrown render error or the app's own error boundary.
It exists to catch bugs `next build`'s type check can't — specifically Server Component ->
Client Component prop violations (e.g. passing a non-serializable value as a prop), which
only surface once React actually renders the page. Runs in CI on every push to `master`
(`.github/workflows/e2e.yml`).

When you add a new page under `src/app`: add its path to `PUBLIC_PAGES` in
`e2e/smoke.spec.ts` (or a new authenticated test, if it needs a session) — this repo has no
central page registry to read from automatically, unlike some of this author's other repos.

When you add a new Client Component that receives props from a Server Component, or
otherwise touches the server/client boundary in a new way: run `npm run test:e2e` locally
before pushing, not just `npm run build`. The build passing is not sufficient evidence the
page still renders — that's exactly the gap this suite exists to close.

Needs `E2E_TEST_EMAIL`/`E2E_TEST_PASSWORD` in `.env.local` (a dedicated test account, not
your own) to exercise the authenticated `/dashboard` test locally; without them it's
skipped, not failed.

# Git workflow

Solo-maintained repo — push commits directly to `master`, no feature branches or PRs needed.
This holds even if a session is scaffolded (e.g. by Claude Code on the web) with a
designated `claude/...` working branch — the branch isn't something you can avoid
creating (the launcher sets it up before you get control), so finish the work there,
push/fast-forward straight to `master` instead of leaving it on the feature branch or
opening a PR, then delete the now-redundant `claude/...` branch from the remote.

Before starting any work, check `git branch --show-current` — if it's not `master`, that's
a leftover/scaffolded branch, not intentional work to build on top of. Switch to `master`
and `git pull` to get the latest before making changes, then commit/push straight to
`master` when done (per above).

# Never start the dev server

Do not run `npm run dev` (or any equivalent) yourself, including via the Browser pane's
preview tools. Rely on `npm run build`/`next build`'s type check and `npm run test:e2e`
(see above) to verify changes instead. If a change genuinely needs eyes-on browser
verification, ask the user to run the dev server and check it themselves.

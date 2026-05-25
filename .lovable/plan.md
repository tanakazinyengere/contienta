
This is a large multi-wave build. I'm splitting it into 5 focused waves and shipping them in this order. Each wave is independently testable so nothing is half-broken.

## Wave 1 — Critical bug fixes (Profile Tester + Health Tracker)

**Profile Tester screenshots are broken.** Root cause: `analyze-ssi-screenshot` calls Gemini with a `data:` URL inside `image_url.url`, which the Lovable AI Gateway rejects intermittently, plus the function has no `max_completion_tokens` (Gemini truncates), and the client sends giant base64 strings that often blow past the function payload limit.

Fixes:
- Resize images client-side to max 1600px wide JPEG, ~85% quality, before upload.
- Edge function: keep data URL but switch to `google/gemini-2.5-pro` with explicit `max_tokens: 2000`, retry once on 5xx, return clearer error JSON.
- Show per-image status pill (uploading / analyzing / done / failed-with-reason) and a real "Retry this image" button.
- Add a "Test connection" debug toast that pings the function with a 1px image so we can verify the function is alive.

**Profile Health Tracker — persist + reload from `profile_health` table.**
- On Profile Tester mount, fetch row by `(user_id, profile_url)`.
- Save on every score update + every completed suggestion checkbox.
- Render a small history strip (measured vs projected) above the pillar cards.

## Wave 2 — Reef drag-and-drop + DB persistence

- Add `@dnd-kit/core` + `@dnd-kit/sortable`.
- Wrap reef nodes in `SortableContext`; on drag end, update local `position` and `upsert` to `reef_nodes` table.
- On mount, fetch ordered nodes for current user.
- Add "Save reef" + auto-save debounce (1.5s after last change).

## Wave 3 — Admin metrics + OAuth UX

Admin page already queries totals but no trends or activity. Add:
- Tile: new signups last 7 days (compare to prior 7) with up/down arrow.
- Tile: posts generated last 7 days.
- Tile: waitlist count (from `pro_waitlist`).
- "Latest activity" table: last 10 saved_posts joined with profiles.display_name.

OAuth states:
- Login page: catch `lovable.auth.signInWithOAuth` error, render friendly inline card: "Google sign-in is being approved. Use email/password for now, or join the waitlist."
- Same for a future "Connect LinkedIn" button in Dashboard — shows "LinkedIn publishing is in review; we'll email you when it's live." instead of a raw error.

## Wave 4 — Clippie chat per `App_AI_SPECs_1.0`

Upgrade existing Clippie to match spec essentials (mobile-first, glassmorphism, history sidebar):
- Persistent conversation list (already have `chat_conversations` table) — left drawer on desktop, sheet on mobile.
- Auto-save title from first user message.
- Streaming character-by-character (already streams; add typing-dots indicator + scroll-to-latest button when scrolled up >200px).
- Glassmorphism input with focus glow.
- Markdown rendering via `react-markdown`.
- New Chat FAB on mobile; rename/delete/pin per conversation menu.

Out of scope for this wave (not core): voice input, file attachments inside chat, web-search toggle, right-side context panel.

## Wave 5 — Spec docs (Payment v12 + Policy v2.2 + SEO v2 essentials)

**Payment v12 (static, no live processing):**
- Rewrite `/pricing` with the two toggles (Monthly/Annual, Individual/Business), fixed 320px cards, "Coming soon" tooltips on every CTA, "Most popular" badge on Enterprise.
- Add localStorage persistence for toggle preference.

**Policy v2.2 (low-risk legal pages):**
- Generate static `/terms`, `/privacy`, `/cookies`, `/refunds`, `/dmca`, `/acceptable-use` pages from the spec, all under Snashco LLC, contact `tanksnash@gmail.com`, address Bulawayo Zimbabwe.
- Footer with © 2026 Snashco LLC + links to all policy pages.
- Cookie banner (accept / reject / manage) writing to localStorage, no tracking before consent.

**SEO v2 essentials (SPA-compatible subset only — full SSR migration is out of scope):**
- Per-route `<title>`, `<meta description>`, `<link rel=canonical>`, OG + Twitter cards via a `<SEO>` component using `react-helmet-async`.
- JSON-LD `Organization` + `WebSite` on landing.
- `public/robots.txt` + auto-generated `public/sitemap.xml` build step.
- Skip the "must use Next.js SSR" rule — we stay on Vite SPA per project constraints.

## Out of scope this turn (will flag at end)
- Real Stripe/Paddle wiring (spec says placeholders only — matches).
- LinkedIn token exchange end-to-end (waiting on LinkedIn Marketing API approval).
- Voice input, in-chat file attach, right-side context panel for Clippie.
- Full SSR migration for SEO (would require leaving Vite).

## Technical notes
- New deps: `@dnd-kit/core`, `@dnd-kit/sortable`, `react-markdown`, `react-helmet-async`.
- No new tables needed — all target tables already exist (`profile_health`, `reef_nodes`, `chat_conversations`, `chat_messages`, `pro_waitlist`, `saved_posts`).
- No new secrets needed — LinkedIn secrets and `LOVABLE_API_KEY` already configured.
- Edge function changes: `analyze-ssi-screenshot` updated; no new functions.

Approve and I'll ship all 5 waves in this turn.

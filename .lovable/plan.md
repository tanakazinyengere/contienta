# ClippedIn Mega-Build Plan

I'll ship in 4 waves in this session. Honest expectation: Wave A + B + the structural foundation of C/D will be production-quality; Wave C/D polish (Clippie streaming UX, Reef drag-reorder physics, LinkedIn token refresh, post analytics) will likely need a follow-up turn.

## Wave A — Foundation (auth, nav, branding)
1. **Enable Google OAuth** via `configure_social_auth` (logs show `missing OAuth secret` — provider isn't enabled). Keep email/password too.
2. **Login page**: verify signup + signin work end-to-end, add password-reset link, friendly error toasts.
3. **Bottom tab bar** (WhatsApp style): Profile · Reef · Engine · Clippie · Dashboard. Replace top tab strip. Header stays for logo + theme toggle + sign-out.
4. **Logo**: revert to simple "ClippedIn" wordmark (no gradient `brand-logo` treatment).
5. **Hero rewrite**: replace "Own Your Influence." with on-theme copy: **"Post better. Grow faster."** + clean subhead.
6. **Add landing sections** from APP_SPECs §1 (problem statement, stats, features showcase, social proof) — reference, not literal.

## Wave B — Profile Tester rebuild
1. **Remove the URL→AI-analysis lie.** Keep URL input only as a *launcher*: paste URL → button **"Open my SSI on LinkedIn"** that deep-links to `https://www.linkedin.com/sales/ssi` (best LinkedIn allows — there is no per-user SSI deeplink, only the logged-in user's own page).
2. **Multi-file screenshot upload** (1–4 images: overall + 3 pillar tabs). Drag-and-drop + click.
3. **Real-time progressive analysis**: each image streams through `analyze-ssi-screenshot` and updates the Overview as results come in (parallel `Promise.allSettled`, per-card spinner).
4. **Stricter extractor prompt**: instruct the model to return `null` for any score it cannot read with confidence (no estimation). Add `confidence: "high"|"low"|"unreadable"` per pillar.
5. **Profile Health Tracker**: new table `profile_health` keyed by `profile_url`. Each completed suggestion bumps a `projected_score`. Persists across sessions; shows delta vs. measured.

## Wave C — Reef Tool + Clippie AI Chat
1. **Reef Content Tool** (`/app` tab + new component `ReefMap.tsx`):
   - Upload N images → AI generates a story arc (titles + narrative order) via existing AI gateway.
   - Visual horizontal "reef" timeline; each node = image + optional attached post from Content Engine or saved drafts.
   - Schedule date picker per node (saved to new `reef_nodes` table).
2. **Clippie AI Chat** (`/app` tab `Clippie.tsx` + edge function `clippie-chat`):
   - Streaming SSE per the AI-gateway pattern (system prompt = LinkedIn growth coach).
   - Glassmorphism sticky input, typing indicator, scroll-to-bottom FAB.
   - Conversation persisted in `chat_conversations` + `chat_messages` tables.

## Wave D — LinkedIn publishing + editable feed Dashboard
1. **Store LinkedIn credentials** as secrets: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`. (Will trigger the secrets form.) Never hardcode.
2. **Edge function `linkedin-publish`** = modular `publishSsiReportToLinkedIn(accessToken, text, imageUrl)` — 3-step ugcPosts flow (register upload → PUT binary → create post).
3. **Edge function `linkedin-schedule`** = clean helper accepting `(text, scheduledAt)` using LinkedIn Community Management API skeleton.
4. **Dashboard redesigned as a LinkedIn-style feed**: each saved post becomes a card with inline editor (textarea + image add + hashtag chips), char counter (3000 limit), **Schedule** button (Pro-gated; free users see paywall).
5. **God Mode hardening**: `tanakazinyengere2@gmail.com` → unlimited everything + admin metrics route `/admin` showing total users, paid users, waitlist count, posts generated.

## Out of scope this turn (will flag at end)
- Full Policy v2.2 legal pages (it's a 1700-line spec — needs its own turn).
- SEO v2 SSR migration (would require switching off Vite SPA).
- Payment v12 static pricing rewrite beyond a "Coming Soon" pass.
- LinkedIn token refresh + OAuth login flow against LinkedIn (Marketing API approval required by LinkedIn before this works in production).

## Tech notes
- Bottom nav lives in a new `<AppShell>` wrapping `/app`. Routes stay flat (`/app`, `/app/reef`, `/app/clippie`, `/app/dashboard`) — react-router nested routes.
- Use semantic tokens from `index.css` (no raw colors). Liquid-glass tokens already exist.
- All new tables: RLS with `auth.uid() = user_id`.
- Clippie + Reef AI calls go through new edge functions, not direct from client.
- LinkedIn secret entry happens via `add_secret` — I won't store the values you pasted in chat, I'll request them through the secure form.

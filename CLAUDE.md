# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal (non-commercial) web app for 4 friends (Joseba, Filip, Gahona, Ander) to plan activities for a trip to Japan (~May 2027). No login: anyone with the URL can read/write. `PLAN.md` is the source of truth for decisions, data model and phase roadmap (Phases 0–4 implemented; each phase has "Notas de implementación") — read it before larger changes and update its status/notes when finishing a phase.

The UI, code comments, commit-style notes and `PLAN.md` are all in **Spanish**; keep writing them in Spanish. Routes are Spanish too (`/`, `/archivo`, `/ajustes`).

## Commands

```bash
npm run dev                 # Vite dev server on :5173 (add `-- --host` to test from a phone on the same wifi)
npm run build               # production build to dist/
npm test                    # Vitest, single run (node environment, only src/**/*.test.js)
npx vitest run src/lib/ordering.test.js   # single test file
npx vitest run -t "nombre del test"       # single test by name
node scripts/make-washi.mjs                 # regenerate public/textures/washi-*.png (deterministic)
python scripts/subset-fonts.py <ShipporiMincho-SemiBold.ttf>  # re-subset the heading font after adding new kanji to the UI
python scripts/make-icons.py                # regenerate the PWA icons in public/icons/ (needs Pillow)
```

A local `npm run build` without the Supabase env vars produces a bundle where the whole app is dead-code-eliminated (only the "configure Supabase" screen remains), because `db` becomes a constant `null`. To inspect a real bundle locally, pass dummy values: `VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=x npm run build`. The service worker only registers in production builds (`npm run build && npm run preview`).

There is no linter configured. Tests only cover pure modules in `src/lib/` (no component tests).

Env vars (`.env.local` locally, Vercel in prod): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `CRON_SECRET`. Without the Supabase vars `App.jsx` renders a "configure Supabase" screen instead of the app.

## Architecture

**Stack:** React 19 + Vite 7 (plain JS/JSX), `react-router` v7, CSS Modules + CSS custom-property tokens (no Tailwind, no animation library), Supabase called directly from the browser, deployed on Vercel Hobby.

**Bundle-size–driven Supabase access** — the full `@supabase/supabase-js` SDK is intentionally *not* used:
- `src/lib/supabase.js` exports a bare `PostgrestClient` (`db`) for REST queries.
- `src/hooks/useRealtimePlans.js` lazy-`import()`s `@supabase/realtime-js` after first paint and subscribes to `postgres_changes` on `plans` and `settings`; on reconnect it calls `onResync` to reload everything.
- `src/api/covers.js` talks to the Storage REST API with raw `fetch` (no `storage-js`).
Don't add the full SDK or `motion`/similar libraries without a strong reason.

**Data flow:**
- `src/api/*.js` — thin async wrappers over `db`; they throw on error.
- `src/state/PlansProvider.jsx` — single context + `useReducer` that loads **all** plans (archived included; there are few) plus the shared EUR/JPY rate once, then merges Realtime events and reloads on `visibilitychange` (mobile drops the WebSocket in background). All mutations go through an `optimistic()` helper: apply locally, call the API, roll back + toast on failure. Components go through the provider for plan mutations; the exceptions are `PlanForm` (uploads/removes covers itself) and `PlanHistory` (fetches `plan_events` on demand).
- Search, filtering and sorting happen entirely client-side (`src/lib/search.js`, accent-insensitive via `normalize('NFD')`). Filters and sort are mirrored to URL query params (`src/lib/filterParams.js`, `src/hooks/useFilters.js`); the open plan is `?plan=<id>` (detail is a sheet on mobile, right panel on desktop ≥1024px).
- Identity ("¿Quién eres?") is a per-device choice in localStorage (`src/hooks/useIdentity.jsx`); `IdentityGate` in `App.jsx` blocks the app until chosen. It populates `created_by`/`updated_by`, default owner, "me apunto", "mis planes". All localStorage access goes through `src/lib/storage.js` (prefix `jtp.`, try/catch).

**Manual ordering:** a shared single list ordered by a `position` text column using fractional indexing (`src/lib/ordering.js`). `positionForMove` computes the new key relative to *visible* (filtered) neighbours while searching the full list, so hidden plans aren't displaced. Dragging (dnd-kit, `SortableList.jsx`) is only enabled in Manual sort mode.

**Database (`supabase/migrations/`, applied manually in the Supabase SQL editor in order):**
- `001_schema.sql` — `plans`, `settings` (single row with `eur_jpy`), CHECK constraints (lengths, enum values, valid people, `http(s)` URLs), RLS, `updated_at` trigger. RLS allows `delete` **only when `archived_at is not null`** — "delete" in the UI means archive; permanent delete is only from the Archive page.
- `002_covers.sql` — public `covers` Storage bucket (≤1 MB, webp/jpeg only).
- `003_collab.sql` — atomic RPCs `toggle_attendee` / `toggle_vote` (use these, never read-modify-write the arrays), `plan_events` history filled by trigger (rendered via `src/lib/events.js`), `heartbeat` table + `heartbeat()` function, Realtime publication.
- Enum-like values (people, cities, categories, statuses, limits) live in `src/lib/constants.js` and must stay in sync with the SQL CHECKs. Form parsing/validation is in `src/lib/planValues.js`.

**Covers:** images are compressed in the browser (`src/lib/imageCompress.js`) into two WebP/JPEG sizes (large ~1600px for detail, `-sm` ~800px for cards via `srcset`); path/URL helpers in `src/lib/covers.js`. Upload happens on save, not on pick; uploaded files are deleted if the save fails, and both files are removed when a cover is replaced/removed or a plan is permanently deleted.

**Offline / PWA (`vite-plugin-pwa`, config in `vite.config.js`):** the service worker precaches the app shell; data never goes through it. Plans live in a versioned localStorage snapshot (`src/lib/snapshot.js`) that `PlansProvider` boots from and rewrites after every change. `PlansProvider` exposes `offline` (browser offline **or** last load failed with a network error), and the app is then read-only: every write action in the provider bails out, and UI components receive `readOnly`/`disabled` props. When adding a new write action, guard it the same way. Updates use `registerType: 'prompt'` (toast "Actualizar" from `src/hooks/useServiceWorker.js`), never auto-reload.

**Map view (`?vista=mapa`):** only plans whose `location` is a Google Maps link are plotted. Coordinates come from the link itself (`src/lib/geo.js`, shared with the serverless function) or from `api/geocode.js` (expands short `maps.app.goo.gl` links, following redirects only to Google hosts, then falls back to Nominatim by place name). Results are cached per device in localStorage (`jtp.geo`) by `src/hooks/usePlanLocations.js`; there are no coordinate columns in the DB. `src/components/map/PlanMap.jsx` is lazy-loaded MapLibre GL 6 with the OpenFreeMap "liberty" style and labels switched to Latin script; its worker is bundled via `?worker&url` + `setWorkerUrl` (v6 resolves the worker path at runtime otherwise). Keep MapLibre ≥ 6.4.1 (XSS advisory GHSA-jrc7-96c5-q579). `api/geocode.js` uses plain Node `req`/`res` so the `devApi` plugin in `vite.config.js` can serve it under `npm run dev`.

**Keep-alive:** Supabase free tier pauses after 7 days idle. `api/keepalive.js` is a Vercel serverless function hit daily by the cron in `vercel.json`; it checks `Authorization: Bearer $CRON_SECRET` and calls the `heartbeat` RPC (a real write). `vercel.json` rewrites everything except `/api/*` to `index.html` (SPA).

**Styling / theme:** design tokens in `src/styles/tokens.css` ("Sumi & Washi nocturno", dark default, light optional, per-city colours). Theme preference (`dark`/`light`/`system`, key `jtp.theme`) is applied by an inline script in `index.html` before first paint — keep it in sync with `src/hooks/useTheme.jsx`. Animations are CSS-only (transform/opacity) and must respect `prefers-reduced-motion` (`src/styles/motion.css`). Performance matters on mid-range phones: cards are memoized and mounted once (filtering hides them), filters use `useDeferredValue`; avoid `:has()` selectors and `backdrop-filter` on scrolling elements.

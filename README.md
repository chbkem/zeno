<p align="center">
  <img src="public/logo.svg" width="72" height="63" alt="Zeno logo" />
</p>

<h1 align="center">Zeno</h1>

<p align="center">
  A budgeting app that helps Nigerian undergraduates make their allowance last till month end.
</p>

---

Zeno records your income and expenses in Naira, shows where the money actually went, keeps an eye
on your monthly budgets, and uses Google Gemini to suggest practical ways to cut unnecessary
spending. It installs to your home screen like a native app and still opens when you're offline.

## What it does

- **Track money** — add income and expenses with a category, note and date. Totals update live
  through Firestore listeners, no refresh needed.
- **See the month at a glance** — available balance, income vs. spending, and a donut chart of
  expenses by category on the home screen.
- **Stay inside your budgets** — set a monthly limit per category and watch progress bars turn
  amber at 80% and red at 100%.
- **Get AI advice** — Gemini reads the month's activity and returns a short summary, spending
  patterns, campus-specific tips (cooking vs. buying food, data bundles, transport) and a
  number-based target for next month.
- **First-run onboarding** — pick the categories you spend on most and set a starting budget.
- **Works like an app** — installable PWA, light/dark theme, mobile-first layout with bottom
  navigation.

## Tech stack

| Layer      | Choice                                                          |
| ---------- | --------------------------------------------------------------- |
| Framework  | [TanStack Start](https://tanstack.com/start) (React 19, Vite 8) |
| Styling    | Tailwind CSS v4 + shadcn/ui primitives                          |
| Auth + DB  | Firebase Auth and Cloud Firestore (client SDK)                  |
| AI         | Google Gemini 2.5 Flash, called from a server function          |
| Charts     | Recharts                                                        |
| Deployment | Nitro with the Cloudflare Workers preset                        |
| Tests      | Vitest + Testing Library                                        |

## Getting started

You need Node.js 20+ and npm.

```sh
git clone <this-repository-url>
cd zeno
npm install
```

Create a `.env.local` file in the project root:

```sh
# Firebase web config (publishable values from Firebase console → Project settings)
VITE_FIREBASE_API_KEY=your-firebase-web-api-key
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX   # optional, only for Analytics

# Gemini — server-side only, never exposed to the browser
GEMINI_API_KEY=your-gemini-api-key
```

Start the dev server on [http://localhost:8080](http://localhost:8080):

```sh
npm run dev
```

Get a Gemini key from [Google AI Studio](https://aistudio.google.com/apikey). Without one the app
still works; the AI panel just explains that the key isn't configured.

> Deploying elsewhere? The build also reads `GOOGLE_API_KEY` (used as the Firebase web API key by
> `vite.config.ts`) and `GOOGLE_ANALYTICS_MEASUREMENT_ID`, which is how the hosted environment
> injects those values.

## Firebase setup

The project expects a Firebase app with Google sign-in and email/password enabled, plus Firestore.
All user data lives under the signed-in user's document:

```
users/{uid}/transactions/{transactionId}   { type, amount, category, note, date }   // date = YYYY-MM-DD
users/{uid}/settings/budgets               { "Food & Snacks": 25000, ... }          // one field per category
users/{uid}/onboarding/status              { completed: true, answers: { categories, budget } }
```

Lock the tree down so each student can only read and write their own data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Firebase config is read in `src/lib/firebase.ts`. When `VITE_FIREBASE_API_KEY` is missing the app
shows the sign-in screen but can't authenticate, which is the usual sign that the env file isn't
loaded.

## Project structure

```
public/
  icons/                 generated PWA icons (192, 512, maskable, apple-touch)
  favicon.svg            logomark favicon (primary green)
  manifest.webmanifest   PWA manifest
  sw.js                  service worker (offline shell + asset cache)
  offline.html           fallback page when offline
scripts/
  generate-icons.mjs     renders the icons and favicons from the SVG paths
src/
  components/zeno/       app shell, auth screen
    dashboard/           home, stats, settings, transactions, AI insights
    onboarding/          welcome, categories and budget steps
  components/ui/         shadcn/ui primitives
  lib/
    ai.functions.ts      server function that talks to Gemini
    budget.ts            transaction types, categories, totals, budget status
    firebase.ts          Firebase client setup
    pwa.ts               service worker registration + install prompt hook
  routes/                file-based routes: /, /stats, /settings
  styles.css             Tailwind theme tokens (oklch colors, fonts, radii)
```

## Scripts

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server on port 8080              |
| `npm run build`   | Production build into `.output/` (Cloudflare)       |
| `npm run preview` | Preview the production build                        |
| `npm test`        | Run the Vitest suite                                |
| `npm run lint`    | Run ESLint (Prettier rules included)                |
| `npm run format`  | Format the repo with Prettier                       |
| `npm run icons`   | Regenerate favicons and PWA icons from the logomark |

## PWA and offline behavior

Zeno is installable from any modern browser. On Android/desktop Chrome and Edge, use the install
icon in the address bar or **Settings → Install Zeno** inside the app. On iPhone/iPad, open the site
in Safari, tap Share, then **Add to Home Screen**.

What makes it a PWA:

- `public/manifest.webmanifest` with a standalone display mode, install metadata, a maskable icon,
  and the primary green theme color.
- `public/sw.js`, registered from the root route in production builds only (`src/lib/pwa.ts`).
  - Page navigations are network-first, falling back to the cached page and then `offline.html`.
  - Hashed JS/CSS/font/image assets are cache-first with a background refresh.
  - Firebase, Gemini and TanStack server function calls are never cached.
- Icons are generated from the same vector logomark used for the favicon. Change the color or
  geometry in `scripts/generate-icons.mjs` and run `npm run icons`.

When you change the precache list in `public/sw.js`, bump `CACHE_VERSION` so existing installs pick
up the new shell.

## Deployment

The build uses Nitro's `cloudflare-module` preset, so the output is a Worker plus static assets:

```sh
npm run build
npx wrangler deploy
```

The build writes `.output/server/wrangler.json` and a pointer in `.wrangler/deploy/config.json`, so
`wrangler deploy` picks up the correct entry and static asset directory from the project root.

Set the production secret once with `npx wrangler secret put GEMINI_API_KEY`. If you deploy
somewhere else, change `defaultPreset` in `vite.config.ts` (or remove the Nitro plugin) and serve
`.output/` with your platform of choice. Static files from `public/` are copied into the build and
served from the site root, so the manifest, service worker and icons work with any host.

## Design notes

Colors, radii and fonts are defined as Tailwind v4 theme tokens in `src/styles.css`, all in `oklch`.
The primary color is Zeno green (`oklch(0.42 0.11 158)`, `#005e35`) with an amber accent. Use the
semantic tokens (`bg-primary`, `text-muted-foreground`, …) instead of raw hex values so light and
dark themes stay consistent.

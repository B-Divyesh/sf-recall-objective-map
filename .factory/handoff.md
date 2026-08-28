# Recall Objective Map — build handoff

## Shipped

- A production Vite + TypeScript offline PWA at the exact static output target `dist/`.
- Nested learning-objective map with editable context, one recall question, and an
  explicit evidence target for every objective.
- Keyboard-usable one-question review flow: answer from memory, reveal the learner's
  evidence guide, tag the attempt as Explain/Solve/Recognize and
  Thin/Building/Supported, then attach an optional note.
- Rolling seven-day weak-skill map that states the two weakest objectives in plain
  language, lists missing evidence modes, and avoids mastery claims.
- IndexedDB persistence with a visible localStorage fallback, JSON backup/import with
  replacement confirmation, and CSV weak-map export.
- Responsive 390px layout, loading/empty/error/offline/update states, native accessible
  dialogs, designed focus states, skip link, semantic landmarks, and reduced-motion mode.
- Install manifest, 192/512/maskable icons, and a hand-written versioned service worker
  whose build step precaches the complete generated app shell. Offline reload is covered
  by an automated Chromium test.
- Optional $9 one-time Field Kit through the Sociobot checkout/verify contract. A valid
  license enables print-ready reports and 14/30-day lenses. Unlimited objectives,
  reviews, the weekly map, accessibility, JSON, and CSV remain free. Returned and pasted
  licenses are supported; verification is cached for 24 hours and never blocks first
  paint or offline use.
- Privacy and terms pages, README, MIT license, robots/sitemap, and no analytics,
  third-party scripts, font downloads, or production runtime dependencies.
- Original halftone field-map artwork generated with the factory Azure image deployment,
  reviewed for artifacts/brands/text, and delivered as responsive AVIF/WebP with JPEG
  fallback. Source and prompt provenance live in `assets/src/` and `.factory/design.md`.

## Verification (2026-08-28 UTC)

- `npm test`: 4 unit tests passed; TypeScript strict check passed.
- `npm run test:e2e`: 3 Playwright Chromium tests passed. Coverage includes complete
  create → recall → evidence → persisted weak-map flow, 390px layout, keyboard dialog
  operation, zero captured console/page errors, axe serious/critical scan, and a genuine
  `context.setOffline(true)` reload from the service worker.
- `npm run build`: passed; `dist/index.html` exists at the deploy root. Service worker
  precached 18 files.
- `npm audit --omit=dev`: 0 production vulnerabilities.
- Lighthouse 13 mobile against the production preview:
  - Performance: **100**
  - Accessibility: **100**
  - Best practices: **100**
  - SEO: **100**
  - LCP: **1.2 s**; CLS: **0**; total blocking time: **0 ms**
- Production assets: initial JS 26.80 KB / 9.12 KB gzip, CSS 11.67 KB / 3.39 KB gzip;
  720px hero AVIF 17 KB, WebP 36 KB, largest JPEG fallback 160 KB. All are within the
  product budgets (JS 200 KB, CSS 50 KB, hero 300 KB).

## Run and deploy

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Deploy `dist/` as a static site with `index.html` at its root. Configure the host to fall
back to `index.html` for unknown application routes; `/privacy/` and `/terms/` are also
emitted as standalone static pages.

## Known gaps / factory follow-up

- The factory still needs to register the paid product for slug `recall-objective-map`
  and confirm the advertised $9 price/return URL in the Sociobot billing console. The
  integration targets the required production API and handles unavailable or invalid
  verification quietly, but no valid production purchase token was available to test.
- Records intentionally do not sync between devices. Transfer is explicit JSON
  export/import, matching the local-first brief.
- Evidence strength is self-reported per attempt. It is intentionally not a mastery
  estimate or an Anki/FSRS replacement.

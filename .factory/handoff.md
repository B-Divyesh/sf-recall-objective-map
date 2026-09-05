# Recall Objective Map — repair handoff

## Release status

The repaired static PWA is live at <https://recall-objective-map.sociobot.in>.
The deployed implementation is commit
`63ac99d0ca1e0c5d97fcd74a0ded5c1c8796a020`. This handoff is a later
documentation-only commit; use `git rev-parse HEAD` for its exact SHA. No product
redeployment is required for the documentation commit.

The app now completes the brief's job: a self-learner can map recall prompts to
nested learning objectives, record the kind and strength of evidence, and find the
two objectives with the thinnest recent evidence. It remains a manual record, not a
mastery score or card scheduler.

## What changed

- Added a one-click orbital-mechanics sample at `/demo`. Demo and real records use
  separate IndexedDB databases and separate localStorage fallbacks. The persistent
  demo banner can reset the sample or leave it without copying data.
- Added `.factory/claims.json` with 12 public claims. Each claim has one tagged
  Playwright test that checks the user-visible outcome from a clean sandbox.
- Added complete import validation for field types, required text, dates, IDs,
  references, evidence values, self-links, cycles, duplicates, and dataset limits.
  Invalid files leave the current map unchanged.
- Rejected whitespace-only objective, prompt, and evidence fields with announced
  inline errors.
- Rebuilt the site around real `/`, `/map`, `/demo`, `/privacy`, and `/terms` routes,
  route-specific titles, history navigation, focus transfer, shared navigation, and
  a designed HTTP 404 page.
- Rewrote the first screen in plain words. It states the job, audience, first action,
  local-storage fact, offline condition, and price before scrolling.
- Added complete social, canonical, icon, manifest, sitemap, robots, security-header,
  immutable-cache, touch-target, and service-worker configuration.
- Updated dependencies to remove the previous audit advisories. Initial production
  JS is 38.96 kB (12.31 kB gzip); CSS is 16.49 kB (4.36 kB gzip).
- Removed the unusable paid Field Kit and license paths. Every product feature is now
  free. The external Sociobot checkout remains unregistered and returns HTTP 404;
  factory billing registration is outside this repository and is a named dependency
  if a paid tier is introduced later. The site does not advertise or link a purchase.

## Review 1 finding disposition

| Finding | Current disposition |
| --- | --- |
| Required isolated demo absent | Fixed: one-click `/demo`, persistent label, reset, and real-data isolation tested. |
| Claims registry and tests absent | Fixed: all 12 public claims are registered and passed individually. |
| Advertised checkout returns 404 | User-facing defect removed: paid offer and dead checkout flow removed; external registration remains a future dependency. |
| Incomplete imports can crash | Fixed at the parser boundary and covered by malformed-file regression cases. |
| Whitespace-only values can be saved | Fixed with trim validation and live announced errors. |
| First screen lacks clear job, audience, and action | Fixed and audited in `.factory/copy-audit.md`. |
| Required landing-page information order absent | Fixed with first screen, live product preview, three steps, limits/privacy, and footer. |
| Missing `/demo`, `/map`, legal SPA routes, and designed 404 | Fixed and checked by direct navigation and reload. |
| Mobile footer targets are too small | Fixed; browser tests assert at least 44 px at 390 px. |
| Hashed assets are not immutable | Fixed; live response uses `public, max-age=31536000, immutable`. |
| CSP, permissions, and frame protections absent | Fixed in the deployed response headers and verified live. |

Earlier verification findings were rechecked rather than assumed resolved. Core
persistence, exports, offline reload, update handling, keyboard use, reduced motion,
privacy requests, links, legal pages, and the previous minor findings all pass.

## Verification

From a fresh checkout of the implementation commit:

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm audit
```

Results on 2026-09-05:

- Unit/type gates: 7 tests passed; strict TypeScript passed.
- Browser gates: 16 tests passed: 12 claim tests and 4 regression/accessibility
  tests. Axe found no serious or critical issues on landing, demo, privacy, terms,
  or 404 at desktop and 390 px widths.
- Claims: every command in `.factory/claims.json` was run separately from the clean
  checkout; 12 of 12 passed.
- Build: `dist/` generated; 21 app-shell entries precached; npm audit found 0
  vulnerabilities.
- Local Lighthouse mobile: 99 Performance / 100 Accessibility / 100 Best Practices /
  100 SEO; LCP 1.6 s, TBT 110 ms, CLS 0.
- Live Lighthouse mobile: 100 / 100 / 100 / 100; LCP 1.1 s, TBT 0 ms, CLS 0.
- The worker URL verifier passed the live URL with title, language, one H1, main,
  labels, alt text, and no console errors.
- Fresh desktop and phone contexts entered the sample, saw four populated objectives,
  changed and reset it, then returned to an unchanged empty real map.
- A dedicated browser context loaded the sample online, went offline, reloaded, and
  retained both the shell and sample records.
- The complete demo recall flow sent requests only to the product origin.
- Direct `/demo`, `/map`, `/privacy`, and `/terms` loads returned 200 with distinct
  titles and headings. An unknown path returned the expected designed HTTP 404.
- Live HTML, JS, and service worker hashes match the implementation build.

Evidence is under `/work/.evidence/recall-objective-map/`, with the summary at
`/work/.evidence/qa-report.md`. The final browser result is
`live/browser-check.json`; final Lighthouse and verifier results are in `live-final/`.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run dev
```

Use `/demo` for a clean sample. Run a single declared claim exactly as recorded, for
example:

```sh
npm run test:claims -- --grep '@claim:offline-reload'
```

For an already deployed candidate, run:

```sh
node scripts/live-check.mjs https://recall-objective-map.sociobot.in \
  /work/.evidence/recall-objective-map/live/browser-check.json
```

## Known dependency and next step

There is no product-code gap in the released free workflow. Monetization from the
research brief is deferred because the product's external Sociobot billing record is
not enabled. A future paid tier requires factory-side registration first, followed by
a real hosted-checkout and license lifecycle test. Do not restore purchase copy until
that dependency exists and passes end to end.

This is a static, browser-local product. Backend tenancy, SQLite restart persistence,
health probes, and HTTP 429 behavior are not applicable.

# Recall Objective Map — independent verification 1

## Verdict: FAIL

- Candidate: `36cc00e1de26e02e1ca549241196addb57144510`
- Live URL: <https://recall-objective-map.sociobot.in>
- Tested: 2026-08-28 06:23–06:43 UTC
- Contract: researched brief, repository `AGENTS.md`, and the injected PWA,
  accessibility, performance, design, and paid-unlock requirements
- Scope discipline: verification began with a clean checkout at the candidate. No
  product code was changed.

The free local-first product works end to end and the live files exactly match the
candidate, but the release is not acceptable. The advertised one-time purchase is a
dead path (production checkout returns 404), and malformed version-1 imports can be
accepted and then crash the central recall flow.

## Acceptance blockers and defects

### S2 — Major

1. **The advertised $9 Field Kit cannot be purchased.** The live UI links to
   `https://api.sociobot.in/api/v1/products/recall-objective-map/checkout`. A fresh GET
   at 2026-08-28 06:40 UTC returned HTTP 404 with
   `{"error":"enabled factory product","status":404}`. This is current production
   evidence, not a carried-forward builder report. The free experience remains usable,
   but the shipped monetization path and paid features cannot work end to end.

2. **Import validation accepts an incomplete version-1 objective and the next recall
   transition throws.** A JSON map containing `version: 1`, arrays, and an objective
   with only `id`, `title`, and `prompt` was accepted and persisted. Starting its recall
   check and choosing “Reveal evidence guide” produced the uncaught page error
   `Cannot read properties of undefined (reading 'replace')`, because
   `evidenceTarget` was not validated. The UI stayed on the stale question screen.
   Validation also does not fully validate check fields, parent references, dates, or
   duplicate identifiers. Invalid imports must be rejected before replacing local data.

### S3 — Moderate

3. **Whitespace-only required objective fields are accepted.** Three inputs containing
   only spaces/tab/newline passed native `required` validation. The app trimmed them
   after submission and saved a blank objective, blank recall question, and blank
   evidence target. The dialog closed and the map reported “1 mapped.” Empty-string
   validation and an announced recovery message are required before persistence.

4. **Hashed production assets do not receive immutable caching.** The live HTML,
   service worker, manifest, hashed JS/CSS, and imagery all return
   `cache-control: public, must-revalidate, max-age=30`. HTML/SW revalidation is
   reasonable, but hashed assets should have a long-lived immutable policy as required
   by the performance contract. The manifest and AVIF also return
   `application/octet-stream`; Chromium still parsed the manifest without errors.

### S4 — Minor

5. **The mobile footer links miss the 44 px touch-target baseline.** At 390 px,
   Privacy, Terms, and Source rendered about 21.1 px high. The main controls met the
   target and the page had no horizontal overflow.

6. **Browser response hardening is incomplete.** Production supplies HSTS,
   `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`,
   and DNS-prefetch control, but no Content-Security-Policy, Permissions-Policy, or
   framing restriction. This did not create an observed functional failure; it is a
   defense-in-depth gap for a page that links into a purchase flow.

There were no critical defects.

## Clean local verification

The checkout started clean on branch `main`; `HEAD`, `origin/main`, and the requested
candidate were all `36cc00e1de26e02e1ca549241196addb57144510`.

| Gate | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 60 packages installed from the lockfile. |
| `npm test` | PASS | 4/4 Vitest tests passed; strict `tsc --noEmit` passed. |
| Lint | N/A | No lint script or separate lint configuration exists. |
| `npm run build` | PASS | Vite 7.1.3 production build completed; `dist/` contains the app; SW precached 18 files. |
| `npm run test:e2e` | PASS | 3/3 Playwright Chromium tests passed: core flow/persistence, 390 px + axe, and offline reload. |
| `npm audit --omit=dev` | PASS | 0 production vulnerabilities. |
| Full `npm audit` | WARN | Dev-only Vite advisories (high) and Vitest advisory (critical); no production dependencies ship. |

Exact production output:

- JS: 26,803 bytes (9.12 KB gzip), below 200 KB.
- CSS: 11,674 bytes (3.39 KB gzip), below 50 KB.
- Mobile hero AVIF: 17,043 bytes; largest fallback JPEG: 163,314 bytes, both
  below the 300 KB image budget.
- `dist/index.html`, standalone `/privacy/` and `/terms/`, manifest, icons, offline
  fallback, and injected service worker were present.

## Independent product exercise

### Core job and data ownership

- Created “Explain orbital mechanics” with a 600-character context boundary, then
  nested “Solve circular orbit speed” beneath it.
- Confirmed a blank recall answer was blocked by form validation, recovered by entering
  an answer, attached Solve/Supported evidence and a note, and reloaded.
- The state survived reload in IndexedDB. The weak map ranked the unchecked parent
  Thin and the checked child Building, listed missing evidence modes, and showed one
  check in the seven-day window without claiming mastery.
- JSON export contained both objectives and the attached check. CSV export correctly
  included the hierarchy, bands, window count, missing modes, and timestamp.
- A clearly unsupported JSON format was rejected with an announced message and left
  the current map intact. Delete cancellation also preserved the objective.
- No content generation, chatbot, automatic grading, or Anki-style scheduling claims
  were present.

### Privacy and paid-license behavior

- Empty and normal core workflows made no request outside the application origin.
- No analytics, trackers, CDN fonts, third-party scripts, cookies, or sync calls were
  observed. Records remained in local IndexedDB; exports were local downloads.
- With `?license=qa-invalid-token`, the token was stored under the specified key, the
  query was removed from the URL, exactly one Sociobot verification request was made,
  the negative verdict was cached, “That license is no longer active” was shown, and
  the free map remained usable.
- Direct invalid verification returned HTTP 200 with
  `{"expires_at":null,"reason":"invalid","valid":false}` and `cache-control: no-store`.
- A valid purchase/license could not be tested because checkout itself returns 404.

### PWA and offline

- Chromium parsed the manifest with no manifest errors and found the expected name,
  standalone display, versioned start URL, colors, and 192/512/maskable icons. Its only
  installability diagnostic was `in-incognito`, an artifact of the isolated test
  context.
- The service worker installed and controlled the page. After an online load/reload,
  `context.setOffline(true)` reload restored the shell and the saved objective, while
  the visible offline state appeared.
- A temporary same-origin harness served the candidate build and changed only the
  bytes of its served service-worker response. `registration.update()` installed the
  update and the app visibly announced “An app update is ready. Reload when
  convenient.” No repository file was changed for this probe.

### Accessibility, responsive behavior, and visual QA

- Axe found 0 serious/critical findings in the empty map, populated map, objective
  dialog, privacy page, and terms page.
- The supplied `/opt/fleet/lib/verify-url.sh` passed live: title, `lang=en`, one `h1`,
  main landmark, all image alt attributes, labeled buttons, and zero console errors;
  network-idle load measured 603 ms in that smoke test.
- Keyboard Tab exposed the skip link at 44 px high with a 3 px blue focus outline;
  Enter moved focus to `<main>`. Native dialogs closed with Escape, and normal controls
  were keyboard-operable. There was no trap in the exercised flow.
- At 390×844, layout width equaled viewport width (390 px), body text was 16 px, and
  the intentional horizontal primary navigation remained scrollable. A 200% root-text
  probe introduced no horizontal overflow or lost footer content.
- Reduced-motion emulation reduced transition/animation duration to 0.01 ms. The
  product deliberately uses the documented single warm-paper theme.
- Desktop and 390 px screenshots were inspected. The field-guide/halftone direction,
  hierarchy, legibility, and original explanatory artwork matched `.factory/design.md`;
  no generic framework or gradient-hero treatment was present.

### Console, errors, performance, and policies

- Normal empty, populated, export, reload, mobile, and offline flows produced zero
  console errors and zero uncaught page errors. The malformed-import probe produced the
  exception documented above.
- Lighthouse 13.0.1 mobile against the live URL: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; FCP 0.8 s, LCP 0.9 s, total blocking time 70 ms,
  CLS 0, speed index 0.8 s.
- HTTPS returned 200. Unknown routes fell back to the app HTML. The host applies a
  short 30-second revalidation policy uniformly rather than immutable caching for
  content-hashed assets.

## Live deployment identity

Live production matches the locally built candidate byte for byte for the shell and
key runtime files:

| File | SHA-256 (local = live) |
| --- | --- |
| `index.html` | `f4c4a960b4bd9ac35d9c1ccdd322ee0df91a4f46f9efb097d199aec3812c316b` |
| `sw.js` | `3b125c09ce6bf73061c610c1d225377993d19c73ac72351bd54a8f4238647356` |
| `manifest.webmanifest` | `84e81ccd2724ee1b6bb93f6d7c40cdaed7d3f744a1e1aee67ba593406105238b` |
| `assets/index-DCJ0DxaI.js` | `a3369e4ef3b0a2625c750909a50642330e9007513c4ec9d5223e0c0fb096a8bb` |
| `assets/index-U84ttvod.css` | `550dd9ff07452371c32467e41688454990fb038413e92e0ddb1d8eabaee54f68` |
| `privacy/index.html` | `b2ccd76d96c708da92f778cf8abc5e0d0d7201696f66d202195ff49340a12b02` |
| `terms/index.html` | `34c90c99954274aa529d59fa960566dd22ac05a36e6ac4f4a003c73580a86f2e` |

The previous deployment-only concern is therefore resolved as an identity question:
the candidate is deployed. The remaining checkout failure is current external product
registration/configuration, not a stale deployment.

## Release decision and required retest

Do not accept this candidate. Register/enable the production billing product so the
checkout reaches hosted payment, harden import validation so incomplete or internally
inconsistent records are rejected before replacement, and reject whitespace-only
required fields. Then retest purchase/return/restore with a valid production license,
malformed imports, touch targets, immutable asset headers, and the complete regression
suite.
